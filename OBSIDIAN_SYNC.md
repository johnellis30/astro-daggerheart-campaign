# Obsidian Vault Sync Configuration

This configuration file (`obsidian-sync.config.json`) allows you to selectively choose which files from your Obsidian vault get synced to your Astro blog.

## Configuration Options

### Basic Settings

- **`obsidianVaultPath`**: Path to your Obsidian vault
- **`blogContentDir`**: Directory where synced files will be placed (relative to project root)

### Sync Filters

#### File-based Filters
- **`includeFiles`**: Array of specific filenames to always include
- **`excludeFiles`**: Array of specific filenames to always exclude
- **`includePatterns`**: Array of glob patterns for files to include (e.g., "ACT1_*.md")
- **`excludePatterns`**: Array of glob patterns for files to exclude (e.g., "*_PRIVATE.md")

#### Tag-based Filters
- **`includeTags`**: Only sync files that have at least one of these tags
- **`excludeTags`**: Never sync files that have any of these tags

### Frontmatter Defaults

- **`defaultDescription`**: Default description for files without one
- **`defaultTags`**: Array of tags to add to all synced files
- **`addCreatedDate`**: Whether to add creation date to frontmatter
- **`addUpdatedDate`**: Whether to add update date to frontmatter

## How Filtering Works

The sync process follows this logic:

1. **Explicit Include**: If a file is listed in `includeFiles`, it's always synced
2. **Explicit Exclude**: If a file is listed in `excludeFiles`, it's never synced
3. **Pattern Exclude**: If a file matches any `excludePatterns`, it's excluded
4. **Pattern Include**: If a file matches any `includePatterns`, continue to tag check
5. **Tag Filter**: Check if file has required tags and doesn't have excluded tags
6. **Default**: If no patterns are specified, include all files (subject to tag filters)

## Commands

- **`npm run preview-sync`**: Preview what files would be synced without actually syncing
- **`npm run sync-obsidian`**: Sync files from your vault based on the configuration
- **`npm run dev-with-sync`**: Sync files and start the development server

## Example Configurations

### Sync Everything
```json
{
  "syncSettings": {
    "includeFiles": [],
    "includePatterns": [],
    "excludeFiles": [],
    "excludePatterns": []
  }
}
```

### Only Specific Categories
```json
{
  "syncSettings": {
    "includePatterns": [
      "LOCATION_*.md",
      "NPC_*.md",
      "CAMPAIGN_*.md"
    ],
    "excludePatterns": [
      "*_PRIVATE.md"
    ]
  }
}
```

### Tag-based Publishing
```json
{
  "syncSettings": {
    "includeTags": ["published", "public"],
    "excludeTags": ["draft", "private", "personal"]
  }
}
```

### Mixed Approach
```json
{
  "syncSettings": {
    "includeFiles": ["Campaign Primer.md"],
    "includePatterns": ["LOCATION_*.md"],
    "excludeFiles": ["secret-notes.md"],
    "excludePatterns": ["*_DRAFT.md"],
    "includeTags": ["campaign"],
    "excludeTags": ["private"]
  }
}
```

## Tips

1. **Use `npm run preview-sync`** to test your configuration before syncing
2. **Start with explicit includes** for better control over what gets published
3. **Use tags in your Obsidian notes** to make filtering easier
4. **Test your patterns** - glob patterns use `*` as wildcards
5. **Order matters** - explicit includes/excludes take precedence over patterns
