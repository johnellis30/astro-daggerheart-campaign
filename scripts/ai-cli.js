import agent from './campaign-ai-agent.js';
import readline from 'readline';
import fs from 'fs';
import path from 'path';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

let lastGeneratedContent = null;
let lastPrompt = null;

console.log('🎲 D&D Campaign AI Agent');
console.log('=========================\n');

if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
  console.log('⚠️  Please set your OPENAI_API_KEY in the .env file first!');
  process.exit(1);
}

console.log('Available commands:');
console.log('  📝 generate <prompt> - Generate new content based on your campaign');
console.log('  🎨 image <prompt> [filename] - Generate image using DALL-E 3');
console.log('  🎲 both <prompt> [content-file] [image-file] - Generate both content and image');
console.log('  💾 save <filename> - Save last generated content to organized directories');
console.log('  📋 list [category] - List knowledge base files (includes reference docs)');
console.log('  🔍 search <term> - Search existing campaign content and references');
console.log('  🔄 reload - Reload knowledge base from content directories and reference docs');
console.log('  ❌ exit - Exit the agent\n');

console.log('💡 Examples:');
console.log('  • generate Create a new NPC tavern owner for Riverbend');
console.log('  • image A mysterious hooded figure in a tavern');
console.log('  • both Design a haunted watchtower near Riverbend');
console.log('  • generate Design a side quest involving the Silverstream River');
console.log('  • generate Write a description for a haunted forest near Eldoria');
console.log('  • list reference - Show loaded reference documents\n');

console.log('📚 Reference Documents:');
console.log('  • Place PDF files in the reference-docs/ directory');
console.log('  • Supported formats: PDF, TXT, MD');
console.log('  • Reference materials are automatically indexed for AI context\n');

function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

async function handleCommand(input) {
  const [command, ...args] = input.trim().split(' ');
  const argument = args.join(' ');

  try {
    switch (command.toLowerCase()) {
      case 'generate':
      case 'g':
        if (!argument) {
          console.log('❌ Please provide a prompt. Example: generate Create a new NPC for Riverbend');
          break;
        }
        
        console.log('🤖 Generating content...');
        const result = await agent.generateContent(argument);
        
        console.log('\n📄 Generated Content:');
        console.log('=' .repeat(50));
        console.log(result.content);
        console.log('=' .repeat(50));
        
        console.log(`\n📊 Used ${result.tokensUsed} tokens`);
        
        if (result.relevantFiles.length > 0) {
          console.log('\n🔗 Referenced files:');
          result.relevantFiles.forEach(file => {
            console.log(`  • ${file.title} (${file.category})`);
          });
        }
        
        lastGeneratedContent = result.content;
        lastPrompt = argument;
        console.log('\n💡 Use "save <filename>" to save this content to the organized directory structure');
        console.log('💡 Or use "save" without filename to auto-generate filename and location');
        break;

      case 'save':
      case 's':
        if (!lastGeneratedContent) {
          console.log('❌ No content to save. Generate some content first.');
          break;
        }
        
        let saveResult;
        if (!argument) {
          // Auto-generate filename and save to appropriate directory
          saveResult = agent.saveContent(lastGeneratedContent, null, null, lastPrompt);
          console.log(`✅ Content auto-saved to: ${saveResult.saveLocation}`);
          console.log(`📁 Content type: ${saveResult.contentType}`);
          console.log(`📝 Filename: ${saveResult.filename}`);
        } else {
          // Use provided filename
          let filename = argument;
          if (!filename.endsWith('.md')) {
            filename += '.md';
          }
          
          const contentType = agent.detectContentType(lastPrompt || '');
          saveResult = agent.saveContent(lastGeneratedContent, filename, contentType, lastPrompt);
          console.log(`✅ Content saved to: ${saveResult.saveLocation}`);
          console.log(`📁 Content type: ${saveResult.contentType}`);
        }
        
        console.log('💡 Content is now part of your organized campaign structure and ready for the website!');
        break;

      case 'list':
      case 'l':
        await agent.listFiles(argument || null);
        break;

      case 'search':
        if (!argument) {
          console.log('❌ Please provide a search term. Example: search Riverbend');
          break;
        }
        await agent.searchContent(argument);
        break;

      case 'reload':
      case 'r':
        console.log('🔄 Reloading knowledge base...');
        await agent.loadKnowledgeBase();
        console.log('✅ Knowledge base reloaded');
        break;

      case 'help':
      case 'h':
        console.log('\n📝 generate <prompt> - Generate new content');
        console.log('💾 save <filename> - Save last generated content');
        console.log('📋 list [category] - List files (categories: character, location, adventure, monster, item, environment, campaign, reference)');
        console.log('🔍 search <term> - Search existing content and reference documents');
        console.log('🔄 reload - Reload knowledge base including reference docs');
        console.log('❌ exit - Exit the agent\n');
        break;

      case 'exit':
      case 'quit':
      case 'q':
        console.log('👋 Goodbye! Happy campaigning!');
        rl.close();
        process.exit(0);
        break;

      case 'image':
      case 'img':
        if (!argument) {
          console.log('❌ Please provide a prompt. Example: image A mysterious tavern keeper');
          break;
        }
        
        console.log('🎨 Generating image...');
        const parts = argument.split(' ');
        const filename = parts.length > 3 ? parts.pop() : null;
        const imagePrompt = filename ? parts.join(' ') : argument;
        
        const imageResult = await agent.generateImage(imagePrompt, filename);
        
        console.log('\n🖼️  Image Generated:');
        console.log('=' .repeat(50));
        console.log(`🌐 URL: ${imageResult.imageUrl}`);
        if (imageResult.localPath) {
          console.log(`📁 Saved to: ${imageResult.saveLocation}`);
          console.log(`💡 Suggested destination: ${imageResult.suggestedFolder}`);
        }
        console.log('=' .repeat(50));
        
        lastGeneratedContent = `![Generated Image](${imageResult.imageUrl})`;
        break;

      case 'both':
      case 'content+image':
        if (!argument) {
          console.log('❌ Please provide a prompt. Example: both Create a mysterious merchant NPC');
          break;
        }
        
        console.log('🎲 Generating content and image...');
        const bothResult = await agent.generateContentWithImage(argument);
        
        console.log('\n📄 Generated Content:');
        console.log('=' .repeat(50));
        console.log(bothResult.content.content);
        console.log('=' .repeat(50));
        
        console.log('\n🖼️  Generated Image:');
        console.log('=' .repeat(50));
        console.log(`🌐 URL: ${bothResult.image.imageUrl}`);
        if (bothResult.image.localPath) {
          console.log(`📁 Image saved to: ${bothResult.image.saveLocation}`);
        }
        console.log('=' .repeat(50));
        
        console.log(`\n📊 Used ${bothResult.content.tokensUsed} tokens`);
        
        if (bothResult.content.relevantFiles.length > 0) {
          console.log('\n🔗 Referenced files:');
          bothResult.content.relevantFiles.forEach(file => {
            console.log(`  • ${file.title} (${file.category})`);
          });
        }
        
        lastGeneratedContent = bothResult.content.content;
        break;

      default:
        console.log(`❌ Unknown command: ${command}`);
        console.log('💡 Type "help" for available commands');
        break;
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function main() {
  while (true) {
    const input = await prompt('\n🎲 > ');
    await handleCommand(input);
  }
}

main().catch(console.error);
