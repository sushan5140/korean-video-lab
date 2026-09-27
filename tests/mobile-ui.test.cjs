const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

const html=fs.readFileSync('index.html','utf8');
const style=(id)=>{
 const start=html.indexOf('<style id="'+id+'">');
 assert.notEqual(start,-1,'missing '+id);
 const end=html.indexOf('</style>',start);
 assert.notEqual(end,-1,'unterminated '+id);
 return html.slice(start,end);
};

test('inline production JavaScript still parses after mobile changes',()=>{
 const scripts=[...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)].map(m=>m[1]).filter(Boolean);
 assert.ok(scripts.length>=1);
 for(const source of scripts)assert.doesNotThrow(()=>new Function(source));
});

test('phone lesson player uses intrinsic 16:9 geometry instead of viewport-height rows',()=>{
 const css=style('haneul-mobile-lesson-v26');
 assert.match(css,/\.left\{[\s\S]*display:block!important/);
 assert.match(css,/\.player\{[\s\S]*aspect-ratio:16\/9/);
 assert.match(css,/\.video\{[\s\S]*min-height:0!important/);
 assert.match(css,/\.caps\{[\s\S]*min-height:0!important/);
});

test('caption controls cannot disappear off the right edge on phones',()=>{
 const css=style('haneul-mobile-lesson-v26');
 assert.match(css,/\.ctop\{[\s\S]*grid-template-columns:minmax\(0,1fr\)/);
 assert.match(css,/\.modes\{[\s\S]*overflow-x:auto!important/);
 assert.match(css,/\.tabs\{[\s\S]*overflow-x:auto!important/);
 assert.match(css,/\.cap\.noCue\{[\s\S]*min-height:112px!important/);
});

test('fixed phone dock has content clearance and lesson navigation exits the overlay',()=>{
 const css=style('haneul-mobile-lesson-v26');
 assert.match(css,/\.panel\{[\s\S]*env\(safe-area-inset-bottom,0px\)/);
 assert.match(css,/\.ov\.open ~ \.mobileNav/);
 assert.match(style('haneul-mobile-dock-v25'),/grid-template-columns:repeat\(5,minmax\(0,1fr\)\)/);
 assert.match(html,/function closeLesson\(showSummary=true\)/);
 assert.match(html,/if\(\$\('ov'\)\?\.classList\.contains\('open'\)\)closeLesson\(false\)/);
});

test('stacked mobile lesson language no longer references a desktop left column',()=>{
 assert.ok(html.includes('Everything here follows the exact spoken cue.'));
 assert.ok(!html.includes('Everything here follows the exact cue on the left.'));
 assert.match(html,/classList\.toggle\('noCue',!c\)/);
 assert.match(html,/scrollIntoView\(\{behavior:'smooth',block:'nearest',inline:'center'\}\)/);
});
