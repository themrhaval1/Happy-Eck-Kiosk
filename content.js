import { configured, readContent } from './supabase-client.js';

// Static originals stay visible if Supabase is unconfigured or unavailable.
if (configured) {
  readContent().then(rows => {
    for (const row of rows) {
      const element = document.querySelector(`[data-content="${CSS.escape(row.key)}"]`);
      if (element && typeof row.value === 'string') element.textContent = row.value;
    }
  }).catch(() => { /* Preserve the original page on network/database errors. */ });
}
