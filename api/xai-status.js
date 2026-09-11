module.exports=async function(req,res){
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Cache-Control','no-store');
  const key=process.env.GROQ_API_KEY;
  if(!key)return res.status(200).json({ok:false,configured:false,reason:'groq_key_missing'});
  const videoUrl='https://www.youtube.com/watch?v=8rvv4RXQYb4';
  try{
    const form=new FormData();
    form.append('url',videoUrl);
    form.append('model','whisper-large-v3');
    form.append('language','ko');
    form.append('response_format','verbose_json');
    form.append('timestamp_granularities[]','word');
    const r=await fetch('https://api.groq.com/openai/v1/audio/transcriptions',{
      method:'POST',
      headers:{Authorization:'Bearer '+key},
      body:form
    });
    let body={};try{body=await r.json()}catch{}
    return res.status(200).json({
      ok:r.ok,
      configured:true,
      provider:'groq',
      auth:true,
      transcriptionStatus:r.status,
      error:body?.error?.message||null,
      wordCount:Array.isArray(body?.words)?body.words.length:0,
      sample:Array.isArray(body?.words)?body.words.slice(0,3):[]
    });
  }catch(e){
    return res.status(200).json({ok:false,configured:true,provider:'groq',reason:'transcription_test_failed'});
  }
};