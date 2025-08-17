# AI Generated Content

This folder contains all newly generated content from the Campaign AI Agent, including both **text content** and **images**.

## Purpose

All AI-generated content is saved here first for **manual review and organization** before being moved to the appropriate campaign folders.

## Workflow

1. **Generate**: AI creates content/images and saves them here
2. **Review**: Check the generated content for quality and accuracy
3. **Edit**: Make any necessary adjustments to text content
4. **Move**: Move the files to the appropriate folders:
   - Characters → `src/content/characters/`
   - Locations → `src/content/locations/` 
   - Adventures → `src/content/adventures/`
   - Monsters → `src/content/monsters/`
   - Items → `src/content/items/`
   - Environments → `src/content/environments/`
   - Campaign lore → `src/content/campaign/`
   - **Images → `public/images/`**

## File Types & Naming

**Text Content:**
- `{TYPE}_{DATE}_{TIME}_AI_GENERATED.md`
- Example: `CHARACTER_20250816_142330_AI_GENERATED.md`

**Images:**
- `{NAME}_{DATE}_{TIME}.png`
- Example: `tavern-interior_20250817_023152.png`

## Image Generation Features

- **DALL-E 3** powered image generation
- **Fantasy art style** optimized for D&D campaigns
- **1024x1024 resolution** for high quality
- **Automatic enhancement** of prompts for better results
- **Local saving** for easy organization

## Organization Tool

Use the interactive organizer to manage both text and image files:
```bash
npm run organize-ai
```

This tool can:
- Preview files before moving
- Auto-detect content types (including images)
- Rename files during organization
- Handle both text and image files
