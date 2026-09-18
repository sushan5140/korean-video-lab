let groqModel=null;
async function googleTranslate(text){
  const u='https://translate.googleapis.com/translate_a/single?client=gtx&sl=ko&tl=en&dt=t&q='+encodeURIComponent(text);
  const r=await fetch(u,{headers:{'user-agent':'Mozilla/5.0'}});
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
    const r=await fetch('https://api.groq.com/openai/v1/models',{headers:{Authorization:'Bearer '+key}});
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
    body:JSON.stringify({model,temperature:0,max_tokens:180,messages:[
      {role:'system',content:'Translate Korean into concise natural English. Return only the English translation with no notes or quotation marks.'},
      {role:'user',content:text}
    ]})
  });
  if(!r.ok)throw new Error('groq_'+r.status);
  const d=await r.json(),out=String(d?.choices?.[0]?.message?.content||'').trim().replace(/^["']|["']$/g,'');
  if(!out)throw new Error('groq_empty');
  return out
}
async function translate(text){
  try{return{source:'google-translate',meaning:await googleTranslate(text)}}catch{}
  return{source:'groq-fallback',meaning:await groqTranslate(text)}
}
module.exports=async function(req,res){
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Cache-Control','public, s-maxage=604800, stale-while-revalidate=2592000');
  const u=new URL(req.url||'/','https://haneul.local'),text=String(u.searchParams.get('text')||'').trim().slice(0,700);
  if(!text)return res.status(400).json({ok:false,error:'missing_text'});
  try{const x=await translate(text);return res.status(200).json({ok:true,source:x.source,meaning:x.meaning})}
  catch{return res.status(502).json({ok:false,error:'translation_unavailable',meaning:''})}
};