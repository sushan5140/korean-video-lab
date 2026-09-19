// Haneul Profile Grok analysis. Never expose the xAI key to browser code.
const SUPABASE_URL = 'https://uyltjaftajwkujjhuric.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_WNWIyMORd5O4N_4qTWMO_w_HbHooVeW';
const MAX_BODY_BYTES = 18000;
const MAX_REPLY_CHARS = 1700;

function send(res, status, data) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.end(JSON.stringify(data));
}
function cleanStr(value, len = 90) { return String(value ?? '').slice(0, len); }
function n(value, max = 10000) { return Math.max(0, Math.min(max, Number(value) || 0)); }

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return send(res, 405, { error: 'Method not allowed' });
  }
  const secret = process.env.XAI_API_KEY || process.env.GROK_API_KEY;
  if (!secret) return send(res, 503, { error: 'Grok has not been connected for this site yet.' });
  const auth = String(req.headers.authorization || '');
  if (!/^Bearer [A-Za-z0-9._~-]+$/.test(auth)) return send(res, 401, { error: 'Sign in with Google to request your analysis.' });
  const supa = await fetch(SUPABASE_URL + '/auth/v1/user', {
    headers: { apikey: SUPABASE_PUBLISHABLE_KEY, Authorization: auth },
    signal: AbortSignal.timeout(9000)
  }).catch(() => null);
  if (!supa || !supa.ok) return send(res, 401, { error: 'Your sign-in expired. Please sign in again.' });
  const user = await supa.json().catch(() => null);
  if (!user?.id) return send(res, 401, { error: 'Please sign in again.' });
  // A Google identity by itself must never bypass the collaborator invitation gate.
  const invite = await fetch(SUPABASE_URL + '/rest/v1/rpc/haneul_has_invite', {
    method: 'POST',
    headers: {
      apikey: SUPABASE_PUBLISHABLE_KEY,
      Authorization: auth,
      'Content-Type': 'application/json'
    },
    body: '{}',
    signal: AbortSignal.timeout(9000)
  }).catch(() => null);
  if (!invite || !invite.ok) return send(res, 403, { error: 'Could not confirm your collaborator access.' });
  if ((await invite.json().catch(() => false)) !== true)
    return send(res, 403, { error: 'A collaborator code is required to use Haneul.' });

  let body;
  try {
    const raw = typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {});
    if (Buffer.byteLength(raw) > MAX_BODY_BYTES) return send(res, 413, { error: 'Analysis request is too large.' });
    body = JSON.parse(raw);
  } catch { return send(res, 400, { error: 'Invalid request.' }); }
  if (!body || typeof body !== 'object' || !body.evidence || typeof body.evidence !== 'object')
    return send(res, 400, { error: 'Learning evidence is required.' });
  const evidence = body.evidence;
  const measures = {
    path: cleanStr(evidence.path, 40),
    interests: Array.isArray(evidence.interests) ? evidence.interests.slice(0, 8).map(x => cleanStr(x, 45)) : [],
    dailyGoalMinutes: n(evidence.dailyGoalMinutes, 180),
    wordsSaved: n(evidence.wordsSaved),
    wordsFamiliar: n(evidence.wordsFamiliar),
    wordsForReview: n(evidence.wordsForReview),
    patternsSaved: n(evidence.patternsSaved),
    lessonsSeen: n(evidence.lessonsSeen),
    practiceAttempts: n(evidence.practiceAttempts),
    strengths: Array.isArray(evidence.strengths) ? evidence.strengths.slice(0, 4).map(x => cleanStr(x, 160)) : [],
    friction: Array.isArray(evidence.friction) ? evidence.friction.slice(0, 4).map(x => cleanStr(x, 160)) : [],
    skillResults: Array.isArray(evidence.skillResults) ? evidence.skillResults.slice(0, 10).map(s => ({
      mode: cleanStr(s.mode, 40), score: n(s.score, 100), attempts: n(s.attempts, 500)
    })) : []
  };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 22000);
  try {
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST', signal: controller.signal,
      headers: { Authorization: 'Bearer ' + secret, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: process.env.HANEUL_GROK_MODEL || 'grok-4-1-fast-non-reasoning',
        stream: false,
        messages: [
          { role: 'system', content: 'You are Haneul\'s Korean learning coach. Interpret only the supplied aggregate learning evidence. Write a short, encouraging, concrete learning read (100-150 words) using second-person language, followed by one next-step suggestion that fits the learner\'s current path and daily goal. If practice attempts are under 3, explicitly state there is insufficient evidence for a reliable strength/weakness assessment. Never fabricate learning records, psychological traits, fluency, guaranteed outcomes, or numerical statistics. Do not repeat personal data. Plain text only, with 2 short paragraphs.' },
          { role: 'user', content: JSON.stringify(measures) }
        ],
        max_tokens: 330
      })
    });
    if (!response.ok) {
      console.error('Haneul Grok upstream status', response.status);
      return send(res, 502, { error: 'Grok is temporarily unavailable. Your on-device learning signals are still here.' });
    }
    const data = await response.json();
    const output = data?.choices?.[0]?.message?.content;
    if (typeof output !== 'string' || !output.trim())
      return send(res, 502, { error: 'Grok did not return an analysis. Please try later.' });
    return send(res, 200, { model: cleanStr(data.model || 'Grok', 75), analysis: output.trim().slice(0, MAX_REPLY_CHARS) });
  } catch (e) {
    console.error('Haneul Grok request error', e?.name || 'unknown');
    return send(res, 502, { error: 'Grok could not respond. Your on-device learning signals are still available.' });
  } finally { clearTimeout(timer); }
};
