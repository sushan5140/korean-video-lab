const YT_ID=/^[A-Za-z0-9_-]{6,20}$/;

function extractObject(html,key){
  const k=html.indexOf(key);if(k<0)return null;
  const st=html.indexOf('{',k+key.length);if(st<0)return null;
  let d=0,q=false,e=false;
  for(let i=st;i<html.length;i++){
    const c=html[i];
    if(q){if(e)e=false;else if(c==='\\')e=true;else if(c==='"')q=false;continue}
    if(c==='"'){q=true;continue}
    if(c==='{')d++;
    else if(c==='}'&&--d===0)return html.slice(st,i+1)
  }
  return null
}

async function directAudioUrl(videoId){
  const r=await fetch('https://www.youtube.com/watch?v='+encodeURIComponent(videoId)+'&hl=ko',{
    headers:{'user-agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36','accept-language':'ko-KR,ko;q=0.9,en;q=0.6'}
  });
  if(!r.ok)throw new Error('youtube_'+r.status);
  const html=await r.text();
  const raw=extractObject(html,'ytInitialPlayerResponse');
  if(!raw)throw new Error('player_response_missing');
  let p;try{p=JSON.parse(raw)}catch{throw new Error('player_response_unreadable')}
  const formats=(p?.streamingData?.adaptiveFormats||[]).filter(x=>String(x.mimeType||'').startsWith('audio/')&&x.url);
  if(!formats.length)throw new Error('direct_audio_unavailable');
  formats.sort((a,b)=>(Number(a.contentLength||Infinity)-Number(b.contentLength||Infinity))||(Number(a.bitrate||0)-Number(b.bitrate||0)));
  const under=formats.filter(x=>!x.contentLength||Number(x.contentLength)<24*1024*1024);
  const pick=(under.length?under:formats)[0];
  return{url:pick.url,mimeType:pick.mimeType||'',contentLength:Number(pick.contentLength||0),durationMs:Number(pick.approxDurationMs||0)};
}

async function groqAlign(audio){
  const key=process.env.GROQ_API_KEY;if(!key)throw new Error('groq_key_missing');
  const form=new FormData();
  form.append('model','whisper-large-v3-turbo');
  form.append('url',audio.url);
  form.append('language','ko');
  form.append('response_format','verbose_json');
  form.append('timestamp_granularities[]','word');
  form.append('timestamp_granularities[]','segment');
  form.append('temperature','0');
  const r=await fetch('https://api.groq.com/openai/v1/audio/transcriptions',{
    method:'POST',
    headers:{Authorization:'Bearer '+key},
    body:form
  });
  const text=await r.text();
  let d;try{d=JSON.parse(text)}catch{d={raw:text.slice(0,500)}}
  if(!r.ok)throw new Error('groq_'+r.status+':'+String(d?.error?.message||d?.raw||'transcription_failed').slice(0,220));
  const words=(Array.isArray(d.words)?d.words:[]).map(w=>({
    word:String(w.word||'').trim(),
    startMs:Math.max(0,Math.round(Number(w.start||0)*1000)),
    endMs:Math.max(0,Math.round(Number(w.end||0)*1000))
  })).filter(w=>w.word&&w.endMs>w.startMs);
  const segments=(Array.isArray(d.segments)?d.segments:[]).map(s=>({
    startMs:Math.max(0,Math.round(Number(s.start||0)*1000)),
    endMs:Math.max(0,Math.round(Number(s.end||0)*1000))
  })).filter(s=>s.endMs>s.startMs);
  if(!words.length)throw new Error('groq_no_word_timestamps');
  return{words,segments};
}

module.exports=async function(req,res){
  res.setHeader('Access-Control-Allow-Origin','*');
  const u=new URL(req.url||'/','https://haneul.local'),videoId=String(u.searchParams.get('videoId')||'');
  if(!YT_ID.test(videoId))return res.status(400).json({ok:false,error:'invalid_video_id'});
  try{
    let audio;
    try{audio=await directAudioUrl(videoId)}
    catch(e){audio={url:'https://www.youtube.com/watch?v='+encodeURIComponent(videoId),mimeType:'youtube-watch-url',contentLength:0,durationMs:0,fallback:true}}
    const aligned=await groqAlign(audio);
    res.setHeader('Cache-Control','public, s-maxage=604800, stale-while-revalidate=2592000');
    return res.status(200).json({ok:true,source:'groq-whisper-word',videoId,audio:{contentLength:audio.contentLength,durationMs:audio.durationMs},wordCount:aligned.words.length,segmentCount:aligned.segments.length,words:aligned.words});
  }catch(e){
    res.setHeader('Cache-Control','no-store');
    return res.status(200).json({ok:false,error:String(e.message||'alignment_failed')});
  }
};