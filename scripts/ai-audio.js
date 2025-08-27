#!/usr/bin/env node

import { CampaignAIAgent } from './campaign-ai-agent.js';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const agent = new CampaignAIAgent();

console.log('🎵 Campaign Audio Generator');
console.log('============================\n');

console.log('Available commands:');
console.log('  audio <description> - Generate a single sound effect');
console.log('  scene <scene description> - Generate sound effects for an entire scene');
console.log('  analyze <scene> - Analyze scene and suggest sound effects (no generation)');
console.log('  list - List available audio files');
console.log('  help - Show this help message');
console.log('  exit - Exit the generator\n');

console.log('Examples:');
console.log('  audio "sword clashing against shield"');
console.log('  scene "The party enters a dark dungeon with dripping water and distant echoes"');
console.log('  analyze "A tavern scene with adventurers planning their next quest"\n');

async function processCommand(input) {
  const [command, ...args] = input.trim().split(' ');
  const prompt = args.join(' ');

  try {
    switch (command.toLowerCase()) {
      case 'audio':
        if (!prompt) {
          console.log('❌ Please provide a sound description');
          console.log('   Example: audio "dragon roar echoing through mountains"');
          return;
        }
        await generateSingleAudio(prompt);
        break;

      case 'scene':
        if (!prompt) {
          console.log('❌ Please provide a scene description');
          console.log('   Example: scene "The party camps in a dark forest with owls hooting"');
          return;
        }
        await generateSceneAudio(prompt);
        break;

      case 'analyze':
        if (!prompt) {
          console.log('❌ Please provide a scene to analyze');
          console.log('   Example: analyze "A bustling marketplace in the morning"');
          return;
        }
        await analyzeScene(prompt);
        break;

      case 'list':
        await listAudioFiles();
        break;

      case 'help':
        showHelp();
        break;

      case 'exit':
        console.log('👋 Goodbye!');
        process.exit(0);
        break;

      default:
        console.log('❌ Unknown command. Type "help" for available commands.');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function generateSingleAudio(description) {
  console.log(`🎵 Generating audio for: "${description}"\n`);
  
  const result = await agent.generateAudio(description);
  
  console.log('✅ Audio generation complete!');
  console.log(`   File: ${result.filename}`);
  console.log(`   Path: ${result.localPath}`);
  
  if (result.publicPath) {
    console.log(`   Web path: ${result.publicPath}`);
  }
  
  if (result.soundPrompt) {
    console.log(`   Narration: "${result.soundPrompt}"`);
  }
  
  console.log();
}

async function generateSceneAudio(sceneDescription) {
  console.log(`🎬 Generating scene audio for: "${sceneDescription}"\n`);
  
  const result = await agent.generateSceneSoundEffects(sceneDescription);
  
  console.log('✅ Scene audio generation complete!\n');
  
  console.log('🎵 Generated Sound Effects:');
  result.soundEffects.forEach((effect, index) => {
    console.log(`   ${index + 1}. ${effect.description}`);
    console.log(`      File: ${effect.audio.filename}`);
    if (effect.audio.publicPath) {
      console.log(`      Web: ${effect.audio.publicPath}`);
    }
    console.log();
  });

  if (result.playlistSuggestion.length > 0) {
    console.log('🎼 Suggested Playlist:');
    result.playlistSuggestion.forEach((item, index) => {
      console.log(`   ${index + 1}. ${item.name} (${item.file})`);
    });
    console.log();
  }
}

async function analyzeScene(sceneDescription) {
  console.log(`🔍 Analyzing scene: "${sceneDescription}"\n`);
  
  const soundEffects = await agent.analyzeSoundEffects(sceneDescription);
  
  console.log('🎵 Suggested Sound Effects:');
  soundEffects.forEach((effect, index) => {
    console.log(`   ${index + 1}. ${effect}`);
  });
  
  console.log(`\n💡 To generate these effects, use:`);
  console.log(`   scene ${sceneDescription}`);
  console.log();
}

async function listAudioFiles() {
  const fs = await import('fs');
  const path = await import('path');
  const { fileURLToPath } = await import('url');
  
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const audioDir = path.join(__dirname, '../public/audio');
  
  if (!fs.existsSync(audioDir)) {
    console.log('📁 No audio directory found. Generate some audio first!\n');
    return;
  }
  
  const files = fs.readdirSync(audioDir);
  const audioFiles = files.filter(file => 
    ['.mp3', '.wav', '.ogg', '.m4a'].includes(path.extname(file).toLowerCase())
  );
  
  if (audioFiles.length === 0) {
    console.log('🔍 No audio files found in /public/audio/\n');
    return;
  }
  
  console.log(`🎵 Available Audio Files (${audioFiles.length}):\n`);
  
  audioFiles.forEach((file, index) => {
    const filePath = path.join(audioDir, file);
    const stats = fs.statSync(filePath);
    const size = (stats.size / 1024).toFixed(1); // KB
    const date = stats.mtime.toLocaleDateString();
    
    console.log(`   ${index + 1}. ${file}`);
    console.log(`      Size: ${size} KB | Modified: ${date}`);
    console.log(`      Web path: /audio/${file}`);
    console.log();
  });
}

function showHelp() {
  console.log('\n🎵 Campaign Audio Generator Help\n');
  
  console.log('COMMANDS:');
  console.log('  audio <description>   - Generate a single sound effect');
  console.log('  scene <description>   - Generate multiple effects for a scene');
  console.log('  analyze <description> - Suggest effects without generating');
  console.log('  list                  - Show all generated audio files');
  console.log('  help                  - Show this help');
  console.log('  exit                  - Quit the generator\n');
  
  console.log('SETUP:');
  console.log('  1. Get ElevenLabs API key from https://elevenlabs.io');
  console.log('  2. Add ELEVENLABS_API_KEY to your .env file');
  console.log('  3. Optionally set ELEVENLABS_VOICE_ID for preferred voice\n');
  
  console.log('EXAMPLES:');
  console.log('  audio "heavy rain on roof"');
  console.log('  audio "sword being unsheathed"');
  console.log('  scene "A peaceful forest clearing with birds chirping"');
  console.log('  scene "Battle scene with clashing weapons and war cries"\n');
}

async function main() {
  // Wait for agent initialization
  await agent.ensureInitialized();
  
  console.log('Ready! Type a command or "help" for assistance.\n');

  const askQuestion = () => {
    rl.question('🎵 > ', async (input) => {
      if (input.trim()) {
        await processCommand(input);
      }
      askQuestion(); // Continue the loop
    });
  };

  askQuestion();
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Goodbye!');
  rl.close();
  process.exit(0);
});

main().catch(console.error);
