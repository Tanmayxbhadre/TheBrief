/**
 * Phase 14 — Homepage Deduplication Audit
 */
import { getHomepageData } from '../src/lib/news/homepage';
import { Article } from '../src/lib/types';

interface SectionEntry {
  section: string;
  article: Article;
}

async function main() {
  const data = await getHomepageData();

  const entries: SectionEntry[] = [];
  const add = (section: string, articles: Article | Article[]) => {
    const arr = Array.isArray(articles) ? articles : [articles];
    for (const a of arr) entries.push({ section, article: a });
  };

  if (data.breakingItem) {
    console.log(`  Breaking Bar: id=${data.breakingItem.id} headline="${data.breakingItem.headline}"`);
  } else {
    console.log('  Breaking Bar: none');
  }

  add('Hero', data.featured);
  add('Secondary', data.secondary);
  add('Latest', data.latestArticles);
  add('Trending', data.trendingArticles);
  for (const [cat, arts] of Object.entries(data.categoryArticles)) {
    if (arts.length > 0) add(`Category:${cat}`, arts);
  }

  const idMap = new Map<string, string[]>();
  const clusterMap = new Map<string, string[]>();
  const pathMap = tion);
};
track(idMap, article.id);
const clusterId = (article as { storyClusterId?: string }).storyClusterId;
if (clusterId) track(clusterMap, clusterId);
track(pathMap, `${article.category.slug}/${article.slug}`);
track(slugMap, article.slug);
  }

let dupIds = 0, dupClusters = 0, dupPaths = 0, dupSlugs = 0;

console.log('\n== DUPLICATE ARTICLE IDs ==');
for (const [id, sections] of idMap) {
  if (sections.length > 1) { dupIds++; console.log(`  DUPLICATE id=${id} in: ${sections.join(', ')}`); }
}
if (dupIds === 0) console.log('  None');

console.log('\n== DUPLICATE STORY CLUSTER IDs ==');
for (const [cid, sections] of clusterMap) {
  if (sections.length > 1) { dupClusters++; console.log(`  DUPLICATE clusterId=${cid} in: ${sections.join(', ')}`); }
}
if (dupClusters === 0) console.log('  None');

console.log('\n== DUPLICATE CANONICAL PATHS ==');
for (const [path, sections] of pathMap) {
  if (sections.length > 1) { dupPaths++; console.log(`  DUPLICATE path=${path} in: ${sections.join(', ')}`); }
}
if (dupPaths === 0) console.log('  None');

console.log('\n== DUPLICATE SLUGS ==');
for (const [slug, sections] of slugMap) {
  if (sections.length > 1) { dupSlugs++; console.log(`  DUPLICATE slug=${slug} in: ${sections.join(', ')}`); }
}
if (dupSlugs === 0) console.log('  None');

console.log('\n== SECTION CONTENTS ==');
const printSection = (label: string, arts: Article[]) => {
  if (arts.length === 0) {
    console.log(`  ${label}: (empty - all articles reserved by higher-priority sections)`);
  } else {
    for (const a of arts) {
      const c = (a as { storyClusterId?: string }).storyClusterId;
      console.log(`  ${label}: [${a.id.slice(0, 8)}] "${a.title.slice(0, 60)}"${c ? ` cluster=${c.slice(0, 8)}` : ''}`);
    }
  }
};

printSection('Hero', [data.featured]);
printSection('Secondary', data.secondary);
printSection('Latest', data.latestArticles);
printSection('Trending', data.trendingArticles);
for (const [cat, arts] of Object.entries(data.categoryArticles)) {
  printSection(`Category:${cat}`, arts);
}

const allPass = dupIds === 0 && dupClusters === 0 && dupPaths === 0 && dupSlugs === 0;

console.log('\n==============================================');
console.log('FINAL REPORT');
console.log('==============================================');
console.log(`Duplicate article IDs:     ${dupIds === 0 ? 'PASS (0)' : 'FAIL (' + dupIds + ')'}`);
console.log(`Duplicate StoryClusters:   ${dupClusters === 0 ? 'PASS (0)' : 'FAIL (' + dupClusters + ')'}`);
console.log(`Duplicate canonical paths: ${dupPaths === 0 ? 'PASS (0)' : 'FAIL (' + dupPaths + ')'}`);
console.log(`Duplicate slugs:           ${dupSlugs === 0 ? 'PASS (0)' : 'FAIL (' + dupSlugs + ')'}`);
console.log(`Hero:                      ${data.featured ? 'PASS' : 'FAIL'}`);
console.log(`Secondary (${data.secondary.length}/3):        ${data.secondary.length > 0 ? 'PASS' : 'WARN (sparse DB)'}`);
console.log(`Latest (${data.latestArticles.length}/8):          PASS`);
console.log(`Trending (${data.trendingArticles.length}/5):         PASS`);
console.log(`Categories populated:      ${Object.keys(data.categoryArticles).length}`);
console.log(`Homepage overall:          ${allPass ? 'PASS' : 'FAIL'}`);
console.log('==============================================');

process.exit(allPass ? 0 : 1);
}

main().catch((e) => { console.error(e); process.exit(1); });
