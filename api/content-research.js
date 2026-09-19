// Temporary fixed-query curator research: no credentials, arbitrary user queries or mutations.
const Q={
weather:'beginner Korean listening weather seasons rain snow slow Korean 날씨 계절',
family:'beginner Korean listening family mother father siblings slow Korean 가족 가족 소개',
work:'beginner Korean listening work office job interview slow Korean 회사 직장',
hobbies:'beginner Korean listening hobbies music drawing sports reading 취미 운동',
school:'beginner Korean listening school university studying classroom 학교 대학교',
shopping:'beginner Korean listening shopping clothes store money 구매 쇼핑',
travel:'beginner Korean listening travel airport bus train holiday 여행 공항'
};
module.exports=async function(req,res){
 res.setHeader('Content-Type','application/json; charset=utf-8');
 const type=String(req.query?.topic||'').toLowerCase();
 if(req.method!=='GET'||!Object.hasOwn(Q,type)){res.status(400).json({ok:false});return}
 const key=process.env.YOUTUBE_API_KEY||process.env.GOOGLE_YOUTUBE_API_KEY;
 if(!key){res.status(503).json({ok:false,error:'no-key'});return}
 const params=new URLSearchParams({part:'snippet',type:'video',maxResults:'50',q:Q[type],relevanceLanguage:'ko',regionCode:'KR',safeSearch:'strict',videoEmbeddable:'true',key});
 try{
  const r=await fetch('https://www.googleapis.com/youtube/v3/search?'+params,{signal:AbortSignal.timeout(18000)});
  const data=await r.json();
  if(!r.ok){res.status(502).json({ok:false,error:data.error?.errors?.[0]?.reason||'search-failed'});return}
  res.setHeader('Cache-Control','public, s-maxage=86400, stale-while-revalidate=86400');
  res.status(200).json({ok:true,topic:type,items:(data.items||[]).filter(i=>i.id?.videoId).map(i=>({id:i.id.videoId,title:i.snippet.title,channel:i.snippet.channelTitle,desc:i.snippet.description.slice(0,250)}))})
 }catch{res.status(502).json({ok:false,error:'discovery-unavailable'})}
};
