const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

const html=()=>fs.readFileSync('index.html','utf8');

test('Normal and Gen-Z mode has a persistent two-state switch',()=>{
 const source=html();
 assert.match(source,/id="vibeToggle"/);
 assert.match(source,/role="switch"/);
 assert.match(source,/haneulUiMode:v1/);
 assert.match(source,/localStorage\.setItem\(HANEUL_UI_MODE/);
 assert.match(source,/mode==='genz'\?'genz':'normal'/);
});

test('Gen-Z copy layer protects Korean learning content',()=>{
 const source=html();
 assert.match(source,/closest\('\.cap,\.ko,\.en,\.wordContext,\.realExample'\)/);
 assert.match(source,/Learning content stays accurate/);
 assert.match(source,/Korean learning content never changes/);
 assert.match(source,/Sign in with Google to view the Korean transcript/);
});

test('Mode is available in desktop sidebar and mobile-accessible Profile',()=>{
 const source=html();
 assert.match(source,/class="vibeModeBox"/);
 assert.match(source,/renderVibeProfileControl\(\)/);
 assert.match(source,/id="profileVibeToggle"/);
 assert.match(source,/@media\(max-width:850px\)\{\.vibeModeBox\{display:none\}/);
});

test('Mode copy includes core navigation and lesson controls',()=>{
 const source=html();
 for(const phrase of ['main feed','training arc','saved lore','character development','run it back','keep cooking','find the lore'])assert.ok(source.includes(phrase),phrase);
});
