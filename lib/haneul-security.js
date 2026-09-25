// Haneul's server-only provider access checks. Publishable key is safe to
// use here; Supabase ALWAYS verifies the caller's JWT and enforces DB grants.
const SUPABASE = 'https://uyltjaftajwkujjhuric.supabase.co';
const PUBLIC_KEY = 'sb_publishable_WNWIyMORd5O4N_4qTWMO_w_HbHooVeW';
function bearer(req) {
  const h = String(req?.headers?.authorization || '').trim();
  return /^Bearer [A-Za-z0-9._~-]{20,4000}$/.test(h) ? h : '';
}
function requestBytes(req) {
  if(typeof req.body === 'string') return Buffer.byteLength(req.body);
  return Buffer.byteLength(JSON.stringify(req.body == null ? {} : req.body));
}
async function rpc(token, name, body = {}) {
  const response = await fetch(SUPABASE + '/rest/v1/rpc/' + name, {
    method:'POST',
    headers:{apikey:PUBLIC_KEY,Authorization:token,'content-type':'application/json'},
    body:JSON.stringify(body),signal:AbortSignal.timeout(9000)
  });
  if(!response.ok) return false;
  return (await response.json().catch(()=>false)) === true;
}
async function consumeAiBudget(token, action) {
  if(!token || !['micro','profile','creator'].includes(action)) return false;
  try{return await rpc(token,'haneul_consume_ai_budget',{p_action:action})}
  catch{return false}
}
async function verifyProviderAccess(req,action) {
  const token=bearer(req);
  if(!token)return {ok:false,status:401,error:'Sign in with Google for AI-assisted learning.'};
  try {
    const me=await fetch(SUPABASE+'/auth/v1/user',{
      headers:{apikey:PUBLIC_KEY,Authorization:token},signal:AbortSignal.timeout(9000)
    });
    if(!me.ok) return {ok:false,status:401,error:'Your Google session has expired.'};
    const user=await me.json().catch(()=>null);
    if(!user?.id)return {ok:false,status:401,error:'Sign in with Google.'};
    if(!await rpc(token,'haneul_has_ai_access'))
      return {ok:false,status:403,error:'AI features require a collaborator referral or direct admin grant.'};
    if(!await consumeAiBudget(token,action))
      return {ok:false,status:429,error:'AI request limit reached. Please retry in a few minutes.'};
    return {ok:true,token,userId:user.id};
  } catch {
    return {ok:false,status:503,error:'Could not verify your AI access. Please retry.'};
  }
}
module.exports={bearer,requestBytes,consumeAiBudget,verifyProviderAccess};
