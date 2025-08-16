#!/usr/bin/env node
/**
 * Content Reorganization Script
 * 
 * Moves content from blog/obsidian/ to proper content collections:
 * - NPC_* → characters/
 * - LOCATION_* → locations/
 * - ACT*_* → adventures/
 * - ADVERSARY_* → monsters/
 * - ITEM_*, LOOT_*, DOCUMENT_* → items/
 * - CAMPAIGN_*, Campaign Primer.md → campaign/
 * - ENVIRONMENT_* → environments/
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OLD_DIR = path.join(__dirname, '..', 'src', 'content', 'blog', 'obsidian');
const NEW_BASE = path.join(__dirname, '..', 'src', 'content');

const CONTENT_MAPPINGS = {
    'NPC_': 'characters',
    'LOCATION_': 'locations', 
    'ACT': 'adventures',
    'ADVERSARY_': 'monsters',
    'ITEM_': 'items',
    'LOOT_': 'items',
    'DOCUMENT_': 'items',
    'CAMPAIGN_': 'campaign',
    'ENVIRONMENT_': 'environments'
};

// Special cases
const SPECIAL_MAPPINGS = {
    'Campaign Primer.md': 'campaign',
    'The Atherian Empire.md': 'campaign',
    'THE_WINNOW.md': 'campaign',
    'OVERALL_YOLEN.md': 'locations'
};

function determineContentType(filename) {
    // Check special cases first
    if (SPECIAL_MAPPINGS[filename]) {
        return SPECIAL_MAPPINGS[filename];
    }
    
    // Check prefix mappings
    for (const [prefix, contentType] of Object.entries(CONTENT_MAPPINGS)) {
        if (filename.startsWith(prefix)) {
            return contentType;
        }
    }
    
    // Default to campaign for anything else
    return 'campaign';
}

function generateNewFilename(oldFilename, contentType) {
    // Remove prefixes and clean up names
    let newName = oldFilename.replace('.md', '');
    
    // Remove common prefixes
    newName = newName.replace(/^(NPC_|LOCATION_|ADVERSARY_|ITEM_|LOOT_|DOCUMENT_|CAMPAIGN_|ENVIRONMENT_|ACT\d+_)/, '');
    
    // Convert to kebab-case
    newName = newName
        .toLowerCase()
        .replace(/_/g, '-')
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
    
    return `${newName}.md`;
}

function updateContentReferences(content, oldFilename, newPath) {
    // Update any internal references that might exist
    // This is a placeholder for more complex reference updating if needed
    return content;
}

function reorganizeContent() {
    console.log('🔄 Starting content reorganization...\n');
    
    if (!fs.existsSync(OLD_DIR)) {
        console.log('❌ Obsidian directory not found:', OLD_DIR);
        return;
    }
    
    const files = fs.readdirSync(OLD_DIR).filter(f => f.endsWith('.md'));
    
    console.log(`📁 Found ${files.length} files to reorganize\n`);
    
    const moves = [];
    
    // Plan all moves first
    files.forEach(filename => {
        const contentType = determineContentType(filename);
        const newFilename = generateNewFilename(filename, contentType);
        const oldPath = path.join(OLD_DIR, filename);
        const newPath = path.join(NEW_BASE, contentType, newFilename);
        
        moves.push({
            oldPath,
            newPath,
            oldFilename: filename,
            newFilename,
            contentType
        });
    });
    
    // Group by content type for reporting
    const byType = {};
    moves.forEach(move => {
        if (!byType[move.contentType]) byType[move.contentType] = [];
        byType[move.contentType].push(move);
    });
    
    console.log('📋 Reorganization Plan:');
    console.log('='.repeat(50));
    
    Object.entries(byType).forEach(([type, movesForType]) => {
        console.log(`\n📂 ${type}/ (${movesForType.length} files):`);
        movesForType.forEach(move => {
            console.log(`   ${move.oldFilename} → ${move.newFilename}`);
        });
    });
    
    console.log('\n🚀 Executing moves...\n');
    
    // Execute moves
    moves.forEach(move => {
        try {
            // Read and potentially update content
            let content = fs.readFileSync(move.oldPath, 'utf8');
            content = updateContentReferences(content, move.oldFilename, move.newPath);
            
            // Write to new location
            fs.writeFileSync(move.newPath, content);
            
            console.log(`✅ Moved: ${move.oldFilename} → ${move.contentType}/${move.newFilename}`);
        } catch (error) {
            console.log(`❌ Failed to move ${move.oldFilename}:`, error.message);
        }
    });
    
    console.log('\n📊 Summary:');
    Object.entries(byType).forEach(([type, movesForType]) => {
        console.log(`   ${type}: ${movesForType.length} files`);
    });
    
    console.log('\n⚠️  Next steps:');
    console.log('1. Update content.config.ts to define new collections');
    console.log('2. Update page components to use new collections');
    console.log('3. Update image management scripts');
    console.log('4. Remove old blog/obsidian directory');
    console.log('5. Test all pages and functionality');
}

reorganizeContent();
