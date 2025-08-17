#!/usr/bin/env node

import agent from './campaign-ai-agent.js';

// Get command line arguments
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log('Usage: npm run ai-image "<prompt>" [output-filename]');
  console.log('');
  console.log('Examples:');
  console.log('  npm run ai-image "A mysterious hooded figure in a tavern"');
  console.log('  npm run ai-image "Ancient ruined watchtower on a hill" watchtower-image');
  console.log('  npm run ai-image "Fierce dragon breathing fire" dragon-battle.png');
  process.exit(1);
}

const prompt = args[0];
const outputFile = args[1];

if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
  console.log('❌ Please set your OPENAI_API_KEY in the .env file first!');
  process.exit(1);
}

console.log('🎨 Generating image with DALL-E...');
console.log(`🖼️  Prompt: "${prompt}"`);

try {
  const result = await agent.generateImage(prompt, outputFile);
  
  console.log('\n🖼️  Image Generated Successfully!');
  console.log('=' .repeat(60));
  console.log(`🌐 Image URL: ${result.imageUrl}`);
  
  if (result.localPath) {
    console.log(`✅ Image saved to: ${result.saveLocation}`);
    console.log(`📁 Suggested destination: ${result.suggestedFolder}`);
    console.log(`🔧 To move: mv "${result.saveLocation}" "${result.suggestedFolder}"`);
  } else {
    console.log('💡 Copy the URL above to download the image manually');
  }
  console.log('=' .repeat(60));
  
} catch (error) {
  console.error('❌ Error generating image:', error.message);
  process.exit(1);
}
