const YT_ID=/^[A-Za-z0-9_-]{6,20}$/;
function hasKo(s){return /[가-힣]/.test(String(s||''))}
function toks(s){return String(s||'').trim().split(/\s+/).filter(Boolean)}
function koUnits(s=''){
  const clean=String(s).replace(/[^가-힣A-Za-z0-9]/g,'');
  const h=(clean.match(/[가-힣]/g)||[]).length,l=(clean.match(/[A-Za-z0-9]/g)||[]).length;
  return Math.max(1,h+l*.72)
}
function median(a){if(!a.length)return 0;const x=[...a].sort((m,n)=>m-n);return x[Math.floor(x.length/2)]}
function transcriptMetrics(cues){
  let ko=0,total=0,overlaps=0,long=0,heavyPadding=0;
  const msPerUnit=[];
  for(let i=0;i<cues.length;i++){
    const c=cues[i],text=String(c.ko||''),dur=Math.max(1,Number(c.endMs)-Number(c.startMs));
    const chars=(text.match(/[가-힣A-Za-z]/g)||[]).length,hangul=(text.match(/[가-힣]/g)||[]).length;
    ko+=hangul;total+=chars;
    const u=toks(text).reduce((n,w)=>n+koUnits(w),0);
    if(u)msPerUnit.push(dur/u);
    if(dur>6000)long++;
    if(i+1<cues.length&&Number(cues[i+1].startMs)<Number(c.endMs))overlaps++;
    if(u){
      const levelNatural=Math.max(320,u*225+toks(text).length*35);
      if(dur-levelNatural>1200)heavyPadding++;
    }
  }
  const transitions=Math.max(1,cues.length-1);
  return{
    cueCount:cues.length,
    hangulRatio:total?ko/total:0,
    overlapPct:overlaps/transitions,
    longCuePct:long/Math.max(1,cues.length),
    heavyPaddingPct:heavyPadding/Math.max(1,cues.length),
    medianMsPerUnit:median(msPerUnit)
  }
}
function verdict(metrics,translation){
  const fail=[],review=[],pass=[];
  if(metrics.cueCount<12)fail.push('too_few_cues'); else pass.push('cue_count');
  if(metrics.hangulRatio<.55)fail.push('korean_ratio_low');
  else if(metrics.hangulRatio<.82)review.push('korean_ratio_borderline');
  else pass.push('korean_ratio');
  if(metrics.heavyPaddingPct>=.42)review.push('heavy_padding');
  else if(metrics.heavyPaddingPct>=.22)review.push('some_padding');
  else pass.push('padding');
  if(metrics.overlapPct>=.78)review.push('rolling_overlap');
  else if(metrics.overlapPct>=.45)review.push('heavy_overlap');
  else pass.push('overlap');
  if(metrics.longCuePct>=.45)review.push('many_long_cues');
  else pass.push('cue_length');
  if(translation.checked&&translation.successRatio<.5)fail.push('english_translation_unhealthy');
  else if(translation.checked&&translation.successRatio<.8)review.push('english_translation_partial');
  else if(translation.checked)pass.push('english_translation');
  const status=fail.length?'FAIL':review.length?'REVIEW':'PASS';
  const score=Math.max(0,Math.min(100,100-fail.length*35-review.length*12));
  return{status,score,fail,review,pass}
}
async function translations(base,cues){
  const sample=[...new Set(cues.filter(c=>hasKo(c.ko)).map(c=>String(c.ko).trim()))].slice(0,5);
  if(!sample.length)return{checked:false,successRatio:0,count:0};
  try{
    const r=await fetch(base+'/api/meanings',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({texts:sample})});
    const d=await r.json(),map=d&&d.meanings||{};
    const ok=sample.filter(t=>String(map[t]||'').trim()).length;
    return{checked:true,successRatio:ok/sample.length,count:sample.length,source:d.source||null}
  }catch{return{checked:false,successRatio:0,count:sample.length}}
}
async function checkOne(base,id){
  if(!YT_ID.test(id))return{videoId:id,status:'FAIL',score:0,reason:'invalid_video_id'};
  try{
    const r=await fetch(base+'/api/captions?videoId='+encodeURIComponent(id)+'&cv=8',{headers:{accept:'application/json'}});
    const d=await r.json();
    if(!d.ok||!Array.isArray(d.cues)||!d.cues.length)return{videoId:id,status:'FAIL',score:0,reason:d.reason||d.error||'no_usable_korean_transcript',captionSource:d.source||null};
    const metrics=transcriptMetrics(d.cues),translation=await translations(base,d.cues),gate=verdict(metrics,translation);
    return{videoId:id,...gate,metrics:{...metrics,hangulRatio:+metrics.hangulRatio.toFixed(3),overlapPct:+metrics.overlapPct.toFixed(3),longCuePct:+metrics.longCuePct.toFixed(3),heavyPaddingPct:+metrics.heavyPaddingPct.toFixed(3),medianMsPerUnit:Math.round(metrics.medianMsPerUnit)},translation,captionSource:d.source||null,checkedAt:new Date().toISOString()}
  }catch(e){return{videoId:id,status:'FAIL',score:0,reason:'quality_check_failed'}}
}
module.exports=async function(req,res){
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Cache-Control','no-store');
  const host='https://korean-video-lab.vercel.app';
  if(req.method==='GET'){
    const u=new URL(req.url||'/','https://haneul.local'),id=String(u.searchParams.get('videoId')||'');
    return res.status(200).json(await checkOne(host,id))
  }
  if(req.method==='POST'){
    const ids=[...new Set((req.body?.videoIds||[]).map(x=>String(x||'').trim()).filter(Boolean))].slice(0,8);
    if(!ids.length)return res.status(400).json({ok:false,error:'missing_video_ids'});
    const results=[];for(const id of ids)results.push(await checkOne(host,id));
    return res.status(200).json({ok:true,count:results.length,results})
  }
  return res.status(405).json({ok:false,error:'method_not_allowed'})
};