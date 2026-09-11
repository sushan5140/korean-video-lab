const YT_ID=/^[A-Za-z0-9_-]{6,20}$/;
async function player(videoId){
  const body={
    videoId,
    context:{client:{
      clientName:'ANDROID_VR',
      clientVersion:'1.65.10',
      userAgent:'com.google.android.apps.youtube.vr.oculus/1.65.10 (Linux; U; Android 12L; eureka-user Build/SQ3A.220605.009.A1) gzip',
      osName:'Android',osVersion:'12L',androidSdkVersion:32,
      deviceMake:'Oculus',deviceModel:'Quest 3',hl:'ko',gl:'KR'
    }},
    contentCheckOk:true,racyCheckOk:true
  };
  const r=await fetch('https://www.youtube.com/youtubei/v1/player?prettyPrint=false',{
    method:'POST',
    headers:{'content-type':'application/json','user-agent':body.context.client.userAgent},
    body:JSON.stringify(body)
  });
  const d=await r.json();
  return {status:r.status,data:d}
}
module.exports=async function(req,res){
  res.setHeader('Cache-Control','no-store');
  const u=new URL(req.url||'/','https://haneul.local'),id=String(u.searchParams.get('videoId')||'');
  if(!YT_ID.test(id))return res.status(400).json({ok:false,error:'bad_id'});
  try{
    const p=await player(id),d=p.data||{},formats=[...(d.streamingData?.adaptiveFormats||[]),...(d.streamingData?.formats||[])];
    const candidates=formats.filter(f=>f.url&&(/audio\//.test(f.mimeType||'')||/mp4/.test(f.mimeType||''))).sort((a,b)=>(Number(a.bitrate)||0)-(Number(b.bitrate)||0));
    const chosen=candidates[0]||null;
    let headStatus=null;
    if(chosen?.url){
      try{const h=await fetch(chosen.url,{method:'HEAD',headers:{'user-agent':'com.google.android.apps.youtube.vr.oculus/1.65.10'}});headStatus=h.status}catch{}
    }
    return res.status(200).json({
      ok:!!chosen,playerStatus:p.status,playability:d.playabilityStatus?.status||null,
      reason:d.playabilityStatus?.reason||null,formatCount:formats.length,
      candidateCount:candidates.length,chosen:chosen?{itag:chosen.itag,mimeType:chosen.mimeType,bitrate:chosen.bitrate,contentLength:chosen.contentLength||null}:null,
      headStatus
    });
  }catch(e){return res.status(200).json({ok:false,error:String(e.message||e)})}
};