document.addEventListener('DOMContentLoaded',()=>{

  const loginBtn = document.getElementById('loginBtn');
  const signupBtn = document.getElementById('signupBtn');
  const loginModal = document.getElementById('loginModal');
  const signupModal = document.getElementById('signupModal');
  const closeButtons = document.querySelectorAll('[data-close]');
  const addStoreBtn = document.getElementById('addStoreBtn');
  const addStoreModal = document.getElementById('addStoreModal');
  const addStoreForm = document.getElementById('addStoreForm');
  const logoutBtn = document.getElementById('logoutBtn');
  const storesSection = document.getElementById('my-stores');
  const storesList = document.getElementById('storesList');

  function openModal(modal){ modal.setAttribute('aria-hidden','false'); }
  function closeModal(modal){ modal.setAttribute('aria-hidden','true'); }

  loginBtn.addEventListener('click',()=>openModal(loginModal));
  signupBtn.addEventListener('click',()=>openModal(signupModal));
  addStoreBtn.addEventListener('click',()=>openModal(addStoreModal));
  closeButtons.forEach(btn => btn.addEventListener('click', e=>{
    const modal = e.target.closest('.modal');
    if(modal) closeModal(modal);
  }));
  document.querySelectorAll('.modal').forEach(m=>{ m.addEventListener('click', e=>{ if(e.target === m) closeModal(m); }); });

  // API base: if the page is opened via file://, assume server is at http://localhost:3000
  const DEFAULT_SERVER = 'http://localhost:3000';
  const BASE = (window.location.protocol === 'file:') ? DEFAULT_SERVER : '';
  // Use API('/signup') -> '/api/signup' or 'http://localhost:3000/api/signup' when opened from filesystem
  const API = (path) => `${BASE}/api${path}`;

  // Auth helpers
  function setToken(t){ if(t) localStorage.setItem('sb_token', t); else localStorage.removeItem('sb_token'); updateAuthUI(); }
  function getToken(){ return localStorage.getItem('sb_token'); }
  function authHeaders(){ const t = getToken(); return t ? { 'Authorization': 'Bearer '+t } : {}; }

  // Helper: escape HTML
  function escapeHtml(str){ if(!str) return ''; return String(str).replace(/[&<>"']/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[m]); }

  // ----- Local/demo auth fallback helpers (useful when server is offline) -----
  function localUsersKey(){ return 'sb_local_users_v1'; }
  function readLocalUsers(){
    try{ return JSON.parse(localStorage.getItem(localUsersKey())||'[]'); }catch(e){ return []; }
  }
  function writeLocalUsers(u){ localStorage.setItem(localUsersKey(), JSON.stringify(u||[])); }
  function localSignup(email, password){
    email = (email||'').toLowerCase();
    const users = readLocalUsers();
    if(users.find(x=>x.email===email)) return false;
    // Simple demo-only storage: DO NOT use this for real passwords.
    users.push({ id: 'local:'+Date.now(), email, pw: btoa(password||'') , createdAt: Date.now() });
    writeLocalUsers(users);
    return true;
  }
  function localLogin(email, password){
    email = (email||'').toLowerCase();
    const users = readLocalUsers();
    const u = users.find(x=>x.email===email && x.pw === btoa(password||''));
    return !!u;
  }
  function createLocalToken(email){
    // Not a real JWT. Just a local demo token so client knows user is logged in.
    const t = { type:'local', sub: email, iat: Date.now() };
    return 'local.'+btoa(JSON.stringify(t));
  }

  // Local stores helpers (demo fallback)
  function localStoresKey(){ return 'sb_local_stores_v1'; }
  function readLocalStores(){
    try{ return JSON.parse(localStorage.getItem(localStoresKey())||'[]'); }catch(e){ return []; }
  }
  function writeLocalStores(s){ localStorage.setItem(localStoresKey(), JSON.stringify(s||[])); }
  function parseLocalTokenEmail(){
    const t = getToken();
    if(!t || !t.startsWith('local.')) return null;
    try{
      const payload = JSON.parse(atob(t.slice(6)));
      return payload.sub || null;
    }catch(e){ return null; }
  }
  function localAddStore(name, description){
    name = (name||'').toString().trim();
    description = (description||'').toString().trim();
    if(!name) return false;
    const stores = readLocalStores();
    const ownerEmail = parseLocalTokenEmail();
    const id = 'localstore:'+Date.now()+':'+Math.floor(Math.random()*1000);
    const store = { id, ownerId: ownerEmail ? ('local:'+ownerEmail) : id, ownerEmail: ownerEmail, name, description, status: 'pending', createdAt: Date.now() };
    stores.push(store);
    writeLocalStores(stores);
    return true;
  }


  function updateAuthUI(){
    // If using local token, load local stores
    const token = getToken();
    if(token && token.startsWith('local.')){
      const local = readLocalStores();
      if(!storesList) return;
      if(!Array.isArray(local) || local.length === 0){
        storesList.innerHTML = '<p class="muted">No stores yet. Use "Add Store" to create one.</p>';
        return;
      }
      storesList.innerHTML = '';
      local.forEach(s=>{
        const el = document.createElement('div');
        el.className = 'card';
        el.style.marginBottom = '8px';
        el.innerHTML = `<strong>${escapeHtml(s.name)}</strong><div class="muted">Status: ${escapeHtml(s.status||'')}</div><div style="margin-top:6px">${escapeHtml(s.description||'')}</div>`;
        storesList.appendChild(el);
      });
      return;
    }

    try{
      const res = await fetch(API('/stores/my'), { headers: authHeaders() });
      const data = await res.json();
      // Render stores
      if(!storesList) return;
      if(!Array.isArray(data) || data.length === 0){
        storesList.innerHTML = '<p class="muted">No stores yet. Use "Add Store" to create one.</p>';
        return;
      }
      storesList.innerHTML = '';
      data.forEach(s=>{
        const el = document.createElement('div');
        el.className = 'card';
        el.style.marginBottom = '8px';
        el.innerHTML = `<strong>${escapeHtml(s.name)}</strong><div class="muted">Status: ${escapeHtml(s.status||'')}</div><div style="margin-top:6px">${escapeHtml(s.description||'')}</div>`;
        storesList.appendChild(el);
      });
    }catch(err){
      console.warn('Failed to load stores from server, loading local stores as fallback', err);
      const local = readLocalStores();
      if(!storesList) return;
      if(!Array.isArray(local) || local.length === 0){
        storesList.innerHTML = '<p class="muted">No stores yet. Use "Add Store" to create one.</p>';
        return;
      }
      storesList.innerHTML = '';
      local.forEach(s=>{
        const el = document.createElement('div');
        el.className = 'card';
        el.style.marginBottom = '8px';
        el.innerHTML = `<strong>${escapeHtml(s.name)}</strong><div class="muted">Status: ${escapeHtml(s.status||'')}</div><div style="margin-top:6px">${escapeHtml(s.description||'')}</div>`;
        storesList.appendChild(el);
      });
    }
      const pending = document.getElementById('pendingStoresList');
      if(!pending) return;
      if(!Array.isArray(data) || data.length === 0){ pending.innerHTML = '<p class="muted">No pending stores.</p>'; return; }
      pending.innerHTML = '';
      data.forEach(s=>{
        const el = document.createElement('div');
        el.className = 'card';
        el.style.marginBottom = '8px';
        const ownerLabel = s.ownerEmail ? s.ownerEmail : (s.ownerId || '');
        el.innerHTML = `<strong>${escapeHtml(s.name)}</strong><div class="muted">Owner: ${escapeHtml(ownerLabel)}</div><div class="muted">Status: ${escapeHtml(s.status||'')}</div><div style="margin-top:6px">${escapeHtml(s.description||'')}</div>`;
        const btnWrap = document.createElement('div');
        btnWrap.style.marginTop = '8px';
        const apr = document.createElement('button');
        apr.className = 'btn btn-primary';
        apr.textContent = 'Approve';
        apr.style.marginRight = '8px';
        apr.addEventListener('click', ()=> approveStore(s.id));
        const rej = document.createElement('button');
        rej.className = 'btn btn-outline';
        rej.textContent = 'Reject';
        rej.addEventListener('click', ()=> rejectStore(s.id));
        btnWrap.appendChild(apr);
        btnWrap.appendChild(rej);
        el.appendChild(btnWrap);
        pending.appendChild(el);
      });
    }catch(err){ console.error('loadPendingStores', err); }
  }

  async function approveStore(id){
    try{
      const res = await fetch(API(`/stores/${id}/status`), { method:'POST', headers: Object.assign({'Content-Type':'application/json'}, authHeaders()), body: JSON.stringify({ status: 'approved' }) });
      const data = await res.json();
      if(res.ok){ alert('Store approved'); loadPendingStores(); loadStores(); }
      else alert(data.error || 'Failed to approve');
    }catch(err){ console.error(err); alert('Network error'); }
  }

  async function rejectStore(id){
    try{
      const res = await fetch(API(`/stores/${id}/status`), { method:'POST', headers: Object.assign({'Content-Type':'application/json'}, authHeaders()), body: JSON.stringify({ status: 'rejected' }) });
      const data = await res.json();
      if(res.ok){ alert('Store rejected'); loadPendingStores(); }
      else alert(data.error || 'Failed to reject');
    }catch(err){ console.error(err); alert('Network error'); }
  }

  // Signup
  const signupForm = document.getElementById('signupForm');
  signupForm.addEventListener('submit', async e=>{
    e.preventDefault();
    const form = new FormData(signupForm);
    const payload = { email: form.get('email'), password: form.get('password') };
    try{
      const res = await fetch(API('/signup'), { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload) });
      const data = await res.json();
      if(res.ok){ setToken(data.token); closeModal(signupModal); alert('Account created.'); }
      else alert(data.error || 'Signup failed');
    }catch(err){
      console.warn('Signup network error, falling back to local demo auth', err);
      // Fallback: save demo user locally for offline/demo mode
      try{
        const ok = localSignup(payload.email, payload.password);
        if(ok){
          const token = createLocalToken(payload.email);
          setToken(token);
          closeModal(signupModal);
          alert('Account created (local demo mode).');
        } else {
          alert('Local signup failed: user already exists');
        }
      }catch(ferr){
        console.error('Local signup error', ferr);
        alert('Signup failed');
      }
    }
  });

  // Login
  const loginForm = document.getElementById('loginForm');
  loginForm.addEventListener('submit', async e=>{
    e.preventDefault();
    const form = new FormData(loginForm);
    const payload = { email: form.get('email'), password: form.get('password') };
    try{
      const res = await fetch(API('/login'), { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload) });
      const data = await res.json();
      if(res.ok){ setToken(data.token); closeModal(loginModal); alert('Logged in'); }
      else alert(data.error || 'Login failed');
    }catch(err){
      console.warn('Login network error, trying local demo auth', err);
      try{
        const ok = localLogin(payload.email, payload.password);
        if(ok){
          const token = createLocalToken(payload.email);
          setToken(token);
          closeModal(loginModal);
          alert('Logged in (local demo mode)');
        } else {
          alert('Local login failed: invalid credentials');
        }
      }catch(ferr){
        console.error('Local login error', ferr);
        alert('Login failed');
      }
    }
  });

  // Logout
  logoutBtn.addEventListener('click', ()=>{ setToken(null); alert('Logged out'); });

  // Add store
  addStoreForm.addEventListener('submit', async e=>{
    e.preventDefault();
    const form = new FormData(addStoreForm);
    const payload = { name: form.get('name'), description: form.get('description') };
    // If using local demo token, create store locally
    const token = getToken();
    if(token && token.startsWith('local.')){
      const ok = localAddStore(payload.name, payload.description);
      if(ok){ closeModal(addStoreModal); addStoreForm.reset(); alert('Store saved locally (demo mode)'); loadStores(); }
      else alert('Failed to save local store');
      return;
    }

    try{
      const res = await fetch(API('/stores'), { method:'POST', headers: Object.assign({'Content-Type':'application/json'}, authHeaders()), body:JSON.stringify(payload) });
      const data = await res.json();
      if(res.ok){ closeModal(addStoreModal); addStoreForm.reset(); alert('Store submitted — pending verification'); loadStores(); }
      else {
        // if server responded but rejected, show message
        alert(data.error || 'Submit failed');
      }
    }catch(err){
      console.warn('Add store network error, saving locally as demo fallback', err);
      const ok = localAddStore(payload.name, payload.description);
      if(ok){ closeModal(addStoreModal); addStoreForm.reset(); alert('Store saved locally (demo fallback)'); loadStores(); }
      else alert('Failed to save local store');
    }
  });

  // Load stores for current user
  async function loadStores(){
    try{
      const res = await fetch(API('/stores/my'), { headers: authHeaders() });
      const data = await res.json();
      // Render stores
      if(!storesList) return;
      if(!Array.isArray(data) || data.length === 0){
        storesList.innerHTML = '<p class="muted">No stores yet. Use "Add Store" to create one.</p>';
        return;
      }
      storesList.innerHTML = '';
      data.forEach(s=>{
        const el = document.createElement('div');
        el.className = 'card';
        el.style.marginBottom = '8px';
        el.innerHTML = `<strong>${escapeHtml(s.name)}</strong><div class="muted">Status: ${escapeHtml(s.status||'')}</div><div style="margin-top:6px">${escapeHtml(s.description||'')}</div>`;
        storesList.appendChild(el);
      });
    }catch(err){ console.error(err); }
  }

  // Simulate API request (existing code preserved)
  const sendSample = document.getElementById('sendSample');
  const sampleResponse = document.getElementById('sampleResponse');

  sendSample.addEventListener('click', ()=>{
    const simulated = {
      risk_score: 58,
      recommended_action: "CHALLENGE",
      breakdown: {
        ip_score: 20,
        velocity_score: 10,
        fingerprint_score: 8,
        behavior_score: 20
      }
    };
    sampleResponse.textContent = JSON.stringify(simulated, null, 2);
    sendSample.textContent = 'Simulated';
    setTimeout(()=> sendSample.textContent = 'Simulate Request', 1500);
  });

  // Initialize UI based on token
  updateAuthUI();

});
