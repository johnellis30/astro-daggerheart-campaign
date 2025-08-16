#!/usr/bin/env node
/**
 * Batch Image Updater for Characters
 * 
 * Usage: node scripts/batch-update-images.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CHARACTERS_DIR = path.join(__dirname, '..', 'src', 'content', 'blog', 'obsidian');
const IMAGES_DIR = path.join(__dirname, '..', 'public', 'images', 'characters');

function updateCharacterImage(filename, imagePath) {
    const filePath = path.join(CHARACTERS_DIR, filename);
    let content = fs.readFileSync(filePath, 'utf8');
    
    const heroImageLine = `heroImage: "${imagePath}"`;
    
    if (content.includes('heroImage:')) {
        // Update existing heroImage
        content = content.replace(/heroImage: .*$/m, heroImageLine);
    } else {
        // Add heroImage after description or pubDate
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
    console.log(`✅ Updated ${filename} with image: ${imagePath}`);
}

function main() {
    console.log('🎨 Batch Image Updater\n');
    
    if (!fs.existsSync(IMAGES_DIR)) {
        console.log('❌ Images directory does not exist:', IMAGES_DIR);
        return;
    }
    
    const imageFiles = fs.readdirSync(IMAGES_DIR)
        .filter(f => f.endsWith('.jpg') || f.endsWith('.png') || f.endsWith('.webp'));
    
    if (imageFiles.length === 0) {
        console.log('ℹ️  No image files found in:', IMAGES_DIR);
        return;
    }
    
    console.log(`📁 Found ${imageFiles.length} image(s):`);
    imageFiles.forEach(file => console.log(`   - ${file}`));
    console.log('');
    
    // Auto-match images to characters
    const characterFiles = fs.readdirSync(CHARACTERS_DIR)
        .filter(file => file.startsWith('NPC_') && file.endsWith('.md'));
    
    let matchCount = 0;
    
    characterFiles.forEach(charFile => {
        const filePath = path.join(CHARACTERS_DIR, charFile);
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Extract title
        const titleMatch = content.match(/title: ["']?(.*?)["']?$/m);
        if (!titleMatch) return;
        
        const title = titleMatch[1].toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-');
        
        // Find matching image
        const matchingImage = imageFiles.find(img => {
            const imgName = img.replace(/\.(jpg|png|webp)$/i, '');
            return imgName === title || imgName.includes(title) || title.includes(imgName);
        });
        
        if (matchingImage) {
            const imagePath = `/images/characters/${matchingImage}`;
            updateCharacterImage(charFile, imagePath);
            matchCount++;
        }
    });
    
    console.log(`\n🎯 Matched and updated ${matchCount} character(s)`);
    
    if (matchCount === 0) {
        console.log('\n💡 No automatic matches found. Manual matching suggestions:');
        console.log('Rename your image files to match character names:');
        
        characterFiles.forEach(charFile => {
            const filePath = path.join(CHARACTERS_DIR, charFile);
            const content = fs.readFileSync(filePath, 'utf8');
            const titleMatch = content.match(/title: ["']?(.*?)["']?$/m);
            if (titleMatch) {
                const suggestedName = titleMatch[1]
                    .toLowerCase()
                    .replace(/[^a-z0-9\s]/g, '')
                    .replace(/\s+/g, '-') + '.jpg';
                console.log(`   ${titleMatch[1]} → ${suggestedName}`);
            }
        });
    }
}

main();
