const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

function loadWindowFile(path){
 const window={};
 vm.runInNewContext(fs.readFileSync(path,'utf8'),{window});
 return window;
}
test('Culture, Street Talk and News shelves are intentionally populated',()=>{
 const cat=loadWindowFile('data/category-videos.js');
 assert.equal(cat.HANEUL_CATEGORY_VIDEOS.length,3);
 const levels=new Set(cat.HANEUL_CATEGORY_VIDEOS.map(v=>v.level));
 assert.deepEqual([...levels].sort(),['Beginner','Intermediate','Lower Intermediate'].sort());
 for(const v of cat.HANEUL_CATEGORY_VIDEOS){
   assert.ok(v.styles.includes('News'),'News preview missing News style');
   assert.equal(v.verification,'video-only-preview');
   assert.equal(v.ready,false,'News preview must not be falsely certified Ready');
   assert.match(v.thumb,/^https:\/\/i\.ytimg\.com\/vi\//);
 }
 const enrich=cat.HANEUL_STYLE_ENRICHMENT;
 assert.ok(Object.values(enrich).filter(x=>x.includes('Culture')).length>=7);
 assert.ok(Object.values(enrich).filter(x=>x.includes('Street Talk')).length>=4);
});

test('production UI exposes category counts and honest News preview behavior',()=>{
 const html=fs.readFileSync('index.html','utf8');
 assert.ok(html.includes('/data/category-videos.js'));
 assert.ok(html.includes('window.HANEUL_CATEGORY_VIDEOS||[]'));
 assert.ok(html.includes('function readyStyleCount(style)'));
 assert.ok(html.includes('function previewStyleCount(style)'));
 assert.ok(html.includes("videoFilters.style==='News'"));
 assert.ok(html.includes("v.verification==='video-only-preview'"));
 assert.ok(html.includes('◌ Preview'));
 assert.ok(html.includes('News preview · video available · Haneul transcript pending'));
 assert.ok(html.includes("HANEUL_CATALOG_BUILD='2026-09-27-culture-street-news-v10'"));
});

test('catalog manifest advertises non-empty shelves at every level',()=>{
 const manifest=JSON.parse(fs.readFileSync('catalog-version.json','utf8'));
 assert.equal(manifest.version,'2026-09-27-culture-street-news-v10');
 assert.equal(manifest.curated,473);
 assert.equal(manifest.ready,140);
 for(const level of ['Beginner','Lower Intermediate','Intermediate']){
   assert.ok(manifest.styleCounts.Culture[level].ready>=3,'Culture Ready shelf empty at '+level);
   assert.ok(manifest.styleCounts['Street Talk'][level].ready>=2,'Street Talk Ready shelf empty at '+level);
   assert.equal(manifest.styleCounts.News[level].preview,1,'News needs one honest video preview at '+level);
 }
});
