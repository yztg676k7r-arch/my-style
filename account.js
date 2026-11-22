'use strict';
const styleCloud = (() => {
  const origin = 'https://geofouunicqjyhivkboz.supabase.co';
  const apiKey = 'sb_publishable_f7llD0Wc4m4kn9cQxOBZCA_P2W88e1i';
  const cacheKey = 'my-style-account-v1';
  let account = JSON.parse(sessionStorage.getItem(cacheKey) || 'null');
  let saving, renewing, timer;
  const el = id => document.getElementById(id);
  function status(message) {
    el('cloudStatus').textContent = message;
    el('cloudBadge').textContent = message;
  }
  function cache(next) {
    sessionStorage.setItem(cacheKey, JSON.stringify(next));
    account = next;
  }
  async function request(path, options = {}, token) {
    const response = await fetch(origin + path, {
      ...options, headers: {apikey: apiKey, 'Content-Type': 'application/json',
        ...(token ? {Authorization: 'Bearer ' + token} : {}), ...options.headers}
    });
    const body = await response.text();
    const result = body ? JSON.parse(body) : null;
    if (!response.ok) throw Object.assign(new Error(result?.msg || result?.message || result?.error_description || 'Verbindung fehlgeschlagen.'), {status: response.status});
    return result;
  }
  function credentials(session) {
    return {id: session.user.id, email: session.user.email, token: session.access_token,
      refresh: session.refresh_token, expires: Date.now() + session.expires_in * 1000};
  }
  async function token() {
    if (account.expires > Date.now() + 60000) return account.token;
    if (!renewing) renewing = request('/auth/v1/token?grant_type=refresh_token', {
      method: 'POST', body: JSON.stringify({refresh_token: account.refresh})
    }).then(result => cache({...account, ...credentials(result)})).finally(() => {renewing = null;});
    await renewing;
    return account.token;
  }
  const table = '/rest/v1/my_style_accounts';
  async function read(id, access) {
    const rows = await request(table + '?select=revision,entries&user_id=eq.' + encodeURIComponent(id), {}, access);
    return rows[0];
  }
  async function flush() {
    while (account?.dirty) {
      const access = await token();
      const {id, revision, entries, pending} = account;
      const next = pending || crypto.randomUUID();
      cache({...account, pending: next});
      const options = {
        method: revision ? 'PATCH' : 'POST', headers: {Prefer: 'return=representation'},
        body: JSON.stringify({...(revision ? {} : {user_id: id}), revision: next, entries})
      };
      const url = revision ? table + '?user_id=eq.' + id + '&revision=eq.' + revision : table;
      let rows;
      try { rows = await request(url, options, access); }
      catch (error) { if (error.status !== 409) throw error; }
      if (!rows?.length) {
        const remote = await read(id, access);
        if (remote?.revision !== next) throw Error('Ein anderes Gerät hat Änderungen gespeichert. Lade hier eine Gesamtsicherung herunter, öffne den Kontostand neu und spiele die Sicherung bei Bedarf ein.');
        if (JSON.stringify(remote.entries, Object.keys(entries).sort()) !== JSON.stringify(entries, Object.keys(entries).sort())) {
          cache({...account, revision: next, pending: null, dirty: true});
          continue;
        }
      }
      cache({...account, revision: next, pending: null, dirty: account.entries !== entries});
    }
    status('Im Konto gespeichert');
  }
  async function sync() {
    if (!account) return;
    if (!saving) saving = flush().catch(error => status('Noch nicht synchronisiert · ' + error.message)).finally(() => {saving = null;});
    return saving;
  }
  function change(key, value) {
    if (!account) {
      if (value === null) localStorage.removeItem(key);
      else localStorage.setItem(key, value);
      return;
    }
    const entries = {...account.entries};
    if (value === null) delete entries[key]; else entries[key] = value;
    cache({...account, entries, dirty: true});
    status('Wird gespeichert …');
    clearTimeout(timer);
    timer = setTimeout(sync, 100);
  }
  const storage = {
    getItem: key => account ? account.entries[key] ?? null : localStorage.getItem(key),
    setItem: change, removeItem: key => change(key, null)
  };
  async function authenticate(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const signup = event.submitter?.value === 'signup';
    const email = el('cloudEmail').value.trim();
    const password = el('cloudPassword').value;
    const local = {};
    for (const key of fullBackupKeys) {
      const value = localStorage.getItem(key);
      if (value !== null) local[key] = value;
    }
    form.inert = true;
    try {
      const session = await request(signup ? '/auth/v1/signup?redirect_to=' + encodeURIComponent(location.origin + location.pathname) : '/auth/v1/token?grant_type=password', {
        method: 'POST', body: JSON.stringify({email, password})
      });
      el('cloudPassword').value = '';
      if (!session.access_token) {status('Bitte prüfe dein Postfach. Nach der E-Mail-Bestätigung kannst du dich hier anmelden.');return;}
      const auth = credentials(session);
      const row = await read(auth.id, auth.token);
      const importLocal = !row && Object.keys(local).length && confirm('Die auf diesem Gerät gespeicherten MY STYLE-Daten in das Konto ' + email + ' übernehmen?');
      cache({...auth, revision: row?.revision || null, entries: row?.entries || (importLocal ? local : {}), dirty: !row});
      location.reload();
    } catch (error) {status('Anmeldung · ' + error.message);}
    finally {form.inert = false;}
  }
  async function init() {
    el('cloudForm').onsubmit = authenticate;
    el('cloudForm').hidden = !!account;
    el('cloudActions').hidden = !account;
    if (!account) return;
    el('cloudIdentity').textContent = account.email;
    el('cloudRetry').onclick = sync;
    el('cloudLogout').onclick = async () => {
      await sync();
      if (account.dirty) {if (!confirm('Es gibt ungesicherte Änderungen. Hast du die Gesamtsicherung heruntergeladen und möchtest diesen Tab vom Konto trennen?')) return;}
      try { await request('/auth/v1/logout?scope=local', {method:'POST'}, await token()); }
      catch (error) { if (![400,401,403].includes(error.status)) { status(error.message); return; } }
      sessionStorage.removeItem(cacheKey); account = null; location.reload();
    };
    el('cloudReload').onclick = async () => {
      if (saving) await saving;
      if (account.dirty && !confirm('Offene Änderungen in diesem Tab verwerfen und den Kontostand laden? Bitte vorher eine Gesamtsicherung herunterladen.')) return;
      try {
        const row = await read(account.id, await token());
        if (!row) throw Error('Noch kein gespeicherter Kontostand.');
        cache({...account, revision:row.revision, entries:row.entries, pending:null, dirty:false});
        location.reload();
      } catch(error) {status(error.message);}
    };
    window.addEventListener('online', sync);
    window.addEventListener('beforeunload', event => {if (account?.dirty) {event.preventDefault();event.returnValue = ''; }});
    if (account.dirty) await sync();
    else {
      try {
        const original = account.revision;
        const row = await read(account.id, await token());
        if (account.dirty || saving || account.revision !== original) return;
        if (row && row.revision !== original) {
          cache({...account, revision:row.revision, entries:row.entries});
          location.reload();return;
        }
        status('Im Konto gespeichert');
      } catch(error) {status('Kontostand konnte nicht geprüft werden · ' + error.message);}
    }
  }
  document.addEventListener('DOMContentLoaded', init);
  return {storage};
})();
