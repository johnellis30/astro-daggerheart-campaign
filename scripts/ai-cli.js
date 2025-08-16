import agent from './campaign-ai-agent.js';
import readline from 'readline';
import fs from 'fs';
import path from 'path';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

let lastGeneratedContent = null;

console.log('🎲 D&D Campaign AI Agent');
console.log('=========================\n');

if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
  console.log('⚠️  Please set your OPENAI_API_KEY in the .env file first!');
  process.exit(1);
}

console.log('Available commands:');
console.log('  📝 generate <prompt> - Generate new content based on your campaign');
console.log('  💾 save <filename> - Save last generated content to your vault');
console.log('  📋 list [category] - List knowledge base files');
console.log('  🔍 search <term> - Search existing campaign content');
console.log('  🔄 reload - Reload knowledge base from synced files');
console.log('  ❌ exit - Exit the agent\n');

console.log('💡 Examples:');
console.log('  • generate Create a new NPC tavern owner for Riverbend');
console.log('  • generate Design a side quest involving the Silverstream River');
console.log('  • generate Write a description for a haunted forest near Eldoria\n');

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
        console.log('\n💡 Use "save <filename>" to save this content to your vault');
        break;

      case 'save':
      case 's':
        if (!lastGeneratedContent) {
          console.log('❌ No content to save. Generate some content first.');
          break;
        }
        
        if (!argument) {
          console.log('❌ Please provide a filename. Example: save NEW_NPC_TAVERN_KEEPER.md');
          break;
        }
        
        let filename = argument;
        if (!filename.endsWith('.md')) {
          filename += '.md';
        }
        
        const vaultPath = 'C:/Users/johnd/OneDrive/Documents/Obsidian Vault';
        const filePath = path.join(vaultPath, filename);
        
        fs.writeFileSync(filePath, lastGeneratedContent);
        console.log(`✅ Content saved to: ${filename}`);
        console.log('💡 Run "npm run sync-obsidian" to sync it to your blog');
        break;

      case 'list':
      case 'l':
        agent.listFiles(argument || null);
        break;

      case 'search':
        if (!argument) {
          console.log('❌ Please provide a search term. Example: search Riverbend');
          break;
        }
        agent.searchContent(argument);
        break;

      case 'reload':
      case 'r':
        agent.loadKnowledgeBase();
        break;

      case 'help':
      case 'h':
        console.log('\n📝 generate <prompt> - Generate new content');
        console.log('💾 save <filename> - Save last generated content');
        console.log('📋 list [category] - List files (categories: character, location, adventure, monster, item, environment, campaign, misc)');
        console.log('🔍 search <term> - Search existing content');
        console.log('🔄 reload - Reload knowledge base');
        console.log('❌ exit - Exit the agent\n');
        break;

      case 'exit':
      case 'quit':
      case 'q':
        console.log('👋 Goodbye! Happy campaigning!');
        rl.close();
        process.exit(0);
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
