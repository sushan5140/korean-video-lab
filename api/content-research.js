// Temporary fixed-query curator research: no credentials, arbitrary user queries or mutations.
const Q={
weather:'beginner Korean listening weather seasons rain snow slow Korean 날씨 계절',
family:'beginner Korean listening family mother father siblings slow Korean 가족 가족 소개',
work:'beginner Korean listening work office job interview slow Korean 회사 직장',
hobbies:'beginner Korean listening hobbies music drawing sports reading 취미 운동',
school:'beginner Korean listening school university studying classroom 학교 대학교',
shopping:'beginner Korean listening shopping clothes store money 구매 쇼핑',
travel:'beginner Korean listening travel airport bus train holiday 여행 공항',
weather2:'Korean Slow Podcast 날씨 비 눈 계절 초급 한국어',
weather3:'Korean short story beginner rainy day snow season 날씨 비 A1',
family2:'Korean Short Story 가족 엄마 아빠 A1 몰입한국어',
family3:'Korean Podcast Beginners 가족 부모님 형제 자매',
work2:'Korean Short Story 회사 면접 직장 A1 한국어',
work3:'Korean Podcast for Beginners 직장 일 회사',
hobbies2:'Korean Short Story 취미 운동 그림 A1',
hobbies3:'Korean Slow Podcast 취미 운동 게임 독서',
school2:'Korean Short Story 학교 교실 시험 숙제 A1',
school3:'Korean Podcast for Beginners 학교 공부',
shopping2:'Korean Slow Podcast 쇼핑 시장 옷 가게',
shopping3:'Korean Short Story 쇼핑 마트 물건 A1',
travel2:'Korean Slow Podcast 여행 공항 기차',
travel3:'Korean Short Story 여행 공항 버스 A1',
weather4:'한국어 듣기 초급 날씨',
family4:'한국어 듣기 초급 가족',
work4:'한국어 듣기 초급 회사',
hobbies4:'한국어 듣기 초급 취미',
school4:'한국어 듣기 초급 학교',
shopping4:'한국어 듣기 초급 쇼핑',
travel4:'한국어 듣기 초급 여행',
weather5:'Korean listening weather',
family5:'Korean beginner family conversation',
work5:'Korean beginner work conversation',
hobbies5:'Korean beginner hobbies listening',
school5:'Korean beginner school conversation',
shopping5:'Korean beginner shopping conversation',
travel5:'Korean beginner travel conversation',
school6:'초급 한국어 학교 대화 듣기',
school7:'학교 생활 한국어 듣기 초급 학생',
school8:'Korean conversation at school beginner Korean',
school9:'몰입한국어 학교 공부 A1',
family6:'가족 한국어 대화 초급 가족소개',
weather6:'날씨 비 눈 한국어 팟캐스트 초급'
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
