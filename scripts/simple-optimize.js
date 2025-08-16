import fs from 'fs';
import path from 'path';

const OBSIDIAN_DIR = './src/content/blog/obsidian';

// Simple optimization function
function optimizeFile(filename) {
  const filePath = path.join(OBSIDIAN_DIR, filename);
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Parse current content
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!frontmatterMatch) return false;
  
  const body = frontmatterMatch[2];
  
  // Determine category and generate better metadata
  const category = categorizeFile(filename);
  const title = generateTitle(filename);
  const description = generateDescription(body, category);
  const tags = generateTags(category);
  const heroImage = getRandomHeroImage();
  
  // Create optimized frontmatter
  const newFrontmatter = `---
title: "${title}"
description: "${description}"
pubDate: 2025-08-16
tags: ${JSON.stringify(tags)}
heroImage: "${heroImage}"
---`;

  // Clean body content
  let cleanBody = body;
  // Remove old title if it duplicates the frontmatter title
  cleanBody = cleanBody.replace(/^#+\s*(NPC:|ADVERSARY:|LOCATION:|ACT\s*\d+.*?:)/i, '');
  // Convert Obsidian links
  cleanBody = cleanBody.replace(/\[\[([^\]|]+)(\|([^\]]+))?\]\]/g, (match, link, pipe, text) => {
    return text || link.replace(/_/g, ' ');
  });
  // Add proper heading
  cleanBody = `# ${title}\n*${getCategorySubtitle(category)}*\n\n${cleanBody.trim()}`;
  // Add footer
  cleanBody += '\n\n---\n\n*This content is part of the Daggerheart campaign setting.*';
  
  // Write optimized content
  const optimizedContent = newFrontmatter + '\n\n' + cleanBody;
  fs.writeFileSync(filePath, optimizedContent);
  
  return { filename, title, category };
}

function categorizeFile(filename) {
  const name = filename.toLowerCase();
  if (name.startsWith('npc_')) return 'character';
  if (name.startsWith('location_')) return 'location';
  if (name.startsWith('act') || name.includes('sub')) return 'adventure';
  if (name.startsWith('adversary_')) return 'monster';
  if (name.startsWith('loot_') || name.startsWith('item_')) return 'item';
  if (name.startsWith('environment_')) return 'environment';
  if (name.includes('campaign') || name.includes('overview')) return 'campaign';
  return 'misc';
}

function generateTitle(filename) {
  let title = path.basename(filename, '.md');
  title = title.replace(/^(NPC_|LOCATION_|ACT\d+_|ADVERSARY_|ENVIRONMENT_|LOOT_)/i, '');
  title = title.replace(/_/g, ' ');
  return title.split(' ').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ');
}

function generateDescription(body, category) {
  // Extract first meaningful sentence
  let text = body.replace(/^#+.*$/gm, '');
  text = text.replace(/\*\*(.*?)\*\*/g, '$1');
  text = text.replace(/\[\[([^\]|]+)(\|([^\]]+))?\]\]/g, (match, link, pipe, text) => {
    return text || link.replace(/_/g, ' ');
  });
  
  const sentences = text.split('.').filter(s => s.trim().length > 20);
  if (sentences.length > 0) {
    let desc = sentences[0].trim() + '.';
    if (desc.length > 150) desc = desc.substring(0, 147) + '...';
    return desc;
  }
  
  const fallbacks = {
    character: 'A character in the campaign world',
    location: 'A location in the campaign setting', 
    adventure: 'An adventure in the campaign',
    monster: 'A creature in the campaign',
    item: 'An item in the campaign',
    environment: 'An environmental feature',
    campaign: 'Campaign information'
  };
  return fallbacks[category] || 'Campaign content';
}

function generateTags(category) {
  const baseTags = ['dnd', 'campaign'];
  const categoryTags = {
    character: ['npc', 'character'],
    location: ['location', 'worldbuilding'],
    adventure: ['adventure', 'quest'],
    monster: ['monster', 'adversary'],
    item: ['item', 'loot'],
    environment: ['environment'],
    campaign: ['lore', 'campaign']
  };
  return [...baseTags, ...(categoryTags[category] || [])];
}

function getCategorySubtitle(category) {
  const subtitles = {
    character: 'Campaign Character',
    location: 'Campaign Location',
    adventure: 'Campaign Adventure', 
    monster: 'Campaign Adversary',
    item: 'Campaign Item',
    environment: 'Campaign Environment',
    campaign: 'Campaign Information'
  };
  return subtitles[category] || 'Campaign Content';
}

function getRandomHeroImage() {
  const images = [
    '/blog-placeholder-1.jpg',
    '/blog-placeholder-2.jpg',
    '/blog-placeholder-3.jpg', 
    '/blog-placeholder-4.jpg',
    '/blog-placeholder-5.jpg',
    '/blog-placeholder-about.jpg'
  ];
  return images[Math.floor(Math.random() * images.length)];
}

// Main execution
const files = fs.readdirSync(OBSIDIAN_DIR).filter(f => f.endsWith('.md'));
const results = { success: [], failed: [] };

console.log('🚀 Optimizing campaign files for web display...\n');

files.forEach(filename => {
  try {
    const result = optimizeFile(filename);
    if (result) {
      results.success.push(result);
      console.log(`✅ ${result.title} (${result.category})`);
    }
  } catch (error) {
    results.failed.push(filename);
    console.log(`❌ Failed: ${filename} - ${error.message}`);
  }
});

console.log(`\n📊 Optimization Complete:`);
console.log(`   ✅ Success: ${results.success.length}`);
console.log(`   ❌ Failed: ${results.failed.length}`);
console.log('\n🎉 Your campaign content is now web-optimized!');
console.log('💡 Run "npm run dev" to see the results');
