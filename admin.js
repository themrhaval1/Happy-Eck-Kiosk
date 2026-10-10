import { configured, signIn, signOut, requireAdmin, hasSession, readContent, saveContent } from './supabase-client.js';
const labels = { hero_description: 'Startseite · Einleitung', assortment_description: 'Sortiment · Beschreibung',
  delivery_description: 'Bestellen · Beschreibung', jobs_description: 'Jobs · Beschreibung', contact_description: 'Kontakt · Beschreibung' };
const status = document.getElementById('status');
const login = document.getElementById('loginPanel');
const editor = document.getElementById('editorPanel');
const loginButton = document.getElementById('loginButton');

async function showEditor() {
  const user = await requireAdmin();
  const rows = await readContent(true);
  if (rows.length !== Object.keys(labels).length) throw new Error('Inhalte fehlen. Bitte die Supabase-Migration prüfen.');
  const fields = document.getElementById('fields');
  fields.replaceChildren();
  for (const row of rows) {
    if (!labels[row.key]) continue;
    const form = document.createElement('form'); form.className = 'panel';
    const label = document.createElement('label'); label.htmlFor = row.key; label.textContent = labels[row.key];
    const input = document.createElement('textarea'); input.id = row.key; input.value = row.value; input.maxLength = 2000; input.required = true;
    const button = document.createElement('button'); button.type = 'submit'; button.textContent = 'Text speichern';
    const feedback = document.createElement('p'); feedback.className = 'feedback'; feedback.setAttribute('role', 'status');
    form.append(label, input, button, feedback);
    form.addEventListener('submit', async event => {
      event.preventDefault(); button.disabled = true; feedback.textContent = 'Wird gespeichert …';
      try { const updated = await saveContent(row.key, input.value, row.updated_at); row.updated_at = updated.updated_at;
        input.value = updated.value; feedback.textContent = 'Gespeichert. Auf der Startseite sichtbar.';
      } catch (error) { feedback.textContent = error.message; }
      finally { button.disabled = false; }
    });
    fields.append(form);
  }
  document.getElementById('account').textContent = `Angemeldet: ${user.email}`;
  login.hidden = true; editor.hidden = false; status.textContent = '';
}

document.getElementById('loginForm').addEventListener('submit', async event => {
  event.preventDefault(); loginButton.disabled = true; status.textContent = 'Anmeldung wird geprüft …';
  const password = document.getElementById('password');
  try { await signIn(document.getElementById('email').value.trim(), password.value); await showEditor(); }
  catch (error) { status.textContent = error.message; }
  finally { password.value = ''; loginButton.disabled = !configured; }
});
document.getElementById('logoutButton').addEventListener('click', async () => {
  editor.hidden = true; login.hidden = false; document.getElementById('fields').replaceChildren();
  document.getElementById('account').textContent = '';
  try { await signOut(); status.textContent = 'Abgemeldet.'; }
  catch { status.textContent = 'Lokal abgemeldet. Die Verbindung zu Supabase ist gerade nicht erreichbar.'; }
});
if (!configured) { loginButton.disabled = true; status.textContent = 'Der Adminbereich ist vorbereitet. Die Supabase-Verbindung muss noch aktiviert werden.'; }
else if (hasSession()) showEditor().catch(error => { status.textContent = error.message; });
