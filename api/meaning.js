const {verifyProviderAccess}=require('../lib/haneul-security');
let groqModel=null;
async function googleTranslate(text){
  const u='https://translate.googleapis.com/translate_a/single?client=gtx&sl=ko&tl=en&dt=t&q='+encodeURIComponent(text);
  const r=await fetch(u,{headers:{'user-agent':'Mozilla/5.0'},signal:AbortSignal.timeout(9000)});
  if(!r.ok)throw new Error('google_'+r.status);
  const d=await r.json();
  const out=(d?.[0]||[]).map(x=>x?.[0]||'').join('').trim();
  if(!out)throw new Error('google_empty');
  return out
}
async function getGroqModel(){
  if(groqModel)return groqModel;
  const key=process.env.GROQ_API_KEY;if(!key)return null;
  try{
    const r=await fetch('https://api.groq.com/openai/v1/models',{headers:{Authorization:'Bearer '+key},signal:AbortSignal.timeout(9000)});
    if(!r.ok)return null;
    const d=await r.json(),ids=(d.data||[]).map(x=>String(x.id||'')).filter(Boolean);
    groqModel=ids.find(x=>/gpt-oss-20b/i.test(x))||ids.find(x=>/llama.*instant/i.test(x))||ids.find(x=>/llama/i.test(x))||ids[0]||null;
    return groqModel
  }catch{return null}
}
async function groqTranslate(text){
  const key=process.env.GROQ_API_KEY,model=await getGroqModel();
  if(!key||!model)throw new Error('groq_unavailable');
  const r=await fetch('https://api.groq.com/openai/v1/chat/completions',{
    method:'POST',headers:{Authorization:'Bearer '+key,'content-type':'application/json'},
    signal:AbortSignal.timeout(22000),body:JSON.stringify({model,temperature:0,max_tokens:180,messages:[
      {role:'system',content:'Translate Korean into concise natural English. Return only the English translation with no notes or quotation marks.'},
      {role:'user',content:text}
    ]})
  });
  if(!r.ok)throw new Error('groq_'+r.status);
  const d=await r.json(),out=String(d?.choices?.[0]?.message?.content||'').trim().replace(/^["']|["']$/g,'');
  if(!out)throw new Error('groq_empty');
  return out
}
async function translate(text,req){
  try{return{source:'google-translate',meaning:await googleTranslate(text)}}catch{}
  // No anonymous provider spend: Google public translation failure remains a
  // normal unavailable response, while entitled signed-in learners may use AI.
  const access=await verifyProviderAccess(req,'micro');
  if(!access.ok)throw Error('translation_unavailable');
  return{source:'groq-fallback',meaning:await groqTranslate(text)}
}
module.exports=async function(req,res){
  res.setHeader('Cache-Control','no-store');
  if(req.method!=='GET')return res.status(405).json({ok:false,error:'method_not_allowed'});
  const u=new URL(req.url||'/','https://haneul.local'),text=String(u.searchParams.get('text')||'').trim();
  if(!text)return res.status(400).json({ok:false,error:'missing_text'});
  if(text.length>700||!/[가-힣]/.test(text))return res.status(400).json({ok:false,error:'invalid_korean_text'});
  try{const x=await translate(text,req);return res.status(200).json({ok:true,source:x.source,meaning:x.meaning})}
  catch{return res.status(502).json({ok:false,error:'translation_unavailable',meaning:''})}
};