#!/usr/bin/env node
/**
 * Character Image Helper
 * 
 * This script helps you add and manage character images.
 * Usage: node scripts/add-character-image.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CHARACTERS_DIR = path.join(__dirname, '..', 'src', 'content', 'blog', 'obsidian');
const IMAGES_DIR = path.join(__dirname, '..', 'public', 'images', 'characters');

// Ensure images directory exists
if (!fs.existsSync(IMAGES_DIR)) {
    fs.mkdirSync(IMAGES_DIR, { recursive: true });
}

function getCharacterFiles() {
    const files = fs.readdirSync(CHARACTERS_DIR);
    return files.filter(file => 
        file.startsWith('NPC_') && 
        file.endsWith('.md')
    );
}

function parseCharacterFile(filename) {
    const filePath = path.join(CHARACTERS_DIR, filename);
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Extract frontmatter
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!frontmatterMatch) return null;
    
    const frontmatter = frontmatterMatch[1];
    const titleMatch = frontmatter.match(/title: ["']?(.*?)["']?$/m);
    const heroImageMatch = frontmatter.match(/heroImage: ["']?(.*?)["']?$/m);
    
    return {
        filename,
        title: titleMatch ? titleMatch[1] : filename.replace('.md', ''),
        heroImage: heroImageMatch ? heroImageMatch[1] : null,
        hasCustomImage: heroImageMatch && !heroImageMatch[1].includes('placeholder')
    };
}

function generateImageFilename(title) {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '-') + '.jpg';
}

function updateCharacterImage(filename, imagePath) {
    const filePath = path.join(CHARACTERS_DIR, filename);
    let content = fs.readFileSync(filePath, 'utf8');
    
    const heroImageLine = `heroImage: "${imagePath}"`;
    
    if (content.includes('heroImage:')) {
        // Update existing heroImage
        content = content.replace(/heroImage: .*$/m, heroImageLine);
    } else {
        // Add heroImage after description or title
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

function main() {
    console.log('🎨 Character Image Helper\n');
    
    const characterFiles = getCharacterFiles();
    const characters = characterFiles
        .map(parseCharacterFile)
        .filter(Boolean)
        .sort((a, b) => a.title.localeCompare(b.title));
    
    console.log('📋 Character Status:');
    console.log('==================');
    
    characters.forEach(char => {
        const status = char.hasCustomImage ? '✅' : '❌';
        const imageInfo = char.heroImage || 'No image set';
        console.log(`${status} ${char.title}`);
        console.log(`   Image: ${imageInfo}`);
        console.log('');
    });
    
    console.log('\n🖼️  Image Management:');
    console.log('====================');
    console.log('1. Add your image files to: public/images/characters/');
    console.log('2. Recommended naming convention:');
    
    characters.forEach(char => {
        if (!char.hasCustomImage) {
            const suggestedFilename = generateImageFilename(char.title);
            console.log(`   ${char.title} → ${suggestedFilename}`);
        }
    });
    
    console.log('\n3. Run this script again to see updated status');
    console.log('4. Or use: node scripts/manage-images.js for batch operations');
    
    // Check for orphaned images
    const imageFiles = fs.existsSync(IMAGES_DIR) ? 
        fs.readdirSync(IMAGES_DIR).filter(f => f.endsWith('.jpg') || f.endsWith('.png')) : [];
    
    if (imageFiles.length > 0) {
        console.log('\n📁 Available Image Files:');
        imageFiles.forEach(file => {
            const used = characters.some(char => 
                char.heroImage && char.heroImage.includes(file)
            );
            console.log(`   ${used ? '✅' : '⚠️ '} ${file}`);
        });
    }
    
    console.log('\n💡 Tips:');
    console.log('- Images should be 800x600px or similar ratio');
    console.log('- Use JPG for photos, PNG for illustrations');
    console.log('- Keep file sizes under 500KB for better performance');
}

main();
