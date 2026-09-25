const {test,afterEach}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const originalFetch=global.fetch;
const originalYouTube=process.env.YOUTUBE_API_KEY;
const originalXai=process.env.XAI_API_KEY;
afterEach(()=>{
 global.fetch=originalFetch;
 if(originalYouTube===undefined)delete process.env.YOUTUBE_API_KEY;else process.env.YOUTUBE_API_KEY=originalYouTube;
 if(originalXai===undefined)delete process.env.XAI_API_KEY;else process.env.XAI_API_KEY=originalXai;
});
function response(){
 return {statusCode:200,headers:{},setHeader(k,v){this.headers[k]=v;},
 status(code){this.statusCode=code;return this;},
 json(payload){this.payload=payload;return this;},
 end(value){this.payload=JSON.parse(value);return this;}};
}
function req({method='POST',url='/',body,authorization,query,otherHeaders}={}){
 return {method,url,query,body,headers:{...(authorization?{authorization}:{...otherHeaders})}};
}
const semantic=require('../api/semantic');
const captions=require('../api/captions');
const meaning=require('../api/meaning');
const meanings=require('../api/meanings');
const creator=require('../api/creator-ai');
const profile=require('../api/profile-analysis');
const youtube=require('../api/youtube-discover');
const ambassador=require('../api/ambassador-ai');
const auth='Bearer '+ 'z'.repeat(45);
const resp=(ok,body)=>({ok,status:ok?200:403,json:async()=>body});

test('anonymous cannot call the paid caption provider',async()=>{
 let seen=[];
 global.fetch=async url=>{seen.push(String(url));throw Error('Unexpected network request')};
 const res=response();
 await captions(req({method:'GET',url:'/api/captions?videoId=in58DVfmxug&source=provider'}),res);
 assert.equal(res.statusCode,401);
 assert.equal(seen.length,0);
});
test('provider quotas are verified BEFORE paid transcript access',async()=>{
 let seen=[];
 global.fetch=async url=>{
  const u=String(url);seen.push(u);
  if(u.includes('/auth/v1/user'))return resp(true,{id:'verified-user'});
  if(u.includes('/rpc/haneul_consume_ai_budget'))return resp(true,false);
  throw Error('Provider called without budget');
 };
 const res=response();
 await captions(req({method:'GET',url:'/api/captions?videoId=in58DVfmxug&source=provider',authorization:auth}),res);
 assert.equal(res.statusCode,429);
 assert.ok(seen.some(u=>u.includes('/rpc/haneul_consume_ai_budget')));
 assert.ok(!seen.some(u=>u.includes('freetranscriptapi')));
});
test('anonymous micro lessons use deterministic mode without paid Groq',async()=>{
 let seen=[];
 global.fetch=async url=>{seen.push(String(url));throw Error('No upstream call expected')};
 const cues=Array.from({length:15},(_,i)=>({index:i,startMs:i*3500,endMs:i*3500+3400,ko:'저는 오늘 한국어를 공부해요.'}));
 const res=response();
 await semantic(req({body:{mode:'micro',cues,totalCues:15}}),res);
 assert.equal(res.statusCode,200);
 assert.equal(res.payload.source,'deterministic-transcript');
 assert.equal(seen.length,0);
});
test('verified user over the AI budget receives deterministic micro lessons',async()=>{
 let seen=[];
 global.fetch=async url=>{
  const u=String(url);seen.push(u);
  if(u.includes('/auth/v1/user'))return resp(true,{id:'verified-user'});
  if(u.includes('/rpc/haneul_has_ai_access'))return resp(true,true);
  if(u.includes('/rpc/haneul_consume_ai_budget'))return resp(true,false);
  throw Error('Paid Groq called over quota');
 };
 const res=response();
 await semantic(req({authorization:auth,body:{mode:'micro',cues:[{index:0,ko:'한국어를 공부해요.'},{index:1,ko:'학교에 가요.'}]}}),res);
 assert.equal(res.statusCode,200);
 assert.equal(res.payload.source,'deterministic-transcript');
 assert.ok(!seen.some(u=>u.includes('api.groq.com')));
});
test('oversized semantic and batch translation requests reject before upstream work',async()=>{
 let hits=0;global.fetch=async()=>{hits++;throw Error('unexpected fetch')};
 const a=response();
 await semantic(req({body:{mode:'micro',cues:[{ko:'가'.repeat(151000)}]}}),a);
 assert.equal(a.statusCode,413);
 const b=response();
 await meanings(req({body:{texts:Array.from({length:41},()=> '한국어')}}),b);
 assert.equal(b.statusCode,400);
 assert.equal(hits,0);
});
test('anonymous translation failures never spend Groq tokens',async()=>{
 let seen=[];global.fetch=async url=>{seen.push(String(url));throw Error('translator unavailable')};
 const a=response();
 await meaning(req({method:'GET',url:'/api/meaning?text='+encodeURIComponent('안녕하세요')}),a);
 assert.equal(a.statusCode,502);
 const b=response();
 await meanings(req({body:{texts:['안녕하세요']}}),b);
 assert.equal(b.statusCode,200);
 assert.equal(b.payload.meanings['안녕하세요'],'');
 assert.ok(!seen.some(u=>u.includes('groq.com')));
});
test('creator, profile and ambassador AI deny anonymous calls before provider access',async()=>{
 let seen=[];global.fetch=async url=>{seen.push(String(url));throw Error('upstream must not be called')};
 process.env.XAI_API_KEY='test-not-a-real-secret';
 const a=response();
 await creator(req({body:{code:'HNL-X',mode:'tutor',prompt:'Hello'}}),a);
 assert.notEqual(a.statusCode,200);
 const b=response();
 await profile(req({body:{evidence:{}}}),b);
 assert.equal(b.statusCode,401);
 const c=response();
 await ambassador(req({body:{code:'HNL-X',mode:'contentKit',model:'example/model'},otherHeaders:{'x-openrouter-key':'sk-or-not-a-real-key'}}),c);
 assert.equal(c.statusCode,401);
 assert.ok(!seen.some(u=>u.includes('api.groq.com')||u.includes('api.x.ai')||u.includes('openrouter.ai')));
});
test('owner YouTube key status requires admin login',async()=>{
 process.env.YOUTUBE_API_KEY='not-a-real-key';
 let seen=[];global.fetch=async url=>{seen.push(String(url));throw Error('do not call YouTube')};
 const r=response();
 await youtube(req({method:'GET',query:{status:'1'}}),r);
 assert.equal(r.statusCode,401);
 assert.ok(!seen.some(u=>u.includes('googleapis.com')));
});
test('security response headers are set without blocking video/microphone functionality',()=>{
 const conf=JSON.parse(fs.readFileSync('vercel.json','utf8'));
 const head=conf.headers.find(x=>x.source==='/(.*)');
 assert.ok(head,'site-wide headers');
 const map=Object.fromEntries(head.headers.map(x=>[x.key.toLowerCase(),x.value]));
 for(const h of ['x-content-type-options','referrer-policy','x-frame-options','content-security-policy','strict-transport-security'])assert.ok(map[h],h);
 assert.match(map['content-security-policy'],/frame-ancestors/);
 assert.ok(!/microphone=\(\)/.test(map['permissions-policy']||''),'speaking mic must stay supported');
 assert.ok(conf.headers.find(x=>x.source==='/internal/(.*)'&&x.headers.some(h=>h.key==='X-Robots-Tag')),'noindex admin area');
});
