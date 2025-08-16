# Universal Content Images Guide

## Current Status
✅ **Complete image system is set up and working!**
- All content types now support custom images
- Full directory structure created for all content types
- Universal management scripts available
- Currently: 1/33 items have custom images

## Content Types Supported

### 📁 Image Directory Structure
```
public/images/
├── characters/     - NPCs and character portraits
├── locations/      - Places, settlements, dungeons  
├── adventures/     - Story arcs and quest artwork
├── monsters/       - Creatures and adversaries
├── items/          - Equipment, loot, documents
├── campaign/       - Campaign banners and overviews
└── environments/   - Terrain and atmospheric scenes
```

### 📊 Current Content Summary
- **Characters:** 9 items (1 with images, 8 need images)
- **Locations:** 8 items (0 with images)
- **Adventures:** 7 items (0 with images) 
- **Monsters:** 5 items (0 with images)
- **Campaign:** 1 item (0 with images)
- **Environments:** 2 items (0 with images)
- **Documents:** 1 item (0 with images)

**Total: 33 content items, 32 needing custom images**

## How to Add Images for Any Content Type

### Method 1: Manual Addition (Recommended for individual items)

1. **Determine the content type:**
   - Characters: `public/images/characters/`
   - Locations: `public/images/locations/`
   - Adventures: `public/images/adventures/`
   - Monsters: `public/images/monsters/`
   - Items/Documents: `public/images/items/`
   - Campaign: `public/images/campaign/`
   - Environments: `public/images/environments/`

2. **Prepare your image:**
   - **Characters/Monsters:** 800x600px or 800x800px
   - **Locations/Adventures:** 1200x800px (landscape)
   - **Items:** 600x600px (square) or 400x600px
   - **Campaign:** 1200x800px or larger (banners)
   - **Environments:** 1200x800px (wide landscapes)
   - **Formats:** JPG (photos), PNG (illustrations/transparency), WebP (best compression)

3. **Name your image file:**
   Use lowercase, hyphens for spaces, no special characters:
   ```
   Baruk Grimstone → baruk-grimstone.jpg
   Atherian Steppes → atherian-steppes.jpg
   Trouble in Riverbend → sub1-trouble-in-riverbend.jpg
   ```

4. **Add the file:** Place your image in the appropriate directory

5. **Update the content's markdown:**
   ```yaml
   ---
   title: "Content Name"
   description: "Content description..."
   heroImage: "/images/[type]/your-image.jpg"
   ---
   ```

### Method 2: Universal Image Manager (Recommended)

```bash
# See status of all content types
node scripts/universal-image-manager.js

# Check specific content type
node scripts/universal-image-manager.js characters status
node scripts/universal-image-manager.js locations status
node scripts/universal-image-manager.js monsters status

# Batch update specific content type
node scripts/universal-image-manager.js characters update
node scripts/universal-image-manager.js locations update
```

### Method 3: Legacy Scripts (Characters only)

```bash
# Character-specific tools (still work)
node scripts/add-character-image.js
node scripts/batch-update-images.js
```

## Content-Specific Image Guidelines

### 🧙 Characters & NPCs
- **Style:** Portraits, character art, profile shots
- **Size:** 800x600px or square formats work well
- **Tips:** Focus on face and personality, good for both cards and detail pages

### 🏰 Locations & Places  
- **Style:** Landscapes, building exteriors, atmospheric shots
- **Size:** 1200x800px landscape format preferred
- **Tips:** Wide scenic shots, architectural features, mood-setting imagery

### ⚔️ Adventures & Quests
- **Style:** Action scenes, story moments, chapter art
- **Size:** 1200x800px cinematic ratios
- **Tips:** Dynamic compositions, story-relevant imagery, epic scope

### 👹 Monsters & Adversaries
- **Style:** Creature portraits, battle poses, intimidating shots
- **Size:** 800x800px square or 800x1000px portrait
- **Tips:** Clear creature details, both realistic and stylized work well

### ⚗️ Items & Equipment
- **Style:** Clean product shots, detailed illustrations
- **Size:** 600x600px square, or 400x600px portrait for tall items
- **Tips:** PNG with transparency for icons, clear detail focus

### 🗺️ Campaign & World
- **Style:** Epic banners, world maps, faction symbols
- **Size:** 1200x800px or larger for banners
- **Tips:** Grand scope imagery, world-building focused

### 🌲 Environments & Terrain
- **Style:** Natural landscapes, weather effects, atmospheric scenes
- **Size:** 1200x800px wide landscape format
- **Tips:** Mood and atmosphere over specific details

## Quick Start Examples

### Add a Character Image
```bash
# 1. Add baruk-grimstone.jpg to public/images/characters/
# 2. Image automatically displays (already configured)
```

### Add a Location Image  
```bash
# 1. Add riverbend.jpg to public/images/locations/
# 2. Run: node scripts/universal-image-manager.js locations update
```

### Add Monster Images
```bash
# 1. Add bandit-marauder.jpg, echoing-wraith.png to public/images/monsters/  
# 2. Run: node scripts/universal-image-manager.js monsters update
```

## Content Needing Images (Top Priority)

### 🧙 Characters (8 remaining)
- `elara-meadowlight.jpg`
- `faelan-nightwood.jpg`  
- `general-vorlag.jpg`
- `linnea-swiftfoot.jpg`
- `lyrian.jpg`
- `lysandra-the-emissary.jpg`
- `the-silent-weaver.jpg`
- `torvin-stonehand.jpg`

### 🏰 Locations (8 items)
- `atherian-steppes.jpg`
- `decrepit-outpost.jpg`
- `eldoria.jpg`
- `riverbend.jpg`
- `silverstream.jpg`
- `sylvani-woods.jpg`
- `valerius-laboratory.jpg`
- `yolen.jpg`

### ⚔️ Adventures (7 items)
- `overview.jpg` (Act 1 Overview)
- `sub1-trouble-in-riverbend.jpg`
- `sub2-whispers-from-the-past.jpg`
- `sub3-shifting-alliances.jpg`
- `sub4-fortifying-positions.jpg`
- `sub5-a-choice-is-made.jpg`
- `sub1-side-quest-river-secret.jpg`

### 👹 Monsters (5 items)
- `bandit-marauder.jpg`
- `bandit-scout.jpg`
- `bandit-scout-skulk.jpg`
- `echoing-wraith.jpg`
- `razorclaw-otter.jpg`

### 📜 Other Content
- `campaign-overview.jpg` (main campaign banner)
- `atherian-steppes.jpg` (environment)
- `silverstream-river.jpg` (environment) 
- `document-womans-letter.jpg` (document/item)

## Testing Your Images

1. **Start the dev server:**
   ```bash
   npm run dev
   ```

2. **View all content by type:**
   - Characters: http://localhost:4326/characters
   - Locations: http://localhost:4326/locations  
   - Adventures: http://localhost:4326/adventures
   - Monsters: http://localhost:4326/monsters
   - Items: http://localhost:4326/items
   - Campaign: http://localhost:4326/campaign

3. **Check individual items:**
   Click on any item to see their detail page with full-size image

## Management Commands

```bash
# Get complete overview of all content types  
node scripts/universal-image-manager.js

# Check specific content type status
node scripts/universal-image-manager.js [type] status

# Batch update images for specific type
node scripts/universal-image-manager.js [type] update

# Available types: characters, locations, adventures, monsters, items, campaign, environments, documents
```

## Tips for Best Results

- **Image Quality:** Use high-quality images that fit the content type
- **Consistency:** Maintain similar style/lighting within each content type
- **File Size:** Optimize images (under 500KB recommended, under 1MB max)
- **Aspect Ratios:** Follow the recommendations for each content type
- **Batch Operations:** Use the universal image manager for efficiency
- **Backup:** Keep original high-res versions separate from web-optimized ones

## Troubleshooting

- **Image not showing:** Check the file path matches what's in the `heroImage` field
- **Wrong size/ratio:** Refer to content-specific size guidelines above
- **File too large:** Use image optimization tools (TinyPNG, etc.)
- **Batch update not working:** Check filename matches suggested naming convention
- **Script errors:** Ensure you're in the project root directory when running scripts

## Advanced Usage

### Organizing Large Image Collections
```bash
# Create subdirectories if needed
public/images/characters/portraits/
public/images/characters/tokens/
public/images/monsters/battle-tokens/
public/images/monsters/full-art/
```

### Custom Image Paths
You can use custom paths in frontmatter:
```yaml
heroImage: "/images/characters/portraits/special-baruk.jpg"
heroImage: "/images/monsters/tokens/bandit-token.png"  
```

### Multiple Images per Item
While heroImage is the main card image, you can reference additional images in content:
```markdown
![Battle Token](/images/monsters/tokens/bandit-marauder-token.png)
![Full Art](/images/monsters/full-art/bandit-marauder-scene.jpg)
```

## Next Steps

Replace the current placeholder image for Baruk Grimstone (`baruk-grimstone.jpg`) with your actual character portrait, then add images for the other characters as you create or find suitable artwork.
