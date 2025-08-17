import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import OpenAI from 'openai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Configuration
const CONTENT_DIRS = [
  path.join(__dirname, '../src/content/characters'),
  path.join(__dirname, '../src/content/locations'),
  path.join(__dirname, '../src/content/adventures'),
  path.join(__dirname, '../src/content/monsters'),
  path.join(__dirname, '../src/content/items'),
  path.join(__dirname, '../src/content/campaign'),
  path.join(__dirname, '../src/content/environments')
];
const REFERENCE_DOCS_DIR = path.join(__dirname, '../reference-docs');
const AI_GENERATED_DIR = path.join(__dirname, '../ai-generated');
const VAULT_PATH = 'C:/Users/johnd/OneDrive/Documents/Obsidian Vault';
const PROJECT_CONTENT_DIRS = {
  'character': path.join(__dirname, '../src/content/characters'),
  'location': path.join(__dirname, '../src/content/locations'),
  'adventure': path.join(__dirname, '../src/content/adventures'),
  'monster': path.join(__dirname, '../src/content/monsters'),
  'item': path.join(__dirname, '../src/content/items'),
  'environment': path.join(__dirname, '../src/content/environments'),
  'campaign': path.join(__dirname, '../src/content/campaign')
};
const AI_MODEL = process.env.AI_MODEL || 'gpt-4-turbo-preview';
const AI_TEMPERATURE = parseFloat(process.env.AI_TEMPERATURE) || 0.7;
const AI_MAX_TOKENS = parseInt(process.env.AI_MAX_TOKENS) || 2000;

class CampaignAIAgent {
  constructor() {
    this.knowledgeBase = new Map();
    this.initialized = false;
    this.initializeAsync();
  }

  async initializeAsync() {
    await this.loadKnowledgeBase();
    this.initialized = true;
  }

  async ensureInitialized() {
    if (!this.initialized) {
      await this.initializeAsync();
    }
  }

  // Load all markdown files and reference documents into knowledge base
  async loadKnowledgeBase() {
    console.log('🧠 Loading campaign knowledge base from organized content directories...');
    
    this.knowledgeBase.clear();
    
    // Load organized campaign content
    CONTENT_DIRS.forEach(contentDir => {
      if (!fs.existsSync(contentDir)) {
        console.log(`⚠️  Content directory not found: ${contentDir}`);
        return;
      }

      const dirName = path.basename(contentDir);
      console.log(`  Loading ${dirName}...`);
      
      const files = fs.readdirSync(contentDir);
      
      files
        .filter(file => path.extname(file) === '.md')
        .forEach(file => {
          const filePath = path.join(contentDir, file);
          const content = fs.readFileSync(filePath, 'utf8');
          const filename = path.basename(file, '.md');
          
          // Extract key information
          const { title, description, tags, body } = this.parseMarkdownFile(content);
          
          this.knowledgeBase.set(`${dirName}/${filename}`, {
            filename,
            title,
            description,
            tags,
            content: body,
            fullPath: filePath,
            category: dirName,
            type: this.getContentType(dirName),
            source: 'campaign-content'
          });
        });
    });

    // Load reference documents
    await this.loadReferenceDocuments();

    console.log(`✅ Loaded ${this.knowledgeBase.size} files into knowledge base`);
  }

  // Load reference documents (PDFs, text files, etc.)
  async loadReferenceDocuments() {
    if (!fs.existsSync(REFERENCE_DOCS_DIR)) {
      console.log('📚 No reference-docs directory found, skipping reference documents');
      return;
    }

    console.log('📚 Loading reference documents...');
    const files = fs.readdirSync(REFERENCE_DOCS_DIR);
    let successCount = 0;
    let skipCount = 0;
    
    for (const file of files) {
      const filePath = path.join(REFERENCE_DOCS_DIR, file);
      
      try {
        const fileStats = fs.statSync(filePath);
        
        if (fileStats.isFile()) {
          const ext = path.extname(file).toLowerCase();
          const filename = path.basename(file, ext);
          
          let content = '';
          let title = filename.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          
          if (ext === '.pdf') {
            console.log(`  Indexing PDF: ${file}...`);
            // Just index the PDF metadata without parsing content
            content = `Reference Document: ${title}
            
This is a PDF reference document available for the campaign. The AI can reference this document when generating content that might benefit from official rules, guidelines, or reference material contained within.

File: ${file}
Type: PDF Reference Document`;
          } else if (ext === '.txt') {
            console.log(`  Loading text file: ${file}...`);
            content = fs.readFileSync(filePath, 'utf8');
          } else if (ext === '.md') {
            console.log(`  Loading markdown file: ${file}...`);
            const markdownContent = fs.readFileSync(filePath, 'utf8');
            const parsed = this.parseMarkdownFile(markdownContent);
            title = parsed.title || title;
            content = parsed.body;
          } else {
            continue; // Skip unsupported file types
          }
          
          // Split large documents into chunks for better processing
          const chunks = this.chunkLargeDocument(content, filename, title);
          chunks.forEach((chunk, index) => {
            const chunkKey = chunks.length > 1 ? `reference/${filename}-chunk${index + 1}` : `reference/${filename}`;
            
            this.knowledgeBase.set(chunkKey, {
              filename: chunks.length > 1 ? `${filename} (Part ${index + 1})` : filename,
              title: chunks.length > 1 ? `${title} (Part ${index + 1})` : title,
              description: `Reference document: ${file}`,
              tags: ['reference', 'rulebook', 'guide'],
              content: chunk.content,
              fullPath: filePath,
              category: 'reference',
              type: 'reference',
              source: 'reference-document',
              fileType: ext.slice(1),
              chunkIndex: index,
              totalChunks: chunks.length
            });
          });
        }
      } catch (error) {
        console.log(`  ⚠️  Error processing file ${file}: ${error.message}`);
      }
    }
  }

  // Split large documents into manageable chunks
  chunkLargeDocument(content, filename, title, maxChunkSize = 4000) {
    if (content.length <= maxChunkSize) {
      return [{ content, title, filename }];
    }

    const chunks = [];
    const paragraphs = content.split('\n\n');
    let currentChunk = '';
    let chunkIndex = 0;

    for (const paragraph of paragraphs) {
      if (currentChunk.length + paragraph.length > maxChunkSize && currentChunk.length > 0) {
        chunks.push({
          content: currentChunk.trim(),
          title: `${title} (Part ${chunkIndex + 1})`,
          filename: `${filename}-chunk${chunkIndex + 1}`
        });
        currentChunk = paragraph;
        chunkIndex++;
      } else {
        currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
      }
    }

    if (currentChunk.trim()) {
      chunks.push({
        content: currentChunk.trim(),
        title: chunks.length > 0 ? `${title} (Part ${chunkIndex + 1})` : title,
        filename: chunks.length > 0 ? `${filename}-chunk${chunkIndex + 1}` : filename
      });
    }

    return chunks;
  }

  // Parse markdown file and extract metadata
  parseMarkdownFile(content) {
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    
    if (!frontmatterMatch) {
      return {
        title: 'Untitled',
        description: '',
        tags: [],
        body: content
      };
    }

    const frontmatter = frontmatterMatch[1];
    const body = frontmatterMatch[2];

    const title = this.extractFrontmatterField(frontmatter, 'title') || 'Untitled';
    const description = this.extractFrontmatterField(frontmatter, 'description') || '';
    const tagsString = this.extractFrontmatterField(frontmatter, 'tags') || '[]';
    
    let tags = [];
    try {
      tags = JSON.parse(tagsString.replace(/'/g, '"'));
    } catch {
      tags = tagsString.split(',').map(t => t.trim()).filter(t => t);
    }

    return { title, description, tags, body };
  }

  // Extract field from frontmatter
  extractFrontmatterField(frontmatter, field) {
    const match = frontmatter.match(new RegExp(`${field}:\\s*["']?(.*?)["']?$`, 'm'));
    return match ? match[1].trim() : null;
  }

  // Detect content type from prompt
  detectContentType(prompt) {
    const promptLower = prompt.toLowerCase();
    
    // Check for explicit type mentions
    if (promptLower.includes('npc') || promptLower.includes('character')) return 'character';
    if (promptLower.includes('location') || promptLower.includes('place') || promptLower.includes('town') || promptLower.includes('city')) return 'location';
    if (promptLower.includes('adventure') || promptLower.includes('quest') || promptLower.includes('mission')) return 'adventure';
    if (promptLower.includes('monster') || promptLower.includes('creature') || promptLower.includes('beast') || promptLower.includes('adversary')) return 'monster';
    if (promptLower.includes('item') || promptLower.includes('artifact') || promptLower.includes('weapon') || promptLower.includes('armor') || promptLower.includes('loot')) return 'item';
    if (promptLower.includes('environment') || promptLower.includes('terrain') || promptLower.includes('biome')) return 'environment';
    if (promptLower.includes('campaign') || promptLower.includes('lore') || promptLower.includes('history') || promptLower.includes('background')) return 'campaign';
    
    // Check for creation verbs that might indicate type
    if (promptLower.match(/create.*(?:npc|character|person|villager|merchant|guard)/)) return 'character';
    if (promptLower.match(/create.*(?:location|place|town|city|dungeon|temple)/)) return 'location';
    if (promptLower.match(/create.*(?:adventure|quest|mission|scenario)/)) return 'adventure';
    if (promptLower.match(/create.*(?:monster|creature|beast|enemy)/)) return 'monster';
    if (promptLower.match(/create.*(?:item|artifact|weapon|armor|treasure)/)) return 'item';
    
    // Default fallback
    return 'campaign';
  }

  // Smart save function that saves to ai-generated folder for manual review
  saveContent(content, filename = null, contentType = null, prompt = null) {
    // Detect content type if not provided
    if (!contentType && prompt) {
      contentType = this.detectContentType(prompt);
    }
    
    // Generate filename if not provided
    if (!filename) {
      const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '');
      const timeHMS = new Date().toISOString().split('T')[1].split('.')[0].replace(/:/g, '');
      const typePrefix = contentType ? contentType.toUpperCase() : 'CONTENT';
      filename = `${typePrefix}_${timestamp}_${timeHMS}_AI_GENERATED.md`;
    }
    
    // Ensure .md extension
    if (!filename.endsWith('.md')) {
      filename += '.md';
    }
    
    // Always save to ai-generated folder for manual review
    const savePath = path.join(AI_GENERATED_DIR, filename);
    const saveLocation = `ai-generated/${filename}`;
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(AI_GENERATED_DIR)) {
      fs.mkdirSync(AI_GENERATED_DIR, { recursive: true });
    }
    
    // Save the file
    fs.writeFileSync(savePath, content);
    
    return {
      filename,
      savePath,
      saveLocation,
      contentType,
      suggestedFolder: contentType ? `src/content/${contentType}s/` : 'src/content/campaign/'
    };
  }

  // Get content type from directory name
  getContentType(dirName) {
    const typeMap = {
      'characters': 'character',
      'locations': 'location', 
      'adventures': 'adventure',
      'monsters': 'monster',
      'items': 'item',
      'environments': 'environment',
      'campaign': 'campaign'
    };
    return typeMap[dirName] || 'misc';
  }

  // Categorize files based on filename patterns (legacy support)
  categorizeFile(filename) {
    if (filename.startsWith('NPC_')) return 'character';
    if (filename.startsWith('LOCATION_')) return 'location';
    if (filename.startsWith('ACT') || filename.includes('SUB')) return 'adventure';
    if (filename.startsWith('ADVERSARY_')) return 'monster';
    if (filename.startsWith('LOOT_')) return 'item';
    if (filename.startsWith('ENVIRONMENT_')) return 'environment';
    if (filename.includes('CAMPAIGN') || filename.includes('OVERVIEW')) return 'campaign';
    return 'misc';
  }

  // Get relevant context for a prompt
  getRelevantContext(prompt, maxFiles = 5) {
    const promptLower = prompt.toLowerCase();
    const relevantFiles = [];

    // Score files based on relevance
    for (const [filename, data] of this.knowledgeBase) {
      let score = 0;
      
      // Check title and description
      if (data.title.toLowerCase().includes(promptLower)) score += 10;
      if (data.description.toLowerCase().includes(promptLower)) score += 5;
      
      // Check content
      const contentMatches = (data.content.toLowerCase().match(new RegExp(promptLower, 'g')) || []).length;
      score += contentMatches;
      
      // Check tags
      data.tags.forEach(tag => {
        if (promptLower.includes(tag.toLowerCase())) score += 3;
      });
      
      // Boost certain categories based on prompt keywords
      if (promptLower.includes('npc') || promptLower.includes('character')) {
        if (data.category === 'character') score += 5;
      }
      if (promptLower.includes('location') || promptLower.includes('place')) {
        if (data.category === 'location') score += 5;
      }
      if (promptLower.includes('adventure') || promptLower.includes('quest')) {
        if (data.category === 'adventure') score += 5;
      }
      
      if (score > 0) {
        relevantFiles.push({ ...data, score });
      }
    }

    // Sort by relevance and return top files
    return relevantFiles
      .sort((a, b) => b.score - a.score)
      .slice(0, maxFiles);
  }

  // Generate content using OpenAI
  async generateContent(prompt, outputFile = null) {
    await this.ensureInitialized();
    
    try {
      console.log('🤖 Generating content with AI...');
      
      // Get relevant context
      const relevantFiles = this.getRelevantContext(prompt);
      
      // Build context string
      let contextString = '';
      if (relevantFiles.length > 0) {
        contextString = '\\n\\nRelevant campaign context:\\n';
        relevantFiles.forEach(file => {
          contextString += `\\n**${file.title}** (${file.category}):\\n`;
          contextString += `${file.content.substring(0, 500)}...\\n`;
        });
      }

      // Build system prompt
      const systemPrompt = `You are an expert D&D campaign creator and worldbuilder. You have access to an existing campaign's content and should use it to create consistent, immersive content that fits the established world.

Campaign Setting: This appears to be a fantasy campaign involving the Atherian Empire, locations like Riverbend and Eldoria, and various NPCs and adventures.

Available Reference Materials: You have access to reference documents including PDFs like the Daggerheart SRD, Equipment Sheets, Age of Umbra Adversaries, and other campaign materials. When relevant to the request, mention that players should "consult [specific document]" for detailed rules or mechanics.

When creating content:
1. Maintain consistency with existing lore and characters
2. Use appropriate Daggerheart mechanics and terminology where applicable
3. Create engaging, detailed descriptions
4. Reference available documents when players need detailed mechanics
5. Format content as markdown with proper frontmatter for an Astro blog

Always include proper frontmatter with:
- title: A descriptive title
- description: Brief summary
- pubDate: Today's date (${new Date().toISOString().split('T')[0]})
- tags: Relevant tags like ["daggerheart", "campaign", plus specific tags]`;

      const userPrompt = `${prompt}${contextString}`;

      const response = await openai.chat.completions.create({
        model: AI_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: AI_TEMPERATURE,
        max_tokens: AI_MAX_TOKENS
      });

      const generatedContent = response.choices[0].message.content;

      // Smart save to appropriate directory
      let saveResult = null;
      if (outputFile) {
        const contentType = this.detectContentType(prompt);
        saveResult = this.saveContent(generatedContent, outputFile, contentType, prompt);
        console.log(`✅ Content saved to: ${saveResult.saveLocation}`);
        console.log(`📁 Content type: ${saveResult.contentType}`);
        console.log(`💡 Suggested destination: ${saveResult.suggestedFolder}`);
        console.log(`🔧 To move: mv "${saveResult.saveLocation}" "${saveResult.suggestedFolder}"`);
      }

      return {
        content: generatedContent,
        relevantFiles: relevantFiles.map(f => ({ title: f.title, category: f.category })),
        tokensUsed: response.usage?.total_tokens || 0,
        saveResult: saveResult
      };

    } catch (error) {
      console.error('❌ Error generating content:', error.message);
      throw error;
    }
  }

  // Generate image using DALL-E
  async generateImage(prompt, outputFilename = null, style = 'fantasy') {
    await this.ensureInitialized();
    
    try {
      console.log('🎨 Generating image with DALL-E...');
      
      // Enhance prompt for D&D fantasy style
      const enhancedPrompt = `${prompt}, fantasy art style, detailed, cinematic lighting, digital painting, concept art for dungeons and dragons campaign`;
      
      console.log(`🖼️  Image prompt: "${enhancedPrompt}"`);
      
      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt: enhancedPrompt,
        n: 1,
        size: "1024x1024",
        quality: "standard",
        response_format: "url"
      });

      const imageUrl = response.data[0].url;
      
      // Download and save the image
      if (outputFilename) {
        const imageResponse = await fetch(imageUrl);
        const arrayBuffer = await imageResponse.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        // Generate filename if not provided
        let filename = outputFilename;
        if (!filename.includes('.')) {
          const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '');
          const timeHMS = new Date().toISOString().split('T')[1].split('.')[0].replace(/:/g, '');
          filename = `${filename}_${timestamp}_${timeHMS}.png`;
        }
        
        // Save to ai-generated folder
        const savePath = path.join(AI_GENERATED_DIR, filename);
        
        // Create directory if it doesn't exist
        if (!fs.existsSync(AI_GENERATED_DIR)) {
          fs.mkdirSync(AI_GENERATED_DIR, { recursive: true });
        }
        
        fs.writeFileSync(savePath, buffer);
        
        return {
          imageUrl,
          localPath: savePath,
          filename,
          saveLocation: `ai-generated/${filename}`,
          suggestedFolder: 'public/images/'
        };
      }
      
      return {
        imageUrl,
        message: 'Image generated successfully! Use the URL to download manually.'
      };

    } catch (error) {
      console.error('❌ Error generating image:', error.message);
      throw error;
    }
  }

  // Generate both content and image for campaign elements
  async generateContentWithImage(prompt, contentFilename = null, imageFilename = null) {
    await this.ensureInitialized();
    
    try {
      console.log('🎲 Generating content and image...');
      
      // Generate text content first
      const contentResult = await this.generateContent(prompt, contentFilename);
      
      // Generate complementary image
      const imagePrompt = `${prompt}, showing the subject described in the text content`;
      const imageResult = await this.generateImage(imagePrompt, imageFilename);
      
      return {
        content: contentResult,
        image: imageResult,
        combined: true
      };

    } catch (error) {
      console.error('❌ Error generating content with image:', error.message);
      throw error;
    }
  }

  // Interactive CLI mode
  async startInteractiveMode() {
    console.log('🎲 Campaign AI Agent - Interactive Mode');
    console.log('=====================================\\n');
    
    console.log('Available commands:');
    console.log('  • generate <prompt> - Generate new content');
    console.log('  • save <filename> - Save last generated content');
    console.log('  • list [category] - List knowledge base files');
    console.log('  • search <term> - Search existing content');
    console.log('  • reload - Reload knowledge base');
    console.log('  • exit - Exit the agent\\n');

    // This would need a proper CLI interface, but for now we'll make it callable
    console.log('💡 To use: import and call methods directly or extend with readline interface');
  }

  // List files in knowledge base
  async listFiles(category = null) {
    await this.ensureInitialized();
    
    const files = Array.from(this.knowledgeBase.values());
    const filtered = category ? files.filter(f => f.category === category) : files;
    
    console.log(`\\n📋 Knowledge Base (${filtered.length} files):`);
    
    const categories = {};
    filtered.forEach(file => {
      if (!categories[file.category]) categories[file.category] = [];
      categories[file.category].push(file);
    });

    Object.entries(categories).forEach(([cat, fileList]) => {
      console.log(`\\n${cat.toUpperCase()}:`);
      fileList.forEach(file => {
        console.log(`  • ${file.title}`);
      });
    });
  }

  // Search existing content
  async searchContent(searchTerm) {
    await this.ensureInitialized();
    
    const results = this.getRelevantContext(searchTerm, 10);
    
    console.log(`\\n🔍 Search results for "${searchTerm}":`);
    results.forEach((result, index) => {
      console.log(`\\n${index + 1}. **${result.title}** (${result.category}) - Score: ${result.score}`);
      console.log(`   ${result.description}`);
    });

    return results;
  }
}

// Export the class and create a default instance
const agent = new CampaignAIAgent();

export default agent;
export { CampaignAIAgent };
