(()=>{'use strict';
const el=id=>document.getElementById(id),safe=x=>String(x??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const client=window.supabase?.createClient('https://uyltjaftajwkujjhuric.supabase.co','sb_publishable_WNWIyMORd5O4N_4qTWMO_w_HbHooVeW',{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
let user=null,communities=[],space=null,dashboard=null,readyCatalog=[],selected=[],activeVideo=null,activeCues=[],speechRecognition=null,speechFeedbackReady=false,ambKey='',ambPosts=[],ambLastKind='content_kit';
const ui=(s,bad=false,good=false)=>{const e=el('status');e.textContent=s;e.className='notice'+(bad?' error':good?' good':'');e.hidden=!s};
async function rpc(name,args){const {data,error}=await client.rpc(name,args||{});if(error)throw Error(error.message||'Request failed');return data}
function ensureCode(){if(!space?.code)throw Error('Select a creator community first');return space.code}
function videoMeta(id){return readyCatalog.find(v=>v.id===id)||{id,title:'Korean video · '+id,channel:'YouTube',thumb:'https://i.ytimg.com/vi/'+id+'/hqdefault.jpg',level:''}}
function idFromUrl(value){
 const s=String(value||'').trim();
 if(/^[\w-]{11}$/.test(s))return s;
 try{const u=new URL(s);if(!/(^|\.)youtube\.com$|(^|\.)youtu\.be$/.test(u.hostname))return'';
 const v=u.hostname.endsWith('youtu.be')?u.pathname.slice(1).split('/')[0]:u.pathname.startsWith('/shorts/')?u.pathname.split('/')[2]:u.pathname.startsWith('/embed/')?u.pathname.split('/')[2]:u.searchParams.get('v');
 return /^[\w-]{11}$/.test(v||'')?v:''}catch{return''}
}
async function ai(mode,body={}){
 const {data}=await client.auth.getSession(),token=data?.session?.access_token;
 if(!token)throw Error('Please sign in again.');
 const res=await fetch('/api/creator-ai',{method:'POST',headers:{'content-type':'application/json',authorization:'Bearer '+token},body:JSON.stringify({code:ensureCode(),creator:space.title,mode,...body})});
 const json=await res.json().catch(()=>null);
 if(!res.ok||!json?.ok)throw Error(json?.error||'AI is temporarily unavailable');
 return json.text
}
function busy(button,task,success){
 if(button.disabled)return;
 const previous=button.textContent;button.disabled=true;button.textContent='Working…';
 Promise.resolve().then(task).then(result=>{if(success)success(result)}).catch(error=>ui(error?.message||'Something went wrong',true)).finally(()=>{button.disabled=false;button.textContent=previous})
}
function tab(name){document.getElementById(name)?.scrollIntoView({behavior:'smooth',block:'start'})}
async function refreshAmbPosts(){
 if(!space?.code)return;
 try{
 const rows=await rpc('haneul_ambassador_list_posts',{p_code:space.code});
 ambPosts=Array.isArray(rows)?rows:[];
 renderAmbLibrary()
 }catch(e){ui(e?.message||'Could not load your content library.',true)}
}
async function load(code){
 ui('Loading your ambassador studio…');
 try{
 const [s,d]=await Promise.all([
 rpc('haneul_creator_space',{p_code:code}),
 rpc('haneul_creator_dashboard',{p_code:code})
 ]);
 if(!s?.code||s.is_owner!==true)throw Error('This Google account does not manage the requested ambassador signature.');
 space=s;dashboard=d||{};
 selected=(s.days||[]).slice().sort((a,b)=>a.day-b.day).map(x=>x.videoId);
 el('role').textContent=code==='HNL-X-OWNER-PREVIEW-SIG00'?'Owner preview · private':'Ambassador · private';
 el('codeNote').textContent=code==='HNL-X-OWNER-PREVIEW-SIG00'?'Preview code is paused: only your admin account can access it.':'Signature '+code+' · Admin and assigned ambassador only.';
 el('ambIdentity').textContent=(s.title||s.label||'Ambassador')+' · '+code;
 el('ambMembers').textContent=Number(dashboard.members||0);
 el('ambChallengeCount').textContent=Number(dashboard.challenge_completions||0);
 el('ambSpeakingCount').textContent=Number(dashboard.speaking_completions||0);
 const communityUrl='/creators/?code='+encodeURIComponent(code);
 el('viewCommunity').href=communityUrl;el('viewCommunityTop').href=communityUrl;
 renderCreator();await refreshAmbPosts();ui('');
 history.replaceState(null,'','/ambassadors/?code='+encodeURIComponent(code));
 }catch(e){ui(e?.message||'Could not load ambassador tools.',true)}
}
async function init(){
 if(!client){ui('Could not initialize Haneul Google sign-in. Reload and retry.',true);return}
 el('login').onclick=async()=>{
  el('login').disabled=true;
  try{const {error}=await client.auth.signInWithOAuth({provider:'google',options:{redirectTo:location.origin+'/ambassadors/'}});
   if(error)throw error}
  catch(e){ui(e?.message||'Google sign-in could not start.',true);el('login').disabled=false}
 };
 try{
  const {data,error}=await client.auth.getSession();if(error)throw error;
  if(!data?.session){el('gate').hidden=false;ui('Sign in to open your private ambassador studio.');return}
  user=data.session.user;
  const places=await rpc('haneul_creator_my_communities');
  communities=(Array.isArray(places)?places:[]).filter(x=>x.is_owner===true);
  if(!communities.length){
    el('gate').hidden=false;
    el('gateText').textContent='Your signed-in Google account ('+String(user.email||'unknown email')+') is not assigned to an ambassador signature. Contact the Haneul admin to assign your Google email.';
    ui('Ambassador permissions are not linked to this Google account.',true);return
  }
  const catalog=await fetch('/data/creator-ready-catalog.json',{cache:'no-store'});
  if(!catalog.ok)throw Error('Ready lesson catalog could not load.');
  const c=await catalog.json();readyCatalog=Array.isArray(c.videos)?c.videos:[];
  el('gate').hidden=true;el('workspace').hidden=false;
  el('community').innerHTML=communities.map(x=>'<option value="'+safe(x.code)+'">'+safe(x.label||x.code)+' · '+safe(x.code)+'</option>').join('');
  el('community').onchange=()=>void load(el('community').value);
  const requested=new URLSearchParams(location.search).get('code')||'';
  const chosen=communities.find(x=>x.code===requested)?.code||communities.find(x=>x.code==='HNL-X-OWNER-PREVIEW-SIG00')?.code||communities[0].code;
  el('community').value=chosen;await load(chosen)
 }catch(e){ui(e?.message||'Ambassador Studio is temporarily unavailable.',true)}
}
function parseAmbQuiz(raw){
 const cleaned=String(raw||'').trim().replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'');
 let parsed;try{parsed=JSON.parse(cleaned)}catch{throw Error('This AI model did not return a playable JSON quiz. Try generating again, or select another OpenRouter model.')}
 const list=parsed?.questions||parsed?.quiz;
 if(!Array.isArray(list)||list.length!==5)throw Error('The quiz needs exactly five questions. Please regenerate it.');
 return list.map((q,i)=>{
  if(typeof q.question!=='string'||q.question.trim().length<3||!Array.isArray(q.options)||q.options.length!==3||
    q.options.some(x=>typeof x!=='string'||!x.trim())||!Number.isInteger(q.answer)||q.answer<0||q.answer>2)
     throw Error('Quiz question '+(i+1)+' is missing three options or a valid answer index. Regenerate or correct the JSON.');
  return{question:q.question.trim().slice(0,450),options:q.options.map(x=>x.trim().slice(0,200)),answer:q.answer,explanation:String(q.explanation||'').slice(0,500)}
 })
}
function renderAmbLibrary(){const box=el('ambLibrary');if(!box)return;
const rows=ambPosts.filter(p=>p.kind==='content_kit'||p.kind==='quiz');
box.innerHTML=rows.length?rows.map(p=>'<article class="videoCard"><div style="flex:1"><h3>'+safe(p.title)+'</h3><small>'+safe(p.kind==='quiz'?'Quiz':'Content kit')+' · '+(p.published?'Shared with community':'Private draft')+'</small></div><button class="btn small alt" data-open-post="'+Number(p.id)+'">Open</button>'+(space?.is_owner?'<button class="btn small alt" data-publish-post="'+Number(p.id)+'">'+(p.published?'Make private':'Share to community')+'</button>':'')+'</article>').join(''):'<div class="empty">No saved creator content yet.</div>';
box.querySelectorAll('[data-open-post]').forEach(b=>b.onclick=()=>{const p=ambPosts.find(p=>Number(p.id)===Number(b.dataset.openPost));if(!p)return;el('ambOutputWrap').hidden=false;el('ambOutput').value=String(p.body?.text||'');el('ambPostTitle').value=p.title;ambLastKind=p.kind;tab('ambassador')});
box.querySelectorAll('[data-publish-post]').forEach(b=>b.onclick=()=>busy(b,async()=>{const p=ambPosts.find(p=>Number(p.id)===Number(b.dataset.publishPost));await rpc('haneul_ambassador_set_published',{p_code:ensureCode(),p_id:p.id,p_published:!p.published});await refreshAmbPosts()},()=>ui('Content visibility updated.',false,true)))}
function renderCreator(){
 if(!space?.is_owner)return;
 el('creatorTitle').value=space.title||'';el('creatorIntro').value=space.introduction||'';
 el('creatorChallenge').value=space.challenge_title||'';el('creatorPrompt').value=space.weekly_prompt||'';
 el('editPlan').value=space.challenge_plan||'';renderSelected();renderCatalog();
}
function renderSelected(){
 el('selectedVideos').innerHTML=selected.length?selected.map((id,i)=>{
  const v=videoMeta(id);
  return '<div class="selected"><span>DAY '+(i+1)+'</span><b>'+safe(v.title)+'</b><button type="button" aria-label="Remove '+safe(v.title)+'" data-remove="'+i+'">Remove</button></div>'
 }).join(''):'<div class="muted">No challenge videos selected yet.</div>';
 el('selectedVideos').querySelectorAll('[data-remove]').forEach(b=>b.onclick=()=>{selected.splice(Number(b.dataset.remove),1);renderSelected();renderCatalog()});
}
function renderCatalog(){
 const q=String(el('catalogSearch').value||'').toLowerCase().trim();
 const choices=readyCatalog.filter(v=>!selected.includes(v.id)&&(!q||[v.title,v.channel,v.level,...(v.topics||[])].some(x=>String(x||'').toLowerCase().includes(q)))).slice(0,12);
 el('catalogResults').innerHTML=choices.map(v=>'<article class="videoCard"><img loading="lazy" src="'+safe(v.thumb)+'" alt=""><div><h3>'+safe(v.title)+'</h3><small>'+safe(v.level)+' · '+safe(v.channel)+'</small></div><button class="btn small alt" type="button" data-add="'+safe(v.id)+'" '+(selected.length>=7?'disabled':'')+'>+ Add</button></article>').join('')||'<p class="muted">No matching Ready lessons available.</p>';
 el('catalogResults').querySelectorAll('[data-add]').forEach(b=>b.onclick=()=>{
  if(selected.length>=7)return ui('Maximum seven challenge videos.',true);
  selected.push(b.dataset.add);renderSelected();renderCatalog()
 });
}
el('catalogSearch').addEventListener('input',renderCatalog);
el('saveCreator').onclick=()=>busy(el('saveCreator'),async()=>{
 if(selected.length!==7)throw Error('Choose exactly seven different Ready Korean videos to publish a seven-day challenge.');
 await rpc('haneul_creator_save',{p_code:ensureCode(),p_title:el('creatorTitle').value,p_intro:el('creatorIntro').value,p_challenge:el('creatorChallenge').value,p_prompt:el('creatorPrompt').value,p_videos:selected});
 await load(space.code);tab('creator');
},()=>ui('Your creator experience is published.',false,true));
el('generatePlan').onclick=()=>busy(el('generatePlan'),async()=>{
 if(selected.length!==7)throw Error('Choose all seven Ready videos before generating your seven-day plan.');
 const content=selected.map((id,i)=>(i+1)+'. '+videoMeta(id).title+' ('+videoMeta(id).level+')').join('\n');
 const prompt='Challenge title: '+el('creatorChallenge').value+'; weekly speaking: '+el('creatorPrompt').value;
 return ai('challenge',{context:content,prompt});
},text=>{el('editPlan').value=text;ui('AI plan generated. Read/edit it, then save to publish.',false,true)});
el('savePlan').onclick=()=>busy(el('savePlan'),async()=>{
 await rpc('haneul_creator_save_plan',{p_code:ensureCode(),p_plan:el('editPlan').value});
 space.challenge_plan=el('editPlan').value;
 // The published plan is displayed on the separate community page.
},()=>ui('Challenge plan published to your community.',false,true));
el('publishVideo').onclick=()=>busy(el('publishVideo'),async()=>{
 const id=idFromUrl(el('creatorVideoUrl').value),title=el('creatorVideoTitle').value.trim();
 if(!id)throw Error('Enter a valid YouTube video URL or 11-character ID.');
 if(title.length<3)throw Error('Enter a video title.');
 el('publishStatus').textContent='Checking the Korean transcript and English meaning service…';
 const r=await fetch('/api/quality?videoId='+encodeURIComponent(id)+'&level=Intermediate',{cache:'no-store',headers:{Authorization:'Bearer '+(await client.auth.getSession()).data?.session?.access_token||''}});
 const qa=await r.json();
 if(qa.status==='FAIL'||Number(qa.metrics?.cueCount||0)<12||qa.translation?.checked!==true||Number(qa.translation?.successRatio||0)<.8)throw Error('Cannot publish this video: Korean captions or English meaning service are not reliable enough. Try another captioned video.');
 await rpc('haneul_creator_submit_video',{p_code:ensureCode(),p_video_id:id,p_title:title});
 const s=await rpc('haneul_creator_space',{p_code:space.code});space=s;
 el('publishStatus').textContent='Published as an interactive creator lesson. Its word-level audio timing is still estimated until reviewed.';
 return id;
},()=>ui('Creator video lesson published.',false,true));
const ambassadorModel=()=>el('ambModel').value==='custom'?el('ambCustomModel').value.trim():el('ambModel').value;
el('ambModel').onchange=()=>{el('ambCustomModel').hidden=el('ambModel').value!=='custom'};
el('ambDisconnect').onclick=()=>{ambKey='';el('ambKey').value='';ui('OpenRouter key disconnected.',false,true)};
async function ambassadorGenerate(mode){
if(!space?.is_owner)throw Error('Ambassador-only feature.');
ambKey=el('ambKey').value.trim()||ambKey;if(!ambKey.startsWith('sk-or-'))throw Error('Connect your own OpenRouter API key.');
const model=ambassadorModel();if(!model||model==='custom')throw Error('Select a model ID.');
const {data}=await client.auth.getSession();if(!data?.session?.access_token)throw Error('Google session expired.');
const aggregate={members:Number(dashboard?.members||0),challengeDays:Number(dashboard?.challenge_completions||0),speakingWeeks:Number(dashboard?.speaking_completions||0),weeklyPrompt:space.weekly_prompt||''};
const context=mode==='learningDoctor'?JSON.stringify(aggregate):el('ambContext').value;
const r=await fetch('/api/ambassador-ai',{method:'POST',headers:{'content-type':'application/json',Authorization:'Bearer '+data.session.access_token,'x-openrouter-key':ambKey},body:JSON.stringify({code:ensureCode(),mode,model,topic:el('ambTopic').value,platform:el('ambPlatform').value,level:el('ambLevel').value,context,creator:space.title})});
const response=await r.json().catch(()=>null);if(!r.ok||!response?.ok)throw Error(response?.error||'AI generation failed');
ambLastKind=mode==='quizBattle'?'quiz':'content_kit';el('ambOutputWrap').hidden=false;el('ambOutput').value=mode==='quizBattle'?JSON.stringify({questions:parseAmbQuiz(response.text)},null,2):response.text;
el('ambPostTitle').value=el('ambTopic').value.trim().slice(0,140)||(mode==='learningDoctor'?'Community content plan':mode==='quizBattle'?'Korean quiz battle':'Korean content kit')
}
for(const [id,mode] of [['ambGenerateKit','contentKit'],['ambGenerateQuiz','quizBattle'],['ambGenerateDoctor','learningDoctor']])el(id).onclick=()=>busy(el(id),()=>ambassadorGenerate(mode),()=>ui('Generated. Review the Korean before sharing.',false,true));
el('ambSavePost').onclick=()=>busy(el('ambSavePost'),async()=>{const title=el('ambPostTitle').value.trim(),content=el('ambOutput').value.trim();if(title.length<3||content.length<5)throw Error('Add a title and content.');await rpc('haneul_ambassador_save_post',{p_code:ensureCode(),p_kind:ambLastKind,p_title:title,p_body:ambLastKind==='quiz'?{text:content,quiz:parseAmbQuiz(content)}:{text:content},p_published:false});await refreshAmbPosts()},()=>ui('Saved privately. Share it from your library.',false,true));
el('ambCopy').onclick=async()=>{try{await navigator.clipboard.writeText(el('ambOutput').value);ui('Copied.',false,true)}catch{ui('Select and copy the text manually.',true)}};
el('ambShareVideo').onclick=()=>busy(el('ambShareVideo'),async()=>{const videoId=idFromUrl(el('ambVideoLink').value),title=el('ambVideoTitle').value.trim(),note=el('ambVideoNote').value.trim();if(!videoId)throw Error('Enter a valid YouTube link.');if(title.length<3)throw Error('Add a video title.');await rpc('haneul_ambassador_save_post',{p_code:ensureCode(),p_kind:'video',p_title:title,p_body:{videoId,note},p_published:true});await refreshAmbPosts()},()=>{ui('YouTube video shared with your referral community.',false,true);el('ambVideoLink').value='';el('ambVideoTitle').value='';el('ambVideoNote').value=''});
void init();
})();
