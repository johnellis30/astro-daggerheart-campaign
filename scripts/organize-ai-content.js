#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const AI_GENERATED_DIR = './ai-generated';
const CONTENT_DIRS = {
  'character': './src/content/characters',
  'location': './src/content/locations', 
  'adventure': './src/content/adventures',
  'monster': './src/content/monsters',
  'item': './src/content/items',
  'environment': './src/content/environments',
  'campaign': './src/content/campaign'
};

function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

function detectContentType(filename) {
  const lower = filename.toLowerCase();
  if (lower.includes('character') || lower.includes('npc')) return 'character';
  if (lower.includes('location') || lower.includes('place')) return 'location';
  if (lower.includes('adventure') || lower.includes('quest')) return 'adventure';
  if (lower.includes('monster') || lower.includes('creature')) return 'monster';
  if (lower.includes('item') || lower.includes('artifact')) return 'item';
  if (lower.includes('environment') || lower.includes('terrain')) return 'environment';
  return 'campaign';
}

async function organizeFiles() {
  console.log('🗂️  AI Generated Content Organizer');
  console.log('===================================\n');

  if (!fs.existsSync(AI_GENERATED_DIR)) {
    console.log('❌ No ai-generated folder found');
    process.exit(1);
  }

  const files = fs.readdirSync(AI_GENERATED_DIR).filter(f => f.endsWith('.md') && f !== 'README.md');
  
  if (files.length === 0) {
    console.log('✅ No files to organize!');
    rl.close();
    return;
  }

  console.log(`Found ${files.length} files to organize:\n`);

  for (const file of files) {
    console.log(`\n📄 File: ${file}`);
    const suggestedType = detectContentType(file);
    console.log(`💡 Suggested type: ${suggestedType}`);
    
    const action = await prompt('Choose action: [m]ove, [s]kip, [d]elete, [v]iew: ');
    
    if (action === 'v') {
      console.log('\n--- File Preview ---');
      const content = fs.readFileSync(path.join(AI_GENERATED_DIR, file), 'utf8');
      console.log(content.substring(0, 500) + '...\n');
      continue;
    }
    
    if (action === 'd') {
      fs.unlinkSync(path.join(AI_GENERATED_DIR, file));
      console.log(`🗑️  Deleted ${file}`);
      continue;
    }
    
    if (action === 's') {
      console.log(`⏭️  Skipped ${file}`);
      continue;
    }
    
    if (action === 'm') {
      const type = await prompt(`Content type [${suggestedType}]: `) || suggestedType;
      
      if (!CONTENT_DIRS[type]) {
        console.log('❌ Invalid content type');
        continue;
      }
      
      const newName = await prompt(`New filename [${file}]: `) || file;
      const destination = path.join(CONTENT_DIRS[type], newName);
      
      // Ensure destination directory exists
      const destDir = path.dirname(destination);
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }
      
      fs.renameSync(path.join(AI_GENERATED_DIR, file), destination);
      console.log(`✅ Moved to ${destination}`);
    }
  }
  
  console.log('\n🎉 Organization complete!');
  rl.close();
}

organizeFiles().catch(console.error);
