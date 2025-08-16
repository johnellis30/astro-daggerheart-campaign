#!/usr/bin/env node
/**
 * Universal Content Image Manager
 * 
 * Manages images for all content types: characters, locations, adventures, monsters, items, campaign, environments
 * Usage: node scripts/universal-image-manager.js [content-type] [action]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONTENT_DIR = path.join(__dirname, '..', 'src', 'content');
const IMAGES_BASE = path.join(__dirname, '..', 'public', 'images');

// Content type mappings
const CONTENT_TYPES = {
    characters: {
        dir: 'characters',
        imageDir: 'characters',
        description: 'Characters and NPCs'
    },
    locations: {
        dir: 'locations',
        imageDir: 'locations', 
        description: 'Locations and places'
    },
    adventures: {
        dir: 'adventures',
        imageDir: 'adventures',
        description: 'Adventures and story arcs'
    },
    monsters: {
        dir: 'monsters',
        imageDir: 'monsters',
        description: 'Monsters and adversaries'
    },
    items: {
        dir: 'items',
        imageDir: 'items',
        description: 'Items and equipment'
    },
    campaign: {
        dir: 'campaign',
        imageDir: 'campaign',
        description: 'Campaign overviews and primers'
    },
    environments: {
        dir: 'environments',
        imageDir: 'environments',
        description: 'Environmental features and terrain'
    }
};

function getContentFiles(contentType) {
    const config = CONTENT_TYPES[contentType];
    if (!config) return [];
    
    const contentDir = path.join(CONTENT_DIR, config.dir);
    if (!fs.existsSync(contentDir)) return [];
    
    const files = fs.readdirSync(contentDir);
    return files.filter(file => file.endsWith('.md'));
}

function parseContentFile(filename, contentType) {
    const config = CONTENT_TYPES[contentType];
    const filePath = path.join(CONTENT_DIR, config.dir, filename);
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Extract frontmatter
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!frontmatterMatch) return null;
    
    const frontmatter = frontmatterMatch[1];
    const titleMatch = frontmatter.match(/title: ["']?(.*?)["']?$/m);
    const heroImageMatch = frontmatter.match(/heroImage: ["']?(.*?)["']?$/m);
    const tagsMatch = frontmatter.match(/tags: \[(.*?)\]/);
    
    return {
        filename,
        title: titleMatch ? titleMatch[1] : filename.replace('.md', ''),
        heroImage: heroImageMatch ? heroImageMatch[1] : null,
        tags: tagsMatch ? tagsMatch[1].split(',').map(t => t.trim().replace(/"/g, '')) : [],
        hasCustomImage: heroImageMatch && !heroImageMatch[1].includes('placeholder')
    };
}

function generateImageFilename(title) {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '-') + '.jpg';
}

function updateContentImage(filename, imagePath, contentType) {
    const config = CONTENT_TYPES[contentType];
    const filePath = path.join(CONTENT_DIR, config.dir, filename);
    let content = fs.readFileSync(filePath, 'utf8');
    
    const heroImageLine = `heroImage: "${imagePath}"`;
    
    if (content.includes('heroImage:')) {
        // Update existing heroImage
        content = content.replace(/heroImage: .*$/m, heroImageLine);
    } else {
        // Add heroImage after pubDate or description
        const lines = content.split('\n');
        const frontmatterEnd = lines.findIndex((line, index) => 
            index > 0 && line === '---'
        );
        
        if (frontmatterEnd > 0) {
            lines.splice(frontmatterEnd, 0, heroImageLine);
            content = lines.join('\n');
        }
    }
    
    fs.writeFileSync(filePath, content);
}

function analyzeContentType(contentType) {
    const config = CONTENT_TYPES[contentType];
    if (!config) {
        console.log(`❌ Unknown content type: ${contentType}`);
        return;
    }
    
    const imageDir = path.join(IMAGES_BASE, config.imageDir);
    const contentFiles = getContentFiles(contentType);
    
    if (contentFiles.length === 0) {
        console.log(`ℹ️  No ${contentType} files found with prefix ${config.prefix}`);
        return;
    }
    
    const parsedContent = contentFiles
        .map(filename => parseContentFile(filename, contentType))
        .filter(Boolean)
        .sort((a, b) => a.title.localeCompare(b.title));
    
    console.log(`\n📋 ${config.description} (${parsedContent.length}):`);
    console.log('='.repeat(50));
    
    parsedContent.forEach(item => {
        const status = item.hasCustomImage ? '✅' : '❌';
        const imageInfo = item.heroImage || 'No image set';
        console.log(`${status} ${item.title}`);
        console.log(`   Image: ${imageInfo}`);
        if (item.tags.length > 0) {
            console.log(`   Tags: ${item.tags.join(', ')}`);
        }
        console.log('');
    });
    
    // Check for available image files
    if (fs.existsSync(imageDir)) {
        const imageFiles = fs.readdirSync(imageDir)
            .filter(f => f.endsWith('.jpg') || f.endsWith('.png') || f.endsWith('.webp'));
        
        if (imageFiles.length > 0) {
            console.log(`📁 Available ${contentType} images:`);
            imageFiles.forEach(file => {
                const used = parsedContent.some(item => 
                    item.heroImage && item.heroImage.includes(file)
                );
                console.log(`   ${used ? '✅' : '⚠️ '} ${file}`);
            });
            console.log('');
        }
    }
    
    // Suggest image names for items without custom images
    const needImages = parsedContent.filter(item => !item.hasCustomImage);
    if (needImages.length > 0) {
        console.log(`🖼️  Suggested image filenames:`);
        needImages.forEach(item => {
            const suggestedName = generateImageFilename(item.title);
            console.log(`   ${item.title} → ${suggestedName}`);
        });
        console.log('');
    }
    
    return {
        total: parsedContent.length,
        withImages: parsedContent.filter(item => item.hasCustomImage).length,
        needImages: needImages.length,
        availableImages: fs.existsSync(imageDir) ? 
            fs.readdirSync(imageDir).filter(f => f.match(/\.(jpg|png|webp)$/i)).length : 0
    };
}

function batchUpdateImages(contentType) {
    const config = CONTENT_TYPES[contentType];
    if (!config) {
        console.log(`❌ Unknown content type: ${contentType}`);
        return;
    }
    
    const imageDir = path.join(IMAGES_BASE, config.imageDir);
    if (!fs.existsSync(imageDir)) {
        console.log(`❌ Images directory does not exist: ${imageDir}`);
        return;
    }
    
    const imageFiles = fs.readdirSync(imageDir)
        .filter(f => f.endsWith('.jpg') || f.endsWith('.png') || f.endsWith('.webp'));
    
    if (imageFiles.length === 0) {
        console.log(`ℹ️  No image files found in: ${imageDir}`);
        return;
    }
    
    const contentFiles = getContentFiles(contentType);
    let matchCount = 0;
    
    contentFiles.forEach(filename => {
        const parsed = parseContentFile(filename, contentType);
        if (!parsed) return;
        
        const titleSlug = generateImageFilename(parsed.title).replace('.jpg', '');
        
        const matchingImage = imageFiles.find(img => {
            const imgSlug = img.replace(/\.(jpg|png|webp)$/i, '');
            return imgSlug === titleSlug || 
                   imgSlug.includes(titleSlug) || 
                   titleSlug.includes(imgSlug);
        });
        
        if (matchingImage) {
            const imagePath = `/images/${config.imageDir}/${matchingImage}`;
            updateContentImage(filename, imagePath, contentType);
            console.log(`✅ Updated ${parsed.title} with image: ${imagePath}`);
            matchCount++;
        }
    });
    
    console.log(`\n🎯 Matched and updated ${matchCount} ${contentType} item(s)`);
}

function showOverview() {
    console.log('🎨 Universal Content Image Manager\n');
    console.log('📊 Content Overview:');
    console.log('='.repeat(50));
    
    let totalItems = 0;
    let totalWithImages = 0;
    let totalAvailableImages = 0;
    
    Object.keys(CONTENT_TYPES).forEach(contentType => {
        const stats = analyzeContentType(contentType);
        if (stats) {
            totalItems += stats.total;
            totalWithImages += stats.withImages;
            totalAvailableImages += stats.availableImages;
        }
    });
    
    console.log(`\n📈 Summary:`);
    console.log(`   Total content items: ${totalItems}`);
    console.log(`   Items with custom images: ${totalWithImages}`);
    console.log(`   Items needing images: ${totalItems - totalWithImages}`);
    console.log(`   Available image files: ${totalAvailableImages}`);
    
    const imageDirectories = Object.values(CONTENT_TYPES).map(c => c.imageDir);
    const uniqueDirs = [...new Set(imageDirectories)];
    
    console.log(`\n📁 Image Directories:`);
    uniqueDirs.forEach(dir => {
        const dirPath = path.join(IMAGES_BASE, dir);
        const exists = fs.existsSync(dirPath);
        const count = exists ? fs.readdirSync(dirPath).filter(f => f.match(/\.(jpg|png|webp)$/i)).length : 0;
        console.log(`   ${exists ? '✅' : '❌'} /images/${dir}/ (${count} files)`);
    });
}

function main() {
    const [,, contentType, action] = process.argv;
    
    if (!contentType) {
        showOverview();
        console.log(`\n💡 Usage:`);
        console.log(`   node scripts/universal-image-manager.js [type] [action]`);
        console.log(`   Types: ${Object.keys(CONTENT_TYPES).join(', ')}`);
        console.log(`   Actions: status, update`);
        console.log(`\n   Examples:`);
        console.log(`   node scripts/universal-image-manager.js characters status`);
        console.log(`   node scripts/universal-image-manager.js locations update`);
        return;
    }
    
    if (!CONTENT_TYPES[contentType]) {
        console.log(`❌ Unknown content type: ${contentType}`);
        console.log(`Available types: ${Object.keys(CONTENT_TYPES).join(', ')}`);
        return;
    }
    
    switch (action) {
        case 'update':
            batchUpdateImages(contentType);
            break;
        case 'status':
        default:
            analyzeContentType(contentType);
            break;
    }
}

main();
