// Ambassador AI: authenticate the ambassador, then use Haneul's server-side xAI/Grok key.
// The provider credential stays in Vercel environment variables and is never sent to the browser.
const {consumeAiBudget}=require('../lib/haneul-security');
const SUPABASE='https://uyltjaftajwkujjhuric.supabase.co';
const PUBLIC_KEY='sb_publishable_WNWIyMORd5O4N_4qTWMO_w_HbHooVeW';
function trim(x,max){return String(x??'').trim().slice(0,max)}
module.exports=async(req,res)=>{
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='POST')return res.status(405).json({ok:false,error:'Method not allowed'});
 let p;try{p=typeof req.body==='string'?JSON.parse(req.body):req.body||{}}catch{return res.status(400).json({ok:false,error:'Invalid JSON'})}
 const code=trim(p.code,48).toUpperCase(),mode=trim(p.mode,30);
 const token=trim(req.headers.authorization,3000).replace(/^Bearer\s+/i,'');
 if(!/^[A-Z0-9_-]{2,48}$/.test(code)||!['contentKit','quizBattle','learningDoctor'].includes(mode))
  return res.status(400).json({ok:false,error:'Invalid ambassador AI request.'});
 if(!token)return res.status(401).json({ok:false,error:'Sign in to Haneul with Google.'});
 const secret=process.env.XAI_API_KEY||process.env.GROK_API_KEY||process.env.XAI_KEY;
 if(!secret)return res.status(503).json({ok:false,error:'Grok is not configured on the Haneul server.'});
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
  const request={
   model:process.env.HANEUL_GROK_MODEL||'grok-4-1-fast-non-reasoning',
   stream:false,
   messages:[
    {role:'system',content:instructions[mode]+' Use natural Korean and transparent English. No HTML. Never fabricate statistics or quotes.'},
    {role:'user',content:JSON.stringify({topic,platform,level,creator,context})}
   ],
   temperature:0.3,
   max_tokens:2000
  };
  const result=await fetch('https://api.x.ai/v1/chat/completions',{
   method:'POST',
   headers:{Authorization:'Bearer '+secret,'content-type':'application/json'},
   body:JSON.stringify(request),
   signal:AbortSignal.timeout(45000)
  });
  if(!result.ok){
   console.error('Haneul Ambassador Grok upstream status',result.status);
   const message=result.status===401||result.status===403?'Haneul\'s Grok server credential was rejected.':result.status===429?'Grok is rate-limited. Try again shortly.':'Grok returned HTTP '+result.status+'.';
   return res.status(result.status===429?429:502).json({ok:false,error:message});
  }
  const response=await result.json(),output=String(response?.choices?.[0]?.message?.content||'').trim();
  if(!output)return res.status(502).json({ok:false,error:'Grok returned an empty response.'});
  return res.status(200).json({ok:true,text:output,model:String(response?.model||request.model),provider:'xAI'});
 }catch(e){
  console.error('Haneul Ambassador Grok request error',e?.name||'unknown');
  return res.status(502).json({ok:false,error:'Could not reach Grok. Please try again.'});
 }
};