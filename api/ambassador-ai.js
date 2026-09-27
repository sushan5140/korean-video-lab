// Ambassador AI: prefer Haneul's server-side xAI/Grok key; fall back to the
// already-configured Groq provider when xAI is unavailable. Provider secrets stay server-side.
const {consumeAiBudget}=require('../lib/haneul-security');
const SUPABASE='https://uyltjaftajwkujjhuric.supabase.co';
const PUBLIC_KEY='sb_publishable_WNWIyMORd5O4N_4qTWMO_w_HbHooVeW';
function trim(x,max){return String(x??'').trim().slice(0,max)}
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
module.exports=async(req,res)=>{
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='POST')return res.status(405).json({ok:false,error:'Method not allowed'});
 let p;try{p=typeof req.body==='string'?JSON.parse(req.body):req.body||{}}catch{return res.status(400).json({ok:false,error:'Invalid JSON'})}
 const code=trim(p.code,48).toUpperCase(),mode=trim(p.mode,30);
 const token=trim(req.headers.authorization,3000).replace(/^Bearer\s+/i,'');
 if(!/^[A-Z0-9_-]{2,48}$/.test(code)||!['contentKit','quizBattle','learningDoctor'].includes(mode))
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

  const instructions={
   contentKit:'Make an educational Korean language creator content kit with 6-slide carousel (each slide copy and accurate Korean examples), 30-second reel script, Instagram caption, concise hashtags and call to action linked to the Haneul creator community. Present as editable text. Do not attribute invented examples to a real video.',
   quizBattle:'Return ONLY a JSON object with {"questions":[{"question":"Korean question","options":["A option","B option","C option"],"answer":0,"explanation":"brief English explanation"}]} for exactly five Korean learning multiple-choice questions. answer must be an integer 0,1,or 2. If actual Korean caption excerpts are supplied, ground questions ONLY in the excerpt; otherwise create original topic-based practice without pretending it was quoted from a video.',
   learningDoctor:'Give three practical suggestions for future creator Korean lessons/challenges based ONLY on the aggregate counts and topics provided. If no learner metrics are available, explain that this is a starter plan, not analysis of learner weaknesses. Never infer individual learner activity.'
  };
  const context=trim(p.context,4400),topic=trim(p.topic,250),platform=trim(p.platform,50),level=trim(p.level,50),creator=trim(p.creator,120);
  const messages=[
   {role:'system',content:instructions[mode]+' Use natural Korean and transparent English. No HTML. Never fabricate statistics or quotes.'},
   {role:'user',content:JSON.stringify({topic,platform,level,creator,context})}
  ];

  let endpoint,secret,model,provider;
  if(xaiSecret){
   endpoint='https://api.x.ai/v1/chat/completions';
   secret=xaiSecret;
   model=process.env.HANEUL_GROK_MODEL||'grok-4-1-fast-non-reasoning';
   provider='xAI';
  }else{
   endpoint='https://api.groq.com/openai/v1/chat/completions';
   secret=groqSecret;
   model=process.env.HANEUL_GROQ_MODEL||await groqModel(groqSecret);
   provider='Groq';
  }

  const result=await fetch(endpoint,{
   method:'POST',
   headers:{Authorization:'Bearer '+secret,'content-type':'application/json'},
   body:JSON.stringify({model,stream:false,messages,temperature:0.3,max_tokens:2000}),
   signal:AbortSignal.timeout(45000)
  });
  if(!result.ok){
   console.error('Haneul Ambassador AI upstream',provider,result.status);
   const message=result.status===401||result.status===403?provider+' server credential was rejected.':result.status===429?provider+' is rate-limited. Try again shortly.':provider+' returned HTTP '+result.status+'.';
   return res.status(result.status===429?429:502).json({ok:false,error:message});
  }
  const response=await result.json(),output=String(response?.choices?.[0]?.message?.content||'').trim();
  if(!output)return res.status(502).json({ok:false,error:provider+' returned an empty response.'});
  return res.status(200).json({ok:true,text:output,model:String(response?.model||model),provider});
 }catch(e){
  console.error('Haneul Ambassador AI request error',e?.name||'unknown');
  return res.status(502).json({ok:false,error:'Could not reach the server AI provider. Please try again.'});
 }
};