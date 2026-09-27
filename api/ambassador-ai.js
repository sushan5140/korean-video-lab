// Ambassador AI + Trend Scout.
// If xAI is configured, Trend Scout uses Grok's live web + X search.
// Otherwise it gathers fresh public trend signals and lets the configured Groq model synthesize them.
const {consumeAiBudget}=require('../lib/haneul-security');
const SUPABASE='https://uyltjaftajwkujjhuric.supabase.co';
const PUBLIC_KEY='sb_publishable_WNWIyMORd5O4N_4qTWMO_w_HbHooVeW';
function trim(x,max){return String(x??'').trim().slice(0,max)}
function decode(s){return String(s||'').replace(/<!\[CDATA\[|\]\]>/g,'').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim()}
function rssTitles(xml,max=12){
 const out=[];for(const m of String(xml||'').matchAll(/<title[^>]*>([\s\S]*?)<\/title>/gi)){const t=decode(m[1]);if(t&&!/^(Google Trends|Reddit)/i.test(t)&&!out.includes(t))out.push(t);if(out.length>=max)break}return out
}
async function getText(url,headers={}){
 try{const r=await fetch(url,{headers:{'user-agent':'HaneulTrendScout/1.0',...headers},signal:AbortSignal.timeout(8500)});return r.ok?await r.text():''}catch{return''}
}
async function getJson(url){
 try{const r=await fetch(url,{headers:{'user-agent':'HaneulTrendScout/1.0'},signal:AbortSignal.timeout(8500)});return r.ok?await r.json():null}catch{return null}
}
async function publicTrendSignals(region,focus){
 const geo=/^(KR|IN|US|GB)$/.test(region)?region:'US';
 const q=encodeURIComponent(((focus||'Korean learning')+' TikTok Instagram YouTube Korean language K-pop K-drama').slice(0,260));
 const [trendsKR,trendsGeo,news,kor,kpop,kdrama]=await Promise.all([
  getText('https://trends.google.com/trending/rss?geo=KR'),
  geo==='KR'?Promise.resolve(''):getText('https://trends.google.com/trending/rss?geo='+geo),
  getText('https://news.google.com/rss/search?q='+q+'&hl=en-US&gl=US&ceid=US:en'),
  getJson('https://www.reddit.com/r/Korean/hot.json?limit=10&raw_json=1'),
  getJson('https://www.reddit.com/r/kpop/hot.json?limit=8&raw_json=1'),
  getJson('https://www.reddit.com/r/KDRAMA/hot.json?limit=8&raw_json=1')
 ]);
 const reddit=(data,label)=>(data?.data?.children||[]).slice(0,8).map(x=>label+': '+trim(x?.data?.title,180)).filter(Boolean);
 const signals=[
  ...rssTitles(trendsKR,10).map(x=>'Google Trends KR: '+x),
  ...rssTitles(trendsGeo,8).map(x=>'Google Trends '+geo+': '+x),
  ...rssTitles(news,10).map(x=>'Recent web/news: '+x),
  ...reddit(kor,'Reddit r/Korean'),
  ...reddit(kpop,'Reddit r/kpop'),
  ...reddit(kdrama,'Reddit r/KDRAMA')
 ];
 return [...new Set(signals)].slice(0,38);
}
function responseText(data){
 if(typeof data?.output_text==='string'&&data.output_text.trim())return data.output_text.trim();
 const parts=[];
 for(const item of data?.output||[])for(const c of item?.content||[])if(typeof c?.text==='string')parts.push(c.text);
 return parts.join('\n').trim()
}
let groqModelCache='';
async function groqModel(secret){
 if(groqModelCache)return groqModelCache;
 const r=await fetch('https://api.groq.com/openai/v1/models',{headers:{Authorization:'Bearer '+secret},signal:AbortSignal.timeout(9000)});
 if(!r.ok)throw Error('Groq model list unavailable');
 const d=await r.json(),ids=(d.data||[]).map(x=>String(x.id||''));
 groqModelCache=ids.find(x=>/gpt-oss-20b/i.test(x))||ids.find(x=>/llama.*instant/i.test(x))||ids.find(x=>/llama/i.test(x))||ids[0]||'';
 if(!groqModelCache)throw Error('No Groq model available');
 return groqModelCache;
}
async function groqComplete(secret,messages,max_tokens=2000){
 const model=process.env.HANEUL_GROQ_MODEL||await groqModel(secret);
 const r=await fetch('https://api.groq.com/openai/v1/chat/completions',{method:'POST',headers:{Authorization:'Bearer '+secret,'content-type':'application/json'},body:JSON.stringify({model,stream:false,messages,temperature:.35,max_tokens}),signal:AbortSignal.timeout(45000)});
 if(!r.ok)throw Error('Groq returned HTTP '+r.status);
 const d=await r.json(),text=String(d?.choices?.[0]?.message?.content||'').trim();
 if(!text)throw Error('Groq returned an empty response');
 return{text,model,provider:'Groq'}
}
async function trendScout({xaiSecret,groqSecret,focus,region,level,platform}){
 const today=new Date(),from=new Date(today.getTime()-7*86400000);
 const iso=d=>d.toISOString().slice(0,10);
 const prompt='You are Haneul Trend Scout for a Korean-learning creator. Find RECENT signals from the last 7 days that can inspire useful Korean-learning social content. Focus: '+(focus||'general Korean learning')+'. Audience region: '+region+'. Learner level: '+level+'. Preferred platform: '+platform+'. Search for language-learning conversations, Korean culture/K-pop/K-drama moments, recurring questions, memes/formats, and creator-friendly hooks. Do not claim something is viral unless the evidence supports it. Return plain text only. Give 6 ideas. For each: IDEA, WHY NOW, HOOK, FORMAT, and TREND SIGNAL. Keep each compact and practical. End with a short “Avoid chasing” note for weak/noisy trends.';
 if(xaiSecret){
  try{
   const r=await fetch('https://api.x.ai/v1/responses',{method:'POST',headers:{Authorization:'Bearer '+xaiSecret,'content-type':'application/json'},body:JSON.stringify({
    model:process.env.HANEUL_GROK_TREND_MODEL||process.env.HANEUL_GROK_MODEL||'grok-4.7',
    input:[{role:'user',content:prompt}],
    tools:[{type:'web_search'},{type:'x_search',from_date:iso(from),to_date:iso(today)}],
    max_output_tokens:1900
   }),signal:AbortSignal.timeout(60000)});
   if(r.ok){const d=await r.json(),text=responseText(d);if(text)return{text,model:String(d?.model||'grok-4.7'),provider:'xAI',liveSearch:true}}
   console.error('Haneul Trend Scout xAI status',r.status)
  }catch(e){console.error('Haneul Trend Scout xAI error',e?.name||'unknown')}
 }
 if(!groqSecret)throw Error('Live trend search is unavailable because no fallback AI provider is configured.');
 const signals=await publicTrendSignals(region,focus);
 if(!signals.length)throw Error('Fresh trend sources could not be reached. Try again shortly.');
 return groqComplete(groqSecret,[
  {role:'system',content:'You are Haneul Trend Scout. Use ONLY the supplied current signals as evidence. Do not invent view counts, virality, dates, or platform performance. Convert noisy signals into useful Korean-learning creator ideas. Plain text only, compact and human.'},
  {role:'user',content:prompt+'\n\nCURRENT SIGNALS:\n'+signals.join('\n')}
 ],1900).then(x=>({...x,liveSearch:true,signalCount:signals.length}))
}
module.exports=async(req,res)=>{
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='POST')return res.status(405).json({ok:false,error:'Method not allowed'});
 let p;try{p=typeof req.body==='string'?JSON.parse(req.body):req.body||{}}catch{return res.status(400).json({ok:false,error:'Invalid JSON'})}
 const code=trim(p.code,48).toUpperCase(),mode=trim(p.mode,30);
 const token=trim(req.headers.authorization,3000).replace(/^Bearer\s+/i,'');
 if(!/^[A-Z0-9_-]{2,48}$/.test(code)||!['contentKit','quizBattle','learningDoctor','trendScout'].includes(mode))
  return res.status(400).json({ok:false,error:'Invalid ambassador AI request.'});
 if(!token)return res.status(401).json({ok:false,error:'Sign in to Haneul with Google.'});
 const xaiSecret=process.env.XAI_API_KEY||process.env.GROK_API_KEY||process.env.XAI_KEY||'';
 const groqSecret=process.env.GROQ_API_KEY||'';
 if(!xaiSecret&&!groqSecret)return res.status(503).json({ok:false,error:'No server AI provider is configured.'});
 try{
  const headers={apikey:PUBLIC_KEY,Authorization:'Bearer '+token,'content-type':'application/json'};
  const check=await fetch(SUPABASE+'/rest/v1/rpc/haneul_creator_owner',{method:'POST',headers,body:JSON.stringify({p_code:code}),signal:AbortSignal.timeout(9000)});
  if(!check.ok||await check.json()!==true)return res.status(403).json({ok:false,error:'This tool is exclusive to your ambassador account.'});
  if(!await consumeAiBudget('Bearer '+token,'creator'))return res.status(429).json({ok:false,error:'AI request limit reached. Try again in a few minutes.'});

  const context=trim(p.context,4400),topic=trim(p.topic,250),platform=trim(p.platform,50),level=trim(p.level,50),creator=trim(p.creator,120),trendBrief=trim(p.trendBrief,6000);
  if(mode==='trendScout'){
   const result=await trendScout({xaiSecret,groqSecret,focus:trim(p.focus,180),region:trim(p.region,16)||'global',level,platform});
   return res.status(200).json({ok:true,text:result.text,model:result.model,provider:result.provider,liveSearch:true,signalCount:result.signalCount||null});
  }

  const instructions={
   contentKit:'Write this like a real creator drafting content in their Notes app, not like an AI report. Create a 6-slide Korean-learning carousel, a natural 30-second Reel script, an Instagram caption, a short call to action, and a few relevant hashtags. For each carousel slide use simple plain-text lines such as “Slide 1: …”, then “Korean: …” and “English: …” only when useful. Keep the copy punchy, conversational, and easy to paste directly into Instagram. Do not use Markdown tables, pipe characters, asterisks, hashes, backticks, HTML tags, <br> tags, or stiff labels like “Korean Copy / English Translation”. Do not start with phrases like “Here is your content kit”. If a TREND BRIEF is supplied, use it as inspiration for the hook and format, but never repeat an unsupported claim that something is viral. Do not attribute invented examples to a real video.',
   quizBattle:'Return ONLY a JSON object with {"questions":[{"question":"Korean question","options":["A option","B option","C option"],"answer":0,"explanation":"brief English explanation"}]} for exactly five Korean learning multiple-choice questions. answer must be an integer 0,1,or 2. If actual Korean caption excerpts are supplied, ground questions ONLY in the excerpt; otherwise create original topic-based practice without pretending it was quoted from a video.',
   learningDoctor:'Give three practical suggestions for future creator Korean lessons/challenges based ONLY on the aggregate counts and topics provided. If no learner metrics are available, explain that this is a starter plan, not analysis of learner weaknesses. Never infer individual learner activity.'
  };
  const messages=[
   {role:'system',content:instructions[mode]+' Use natural Korean and clear everyday English. Sound like a human creator, not a template. Keep formatting clean and plain-text. No HTML or Markdown formatting unless the requested mode is the quiz JSON schema. Never fabricate statistics or quotes.'},
   {role:'user',content:JSON.stringify({topic,platform,level,creator,context,trendBrief:trendBrief||undefined})}
  ];
  let result;
  if(xaiSecret){
   const model=process.env.HANEUL_GROK_MODEL||'grok-4-1-fast-non-reasoning';
   const r=await fetch('https://api.x.ai/v1/chat/completions',{method:'POST',headers:{Authorization:'Bearer '+xaiSecret,'content-type':'application/json'},body:JSON.stringify({model,stream:false,messages,temperature:.3,max_tokens:2000}),signal:AbortSignal.timeout(45000)});
   if(!r.ok)throw Error('xAI returned HTTP '+r.status);
   const d=await r.json(),text=String(d?.choices?.[0]?.message?.content||'').trim();if(!text)throw Error('xAI returned an empty response');
   result={text,model:String(d?.model||model),provider:'xAI'};
  }else result=await groqComplete(groqSecret,messages,2000);
  return res.status(200).json({ok:true,text:result.text,model:result.model,provider:result.provider});
 }catch(e){
  console.error('Haneul Ambassador AI request error',e?.message||e?.name||'unknown');
  return res.status(502).json({ok:false,error:trim(e?.message||'Could not reach the server AI provider. Please try again.',220)});
 }
};