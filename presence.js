// --- Live Visitor Presence (Supabase) ---
// Fill these in from Supabase -> Project Settings -> API. Both values are public by design.
const SUPABASE_URL = 'https://rduzzysqmwvcpabbzwqv.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_iy1DyfBc5LxBHs7PzPzuBA_rtG-M20x';

const PRESENCE_SHOWN = 3;

const BOT_PATTERNS = [
  [/meta-externalagent|facebookexternalhit|meta-externalfetcher/i, 'Meta AI'],
  [/gptbot|chatgpt-user|oai-searchbot/i, 'ChatGPT'],
  [/claudebot|claude-user|claude-searchbot|anthropic/i, 'Claude'],
  [/perplexity/i, 'Perplexity'],
  [/googlebot|google-extended/i, 'Google'],
  [/bingbot/i, 'Bing'],
  [/bot|crawler|spider|headless/i, 'A bot'],
];

function visitorLabel() {
  const ua = navigator.userAgent;
  const match = BOT_PATTERNS.find(([re]) => re.test(ua));
  return match ? match[1] : 'Someone';
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[ch]));
}

function timeAgo(iso) {
  const secs = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (secs < 60) return 'just now';
  const units = [[86400, 'd'], [3600, 'h'], [60, 'm']];
  const [size, unit] = units.find(([s]) => secs >= s);
  return `${Math.floor(secs / size)}${unit} ago`;
}

function flagUrl(code) {
  return /^[a-z]{2}$/.test(code || '') ? `https://flagcdn.com/w40/${code}.png` : null;
}

function supabaseFetch(path, options = {}) {
  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
}

async function lookupLocation() {
  try {
    const res = await fetch('https://get.geojs.io/v1/ip/geo.json', { signal: AbortSignal.timeout(4000) });
    const geo = await res.json();
    return {
      city: geo.city || null,
      country: geo.country || null,
      country_code: (geo.country_code || '').toLowerCase() || null,
    };
  } catch (e) {
    return { city: null, country: null, country_code: null };
  }
}

async function logVisit() {
  const path = location.pathname.slice(0, 200);
  const sessionKey = `visit-logged:${path}`;
  if (sessionStorage.getItem(sessionKey)) return;
  const geo = await lookupLocation();
  await supabaseFetch('visits', {
    method: 'POST',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({ path, visitor: visitorLabel(), ...geo }),
  });
  sessionStorage.setItem(sessionKey, '1');
}

function renderVisitorBadge(visit) {
  const place = [visit.city, visit.country].filter(Boolean).join(', ') || 'somewhere';
  const flag = flagUrl(visit.country_code);
  const flagImg = flag ? `<img class="visitor-card-flag" src="${flag}" alt="">` : '';
  const avatar = visit.visitor === 'Someone' && flag
    ? `<img src="${flag}" alt="">`
    : escapeHtml(visit.visitor.charAt(0).toUpperCase());

  return `
    <span class="badge-circle visitor-badge" tabindex="0">
      ${avatar}
      <span class="visitor-card" role="tooltip">
        <span class="visitor-card-line">
          ${escapeHtml(visit.visitor)} <span class="muted">reading</span> ${escapeHtml(visit.path)}
          <span class="muted">from</span> ${escapeHtml(place)} ${flagImg}
        </span>
        <span class="visitor-card-meta">
          <svg viewBox="0 0 24 24"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"></path><circle cx="12" cy="12" r="3"></circle></svg>
          Pageview <span class="muted">(${timeAgo(visit.created_at)})</span>
        </span>
      </span>
    </span>`;
}

async function loadPresence() {
  const container = document.getElementById('visitor-badges');
  const res = await supabaseFetch(
    `visits?select=path,visitor,city,country,country_code,created_at&order=created_at.desc&limit=${PRESENCE_SHOWN}`,
    { headers: { Prefer: 'count=exact' } }
  );
  if (!res.ok) return;
  const visits = await res.json();
  const total = Number((res.headers.get('Content-Range') || '').split('/')[1]) || visits.length;
  const others = Math.max(0, total - visits.length);

  container.innerHTML = visits.map(renderVisitorBadge).join('') +
    (others ? `<span class="visitor-count" title="${total} total visits">+${others}</span>` : '');
}

(async function initPresence() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return;
  try {
    await logVisit();
  } catch (e) {}
  try {
    await loadPresence();
  } catch (e) {}
})();
