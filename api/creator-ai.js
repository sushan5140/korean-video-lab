const {requestBytes,consumeAiBudget}=require('../lib/haneul-security');
const SUPABASE='https://uyltjaftajwkujjhuric.supabase.co';
const PUBLIC_KEY='sb_publishable_WNWIyMORd5O4N_4qTWMO_w_HbHooVeW';
const readBody=req=>typeof req.body==='string'?JSON.parse(req.body):req.body||{};
let modelCache='';
async function model(){
 if(modelCache)return modelCache;
 const r=await fetch('https://api.groq.com/openai/v1/models',{headers:{authorization:'Bearer '+process.env.GROQ_API_KEY},signal:AbortSignal.timeout(9000)});
 if(!r.ok)throw Error('AI provider unavailable');
 const d=await r.json(),ids=(d.data||[]).map(x=>String(x.id||''));
 modelCache=ids.find(x=>/gpt-oss-20b/i.test(x))||ids.find(x=>/llama.*instant/i.test(x))||ids.find(x=>/llama/i.test(x))||'';
 if(!modelCache)throw Error('No available AI model');
 return modelCache;
}
async function auth(req,code){
 const token=String(req.headers.authorization||'').replace(/^Bearer\s+/i,'').trim();
 if(!token)throw Error('Sign in with Google to use the creator studio');
 const headers={apikey:PUBLIC_KEY,authorization:'Bearer '+token,'content-type':'application/json'};
 const me=await fetch(SUPABASE+'/auth/v1/user',{headers,signal:AbortSignal.timeout(9000)});
 if(!me.ok)throw Error('Google session expired');
 const ok=await fetch(SUPABASE+'/rest/v1/rpc/haneul_creator_member',{method:'POST',headers,body:JSON.stringify({p_code:code}),signal:AbortSignal.timeout(9000)});
 if(!ok.ok||await ok.json()!==true)throw Error('Join this creator community to unlock its AI features');
 const ai=await fetch(SUPABASE+'/rest/v1/rpc/haneul_has_ai_access',{method:'POST',headers,body:'{}',signal:AbortSignal.timeout(9000)});
 if(!ai.ok||await ai.json()!==true)throw Error('AI access requires a collaborator referral or direct grant');
}
module.exports=async function(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='POST')return res.status(405).json({ok:false,error:'method_not_allowed'});
 if(requestBytes(req)>10000)return res.status(413).json({ok:false,error:'request_too_large'});
 let p;try{p=readBody(req)}catch{return res.status(400).json({ok:false,error:'invalid_json'})}
 const code=String(p.code||'').trim().toUpperCase(),mode=String(p.mode||''),context=String(p.context||'').slice(0,1800),answer=String(p.answer||'').slice(0,1600),prompt=String(p.prompt||'').slice(0,280),creator=String(p.creator||'').slice(0,80);
 if(!/^[A-Z0-9_-]{2,48}$/.test(code)||!['challenge','tutor','videoLesson','speaking'].includes(mode))return res.status(400).json({ok:false,error:'invalid_request'});
 try{
  await auth(req,code);
  const token='Bearer '+String(req.headers.authorization||'').replace(/^Bearer\s+/i,'').trim();
  if(!await consumeAiBudget(token,'creator'))return res.status(429).json({ok:false,error:'AI request limit reached. Try again in a few minutes.'});
  if(!process.env.GROQ_API_KEY)return res.status(503).json({ok:false,error:'AI provider is not configured'});
  const instructions={
   challenge:'Create a seven-day Korean-learning challenge using the provided video lesson titles; each day has one short listening task and one practice task. Do not invent or cite specific transcript contents unless provided. Include a short Korean sample for each day.',
   tutor:'Teach Korean for a learner in this creator community. Explain the supplied Korean phrase in clear English, identify vocabulary and grammar accurately, then ask ONE brief practice question. Do not invent video dialogue.',
   videoLesson:'Build an interactive Korean-language lesson grounded strictly in the supplied Korean transcript excerpt. Provide vocabulary, two questions with answers, and a speaking prompt. If excerpt is unavailable, explain that transcript must be loaded first.',
   speaking:'Give helpful Korean speaking/writing feedback based on the user-provided text. Suggest a natural alternative and one actionable practice tip. You cannot hear pronunciation, so do not claim you evaluated audio or pronunciation.'
  };
  const body={model:await model(),temperature:0.3,max_tokens:1300,messages:[
   {role:'system',content:instructions[mode]+' Be friendly and concise. Avoid judging the learner. No fabricated scores or claims that you listened to audio.'},
   {role:'user',content:JSON.stringify({creator,context,prompt,learnerText:answer})}
  ]};
  const r=await fetch('https://api.groq.com/openai/v1/chat/completions',{method:'POST',headers:{authorization:'Bearer '+process.env.GROQ_API_KEY,'content-type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(28000)});
  if(!r.ok)return res.status(502).json({ok:false,error:'AI unavailable; please retry'});
  const data=await r.json(),text=String(data?.choices?.[0]?.message?.content||'').trim();
  if(!text)return res.status(502).json({ok:false,error:'AI returned no response'});
  return res.status(200).json({ok:true,text,provider:'Groq'});
 }catch(e){const message=String(e.message||'Could not complete the request');return res.status(message.includes('AI')?503:403).json({ok:false,error:message})}
};
