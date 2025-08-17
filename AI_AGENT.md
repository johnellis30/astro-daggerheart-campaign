# Campaign AI Agent

This AI agent helps you create new D&D campaign content based on your existing Obsidian vault files. It uses OpenAI's API to generate consistent, contextually-aware content that fits your established campaign world.

## Setup

### 1. Get OpenAI API Key
1. Go to [OpenAI API Keys](https://platform.openai.com/api-keys)
2. Create a new API key
3. Copy the key

### 2. Configure Environment
1. Open `.env` file in your project root
2. Replace `your_openai_api_key_here` with your actual API key:
   ```
   OPENAI_API_KEY=sk-your-actual-api-key-here
   ```

### 3. Content is Ready
The AI agent now automatically loads from your organized content directories:
```bash
npm run ai-cli
```

No need to sync from Obsidian - the agent reads directly from your organized campaign content!

## Usage

### Interactive CLI Mode (Recommended)
Start the interactive agent:
```bash
npm run ai-cli
```

Available commands:
- `generate <prompt>` - Generate new content
- `save <filename>` - Save generated content to your vault  
- `list [category]` - Browse your knowledge base
- `search <term>` - Find relevant existing content
- `reload` - Refresh knowledge base
- `exit` - Quit

### One-off Generation
Generate content directly:
```bash
npm run ai-generate "Create a new NPC tavern owner for Riverbend"
npm run ai-generate "Design a haunted forest" LOCATION_HAUNTED_FOREST.md
```

## Example Prompts

### NPCs
- "Create a mysterious merchant who travels between Riverbend and Eldoria"
- "Design a corrupt guard captain who works for the bandits"
- "Generate a wise elderly sage who knows about the Winnow"

### Locations
- "Create a hidden underground temple beneath Riverbend"
- "Design a dangerous swamp between Eldoria and the Atherian Steppes"
- "Generate a bustling marketplace district for Eldoria"

### Adventures
- "Create a side quest involving missing caravans on the trade route"
- "Design a mystery adventure centered around strange dreams in Riverbend"
- "Generate an investigation quest about corruption in Eldoria's government"

### Items & Loot
- "Create a set of magical items found in Valerius's laboratory"
- "Design cursed artifacts related to the Winnow"
- "Generate mundane but interesting items for a general store"

## How It Works

1. **Knowledge Base**: Loads all your organized markdown files from the new type-based directories (`src/content/characters/`, `src/content/locations/`, `src/content/adventures/`, etc.) and categorizes them automatically
2. **Context Matching**: Finds relevant existing content based on your prompt
3. **AI Generation**: Uses GPT-4 with campaign context to create consistent content
4. **Smart Formatting**: Outputs properly formatted markdown with frontmatter

## Categories

The agent automatically categorizes your content:
- **character** - NPCs and important characters
- **location** - Places, cities, regions
- **adventure** - Quests, acts, story content
- **monster** - Adversaries and creatures  
- **item** - Loot, artifacts, equipment
- **environment** - Terrain and environmental details
- **campaign** - Overarching campaign information
- **misc** - Other content

## Tips

1. **Be Specific**: Better prompts lead to better content
   - ❌ "Create an NPC"
   - ✅ "Create a gruff dwarven blacksmith in Riverbend who secretly supports the resistance"

2. **Reference Existing Content**: The AI knows your campaign
   - "Create a quest that involves both Elara and the Silverstream River"
   - "Design a location that connects to the bandit problems in Act 1"

3. **Use Categories**: Mention the type of content you want
   - "Generate a new monster that would fit in the Sylvani Woods"
   - "Create a location that could serve as a dungeon near Eldoria"

4. **Iterate**: Generate, save, then refine with follow-up prompts
   - Generate base content, save it, then ask for expansions or modifications

## Workflow Integration

1. **Generate** content with the AI agent
2. **Save** to your Obsidian vault
3. **Edit** in Obsidian if needed
4. **Sync** to your blog with `npm run sync-obsidian`
5. **Publish** your campaign world

## Token Usage

- Each generation uses AI tokens (costs money)
- Typical generation: 500-1500 tokens (~$0.01-0.03)
- Monitor usage in your OpenAI dashboard
- Adjust `AI_MAX_TOKENS` in `.env` to control length

## Troubleshooting

**"Please set your OPENAI_API_KEY"**
- Check your `.env` file has the correct API key
- Make sure there are no extra spaces or quotes

**"Knowledge base empty"**
- The AI agent automatically loads from your organized content directories
- Check that you have .md files in `src/content/characters/`, `src/content/locations/`, etc.
- Run `npm run ai-cli` and use the `list` command to see what's loaded

**"Error generating content"**
- Check your API key is valid and has credits
- Try a shorter, more specific prompt
- Check OpenAI service status
