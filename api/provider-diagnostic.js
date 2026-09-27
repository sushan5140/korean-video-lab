module.exports=async function(req,res){
  res.setHeader('Cache-Control','no-store');
  const matchingNames=Object.keys(process.env).filter(name=>/xai|grok|groq/i.test(name)).sort();
  const tests=[];
  for(const name of matchingNames){
    const key=process.env[name];
    if(typeof key!=='string'||!key.trim())continue;
    let xai=null,groq=null;
    try{xai=(await fetch('https://api.x.ai/v1/models',{headers:{Authorization:'Bearer '+key},signal:AbortSignal.timeout(8000)})).status}catch{}
    try{groq=(await fetch('https://api.groq.com/openai/v1/models',{headers:{Authorization:'Bearer '+key},signal:AbortSignal.timeout(8000)})).status}catch{}
    tests.push({name,xai,groq});
  }
  res.status(200).json({matchingNames,tests});
};