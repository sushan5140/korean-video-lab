// Owner-only YouTube Data API v3 discovery for Haneul curation.
// Configure YOUTUBE_API_KEY in the existing Vercel project. Never expose it to browsers.
const SUPABASE_URL='https://uyltjaftajwkujjhuric.supabase.co';
const PUBLISHABLE_KEY='sb_publishable_WNWIyMORd5O4N_4qTWMO_w_HbHooVeW';
function send(res,code,body){res.statusCode=code;res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','private, no-store');res.end(JSON.stringify(body))}
module.exports=async function handler(req,res){
 if(req.method!=='GET'){res.setHeader('Allow','GET');return send(res,405,{ok:false,error:'Method not allowed'})}
 const key=process.env.YOUTUBE_API_KEY||process.env.GOOGLE_YOUTUBE_API_KEY;
 if(req.query?.status==='1')return send(res,200,{ok:true,configured:!!key});
 if(!key)return send(res,503,{ok:false,error:'YOUTUBE_API_KEY is not configured on the existing Haneul Vercel project.'});
 const token=String(req.headers.authorization||'');
 if(!/^Bearer [A-Za-z0-9._~-]+$/.test(token))return send(res,401,{ok:false,error:'Sign in as a Haneul administrator.'});
 try{
  const user=await fetch(SUPABASE_URL+'/auth/v1/user',{headers:{apikey:PUBLISHABLE_KEY,Authorization:token},signal:AbortSignal.timeout(9000)});
  if(!user.ok)return send(res,401,{ok:false,error:'Google session expired.'});
  const access=await fetch(SUPABASE_URL+'/rest/v1/rpc/is_haneul_admin',{method:'POST',headers:{apikey:PUBLISHABLE_KEY,Authorization:token,'Content-Type':'application/json'},body:'{}',signal:AbortSignal.timeout(9000)});
  if(!access.ok||(await access.json())!==true)return send(res,403,{ok:false,error:'Owner access required.'});
  const query=String(req.query?.q||'').trim().slice(0,90);
  if(query.length<3)return send(res,400,{ok:false,error:'Provide a search of at least 3 characters.'});
  const params=new URLSearchParams({part:'snippet',type:'video',maxResults:'25',q:query,relevanceLanguage:'ko',regionCode:'KR',safeSearch:'strict',videoEmbeddable:'true',key});
  const reply=await fetch('https://www.googleapis.com/youtube/v3/search?'+params,{signal:AbortSignal.timeout(15000)});
  const data=await reply.json();
  if(!reply.ok)return send(res,reply.status===403?502:reply.status,{ok:false,error:'YouTube search unavailable or API quota exhausted.',reason:data.error?.errors?.[0]?.reason||'unknown'});
  return send(res,200,{ok:true,videos:(data.items||[]).filter(x=>x.id?.videoId).map(x=>({id:x.id.videoId,title:x.snippet.title,channel:x.snippet.channelTitle,description:x.snippet.description,thumbnail:x.snippet.thumbnails?.high?.url||x.snippet.thumbnails?.medium?.url||'',publishedAt:x.snippet.publishedAt})),note:'Discovery metadata only. Check the Korean timed captions and video subject before Ready admission.'});
 }catch(e){return send(res,502,{ok:false,error:'YouTube discovery could not complete right now.'})}
};
