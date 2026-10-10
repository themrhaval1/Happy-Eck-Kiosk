const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');

async function client(fetch, config = { url: 'https://test-project.supabase.co', publishableKey: 'sb_publishable_test' }) {
  const data = new Map();
  const context = vm.createContext({ fetch, AbortSignal, Date, JSON, Error, encodeURIComponent, atob,
    sessionStorage: { getItem: k => data.get(k), setItem: (k,v) => data.set(k,v), removeItem: k => data.delete(k) } });
  const settings = new vm.SourceTextModule(`export const config = ${JSON.stringify(config)}`, { context });
  const mod = new vm.SourceTextModule(fs.readFileSync(path.join(__dirname, '../supabase-client.js'),'utf8'), { context });
  await mod.link(() => settings); await mod.evaluate();
  return { api: mod.namespace, data };
}
const reply = (body,status=200) => ({ ok: status < 400, status, text: async () => JSON.stringify(body) });
const auth = { access_token: 'user-token', refresh_token: 'refresh-token', expires_in: 3600 };

test('unconfigured site makes no API calls', async () => {
  const {api} = await client(() => { throw Error('Unexpected request'); }, {url:'',publishableKey:''});
  assert.equal(api.configured,false); await assert.rejects(api.readContent(), /noch nicht eingerichtet/);
});
test('service role keys cannot activate browser client', async () => {
  const key = 'eyJ.' + Buffer.from(JSON.stringify({role:'service_role'})).toString('base64url') + '.sig';
  const {api} = await client(() => {}, {url:'https://test.supabase.co',publishableKey:key});
  assert.equal(api.configured,false);
});
test('public reads do not attach an admin token', async () => {
  const {api} = await client(async (_,options) => { assert.equal(options.headers.Authorization,undefined); return reply([]); });
  assert.equal((await api.readContent()).length,0);
});
test('authenticated non-admin is rejected and locally signed out', async () => {
  const {api,data} = await client(async url => {
    if (url.includes('/token?')) return reply(auth);
    if (url.endsWith('/user')) return reply({id:'normal-user'});
    if (url.includes('/admin_users?')) return reply([]);
    return reply(null);
  });
  await api.signIn('person@example.com','not-stored');
  assert.ok(!JSON.stringify([...data]).includes('not-stored'));
  await assert.rejects(api.requireAdmin(), /keine Adminrechte/);
  assert.equal(api.hasSession(),false);
});
test('admin edits use JWT, only value, and optimistic concurrency filter', async () => {
  const {api} = await client(async (url,options) => {
    if (url.includes('/token?')) return reply(auth);
    assert.equal(options.headers.Authorization,'Bearer user-token');
    if (url.endsWith('/user')) return reply({id:'owner'});
    if (url.includes('/admin_users?')) return reply([{user_id:'owner'}]);
    assert.ok(url.includes('updated_at=eq.2026-10-10T20%3A00%3A00Z'));
    assert.equal(options.method,'PATCH'); assert.deepEqual(JSON.parse(options.body),{value:'Neuer Text'});
    return reply([{key:'hero_description',value:'Neuer Text',updated_at:'next'}]);
  });
  await api.signIn('owner@example.com','password'); await api.requireAdmin();
  assert.equal((await api.saveContent('hero_description',' Neuer Text ','2026-10-10T20:00:00Z')).value,'Neuer Text');
});
test('empty update result is not reported as success', async () => {
  const {api} = await client(async url => reply(url.includes('/token?') ? auth : []));
  await api.signIn('owner@example.com','password');
  await assert.rejects(api.saveContent('hero_description','text','old'),/Nicht gespeichert/);
});
test('logout clears local credentials even if remote logout fails', async () => {
  const {api,data} = await client(async url => reply(url.includes('/token?') ? auth : {},url.endsWith('/logout') ? 503 : 200));
  await api.signIn('owner@example.com','password'); await assert.rejects(api.signOut());
  assert.equal(api.hasSession(),false); assert.equal(data.size,0);
});
