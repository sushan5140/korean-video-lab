const YT_ID=/^[A-Za-z0-9_-]{6,20}$/;
const CLIENTS=[
  {name:'TV_DOWNGRADED',clientName:'TVHTML5',clientVersion:'4',clientId:'7',userAgent:'Mozilla/5.0 (ChromiumStylePlatform) Cobalt/Version'},
  {name:'TV',clientName:'TVHTML5',clientVersion:'7.20250312.16.00',clientId:'7',userAgent:'Mozilla/5.0 (ChromiumStylePlatform) Cobalt/25.lts.30.1034943-gold (unlike Gecko), Unknown_TV_Unknown_0/Unknown (Unknown, Unknown)'},
  {name:'WEB_EMBEDDED',clientName:'WEB_EMBEDDED_PLAYER',clientVersion:'1.20260310.04.00',clientId:'56',userAgent:'Mozilla/5.0',embedUrl:'https://korean-video-lab.vercel.app/'}
];
async function probe(videoId,c){
  const client={clientName:c.clientName,clientVersion:c.clientVersion,hl:'ko',gl:'KR'};
  if(c.userAgent)client.userAgent=c.userAgent;
  const body={videoId,context:{client},contentCheckOk:true,racyCheckOk:true};
  if(c.embedUrl)body.context.thirdParty={embedUrl:c.embedUrl};
  const r=await fetch('https://www.youtube.com/youtubei/v1/player?prettyPrint=false',{
    method:'POST',
    headers:{'content-type':'application/json','user-agent':c.userAgent||'Mozilla/5.0','x-youtube-client-name':c.clientId,'x-youtube-client-version':c.clientVersion,'origin':'https://www.youtube.com'},
    body:JSON.stringify(body)
  });
  const d=await r.json(),formats=[...(d.streamingData?.adaptiveFormats||[]),...(d.streamingData?.formats||[])];
  const candidates=formats.filter(f=>f.url&&(/audio\//.test(f.mimeType||'')||/mp4/.test(f.mimeType||''))).sort((a,b)=>(Number(a.bitrate)||0)-(Number(b.bitrate)||0));
  const chosen=candidates[0]||null;
  let headStatus=null;
  if(chosen?.url){try{const h=await fetch(chosen.url,{method:'HEAD',headers:{'user-agent':c.userAgent||'Mozilla/5.0'}});headStatus=h.status}catch{}}
  return {client:c.name,playerStatus:r.status,playability:d.playabilityStatus?.status||null,reason:d.playabilityStatus?.reason||null,formatCount:formats.length,candidateCount:candidates.length,chosen:chosen?{itag:chosen.itag,mimeType:chosen.mimeType,bitrate:chosen.bitrate,contentLength:chosen.contentLength||null}:null,headStatus}
}
module.exports=async function(req,res){
  res.setHeader('Cache-Control','no-store');
  const u=new URL(req.url||'/','https://haneul.local'),id=String(u.searchParams.get('videoId')||'');
  if(!YT_ID.test(id))return res.status(400).json({ok:false,error:'bad_id'});
  const results=[];for(const c of CLIENTS){try{results.push(await probe(id,c))}catch(e){results.push({client:c.name,error:String(e.message||e)})}}
  return res.status(200).json({ok:results.some(x=>x.candidateCount>0&&x.headStatus&&x.headStatus<400),results})
};