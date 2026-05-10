// ===== SUPABASE AUTH =====

async function requireAuth() {
  const { data: { session } } = await sb.auth.getSession();
  if (!session) {
    window.location.href = '/counseling/login.html';
    return null;
  }
  return session;
}

async function getSession() {
  const { data: { session } } = await sb.auth.getSession();
  return session;
}

async function signOut() {
  await sb.auth.signOut();
  window.location.href = '/counseling/index.html';
}

// ===== GOOGLE DRIVE =====

let _googleTokenClient = null;
let _googleAccessToken = null;
let _driveFolderId = null;

function initGoogleAuth(callback) {
  if (typeof google === 'undefined') return;
  _googleTokenClient = google.accounts.oauth2.initTokenClient({
    client_id: GOOGLE_CLIENT_ID,
    scope: GOOGLE_SCOPE,
    callback: (resp) => {
      if (resp.error) { showToast('Google 인증 실패', 'error'); return; }
      _googleAccessToken = resp.access_token;
      if (callback) callback(resp);
    }
  });
}

function requestGoogleToken() {
  return new Promise((resolve, reject) => {
    if (!_googleTokenClient) { reject(new Error('Google 인증 미초기화')); return; }
    _googleTokenClient.callback = (resp) => {
      if (resp.error) { reject(new Error(resp.error)); return; }
      _googleAccessToken = resp.access_token;
      resolve(resp.access_token);
    };
    if (_googleAccessToken) {
      resolve(_googleAccessToken);
    } else {
      _googleTokenClient.requestAccessToken({ prompt: 'consent' });
    }
  });
}

async function getDriveFolderId() {
  if (_driveFolderId) return _driveFolderId;
  const token = await requestGoogleToken();

  // Search for existing folder
  const q = `name='${DRIVE_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
  const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name)`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();

  if (data.files && data.files.length > 0) {
    _driveFolderId = data.files[0].id;
    return _driveFolderId;
  }

  // Create folder
  const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: DRIVE_FOLDER_NAME, mimeType: 'application/vnd.google-apps.folder' })
  });
  const folder = await createRes.json();
  _driveFolderId = folder.id;
  return _driveFolderId;
}

async function uploadToDrive(file) {
  const token = await requestGoogleToken();
  const folderId = await getDriveFolderId();

  const metadata = {
    name: file.name,
    mimeType: file.type,
    parents: [folderId]
  };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', file);

  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink,name', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form
  });
  const fileData = await res.json();

  // Make readable by anyone with link
  await fetch(`https://www.googleapis.com/drive/v3/files/${fileData.id}/permissions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ role: 'reader', type: 'anyone' })
  });

  return fileData;
}

// ===== UTILITIES =====

function showToast(msg, type = 'default') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; toast.style.transition = 'opacity 0.3s'; setTimeout(() => toast.remove(), 300); }, 2700);
}

function formatDate(str) {
  if (!str) return '-';
  const d = new Date(str);
  return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
}

function formatDateShort(str) {
  if (!str) return '-';
  const d = new Date(str);
  return d.toLocaleDateString('ko-KR', { year: '2-digit', month: '2-digit', day: '2-digit' });
}

function esc(str) {
  const d = document.createElement('div');
  d.textContent = str || '';
  return d.innerHTML;
}

function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

function getInitials(name) {
  if (!name) return '?';
  return name.charAt(0).toUpperCase();
}

// Excel export using SheetJS
async function exportToExcel(data, filename) {
  const script = document.createElement('script');
  script.src = 'https://cdn.sheetjs.com/xlsx-latest/package/dist/xlsx.full.min.js';
  document.head.appendChild(script);
  await new Promise(r => script.onload = r);

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

// Update nav auth state
async function updateNav() {
  const session = await getSession();
  const loginLink = document.getElementById('nav-login');
  const logoutBtn = document.getElementById('nav-logout');
  const authLinks = document.querySelectorAll('.nav-auth');

  if (session) {
    if (loginLink) loginLink.style.display = 'none';
    if (logoutBtn) logoutBtn.style.display = 'inline-flex';
    authLinks.forEach(el => el.style.display = 'flex');
  } else {
    if (loginLink) loginLink.style.display = 'inline-flex';
    if (logoutBtn) logoutBtn.style.display = 'none';
    authLinks.forEach(el => el.style.display = 'none');
  }
}
