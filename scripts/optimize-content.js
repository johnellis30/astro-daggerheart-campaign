import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OBSIDIAN_DIR = path.join(__dirname, '../src/content/blog/obsidian');

class FileOptimizer {
  constructor() {
    this.heroImages = [
      '/blog-placeholder-1.jpg',
      '/blog-placeholder-2.jpg', 
      '/blog-placeholder-3.jpg',
      '/blog-placeholder-4.jpg',
      '/blog-placeholder-5.jpg',
      '/blog-placeholder-about.jpg'
    ];
  }

  // Categorize file based on filename
  categorizeFile(filename) {
    const name = filename.toLowerCase();
    if (name.startsWith('npc_') || name.startsWith('character_')) return 'character';
    if (name.startsWith('location_') || name.startsWith('place_')) return 'location';
    if (name.startsWith('act') || name.includes('sub') || name.startsWith('adventure_') || name.startsWith('quest_')) return 'adventure';
    if (name.startsWith('adversary_') || name.startsWith('monster_') || name.startsWith('creature_')) return 'monster';
    if (name.startsWith('loot_') || name.startsWith('item_') || name.startsWith('artifact_')) return 'item';
    if (name.startsWith('environment_') || name.startsWith('terrain_')) return 'environment';
    if (name.includes('campaign') || name.includes('overview') || name.includes('primer')) return 'campaign';
    return 'misc';
  }

  // Parse existing markdown file
  parseMarkdown(content) {
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
    
    if (!frontmatterMatch) {
      return {
        frontmatter: {},
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
        frontmatter[key] = value.replace(/^["']|["']$/g, ''); // Remove quotes
      }
    });

    return { frontmatter, body };
  }

  // Generate optimized title from filename
  generateTitle(filename, category) {
    let title = path.basename(filename, '.md');
    
    // Remove prefixes
    title = title.replace(/^(NPC_|LOCATION_|ACT\d+_|ADVERSARY_|ENVIRONMENT_|LOOT_|DOCUMENT_)/i, '');
    title = title.replace(/_/g, ' ');
    
    // Title case
    title = title.split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
    
    return title;
  }

  // Generate description from content
  generateDescription(body, category) {
    // Remove frontmatter and headings
    let text = body.replace(/^#+\s+.+$/gm, '');
    text = text.replace(/^\*+.+\*+$/gm, '');
    text = text.replace(/\*\*(.*?)\*\*/g, '$1');
    
    // Find first substantial paragraph
    const paragraphs = text.split('\n\n').filter(p => p.trim().length > 50);
    
    if (paragraphs.length > 0) {
      let desc = paragraphs[0].trim();
      desc = desc.replace(/\[\[([^\]|]+)(\|([^\]]+))?\]\]/g, (match, link, pipe, text) => {
        return text || link.replace(/_/g, ' ');
      });
      
      // Limit length
      if (desc.length > 150) {
        desc = desc.substring(0, 147) + '...';
      }
      
      return desc;
    }
    
    // Fallback descriptions by category
    const fallbacks = {
      character: 'A character in the campaign world',
      location: 'A location in the campaign setting',
      adventure: 'An adventure or quest in the campaign',
      monster: 'A creature or adversary in the campaign',
      item: 'An item or artifact in the campaign',
      environment: 'An environmental feature of the campaign world',
      campaign: 'Campaign information and lore'
    };
    
    return fallbacks[category] || 'Campaign content';
  }

  // Get random hero image
  getRandomHeroImage() {
    return this.heroImages[Math.floor(Math.random() * this.heroImages.length)];
  }

  // Optimize content body for web
  optimizeBody(body, title, category) {
    let optimized = body;
    
    // Remove duplicate title if it exists at the start
    const titleRegex = new RegExp(`^#\\s+${title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i');
    optimized = optimized.replace(titleRegex, '');
    
    // Remove old frontmatter from body if present
    optimized = optimized.replace(/^tags:\s*\n((?:\s*-\s*.+\n?)*)/m, '');
    optimized = optimized.replace(/^---\n[\s\S]*?\n---\n?/m, '');
    
    // Convert Obsidian links to plain text
    optimized = optimized.replace(/\[\[([^\]|]+)(\|([^\]]+))?\]\]/g, (match, link, pipe, text) => {
      return text || link.replace(/_/g, ' ');
    });
    
    // Add main heading with subtitle
    const subtitles = {
      character: 'Campaign Character',
      location: 'Campaign Location', 
      adventure: 'Campaign Adventure',
      monster: 'Campaign Adversary',
      item: 'Campaign Item',
      environment: 'Campaign Environment',
      campaign: 'Campaign Information'
    };
    
    const subtitle = subtitles[category] || 'Campaign Content';
    optimized = `# ${title}\n*${subtitle}*\n\n${optimized}`;
    
    // Clean up extra whitespace
    optimized = optimized.replace(/\n{3,}/g, '\n\n');
    optimized = optimized.trim();
    
    // Add campaign footer
    optimized += '\n\n---\n\n*This content is part of the Daggerheart campaign setting.*';
    
    return optimized;
  }

  // Optimize a single file
  optimizeFile(filename) {
    const filePath = path.join(OBSIDIAN_DIR, filename);
    
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${filename}`);
      return false;
    }
    
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const { frontmatter, body } = this.parseMarkdown(content);
      
      const category = this.categorizeFile(filename);
      const title = this.generateTitle(filename, category);
      const description = this.generateDescription(body, category);
      
      // Generate tags
      const categoryTags = {
        character: ['npc', 'character'],
        location: ['location', 'worldbuilding'],
        adventure: ['adventure', 'quest'],
        monster: ['monster', 'adversary'],
        item: ['item', 'loot'],
        environment: ['environment', 'terrain'],
        campaign: ['campaign', 'lore']
      };
      
      const tags = ['dnd', 'campaign', ...categoryTags[category] || []];
      
      // Build new frontmatter
      const newFrontmatter = {
        title: `"${title}"`,
        description: `"${description}"`,
        pubDate: new Date().toISOString().split('T')[0],
        tags: JSON.stringify(tags),
        heroImage: `"${this.getRandomHeroImage()}"`
      };
      
      // Build optimized content
      const frontmatterText = Object.entries(newFrontmatter)
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n');
      
      const optimizedBody = this.optimizeBody(body, title, category);
      
      const optimizedContent = `---\n${frontmatterText}\n---\n\n${optimizedBody}`;
      
      // Write back to file
      fs.writeFileSync(filePath, optimizedContent);
      
      return { filename, title, category, description: description.substring(0, 50) + '...' };
      
    } catch (error) {
      console.error(`❌ Error optimizing ${filename}:`, error.message);
      return false;
    }
  }

  // Optimize all files
  optimizeAllFiles() {
    console.log('🚀 Starting batch optimization of campaign files...\n');
    
    if (!fs.existsSync(OBSIDIAN_DIR)) {
      console.error('❌ Obsidian content directory not found!');
      return;
    }
    
    const files = fs.readdirSync(OBSIDIAN_DIR).filter(f => f.endsWith('.md'));
    const results = {
      success: [],
      failed: [],
      categories: {}
    };
    
    files.forEach(filename => {
      const result = this.optimizeFile(filename);
      
      if (result) {
        results.success.push(result);
        if (!results.categories[result.category]) {
          results.categories[result.category] = [];
        }
        results.categories[result.category].push(result);
        console.log(`✅ ${result.title} (${result.category})`);
      } else {
        results.failed.push(filename);
        console.log(`❌ Failed: ${filename}`);
      }
    });
    
    // Print summary
    console.log('\n📊 Optimization Summary:');
    console.log(`   ✅ Successfully optimized: ${results.success.length} files`);
    console.log(`   ❌ Failed: ${results.failed.length} files`);
    
    console.log('\n📂 Content by Category:');
    Object.entries(results.categories).forEach(([category, items]) => {
      console.log(`   ${category}: ${items.length} files`);
    });
    
    console.log('\n🎉 Batch optimization complete!');
    console.log('💡 Run "npm run dev" to see your optimized content');
    
    return results;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const optimizer = new FileOptimizer();
  optimizer.optimizeAllFiles();
}
