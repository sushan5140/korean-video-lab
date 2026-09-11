module.exports=async function(req,res){
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Cache-Control','no-store');
  const candidates=[
    ['XAI_API_KEY',process.env.XAI_API_KEY],
    ['GROK_API_KEY',process.env.GROK_API_KEY],
    ['XAI_KEY',process.env.XAI_KEY]
  ];
  const found=candidates.find(([,v])=>typeof v==='string'&&v.trim());
  if(!found)return res.status(200).json({ok:false,configured:false,reason:'xai_key_not_found'});
  const [name,key]=found;
  try{
    const r=await fetch('https://api.x.ai/v1/models',{headers:{Authorization:'Bearer '+key}});
    return res.status(200).json({ok:r.ok,configured:true,keyName:name,authStatus:r.status});
  }catch(e){
    return res.status(200).json({ok:false,configured:true,keyName:name,reason:'xai_unreachable'});
  }
};