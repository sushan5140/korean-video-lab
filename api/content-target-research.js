// Temporary fixed-query read-only YouTube HTML research, no API key or user input queries.
const SEARCHES={shopping:['중급 한국어 쇼핑 대화 듣기','intermediate Korean shopping conversation podcast','한국어 중급 온라인 쇼핑 백화점 시장 듣기'],weather:['중급 한국어 날씨 계절 듣기','intermediate Korean podcast weather seasons','한국어 중급 장마 폭염 겨울 봄 이야기']};
module.exports=async(req,res)=>{
 if(req.method!=='GET')return res.status(405).json({ok:false});
 const t=String(req.query?.topic||'');if(!Object.hasOwn(SEARCHES,t))return res.status(400).json({ok:false,error:'topic_only'});
 const out=[],seen=new Set();let diagnostics=[];
 for(const q of SEARCHES[t]){
  try{
   const u='https://www.youtube.com/results?search_query='+encodeURIComponent(q)+'&sp=EgIQAQ%253D%253D';
   const r=await fetch(u,{headers:{'user-agent':'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/129.0.0.0 Safari/537.36','accept-language':'ko-KR,ko;q=0.9,en;q=0.8'},signal:AbortSignal.timeout(12000)});
   const html=await r.text();diagnostics.push({query:q,status:r.status,length:html.length});
   const m=html.match(/var ytInitialData = (\{[\s\S]*?\});<\/script>/)||html.match(/ytInitialData\s*=\s*(\{[\s\S]*?\});/);
   if(!m)continue;
   const obj=JSON.parse(m[1]);const traverse=(x)=>{
    if(!x||typeof x!=='object')return;
    if(x.videoRenderer){
      const v=x.videoRenderer,id=v.videoId;if(/^[\w-]{11}$/.test(id)&&!seen.has(id)){
       seen.add(id);out.push({id,title:(v.title?.runs||[]).map(q=>q.text).join(''),channel:(v.ownerText?.runs||[]).map(q=>q.text).join(''),description:(v.detailedMetadataSnippets||[]).map(q=>(q.snippetText?.runs||[]).map(y=>y.text).join('')).join(' ').slice(0,260)});
      }
    }
    for(const [k,v] of Object.entries(x))if(k!=='videoRenderer')Array.isArray(v)?v.forEach(traverse):traverse(v)
   };traverse(obj);
  }catch(e){diagnostics.push({query:q,error:String(e).slice(0,70)})}
 }
 res.setHeader('Cache-Control','no-store');return res.status(200).json({ok:true,topic:t,count:out.length,videos:out.slice(0,80),diagnostics})
};