module.exports=async function(req,res){
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Cache-Control','no-store');

  const candidates=[
    ['XAI_API_KEY',process.env.XAI_API_KEY],
    ['GROK_API_KEY',process.env.GROK_API_KEY],
    ['GROQ_API_KEY',process.env.GROQ_API_KEY],
    ['XAI_KEY',process.env.XAI_KEY],
    ['AI_API_KEY',process.env.AI_API_KEY],
    ['OPENROUTER_API_KEY',process.env.OPENROUTER_API_KEY]
  ].filter(([,v])=>typeof v==='string'&&v.trim());

  const tests=[];
  for(const [name,key] of candidates){
    let xaiStatus=null,groqStatus=null;
    try{
      const r=await fetch('https://api.x.ai/v1/models',{headers:{Authorization:'Bearer '+key}});
      xaiStatus=r.status;
    }catch{}
    try{
      const r=await fetch('https://api.groq.com/openai/v1/models',{headers:{Authorization:'Bearer '+key}});
      groqStatus=r.status;
    }catch{}
    tests.push({name,xaiStatus,groqStatus});
  }

  return res.status(200).json({
    configured:candidates.length>0,
    tests
  });
};