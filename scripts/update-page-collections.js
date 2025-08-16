#!/usr/bin/env node
/**
 * Update Page Collections Script
 * 
 * Updates all page components to use the new content collections
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PAGES_DIR = path.join(__dirname, '..', 'src', 'pages');

const PAGE_UPDATES = [
    {
        file: 'adventures.astro',
        collection: 'adventures',
        filterLogic: `const adventurePosts = (await getCollection('adventures'))
\t.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());`,
        routePrefix: 'adventures'
    },
    {
        file: 'monsters.astro',
        collection: 'monsters',
        filterLogic: `const monsterPosts = (await getCollection('monsters'))
\t.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());`,
        routePrefix: 'monsters'
    },
    {
        file: 'items.astro',
        collection: 'items',
        filterLogic: `const itemPosts = (await getCollection('items'))
\t.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());`,
        routePrefix: 'items'
    },
    {
        file: 'campaign.astro',
        collection: 'campaign',
        filterLogic: `const campaignPosts = (await getCollection('campaign'))
\t.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());`,
        routePrefix: 'campaign'
    }
];

function updatePageFile(pageInfo) {
    const filePath = path.join(PAGES_DIR, pageInfo.file);
    
    if (!fs.existsSync(filePath)) {
        console.log(`⚠️  File not found: ${pageInfo.file}`);
        return;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Update the collection logic (replace the filter logic)
    const blogFilterRegex = /const allPosts = await getCollection\('blog'\);\s*const \w+Posts = allPosts[\s\S]*?\.sort\([^)]*\);/;
    const legacyFilterRegex = /const \w+Posts = allPosts[\s\S]*?\.sort\([^)]*\);/;
    
    if (blogFilterRegex.test(content)) {
        content = content.replace(blogFilterRegex, pageInfo.filterLogic);
    } else if (legacyFilterRegex.test(content)) {
        content = content.replace(legacyFilterRegex, pageInfo.filterLogic);
    }
    
    // Update the route links (from /blog/ to /[collection]/)
    const routeRegex = new RegExp(`/blog/\\$\\{post\\.id\\}/`, 'g');
    content = content.replace(routeRegex, `/${pageInfo.routePrefix}/\${post.slug}/`);
    
    fs.writeFileSync(filePath, content);
    console.log(`✅ Updated ${pageInfo.file}`);
}

function createDynamicRoutes() {
    const routes = [
        { collection: 'adventures', route: 'adventures' },
        { collection: 'monsters', route: 'monsters' },
        { collection: 'items', route: 'items' },
        { collection: 'campaign', route: 'campaign' },
        { collection: 'environments', route: 'environments' }
    ];
    
    routes.forEach(route => {
        const routeDir = path.join(PAGES_DIR, route.route);
        if (!fs.existsSync(routeDir)) {
            fs.mkdirSync(routeDir, { recursive: true });
        }
        
        const routeFile = path.join(routeDir, '[slug].astro');
        const routeContent = `---
import { getCollection } from 'astro:content';
import BlogPost from '../../layouts/BlogPost.astro';

export async function getStaticPaths() {
\tconst ${route.collection} = await getCollection('${route.collection}');
\treturn ${route.collection}.map((item) => ({
\t\tparams: { slug: item.id },
\t\tprops: item,
\t}));
}

const item = Astro.props;
const { Content } = await item.render();
---

<BlogPost {...item.data}>
\t<Content />
</BlogPost>`;

        fs.writeFileSync(routeFile, routeContent);
        console.log(`✅ Created ${route.route}/[slug].astro`);
    });
}

function main() {
    console.log('🔄 Updating page collections...\n');
    
    // Update existing pages
    PAGE_UPDATES.forEach(updatePageFile);
    
    console.log('\n🔄 Creating dynamic routes...\n');
    
    // Create dynamic routes
    createDynamicRoutes();
    
    console.log('\n✅ Page collection updates complete!');
    console.log('\n📝 Next steps:');
    console.log('1. Update universal image manager script');
    console.log('2. Remove old blog/obsidian directory');
    console.log('3. Test all pages');
}

main();
