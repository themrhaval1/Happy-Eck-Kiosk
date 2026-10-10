import { config } from './supabase-config.js';

function isPublicKey(key) {
  if (key.startsWith('sb_publishable_')) return true;
  try { return JSON.parse(atob(key.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))).role === 'anon'; }
  catch { return false; }
}
export const configured = /^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(config.url) && isPublicKey(config.publishableKey);
const sessionKey = 'happy-eck-admin-session';
let session;
try { session = JSON.parse(sessionStorage.getItem(sessionKey) || 'null'); } catch { session = null; }
let refreshPromise;
let sessionGeneration = 0;

function keepSession(value) {
  sessionGeneration += 1;
  session = value ? { access_token: value.access_token, refresh_token: value.refresh_token,
    expires_at: Date.now() + value.expires_in * 1000 } : null;
  if (session) sessionStorage.setItem(sessionKey, JSON.stringify(session));
  else sessionStorage.removeItem(sessionKey);
}

async function request(path, options = {}, token) {
  if (!configured) throw new Error('Supabase ist noch nicht eingerichtet.');
  const headers = { apikey: config.publishableKey, 'Content-Type': 'application/json', ...options.headers };
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(config.url + path, { ...options, headers, signal: AbortSignal.timeout(15000) });
  if (!response.ok) {
    if (response.status === 401) throw new Error('Anmeldung abgelaufen oder Zugangsdaten nicht korrekt. Bitte erneut anmelden.');
    if (response.status === 403) throw new Error('Keine Berechtigung für diese Aktion.');
    throw new Error('Supabase-Anfrage fehlgeschlagen. Bitte Verbindung und Einrichtung prüfen.');
  }
  const body = await response.text();
  return body ? JSON.parse(body) : null;
}

async function token() {
  if (!session) throw new Error('Bitte zuerst anmelden.');
  if (session.expires_at < Date.now() + 60000) {
    if (!refreshPromise) {
      const generation = sessionGeneration;
      refreshPromise = request('/auth/v1/token?grant_type=refresh_token', {
        method: 'POST', body: JSON.stringify({ refresh_token: session.refresh_token })
      }).then(value => {
        if (generation !== sessionGeneration) throw new Error('Sitzung wurde beendet. Bitte erneut anmelden.');
        keepSession(value);
      }).catch(error => {
        if (generation === sessionGeneration) keepSession(null);
        throw error;
      }).finally(() => { refreshPromise = null; });
    }
    await refreshPromise;
  }
  return session.access_token;
}

export async function signIn(email, password) {
  keepSession(null);
  const generation = sessionGeneration;
  const result = await request('/auth/v1/token?grant_type=password', {
    method: 'POST', body: JSON.stringify({ email, password })
  });
  if (generation !== sessionGeneration) throw new Error('Anmeldung wurde abgebrochen.');
  keepSession(result);
}
export async function signOut() {
  const previous = session?.access_token;
  keepSession(null);
  if (previous) await request('/auth/v1/logout', { method: 'POST' }, previous);
}
export async function requireAdmin() {
  const access = await token();
  const user = await request('/auth/v1/user', {}, access);
  const rows = await request(`/rest/v1/admin_users?select=user_id&user_id=eq.${encodeURIComponent(user.id)}`, {}, access);
  if (rows.length !== 1) { await signOut(); throw new Error('Dieses Konto hat keine Adminrechte.'); }
  return user;
}
export const hasSession = () => Boolean(session);
export async function readContent(admin = false) {
  return request('/rest/v1/page_content?select=key,value,updated_at&order=key', {}, admin ? await token() : undefined);
}
export async function saveContent(key, value, updatedAt) {
  if (!value.trim() || value.length > 2000) throw new Error('Bitte 1 bis 2000 Zeichen eingeben.');
  const rows = await request(`/rest/v1/page_content?key=eq.${encodeURIComponent(key)}&updated_at=eq.${encodeURIComponent(updatedAt)}`, {
    method: 'PATCH', headers: { Prefer: 'return=representation' }, body: JSON.stringify({ value: value.trim() })
  }, await token());
  if (rows.length !== 1) throw new Error('Nicht gespeichert: Inhalt wurde inzwischen geändert oder Adminrechte fehlen. Bitte Seite neu laden.');
  return rows[0];
}
