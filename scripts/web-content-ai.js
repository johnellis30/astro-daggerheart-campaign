import agent from './campaign-ai-agent.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONTENT_DIR = path.join(__dirname, '../src/content/blog');

// Content templates for different types
const templates = {
  npc: {
    sections: ['Description', 'Appearance', 'Role & Responsibilities', 'Personality', 'Important Relationships', 'Adventure Hooks'],
    tags: ['npc', 'character', 'dnd', 'campaign']
  },
  location: {
    sections: ['Overview', 'Geography & Features', 'Settlements & Communities', 'Political Situation', 'Adventure Opportunities', 'Notable Features'],
    tags: ['location', 'worldbuilding', 'dnd', 'campaign']
  },
  adventure: {
    sections: ['Overview', 'Background', 'Adventure Hooks', 'Key Locations', 'Important NPCs', 'Encounters', 'Rewards'],
    tags: ['adventure', 'quest', 'dnd', 'campaign']
  },
  monster: {
    sections: ['Description', 'Behavior', 'Habitat', 'Combat Tactics', 'Lore', 'Stat Block'],
    tags: ['monster', 'combat', 'dnd', 'campaign']
  }
};

class WebOptimizedAI {
  constructor() {
    this.agent = agent;
  }

  async generateWebContent(prompt, contentType = 'general', filename = null) {
    console.log('🎯 Generating web-optimized content...');
    
    // Build enhanced prompt for web display
    const webPrompt = this.buildWebPrompt(prompt, contentType);
    
    try {
      const result = await this.agent.generateContent(webPrompt);
      
      // Post-process the content for better web formatting
      const optimizedContent = this.optimizeForWeb(result.content, contentType);
      
      if (filename) {
        await this.saveWebContent(optimizedContent, filename);
      }
      
      return {
        ...result,
        content: optimizedContent
      };
      
    } catch (error) {
      console.error('❌ Error generating web content:', error.message);
      throw error;
    }
  }

  buildWebPrompt(basePrompt, contentType) {
    const template = templates[contentType];
    
    let webPrompt = `${basePrompt}

IMPORTANT: Format this content specifically for a static website, not Obsidian. 

Requirements:
1. Use proper markdown frontmatter with title, description, pubDate, tags, and heroImage
2. Remove ALL Obsidian-style links like [[Link|Text]] - use standard markdown links instead
3. Use clear headings (##, ###) for better web navigation
4. Include rich descriptions and detailed sections
5. Add italicized subtitles under main headings
6. Use bullet points and formatting for readability
7. End with a separator line and italicized campaign note`;

    if (template) {
      webPrompt += `
8. Structure the content with these sections: ${template.sections.join(', ')}
9. Use these tags: ${template.tags.join(', ')}`;
    }

    webPrompt += `
10. Choose an appropriate heroImage from: /blog-placeholder-1.jpg, /blog-placeholder-2.jpg, /blog-placeholder-3.jpg, /blog-placeholder-4.jpg, /blog-placeholder-5.jpg, or /blog-placeholder-about.jpg

Example frontmatter format:
---
title: "Character/Location Name"
description: "Brief engaging description"
pubDate: ${new Date().toISOString().split('T')[0]}
tags: ["appropriate", "tags", "here"]
heroImage: "/blog-placeholder-1.jpg"
---`;

    return webPrompt;
  }

  optimizeForWeb(content, contentType) {
    let optimized = content;
    
    // Remove any remaining Obsidian links
    optimized = optimized.replace(/\[\[([^\]|]+)(\|([^\]]+))?\]\]/g, (match, link, pipe, text) => {
      return text || link;
    });
    
    // Ensure proper spacing around headings
    optimized = optimized.replace(/^(#{1,6}\s+.+)$/gm, '\n$1\n');
    
    // Add italicized subtitles after main headings where missing
    optimized = optimized.replace(/^(#\s+.+)\n(?!\*)/gm, '$1\n*Campaign Content*\n');
    
    return optimized.trim();
  }

  async saveWebContent(content, filename) {
    // Determine subdirectory based on content type
    let subdir = 'obsidian'; // default
    
    if (filename.toLowerCase().includes('npc_') || filename.toLowerCase().includes('character_')) {
      subdir = 'characters';
    } else if (filename.toLowerCase().includes('location_')) {
      subdir = 'locations';
    } else if (filename.toLowerCase().includes('adventure_') || filename.toLowerCase().includes('quest_')) {
      subdir = 'adventures';
    } else if (filename.toLowerCase().includes('monster_') || filename.toLowerCase().includes('adversary_')) {
      subdir = 'monsters';
    }
    
    const targetDir = path.join(CONTENT_DIR, subdir);
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    
    // Ensure .md extension
    if (!filename.endsWith('.md')) {
      filename += '.md';
    }
    
    const filepath = path.join(targetDir, filename);
    fs.writeFileSync(filepath, content);
    
    console.log(`✅ Web content saved to: ${subdir}/${filename}`);
    return filepath;
  }

  async generateNPC(prompt, name = null) {
    const filename = name ? `${name.toLowerCase().replace(/\s+/g, '_')}.md` : null;
    return await this.generateWebContent(prompt, 'npc', filename);
  }

  async generateLocation(prompt, name = null) {
    const filename = name ? `${name.toLowerCase().replace(/\s+/g, '_')}.md` : null;
    return await this.generateWebContent(prompt, 'location', filename);
  }

  async generateAdventure(prompt, name = null) {
    const filename = name ? `${name.toLowerCase().replace(/\s+/g, '_')}.md` : null;
    return await this.generateWebContent(prompt, 'adventure', filename);
  }

  async generateMonster(prompt, name = null) {
    const filename = name ? `${name.toLowerCase().replace(/\s+/g, '_')}.md` : null;
    return await this.generateWebContent(prompt, 'monster', filename);
  }
}

const webAI = new WebOptimizedAI();
export default webAI;
