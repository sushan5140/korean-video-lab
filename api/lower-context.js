// Fixed topic YouTube discovery for Lower Intermediate; never exposes the server API key.
// These are real YouTube discovery candidates, NOT caption-verified Ready lessons.
const QUERIES={"Daily Life":["한국어 중급 일상 생활 대화 듣기","Korean intermediate daily life conversation podcast"],"Food":["한국어 음식 요리 식당 대화 듣기","Korean intermediate food cooking eating listening podcast"],"Travel":["한국어 여행 일상 대화 듣기","Korean intermediate travel vacation vlog conversation","Korean podcast trip stories travel","여행 한국어 듣기 연습"],"Shopping":["한국어 쇼핑 물건 사기 대화 듣기","Korean shopping market conversation listening"],"School":["한국어 학교 대학 공부 시험 대화","Korean intermediate school college classroom story","학교 생활 한국어 듣기 팟캐스트","Korean university life conversation listening"],"Culture":["한국 문화 생활 명절 한국어 듣기","Korean intermediate culture etiquette tradition podcast","Korean culture podcast intermediate 한국어","한국 문화 한국어 듣기 연습"],"Weather":["한국어 날씨 계절 듣기 Korean podcast","intermediate Korean weather seasons rain snow podcast","날씨 한국어 중급 이야기"],"Family":["한국어 가족 이야기 듣기 Korean podcast","Korean listening talking about family parents siblings","중급 한국어 가족 부모 자녀 대화","가족 한국어 듣기 연습","Korean family speaking practice mom dad","한국어 중급 가족 이야기","Korean podcast family siblings children"],"Work":["한국어 회사 직장 일 취업 듣기","Korean intermediate job office work conversation"],"Hobbies":["한국어 취미 생활 듣기 Korean podcast","Korean listening hobbies interests exercise movies","한국어 취미 운동 여가 이야기 중급","한국어 취미 생활 듣기","Korean hobby conversation language listening","Korean hobbies Korean podcast reading exercise","취미 여가 한국어 회화"]};
const MATCH={"Daily Life":"/daily|routine|everyday|life|conversation|일상|생활|하루|대화|일과/i","Food":"/food|cook|restaurant|meal|coffee|cafe|dish|recipe|breakfast|lunch|dinner|음식|요리|식당|카페|커피|식사/i","Travel":"/travel|trip|hotel|airport|tour|vacation|holiday|taxi|여행|관광|호텔|공항|휴가|택시/i","Shopping":"/shopping|shop|market|store|supermarket|mall|buying|쇼핑|시장|물건|마트|가게|구매/i","School":"/school|student|studying|study|university|college|class|exam|learning|학교|공부|대학교|시험|수업|학생/i","Culture":"/culture|tradition|history|holiday|etiquette|한국 문화|문화|명절|역사|예절/i","Weather":"/weather|season|rain|snow|summer|winter|spring|autumn|날씨|계절|겨울|여름|가을|장마/i","Family":"/family|parent|mother|father|sister|brother|mom|dad|가족|부모|엄마|아빠|형제|동생|친척|자녀/i","Work":"/work|office|job|career|company|factory|employ|business|일하기|직장|회사|취업|직업|업무|일자리/i","Hobbies":"/hobb|leisure|sport|exercise|movie|music|reading|dance|game|취미|운동|영화|음악|독서|여가|게임/i"};
const VALID_KOREAN=/korean|한국어|topik|코리안|한국말|한글|learn korean|한국어학습/i;
const WRONG_LANGUAGE=/chinese|hsk|japanese|jlpt|vietnamese|베트남어|중국어|일본어/i;
const INTERMEDIATE=/intermediate|middle level|중급|B1|B2|TOPIK\\s*[3-6]|TOPIK\\s*II|세종한국어\\s*[4-8]/i;
function respond(res,code,data){res.statusCode=code;res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control',code===200?'public, s-maxage=604800, stale-while-revalidate=1209600':'no-store');res.end(JSON.stringify(data))}
module.exports=async(req,res)=>{
 if(req.method!=='GET')return respond(res,405,{ok:false,error:'method_not_allowed'});
 const u=new URL(req.url||'/','https://haneul.local'),names=[...u.searchParams.keys()].filter(k=>k!=='_vercel_share');
 if(names.length!==1||names[0]!=='topic')return respond(res,400,{ok:false,error:'topic_only'});
 const topic=u.searchParams.get('topic'),queries=QUERIES[topic],matcher=MATCH[topic]?new RegExp(MATCH[topic].slice(1,-2),'i'):null;
 if(!queries||!matcher)return respond(res,404,{ok:false,error:'unknown_topic'});
 const key=process.env.YOUTUBE_API_KEY||process.env.GOOGLE_YOUTUBE_API_KEY;
 if(!key)return respond(res,503,{ok:false,error:'youtube_api_not_configured'});
 try{
  const seen=new Set(),out=[];
  for(let index=0;index<queries.length;index++){
   const params=new URLSearchParams({part:'snippet',type:'video',maxResults:'50',q:queries[index],relevanceLanguage:'ko',regionCode:'KR',safeSearch:'strict',videoEmbeddable:'true',key});
   if(index===0)params.set('videoCaption','closedCaption');
   const response=await fetch('https://www.googleapis.com/youtube/v3/search?'+params,{signal:AbortSignal.timeout(12000)});
   const data=await response.json();
   if(!response.ok){if(out.length)break;return respond(res,502,{ok:false,error:'youtube_search_unavailable',reason:data.error?.errors?.[0]?.reason||response.status})}
   for(const row of data.items||[]){
    const id=row.id?.videoId,title=String(row.snippet?.title||''),channel=String(row.snippet?.channelTitle||'');
    if(!/^[A-Za-z0-9_-]{11}$/.test(id)||seen.has(id))continue;seen.add(id);
    if(!VALID_KOREAN.test(title+' '+channel)||WRONG_LANGUAGE.test(title)||!matcher.test(title))continue;
    const score=(INTERMEDIATE.test(title)?6:0)+(index===0?2:0)+(/podcast|listening|듣기|대화|회화|vlog|브이로그|story|이야기/i.test(title)?2:0)-(/beginners?|초급|A1/i.test(title)?3:0);
    out.push({id,title,channel,description:String(row.snippet?.description||'').slice(0,280),publishedAt:row.snippet?.publishedAt||'',thumbnail:row.snippet?.thumbnails?.high?.url||'https://i.ytimg.com/vi/'+id+'/hqdefault.jpg',score});
   }
   if(out.length>=42)break;
  }
  out.sort((a,b)=>b.score-a.score);
  return respond(res,200,{ok:true,topic,source:'YouTube Data API',candidates:out.map(({score,...v})=>v).slice(0,42),count:out.length,admission:'checking_not_ready'});
 }catch{return respond(res,502,{ok:false,error:'youtube_discovery_unavailable'})}
};
