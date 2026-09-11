module.exports=async function(req,res){
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Cache-Control','no-store');
  const names=Object.keys(process.env).filter(k=>/xai|grok/i.test(k)).sort();
  const preferred=['XAI_API_KEY','GROK_API_KEY','XAI_KEY'];
  const keyName=preferred.find(k=>process.env[k])||names.find(k=>process.env[k]);
  if(!keyName)return res.status(200).json({ok:false,configured:false,matchingNames:names,reason:'xai_key_not_found'});
  const key=process.env[keyName];
  try{
    const r=await fetch('https://api.x.ai/v1/models',{headers:{Authorization:'Bearer '+key}});
    return res.status(200).json({ok:r.ok,configured:true,keyName,matchingNames:names,authStatus:r.status});
  }catch(e){
    return res.status(200).json({ok:false,configured:true,keyName,matchingNames:names,reason:'xai_unreachable'});
  }
};