const YT_ID=/^[A-Za-z0-9_-]{6,20}$/;
function decode(s=''){return String(s).replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'")}
function extractJsonArray(html,key){const k=html.indexOf(key);if(k<0)return null;const st=html.indexOf('[',k+key.length);if(st<0)return null;let d=0,q=false,e=false;for(let i=st;i<html.length;i++){const c=html[i];if(q){if(e)e=false;else if(c==='\\')e=true;else if(c==='"')q=false;continue}if(c==='"'){q=true;continue}if(c==='[')d++;else if(c===']'&&--d===0)return html.slice(st,i+1)}return null}
function clean(s=''){return decode(String(s)).replace(/\n+/g,' ').replace(/\s+/g,' ').trim()}
function eventAnchors(data){
 const out=[];
 for(const e of data?.events||[]){
  if(e.tStartMs==null||!Array.isArray(e.segs))continue;
  const startMs=Number(e.tStartMs),endMs=startMs+Math.max(250,Number(e.dDurationMs||1800));
  const text=clean(e.segs.map(s=>s.utf8||'').join(''));
  if(!text)continue;
  const raw=e.segs.map((s,i)=>({text:clean(s.utf8||''),offset:Number.isFinite(Number(s.tOffsetMs))?Number(s.tOffsetMs):null,i})).filter(x=>x.text);
  const timed=raw.filter(x=>x.offset!=null);
  const segments=[];
  for(let i=0;i<timed.length;i++){
    const x=timed[i],next=timed[i+1];
    segments.push({text:x.text,startMs:startMs+x.offset,endMs:next?startMs+next.offset:endMs})
  }
  out.push({startMs,endMs,text,segments})
 }
 return out
}
module.exports=async function(req,res){
 res.setHeader('Access-Control-Allow-Origin','*');
 res.setHeader('Cache-Control','public, s-maxage=86400, stale-while-revalidate=604800');
 const u=new URL(req.url||'/','https://haneul.local'),videoId=String(u.searchParams.get('videoId')||'');
 if(!YT_ID.test(videoId))return res.status(400).json({ok:false,error:'Invalid video id',events:[]});
 try{
  const w=await fetch('https://www.youtube.com/watch?v='+encodeURIComponent(videoId)+'&hl=ko',{headers:{'user-agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36','accept-language':'ko-KR,ko;q=0.9,en;q=0.6'}});
  if(!w.ok)throw new Error('youtube_'+w.status);
  const html=await w.text(),raw=extractJsonArray(html,'"captionTracks":');
  if(!raw)return res.status(200).json({ok:false,reason:'no-caption-track',events:[]});
  let tracks;try{tracks=JSON.parse(raw)}catch{return res.status(200).json({ok:false,reason:'caption-metadata-unreadable',events:[]})}
  const ko=tracks.find(t=>t.languageCode==='ko'&&t.kind!=='asr')||tracks.find(t=>t.languageCode==='ko')||tracks.find(t=>String(t.languageCode||'').startsWith('ko'));
  if(!ko?.baseUrl)return res.status(200).json({ok:false,reason:'no-korean-caption-track',events:[]});
  const cu=new URL(ko.baseUrl);cu.searchParams.set('fmt','json3');
  const r=await fetch(cu,{headers:{'user-agent':'Mozilla/5.0'}});
  if(!r.ok)throw new Error('caption_'+r.status);
  const events=eventAnchors(await r.json());
  const timed=events.reduce((n,e)=>n+(e.segments?.length||0),0);
  return res.status(200).json({ok:true,source:'youtube-json3-anchors',videoId,trackKind:ko.kind||'manual',events,timedSegments:timed})
 }catch(e){return res.status(200).json({ok:false,reason:String(e.message||'anchor-fetch-failed'),events:[]})}
};