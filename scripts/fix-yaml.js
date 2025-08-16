#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONTENT_DIR = path.join(__dirname, '..', 'src', 'content', 'blog', 'obsidian');

console.log('🔧 Fixing YAML frontmatter issues...');

function fixYamlFrontmatter(filePath) {
    let content = fs.readFileSync(filePath, 'utf-8');
    
    // Check if file has frontmatter
    if (!content.startsWith('---')) return false;
    
    const frontmatterEnd = content.indexOf('---', 3);
    if (frontmatterEnd === -1) return false;
    
    let frontmatter = content.substring(0, frontmatterEnd + 3);
    const bodyContent = content.substring(frontmatterEnd + 3);
    
    let changed = false;
    
    // Fix multiline descriptions by extracting the first meaningful line
    const descriptionMatch = frontmatter.match(/description: "([^"]*(?:\n[^"]*)*?)"/);
    if (descriptionMatch) {
        let description = descriptionMatch[1];
        
        // Remove "Description:" prefix if present
        description = description.replace(/^Description:\s*/, '');
        description = description.replace(/^\*[^*]+\*\s*/, ''); // Remove italic text at start
        
        // Take only the first meaningful line and clean it
        description = description.split('\n')[0].trim();
        
        // Remove any remaining asterisks or formatting
        description = description.replace(/\*/g, '');
        
        // Escape any remaining quotes
        description = description.replace(/"/g, '\\"');
        
        // Truncate if too long
        if (description.length > 160) {
            description = description.substring(0, 157) + '...';
        }
        
        // Replace the description in frontmatter
        frontmatter = frontmatter.replace(
            /description: "[^"]*(?:\n[^"]*)*?"/,
            `description: "${description}"`
        );
        
        changed = true;
    }
    
    // Fix any remaining multiline issues by removing extra newlines in frontmatter
    const lines = frontmatter.split('\n');
    const cleanedLines = [];
    let inFrontmatter = false;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        if (line === '---') {
            inFrontmatter = !inFrontmatter;
            cleanedLines.push(line);
        } else if (inFrontmatter) {
            // Only add non-empty lines or lines that are part of a property
            if (line.trim() || line.includes(':')) {
                cleanedLines.push(line);
            }
        } else {
            cleanedLines.push(line);
        }
    }
    
    if (cleanedLines.join('\n') !== frontmatter) {
        frontmatter = cleanedLines.join('\n');
        changed = true;
    }
    
    if (changed) {
        const newContent = frontmatter + bodyContent;
        fs.writeFileSync(filePath, newContent, 'utf-8');
        return true;
    }
    
    return false;
}

try {
    const files = fs.readdirSync(CONTENT_DIR).filter(file => file.endsWith('.md'));
    let fixedCount = 0;
    let totalCount = 0;
    
    for (const file of files) {
        const filePath = path.join(CONTENT_DIR, file);
        totalCount++;
        
        try {
            if (fixYamlFrontmatter(filePath)) {
                console.log(`✅ Fixed: ${file}`);
                fixedCount++;
            }
        } catch (error) {
            console.log(`❌ Error fixing ${file}: ${error.message}`);
        }
    }
    
    console.log(`\n📊 YAML Fix Complete:`);
    console.log(`   ✅ Fixed: ${fixedCount}`);
    console.log(`   📁 Total: ${totalCount}`);
    console.log('🎉 YAML frontmatter issues resolved!');
    
} catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
}
