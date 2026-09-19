// Temporary fixed-source curation route for the public Intermediate Korean educational podcast.
module.exports=async(req,res)=>{if(req.method!=='GET')return res.status(405).json({ok:false});try{
 const feeds={min:'https://anchor.fm/s/10434cc2c/podcast/rss',choi:'https://anchor.fm/s/c5592f0c/podcast/rss',didi:'https://anchor.fm/s/e3a4142c/podcast/rss'};const name=String(req.query?.feed||'min');if(!feeds[name])return res.status(400).json({ok:false,error:'unknown_feed'});const r=await fetch(feeds[name],{signal:AbortSignal.timeout(15000)});
 if(!r.ok)return res.status(502).json({ok:false,code:r.status});
 const xml=await r.text();
 const decode=s=>String(s||'').replace(/<!\[CDATA\[|\]\]>/g,'').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
 const items=[...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(m=>{
 const x=m[1],title=decode(x.match(/<title>([\s\S]*?)<\/title>/)?.[1]),desc=decode(x.match(/<(?:content:encoded|description)>([\s\S]*?)<\/(?:content:encoded|description)>/)?.[1]);
 const id=(x.match(/(?:youtu\.be\/|youtube\.com\/watch\?v=)([A-Za-z0-9_-]{11})/)||[])[1]||'';
 return{title,id,description:desc.slice(0,400)};
 }).filter(x=>x.id);
 res.setHeader('cache-control','private, no-store');return res.status(200).json({ok:true,count:items.length,items:items.slice(0,100)})
 }catch(e){return res.status(502).json({ok:false,error:'source_unavailable'})}
};