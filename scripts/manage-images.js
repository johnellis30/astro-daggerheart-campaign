#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONTENT_DIR = path.join(__dirname, '..', 'src', 'content', 'blog', 'obsidian');
const IMAGES_DIR = path.join(__dirname, '..', 'public', 'images');

console.log('🖼️  Campaign Image Manager');
console.log('==========================\n');

class ImageManager {
  constructor() {
    this.imageCategories = {
      characters: 'characters',
      locations: 'locations', 
      monsters: 'monsters',
      items: 'items',
      adventures: 'adventures'
    };
  }

  // Parse markdown frontmatter
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
          frontmatter[key] = JSON.parse(value);
        } catch {
          frontmatter[key] = value.replace(/^["']|["']$/g, '');
        }
      }
    });

    return { frontmatter, frontmatterText, body };
  }

  // Get content category from tags
  getCategory(tags) {
    if (tags.includes('character') || tags.includes('npc')) return 'characters';
    if (tags.includes('location') || tags.includes('worldbuilding')) return 'locations';
    if (tags.includes('monster') || tags.includes('adversary')) return 'monsters';
    if (tags.includes('item') || tags.includes('loot')) return 'items';
    if (tags.includes('adventure') || tags.includes('quest')) return 'adventures';
    return 'misc';
  }

  // Find available images for a character
  findAvailableImages(category, searchName = '') {
    const categoryPath = path.join(IMAGES_DIR, category);
    
    if (!fs.existsSync(categoryPath)) {
      return [];
    }
    
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    const files = fs.readdirSync(categoryPath)
      .filter(file => {
        const ext = path.extname(file).toLowerCase();
        return imageExtensions.includes(ext);
      });
    
    if (searchName) {
      const searchLower = searchName.toLowerCase();
      return files.filter(file => 
        file.toLowerCase().includes(searchLower.replace(/\s+/g, '-'))
      );
    }
    
    return files;
  }

  // Update image for a specific file
  updateImage(filename, imagePath) {
    const filePath = path.join(CONTENT_DIR, filename);
    
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const { frontmatter, body } = this.parseMarkdown(content);
      
      // Update heroImage
      frontmatter.heroImage = imagePath;
      
      // Build new frontmatter
      const frontmatterLines = [];
      Object.entries(frontmatter).forEach(([key, value]) => {
        if (typeof value === 'object') {
          frontmatterLines.push(`${key}: ${JSON.stringify(value)}`);
        } else if (typeof value === 'string') {
          frontmatterLines.push(`${key}: "${value}"`);
        } else {
          frontmatterLines.push(`${key}: ${value}`);
        }
      });
      
      const newContent = `---\n${frontmatterLines.join('\n')}\n---\n\n${body}`;
      
      fs.writeFileSync(filePath, newContent, 'utf8');
      
      return { success: true, message: `Updated ${filename} with image ${imagePath}` };
      
    } catch (error) {
      return { success: false, error: `Error updating ${filename}: ${error.message}` };
    }
  }

  // List all content with current images
  listContent() {
    console.log('📋 Current Content and Images:\n');
    
    const files = fs.readdirSync(CONTENT_DIR).filter(f => f.endsWith('.md'));
    
    files.forEach(filename => {
      try {
        const content = fs.readFileSync(path.join(CONTENT_DIR, filename), 'utf8');
        const { frontmatter } = this.parseMarkdown(content);
        
        const title = frontmatter.title || filename;
        const heroImage = frontmatter.heroImage || 'None';
        const tags = frontmatter.tags || [];
        const category = this.getCategory(tags);
        
        console.log(`📄 ${title}`);
        console.log(`   File: ${filename}`);
        console.log(`   Category: ${category}`);
        console.log(`   Current Image: ${heroImage}`);
        console.log('');
        
      } catch (error) {
        console.log(`❌ Error reading ${filename}: ${error.message}\n`);
      }
    });
  }

  // Auto-assign images based on filename/title matching
  autoAssignImages(dryRun = false) {
    console.log(`${dryRun ? '🔍 Dry Run: ' : '🖼️  Auto-assigning'} images...\n`);
    
    const files = fs.readdirSync(CONTENT_DIR).filter(f => f.endsWith('.md'));
    let assigned = 0;
    
    files.forEach(filename => {
      try {
        const content = fs.readFileSync(path.join(CONTENT_DIR, filename), 'utf8');
        const { frontmatter } = this.parseMarkdown(content);
        
        const title = frontmatter.title || filename;
        const tags = frontmatter.tags || [];
        const category = this.getCategory(tags);
        
        // Skip if already has a custom image (not placeholder)
        if (frontmatter.heroImage && !frontmatter.heroImage.includes('blog-placeholder')) {
          return;
        }
        
        // Search for matching images
        const searchName = title.replace(/^(NPC_|LOCATION_|ADVERSARY_)/i, '').replace(/_/g, ' ');
        const availableImages = this.findAvailableImages(category, searchName);
        
        if (availableImages.length > 0) {
          const imagePath = `/images/${category}/${availableImages[0]}`;
          
          if (!dryRun) {
            const result = this.updateImage(filename, imagePath);
            if (result.success) {
              console.log(`✅ ${title}: ${imagePath}`);
              assigned++;
            } else {
              console.log(`❌ ${title}: ${result.error}`);
            }
          } else {
            console.log(`📝 Would assign ${title}: ${imagePath}`);
            assigned++;
          }
        }
        
      } catch (error) {
        console.log(`❌ Error processing ${filename}: ${error.message}`);
      }
    });
    
    console.log(`\n${dryRun ? '📊' : '🎉'} ${dryRun ? 'Would assign' : 'Assigned'}: ${assigned} images`);
    
    return assigned;
  }

  // Create directory structure
  createImageDirectories() {
    console.log('📁 Creating image directory structure...\n');
    
    Object.values(this.imageCategories).forEach(category => {
      const dirPath = path.join(IMAGES_DIR, category);
      
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(`✅ Created: ${dirPath}`);
      } else {
        console.log(`📁 Exists: ${dirPath}`);
      }
    });
    
    console.log('\n💡 Image Directory Structure:');
    console.log('   public/images/characters/  - Character portraits');
    console.log('   public/images/locations/   - Location images');
    console.log('   public/images/monsters/    - Monster/adversary images');
    console.log('   public/images/items/       - Item/artifact images');
    console.log('   public/images/adventures/  - Adventure/quest images');
  }
}

// CLI Interface
const args = process.argv.slice(2);
const manager = new ImageManager();

if (args.includes('--help') || args.includes('-h')) {
  console.log('📖 Usage:');
  console.log('   npm run manage-images                    # List all content and current images');
  console.log('   npm run manage-images --create-dirs     # Create image directory structure');
  console.log('   npm run manage-images --auto-assign     # Auto-assign images based on filename');
  console.log('   npm run manage-images --dry-run         # Preview auto-assignment');
} else if (args.includes('--create-dirs')) {
  manager.createImageDirectories();
} else if (args.includes('--auto-assign')) {
  manager.autoAssignImages(false);
} else if (args.includes('--dry-run')) {
  manager.autoAssignImages(true);
} else {
  manager.listContent();
}
