import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load configuration
const configPath = path.join(__dirname, '../obsidian-sync.config.json');
let config = {};

try {
  const configContent = fs.readFileSync(configPath, 'utf8');
  config = JSON.parse(configContent);
} catch (error) {
  console.error('❌ Could not load config file:', error.message);
  process.exit(1);
}

const OBSIDIAN_VAULT = config.obsidianVaultPath || 'C:/Users/johnd/OneDrive/Documents/Obsidian Vault';
const SYNC_SETTINGS = config.syncSettings || {};

// Import functions from sync script
function matchesPattern(filename, patterns) {
  if (!patterns || patterns.length === 0) return false;
  
  return patterns.some(pattern => {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    return regex.test(filename);
  });
}

function extractTagsFromContent(content) {
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!frontmatterMatch) return [];
  
  const frontmatterText = frontmatterMatch[1];
  const tagMatch = frontmatterText.match(/tags:\s*\n((?:\s*-\s*.+\n?)*)/);
  
  if (tagMatch) {
    return tagMatch[1].split('\n')
      .filter(line => line.trim().startsWith('-'))
      .map(line => line.replace(/^\s*-\s*/, '').trim())
      .filter(tag => tag);
  }
  
  return [];
}

function shouldIncludeFile(filename, content) {
  const settings = SYNC_SETTINGS;
  
  if (settings.includeFiles && settings.includeFiles.includes(filename)) {
    return true;
  }
  
  if (settings.excludeFiles && settings.excludeFiles.includes(filename)) {
    return false;
  }
  
  if (settings.excludePatterns && matchesPattern(filename, settings.excludePatterns)) {
    return false;
  }
  
  if (settings.includePatterns && matchesPattern(filename, settings.includePatterns)) {
    if (settings.includeTags || settings.excludeTags) {
      const fileTags = extractTagsFromContent(content);
      
      if (settings.excludeTags && settings.excludeTags.some(tag => fileTags.includes(tag))) {
        return false;
      }
      
      if (settings.includeTags && settings.includeTags.length > 0) {
        return settings.includeTags.some(tag => fileTags.includes(tag));
      }
    }
    
    return true;
  }
  
  if (!settings.includePatterns || settings.includePatterns.length === 0) {
    if (settings.includeTags || settings.excludeTags) {
      const fileTags = extractTagsFromContent(content);
      
      if (settings.excludeTags && settings.excludeTags.some(tag => fileTags.includes(tag))) {
        return false;
      }
      
      if (settings.includeTags && settings.includeTags.length > 0) {
        return settings.includeTags.some(tag => fileTags.includes(tag));
      }
    }
    
    return true;
  }
  
  return false;
}

function previewSync() {
  try {
    if (!fs.existsSync(OBSIDIAN_VAULT)) {
      console.error(`❌ Obsidian vault not found at: ${OBSIDIAN_VAULT}`);
      return;
    }

    console.log('📋 Obsidian Sync Preview');
    console.log('========================\n');
    
    console.log('📁 Configuration:');
    console.log(`   Vault: ${OBSIDIAN_VAULT}`);
    console.log(`   Include Files: ${(SYNC_SETTINGS.includeFiles || []).join(', ') || 'none'}`);
    console.log(`   Include Patterns: ${(SYNC_SETTINGS.includePatterns || []).join(', ') || 'none'}`);
    console.log(`   Exclude Files: ${(SYNC_SETTINGS.excludeFiles || []).join(', ') || 'none'}`);
    console.log(`   Exclude Patterns: ${(SYNC_SETTINGS.excludePatterns || []).join(', ') || 'none'}`);
    console.log(`   Include Tags: ${(SYNC_SETTINGS.includeTags || []).join(', ') || 'none'}`);
    console.log(`   Exclude Tags: ${(SYNC_SETTINGS.excludeTags || []).join(', ') || 'none'}\n`);

    const files = fs.readdirSync(OBSIDIAN_VAULT, { recursive: true });
    let syncCount = 0;
    let skipCount = 0;
    
    const toSync = [];
    const toSkip = [];
    
    files
      .filter(file => path.extname(file) === '.md')
      .forEach(file => {
        const sourcePath = path.join(OBSIDIAN_VAULT, file);
        const filename = path.basename(file);
        const content = fs.readFileSync(sourcePath, 'utf8');
        
        if (shouldIncludeFile(filename, content)) {
          toSync.push(file);
          syncCount++;
        } else {
          toSkip.push(file);
          skipCount++;
        }
      });
    
    console.log('✅ Files that would be synced:');
    if (toSync.length === 0) {
      console.log('   (none)');
    } else {
      toSync.forEach(file => console.log(`   • ${file}`));
    }
    
    console.log('\n⏭️  Files that would be skipped:');
    if (toSkip.length === 0) {
      console.log('   (none)');
    } else {
      toSkip.slice(0, 10).forEach(file => console.log(`   • ${file}`));
      if (toSkip.length > 10) {
        console.log(`   ... and ${toSkip.length - 10} more`);
      }
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`   ✅ Would sync: ${syncCount} files`);
    console.log(`   ⏭️  Would skip: ${skipCount} files`);
    
  } catch (error) {
    console.error('❌ Error previewing sync:', error.message);
  }
}

previewSync();
