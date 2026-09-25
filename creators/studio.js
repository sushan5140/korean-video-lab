(()=>{'use strict';
const el=id=>document.getElementById(id),safe=x=>String(x??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const client=window.supabase?.createClient('https://uyltjaftajwkujjhuric.supabase.co','sb_publishable_WNWIyMORd5O4N_4qTWMO_w_HbHooVeW',{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
let user=null,communities=[],space=null,dashboard=null,readyCatalog=[],selected=[],activeVideo=null,activeCues=[],speechRecognition=null,speechFeedbackReady=false,ambPosts=[];
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
 if(!desired)return;
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
  const portal=el('ambassadorPortalLink');portal.hidden=!space.is_owner;portal.href='/ambassadors/?code='+encodeURIComponent(space.code);
  el('challengeName').textContent=space.challenge_title||'7 days of real Korean';
  el('weeklyPrompt').textContent=space.weekly_prompt||'Introduce yourself in Korean.';
  el('tutorTitle').textContent='Learn Korean with '+(space.label||space.title)+'.';
  el('challengePlan').textContent=space.challenge_plan||'';el('planPanel').hidden=!space.challenge_plan;
  el('rankName').value=String(JSON.parse(localStorage.getItem('haneulProfile:v2:user:'+user.id)||'{}')?.name||user?.user_metadata?.full_name||user?.user_metadata?.name||'Learner').slice(0,32);
  el('rankPublic').checked=space.my_public===true;
  renderDays();renderVideos();renderDashboard();await refreshAmbPosts();
  ui('',false);
  const videoQuery=new URLSearchParams(location.search).get('video');tab(videoQuery&&/^[A-Za-z0-9_-]{11}$/.test(videoQuery)?'videos':'challenge');history.replaceState(null,'','/creators/?code='+encodeURIComponent(space.code)+(videoQuery&&/^[A-Za-z0-9_-]{11}$/.test(videoQuery)?'&video='+encodeURIComponent(videoQuery):''));
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

async function refreshAmbPosts(){if(!space?.code)return;try{const rows=await rpc('haneul_ambassador_list_posts',{p_code:space.code});ambPosts=Array.isArray(rows)?rows:[];renderSharedVideos();renderPublishedPosts()}catch(e){ui(e.message||'Could not load ambassador content',true)}}
function renderSharedVideos(){const box=el('ambSharedVideos');if(!box)return;
const rows=ambPosts.filter(p=>p.kind==='video'&&p.published&&/^[A-Za-z0-9_-]{11}$/.test(p.body?.videoId||''));
box.innerHTML=rows.length?rows.map(p=>'<article class="videoCard"><img loading="lazy" alt="" src="https://i.ytimg.com/vi/'+safe(p.body.videoId)+'/hqdefault.jpg"><div><h3>'+safe(p.title)+'</h3><small>'+safe(String(p.body.note||'New from your ambassador').slice(0,240))+'</small></div><a class="btn small alt" target="_blank" rel="noopener noreferrer" href="https://www.youtube.com/watch?v='+encodeURIComponent(p.body.videoId)+'">Watch ↗</a><button class="btn small alt" data-share-video="'+safe(p.body.videoId)+'">Copy link</button></article>').join(''):'<div class="empty">Your ambassador has not shared a YouTube video yet.</div>';
box.querySelectorAll('[data-share-video]').forEach(b=>b.onclick=async()=>{try{await navigator.clipboard.writeText('https://korean-video-lab.vercel.app/creators/?code='+encodeURIComponent(space.code)+'&video='+encodeURIComponent(b.dataset.shareVideo));ui('Community video link copied.',false,true)}catch{ui('Copy the community URL from the address bar.',true)}})}
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
let activeQuizPost=null;
async function showQuizRanking(postId){
 const box=el('quizRanking');box.textContent='Loading the opt-in ranking…';
 try{const ranks=await rpc('haneul_ambassador_quiz_ranking',{p_code:ensureCode(),p_post_id:Number(postId)});
  box.innerHTML='<h3 style="font-size:14px">Community quiz ranking</h3>'+(Array.isArray(ranks)&&ranks.length?
   ranks.map((r,i)=>'<div class="rank"><b class="place">#'+(i+1)+'</b><b>'+safe(r.name)+'</b><span>'+Number(r.points||0)+' / 50</span></div>').join(''):
   '<p class="muted">No learners have opted into this quiz ranking yet. Public nicknames can be enabled in Community ranking.</p>')
 }catch(e){box.textContent=e?.message||'Ranking not available'}
}
function launchQuiz(post){
 const questions=post.body?.quiz;if(!Array.isArray(questions)||questions.length!==5){ui('This older quiz is only available as a text worksheet.',true);return}
 activeQuizPost=post;el('ambPublishedText').hidden=true;
 el('quizPlay').hidden=false;el('quizTitle').textContent=post.title;
 el('quizFeedback').hidden=true;el('quizSubmit').disabled=false;
 el('quizQuestions').innerHTML=questions.map((q,i)=>
  '<fieldset class="quizQuestion"><legend>'+(i+1)+'. '+safe(q.question)+'</legend>'+
  (q.options||[]).map((opt,k)=>'<label class="quizChoice"><input type="radio" name="haneulQuiz-'+i+'" value="'+k+'"><span>'+['A','B','C'][k]+'. '+safe(opt)+'</span></label>').join('')+'</fieldset>').join('');
 void showQuizRanking(post.id);
 el('quizPlay').scrollIntoView({behavior:'smooth',block:'start'})
}
el('quizSubmit').onclick=()=>busy(el('quizSubmit'),async()=>{
 if(!activeQuizPost)throw Error('Open a published quiz first.');
 const selected=[0,1,2,3,4].map(i=>document.querySelector('input[name="haneulQuiz-'+i+'"]:checked'));
 if(selected.some(x=>!x))throw Error('Answer all five questions before submitting.');
 const out=await rpc('haneul_ambassador_quiz_submit',{p_code:ensureCode(),p_post_id:Number(activeQuizPost.id),p_answers:selected.map(x=>Number(x.value))});
 return out
},async result=>{
 el('quizFeedback').hidden=false;
 const explanations=(result.answers||[]).map((a,i)=>'<div class="quizResult"><b>Question '+(i+1)+': '+['A','B','C'][Number(a.answer)]+'</b><br>'+safe(a.explanation||'Read the answer and practise again.')+'</div>').join('');
 el('quizFeedback').innerHTML='<b>'+Number(result.points||0)+' / 50 points</b>'+(result.alreadyPlayed?' · Previous recorded attempt':' · Recorded for this community')+explanations;
 el('quizQuestions').querySelectorAll('input').forEach(x=>x.disabled=true);
 await showQuizRanking(activeQuizPost.id);
});
function renderPublishedPosts(){
 const box=el('ambPublishedPosts');if(!box)return;
 const rows=ambPosts.filter(p=>p.published&&(p.kind==='quiz'||p.kind==='content_kit'));
 box.innerHTML=rows.length?rows.map(p=>'<article class="videoCard"><div style="flex:1"><h3>'+safe(p.title)+'</h3><small>'+safe(p.kind==='quiz'?'Community quiz battle':'Korean learning content')+'</small></div><button class="btn small alt" data-read-post="'+Number(p.id)+'">'+(p.kind==='quiz'&&Array.isArray(p.body?.quiz)?'Play quiz ↗':'Read ↗')+'</button></article>').join(''):'<div class="empty">Your ambassador has not shared a quiz or content kit yet.</div>';
 box.querySelectorAll('[data-read-post]').forEach(b=>b.onclick=()=>{const p=rows.find(x=>Number(x.id)===Number(b.dataset.readPost));if(!p)return;if(p.kind==='quiz'&&Array.isArray(p.body?.quiz)){launchQuiz(p);return}el('quizPlay').hidden=true;el('ambPublishedText').hidden=false;el('ambPublishedText').textContent=String(p.body?.text||'');el('ambPublishedText').scrollIntoView({behavior:'smooth',block:'center'})});
}
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
  const r=await fetch('/api/captions?videoId='+encodeURIComponent(videoId)+'&cv=11&review=1',{headers:{Authorization:'Bearer '+(await client.auth.getSession()).data?.session?.access_token||''}});
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
el('tabs').addEventListener('click',e=>{const b=e.target.closest('[data-tab]');if(b)tab(b.dataset.tab)});
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

void init();
})();