# Character Images

This folder contains custom images for campaign characters.

## Image Guidelines:
- Recommended size: 800x600px or similar aspect ratio
- Formats: JPG, PNG, WebP
- Filename should match the character's slug (lowercase, hyphens for spaces)

## Current Images:
- `baruk-grimstone.jpg` - Baruk Grimstone (tavern owner)

## Adding Images:
1. Add your image file to this folder
2. Update the character's markdown file frontmatter with:
   ```yaml
   heroImage: "/images/characters/your-image.jpg"
   ```
3. Use the manage-images script to batch update multiple characters

## Placeholder Images:
If no custom image is provided, cards will show the default blog placeholder.
