const READY=[
['kHsEZUcyD7c','Slow Korean Podcast for Beginners','Beginner'],
['o6AP3nVNj_8','School · Super Beginner Story','Beginner'],
['79Pwq7MTUPE','Easy Korean Listening','Beginner'],
['Szv3gPqohbg','A Day in Seoul','Beginner'],
['ufDM439eOqU','Bike Trip in Seoul','Beginner'],
['2CXwo_O7xCg','Korean Restaurant Conversation','Beginner'],
['LWGNKfztgcI','Breakfast Routine','Beginner'],
['u_N9KjD_OVY','공부? · Short Story','Beginner'],
['k3FsjyRlZdU','Second Life','Lower Intermediate'],
['MF6MuUfo3gI','30 min Intermediate Podcast','Lower Intermediate'],
['pZz0-jlSMT4','Everything About Me','Intermediate'],
['xShgqxDB2Bc','Reading Reddit Posts About Korea','Lower Intermediate'],
['8rvv4RXQYb4','Self-introduction','Beginner'],
['GnwIG51ah7k','Hobbies Podcast','Beginner'],
['paToZla2CK8','Supermarket Korean','Beginner'],
['VMiPQcgq7wg','Daily Routines','Beginner'],
['-11--LSPNB0','Restaurant & Cafe Conversations','Beginner'],
['2NDS0F3bTwk','Korean Cafes','Beginner'],
['eF65dUUDcEQ','Talking About Daily Routines','Lower Intermediate'],
['mdASVEboloc','I Moved','Lower Intermediate'],
['mOry_eE_OZA','Blind Date Story','Lower Intermediate'],
['fNjtQyA43c8','All Thanks to You','Lower Intermediate'],
['02HTENb9KGg','Daily Routine Vlog','Lower Intermediate'],
['5n7HFxyE4ZI','Restaurant & Cafe Native Conversations','Lower Intermediate'],
['x031U15y6_U','40 min Intermediate Podcast','Lower Intermediate'],
['6Y7VwFR5cDg','1 Hour Natural Conversation','Intermediate'],
['QLJVSqyxU4M','Park Trip in Korea','Intermediate'],
['EMUpahrg1Dg','Rainy Season','Intermediate'],
['2I6UMxg6cDc','Me & Cat','Intermediate'],
['Gy_nMwa51nY','Traditional Market Shopping','Beginner'],
['_7fhtMzAfOM','Taxi Cafe Convenience Store','Lower Intermediate'],
['sa0mN3K7BIM','Beginner Korean Vlog','Beginner'],
['jmAzSdwYBj4','Meeting Korean Celebrities','Intermediate'],
['FY9_RtFt84U','Movie Theater','Beginner'],
['Oh8fiYihNhM','Cherry Blossom Picnic','Beginner'],
['NyCrQ-NZMbg','Korean Street Food','Beginner'],
['xUbMF1aEH8Y','University Students Hang Out','Beginner'],
['p5kMoLahPa4','10 Short Conversations','Lower Intermediate'],
['5XyvYJ0u8S4','Love Languages Podcast','Intermediate'],
['zYsoHRFmC0Y','Cafe Vlog','Lower Intermediate'],
['xuYpxWYeOKM','Grocery Shopping Photos','Beginner'],
['7aSzPwA2DPo','Why Learn Korean Podcast','Intermediate'],
['aoJXA2O2hoM','Doctor & Pharmacy','Intermediate']
];
function toks(s){return String(s||'').trim().split(/\s+/).filter(Boolean)}
function units(w=''){const c=String(w).replace(/[^가-힣A-Za-z0-9]/g,''),h=(c.match(/[가-힣]/g)||[]).length,l=(c.match(/[A-Za-z0-9]/g)||[]).length;return Math.max(1,h+l*.72)}
function cfg(level){if(level==='Intermediate')return{minWord:72,targetUnit:205,maxTailPad:180,gapTrim:.30};if(level==='Lower Intermediate')return{minWord:80,targetUnit:230,maxTailPad:220,gapTrim:.26};return null}
function analyze(cues,level){
 const p=cfg(level);if(!p)return{heavy:0,total:cues.length,maxExcess:0};
 let heavy=0,maxExcess=0;
 for(let i=0;i<cues.length;i++){
  const c=cues[i],a=toks(c.ko);if(!a.length)continue;
  let st=Number(c.startMs)||0,en=Math.max(st+320,Number(c.endMs)||st+1800);
  const next=i+1<cues.length?cues[i+1]:null,prev=i>0?cues[i-1]:null;
  if(next&&Number(next.startMs)>st+180)en=Math.min(en,Number(next.startMs)-12);
  if(next){const rawGap=Number(next.startMs)-en;if(rawGap>280)en-=Math.min(200,Math.round((rawGap-280)*p.gapTrim))}
  if(prev&&Number(prev.endMs)>st&&Number(prev.endMs)-st>220)st+=18;
  const u=a.reduce((n,w)=>n+units(w),0);
  const pauses=a.reduce((n,w)=>n+(/[.!?…~]$/.test(w)?1:/[,，]$/.test(w)?.4:0),0);
  const natural=Math.max(a.length*p.minWord,Math.round(u*p.targetUnit+pauses*85));
  const rawSpan=Math.max(0,en-st),allowed=natural+p.maxTailPad,excess=rawSpan-allowed;
  if(excess>950){heavy++;maxExcess=Math.max(maxExcess,excess)}
 }
 return{heavy,total:cues.length,maxExcess:Math.round(maxExcess)}
}
module.exports=async function(req,res){
 res.setHeader('Cache-Control','no-store');
 const rows=[];
 for(let i=0;i<READY.length;i+=4){
  const batch=READY.slice(i,i+4);
  const out=await Promise.all(batch.map(async([id,title,level])=>{
   try{
    const r=await fetch('https://korean-video-lab.vercel.app/api/captions?videoId='+encodeURIComponent(id)+'&cv=8');
    const d=await r.json(),a=analyze(d.cues||[],level);
    return{id,title,level,ok:!!d.ok,...a,pct:a.total?+(a.heavy/a.total*100).toFixed(1):0}
   }catch(e){return{id,title,level,ok:false,error:String(e.message||e),heavy:0,total:0,pct:0}}
  }));
  rows.push(...out)
 }
 const affected=rows.filter(x=>x.heavy>0).sort((a,b)=>b.pct-a.pct||b.heavy-a.heavy);
 res.status(200).json({ok:true,readyCount:rows.length,affectedVideos:affected.length,affectedCues:affected.reduce((n,x)=>n+x.heavy,0),affected})
};