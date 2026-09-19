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
function tab(name){
 const desired=document.querySelector('[data-section][id="'+name+'"]');
 if(!desired||['creator','ambassador'].includes(name)&&!space?.is_owner)return;
 document.querySelectorAll('[data-section]').forEach(e=>e.hidden=e!==desired);
 document.querySelectorAll('#tabs button').forEach(e=>e.classList.toggle('on',e.dataset.tab===name));
 if(name==='dashboard')void refreshDashboard();
 if(name==='videos'){renderVideos();renderSharedVideos();const requestedVideo=new URLSearchParams(location.search).get('video');if(requestedVideo&&/^[A-Za-z0-9_-]{11}$/.test(requestedVideo)){const card=el('ambSharedVideos')?.querySelector('[data-share-video="'+requestedVideo+'"]');card?.closest('.videoCard')?.scrollIntoView({behavior:'smooth',block:'center'})}}
}
async function init(){
 if(!client){ui('Haneul login could not initialize. Refresh or disable a blocker.',true);return}
 el('login').onclick=async()=>{el('login').disabled=true;try{const {error}=await client.auth.signInWithOAuth({provider:'google',options:{redirectTo:location.origin+'/creators/'}});if(error)throw error}catch(e){ui(e.message,true);el('login').disabled=false}};
 const {data,error}=await client.auth.getSession();
 if(error){ui('Could not restore your Google session. Try reloading.',true);return}
 if(!data?.session){el('gate').hidden=false;ui('Sign in to see your creator community.');return}
 user=data.session.user;
 try{
  const [places,catalog]=await Promise.all([rpc('haneul_creator_my_communities'),fetch('/data/creator-ready-catalog.json').then(r=>{if(!r.ok)throw Error('Could not load the Ready lesson catalog');return r.json()})]);
  communities=Array.isArray(places)?places:[];readyCatalog=Array.isArray(catalog.videos)?catalog.videos:[];
  if(!communities.length){
   el('gate').hidden=false;
   el('gate').querySelector('h2').textContent='Your creator community is not linked yet.';
   el('gate').querySelector('p').textContent='Redeem a collaborator referral code in Haneul or ask the Haneul owner to assign your creator signature. Then return here.';
   ui('This Google account has no creator assignment. Signed in as '+String(user?.email||'unknown account')+'. If you are the Haneul owner, switch to the Google account authorized in Admin Panel.');return
  }
  el('workspace').hidden=false;el('gate').hidden=true;
  el('community').innerHTML=communities.map(x=>'<option value="'+safe(x.code)+'">'+safe(x.label||x.code)+' · '+safe(x.code)+'</option>').join('');
  el('community').onchange=()=>void load(el('community').value);
  const requested=new URLSearchParams(location.search).get('code')||'';
  const choice=communities.find(c=>c.code===requested)?.code||communities.find(c=>c.code==='HNL-X-OWNER-PREVIEW-SIG00')?.code||communities[0].code;
  el('community').value=choice;
  await load(choice);
 }catch(e){ui(e?.message||'Could not load creator community.',true)}
}
async function load(code){
 ui('Loading creator community…');
 try{
  const [s,d]=await Promise.all([rpc('haneul_creator_space',{p_code:code}),rpc('haneul_creator_dashboard',{p_code:code})]);
  if(!s?.code)throw Error('Creator space not found');
  space=s;dashboard=d||{};selected=(s.days||[]).sort((a,b)=>a.day-b.day).map(x=>x.videoId);
  el('heroCreator').textContent=space.title||'Your learning circle';el('heroIntro').textContent=space.introduction||'A dedicated place to learn Korean together.';
  const ownerPreview=space.code==='HNL-X-OWNER-PREVIEW-SIG00';
  el('role').textContent=ownerPreview?'OWNER PREVIEW · private':space.is_owner?'Creator / admin':'Community learner';
  el('codeNote').textContent=ownerPreview?'Owner sandbox · referral code is PAUSED, so learners cannot join this preview.':('Signature: '+space.code+' · Access is tied to your Google account.');
  el('creatorTab').hidden=!space.is_owner;el('ambassadorTab').hidden=!space.is_owner;
  el('challengeName').textContent=space.challenge_title||'7 days of real Korean';
  el('weeklyPrompt').textContent=space.weekly_prompt||'Introduce yourself in Korean.';
  el('tutorTitle').textContent='Learn Korean with '+(space.label||space.title)+'.';
  el('challengePlan').textContent=space.challenge_plan||'';el('planPanel').hidden=!space.challenge_plan;
  el('rankName').value=String(JSON.parse(localStorage.getItem('haneulProfile:v2:user:'+user.id)||'{}')?.name||user?.user_metadata?.full_name||user?.user_metadata?.name||'Learner').slice(0,32);
  el('rankPublic').checked=space.my_public===true;
  renderDays();renderVideos();renderDashboard();renderCreator();await refreshAmbPosts();
  ui('',false);
  const videoQuery=new URLSearchParams(location.search).get('video');tab(videoQuery&&/^[A-Za-z0-9_-]{11}$/.test(videoQuery)?'videos':ownerPreview?'ambassador':'challenge');history.replaceState(null,'','/creators/?code='+encodeURIComponent(space.code)+(videoQuery&&/^[A-Za-z0-9_-]{11}$/.test(videoQuery)?'&video='+encodeURIComponent(videoQuery):''));
 }catch(e){ui(e?.message||'Could not load community',true)}
}
function renderDays(){
 const list=space.days||[],done=new Set((space.my_completed||[]).map(Number));
 el('challengeCount').textContent=done.size+' / '+(list.length||7)+' completed';
 if(!list.length){el('days').innerHTML='<div class="empty">Your creator has not published the 7-day challenge yet. Check back soon.</div>';return}
 el('days').innerHTML=list.map(day=>{
  const v=videoMeta(day.videoId),complete=done.has(day.day);
  return '<article class="dayCard '+(complete?'complete':'')+'"><img loading="lazy" src="'+safe(v.thumb)+'" alt="Video thumbnail"><main><span class="number">DAY '+Number(day.day)+'</span><h3>'+safe(v.title)+'</h3><small>'+safe(v.channel)+' · '+safe(v.level)+'</small><div class="actions"><a class="btn small" target="_blank" rel="noopener" href="/?verify='+encodeURIComponent(day.videoId)+'">Watch & learn ↗</a><button class="btn small '+(complete?'soft':'alt')+'" data-finish="'+Number(day.day)+'" data-video="'+safe(day.videoId)+'" '+(complete?'disabled':'')+'>'+(complete?'✓ Completed':'Complete day')+'</button></div></main></article>'
 }).join('');
 el('days').querySelectorAll('[data-finish]').forEach(b=>b.onclick=()=>busy(b,async()=>{
  const stats=JSON.parse(localStorage.getItem('haneulStudyStats:v1')||'{}'),item=stats?.byVideo?.[b.dataset.video];
  if(!item||Number(item.maxPct||0)<80||Number(item.watchMs||0)<30000)throw Error('Watch at least 80% of this video with 30 seconds of real listening in Haneul on this device first. Open the video above.');
  await rpc('haneul_creator_complete',{p_code:ensureCode(),p_day:Number(b.dataset.finish),p_video_id:b.dataset.video});
  space.my_completed=[...new Set([...(space.my_completed||[]),Number(b.dataset.finish)])];renderDays();await refreshDashboard();
 },()=>ui('Challenge day completed and recorded.',false,true)));
}

async function refreshAmbPosts(){if(!space?.code)return;try{const rows=await rpc('haneul_ambassador_list_posts',{p_code:space.code});ambPosts=Array.isArray(rows)?rows:[];renderSharedVideos();renderAmbLibrary();renderPublishedPosts()}catch(e){ui(e.message||'Could not load ambassador content',true)}}
function renderSharedVideos(){const box=el('ambSharedVideos');if(!box)return;
const rows=ambPosts.filter(p=>p.kind==='video'&&p.published&&/^[A-Za-z0-9_-]{11}$/.test(p.body?.videoId||''));
box.innerHTML=rows.length?rows.map(p=>'<article class="videoCard"><img loading="lazy" alt="" src="https://i.ytimg.com/vi/'+safe(p.body.videoId)+'/hqdefault.jpg"><div><h3>'+safe(p.title)+'</h3><small>'+safe(String(p.body.note||'New from your ambassador').slice(0,240))+'</small></div><a class="btn small alt" target="_blank" rel="noopener noreferrer" href="https://www.youtube.com/watch?v='+encodeURIComponent(p.body.videoId)+'">Watch ↗</a><button class="btn small alt" data-share-video="'+safe(p.body.videoId)+'">Copy link</button></article>').join(''):'<div class="empty">Your ambassador has not shared a YouTube video yet.</div>';
box.querySelectorAll('[data-share-video]').forEach(b=>b.onclick=async()=>{try{await navigator.clipboard.writeText('https://korean-video-lab.vercel.app/creators/?code='+encodeURIComponent(space.code)+'&video='+encodeURIComponent(b.dataset.shareVideo));ui('Community video link copied.',false,true)}catch{ui('Copy the community URL from the address bar.',true)}})}
function renderPublishedPosts(){
 const box=el('ambPublishedPosts');if(!box)return;
 const rows=ambPosts.filter(p=>p.published&&(p.kind==='quiz'||p.kind==='content_kit'));
 box.innerHTML=rows.length?rows.map(p=>'<article class="videoCard"><div style="flex:1"><h3>'+safe(p.title)+'</h3><small>'+safe(p.kind==='quiz'?'Community quiz battle':'Korean learning content')+'</small></div><button class="btn small alt" data-read-post="'+Number(p.id)+'">Read ↗</button></article>').join(''):'<div class="empty">Your ambassador has not shared a quiz or content kit yet.</div>';
 box.querySelectorAll('[data-read-post]').forEach(b=>b.onclick=()=>{const p=rows.find(x=>Number(x.id)===Number(b.dataset.readPost));if(!p)return;el('ambPublishedText').hidden=false;el('ambPublishedText').textContent=String(p.body?.text||'');el('ambPublishedText').scrollIntoView({behavior:'smooth',block:'center'})});
}
function renderAmbLibrary(){const box=el('ambLibrary');if(!box)return;
const rows=ambPosts.filter(p=>p.kind==='content_kit'||p.kind==='quiz');
box.innerHTML=rows.length?rows.map(p=>'<article class="videoCard"><div style="flex:1"><h3>'+safe(p.title)+'</h3><small>'+safe(p.kind==='quiz'?'Quiz':'Content kit')+' · '+(p.published?'Shared with community':'Private draft')+'</small></div><button class="btn small alt" data-open-post="'+Number(p.id)+'">Open</button>'+(space?.is_owner?'<button class="btn small alt" data-publish-post="'+Number(p.id)+'">'+(p.published?'Make private':'Share to community')+'</button>':'')+'</article>').join(''):'<div class="empty">No saved creator content yet.</div>';
box.querySelectorAll('[data-open-post]').forEach(b=>b.onclick=()=>{const p=ambPosts.find(p=>Number(p.id)===Number(b.dataset.openPost));if(!p)return;el('ambOutputWrap').hidden=false;el('ambOutput').value=String(p.body?.text||'');el('ambPostTitle').value=p.title;ambLastKind=p.kind;tab('ambassador')});
box.querySelectorAll('[data-publish-post]').forEach(b=>b.onclick=()=>busy(b,async()=>{const p=ambPosts.find(p=>Number(p.id)===Number(b.dataset.publishPost));await rpc('haneul_ambassador_set_published',{p_code:ensureCode(),p_id:p.id,p_published:!p.published});await refreshAmbPosts()},()=>ui('Content visibility updated.',false,true)))}
function renderVideos(){
 const rows=space?.videos||[],box=el('creatorVideos');
 if(!rows.length){box.innerHTML='<div class="empty">Your creator has not published a video lesson yet.</div>';return}
 box.innerHTML=rows.map(v=>'<article class="videoCard"><img loading="lazy" src="https://i.ytimg.com/vi/'+safe(v.videoId)+'/hqdefault.jpg" alt=""><div><h3>'+safe(v.title)+'</h3><small>Watch · Korean captions · AI vocabulary & practice</small></div><button class="btn small alt" data-watch="'+safe(v.videoId)+'">Open lesson</button></article>').join('');
 box.querySelectorAll('[data-watch]').forEach(b=>b.onclick=()=>void watch(b.dataset.watch));
}
function fmt(ms){const sec=Math.max(0,Math.floor(Number(ms)/1000));return Math.floor(sec/60)+':'+String(sec%60).padStart(2,'0')}
async function watch(videoId){
 const v=(space.videos||[]).find(x=>x.videoId===videoId);if(!v)return;
 activeVideo=v;activeCues=[];el('watchPanel').hidden=false;el('watchTitle').textContent=v.title;
 el('openFullHaneul').href='/?creatorVideo='+encodeURIComponent(videoId)+'&creatorCode='+encodeURIComponent(space.code);
 el('watchFrame').src='https://www.youtube-nocookie.com/embed/'+encodeURIComponent(videoId)+'?enablejsapi=1&origin='+encodeURIComponent(location.origin);
 el('lessonOutput').hidden=true;
 el('watchTranscript').innerHTML='<div class="muted">Loading the Korean transcript…</div>';
 el('watchPanel').scrollIntoView({behavior:'smooth',block:'start'});
 try{
  const r=await fetch('/api/captions?videoId='+encodeURIComponent(videoId)+'&cv=11&review=1');
  const d=await r.json();if(!d.ok||!d.cues?.length)throw Error('A usable Korean caption track is not available for this video.');
  if(activeVideo?.videoId!==videoId)return;
  activeCues=d.cues;
  el('watchTranscript').innerHTML=activeCues.slice(0,400).map(c=>'<button type="button" class="cue" data-jump="'+Math.max(0,Number(c.startMs)||0)+'"><time>'+fmt(c.startMs)+'</time><span lang="ko">'+safe(c.ko)+'</span></button>').join('');
  el('watchTranscript').querySelectorAll('[data-jump]').forEach(b=>b.onclick=()=>{
   const seconds=Number(b.dataset.jump)/1000,frame=el('watchFrame');
   frame.contentWindow?.postMessage(JSON.stringify({event:'command',func:'seekTo',args:[seconds,true]}),'https://www.youtube-nocookie.com');
  });
 }catch(e){el('watchTranscript').textContent=e?.message||'Transcript could not load.'}
}
function renderDashboard(){
 const d=dashboard||{},rank=Array.isArray(d.ranking)?d.ranking:[];
 el('metrics').innerHTML=[['REFERRED MEMBERS',d.members],['CHALLENGE DAYS',d.challenge_completions],['SPEAKING WEEKS',d.speaking_completions]].map(([label,count])=>'<div class="stat"><b>'+Number(count||0)+'</b><small>'+safe(label)+'</small></div>').join('');
 el('ranking').innerHTML=rank.length?rank.map((x,i)=>'<div class="rank"><strong class="place">#'+(i+1)+'</strong><div><b>'+safe(x.display_name)+'</b><small>'+Number(x.days||0)+' challenge days · '+Number(x.speaking_weeks||0)+' speaking weeks</small></div><span>'+Number(x.points||0)+' pts</span></div>').join(''):'<div class="empty">No one has opted into this community ranking yet. Join only if you want your nickname to appear.</div>';
}
async function refreshDashboard(){
 if(!space?.code)return;
 try{dashboard=await rpc('haneul_creator_dashboard',{p_code:space.code});renderDashboard()}catch(e){ui(e?.message||'Could not refresh dashboard.',true)}
}
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
el('tabs').addEventListener('click',e=>{const b=e.target.closest('[data-tab]');if(b)tab(b.dataset.tab)});
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
 el('challengePlan').textContent=space.challenge_plan;
 el('planPanel').hidden=!space.challenge_plan;
},()=>ui('Challenge plan published to your community.',false,true));
el('publishVideo').onclick=()=>busy(el('publishVideo'),async()=>{
 const id=idFromUrl(el('creatorVideoUrl').value),title=el('creatorVideoTitle').value.trim();
 if(!id)throw Error('Enter a valid YouTube video URL or 11-character ID.');
 if(title.length<3)throw Error('Enter a video title.');
 el('publishStatus').textContent='Checking the Korean transcript and English meaning service…';
 const r=await fetch('/api/quality?videoId='+encodeURIComponent(id)+'&level=Intermediate',{cache:'no-store'});
 const qa=await r.json();
 if(qa.status==='FAIL'||Number(qa.metrics?.cueCount||0)<12||qa.translation?.checked!==true||Number(qa.translation?.successRatio||0)<.8)throw Error('Cannot publish this video: Korean captions or English meaning service are not reliable enough. Try another captioned video.');
 await rpc('haneul_creator_submit_video',{p_code:ensureCode(),p_video_id:id,p_title:title});
 const s=await rpc('haneul_creator_space',{p_code:space.code});space=s;renderVideos();
 el('publishStatus').textContent='Published as an interactive creator lesson. Its word-level audio timing is still estimated until reviewed.';
 return id;
},()=>ui('Creator video lesson published.',false,true));
el('askTutor').onclick=()=>busy(el('askTutor'),async()=>{
 const question=el('tutorQuestion').value.trim();if(question.length<3)throw Error('Enter a Korean question or sentence first.');
 return ai('tutor',{context:space.introduction,prompt:question,answer:question});
},text=>{el('tutorOutput').hidden=false;el('tutorOutput').textContent=text});
el('makeLesson').onclick=()=>busy(el('makeLesson'),async()=>{
 if(!activeVideo||activeCues.length<12)throw Error('Load a video with usable Korean captions first.');
 const context=activeCues.slice(0,45).map(x=>x.ko).join('\n').slice(0,1800);
 return ai('videoLesson',{context,prompt:activeVideo.title});
},text=>{el('lessonOutput').hidden=false;el('lessonOutput').textContent=text});
el('listen').onclick=()=>{
 const Recognition=window.SpeechRecognition||window.webkitSpeechRecognition;
 if(!Recognition){ui('This browser does not support speech recognition. Type what you said in Korean instead.',true);return}
 if(speechRecognition){speechRecognition.stop();speechRecognition=null;return}
 const recognition=new Recognition();recognition.lang='ko-KR';recognition.interimResults=false;recognition.continuous=false;
 recognition.onresult=e=>{const text=[...e.results].map(r=>r[0]?.transcript||'').join(' ').trim();if(text)el('speakingText').value=(el('speakingText').value.trim()+' '+text).trim()};
 recognition.onerror=e=>{ui('Microphone recognition unavailable ('+String(e.error||'unknown')+'). Type your Korean answer instead.',true)};
 recognition.onend=()=>{speechRecognition=null;el('listen').textContent='🎙 Speak in Korean'};
 speechRecognition=recognition;el('listen').textContent='■ Stop listening';try{recognition.start()}catch(e){recognition.onend();ui(e.message||'Microphone could not start',true)}
};
el('speakingText').addEventListener('input',()=>{speechFeedbackReady=false;el('speakingDone').disabled=true});
el('evaluateSpeaking').onclick=()=>busy(el('evaluateSpeaking'),async()=>{
 const answer=el('speakingText').value.trim();
 if((answer.match(/[가-힣]/g)||[]).length<3)throw Error('Enter or say a few Korean words first.');
 return ai('speaking',{prompt:space.weekly_prompt,answer,context:space.title});
},text=>{el('speakingOutput').hidden=false;el('speakingOutput').textContent=text;speechFeedbackReady=true;
 const today=new Date(),mon=new Date(Date.UTC(today.getUTCFullYear(),today.getUTCMonth(),today.getUTCDate()));mon.setUTCDate(mon.getUTCDate()-(mon.getUTCDay()+6)%7);
 const week=mon.toISOString().slice(0,10);el('speakingDone').disabled=(space.my_speaking||[]).includes(week);
 ui('Feedback ready. You can save this week’s speaking challenge.',false,true)});
el('speakingDone').onclick=()=>busy(el('speakingDone'),async()=>{
 if(!speechFeedbackReady)throw Error('Get feedback on this week’s Korean answer first.');
 await rpc('haneul_creator_speaking_done',{p_code:ensureCode()});
 speechFeedbackReady=false;el('speakingDone').disabled=true;await refreshDashboard();
},()=>ui('Weekly speaking challenge saved.',false,true));
el('saveRank').onclick=()=>busy(el('saveRank'),async()=>{
 await rpc('haneul_creator_opt_in',{p_code:ensureCode(),p_name:el('rankName').value.trim(),p_enabled:el('rankPublic').checked});
 space.my_public=el('rankPublic').checked;await refreshDashboard();
},()=>ui('Leaderboard privacy preference saved.',false,true));

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
ambLastKind=mode==='quizBattle'?'quiz':'content_kit';el('ambOutputWrap').hidden=false;el('ambOutput').value=response.text;
el('ambPostTitle').value=el('ambTopic').value.trim().slice(0,140)||(mode==='learningDoctor'?'Community content plan':mode==='quizBattle'?'Korean quiz battle':'Korean content kit')
}
for(const [id,mode] of [['ambGenerateKit','contentKit'],['ambGenerateQuiz','quizBattle'],['ambGenerateDoctor','learningDoctor']])el(id).onclick=()=>busy(el(id),()=>ambassadorGenerate(mode),()=>ui('Generated. Review the Korean before sharing.',false,true));
el('ambSavePost').onclick=()=>busy(el('ambSavePost'),async()=>{const title=el('ambPostTitle').value.trim(),content=el('ambOutput').value.trim();if(title.length<3||content.length<5)throw Error('Add a title and content.');await rpc('haneul_ambassador_save_post',{p_code:ensureCode(),p_kind:ambLastKind,p_title:title,p_body:{text:content},p_published:false});await refreshAmbPosts()},()=>ui('Saved privately. Share it from your library.',false,true));
el('ambCopy').onclick=async()=>{try{await navigator.clipboard.writeText(el('ambOutput').value);ui('Copied.',false,true)}catch{ui('Select and copy the text manually.',true)}};
el('ambShareVideo').onclick=()=>busy(el('ambShareVideo'),async()=>{const videoId=idFromUrl(el('ambVideoLink').value),title=el('ambVideoTitle').value.trim(),note=el('ambVideoNote').value.trim();if(!videoId)throw Error('Enter a valid YouTube link.');if(title.length<3)throw Error('Add a video title.');await rpc('haneul_ambassador_save_post',{p_code:ensureCode(),p_kind:'video',p_title:title,p_body:{videoId,note},p_published:true});await refreshAmbPosts()},()=>{ui('YouTube video shared with your referral community.',false,true);el('ambVideoLink').value='';el('ambVideoTitle').value='';el('ambVideoNote').value=''});
void init();
})();