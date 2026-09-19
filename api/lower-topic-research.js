// Temporary, allowlisted, bounded YouTube Data API research for the owner's Lower Intermediate expansion.
// All topics and queries fixed in source; no arbitrary q/parameters and no API key in client output.
const TOPICS={"Daily Life":["한국어 중급 일상 대화 듣기 한국어 팟캐스트","intermediate Korean daily life listening conversation"],"Food":["한국어 중급 음식 요리 식당 듣기","intermediate Korean food restaurant cooking podcast"],"Travel":["한국어 중급 여행 호텔 교통 듣기","intermediate Korean travel trip conversation listening"],"Shopping":["한국어 중급 쇼핑 시장 물건 듣기","intermediate Korean shopping store dialogue"],"School":["한국어 중급 학교 대학교 공부 듣기","intermediate Korean school study university podcast"],"Culture":["한국어 중급 한국 문화 명절 생활 듣기","intermediate Korean culture traditions listening"],"Weather":["한국어 중급 날씨 계절 비 눈 듣기","intermediate Korean weather seasons podcast"],"Family":["한국어 중급 가족 부모 형제 듣기","intermediate Korean family parents relatives podcast"],"Work":["한국어 중급 직장 회사 취업 면접 듣기","intermediate Korean office work job listening"],"Hobbies":["한국어 중급 취미 운동 여가 듣기","intermediate Korean hobbies leisure sports podcast"]};
function respond(res,code,payload){res.statusCode=code;res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control',code===200?'public, s-maxage=43200, stale-while-revalidate=86400':'no-store');res.end(JSON.stringify(payload));}
module.exports=async(req,res)=>{
 if(req.method!=='GET')return respond(res,405,{ok:false,error:'method_not_allowed'});
 const u=new URL(req.url||'/','https://haneul.local');const p=[...u.searchParams.keys()];if(p.filter(k=>k!=='_vercel_share').length!==1||!p.includes('topic'))return respond(res,400,{ok:false,error:'topic_only'});
 const topic=u.searchParams.get('topic'),queries=TOPICS[topic];if(!queries)return respond(res,404,{ok:false,error:'unknown_topic'});
 const key=process.env.YOUTUBE_API_KEY||process.env.GOOGLE_YOUTUBE_API_KEY;
 if(!key)return respond(res,503,{ok:false,error:'youtube_api_not_configured'});
 try{
   const seen=new Set(),videos=[];
   for(const q of queries){
     const params=new URLSearchParams({part:'snippet',type:'video',maxResults:'50',q,relevanceLanguage:'ko',regionCode:'KR',safeSearch:'strict',videoEmbeddable:'true',videoCaption:'closedCaption',key});
     const response=await fetch('https://www.googleapis.com/youtube/v3/search?'+params,{signal:AbortSignal.timeout(13500)});
     const d=await response.json();if(!response.ok)return respond(res,502,{ok:false,error:'youtube_search_failed',reason:d.error?.errors?.[0]?.reason||response.status});
     for(const row of d.items||[]){const id=row.id?.videoId;if(!/^[A-Za-z0-9_-]{11}$/.test(id)||seen.has(id))continue;seen.add(id);videos.push({id,title:row.snippet?.title||'',channel:row.snippet?.channelTitle||'',description:row.snippet?.description||'',publishedAt:row.snippet?.publishedAt||'',thumbnail:row.snippet?.thumbnails?.high?.url||'https://i.ytimg.com/vi/'+id+'/hqdefault.jpg'})}
     if(videos.length>=48)break;
   }
   return respond(res,200,{ok:true,topic,count:videos.length,videos:videos.slice(0,60),note:'Search candidates only; requires Korean caption gate and playback. Never treat as automatically Ready.'});
 }catch(e){return respond(res,502,{ok:false,error:'youtube_discovery_unavailable'});}
};
