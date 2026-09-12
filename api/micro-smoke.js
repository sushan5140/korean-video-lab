module.exports=async function(req,res){
  res.setHeader('Cache-Control','no-store');
  try{
    const host=req.headers.host,base='https://'+host;
    const cr=await fetch(base+'/api/captions?videoId=8rvv4RXQYb4&cv=8');
    const cd=await cr.json();
    if(!cd.ok||!Array.isArray(cd.cues))return res.status(200).json({ok:false,stage:'captions'});
    const cues=cd.cues,step=Math.max(1,Math.ceil(cues.length/70)),sample=[];
    for(let i=0;i<cues.length;i+=step)sample.push({index:i,startMs:cues[i].startMs,endMs:cues[i].endMs,ko:cues[i].ko,en:cues[i].en||''});
    const sr=await fetch(base+'/api/semantic',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({mode:'micro',videoId:'8rvv4RXQYb4',title:'Self-introduction',level:'Beginner',cues:sample,totalCues:cues.length})});
    const sd=await sr.json(),lessons=sd?.data?.lessons||[];
    res.status(200).json({ok:!!sd.ok,source:sd.source||null,count:lessons.length,sample:lessons.slice(0,2).map(x=>({anchorCue:x.anchorCue,startCue:x.startCue,endCue:x.endCue,title:x.title,pattern:x.pattern,meaning:x.meaning,whenToUse:x.whenToUse}))});
  }catch(e){res.status(200).json({ok:false,error:String(e.message||e)})}
};