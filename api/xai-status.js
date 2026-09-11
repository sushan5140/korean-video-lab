module.exports=async function(req,res){
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Cache-Control','no-store');
  const allNames=Object.keys(process.env).filter(k=>/(api.*key|key|token|openrouter|grok|xai)/i.test(k)).sort();
  const blocked=/^(VERCEL|AWS_|CI$|PATH$|HOME$|PWD$|NODE_|NPM_)/i;
  const names=allNames.filter(k=>!blocked.test(k));
  const preferred=['XAI_API_KEY','GROK_API_KEY','XAI_KEY','AI_API_KEY','OPENROUTER_API_KEY'];
  let keyName=preferred.find(k=>process.env[k]);
  if(!keyName){
    keyName=names.find(k=>/xai|grok/i.test(k))||null;
  }
  if(!keyName)return res.status(200).json({ok:false,configured:false,keyLikeNames:names,reason:'xai_key_not_found'});
  const key=process.env[keyName];
  try{
    const r=await fetch('https://api.x.ai/v1/models',{headers:{Authorization:'Bearer '+key}});
    return res.status(200).json({ok:r.ok,configured:true,keyName,keyLikeNames:names,authStatus:r.status});
  }catch(e){
    return res.status(200).json({ok:false,configured:true,keyName,keyLikeNames:names,reason:'xai_unreachable'});
  }
};