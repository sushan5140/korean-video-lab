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
async function groqBatch(texts){
  const key=process.env.GROQ_API_KEY,model=await getGroqModel();
  if(!key||!model||!texts.length)return{};
  const indexed={};texts.forEach((t,i)=>indexed[String(i)]=t);
  const r=await fetch('https://api.groq.com/openai/v1/chat/completions',{
    method:'POST',headers:{Authorization:'Bearer '+key,'content-type':'application/json'},
    body:JSON.stringify({model,temperature:0,max_tokens:1600,messages:[
      {role:'system',content:'Translate each Korean value into concise natural English. Return ONLY one JSON object with the same numeric keys and English string values. No markdown and no explanation.'},
      {role:'user',content:JSON.stringify(indexed)}
    ]})
  });
  if(!r.ok)return{};
  const d=await r.json();let raw=String(d?.choices?.[0]?.message?.content||'').trim();
  raw=raw.replace(/^\`\`\`(?:json)?\s*/i,'').replace(/\s*\`\`\`$/,'');
  try{
    const obj=JSON.parse(raw),out={};
    texts.forEach((t,i)=>{const v=String(obj?.[String(i)]||'').trim();if(v)out[t]=v});
    return out
  }catch{return{}}
}
module.exports=async function(req,res){
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Cache-Control','public, s-maxage=604800, stale-while-revalidate=2592000');
  if(req.method!=='POST')return res.status(405).json({ok:false,error:'method_not_allowed'});
  const texts=[...new Set((req.body?.texts||[]).map(x=>String(x||'').trim()).filter(Boolean))].slice(0,120),out={},failed=[];
  let next=0;
  async function worker(){
    while(next<texts.length){
      const i=next++,t=texts[i];
      try{out[t]=await googleTranslate(t)}catch{failed.push(t)}
    }
  }
  await Promise.all(Array.from({length:Math.min(8,texts.length)},worker));
  if(failed.length&&process.env.GROQ_API_KEY){
    for(let i=0;i<failed.length;i+=24){
      const chunk=failed.slice(i,i+24),map=await groqBatch(chunk);
      for(const t of chunk)out[t]=map[t]||''
    }
  }else for(const t of failed)out[t]='';
  const usedFallback=failed.some(t=>out[t]);
  return res.status(200).json({ok:true,source:usedFallback?'google-translate+groq-fallback':'google-translate',meanings:out})
};