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

// Configuration with defaults
const OBSIDIAN_VAULT = config.obsidianVaultPath || 'C:/Users/johnd/OneDrive/Documents/Obsidian Vault';
const BLOG_CONTENT_DIR = path.join(__dirname, '../src/content/blog');
const OBSIDIAN_CONTENT_DIR = path.join(BLOG_CONTENT_DIR, 'obsidian');
const SYNC_SETTINGS = config.syncSettings || {};
const FRONTMATTER_DEFAULTS = config.frontmatterDefaults || {};

// Ensure the obsidian directory exists
if (!fs.existsSync(OBSIDIAN_CONTENT_DIR)) {
  fs.mkdirSync(OBSIDIAN_CONTENT_DIR, { recursive: true });
}

// Function to check if file has proper frontmatter
function hasFrontmatter(content) {
  return content.startsWith('---');
}

// Function to extract existing frontmatter and content
function parseFrontmatter(content) {
  if (!hasFrontmatter(content)) {
    return { frontmatter: {}, content };
  }
  
  const parts = content.split('---');
  if (parts.length < 3) {
    return { frontmatter: {}, content };
  }
  
  const frontmatterText = parts[1].trim();
  const bodyContent = parts.slice(2).join('---');
  
  // Simple YAML parsing for basic fields
  const frontmatter = {};
  frontmatterText.split('\n').forEach(line => {
    if (line.includes(':')) {
      const [key, ...valueParts] = line.split(':');
      const value = valueParts.join(':').trim();
      if (key.trim() && value) {
        frontmatter[key.trim()] = value.replace(/['"]/g, '');
      }
    }
  });
  
  return { frontmatter, content: bodyContent };
}

// Function to add or update frontmatter
function ensureValidFrontmatter(content, filename) {
  const { frontmatter, content: bodyContent } = parseFrontmatter(content);
  
  // Extract title from filename or existing frontmatter
  let title = frontmatter.title || 
    path.basename(filename, '.md')
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  
  // Clean title - remove quotes and escape special characters
  title = title.replace(/['"]/g, '').trim();
  
  // Extract description from content or use default - clean it up
  let description = frontmatter.description || 
    bodyContent.split('\n').find(line => line.trim() && !line.startsWith('#'))?.trim().substring(0, 100) || 
    "Imported from Obsidian vault";
  
  // Clean description - remove quotes, markdown links, and limit length
  description = description
    .replace(/\[\[.*?\|?(.*?)\]\]/g, '$1') // Remove Obsidian links
    .replace(/['"]/g, '') // Remove quotes
    .replace(/\*\*/g, '') // Remove bold markdown
    .trim()
    .substring(0, 150);
  
  // Set publication date
  const pubDate = frontmatter.pubDate || new Date().toISOString().split('T')[0];
  
  // Build clean frontmatter
  const cleanFrontmatter = [
    `title: "${title}"`,
    `description: "${description}"`,
    `pubDate: ${pubDate}`
  ];
  
  // Add optional fields if they exist
  if (frontmatter.updatedDate) {
    cleanFrontmatter.push(`updatedDate: ${frontmatter.updatedDate}`);
  }
  if (frontmatter.heroImage) {
    cleanFrontmatter.push(`heroImage: "${frontmatter.heroImage}"`);
  }
  
  return `---\n${cleanFrontmatter.join('\n')}\n---\n\n${bodyContent}`;
}

// Function to check if a filename matches a pattern
function matchesPattern(filename, patterns) {
  if (!patterns || patterns.length === 0) return false;
  
  return patterns.some(pattern => {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    return regex.test(filename);
  });
}

// Function to extract tags from frontmatter content
function extractTagsFromContent(content) {
  const { frontmatter } = parseFrontmatter(content);
  
  if (frontmatter.tags) {
    // Handle different tag formats
    if (typeof frontmatter.tags === 'string') {
      return frontmatter.tags.split(',').map(tag => tag.trim());
    }
    if (Array.isArray(frontmatter.tags)) {
      return frontmatter.tags;
    }
  }
  
  // Also check for tags in YAML array format
  const tagMatch = content.match(/tags:\s*\n((?:\s*-\s*.+\n?)*)/);
  if (tagMatch) {
    return tagMatch[1].split('\n')
      .filter(line => line.trim().startsWith('-'))
      .map(line => line.replace(/^\s*-\s*/, '').trim())
      .filter(tag => tag);
  }
  
  return [];
}

// Function to check if a file should be included based on configuration
function shouldIncludeFile(filename, content) {
  const settings = SYNC_SETTINGS;
  
  // Check explicit include files
  if (settings.includeFiles && settings.includeFiles.includes(filename)) {
    return true;
  }
  
  // Check explicit exclude files
  if (settings.excludeFiles && settings.excludeFiles.includes(filename)) {
    return false;
  }
  
  // Check exclude patterns
  if (settings.excludePatterns && matchesPattern(filename, settings.excludePatterns)) {
    return false;
  }
  
  // Check include patterns
  if (settings.includePatterns && matchesPattern(filename, settings.includePatterns)) {
    // Check tags if specified
    if (settings.includeTags || settings.excludeTags) {
      const fileTags = extractTagsFromContent(content);
      
      // Exclude if has excluded tags
      if (settings.excludeTags && settings.excludeTags.some(tag => fileTags.includes(tag))) {
        return false;
      }
      
      // Include if has required tags (or no tag requirement)
      if (settings.includeTags && settings.includeTags.length > 0) {
        return settings.includeTags.some(tag => fileTags.includes(tag));
      }
    }
    
    return true;
  }
  
  // If no include patterns are specified, include by default (unless explicitly excluded)
  if (!settings.includePatterns || settings.includePatterns.length === 0) {
    // Check tags if specified
    if (settings.includeTags || settings.excludeTags) {
      const fileTags = extractTagsFromContent(content);
      
      // Exclude if has excluded tags
      if (settings.excludeTags && settings.excludeTags.some(tag => fileTags.includes(tag))) {
        return false;
      }
      
      // Include if has required tags (or no tag requirement)
      if (settings.includeTags && settings.includeTags.length > 0) {
        return settings.includeTags.some(tag => fileTags.includes(tag));
      }
    }
    
    return true;
  }
  
  return false;
}

// Function to copy markdown files from Obsidian vault
function syncObsidianFiles() {
  try {
    if (!fs.existsSync(OBSIDIAN_VAULT)) {
      console.error(`Obsidian vault not found at: ${OBSIDIAN_VAULT}`);
      return;
    }

    const files = fs.readdirSync(OBSIDIAN_VAULT, { recursive: true });
    let syncedCount = 0;
    let skippedCount = 0;
    
    files
      .filter(file => path.extname(file) === '.md')
      .forEach(file => {
        const sourcePath = path.join(OBSIDIAN_VAULT, file);
        const filename = path.basename(file);
        
        // Read and check if file should be included
        let content = fs.readFileSync(sourcePath, 'utf8');
        
        if (!shouldIncludeFile(filename, content)) {
          console.log(`⏭️  Skipped: ${file} (filtered out by config)`);
          skippedCount++;
          return;
        }
        
        const targetPath = path.join(OBSIDIAN_CONTENT_DIR, file);
        
        // Create subdirectories if needed
        const targetDir = path.dirname(targetPath);
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }
        
        // Add frontmatter if missing
        content = ensureValidFrontmatter(content, file);
        
        // Write to target location
        fs.writeFileSync(targetPath, content);
        console.log(`✅ Synced: ${file}`);
        syncedCount++;
      });
    
    console.log(`\n📊 Sync Summary:`);
    console.log(`   ✅ Files synced: ${syncedCount}`);
    console.log(`   ⏭️  Files skipped: ${skippedCount}`);
    console.log('🎉 Obsidian vault sync complete!');
  } catch (error) {
    console.error('❌ Error syncing Obsidian vault:', error.message);
  }
}

// Run the sync
syncObsidianFiles();
