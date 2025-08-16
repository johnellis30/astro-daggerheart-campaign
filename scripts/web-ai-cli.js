import webAI from './web-content-ai.js';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🌐 Web-Optimized D&D Content Generator');
console.log('=====================================\n');

if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
  console.log('⚠️  Please set your OPENAI_API_KEY in the .env file first!');
  process.exit(1);
}

console.log('Available commands:');
console.log('  🧙 npc <description> [name] - Generate web-optimized NPC');
console.log('  🏰 location <description> [name] - Generate web-optimized location');
console.log('  ⚔️ adventure <description> [name] - Generate web-optimized adventure');
console.log('  👹 monster <description> [name] - Generate web-optimized monster');
console.log('  📝 general <description> [filename] - Generate general content');
console.log('  ❌ exit - Exit the generator\n');

console.log('💡 Examples:');
console.log('  • npc A gruff tavern owner who secretly helps the resistance "Gareth Ironmug"');
console.log('  • location A haunted forest with ancient elven ruins "Shadowmere Woods"');
console.log('  • adventure A mystery involving missing caravans "The Vanishing Road"');
console.log('  • monster A corrupted forest spirit that guards cursed treasure "Blight Dryad"\n');

function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

function parseCommand(input) {
  const parts = input.trim().split(' ');
  const command = parts[0];
  
  // Find quoted name if present
  const quotedMatch = input.match(/"([^"]+)"/);
  const name = quotedMatch ? quotedMatch[1] : null;
  
  // Get description (everything except command and quoted name)
  let description = parts.slice(1).join(' ');
  if (name) {
    description = description.replace(`"${name}"`, '').trim();
  }
  
  return { command: command.toLowerCase(), description, name };
}

async function handleCommand(input) {
  const { command, description, name } = parseCommand(input);

  if (!description && !['exit', 'quit', 'help', 'h'].includes(command)) {
    console.log('❌ Please provide a description. Example: npc A mysterious merchant "Valdris"');
    return;
  }

  try {
    let result;
    
    switch (command) {
      case 'npc':
      case 'character':
        console.log('🧙 Generating NPC...');
        result = await webAI.generateNPC(description, name);
        break;

      case 'location':
      case 'place':
        console.log('🏰 Generating location...');
        result = await webAI.generateLocation(description, name);
        break;

      case 'adventure':
      case 'quest':
        console.log('⚔️ Generating adventure...');
        result = await webAI.generateAdventure(description, name);
        break;

      case 'monster':
      case 'creature':
        console.log('👹 Generating monster...');
        result = await webAI.generateMonster(description, name);
        break;

      case 'general':
      case 'content':
        console.log('📝 Generating general content...');
        const filename = name || (description.split(' ').slice(0, 3).join('_').toLowerCase() + '.md');
        result = await webAI.generateWebContent(description, 'general', filename);
        break;

      case 'help':
      case 'h':
        console.log('\n🧙 npc <description> [name] - Generate NPC');
        console.log('🏰 location <description> [name] - Generate location');
        console.log('⚔️ adventure <description> [name] - Generate adventure');
        console.log('👹 monster <description> [name] - Generate monster');
        console.log('📝 general <description> [filename] - General content');
        console.log('❌ exit - Quit\n');
        console.log('💡 Use quotes for names: npc "A wise sage" "Arcanus the Elder"');
        return;

      case 'exit':
      case 'quit':
      case 'q':
        console.log('👋 Happy world-building!');
        rl.close();
        process.exit(0);
        break;

      default:
        console.log(`❌ Unknown command: ${command}`);
        console.log('💡 Type "help" for available commands');
        return;
    }

    if (result) {
      console.log('\n📄 Generated Content:');
      console.log('='.repeat(60));
      console.log(result.content);
      console.log('='.repeat(60));
      
      console.log(`\n📊 Used ${result.tokensUsed} tokens`);
      
      if (result.relevantFiles && result.relevantFiles.length > 0) {
        console.log('\n🔗 Referenced campaign files:');
        result.relevantFiles.forEach(file => {
          console.log(`  • ${file.title} (${file.category})`);
        });
      }
      
      console.log('\n✅ Content saved and ready for your static site!');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function main() {
  while (true) {
    const input = await prompt('\n🌐 > ');
    await handleCommand(input);
  }
}

main().catch(console.error);
