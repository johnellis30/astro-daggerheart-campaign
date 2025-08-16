#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONTENT_DIR = path.join(__dirname, '..', 'src', 'content', 'blog', 'obsidian');

console.log('🎯 Campaign Content Publishing System');
console.log('=====================================\n');

class ContentPublisher {
  constructor() {
    this.gmOnlyPatterns = [
      /\*\*GM Note:\*\*/i,
      /\*\*DM Note:\*\*/i,
      /\*\*Spoiler:\*\*/i,
      /\*\*Secret:\*\*/i,
      /\[GM\]/i,
      /\[DM\]/i,
      /\[SPOILER\]/i
    ];
    
    this.playerSafeCategories = [
      'character', 'npc', 'location', 'item', 'loot'
    ];
    
    this.gmOnlyCategories = [
      'adventure', 'quest'
    ];
  }

  // Parse markdown frontmatter and content
  parseMarkdown(content) {
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
    
    if (!frontmatterMatch) {
      return {
        frontmatter: {},
        frontmatterText: '',
        body: content
      };
    }

    const frontmatterText = frontmatterMatch[1];
    const body = frontmatterMatch[2];
    
    // Parse frontmatter
    const frontmatter = {};
    frontmatterText.split('\n').forEach(line => {
      const match = line.match(/^(\w+):\s*(.+)$/);
      if (match) {
        const [, key, value] = match;
        try {
          // Try to parse JSON arrays/objects
          frontmatter[key] = JSON.parse(value);
        } catch {
          // Fall back to string, removing quotes
          frontmatter[key] = value.replace(/^["']|["']$/g, '');
        }
      }
    });

    return { frontmatter, frontmatterText, body };
  }

  // Check if content contains GM-only information
  containsGMContent(body) {
    return this.gmOnlyPatterns.some(pattern => pattern.test(body));
  }

  // Create player-safe version of content
  createPlayerVersion(body) {
    let playerBody = body;
    
    // Remove GM notes and spoiler sections
    playerBody = playerBody.replace(/\*\*GM Note:\*\*[\s\S]*?(?=\n\n|\n\*\*|$)/gi, '');
    playerBody = playerBody.replace(/\*\*DM Note:\*\*[\s\S]*?(?=\n\n|\n\*\*|$)/gi, '');
    playerBody = playerBody.replace(/\*\*Spoiler:\*\*[\s\S]*?(?=\n\n|\n\*\*|$)/gi, '');
    playerBody = playerBody.replace(/\*\*Secret:\*\*[\s\S]*?(?=\n\n|\n\*\*|$)/gi, '');
    
    // Remove lines marked with GM/DM/SPOILER tags
    playerBody = playerBody.replace(/.*\[GM\].*\n?/gi, '');
    playerBody = playerBody.replace(/.*\[DM\].*\n?/gi, '');
    playerBody = playerBody.replace(/.*\[SPOILER\].*\n?/gi, '');
    
    // Clean up extra whitespace
    playerBody = playerBody.replace(/\n{3,}/g, '\n\n');
    playerBody = playerBody.trim();
    
    return playerBody;
  }

  // Analyze and update a single file
  analyzeFile(filename) {
    const filePath = path.join(CONTENT_DIR, filename);
    
    if (!fs.existsSync(filePath)) {
      return { error: `File not found: ${filename}` };
    }
    
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const { frontmatter, frontmatterText, body } = this.parseMarkdown(content);
      
      // Determine content category
      const tags = frontmatter.tags || [];
      const isPlayerSafe = this.playerSafeCategories.some(cat => tags.includes(cat));
      const isGMOnly = this.gmOnlyCategories.some(cat => tags.includes(cat));
      const containsGMContent = this.containsGMContent(body);
      
      // Determine publishing recommendation
      let recommendation = 'review';
      let playerVisible = null;
      let gmOnly = false;
      
      if (isGMOnly || containsGMContent) {
        recommendation = 'gm-only';
        playerVisible = false;
        gmOnly = true;
      } else if (isPlayerSafe && !containsGMContent) {
        recommendation = 'player-safe';
        playerVisible = true;
      }
      
      // Check current frontmatter settings
      const currentPlayerVisible = frontmatter.playerVisible;
      const currentGMOnly = frontmatter.gmOnly;
      
      return {
        filename,
        category: tags.join(', '),
        recommendation,
        currentPlayerVisible,
        currentGMOnly,
        needsUpdate: currentPlayerVisible !== playerVisible || currentGMOnly !== gmOnly,
        suggestedPlayerVisible: playerVisible,
        suggestedGMOnly: gmOnly,
        containsGMContent,
        frontmatter,
        body
      };
      
    } catch (error) {
      return { error: `Error analyzing ${filename}: ${error.message}` };
    }
  }

  // Update file with publishing metadata
  updateFile(filename, playerVisible = null, gmOnly = false, createPlayerVersion = false) {
    const filePath = path.join(CONTENT_DIR, filename);
    
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const { frontmatter, frontmatterText, body } = this.parseMarkdown(content);
      
      // Update frontmatter
      const updatedFrontmatter = { ...frontmatter };
      if (playerVisible !== null) updatedFrontmatter.playerVisible = playerVisible;
      if (gmOnly) updatedFrontmatter.gmOnly = gmOnly;
      
      // Build new frontmatter text
      const newFrontmatterLines = [];
      Object.entries(updatedFrontmatter).forEach(([key, value]) => {
        if (typeof value === 'object') {
          newFrontmatterLines.push(`${key}: ${JSON.stringify(value)}`);
        } else if (typeof value === 'string') {
          newFrontmatterLines.push(`${key}: "${value}"`);
        } else {
          newFrontmatterLines.push(`${key}: ${value}`);
        }
      });
      
      const newFrontmatterText = newFrontmatterLines.join('\n');
      let newBody = body;
      
      // Create player version if requested
      if (createPlayerVersion && !playerVisible) {
        newBody = this.createPlayerVersion(body);
        updatedFrontmatter.playerVisible = true;
        updatedFrontmatter.gmOnly = false;
        
        // Update frontmatter text again
        const playerFrontmatterLines = [];
        Object.entries(updatedFrontmatter).forEach(([key, value]) => {
          if (typeof value === 'object') {
            playerFrontmatterLines.push(`${key}: ${JSON.stringify(value)}`);
          } else if (typeof value === 'string') {
            playerFrontmatterLines.push(`${key}: "${value}"`);
          } else {
            playerFrontmatterLines.push(`${key}: ${value}`);
          }
        });
        newFrontmatterText = playerFrontmatterLines.join('\n');
      }
      
      const newContent = `---\n${newFrontmatterText}\n---\n\n${newBody}`;
      
      fs.writeFileSync(filePath, newContent, 'utf8');
      
      return { success: true, updated: true };
      
    } catch (error) {
      return { error: `Error updating ${filename}: ${error.message}` };
    }
  }

  // Analyze all content files
  analyzeAll() {
    console.log('📋 Analyzing content files...\n');
    
    if (!fs.existsSync(CONTENT_DIR)) {
      console.error('❌ Content directory not found!');
      return;
    }
    
    const files = fs.readdirSync(CONTENT_DIR).filter(f => f.endsWith('.md'));
    const results = {
      playerSafe: [],
      gmOnly: [],
      needsReview: [],
      errors: []
    };
    
    files.forEach(filename => {
      const result = this.analyzeFile(filename);
      
      if (result.error) {
        results.errors.push(result);
        console.log(`❌ ${filename}: ${result.error}`);
      } else {
        switch (result.recommendation) {
          case 'player-safe':
            results.playerSafe.push(result);
            console.log(`✅ ${filename}: Player Safe (${result.category})`);
            break;
          case 'gm-only':
            results.gmOnly.push(result);
            console.log(`🔒 ${filename}: GM Only (${result.category})`);
            break;
          default:
            results.needsReview.push(result);
            console.log(`⚠️  ${filename}: Needs Review (${result.category})`);
        }
      }
    });
    
    // Print summary
    console.log('\n📊 Analysis Summary:');
    console.log(`   ✅ Player Safe: ${results.playerSafe.length} files`);
    console.log(`   🔒 GM Only: ${results.gmOnly.length} files`);
    console.log(`   ⚠️  Needs Review: ${results.needsReview.length} files`);
    console.log(`   ❌ Errors: ${results.errors.length} files`);
    
    console.log('\n💡 Next Steps:');
    console.log('   - Run with --update to apply recommended settings');
    console.log('   - Run with --review to see detailed recommendations');
    console.log('   - Use --create-player-versions for GM content');
    
    return results;
  }

  // Apply recommended settings
  updateAll(dryRun = false) {
    console.log(`${dryRun ? '🔍 Dry Run: ' : '✏️  Updating: '}Applying publishing settings...\n`);
    
    const files = fs.readdirSync(CONTENT_DIR).filter(f => f.endsWith('.md'));
    let updated = 0;
    
    files.forEach(filename => {
      const analysis = this.analyzeFile(filename);
      
      if (!analysis.error && analysis.needsUpdate) {
        if (!dryRun) {
          const result = this.updateFile(
            filename, 
            analysis.suggestedPlayerVisible, 
            analysis.suggestedGMOnly
          );
          
          if (result.success) {
            console.log(`✅ Updated: ${filename}`);
            updated++;
          } else {
            console.log(`❌ Failed: ${filename} - ${result.error}`);
          }
        } else {
          console.log(`📝 Would update: ${filename} (playerVisible: ${analysis.suggestedPlayerVisible}, gmOnly: ${analysis.suggestedGMOnly})`);
          updated++;
        }
      }
    });
    
    console.log(`\n${dryRun ? '📊' : '🎉'} ${dryRun ? 'Would update' : 'Updated'}: ${updated} files`);
    
    return updated;
  }
}

// CLI Interface
const args = process.argv.slice(2);
const publisher = new ContentPublisher();

if (args.includes('--help') || args.includes('-h')) {
  console.log('📖 Usage:');
  console.log('   npm run publish-content          # Analyze all content');
  console.log('   npm run publish-content --update # Apply recommended settings');
  console.log('   npm run publish-content --dry-run # Preview changes');
  console.log('   npm run publish-content --review  # Detailed analysis');
} else if (args.includes('--update')) {
  publisher.updateAll(false);
} else if (args.includes('--dry-run')) {
  publisher.updateAll(true);
} else {
  publisher.analyzeAll();
}
