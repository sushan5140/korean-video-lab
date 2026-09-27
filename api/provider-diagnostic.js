module.exports=async function(req,res){
  res.setHeader('Cache-Control','no-store');
  const names=['XAI_API_KEY','GROK_API_KEY','XAI_KEY','GROQ_API_KEY','AI_API_KEY','OPENROUTER_API_KEY'];
  const candidates=names.filter(name=>typeof process.env[name]==='string'&&process.env[name].trim());
  const tests=[];
  for(const name of candidates){
    const key=process.env[name];
    let xai=null,groq=null,openrouter=null;
    try{xai=(await fetch('https://api.x.ai/v1/models',{headers:{Authorization:'Bearer '+key},signal:AbortSignal.timeout(8000)})).status}catch{}
    try{groq=(await fetch('https://api.groq.com/openai/v1/models',{headers:{Authorization:'Bearer '+key},signal:AbortSignal.timeout(8000)})).status}catch{}
    try{openrouter=(await fetch('https://openrouter.ai/api/v1/models',{headers:{Authorization:'Bearer '+key},signal:AbortSignal.timeout(8000)})).status}catch{}
    tests.push({name,xai,groq,openrouter});
  }
  res.status(200).json({configured:candidates.length>0,tests});
};