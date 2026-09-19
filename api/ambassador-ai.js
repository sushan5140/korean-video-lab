// Ambassador BYOK: authenticate first, then forward a single request to OpenRouter.
// Never persist or log provider keys; don't attach them to a URL.
const SUPABASE='https://uyltjaftajwkujjhuric.supabase.co';
const PUBLIC_KEY='sb_publishable_WNWIyMORd5O4N_4qTWMO_w_HbHooVeW';
function trim(x,max){return String(x??'').trim().slice(0,max)}
module.exports=async(req,res)=>{
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='POST')return res.status(405).json({ok:false,error:'Method not allowed'});
 let p;try{p=typeof req.body==='string'?JSON.parse(req.body):req.body||{}}catch{return res.status(400).json({ok:false,error:'Invalid JSON'})}
 const code=trim(p.code,48).toUpperCase(),mode=trim(p.mode,30),model=trim(p.model,110);
 const key=trim(req.headers['x-openrouter-key'],260),token=trim(req.headers.authorization,3000).replace(/^Bearer\s+/i,'');
 if(!/^[A-Z0-9_-]{2,48}$/.test(code)||!['contentKit','quizBattle','learningDoctor'].includes(mode)||!key.startsWith('sk-or-')||!model||model.includes(' ')||model.length<3)
  return res.status(400).json({ok:false,error:'Select a model and connect a valid OpenRouter API key.'});
 if(!token)return res.status(401).json({ok:false,error:'Sign in to Haneul with Google.'});
 try{
  const headers={apikey:PUBLIC_KEY,Authorization:'Bearer '+token,'content-type':'application/json'};
  const check=await fetch(SUPABASE+'/rest/v1/rpc/haneul_creator_owner',{method:'POST',headers,body:JSON.stringify({p_code:code})});
  if(!check.ok||await check.json()!==true)return res.status(403).json({ok:false,error:'This tool is exclusive to your ambassador account.'});
  const instructions={
   contentKit:'Make an educational Korean language creator content kit with 6-slide carousel (each slide copy and accurate Korean examples), 30-second reel script, Instagram caption, concise hashtags and call to action linked to the Haneul creator community. Present as editable text. Do not attribute invented examples to a real video.',
   quizBattle:'Return ONLY a JSON object with {"questions":[{"question":"Korean question","options":["A option","B option","C option"],"answer":0,"explanation":"brief English explanation"}]} for exactly five Korean learning multiple-choice questions. answer must be an integer 0,1,or 2. If actual Korean caption excerpts are supplied, ground questions ONLY in the excerpt; otherwise create original topic-based practice without pretending it was quoted from a video.',
   learningDoctor:'Give three practical suggestions for future creator Korean lessons/challenges based ONLY on the aggregate counts and topics provided. If no learner metrics are available, explain that this is a starter plan, not analysis of learner weaknesses. Never infer individual learner activity.'
  };
  const context=trim(p.context,4400),topic=trim(p.topic,250),platform=trim(p.platform,50),level=trim(p.level,50),creator=trim(p.creator,120);
  const request={model,messages:[{role:'system',content:instructions[mode]+' Use natural Korean and transparent English. No HTML. Never fabricate statistics or quotes.'},{role:'user',content:JSON.stringify({topic,platform,level,creator,context})}],temperature:0.3,max_tokens:2000};
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),45000);
  let result;
  try{result=await fetch('https://openrouter.ai/api/v1/chat/completions',{method:'POST',headers:{Authorization:'Bearer '+key,'content-type':'application/json','HTTP-Referer':'https://korean-video-lab.vercel.app','X-Title':'Haneul X Ambassador'},body:JSON.stringify(request),signal:controller.signal})}finally{clearTimeout(timer)}
  if(!result.ok){
   const message=result.status===401||result.status===403?'OpenRouter rejected this key or model permission.':result.status===402?'Your OpenRouter account has insufficient credits. Try a free model.':result.status===429?'Your OpenRouter model is rate-limited. Try later.':'OpenRouter returned HTTP '+result.status+'.';
   return res.status(result.status===402?402:result.status===429?429:502).json({ok:false,error:message})
  }
  const response=await result.json(),output=String(response?.choices?.[0]?.message?.content||'').trim();
  if(!output)return res.status(502).json({ok:false,error:'Model returned an empty response.'});
  return res.status(200).json({ok:true,text:output,model});
 }catch(e){return res.status(502).json({ok:false,error:'Could not reach the AI provider. Please try again.'})}
};