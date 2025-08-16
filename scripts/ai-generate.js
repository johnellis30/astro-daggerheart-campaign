import agent from './campaign-ai-agent.js';
import fs from 'fs';
import path from 'path';

// Get command line arguments
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log('Usage: npm run ai-generate "<prompt>" [output-filename]');
  console.log('');
  console.log('Examples:');
  console.log('  npm run ai-generate "Create a new NPC blacksmith for Riverbend"');
  console.log('  npm run ai-generate "Design a haunted cave system" LOCATION_HAUNTED_CAVES.md');
  process.exit(1);
}

const prompt = args[0];
const outputFile = args[1];

if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
  console.log('❌ Please set your OPENAI_API_KEY in the .env file first!');
  process.exit(1);
}

console.log('🤖 Generating content...');
console.log(`📝 Prompt: "${prompt}"`);

try {
  const result = await agent.generateContent(prompt);
  
  console.log('\n📄 Generated Content:');
  console.log('='.repeat(60));
  console.log(result.content);
  console.log('='.repeat(60));
  
  if (result.relevantFiles.length > 0) {
    console.log('\n🔗 Referenced files:');
    result.relevantFiles.forEach(file => {
      console.log(`  • ${file.title} (${file.category})`);
    });
  }
  
  console.log(`\n📊 Tokens used: ${result.tokensUsed}`);
  
  if (outputFile) {
    let filename = outputFile;
    if (!filename.endsWith('.md')) {
      filename += '.md';
    }
    
    const vaultPath = 'C:/Users/johnd/OneDrive/Documents/Obsidian Vault';
    const filePath = path.join(vaultPath, filename);
    
    fs.writeFileSync(filePath, result.content);
    console.log(`✅ Content saved to: ${filename}`);
    console.log('💡 Run "npm run sync-obsidian" to sync it to your blog');
  }
  
} catch (error) {
  console.error('❌ Error generating content:', error.message);
  process.exit(1);
}
