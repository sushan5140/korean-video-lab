function cues(b){return Array.isArray(b?.cues)?b.cues.filter(x=>x&&typeof x.ko==='string'):[]}
function toks(s=''){return String(s).replace(/[.,!?~…()[\]{}"']/g,' ').split(/\s+/).filter(Boolean)}
function answerPool(){return['있어요','없어요','가요','와요','먹어요','마셔요','해요','좋아해요','봐요','사요','자요']}
function lessonData(list){const valid=list.filter(x=>/[가-힣]/.test(x.ko||''));const reconstruct=[],dictation=[],shadowing=[],sentencePatterns=[],grammar=[],vocabulary=[],checkpoints=[];const freq=new Map();for(const x of valid){const ts=toks(x.ko);for(const w of ts){const k=w.replace(/[^가-힣]/g,'');if(k.length>1)freq.set(k,(freq.get(k)||0)+1)}if(ts.length>=3&&ts.length<=9){const a=ts[ts.length-1];reconstruct.push({cueIndex:Number(x.index),answer:a,distractors:answerPool().filter(y=>y!==a).slice(0,2)})}if(ts.length>=3&&ts.length<=12)dictation.push({cueIndex:Number(x.index)});if(ts.length>=3&&ts.length<=10)shadowing.push({cueIndex:Number(x.index)});if((x.ko||'').includes('안 ')){grammar.push({cueIndex:Number(x.index),form:'안 + verb',meaning:'everyday negation'});sentencePatterns.push({cueIndex:Number(x.index),pattern:'안 + verb',meaning:'do not / not',whenToUse:'Use it to negate an everyday action.'})}else if((x.ko||'').includes('에서'))grammar.push({cueIndex:Number(x.index),form:'에서',meaning:'place where an action happens'});else if((x.ko||'').includes('에'))grammar.push({cueIndex:Number(x.index),form:'에',meaning:'location / destination marker'})}
for(const [word,count] of [...freq.entries()].sort((a,b)=>b[1]-a[1]).slice(0,24)){const hit=valid.find(x=>(x.ko||'').includes(word));vocabulary.push({cueIndex:Number(hit?.index??0),word,base:word,meaning:'Useful word from this lesson',frequency:count})}
for(let i=2;i<valid.length;i+=Math.max(5,Math.floor(valid.length/4))){const a=valid[i],alts=valid.filter(x=>x!==a).slice(0,2).map(x=>x.ko);if(alts.length===2)checkpoints.push({cueIndex:Number(a.index),question:'Which Korean line appeared in this section?',answer:a.ko,options:[a.ko,...alts]})}
return{vocabulary,grammar,reconstruct,dictation,shadowing,sentencePatterns,checkpoints}}
function micro(list,total){const rows=list.filter(x=>Number.isInteger(Number(x.index))).sort((a,b)=>Number(a.index)-Number(b.index));const lessons=[];for(let i=0;i<rows.length-1&&lessons.length<5;i+=Math.max(1,Math.floor(rows.length/5))){const a=rows[i],b=rows[Math.min(rows.length-1,i+Math.max(2,Math.floor(rows.length/12)))];const st=Number(a.startMs||0),en=Number(b.endMs||0);if(en-st>=12000&&en-st<=75000)lessons.push({startCue:Number(a.index),endCue:Number(b.index),title:'Listen closely',why:'A compact section with useful real Korean.',focus:toks(a.ko).filter(x=>/[가-힣]/.test(x)).slice(0,3),difficulty:''})}return lessons}
let microGroqModel=null;
async function getMicroGroqModel(){
 const key=process.env.GROQ_API_KEY;if(!key)return null;
 if(microGroqModel)return microGroqModel;
 try{
  const r=await fetch('https://api.groq.com/openai/v1/models',{headers:{Authorization:'Bearer '+key}});
  if(!r.ok)return null;
  const d=await r.json(),ids=(d.data||[]).map(x=>String(x.id||'')).filter(Boolean);
  microGroqModel=ids.find(x=>/gpt-oss-20b/i.test(x))||ids.find(x=>/llama.*instant/i.test(x))||ids.find(x=>/llama/i.test(x))||ids[0]||null;
  return microGroqModel
 }catch{return null}
}
function stripFence(x=''){return String(x).trim().replace(/^\`\`\`(?:json)?\s*/i,'').replace(/\s*\`\`\`$/,'')}
async function groqMicro(list,level,title){
 const key=process.env.GROQ_API_KEY,model=await getMicroGroqModel();
 if(!key||!model||!list.length)return null;
 const compact=list.slice(0,110).map(x=>({index:Number(x.index),startMs:Number(x.startMs||0),endMs:Number(x.endMs||0),ko:String(x.ko||''),en:String(x.en||'')}));
 const r=await fetch('https://api.groq.com/openai/v1/chat/completions',{
  method:'POST',headers:{Authorization:'Bearer '+key,'content-type':'application/json'},
  body:JSON.stringify({model,temperature:.2,max_tokens:2400,messages:[
   {role:'system',content:'You are building Korean micro-lessons from a transcript. Return ONLY JSON. Choose 4-6 short, high-value learning moments. Every lesson must be grounded in one real cue index from the supplied transcript. Prefer reusable grammar/patterns and natural expressions, not random vocabulary. Keep explanations concise for learners.'},
   {role:'user',content:JSON.stringify({
     task:'Create Korean micro lessons',
     title,level,
     outputSchema:{lessons:[{anchorCue:0,startCue:0,endCue:0,title:'',why:'',pattern:'',meaning:'',whenToUse:'',exampleKo:'',exampleEn:'',focus:['']}]},
     rules:[
      'anchorCue/startCue/endCue must use supplied cue indexes',
      'segment duration should be about 12-60 seconds',
      'pattern should be the exact reusable Korean grammar/expression from the anchor cue',
      'meaning must be concise natural English',
      'whenToUse should explain real-life use in one sentence',
      'exampleKo should be a fresh short Korean example using the same pattern',
      'exampleEn should translate exampleKo',
      'focus max 3 short tags'
     ],
     cues:compact
   })}
  ]})
 });
 if(!r.ok)return null;
 const d=await r.json(),raw=stripFence(d?.choices?.[0]?.message?.content||'');
 try{return JSON.parse(raw)}catch{return null}
}
function enrichFallbackLessons(list,total){
 const base=micro(list,total),rows=[...list].sort((a,b)=>Number(a.index)-Number(b.index));
 return base.map(x=>{
  const anchor=rows.find(r=>Number(r.index)>=x.startCue&&Number(r.index)<=x.endCue)||rows.find(r=>Number(r.index)===x.startCue)||{};
  const ko=String(anchor.ko||'');
  let pattern='',meaning='',whenToUse='';
  if(ko.includes('는데')||ko.includes('는데요')){pattern='-는데요';meaning='adds background, contrast, or a softer lead-in';whenToUse='Use it when giving context, contrasting gently, or leading into what comes next.'}
  else if(ko.includes('아/어')&&ko.includes('보다')){pattern='-아/어 보다';meaning='try doing something';whenToUse='Use it when talking about trying an action or experience.'}
  else if(ko.includes('고 있어')){pattern='-고 있다';meaning='be doing / be in the middle of';whenToUse='Use it for an action currently in progress.'}
  else if(ko.includes('기 때문에')){pattern='-기 때문에';meaning='because / due to';whenToUse='Use it to give a clear reason or cause.'}
  else if(ko.includes('지만')){pattern='-지만';meaning='but / although';whenToUse='Use it to contrast two facts or situations.'}
  else if(ko.includes('에서')){pattern='에서';meaning='at / in, where an action happens';whenToUse='Use it after a place where an action takes place.'}
  else if(ko.includes('에')){pattern='에';meaning='at / to, for location or destination';whenToUse='Use it for a location, time, or destination depending on context.'}
  else{const ts=toks(ko).filter(x=>/[가-힣]/.test(x));pattern=ts.slice(-2).join(' ')||ko;meaning='useful expression from this scene';whenToUse='Reuse it in a similar everyday context.'}
  return{...x,anchorCue:Number(anchor.index??x.startCue),pattern,meaning,whenToUse,exampleKo:'',exampleEn:''}
 })
}
module.exports=async function(req,res){res.setHeader('Access-Control-Allow-Origin','*');res.setHeader('Cache-Control','public, s-maxage=86400, stale-while-revalidate=604800');if(req.method!=='POST')return res.status(405).json({ok:false,error:'method_not_allowed'});const b=req.body||{},list=cues(b),mode=String(b.mode||'');if(mode==='micro'){
 const ai=await groqMicro(list,String(b.level||''),String(b.title||''));
 if(ai&&Array.isArray(ai.lessons)&&ai.lessons.length)return res.status(200).json({ok:true,source:'groq-transcript-grounded',data:{lessons:ai.lessons}});
 return res.status(200).json({ok:true,source:'deterministic-transcript',data:{lessons:enrichFallbackLessons(list,b.totalCues)}})
};if(mode==='pattern'){const c=list.find(x=>Number(x.index)===Number(b.cueIndex))||list[Math.floor(list.length/2)]||{};let pattern=c.ko||'',meaning='Reusable expression from this scene',whenToUse='Use it in a similar real-life context.';if(pattern.includes('안 ')){pattern='안 + verb';meaning='simple everyday negation';whenToUse='Use before a verb to say you do not do something.'}return res.status(200).json({ok:true,source:'deterministic-transcript',data:{pattern,meaning,whenToUse,examples:[]}})}if(mode==='section'){const qs=lessonData(list).checkpoints.slice(0,3);return res.status(200).json({ok:true,source:'deterministic-transcript',data:{questions:qs}})}if(mode==='predict'){const idx=Number(b.cueIndex??-1),next=list.find(x=>Number(x.index)===idx+1)||list[list.length-1],alts=list.filter(x=>x!==next).slice(0,2).map(x=>x.ko);return res.status(200).json({ok:true,source:'deterministic-transcript',data:{options:next?[next.ko,...alts]:[],reason:'Choose the line that naturally follows in this transcript.'}})}if(mode==='sayit'||mode==='simplify'||mode==='reconstruct')return res.status(200).json({ok:false,error:'local_fallback_preferred'});return res.status(200).json({ok:true,source:'deterministic-transcript',data:lessonData(list)})};