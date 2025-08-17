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
    // Use the agent's saveContent method which saves to ai-generated folder
    const contentType = agent.detectContentType(prompt);
    const saveResult = agent.saveContent(result.content, outputFile, contentType, prompt);
    console.log(`✅ Content saved to: ${saveResult.saveLocation}`);
    console.log(`📁 Content type: ${saveResult.contentType}`);
    console.log(`💡 Suggested destination: ${saveResult.suggestedFolder}`);
    console.log(`� To move: mv "${saveResult.saveLocation}" "${saveResult.suggestedFolder}"`);
  }
  
} catch (error) {
  console.error('❌ Error generating content:', error.message);
  process.exit(1);
}
