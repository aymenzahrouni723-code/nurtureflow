/* ============================================================
   NurtureFlow — Frontend Application
   SPA avec appels API vers le backend Express
   ============================================================ */

// ── API Helper ──
async function api(endpoint, options = {}) {
  const config = {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    ...options
  };
  if (options.body && typeof options.body === 'object') {
    config.body = JSON.stringify(options.body);
  }
  const res = await fetch('/api' + endpoint, config);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || t('err_server'));
  return data;
}

// ── State ──
const state = {
  currentScreen: 'auth',
  authenticated: false,
  couple: null,
  currentQuestionnaireType: null,
  currentQuestion: 0,
  answers: {},
  scores: { psychologique: 0, conjugal: 0, sexuel: 0 },
  currentMood: null
};

// ── Questionnaire Data (translated) ──
function getQuestionnaires() {
  return {
    psychologique: {
      title: t('qt_psycho'),
      icon: 'psychology',
      color: 'var(--secondary)',
      questions: [
        { q: t('qp1'), hint: t('qp1h') },
        { q: t('qp2'), hint: t('qp2h') },
        { q: t('qp3'), hint: t('qp3h') },
        { q: t('qp4'), hint: t('qp4h') },
        { q: t('qp5'), hint: t('qp5h') },
        { q: t('qp6'), hint: t('qp6h') },
        { q: t('qp7'), hint: t('qp7h') },
        { q: t('qp8'), hint: t('qp8h') },
        { q: t('qp9'), hint: t('qp9h') },
        { q: t('qp10'), hint: t('qp10h') }
      ]
    },
    conjugal: {
      title: t('qt_conjugal'),
      icon: 'favorite',
      color: 'var(--primary)',
      questions: [
        { q: t('qc1'), hint: t('qc1h') },
        { q: t('qc2'), hint: t('qc2h') },
        { q: t('qc3'), hint: t('qc3h') },
        { q: t('qc4'), hint: t('qc4h') },
        { q: t('qc5'), hint: t('qc5h') },
        { q: t('qc6'), hint: t('qc6h') },
        { q: t('qc7'), hint: t('qc7h') },
        { q: t('qc8'), hint: t('qc8h') },
        { q: t('qc9'), hint: t('qc9h') },
        { q: t('qc10'), hint: t('qc10h') }
      ]
    },
    sexuel: {
      title: t('qt_sexual'),
      icon: 'diversity_3',
      color: 'var(--tertiary)',
      questions: [
        { q: t('qs1'), hint: t('qs1h') },
        { q: t('qs2'), hint: t('qs2h') },
        { q: t('qs3'), hint: t('qs3h') },
        { q: t('qs4'), hint: t('qs4h') },
        { q: t('qs5'), hint: t('qs5h') },
        { q: t('qs6'), hint: t('qs6h') },
        { q: t('qs7'), hint: t('qs7h') },
        { q: t('qs8'), hint: t('qs8h') },
        { q: t('qs9'), hint: t('qs9h') },
        { q: t('qs10'), hint: t('qs10h') }
      ]
    }
  };
}

function getLikertOptions() {
  return [
    { label: t('q_never'), value: 1 },
    { label: t('q_rarely'), value: 2 },
    { label: t('q_sometimes'), value: 3 },
    { label: t('q_often'), value: 4 },
    { label: t('q_always'), value: 5 }
  ];
}

function getSageFemmeTips() {
  return [
    { cat: 'post-partum', icon: 'medical_services', title: t('sft1_title'), text: t('sft1_text') },
    { cat: 'contraception', icon: 'medication', title: t('sft3_title'), text: t('sft3_text') },
    { cat: 'alerte', icon: 'warning', title: t('sft5_title'), text: t('sft5_text') },
    { cat: 'post-partum', icon: 'self_improvement', title: t('sft6_title'), text: t('sft6_text') },
    { cat: 'post-partum', icon: 'fitness_center', title: t('sft8_title'), text: t('sft8_text') }
  ];
}

const images = {
  conseil: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCyozaAlkCROsC0KyJjNU4CthWFga8nMzjdgBoz8RtTZxOZSdoxtfyr17BLT5aqOM94Z0Z9bE2QY2SjP_VnSU8Xv2DZNYx5qCVJtMLvbqncGCAdKPnVIv0dZhrOUL0mzh5T6gYg5FN5YY-l-4BjgBJSSgeo1xBAg4UgsgBEgNrf9Yyzt9WrsNBIyBBmDgHk_e-aCGv0q8rSdDVXyxgPi1V2p7N2dv9kVe7ToOMb0V7RogEDOaPbrLbeg2sOGEL6On6ZPiabDbIkjrs',
  questionnaire: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC4qN8sT3na-ACGhYj9XAiXD1SgyJWjmSGbgK8afdX2U-cuTkw3bYSgXzJowMba7gy86quI8WaG2o7WsYYjZNUaKszdWPDJPfdkLcCuRZmGQcYtvlozy33mWZdM_-WvDQElbiwkCYbQLo5jnQUp091fdNHanjrAvKE2JRKmiAAmvy1ZcupdVJX9Bi0IbvJcBlFqTqJfW6pR6hZKOIKZn_awnsrUuhmp6LUvFJRKJ5nWl77aFVxy6kvT3yK9B8FOhVoCi_ZyvXwVJ6Y',
  results: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDQWdej-XsSyRrKhPlnpspTtYwzwBN9ZEeVs3fYkBsBCuGIjjB5eXy-3cySmxxNHHK69PT870RU088-aNYxDYdln7TZKT5qzTv5F6iRJ59lIWize4dMBBRX16rdihdU_aNG-vir88SLij11eKeeT83G9YmaQ2-lMHtHeO3Wr_XPPrVZoq1y3pefejAfZz6uQzWhu-l22USN84rhQru8kYs4JCmdYvK0xCAykjT4TNCjMpiOYagrVL-3FQ1LGckF7nQ5Q7uvJU5y84o',
  couple: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAKdNTcd4YA62gEVZKqNjb3aTVQgmzga1OoPLBxXTRf6y466079mVTv7sgqEIHLQHOo48oyqAgPX6POdA7xjLyov6RDrmtO8mRNZ1RTvMt1To1wChmXShGnxcviMSGOjkFqNQzyd5VjhNDdFBfSyTsCqEijGnELXJnKCZNSDNSKMZJb3Q59xOkiG1WzSjzcr8lx53UNsUJue8j8VbMkEVBlVil7YHFgsc7suFU70dcAEwxs2REKnFD3-zwruifc28isp7njvHiDoMY',
  library: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA_RVwSRojNQlvzaGMnJZZdc50mbYPZ5Q_ZE-QCjDDRe2llIpMpGHkgKIOa1-IDCWjtYllW0Ap22mYOYbXxl584d5cvvt6x1jxjdiFzv9nXfJW2TKQ1Dc_EjKysk1sbk-UuZpMXGJTWA2GwTYTQtuMYeP-AUwQI39tF-SFF3vmcUHTwukDZsk5JSnGEJwsGfoWA0tfrA9R9ODAMeqLbJF0shKmroDnUeZZ1VvufD4V9R9CYaluQD7OsiNaQmVJ0mmtLUHbgBdyHtxI'
};

// ══════════════════════════════════════════════════════════════
//  INIT
// ══════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  // Initialize language direction
  const langInfo = LANGS[currentLang];
  if (langInfo) {
    document.documentElement.setAttribute('dir', langInfo.dir);
    document.documentElement.setAttribute('lang', currentLang);
    document.body.classList.toggle('rtl', langInfo.dir === 'rtl');
  }

  initSplash();
  initNavigation();
  initDrawer();
  initScrollEffects();
  checkAuth();
});

// ── Splash ──
function initSplash() {
  const splash = document.getElementById('splash');
  if (splash) setTimeout(() => { splash.classList.add('hide'); setTimeout(() => splash.remove(), 600); }, 2000);
}

// ── Check auth on load ──
async function checkAuth() {
  try {
    const data = await api('/auth/me');
    if (data.authenticated) {
      state.authenticated = true;
      state.couple = data.couple;
      navigateTo('home');
    } else {
      navigateTo('auth');
    }
  } catch (e) {
    navigateTo('auth');
  }
}

// ══════════════════════════════════════════════════════════════
//  NAVIGATION
// ══════════════════════════════════════════════════════════════
function initNavigation() {
  document.querySelectorAll('[data-nav]').forEach(btn => {
    btn.addEventListener('click', () => navigateTo(btn.dataset.nav));
  });
}

function navigateTo(screenId) {
  const topBar = document.getElementById('topBar');
  const bottomNav = document.getElementById('bottomNav');
  const fab = document.getElementById('fab');

  // Auth, questionnaire and timeline-article screens hide shell
  const hideShell = ['auth', 'questionnaire', 'timeline-article'].includes(screenId);
  topBar.style.display = hideShell ? 'none' : 'flex';
  bottomNav.style.display = hideShell ? 'none' : 'flex';
  if (fab) fab.style.display = screenId === 'home' ? 'flex' : 'none';

  // Update bottom nav
  document.querySelectorAll('.bottom-nav__item').forEach(item => {
    const isActive = item.dataset.nav === screenId;
    item.classList.toggle('active', isActive);
    const icon = item.querySelector('.material-symbols-outlined');
    icon.classList.toggle('icon-filled', isActive);
  });

  // Transition
  const current = document.querySelector('.screen.active');
  if (current) {
    current.classList.remove('visible');
    setTimeout(() => { current.classList.remove('active'); showScreen(screenId); }, 200);
  } else {
    showScreen(screenId);
  }

  state.currentScreen = screenId;
  if (!['questionnaire', 'auth'].includes(screenId)) window.location.hash = screenId;
}

function showScreen(screenId) {
  const screen = document.getElementById('screen-' + screenId);
  if (!screen) return;
  screen.classList.add('active');
  requestAnimationFrame(() => requestAnimationFrame(() => screen.classList.add('visible')));

  switch (screenId) {
    case 'home': renderHome(); break;
    case 'evaluations': renderResults(); break;
    case 'library': renderLibrary(); break;
    case 'profile': renderProfile(); break;
    case 'questionnaire': renderQuestionnaire(); break;
    case 'sage-femme': renderSageFemme(); break;
    case 'suivi': renderSuivi(); break;
    case 'new-couple': renderNewCouple(); break;
    case 'plan': renderPlan(); break;
    case 'checkup': renderCheckup(); break;
    case 'timeline-article': renderTimelineArticle(); break;
    case 'alerts': renderAlerts(); break;
    case 'admin': renderAdmin(); break;
    case 'semaines': renderSemaines(); break;
    case 'journal': renderJournal(); break;
    case 'echelles': renderEchelles(); break;
    case 'tounsi': renderTounsi(); break;
    case 'breastfeeding': renderBreastfeeding(); break;
    case 'sexuality': renderSexuality(); break;
    case 'newborn': renderNewborn(); break;
    case 'myths': renderMyths(); break;
  }

  window.scrollTo(0, 0);
  setTimeout(() => initReveal(), 100);
}

// ── Drawer ──
function initDrawer() {
  document.getElementById('menuBtn')?.addEventListener('click', () => {
    document.getElementById('drawer').classList.add('open');
    document.getElementById('drawerOverlay').classList.add('open');
  });
  document.getElementById('drawerOverlay')?.addEventListener('click', closeDrawer);
  document.querySelectorAll('[data-drawer-nav]').forEach(link => {
    link.addEventListener('click', () => { closeDrawer(); setTimeout(() => navigateTo(link.dataset.drawerNav), 300); });
  });
}
function closeDrawer() {
  document.getElementById('drawer')?.classList.remove('open');
  document.getElementById('drawerOverlay')?.classList.remove('open');
}

// ── Scroll & Reveal ──
function initScrollEffects() {
  window.addEventListener('scroll', () => {
    const topBar = document.getElementById('topBar');
    if (topBar) topBar.classList.toggle('scrolled', window.scrollY > 10);
  });
}
function initReveal() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('revealed'); });
  }, { threshold: 0.1 });
  document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
}

// ══════════════════════════════════════════════════════════════
//  AUTH — LOGIN / REGISTER
// ══════════════════════════════════════════════════════════════
function showLogin() {
  const c = document.getElementById('auth-content');
  c.innerHTML = `
    <div class="text-center mb-3xl" style="padding-top:80px;">
      <span class="material-symbols-outlined icon-filled" style="font-size:56px;color:var(--primary);">child_care</span>
      <h1 class="text-display-lg-mobile text-primary mt-lg">${t('app_name')}</h1>
      <p class="text-body-lg text-variant mt-sm">${t('app_tagline')}</p>
    </div>
    <div id="auth-error" class="mb-lg" style="display:none;"></div>
    <div class="space-y-lg">
      <div>
        <label class="text-label-lg text-variant" style="display:block;margin-bottom:6px;">${t('auth_email')}</label>
        <input type="email" id="login-email" value="admin@nurtureflow.com"
          style="width:100%;padding:16px;background:var(--surface-container-low);border:1px solid var(--outline-variant);border-radius:var(--radius-xl);font-size:16px;color:var(--on-surface);outline:none;">
      </div>
      <div>
        <label class="text-label-lg text-variant" style="display:block;margin-bottom:6px;">${t('auth_password')}</label>
        <input type="password" id="login-password" value="admin"
          style="width:100%;padding:16px;background:var(--surface-container-low);border:1px solid var(--outline-variant);border-radius:var(--radius-xl);font-size:16px;color:var(--on-surface);outline:none;">
      </div>
      <button class="btn btn--primary btn--full mt-xl" onclick="doLogin()">
        <span class="material-symbols-outlined">login</span> ${t('auth_login')}
      </button>
      <div class="text-center mt-xl">
        <p class="text-body-md text-variant">${t('auth_no_account')}</p>
        <button class="text-primary text-semibold mt-sm" style="font-size:16px;" onclick="showRegister()">
          ${t('auth_create_account')}
        </button>
      </div>
      <div class="text-center mt-xl" style="padding-top:16px;border-top:1px solid var(--outline-variant);">
        <div style="display:flex;justify-content:center;gap:12px;">
          ${Object.entries(LANGS).map(([code, info]) => `
            <button onclick="switchLang('${code}')" style="padding:10px 18px;border-radius:var(--radius-xl);border:2px solid ${currentLang===code?'var(--primary)':'var(--outline-variant)'};background:${currentLang===code?'var(--primary-fixed)':'var(--surface-container-low)'};cursor:pointer;font-size:14px;font-family:inherit;font-weight:${currentLang===code?'700':'500'};color:${currentLang===code?'var(--primary)':'var(--on-surface)'};transition:all 0.15s;">
              ${info.flag} ${info.label}
            </button>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

function showRegister() {
  const c = document.getElementById('auth-content');
  c.innerHTML = `
    <div class="flex items-center gap-md mb-xl" style="padding-top:20px;">
      <button class="top-bar__btn" onclick="showLogin()"><span class="material-symbols-outlined">arrow_back</span></button>
      <h2 class="text-headline-sm text-primary">${t('auth_create_title')}</h2>
    </div>
    <div id="auth-error" class="mb-lg" style="display:none;"></div>

    <h3 class="text-label-lg text-primary mb-md" style="text-transform:uppercase;letter-spacing:0.08em;">
      <span class="material-symbols-outlined" style="font-size:16px;vertical-align:middle;">person</span> ${t('auth_partner1')}
    </h3>
    <div class="space-y-md mb-xl">
      <input type="text" id="reg-name1" placeholder="${t('auth_firstname')}" class="form-input">
      <input type="email" id="reg-email" placeholder="${t('auth_email')}" class="form-input">
      <div class="grid-2">
        <input type="number" id="reg-age1" placeholder="${t('auth_age')}" class="form-input">
        <select id="reg-sex1" class="form-input"><option value="Femme">${t('auth_woman')}</option><option value="Homme">${t('auth_man')}</option></select>
      </div>
    </div>

    <h3 class="text-label-lg text-secondary mb-md" style="text-transform:uppercase;letter-spacing:0.08em;">
      <span class="material-symbols-outlined" style="font-size:16px;vertical-align:middle;">person</span> ${t('auth_partner2')}
    </h3>
    <div class="space-y-md mb-xl">
      <input type="text" id="reg-name2" placeholder="${t('auth_firstname')}" class="form-input">
      <div class="grid-2">
        <input type="number" id="reg-age2" placeholder="${t('auth_age')}" class="form-input">
        <select id="reg-sex2" class="form-input"><option value="Homme">${t('auth_man')}</option><option value="Femme">${t('auth_woman')}</option></select>
      </div>
    </div>

    <h3 class="text-label-lg text-variant mb-md" style="text-transform:uppercase;letter-spacing:0.08em;">
      <span class="material-symbols-outlined" style="font-size:16px;vertical-align:middle;">family_restroom</span> ${t('auth_couple_info')}
    </h3>
    <div class="space-y-md mb-xl">
      <input type="text" id="reg-marriage" placeholder="${t('auth_marriage_placeholder')}" class="form-input">
      <input type="text" id="reg-baby" placeholder="${t('auth_baby_placeholder')}" class="form-input">
    </div>

    <h3 class="text-label-lg text-variant mb-md" style="text-transform:uppercase;letter-spacing:0.08em;">
      <span class="material-symbols-outlined" style="font-size:16px;vertical-align:middle;">lock</span> ${t('auth_security')}
    </h3>
    <div class="space-y-md mb-xl">
      <input type="password" id="reg-password" placeholder="${t('auth_password_min')}" class="form-input">
      <input type="password" id="reg-password2" placeholder="${t('auth_password_confirm')}" class="form-input">
    </div>

    <button class="btn btn--primary btn--full" onclick="doRegister()">
      <span class="material-symbols-outlined">how_to_reg</span> ${t('auth_create_btn')}
    </button>
    <div style="height:40px;"></div>
  `;
}

function showAuthError(msg) {
  const el = document.getElementById('auth-error');
  if (el) {
    el.style.display = 'block';
    el.innerHTML = `<div class="alert-banner alert-banner--danger"><span class="material-symbols-outlined">error</span><span>${msg}</span></div>`;
  }
}

async function doLogin() {
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  if (!email || !password) return showAuthError(t('err_fill_all'));
  try {
    const data = await api('/auth/login', { method: 'POST', body: { email, password } });
    state.authenticated = true;
    state.couple = data.couple;
    navigateTo('home');
  } catch (e) {
    showAuthError(e.message);
  }
}

async function doRegister() {
  const password = document.getElementById('reg-password').value;
  const password2 = document.getElementById('reg-password2').value;
  if (password !== password2) return showAuthError(t('err_pwd_mismatch'));

  const body = {
    partner1_name: document.getElementById('reg-name1').value.trim(),
    partner1_email: document.getElementById('reg-email').value.trim(),
    partner1_age: parseInt(document.getElementById('reg-age1').value) || 0,
    partner1_sex: document.getElementById('reg-sex1').value,
    partner2_name: document.getElementById('reg-name2').value.trim(),
    partner2_age: parseInt(document.getElementById('reg-age2').value) || 0,
    partner2_sex: document.getElementById('reg-sex2').value,
    marriage_duration: document.getElementById('reg-marriage').value.trim(),
    baby_age: document.getElementById('reg-baby').value.trim(),
    password
  };

  if (!body.partner1_name || !body.partner1_email || !password) return showAuthError(t('err_required'));

  try {
    const data = await api('/auth/register', { method: 'POST', body });
    state.authenticated = true;
    state.couple = data.couple;
    navigateTo('home');
  } catch (e) {
    showAuthError(e.message);
  }
}

async function doLogout() {
  closeDrawer();
  await api('/auth/logout', { method: 'POST' });
  state.authenticated = false;
  state.couple = null;
  navigateTo('auth');
  showLogin();
}

// ══════════════════════════════════════════════════════════════
//  NOUVEAU COUPLE (depuis l'intérieur de l'app)
// ══════════════════════════════════════════════════════════════
function renderNewCouple() {
  const c = document.getElementById('new-couple-content');
  c.innerHTML = `
    <div class="flex items-center gap-md mb-xl">
      <button class="top-bar__btn" onclick="navigateTo('home')"><span class="material-symbols-outlined">arrow_back</span></button>
      <div>
        <h2 class="text-headline-sm text-primary">${t('nc_title')}</h2>
        <p class="text-body-md text-variant">${t('nc_subtitle')}</p>
      </div>
    </div>

    <div id="new-couple-msg" class="mb-lg" style="display:none;"></div>

    <div class="card card--flat mb-xl"><div class="card__body">
      <h3 class="text-label-lg text-primary mb-md" style="text-transform:uppercase;letter-spacing:0.08em;">
        <span class="material-symbols-outlined" style="font-size:16px;vertical-align:middle;">person</span> ${t('nc_partner1')}
      </h3>
      <div class="space-y-md">
        <input type="text" id="nc-name1" placeholder="${t('nc_firstname')}" class="form-input">
        <input type="email" id="nc-email" placeholder="${t('nc_email')}" class="form-input">
        <div class="grid-2">
          <input type="number" id="nc-age1" placeholder="${t('nc_age')}" class="form-input">
          <select id="nc-sex1" class="form-input"><option value="Femme">${t('nc_woman')}</option><option value="Homme">${t('nc_man')}</option></select>
        </div>
      </div>
    </div></div>

    <div class="card card--flat mb-xl"><div class="card__body">
      <h3 class="text-label-lg text-secondary mb-md" style="text-transform:uppercase;letter-spacing:0.08em;">
        <span class="material-symbols-outlined" style="font-size:16px;vertical-align:middle;">person</span> ${t('nc_partner2')}
      </h3>
      <div class="space-y-md">
        <input type="text" id="nc-name2" placeholder="${t('nc_firstname')}" class="form-input">
        <div class="grid-2">
          <input type="number" id="nc-age2" placeholder="${t('nc_age')}" class="form-input">
          <select id="nc-sex2" class="form-input"><option value="Homme">${t('nc_man')}</option><option value="Femme">${t('nc_woman')}</option></select>
        </div>
      </div>
    </div></div>

    <div class="card card--flat mb-xl"><div class="card__body">
      <h3 class="text-label-lg text-variant mb-md" style="text-transform:uppercase;letter-spacing:0.08em;">
        <span class="material-symbols-outlined" style="font-size:16px;vertical-align:middle;">family_restroom</span> ${t('nc_couple_info')}
      </h3>
      <div class="space-y-md">
        <input type="text" id="nc-marriage" placeholder="${t('auth_marriage_placeholder')}" class="form-input">
        <input type="text" id="nc-baby" placeholder="${t('auth_baby_placeholder')}" class="form-input">
      </div>
    </div></div>

    <div class="card card--flat mb-xl"><div class="card__body">
      <h3 class="text-label-lg text-variant mb-md" style="text-transform:uppercase;letter-spacing:0.08em;">
        <span class="material-symbols-outlined" style="font-size:16px;vertical-align:middle;">lock</span> ${t('nc_security')}
      </h3>
      <div class="space-y-md">
        <input type="password" id="nc-password" placeholder="${t('auth_password_min')}" class="form-input">
        <input type="password" id="nc-password2" placeholder="${t('auth_password_confirm')}" class="form-input">
      </div>
    </div></div>

    <button class="btn btn--primary btn--full mb-xl" id="nc-submit-btn" onclick="createNewCouple()">
      <span class="material-symbols-outlined">group_add</span> ${t('nc_create')}
    </button>
    <div style="height:40px;"></div>
  `;
}

async function createNewCouple() {
  const password = document.getElementById('nc-password').value;
  const password2 = document.getElementById('nc-password2').value;
  const msgEl = document.getElementById('new-couple-msg');

  if (password !== password2) {
    msgEl.style.display = 'block';
    msgEl.innerHTML = `<div class="alert-banner alert-banner--danger"><span class="material-symbols-outlined">error</span><span>${t('err_pwd_mismatch')}</span></div>`;
    return;
  }

  const body = {
    partner1_name: document.getElementById('nc-name1').value.trim(),
    partner1_email: document.getElementById('nc-email').value.trim(),
    partner1_age: parseInt(document.getElementById('nc-age1').value) || 0,
    partner1_sex: document.getElementById('nc-sex1').value,
    partner2_name: document.getElementById('nc-name2').value.trim(),
    partner2_age: parseInt(document.getElementById('nc-age2').value) || 0,
    partner2_sex: document.getElementById('nc-sex2').value,
    marriage_duration: document.getElementById('nc-marriage').value.trim(),
    baby_age: document.getElementById('nc-baby').value.trim(),
    password
  };

  if (!body.partner1_name || !body.partner1_email || !password) {
    msgEl.style.display = 'block';
    msgEl.innerHTML = `<div class="alert-banner alert-banner--danger"><span class="material-symbols-outlined">error</span><span>${t('err_required')}</span></div>`;
    return;
  }

  const btn = document.getElementById('nc-submit-btn');
  btn.disabled = true;
  btn.innerHTML = `<span class="material-symbols-outlined">hourglass_top</span> ${t('nc_creating')}`;

  try {
    // Save current admin email
    const adminEmail = state.couple.partner1_email;

    // Register the new couple (this logs us in as the new couple)
    await api('/auth/register', { method: 'POST', body });

    // Re-login as admin
    await api('/auth/login', { method: 'POST', body: { email: adminEmail, password: 'admin' } });

    msgEl.style.display = 'block';
    msgEl.innerHTML = `
      <div class="alert-banner" style="background:var(--primary-container);border:1px solid var(--primary);">
        <span class="material-symbols-outlined text-primary">check_circle</span>
        <div>
          <strong class="text-primary">${t('nc_success')}</strong>
          <p class="text-body-md mt-sm"><strong>${body.partner1_name}</strong> & <strong>${body.partner2_name || '—'}</strong></p>
          <p class="text-body-md text-variant">${body.partner1_email}</p>
        </div>
      </div>
    `;
    btn.innerHTML = `<span class="material-symbols-outlined">check</span> ${t('nc_created')}`;
    btn.style.background = 'var(--primary-container)';
    btn.style.color = 'var(--on-primary-container)';

    setTimeout(() => renderNewCouple(), 3000);
  } catch (e) {
    msgEl.style.display = 'block';
    msgEl.innerHTML = `<div class="alert-banner alert-banner--danger"><span class="material-symbols-outlined">error</span><span>${e.message}</span></div>`;
    btn.disabled = false;
    btn.innerHTML = `<span class="material-symbols-outlined">group_add</span> ${t('nc_create')}`;
  }
}

// ══════════════════════════════════════════════════════════════
//  HOME / DASHBOARD
// ══════════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════
//  BABY AGE WIDGET
// ══════════════════════════════════════════════════════════════
let babyAgeInterval = null;

function renderBabyAgeWidget() {
  const widget = document.getElementById('baby-age-widget');
  if (!widget) return;
  const saved = localStorage.getItem('nf_baby_birth');

  if (!saved) {
    // Show input form
    widget.innerHTML = `
      <div class="flex items-center gap-md mb-lg">
        <span style="font-size:32px;">👶</span>
        <div>
          <h3 class="text-headline-sm" style="font-size:16px;">${t('baby_title')}</h3>
          <p class="text-body-md text-variant">${t('baby_enter_info')}</p>
        </div>
      </div>
      <div style="display:flex;gap:var(--space-md);margin-bottom:var(--space-md);">
        <div style="flex:1;">
          <label class="text-label-md text-variant mb-sm" style="display:block;">${t('baby_date')}</label>
          <input type="date" id="baby-birth-date" style="width:100%;padding:10px 14px;border:2px solid var(--outline-variant);border-radius:var(--radius-lg);font-family:inherit;font-size:14px;background:var(--surface);color:var(--on-surface);" />
        </div>
        <div style="flex:0.6;">
          <label class="text-label-md text-variant mb-sm" style="display:block;">${t('baby_time')}</label>
          <input type="time" id="baby-birth-time" style="width:100%;padding:10px 14px;border:2px solid var(--outline-variant);border-radius:var(--radius-lg);font-family:inherit;font-size:14px;background:var(--surface);color:var(--on-surface);" />
        </div>
      </div>
      <button class="btn btn--primary btn--full" onclick="saveBabyBirth()">
        <span class="material-symbols-outlined" style="font-size:18px;">save</span> ${t('baby_save')}
      </button>
    `;
  } else {
    updateBabyAge();
  }
}

function saveBabyBirth() {
  const dateVal = document.getElementById('baby-birth-date')?.value;
  const timeVal = document.getElementById('baby-birth-time')?.value || '00:00';
  if (!dateVal) return;
  const birthDateTime = dateVal + 'T' + timeVal;
  localStorage.setItem('nf_baby_birth', birthDateTime);
  renderBabyAgeWidget();
}

function updateBabyAge() {
  const widget = document.getElementById('baby-age-widget');
  if (!widget) return;
  const saved = localStorage.getItem('nf_baby_birth');
  if (!saved) return;

  const birth = new Date(saved);
  const now = new Date();
  const diffMs = now - birth;
  if (diffMs < 0) { widget.innerHTML = ''; return; }

  const totalMinutes = Math.floor(diffMs / 60000);
  const totalHours = Math.floor(diffMs / 3600000);
  const totalDays = Math.floor(diffMs / 86400000);
  const totalWeeks = Math.floor(totalDays / 7);
  const months = Math.floor(totalDays / 30.44);
  const remainDays = totalDays - Math.floor(months * 30.44);
  const hours = totalHours % 24;
  const minutes = totalMinutes % 60;

  const birthStr = birth.toLocaleDateString('ar-TN', { year: 'numeric', month: 'long', day: 'numeric' });
  const birthTime = birth.toLocaleTimeString('ar-TN', { hour: '2-digit', minute: '2-digit' });

  widget.innerHTML = `
    <div class="flex items-center justify-between mb-lg">
      <div class="flex items-center gap-md">
        <span style="font-size:32px;">👶</span>
        <div>
          <h3 class="text-headline-sm" style="font-size:16px;">${t('baby_age_title')}</h3>
          <p class="text-body-sm text-variant">🎂 ${birthStr} • ${birthTime}</p>
        </div>
      </div>
      <button onclick="localStorage.removeItem('nf_baby_birth');renderBabyAgeWidget();" style="border:none;background:none;cursor:pointer;padding:4px;">
        <span class="material-symbols-outlined text-variant" style="font-size:18px;">edit</span>
      </button>
    </div>

    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;text-align:center;">
      ${[
        { val: months, label: t('baby_months'), color: 'var(--primary)', bg: 'rgba(196,69,105,0.08)' },
        { val: remainDays, label: t('baby_days'), color: 'var(--secondary)', bg: 'rgba(142,108,136,0.08)' },
        { val: hours, label: t('baby_hours'), color: 'var(--tertiary)', bg: 'rgba(67,97,127,0.08)' },
        { val: minutes, label: t('baby_minutes'), color: '#A3D9C8', bg: 'rgba(163,217,200,0.08)' }
      ].map(item => `
        <div style="background:${item.bg};border-radius:var(--radius-xl);padding:12px 6px;">
          <div style="font-size:28px;font-weight:800;color:${item.color};line-height:1;">${item.val}</div>
          <div style="font-size:11px;font-weight:600;color:var(--on-surface-variant);margin-top:4px;">${item.label}</div>
        </div>
      `).join('')}
    </div>

    ${totalDays <= 7 ? `<div style="margin-top:12px;text-align:center;padding:8px;background:rgba(163,217,200,0.12);border-radius:var(--radius-lg);"><span style="font-size:14px;">🎉</span> <span class="text-body-sm text-semibold">${t('baby_newborn_msg')}</span></div>` : ''}
    ${totalDays > 7 && totalWeeks <= 6 ? `<div style="margin-top:12px;text-align:center;padding:8px;background:rgba(180,142,173,0.08);border-radius:var(--radius-lg);"><span class="text-body-sm text-variant">📅 ${t('baby_weeks_old', { n: totalWeeks })}</span></div>` : ''}
  `;

  // Auto refresh every minute
  if (babyAgeInterval) clearInterval(babyAgeInterval);
  babyAgeInterval = setInterval(() => updateBabyAge(), 60000);
}

async function renderHome() {
  if (!state.couple) return;

  // Update name
  const nameEl = document.getElementById('home-name');
  if (nameEl) nameEl.textContent = `${t('home_hello')}, ${state.couple.partner1_name}`;

  // Show admin link if admin
  const adminLink = document.getElementById('drawer-admin-link');
  if (adminLink) {
    adminLink.style.display = state.couple.partner1_email === 'admin@nurtureflow.com' ? 'flex' : 'none';
  }

  // Update drawer
  const drawerName = document.getElementById('drawer-name');
  if (drawerName) drawerName.textContent = state.couple.partner1_name;
  const drawerSub = document.getElementById('drawer-sub');
  if (drawerSub) drawerSub.textContent = state.couple.marriage_duration ? `${t('drawer_couple_since')} ${state.couple.marriage_duration}` : t('drawer_welcome');

  // Update current lang label
  const langLabel = document.getElementById('current-lang-label');
  if (langLabel) langLabel.textContent = LANGS[currentLang]?.label || 'Français';

  try {
    const data = await api('/dashboard');
    state.scores = data.scores;

    // Progress circle
    const circle = document.getElementById('home-progress-circle');
    const valEl = document.getElementById('home-progress-value');
    const score = data.globalScore || 0;
    if (circle) {
      const c = 2 * Math.PI * 28;
      circle.setAttribute('stroke-dasharray', c);
      circle.setAttribute('stroke-dashoffset', c - (score / 100) * c);
    }
    if (valEl) valEl.textContent = score + '%';

    // Progress text
    const progText = document.getElementById('home-progress-text');
    if (progText) progText.textContent = t('home_evals_text', { n: data.completedTypes });

    // Latest eval
    const latestEl = document.getElementById('home-latest-eval');
    if (latestEl && data.latestEval) {
      const d = new Date(data.latestEval.created_at);
      const ago = getTimeAgo(d);
      latestEl.innerHTML = `
        <div class="flex justify-between items-center mb-md">
          <h3 class="text-headline-sm" style="color:var(--on-surface);">${t('home_last_eval_title')}</h3>
          <span class="text-label-lg text-variant" style="font-style:italic;">${ago}</span>
        </div>
        <div style="display:flex;align-items:flex-start;gap:var(--space-md);padding:var(--space-lg);background:var(--surface);border-radius:var(--radius-lg);">
          <span class="material-symbols-outlined text-primary" style="margin-top:2px;">assignment_turned_in</span>
          <div>
            <p class="text-body-lg text-semibold" style="color:var(--on-surface);">${capitalize(data.latestEval.type)}</p>
            <p class="text-body-md text-variant">${t('home_score_label')} : ${data.latestEval.score}/100</p>
          </div>
        </div>
      `;
    } else if (latestEl) {
      latestEl.innerHTML = `
        <h3 class="text-headline-sm mb-md" style="color:var(--on-surface);">${t('home_first_eval_title')}</h3>
        <p class="text-body-md text-variant">${t('home_first_eval_text')}</p>
      `;
    }
  } catch (e) { console.error('Dashboard error:', e); }

  // Baby Age Widget
  renderBabyAgeWidget();
}

// ══════════════════════════════════════════════════════════════
//  QUESTIONNAIRE
// ══════════════════════════════════════════════════════════════
function startQuestionnaire(type) {
  state.currentQuestionnaireType = type;
  state.currentQuestion = 0;
  state.answers[type] = [];
  navigateTo('questionnaire');
}

function renderQuestionnaire() {
  const type = state.currentQuestionnaireType;
  if (!type) return;
  const qData = getQuestionnaires()[type];
  const qi = state.currentQuestion;
  const q = qData.questions[qi];
  const total = qData.questions.length;
  const progress = ((qi + 1) / total) * 100;
  const answered = state.answers[type] && state.answers[type][qi] !== undefined;

  const c = document.getElementById('questionnaire-content');
  c.innerHTML = `
    <div class="questionnaire-header">
      <button class="top-bar__btn" onclick="exitQuestionnaire()"><span class="material-symbols-outlined">close</span></button>
      <div class="questionnaire-header__center">
        <span class="questionnaire-header__label">${qData.title}</span>
        <span class="questionnaire-header__progress-text">Question ${qi + 1}/${total}</span>
      </div>
      <div style="width:40px"></div>
    </div>
    <div style="padding:0 var(--margin-mobile);">
      <div class="progress-bar mb-3xl" style="margin-top:16px;"><div class="progress-bar__fill" style="width:${progress}%"></div></div>
      <div class="animate-fade-in" style="min-height:160px;">
        <h1 class="text-headline-md mb-md" style="color:var(--on-surface)">${q.q}</h1>
        <p class="text-body-md text-variant">${q.hint}</p>
      </div>
      <div class="space-y-md mt-xl" id="likert-options">
        ${getLikertOptions().map(opt => {
          const sel = answered && state.answers[type][qi] === opt.value;
          return `<button class="likert-option ${sel ? 'selected' : ''}" data-value="${opt.value}">
            <span>${opt.label}</span>
            <span class="material-symbols-outlined" data-icon-radio="true">${sel ? 'check_circle' : 'radio_button_unchecked'}</span>
          </button>`;
        }).join('')}
      </div>
      <div class="flex gap-lg mt-3xl" style="padding-bottom:20px;">
        <button class="btn btn--outline" style="flex:1;${qi === 0 ? 'opacity:0.3;' : ''}" onclick="prevQuestion()" ${qi === 0 ? 'disabled' : ''}>${t('q_previous')}</button>
        <button class="btn btn--primary" style="flex:1;" id="nextQuestionBtn" onclick="nextQuestion()" ${answered ? '' : 'disabled'}>${qi === total - 1 ? t('q_finish') : t('q_next')}</button>
      </div>
    </div>
  `;

  document.querySelectorAll('#likert-options .likert-option').forEach(btn => {
    btn.addEventListener('click', function () { selectLikert(parseInt(this.dataset.value), this); });
  });
}

function selectLikert(value, element) {
  const type = state.currentQuestionnaireType;
  if (!state.answers[type]) state.answers[type] = [];
  state.answers[type][state.currentQuestion] = value;

  document.querySelectorAll('#likert-options .likert-option').forEach(opt => {
    opt.classList.remove('selected');
    const ico = opt.querySelector('[data-icon-radio]');
    if (ico) ico.textContent = 'radio_button_unchecked';
  });
  element.classList.add('selected');
  const selIco = element.querySelector('[data-icon-radio]');
  if (selIco) selIco.textContent = 'check_circle';

  const btn = document.getElementById('nextQuestionBtn');
  if (btn) { btn.disabled = false; btn.removeAttribute('disabled'); }
  element.style.transform = 'scale(0.96)';
  setTimeout(() => { element.style.transform = ''; }, 150);
}

async function nextQuestion() {
  const type = state.currentQuestionnaireType;
  const total = getQuestionnaires()[type].questions.length;
  if (state.currentQuestion < total - 1) {
    state.currentQuestion++;
    renderQuestionnaire();
  } else {
    // Calculate & save to backend
    const answers = state.answers[type];
    const maxScore = total * 5;
    const totalScore = answers.reduce((s, v) => s + (v || 0), 0);
    const score = Math.round((totalScore / maxScore) * 100);
    state.scores[type] = score;

    try {
      await api('/evaluations', { method: 'POST', body: { type, answers, score } });
    } catch (e) { console.error('Save eval error:', e); }

    navigateTo('evaluations');
  }
}

function prevQuestion() { if (state.currentQuestion > 0) { state.currentQuestion--; renderQuestionnaire(); } }
function exitQuestionnaire() { navigateTo('home'); }

// ══════════════════════════════════════════════════════════════
//  RESULTS
// ══════════════════════════════════════════════════════════════
async function renderResults() {
  try {
    const data = await api('/evaluations/scores');
    const globalScore = data.global;
    const level = data.level;

    // Gauge
    const gaugeCircle = document.getElementById('results-gauge');
    if (gaugeCircle) {
      const c = 2 * Math.PI * 80;
      gaugeCircle.style.transition = 'none';
      gaugeCircle.setAttribute('stroke-dasharray', c);
      gaugeCircle.setAttribute('stroke-dashoffset', c);
      requestAnimationFrame(() => {
        gaugeCircle.style.transition = 'stroke-dashoffset 1.5s ease';
        gaugeCircle.setAttribute('stroke-dashoffset', c - (globalScore / 100) * c);
      });
    }

    const valEl = document.getElementById('results-global-value');
    if (valEl) valEl.textContent = globalScore + '%';

    const badgeEl = document.getElementById('results-badge');
    if (badgeEl) {
      const cls = globalScore >= 75 ? 'excellent' : globalScore >= 55 ? 'bon' : globalScore >= 35 ? 'moyen' : 'faible';
      badgeEl.className = `badge badge--${cls}`;
      badgeEl.innerHTML = `<span class="material-symbols-outlined icon-filled" style="font-size:14px;">stars</span> ${level}`;
    }

    ['psychologique', 'conjugal', 'sexuel'].forEach(type => {
      const score = data.scores[type] || 0;
      const bar = document.getElementById(`bar-${type}`);
      const val = document.getElementById(`val-${type}`);
      if (bar) { bar.style.width = '0'; setTimeout(() => { bar.style.width = score + '%'; }, 300); }
      if (val) val.textContent = score + '%';
    });

    // Explanation
    const explEl = document.getElementById('results-explanation');
    if (explEl) {
      if (data.totalEvals === 0) {
        explEl.innerHTML = t('res_first_eval_long');
      } else {
        let text = t('res_transition');
        if (globalScore >= 75) text += t('res_resilience');
        else if (globalScore >= 55) text += t('res_positive');
        else text += t('res_challenges');

        const s = data.scores;
        if (s.psychologique > 0) {
          if (s.psychologique >= 70) text += t('res_excellent_psycho', { score: s.psychologique });
          else if (s.psychologique < 40) text += t('res_low_psycho', { score: s.psychologique });
        }
        if (s.conjugal > 0 && s.conjugal < 50) text += t('res_low_conjugal', { score: s.conjugal });
        if (s.sexuel > 0 && s.sexuel < 40) text += t('res_low_sexual', { score: s.sexuel });
        explEl.innerHTML = text;
      }
    }

    // Alerts
    const alertC = document.getElementById('alert-container');
    if (alertC) {
      alertC.innerHTML = '';
      const low = Object.entries(data.scores).filter(([_, v]) => v > 0 && v < 40).map(([k]) => k);
      if (low.length > 0) {
        alertC.innerHTML = `<div class="alert-banner alert-banner--warning"><span class="material-symbols-outlined">warning</span><div><strong>${t('res_orientation_title')}</strong><p class="text-body-md mt-sm">${t('res_orientation_text', { types: low.join(' & ') })}</p></div></div>`;
      }
    }
  } catch (e) { console.error('Results error:', e); }
}

// ══════════════════════════════════════════════════════════════
//  LIBRARY
// ══════════════════════════════════════════════════════════════
async function renderLibrary() {
  // Timeline toggles
  document.querySelectorAll('.timeline-toggle__btn').forEach(btn => {
    btn.addEventListener('click', async function () {
      document.querySelectorAll('.timeline-toggle__btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      const period = this.dataset.timeline;
      await loadTimelineArticles(period);
    });
  });

  // Category chips
  document.querySelectorAll('[data-category]').forEach(chip => {
    chip.addEventListener('click', function () {
      document.querySelectorAll('[data-category]').forEach(c => c.classList.remove('active'));
      this.classList.add('active');
      filterTimelineByCategory(this.dataset.category);
    });
  });

  // Load initial timeline content
  await loadTimelineArticles('0-3');
}

async function loadTimelineArticles(period) {
  try {
    const data = await api(`/timeline/${period}`);
    const articlesContainer = document.getElementById('timeline-dynamic-articles');
    if (!articlesContainer) {
      // Create dynamic articles container after static content
      const libraryScreen = document.getElementById('screen-library');
      let dynDiv = document.createElement('div');
      dynDiv.id = 'timeline-dynamic-articles';
      dynDiv.className = 'mt-xl reveal';
      // Insert before article-featured or at end
      const featuredEl = libraryScreen.querySelector('.article-featured');
      if (featuredEl) {
        featuredEl.parentNode.insertBefore(dynDiv, featuredEl);
      } else {
        libraryScreen.appendChild(dynDiv);
      }
    }

    const container = document.getElementById('timeline-dynamic-articles');
    if (!container) return;

    container.innerHTML = `
      <h3 class="text-label-lg text-primary mb-lg" style="text-transform:uppercase;letter-spacing:0.08em;">
        <span class="material-symbols-outlined" style="font-size:16px;vertical-align:middle;">schedule</span> ${t('lib_content_period')} ${period} ${t('lib_months')}
      </h3>
      <div class="space-y-md" id="timeline-articles-list">
        ${data.articles.map(a => `
          <div class="article-horizontal timeline-filterable" data-article-category="${a.category}" style="cursor:pointer;" onclick="openTimelineArticle('${a.id}','${period}')">
            <div style="width:64px;height:64px;border-radius:var(--radius-xl);background:var(--primary-fixed);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
              <span class="material-symbols-outlined text-primary" style="font-size:28px;">${a.icon}</span>
            </div>
            <div style="flex:1;">
              <h4 class="text-headline-sm" style="font-size:15px;">${a.title}</h4>
              <div class="flex items-center gap-md mt-sm">
                <span class="text-label-md text-variant">${a.category}</span>
                <span class="text-label-md text-outline flex items-center gap-sm">
                  <span class="material-symbols-outlined" style="font-size:14px;">schedule</span> ${a.readTime} min
                </span>
              </div>
            </div>
            <span class="material-symbols-outlined text-outline">chevron_right</span>
          </div>
        `).join('')}
      </div>
    `;
    setTimeout(() => initReveal(), 50);
  } catch (e) { console.error('Timeline articles error:', e); }
}

function filterTimelineByCategory(category) {
  document.querySelectorAll('.timeline-filterable').forEach(el => {
    if (category === 'tous' || el.dataset.articleCategory === category) {
      el.style.display = '';
    } else {
      el.style.display = 'none';
    }
  });
}

// ══════════════════════════════════════════════════════════════
//  STATIC ARTICLES VIEWER
// ══════════════════════════════════════════════════════════════
const staticArticles = {
  partner: {
    icon: 'group', color: 'var(--primary)',
    title: 'دور الشريك بعد الولادة',
    type: 'فيديو • 7 دقائق',
    sections: [
      { heading: 'الدعم العاطفي', text: 'يحتاج الشريك إلى فهم التغيرات النفسية والجسدية التي تمر بها الأم بعد الولادة. الاستماع بتعاطف والتواجد الدائم هما أهم أشكال الدعم.' },
      { heading: 'المشاركة في العناية بالطفل', text: 'تغيير الحفاضات، الاستحمام، تهدئة الطفل ليلاً... كلها مهام يمكن للشريك القيام بها لتخفيف العبء عن الأم.' },
      { heading: 'العناية بالعلاقة', text: 'تخصيص وقت للحوار والتواصل. ليس بالضرورة خروجات كبيرة، بل لحظات صغيرة: كوب شاي معاً، مشاهدة فيلم، أو مجرد الجلوس والحديث.' },
      { heading: 'فهم التغيرات الجنسية', text: 'التحلي بالصبر وعدم الضغط. التعافي الجسدي والنفسي يأخذ وقتاً. التواصل المفتوح حول الاحتياجات والمخاوف ضروري.' },
      { heading: 'المساعدة المنزلية', text: 'الطبخ، التنظيف، التسوق... المشاركة في الأعمال المنزلية ليست \"مساعدة\" بل مسؤولية مشتركة، خاصة في فترة ما بعد الولادة.' }
    ]
  },
  intimacy: {
    icon: 'favorite', color: 'var(--secondary)',
    title: 'استعادة الحميمية بعد الولادة',
    type: 'مقال • 8 دقائق',
    sections: [
      { heading: 'متى يمكن استئناف العلاقة؟', text: 'لا يوجد وقت محدد. يعتمد على التعافي الجسدي (توقف النزيف، التئام الجروح) والاستعداد النفسي. معظم الأطباء ينصحون بالانتظار 4-6 أسابيع.' },
      { heading: 'التغيرات الطبيعية', text: 'الجفاف المهبلي شائع خاصة أثناء الرضاعة. انخفاض الرغبة طبيعي بسبب التعب والتغيرات الهرمونية. كلها أمور مؤقتة.' },
      { heading: 'التواصل مع الشريك', text: 'الحوار المفتوح عن المخاوف والاحتياجات. لا تترددي في التعبير عما تشعرين به. الحميمية ليست فقط جنسية بل عاطفية أيضاً.' },
      { heading: 'نصائح عملية', text: 'استخدام مزلقات مائية. اختيار الوقت المناسب. البدء ببطء. عدم مقارنة الوضع بما كان قبل الولادة.' },
      { heading: 'متى تستشيرين المختص؟', text: 'إذا استمر الألم أثناء العلاقة. إذا لم تتحسن الرغبة بعد عدة أشهر. إذا شعرتِ بالقلق أو الاكتئاب.' }
    ]
  },
  breathing: {
    icon: 'play_circle', color: 'var(--secondary)',
    title: 'التنفس بعد الولادة',
    type: 'فيديو • 5 دقائق',
    sections: [
      { heading: 'أهمية التنفس', text: 'التنفس العميق يساعد على تقليل التوتر والقلق. يحسن الدورة الدموية ويساعد على تعافي عضلات البطن والحوض.' },
      { heading: 'تمرين التنفس البطني', text: 'استلقي على ظهرك. ضعي يداً على صدرك وأخرى على بطنك. تنفسي ببطء من الأنف حتى ترتفع يدك على البطن. أخرجي الهواء ببطء من الفم. كرري 10 مرات.' },
      { heading: 'تمرين 4-7-8', text: 'شهيق لمدة 4 ثوانٍ. احتفاظ بالهواء لمدة 7 ثوانٍ. زفير ببطء لمدة 8 ثوانٍ. يساعد كثيراً على النوم والاسترخاء.' },
      { heading: 'متى تمارسين؟', text: 'قبل النوم. عند الشعور بالتوتر. أثناء الرضاعة. في أي لحظة هدوء خلال اليوم.' }
    ]
  },
  sleep: {
    icon: 'psychology', color: 'var(--tertiary)',
    title: 'إدارة قلة النوم',
    type: 'دليل • 12 دقيقة',
    sections: [
      { heading: 'نامي عندما ينام طفلك', text: 'أهم نصيحة: لا تحاولي إنجاز الأعمال المنزلية أثناء نوم الطفل. الأولوية لراحتك.' },
      { heading: 'تنظيم النوم', text: 'اجعلي غرفة النوم مظلمة وهادئة. تجنبي الشاشات قبل النوم. حاولي النوم والاستيقاظ في أوقات منتظمة قدر الإمكان.' },
      { heading: 'تناوب الأدوار ليلاً', text: 'اتفقي مع الشريك على المناوبة. يمكن للشريك إعطاء الحليب المسحوب ليلاً لتستريحي.' },
      { heading: 'علامات الإرهاق الخطير', text: 'إذا شعرتِ بدوار مستمر أو نسيان شديد أو رغبة في البكاء المستمر، استشيري الطبيب. قلة النوم المزمنة تؤثر على الصحة النفسية.' },
      { heading: 'طلب المساعدة', text: 'لا عيب في طلب المساعدة من العائلة أو الأصدقاء. استقبال الأم أو الحماة لبضعة أيام قد يكون منقذاً.' }
    ]
  },
  communication: {
    icon: 'forum', color: 'var(--primary)',
    title: 'التواصل في الزوجين',
    type: 'مقال • 10 دقائق',
    sections: [
      { heading: 'الحفاظ على الرابط', text: 'وصول المولود يغير ديناميكية العلاقة. من الطبيعي أن يتراجع الاهتمام بالشريك مؤقتاً. لكن التواصل المستمر يحمي العلاقة.' },
      { heading: 'الاستماع الفعال', text: 'خصصوا وقتاً يومياً للحديث بدون تشتيت. اسمعوا بعضكم دون مقاطعة أو حكم. عبّروا عن مشاعركم بصراحة وبلطف.' },
      { heading: 'تجنب اللوم', text: 'استخدموا \"أنا أشعر...\" بدلاً من \"أنت دائماً...\". اللوم يبني جداراً بينكما. التعبير عن الاحتياجات بوضوح أفضل.' },
      { heading: 'وقت للزوجين', text: 'حتى 15 دقيقة يومياً معاً تصنع فرقاً. عشاء بسيط، مشي قصير، أو مجرد الجلوس معاً. ليس الكم بل الجودة.' },
      { heading: 'متى تطلبون مساعدة مختص؟', text: 'إذا تحولت الخلافات إلى صراخ مستمر. إذا شعرتم بالغربة. إذا لم يعد هناك تواصل. الاستشارة الزوجية ليست فشلاً بل شجاعة.' }
    ]
  }
};

function openStaticArticle(id) {
  const a = staticArticles[id];
  if (!a) return;

  // Create overlay
  const overlay = document.createElement('div');
  overlay.id = 'static-article-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:1000;background:var(--surface);overflow-y:auto;animation:fadeIn 0.3s ease;';
  overlay.innerHTML = `
    <div style="max-width:600px;margin:0 auto;padding:var(--space-xl);">
      <div class="flex items-center gap-md mb-xl">
        <button onclick="document.getElementById('static-article-overlay').remove();" style="border:none;background:var(--surface-container-high);width:40px;height:40px;border-radius:var(--radius-full);cursor:pointer;display:flex;align-items:center;justify-content:center;">
          <span class="material-symbols-outlined">arrow_back</span>
        </button>
        <div style="flex:1;">
          <span class="text-label-md text-variant">${a.type}</span>
        </div>
      </div>

      <div style="text-align:center;margin-bottom:var(--space-2xl);">
        <div style="width:72px;height:72px;border-radius:var(--radius-full);background:${a.color};display:flex;align-items:center;justify-content:center;margin:0 auto var(--space-lg);">
          <span class="material-symbols-outlined" style="font-size:36px;color:white;">${a.icon}</span>
        </div>
        <h2 class="text-headline-md">${a.title}</h2>
      </div>

      <div class="space-y-xl">
        ${a.sections.map((s, i) => `
          <div style="padding:var(--space-xl);background:var(--surface-container-low);border-radius:var(--radius-xl);border-right:4px solid ${a.color};animation:fadeIn ${0.3 + i*0.1}s ease;">
            <h3 class="text-body-lg text-semibold mb-md" style="color:${a.color};">${s.heading}</h3>
            <p class="text-body-md" style="line-height:1.8;">${s.text}</p>
          </div>
        `).join('')}
      </div>

      <div style="text-align:center;margin-top:var(--space-2xl);padding:var(--space-xl);">
        <button onclick="document.getElementById('static-article-overlay').remove();" class="btn btn--primary btn--full">
          <span class="material-symbols-outlined" style="font-size:18px;">arrow_back</span> ${t('lib_back_to_library') || 'العودة إلى المكتبة'}
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
}

// ══════════════════════════════════════════════════════════════
//  PROFILE
// ══════════════════════════════════════════════════════════════
async function renderProfile() {
  if (!state.couple) return;
  try {
    const data = await api('/profile');
    const c = data.couple;
    const s = data.stats;

    document.getElementById('profile-name').textContent = c.partner1_name + (c.partner2_name ? ' & ' + c.partner2_name : '');
    document.getElementById('profile-email').textContent = c.partner1_email;
    document.getElementById('profile-eval-count').textContent = s.evaluations;
    document.getElementById('profile-articles-count').textContent = s.articles_read;
    document.getElementById('profile-streak').textContent = s.streak;
    document.getElementById('profile-age').textContent = c.partner1_age ? c.partner1_age + ' ' + t('prof_ans') : '-';
    document.getElementById('profile-sex').textContent = c.partner1_sex || '-';
    document.getElementById('profile-marriage').textContent = c.marriage_duration || '-';
    document.getElementById('profile-baby').textContent = c.baby_age || '-';
    document.getElementById('profile-partner2').textContent = c.partner2_name ? `${c.partner2_name}, ${c.partner2_age || '?'} ${t('prof_ans')}` : t('prof_not_set');
  } catch (e) { console.error('Profile error:', e); }
}

// ══════════════════════════════════════════════════════════════
//  SAGE-FEMME
// ══════════════════════════════════════════════════════════════
function renderSageFemme() {
  const container = document.getElementById('sage-femme-content');
  if (!container) return;
  let html = `
    <!-- Module Allaitement Banner -->
    <div class="card mb-xl reveal" style="background:linear-gradient(135deg,rgba(196,69,105,0.08),rgba(163,217,200,0.12));border:1px solid rgba(196,69,105,0.15);cursor:pointer;" onclick="navigateTo('breastfeeding')">
      <div class="card__body flex items-center gap-lg">
        <div style="width:64px;height:64px;border-radius:var(--radius-full);background:var(--primary-container);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
          <span class="material-symbols-outlined text-primary" style="font-size:32px;">breastfeeding</span>
        </div>
        <div style="flex:1;">
          <h3 class="text-headline-sm" style="font-size:16px;">${t('bf_module_title')}</h3>
          <p class="text-body-md text-variant">${t('bf_module_desc')}</p>
        </div>
        <span class="material-symbols-outlined text-primary">arrow_forward</span>
      </div>
    </div>

    <!-- Module Sexualité Banner -->
    <div class="card mb-xl reveal" style="background:linear-gradient(135deg,rgba(142,108,136,0.08),rgba(212,107,80,0.10));border:1px solid rgba(142,108,136,0.15);cursor:pointer;animation-delay:0.1s;" onclick="navigateTo('sexuality')">
      <div class="card__body flex items-center gap-lg">
        <div style="width:64px;height:64px;border-radius:var(--radius-full);background:var(--secondary-container);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
          <span class="material-symbols-outlined text-secondary" style="font-size:32px;">favorite</span>
        </div>
        <div style="flex:1;">
          <h3 class="text-headline-sm" style="font-size:16px;">${t('sx_module_title')}</h3>
          <p class="text-body-md text-variant">${t('sx_module_desc')}</p>
        </div>
        <span class="material-symbols-outlined text-secondary">arrow_forward</span>
      </div>
    </div>

    <!-- Module Nouveau-né Banner -->
    <div class="card mb-xl reveal" style="background:linear-gradient(135deg,rgba(67,97,127,0.08),rgba(163,217,200,0.10));border:1px solid rgba(67,97,127,0.15);cursor:pointer;animation-delay:0.15s;" onclick="navigateTo('newborn')">
      <div class="card__body flex items-center gap-lg">
        <div style="width:64px;height:64px;border-radius:var(--radius-full);background:var(--tertiary-fixed);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
          <span class="material-symbols-outlined" style="font-size:32px;color:var(--tertiary);">child_care</span>
        </div>
        <div style="flex:1;">
          <h3 class="text-headline-sm" style="font-size:16px;">${t('nb_module_title')}</h3>
          <p class="text-body-md text-variant">${t('nb_module_desc')}</p>
        </div>
        <span class="material-symbols-outlined" style="color:var(--tertiary);">arrow_forward</span>
      </div>
    </div>

    <!-- Module Mythes et Réalités Banner -->
    <div class="card mb-xl reveal" style="background:linear-gradient(135deg,rgba(40,167,69,0.06),rgba(220,53,69,0.06));border:1px solid rgba(40,167,69,0.15);cursor:pointer;animation-delay:0.2s;" onclick="navigateTo('myths')">
      <div class="card__body flex items-center gap-lg">
        <div style="width:64px;height:64px;border-radius:var(--radius-full);background:linear-gradient(135deg,rgba(220,53,69,0.12),rgba(40,167,69,0.12));display:flex;align-items:center;justify-content:center;flex-shrink:0;">
          <span class="material-symbols-outlined" style="font-size:32px;color:#28a745;">swap_horiz</span>
        </div>
        <div style="flex:1;">
          <h3 class="text-headline-sm" style="font-size:16px;">${t('my_module_title')}</h3>
          <p class="text-body-md text-variant">${t('my_module_desc')}</p>
        </div>
        <span class="material-symbols-outlined" style="color:#28a745;">arrow_forward</span>
      </div>
    </div>

    <div class="chips-scroll mb-xl">
      <button class="chip chip--tonal active" data-sf-cat="tous" onclick="filterSF('tous',this)">${t('sf_all')}</button>
      <button class="chip chip--tonal" data-sf-cat="post-partum" onclick="filterSF('post-partum',this)">${t('sf_postpartum')}</button>
      <button class="chip chip--tonal" data-sf-cat="allaitement" onclick="filterSF('allaitement',this)">${t('sf_breastfeeding')}</button>
      <button class="chip chip--tonal" data-sf-cat="contraception" onclick="filterSF('contraception',this)">${t('sf_contraception')}</button>
      <button class="chip chip--tonal" data-sf-cat="sexualite" onclick="filterSF('sexualite',this)">${t('sf_sexuality')}</button>
      <button class="chip chip--tonal" data-sf-cat="alerte" onclick="filterSF('alerte',this)">${t('sf_alerts')}</button>
    </div>
    <div class="space-y-lg" id="sf-messages">`;
  getSageFemmeTips().forEach((tip, i) => {
    html += `<div class="chat-bubble chat-bubble--bot reveal" data-cat="${tip.cat}" style="animation-delay:${i * 0.1}s">
      <div class="flex items-center gap-md mb-md"><span class="material-symbols-outlined text-primary">${tip.icon}</span><strong class="text-body-lg text-semibold">${tip.title}</strong></div>
      <p class="text-body-md" style="line-height:1.7">${tip.text}</p></div>`;
  });
  container.innerHTML = html + '</div>';
  setTimeout(() => initReveal(), 50);
}
function filterSF(cat, btn) {
  document.querySelectorAll('[data-sf-cat]').forEach(c => c.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('#sf-messages .chat-bubble').forEach(b => {
    b.style.display = (cat === 'tous' || b.dataset.cat === cat) ? '' : 'none';
  });
}

// ══════════════════════════════════════════════════════════════
//  MODULE: ALLAITEMENT COMPLET (الرضاعة الطبيعية)
// ══════════════════════════════════════════════════════════════

const bfChapters = [
  {
    icon: 'schedule', title: 'الرضاعة في الساعة الأولى',
    content: `<div class="space-y-md" style="line-height:1.8;">
      <p>يُنصح بوضع الطفل على صدر الأم مباشرة بعد الولادة.</p>
      <p>بدء الرضاعة خلال الساعة الأولى يساعد على تحفيز إفراز الحليب.</p>
      <p>يعزز الرابط العاطفي بين الأم ورضيعها.</p>
      <p>يساهم اللبأ <strong>(Colostrum)</strong> في تقوية مناعة المولود.</p>
      <div style="background:var(--primary-container);padding:var(--space-lg);border-radius:var(--radius-xl);margin-top:var(--space-md);">
        <p style="font-weight:600;color:var(--on-primary-container);"><span class="material-symbols-outlined" style="font-size:16px;vertical-align:middle;">info</span> الرضاعة تكون حسب طلب الطفل وليس وفق ساعات محددة، لكن معدل الرضاعة يجب أن يكون كل ساعتين وعليك إيقاظ الطفل إذا كان نائماً خاصة في الأسبوع الأول ليرضع 15 دقيقة من كل ثدي.</p>
      </div>
    </div>`
  },
  {
    icon: 'self_improvement', title: 'وضعيات الرضاعة',
    content: `<div class="space-y-lg" style="line-height:1.8;">
      <div style="padding:var(--space-lg);background:rgba(196,69,105,0.06);border-radius:var(--radius-xl);border-right:4px solid var(--primary);">
        <h4 style="font-weight:700;margin-bottom:8px;">🤱 وضعية المهد</h4><p>وهي الأكثر شيوعاً</p>
      </div>
      <div style="padding:var(--space-lg);background:rgba(142,108,136,0.08);border-radius:var(--radius-xl);border-right:4px solid var(--secondary);">
        <h4 style="font-weight:700;margin-bottom:8px;">🏈 وضعية كرة القدم</h4><p>مناسبة بعد الولادة القيصرية وللأمهات اللواتي لديهن توأم</p>
      </div>
      <div style="padding:var(--space-lg);background:rgba(212,107,80,0.08);border-radius:var(--radius-xl);border-right:4px solid var(--tertiary);">
        <h4 style="font-weight:700;margin-bottom:8px;">😴 وضعية الاستلقاء</h4><p>مريحة أثناء الليل وفترات الراحة</p>
      </div>
      <div style="padding:var(--space-lg);background:rgba(163,217,200,0.15);border-radius:var(--radius-xl);border-right:4px solid #A3D9C8;">
        <h4 style="font-weight:700;margin-bottom:8px;">🌿 الوضعية البيولوجية</h4><p>استلقاء الأم مع وضع الطفل على صدرها بشكل طبيعي</p>
      </div>
    </div>`
  },
  {
    icon: 'checklist', title: 'علامات الرضاعة الفعالة',
    content: `<div style="line-height:1.8;">
      <p style="font-weight:600;margin-bottom:12px;">كيف أعرف أن طفلي يرضع جيداً؟</p>
      ${['فتح الفم بشكل واسع','دخول جزء كبير من الهالة في فم الطفل','سماع صوت البلع','ارتخاء الطفل بعد الرضاعة','زيادة الوزن تدريجياً','تبليل 6 حفاضات أو أكثر يومياً بعد اليوم الخامس'].map(s => `<div class="flex items-center gap-md mb-md"><span class="material-symbols-outlined text-primary" style="font-size:18px;">check_circle</span><span>${s}</span></div>`).join('')}
    </div>`
  },
  {
    icon: 'local_hospital', title: 'احتقان الثدي',
    content: `<div style="line-height:1.8;">
      <p>يحدث غالباً بين اليوم الثالث والخامس بعد الولادة.</p>
      <h4 style="font-weight:700;margin:16px 0 8px;">النصائح:</h4>
      ${['الرضاعة المتكررة','كمادات دافئة قبل الرضاعة','كمادات باردة بعدها','تدليك لطيف للثدي','شفط كمية بسيطة من الحليب إذا كان الثدي ممتلئاً جداً'].map(s => `<div class="flex items-center gap-md mb-sm"><span class="material-symbols-outlined" style="color:#d4a574;font-size:18px;">lightbulb</span><span>${s}</span></div>`).join('')}
      <div class="alert-banner alert-banner--warning mt-lg"><span class="material-symbols-outlined">warning</span><span>إذا ترافق الاحتقان مع حرارة أو احمرار شديد يجب استشارة مختص.</span></div>
    </div>`
  },
  {
    icon: 'healing', title: 'تشققات الحلمة',
    content: `<div style="line-height:1.8;">
      ${['التأكد من التعلق الصحيح للطفل','وضع قطرات من حليب الأم على الحلمة','ترك الحلمة تجف في الهواء','تجنب الصابون والمواد المهيجة'].map(s => `<div class="flex items-center gap-md mb-md"><span class="material-symbols-outlined text-secondary" style="font-size:18px;">check_circle</span><span>${s}</span></div>`).join('')}
    </div>`
  },
  {
    icon: 'water_drop', title: 'كيف أحافظ على إنتاج الحليب؟',
    content: `<div style="line-height:1.8;">
      ${['الرضاعة المتكررة','الرضاعة الليلية','تفريغ الثدي بانتظام','الراحة والنوم قدر الإمكان','شرب الماء بانتظام','التغذية المتوازنة'].map(s => `<div class="flex items-center gap-md mb-md"><span class="material-symbols-outlined text-primary" style="font-size:18px;">check_circle</span><span>${s}</span></div>`).join('')}
      <div style="background:var(--primary-container);padding:var(--space-lg);border-radius:var(--radius-xl);margin-top:var(--space-lg);">
        <p style="font-weight:600;color:var(--on-primary-container);"><span style="font-size:18px;">💡</span> إنتاج الحليب يعتمد على مبدأ العرض والطلب. كلما زادت الرضاعة أو شفط الحليب، زاد إنتاج الحليب.</p>
      </div>
    </div>`
  },
  {
    icon: 'restaurant', title: 'تغذية الأم المرضعة',
    content: `<div style="line-height:1.8;">
      <div class="alert-banner mb-lg" style="background:var(--primary-container);border:1px solid var(--primary);"><span class="material-symbols-outlined text-primary">info</span><span style="color:var(--on-primary-container);">لا توجد أطعمة سحرية تزيد الحليب بشكل مباشر، لكن التغذية المتوازنة والترطيب الجيد يدعمان الرضاعة الطبيعية (توصيات منظمة الصحة العالمية).</span></div>
      ${[
        { cat: '🥩 البروتينات', items: 'البيض، الدجاج، السمك، اللحم، العدس، الحمص، الفول' },
        { cat: '🥛 مشتقات الحليب', items: 'الحليب، الياغورت، الجبن' },
        { cat: '🥗 الخضر والفواكه', items: 'التفاح، البرتقال، الموز، الجزر، السبانخ، البروكلي، الطماطم' },
        { cat: '🌾 الحبوب الكاملة', items: 'الشوفان، الأرز الكامل، الخبز الكامل' },
        { cat: '🫒 الدهون الجيدة', items: 'زيت الزيتون، اللوز، الجوز، الأفوكادو' },
        { cat: '💧 الترطيب', items: 'شرب الماء حسب الشعور بالعطش، الاحتفاظ بقارورة ماء أثناء الرضاعة' }
      ].map(g => `<div style="padding:var(--space-md) var(--space-lg);background:var(--surface-container-low);border-radius:var(--radius-xl);margin-bottom:var(--space-md);">
        <strong>${g.cat}</strong><br><span class="text-variant">${g.items}</span>
      </div>`).join('')}
      <h4 style="font-weight:700;margin:16px 0 8px;">العناصر الغذائية المهمة:</h4>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-md);">
        <div style="padding:var(--space-md);background:rgba(196,69,105,0.06);border-radius:var(--radius-lg);text-align:center;"><strong>🩸 الحديد</strong><br><small>اللحوم الحمراء، العدس، السبانخ</small></div>
        <div style="padding:var(--space-md);background:rgba(142,108,136,0.08);border-radius:var(--radius-lg);text-align:center;"><strong>🦴 الكالسيوم</strong><br><small>الحليب ومشتقاته، السردين</small></div>
        <div style="padding:var(--space-md);background:rgba(163,217,200,0.12);border-radius:var(--radius-lg);text-align:center;"><strong>🐟 أوميغا 3</strong><br><small>السردين، التونة، السلمون</small></div>
        <div style="padding:var(--space-md);background:rgba(212,165,116,0.12);border-radius:var(--radius-lg);text-align:center;"><strong>☀️ فيتامين D</strong><br><small>التعرض للشمس، المكملات</small></div>
      </div>
    </div>`
  },
  {
    icon: 'eco', title: 'أطعمة يُعتقد أنها تساعد على الإرضاع',
    content: `<div style="line-height:1.8;">
      <div class="flex" style="flex-wrap:wrap;gap:var(--space-md);margin-bottom:var(--space-xl);">
        ${['الشوفان','الحلبة','الشمر','اللوز','السمسم'].map(f => `<span style="padding:8px 18px;background:rgba(212,165,116,0.15);border-radius:var(--radius-full);font-weight:600;font-size:14px;">${f}</span>`).join('')}
      </div>
      <div style="padding:var(--space-lg);background:rgba(142,108,136,0.08);border-radius:var(--radius-xl);border-right:4px solid var(--secondary);">
        <p><strong>🔬 ملاحظة علمية:</strong> لا توجد أدلة علمية قوية تثبت أن غذاءً معيناً يزيد إنتاج الحليب بشكل كبير، بينما تعتبر الرضاعة المتكررة العامل الأكثر فعالية.</p>
      </div>
    </div>`
  },
  {
    icon: 'kitchen', title: 'حفظ حليب الأم',
    content: `<div style="line-height:1.8;">
      <table style="width:100%;border-collapse:collapse;margin-bottom:var(--space-xl);">
        <tr style="background:var(--primary);color:white;"><th style="padding:12px;text-align:right;border-radius:var(--radius-lg) var(--radius-lg) 0 0;">المكان</th><th style="padding:12px;text-align:center;">المدة</th></tr>
        <tr style="background:var(--surface-container-low);"><td style="padding:12px;font-weight:600;">🌡️ درجة حرارة الغرفة</td><td style="padding:12px;text-align:center;">4 ساعات</td></tr>
        <tr><td style="padding:12px;font-weight:600;">❄️ الثلاجة</td><td style="padding:12px;text-align:center;">4 أيام</td></tr>
        <tr style="background:var(--surface-container-low);"><td style="padding:12px;font-weight:600;">🧊 المجمد</td><td style="padding:12px;text-align:center;">6 أشهر</td></tr>
      </table>
      ${['كتابة تاريخ الشفط','عدم إعادة تجميد الحليب المذاب'].map(s => `<div class="flex items-center gap-md mb-md"><span class="material-symbols-outlined text-primary" style="font-size:18px;">check_circle</span><span>${s}</span></div>`).join('')}
    </div>`
  },
  {
    icon: 'work', title: 'الرضاعة والعودة للعمل',
    content: `<div style="line-height:1.8;">
      ${['تعلم شفط الحليب قبل العودة للعمل','إنشاء مخزون من الحليب','احترام شروط التخزين','تنظيم أوقات الشفط والرضاعة'].map(s => `<div class="flex items-center gap-md mb-md"><span class="material-symbols-outlined text-primary" style="font-size:18px;">check_circle</span><span>${s}</span></div>`).join('')}
    </div>`
  }
];

const bfMyths = [
  { myth: 'يجب إعطاء الماء للرضيع قبل 6 أشهر', reality: 'حليب الأم وحده يكفي خلال الأشهر الستة الأولى' },
  { myth: 'صغر حجم الثدي يعني قلة الحليب', reality: 'حجم الثدي لا يحدد كمية الحليب المنتجة' },
  { myth: 'كل بكاء يعني أن الطفل جائع', reality: 'قد يكون البكاء بسبب التعب أو المغص أو الحاجة للاحتضان' },
  { myth: 'يجب إرضاع الطفل كل 3 ساعات فقط', reality: 'الرضاعة تكون حسب طلب الطفل' },
  { myth: 'مرض الأم يعني التوقف عن الرضاعة', reality: 'غالباً يمكن الاستمرار بالرضاعة بعد استشارة المختص' },
  { myth: 'الحليب الصناعي أفضل من حليب الأم', reality: 'حليب الأم هو الغذاء الأمثل للرضيع' },
  { myth: 'التوتر يفسد الحليب', reality: 'التوتر قد يؤثر مؤقتاً على تدفق الحليب لكنه لا يفسده' },
  { myth: 'الأم المرضعة يجب أن تأكل لشخصين', reality: 'الجودة الغذائية أهم من الكمية' },
  { myth: 'الرضاعة المتكررة تعني أن الحليب غير كافٍ', reality: 'الرضاعة المتكررة طبيعية خاصة خلال فترات النمو السريع' },
  { myth: 'يجب إيقاف الرضاعة عند ظهور الأسنان', reality: 'يمكن مواصلة الرضاعة حتى عمر سنتين أو أكثر' }
];

const bfQuizQuestions = [
  'هل يفتح طفلك فمه بشكل واسع قبل الإمساك بالثدي؟',
  'هل يدخل جزء كبير من الهالة في فم الطفل؟',
  'هل تشعرين بألم أثناء الرضاعة؟',
  'هل تسمعين صوت البلع؟',
  'هل يرضع طفلك من 8 إلى 12 مرة يومياً؟',
  'هل يهدأ بعد الرضاعة؟',
  'هل يبلل أكثر من 6 حفاضات يومياً؟',
  'هل يتبرز بشكل طبيعي؟',
  'هل يزداد وزنه بشكل طبيعي؟',
  'هل يصبح الثدي أخف بعد الرضاعة؟',
  'هل تعانين من تشققات بالحلمة؟',
  'هل يوجد احمرار أو تورم بالثدي؟',
  'هل تشعرين بالثقة أثناء الرضاعة؟',
  'هل ينام الطفل بسرعة قبل إنهاء الرضعة؟',
  'هل يبكي باستمرار بعد الرضاعة؟',
  'هل تلجئين للحليب الصناعي بسبب الشك في كمية الحليب؟',
  'هل أُعطي الطفل ماء أو أعشاب قبل 6 أشهر؟',
  'هل تتلقين دعماً من الزوج أو العائلة؟'
];
// Questions where "No" = good (reverse scored): pain, cracked nipples, redness, sleeps before finishing, cries after, formula, water before 6m
const bfReverseScored = [2, 10, 11, 13, 14, 15, 16];

let bfQuizAnswers = {};
let bfCurrentTab = 'guide';
let bfOpenChapter = -1;
let bfFlippedCards = {};

function renderBreastfeeding() {
  const container = document.getElementById('breastfeeding-content');
  if (!container) return;

  container.innerHTML = `
    <div class="flex items-center gap-md mb-xl">
      <button class="top-bar__btn" onclick="navigateTo('sage-femme')"><span class="material-symbols-outlined">arrow_back</span></button>
      <div style="flex:1;">
        <h2 class="text-headline-sm">${t('bf_title')}</h2>
        <p class="text-body-md text-variant">${t('bf_subtitle')}</p>
      </div>
      <span style="font-size:36px;">🤱</span>
    </div>

    <!-- Tabs -->
    <div style="display:flex;gap:6px;margin-bottom:var(--space-xl);background:var(--surface-container-low);border-radius:var(--radius-xl);padding:4px;overflow-x:auto;">
      ${[
        { id: 'guide', icon: 'menu_book', label: t('bf_tab_guide') },
        { id: 'myths', icon: 'swap_horiz', label: t('bf_tab_myths') },
        { id: 'quiz', icon: 'quiz', label: t('bf_tab_quiz') },
        { id: 'log', icon: 'edit_note', label: t('bf_tab_log') }
      ].map(tab => `
        <button onclick="bfCurrentTab='${tab.id}';renderBreastfeeding();" style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;padding:10px 8px;border:none;border-radius:var(--radius-lg);cursor:pointer;font-family:inherit;font-size:11px;font-weight:600;transition:all 0.2s;${bfCurrentTab===tab.id?'background:var(--primary);color:white;box-shadow:0 2px 8px rgba(196,69,105,0.3);':'background:transparent;color:var(--on-surface-variant);'}">
          <span class="material-symbols-outlined" style="font-size:20px;">${tab.icon}</span>
          ${tab.label}
        </button>
      `).join('')}
    </div>

    <div id="bf-tab-content"></div>
  `;

  const tabContent = document.getElementById('bf-tab-content');
  if (bfCurrentTab === 'guide') renderBFGuide(tabContent);
  else if (bfCurrentTab === 'myths') renderBFMyths(tabContent);
  else if (bfCurrentTab === 'quiz') renderBFQuiz(tabContent);
  else if (bfCurrentTab === 'log') renderBFLog(tabContent);

  setTimeout(() => initReveal(), 50);
}

function renderBFGuide(container) {
  container.innerHTML = `
    <div class="space-y-md">
      ${bfChapters.map((ch, i) => `
        <div class="card card--flat reveal" style="overflow:hidden;animation-delay:${i*0.05}s">
          <button onclick="bfOpenChapter=bfOpenChapter===${i}?-1:${i};renderBreastfeeding();" style="width:100%;display:flex;align-items:center;gap:var(--space-md);padding:var(--space-lg);border:none;background:transparent;cursor:pointer;font-family:inherit;text-align:right;">
            <div style="width:40px;height:40px;border-radius:var(--radius-full);background:${bfOpenChapter===i?'var(--primary)':'var(--primary-fixed)'};display:flex;align-items:center;justify-content:center;transition:all 0.3s;flex-shrink:0;">
              <span class="material-symbols-outlined" style="font-size:20px;color:${bfOpenChapter===i?'white':'var(--primary)'};">${ch.icon}</span>
            </div>
            <div style="flex:1;">
              <span class="text-label-md text-variant">${t('bf_chapter')} ${i+1}</span>
              <h4 class="text-body-lg text-semibold" style="margin-top:2px;">${ch.title}</h4>
            </div>
            <span class="material-symbols-outlined text-variant" style="transition:transform 0.3s;${bfOpenChapter===i?'transform:rotate(180deg)':''}">expand_more</span>
          </button>
          ${bfOpenChapter === i ? `<div style="padding:0 var(--space-lg) var(--space-xl);border-top:1px solid var(--outline-variant);padding-top:var(--space-lg);animation:fadeIn 0.3s ease;">${ch.content}</div>` : ''}
        </div>
      `).join('')}
    </div>
  `;
}

function renderBFMyths(container) {
  container.innerHTML = `
    <h3 class="text-headline-sm mb-md reveal">${t('bf_myths_title')}</h3>
    <p class="text-body-md text-variant mb-xl reveal">${t('bf_myths_desc')}</p>
    <div class="space-y-lg">
      ${bfMyths.map((m, i) => {
        const flipped = bfFlippedCards[i];
        return `
        <div class="reveal" style="animation-delay:${i*0.05}s;perspective:600px;">
          <div onclick="bfFlippedCards[${i}]=!bfFlippedCards[${i}];renderBreastfeeding();" style="cursor:pointer;position:relative;min-height:120px;transition:transform 0.6s;transform-style:preserve-3d;${flipped?'transform:rotateY(180deg)':''}">
            <!-- Front: Myth -->
            <div style="position:${flipped?'absolute':'relative'};inset:0;backface-visibility:hidden;padding:var(--space-xl);border-radius:var(--radius-xl);background:linear-gradient(135deg,rgba(220,53,69,0.08),rgba(220,53,69,0.03));border:2px solid rgba(220,53,69,0.2);">
              <div class="flex items-center gap-sm mb-md">
                <span style="font-size:20px;">❌</span>
                <span class="text-label-lg" style="color:var(--error);text-transform:uppercase;">${t('bf_myth')}</span>
                <span class="material-symbols-outlined text-variant" style="margin-inline-start:auto;font-size:18px;">touch_app</span>
              </div>
              <p class="text-body-lg text-semibold" style="line-height:1.6;">${m.myth}</p>
            </div>
            <!-- Back: Reality -->
            <div style="position:absolute;inset:0;backface-visibility:hidden;transform:rotateY(180deg);padding:var(--space-xl);border-radius:var(--radius-xl);background:linear-gradient(135deg,rgba(40,167,69,0.08),rgba(40,167,69,0.03));border:2px solid rgba(40,167,69,0.2);">
              <div class="flex items-center gap-sm mb-md">
                <span style="font-size:20px;">✅</span>
                <span class="text-label-lg" style="color:#28a745;text-transform:uppercase;">${t('bf_reality')}</span>
              </div>
              <p class="text-body-lg text-semibold" style="line-height:1.6;">${m.reality}</p>
            </div>
          </div>
        </div>`;
      }).join('')}
    </div>
  `;
}

function renderBFQuiz(container) {
  const answeredCount = Object.keys(bfQuizAnswers).length;
  const allAnswered = answeredCount === bfQuizQuestions.length;
  let totalScore = 0;
  if (allAnswered) {
    bfQuizQuestions.forEach((_, i) => {
      const isReverse = bfReverseScored.includes(i);
      const answered = bfQuizAnswers[i];
      if (isReverse) totalScore += (answered === 'no' ? 2 : 0);
      else totalScore += (answered === 'yes' ? 2 : 0);
    });
  }

  let resultHTML = '';
  if (allAnswered) {
    let color, emoji, label, advice;
    if (totalScore >= 30) { color = '#28a745'; emoji = '🟢'; label = t('bf_quiz_excellent'); advice = 'الرضاعة تسير بشكل جيد.'; }
    else if (totalScore >= 22) { color = '#ffc107'; emoji = '🟡'; label = t('bf_quiz_good'); advice = 'توجد بعض الصعوبات البسيطة.'; }
    else if (totalScore >= 15) { color = '#fd7e14'; emoji = '🟠'; label = t('bf_quiz_attention'); advice = 'يوصى باستشارة أخصائية توليد أو رضاعة.'; }
    else { color = '#dc3545'; emoji = '🔴'; label = t('bf_quiz_urgent'); advice = 'يُنصح بطلب تقييم مهني في أقرب وقت.'; }

    // Check for medical alerts
    const medicalAlerts = [];
    if (bfQuizAnswers[11] === 'yes') medicalAlerts.push('احمرار أو تورم بالثدي');
    if (bfQuizAnswers[14] === 'yes') medicalAlerts.push('بكاء مستمر بعد الرضاعة');
    if (bfQuizAnswers[16] === 'yes') medicalAlerts.push('إعطاء الماء أو الأعشاب قبل 6 أشهر');

    resultHTML = `
      <div class="card mb-xl reveal" style="overflow:hidden;">
        <div style="background:${color};padding:var(--space-2xl);text-align:center;color:white;">
          <span style="font-size:48px;display:block;margin-bottom:8px;">${emoji}</span>
          <h3 style="font-size:24px;font-weight:800;">${totalScore}/36</h3>
          <p style="font-size:16px;font-weight:600;margin-top:4px;">${label}</p>
        </div>
        <div class="card__body">
          <p class="text-body-lg" style="line-height:1.7;text-align:center;">${advice}</p>
        </div>
      </div>
      ${medicalAlerts.length > 0 ? `
        <div class="alert-banner alert-banner--danger mb-xl reveal">
          <span class="material-symbols-outlined">emergency</span>
          <div>
            <strong>🚨 ${t('bf_quiz_medical_alert')}</strong>
            <p class="text-body-md mt-sm">${medicalAlerts.join(' — ')}</p>
            <p class="text-body-md mt-sm" style="font-weight:600;">يُنصح بالتواصل مع أخصائية توليد أو طبيب أطفال في أقرب وقت.</p>
          </div>
        </div>
      ` : ''}
      <button class="btn btn--outline btn--full mb-xl" onclick="bfQuizAnswers={};renderBreastfeeding();">
        <span class="material-symbols-outlined">refresh</span> ${t('bf_quiz_retry')}
      </button>
    `;
  }

  container.innerHTML = `
    <h3 class="text-headline-sm mb-md reveal">${t('bf_quiz_title')}</h3>
    <p class="text-body-md text-variant mb-lg reveal">${t('bf_quiz_desc')}</p>

    ${!allAnswered ? `
      <div class="progress-bar mb-lg reveal"><div class="progress-bar__fill" style="width:${(answeredCount/bfQuizQuestions.length)*100}%"></div></div>
      <p class="text-label-md text-variant mb-xl reveal">${answeredCount}/${bfQuizQuestions.length}</p>
    ` : ''}

    ${resultHTML}

    <div class="space-y-md">
      ${bfQuizQuestions.map((q, i) => `
        <div class="card card--flat reveal" style="animation-delay:${i*0.03}s">
          <div class="card__body">
            <p class="text-body-md text-semibold mb-md">${i+1}. ${q}</p>
            <div class="flex gap-md">
              <button onclick="bfQuizAnswers[${i}]='yes';renderBreastfeeding();" style="flex:1;padding:10px;border-radius:var(--radius-xl);font-family:inherit;font-size:14px;font-weight:600;cursor:pointer;transition:all 0.2s;border:2px solid ${bfQuizAnswers[i]==='yes'?'var(--primary)':'var(--outline-variant)'};${bfQuizAnswers[i]==='yes'?'background:var(--primary);color:white;':'background:transparent;color:var(--on-surface);'}">
                ${t('bf_yes')}
              </button>
              <button onclick="bfQuizAnswers[${i}]='no';renderBreastfeeding();" style="flex:1;padding:10px;border-radius:var(--radius-xl);font-family:inherit;font-size:14px;font-weight:600;cursor:pointer;transition:all 0.2s;border:2px solid ${bfQuizAnswers[i]==='no'?'var(--primary)':'var(--outline-variant)'};${bfQuizAnswers[i]==='no'?'background:var(--primary);color:white;':'background:transparent;color:var(--on-surface);'}">
                ${t('bf_no')}
              </button>
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function getBFLogEntries() {
  try { return JSON.parse(localStorage.getItem('nf_bf_log') || '[]'); } catch { return []; }
}

function renderBFLog(container) {
  const entries = getBFLogEntries();
  const today = new Date().toISOString().split('T')[0];
  const todayEntries = entries.filter(e => e.date === today);
  const weekEntries = entries.filter(e => {
    const d = new Date(e.date);
    const now = new Date();
    return (now - d) < 7 * 86400000;
  });

  const totalFeeds = weekEntries.reduce((s, e) => s + (e.feeds || 0), 0);
  const avgFeeds = weekEntries.length > 0 ? (totalFeeds / weekEntries.length).toFixed(1) : 0;
  const totalPumped = weekEntries.reduce((s, e) => s + (e.pumped || 0), 0);

  container.innerHTML = `
    <h3 class="text-headline-sm mb-lg reveal">${t('bf_log_title')}</h3>

    <!-- Today's entry form -->
    <div class="card mb-xl reveal">
      <div class="card__body">
        <h4 class="text-label-lg text-primary mb-lg" style="text-transform:uppercase;">${t('bf_log_today')}</h4>
        <div class="space-y-md">
          <div class="slider-container">
            <label><span>${t('bf_log_feeds')}</span><span><span id="bf-feeds-val">${todayEntries[0]?.feeds||8}</span></span></label>
            <input type="range" min="0" max="16" value="${todayEntries[0]?.feeds||8}" id="bf-feeds" oninput="document.getElementById('bf-feeds-val').textContent=this.value">
          </div>
          <div class="slider-container">
            <label><span>${t('bf_log_duration')}</span><span><span id="bf-dur-val">${todayEntries[0]?.duration||15}</span> min</span></label>
            <input type="range" min="5" max="45" step="5" value="${todayEntries[0]?.duration||15}" id="bf-duration" oninput="document.getElementById('bf-dur-val').textContent=this.value">
          </div>
          <div class="slider-container">
            <label><span>${t('bf_log_pumped')}</span><span><span id="bf-pump-val">${todayEntries[0]?.pumped||0}</span> ml</span></label>
            <input type="range" min="0" max="300" step="10" value="${todayEntries[0]?.pumped||0}" id="bf-pumped" oninput="document.getElementById('bf-pump-val').textContent=this.value">
          </div>
          <p class="text-label-lg mb-sm">${t('bf_log_mood')}</p>
          <div class="mood-grid" id="bf-mood-grid">
            ${['😫','😔','😐','😊','😄'].map(m => `<button class="mood-option ${todayEntries[0]?.mood===m?'selected':''}" onclick="document.querySelectorAll('#bf-mood-grid .mood-option').forEach(b=>b.classList.remove('selected'));this.classList.add('selected');this.dataset.val='${m}';" data-val="${m}"><span class="mood-option__emoji">${m}</span></button>`).join('')}
          </div>
          <textarea id="bf-notes" class="form-input" rows="2" placeholder="${t('bf_log_notes_placeholder')}" style="resize:none;">${todayEntries[0]?.notes||''}</textarea>
          <button class="btn btn--primary btn--full" onclick="saveBFLog()">
            <span class="material-symbols-outlined">save</span> ${t('bf_log_save')}
          </button>
        </div>
      </div>
    </div>

    <!-- Weekly stats -->
    <div class="card card--flat mb-xl reveal">
      <div class="card__body">
        <h4 class="text-label-lg text-primary mb-lg" style="text-transform:uppercase;">${t('bf_log_weekly')}</h4>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:var(--space-md);text-align:center;">
          <div style="padding:var(--space-lg);background:var(--surface-container-low);border-radius:var(--radius-xl);">
            <div class="text-headline-md text-primary">${avgFeeds}</div>
            <p class="text-label-md text-variant">${t('bf_log_avg_feeds')}</p>
          </div>
          <div style="padding:var(--space-lg);background:var(--surface-container-low);border-radius:var(--radius-xl);">
            <div class="text-headline-md text-secondary">${weekEntries.length}</div>
            <p class="text-label-md text-variant">${t('bf_log_days')}</p>
          </div>
          <div style="padding:var(--space-lg);background:var(--surface-container-low);border-radius:var(--radius-xl);">
            <div class="text-headline-md text-tertiary">${totalPumped}</div>
            <p class="text-label-md text-variant">ml ${t('bf_log_pumped_total')}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- History -->
    ${entries.length > 0 ? `
      <h4 class="text-label-lg text-primary mb-md reveal" style="text-transform:uppercase;">${t('bf_log_history')}</h4>
      <div class="space-y-md">
        ${entries.slice(0, 7).map(e => `
          <div class="daily-entry reveal">
            <span style="font-size:24px;">${e.mood || '😊'}</span>
            <div style="flex:1;">
              <div class="flex justify-between text-label-md">
                <span class="text-primary">${e.feeds || 0} ${t('bf_log_feeds_short')}</span>
                <span class="text-variant">${e.duration || 0} min</span>
                ${e.pumped ? `<span class="text-tertiary">${e.pumped} ml</span>` : ''}
              </div>
              ${e.notes ? `<p class="text-body-md text-variant mt-sm" style="font-style:italic;">${e.notes}</p>` : ''}
            </div>
            <span class="text-label-md text-variant">${e.date}</span>
          </div>
        `).join('')}
      </div>
    ` : `<p class="text-body-md text-variant text-center reveal">${t('bf_log_empty')}</p>`}
  `;
}

function saveBFLog() {
  const feeds = parseInt(document.getElementById('bf-feeds')?.value || 8);
  const duration = parseInt(document.getElementById('bf-duration')?.value || 15);
  const pumped = parseInt(document.getElementById('bf-pumped')?.value || 0);
  const moodBtn = document.querySelector('#bf-mood-grid .mood-option.selected');
  const mood = moodBtn?.dataset?.val || '😊';
  const notes = document.getElementById('bf-notes')?.value?.trim() || '';
  const today = new Date().toISOString().split('T')[0];

  let entries = getBFLogEntries();
  const existingIdx = entries.findIndex(e => e.date === today);
  const entry = { date: today, feeds, duration, pumped, mood, notes };
  if (existingIdx >= 0) entries[existingIdx] = entry;
  else entries.unshift(entry);

  localStorage.setItem('nf_bf_log', JSON.stringify(entries));

  const btn = document.querySelector('#bf-tab-content .btn--primary');
  if (btn) {
    btn.innerHTML = `<span class="material-symbols-outlined">check</span> ${t('bf_log_saved')}`;
    btn.style.background = 'var(--primary-container)';
    btn.style.color = 'var(--on-primary-container)';
    setTimeout(() => renderBreastfeeding(), 1500);
  }
}

// ══════════════════════════════════════════════════════════════
//  MODULE: SEXUALITÉ POST-PARTUM (الحياة الجنسية بعد الولادة)
// ══════════════════════════════════════════════════════════════

const sxChapters = [
  {
    icon: 'schedule', title: 'استئناف العلاقة الجنسية', color: 'var(--primary)',
    content: `<div class="space-y-md" style="line-height:1.8;">
      <p>لا يوجد موعد موحّد لاستئناف العلاقة الجنسية بعد الولادة.</p>
      <p>يعتمد ذلك على التعافي الجسدي والنفسي للأم.</p>
      ${['يُنصح بالانتظار حتى توقف نزيف النفاس','التئام الجروح في حال وجود تمزق أو Épisiotomie','احترام راحة الأم الجسدية والنفسية','التواصل مع الشريك ضروري خلال هذه المرحلة'].map(s => `<div class="flex items-center gap-md mb-sm"><span class="material-symbols-outlined text-primary" style="font-size:18px;">check_circle</span><span>${s}</span></div>`).join('')}
    </div>`
  },
  {
    icon: 'water_drop', title: 'الجفاف المهبلي', color: 'var(--secondary)',
    content: `<div class="space-y-md" style="line-height:1.8;">
      <p>شائع خاصة أثناء الرضاعة الطبيعية بسبب انخفاض هرمون الإستروجين.</p>
      <p>يمكن استعمال مزلقات مائية <strong>(Lubrifiants à base d'eau)</strong>.</p>
      <p>غالباً ما يتحسن تدريجياً مع الوقت.</p>
    </div>`
  },
  {
    icon: 'healing', title: 'الألم أثناء العلاقة', color: 'var(--error)',
    content: `<div class="space-y-md" style="line-height:1.8;">
      <p>قد يظهر خلال الأسابيع أو الأشهر الأولى بعد الولادة.</p>
      <p style="font-weight:600;color:var(--error);">يجب التوقف إذا كان الألم شديداً.</p>
      <p>يُنصح باستشارة مختص إذا استمر الألم أو ازداد.</p>
    </div>`
  },
  {
    icon: 'bedtime', title: 'التعب والرغبة الجنسية', color: 'var(--tertiary)',
    content: `<div class="space-y-md" style="line-height:1.8;">
      <p>انخفاض الرغبة الجنسية أمر شائع بعد الولادة.</p>
      ${['الإرهاق وقلة النوم','التغيرات الهرمونية','التكيف مع دور الأمومة'].map(s => `<div class="flex items-center gap-md mb-sm"><span class="material-symbols-outlined" style="font-size:16px;color:var(--tertiary);">arrow_right</span><span>${s}</span></div>`).join('')}
      <div style="background:var(--primary-container);padding:var(--space-lg);border-radius:var(--radius-xl);margin-top:var(--space-md);">
        <p style="font-weight:600;color:var(--on-primary-container);"><span style="font-size:18px;">💡</span> تعود الرغبة تدريجياً لدى أغلب النساء.</p>
      </div>
    </div>`
  },
  {
    icon: 'forum', title: 'التواصل بين الزوجين', color: '#A3D9C8',
    content: `<div class="space-y-md" style="line-height:1.8;">
      <p>الحوار الصريح حول المشاعر والاحتياجات يساعد على التكيف مع المرحلة الجديدة.</p>
      <div style="padding:var(--space-lg);background:rgba(163,217,200,0.15);border-radius:var(--radius-xl);border-right:4px solid #A3D9C8;">
        <p style="font-weight:600;">💕 الحميمية لا تقتصر فقط على العلاقة الجنسية، بل تشمل الدعم العاطفي أيضاً.</p>
      </div>
    </div>`
  },
  {
    icon: 'medical_services', title: 'العناية بشق العجان', color: 'var(--primary)',
    content: `<div class="space-y-lg" style="line-height:1.8;">
      <div>
        <h4 style="font-weight:700;margin-bottom:12px;display:flex;align-items:center;gap:8px;"><span style="font-size:18px;">🧼</span> كيف يتم تنظيف الجرح؟</h4>
        ${['غسل اليدين قبل وبعد العناية','تنظيف المنطقة يومياً بالماء الفاتر وصابون لطيف غير معطر','الشطف جيداً ثم التجفيف بلطف دون فرك','يُفضل التجفيف بالتربيت أو ترك المنطقة تجف في الهواء','تغيير الفوط الصحية بانتظام','ارتداء ملابس داخلية قطنية ومريحة','شرب الماء وتناول ألياف لتجنب الإمساك'].map(s => `<div class="flex items-center gap-md mb-sm"><span class="material-symbols-outlined text-primary" style="font-size:16px;">check_circle</span><span>${s}</span></div>`).join('')}
      </div>
      <div>
        <h4 style="font-weight:700;margin-bottom:12px;display:flex;align-items:center;gap:8px;"><span style="font-size:18px;">💊</span> لتخفيف الألم</h4>
        ${['كمادات باردة خلال أول 24 ساعة إذا أوصى المختص','الجلوس على وسادة مريحة','مسكنات موصوفة طبياً'].map(s => `<div class="flex items-center gap-md mb-sm"><span class="material-symbols-outlined" style="font-size:16px;color:#d4a574;">lightbulb</span><span>${s}</span></div>`).join('')}
      </div>
      <div>
        <h4 style="font-weight:700;margin-bottom:12px;color:var(--error);display:flex;align-items:center;gap:8px;"><span style="font-size:18px;">❌</span> ما يجب تجنبه</h4>
        ${['المطهرات أو الكريمات بدون وصفة طبية','فرك الجرح','الملابس الضيقة'].map(s => `<div class="flex items-center gap-md mb-sm"><span class="material-symbols-outlined" style="font-size:16px;color:var(--error);">block</span><span>${s}</span></div>`).join('')}
      </div>
      <div class="alert-banner alert-banner--danger">
        <span class="material-symbols-outlined">emergency</span>
        <div>
          <strong>🚨 علامات الخطر — استشيري الطبيب إذا ظهر:</strong>
          ${['احمرار متزايد أو تورم شديد','ألم يزداد مع الوقت','إفرازات ذات رائحة كريهة أو قيح','حرارة أكثر من 38 °C','انفتاح الجرح أو نزيف غير طبيعي'].map(s => `<div class="flex items-center gap-sm mt-sm"><span style="color:var(--error);font-size:14px;">⚠️</span><span>${s}</span></div>`).join('')}
        </div>
      </div>
    </div>`
  }
];

const sxMyths = [
  { myth: 'يجب استئناف العلاقة بعد 40 يوماً بالضبط', reality: 'لا يوجد وقت إلزامي ويختلف حسب كل امرأة' },
  { myth: 'الرضاعة الطبيعية تمنع الحمل %100', reality: 'تقلل الحمل لكنها ليست وسيلة مضمونة' },
  { myth: 'انخفاض الرغبة الجنسية مشكلة دائمة', reality: 'طبيعي ومؤقت بعد الولادة' },
  { myth: 'الألم أثناء العلاقة يجب تحمله', reality: 'الألم المستمر يحتاج استشارة' },
  { myth: 'الجفاف المهبلي مرض', reality: 'غالباً نتيجة تغيرات هرمونية بعد الولادة' }
];

let sxCurrentTab = 'guide';
let sxOpenChapter = -1;
let sxFlippedCards = {};

function renderSexuality() {
  const container = document.getElementById('sexuality-content');
  if (!container) return;

  container.innerHTML = `
    <div class="flex items-center gap-md mb-xl">
      <button class="top-bar__btn" onclick="navigateTo('sage-femme')"><span class="material-symbols-outlined">arrow_back</span></button>
      <div style="flex:1;">
        <h2 class="text-headline-sm">${t('sx_title')}</h2>
        <p class="text-body-md text-variant">${t('sx_subtitle')}</p>
      </div>
      <span style="font-size:36px;">❤️</span>
    </div>

    <!-- Tabs -->
    <div style="display:flex;gap:6px;margin-bottom:var(--space-xl);background:var(--surface-container-low);border-radius:var(--radius-xl);padding:4px;overflow-x:auto;">
      ${[
        { id: 'guide', icon: 'menu_book', label: t('sx_tab_guide') },
        { id: 'myths', icon: 'swap_horiz', label: t('sx_tab_myths') },
        { id: 'consult', icon: 'emergency', label: t('sx_tab_consult') }
      ].map(tab => `
        <button onclick="sxCurrentTab='${tab.id}';renderSexuality();" style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;padding:10px 8px;border:none;border-radius:var(--radius-lg);cursor:pointer;font-family:inherit;font-size:11px;font-weight:600;transition:all 0.2s;${sxCurrentTab===tab.id?'background:var(--secondary);color:white;box-shadow:0 2px 8px rgba(142,108,136,0.3);':'background:transparent;color:var(--on-surface-variant);'}">
          <span class="material-symbols-outlined" style="font-size:20px;">${tab.icon}</span>
          ${tab.label}
        </button>
      `).join('')}
    </div>

    <div id="sx-tab-content"></div>
  `;

  const tabContent = document.getElementById('sx-tab-content');
  if (sxCurrentTab === 'guide') renderSXGuide(tabContent);
  else if (sxCurrentTab === 'myths') renderSXMyths(tabContent);
  else if (sxCurrentTab === 'consult') renderSXConsult(tabContent);

  setTimeout(() => initReveal(), 50);
}

function renderSXGuide(container) {
  container.innerHTML = `
    <div class="space-y-md">
      ${sxChapters.map((ch, i) => `
        <div class="card card--flat reveal" style="overflow:hidden;animation-delay:${i*0.05}s">
          <button onclick="sxOpenChapter=sxOpenChapter===${i}?-1:${i};renderSexuality();" style="width:100%;display:flex;align-items:center;gap:var(--space-md);padding:var(--space-lg);border:none;background:transparent;cursor:pointer;font-family:inherit;text-align:right;">
            <div style="width:40px;height:40px;border-radius:var(--radius-full);background:${sxOpenChapter===i?ch.color:'var(--surface-container-high)'};display:flex;align-items:center;justify-content:center;transition:all 0.3s;flex-shrink:0;">
              <span class="material-symbols-outlined" style="font-size:20px;color:${sxOpenChapter===i?'white':'var(--on-surface-variant)'};">${ch.icon}</span>
            </div>
            <h4 class="text-body-lg text-semibold" style="flex:1;">${ch.title}</h4>
            <span class="material-symbols-outlined text-variant" style="transition:transform 0.3s;${sxOpenChapter===i?'transform:rotate(180deg)':''}">expand_more</span>
          </button>
          ${sxOpenChapter === i ? `<div style="padding:0 var(--space-lg) var(--space-xl);border-top:1px solid var(--outline-variant);padding-top:var(--space-lg);animation:fadeIn 0.3s ease;">${ch.content}</div>` : ''}
        </div>
      `).join('')}
    </div>
  `;
}

function renderSXMyths(container) {
  container.innerHTML = `
    <h3 class="text-headline-sm mb-md reveal">${t('sx_myths_title')}</h3>
    <p class="text-body-md text-variant mb-xl reveal">${t('sx_myths_desc')}</p>
    <div class="space-y-lg">
      ${sxMyths.map((m, i) => {
        const flipped = sxFlippedCards[i];
        return `
        <div class="reveal" style="animation-delay:${i*0.05}s;perspective:600px;">
          <div onclick="sxFlippedCards[${i}]=!sxFlippedCards[${i}];renderSexuality();" style="cursor:pointer;position:relative;min-height:120px;transition:transform 0.6s;transform-style:preserve-3d;${flipped?'transform:rotateY(180deg)':''}">
            <div style="position:${flipped?'absolute':'relative'};inset:0;backface-visibility:hidden;padding:var(--space-xl);border-radius:var(--radius-xl);background:linear-gradient(135deg,rgba(220,53,69,0.08),rgba(220,53,69,0.03));border:2px solid rgba(220,53,69,0.2);">
              <div class="flex items-center gap-sm mb-md">
                <span style="font-size:20px;">❌</span>
                <span class="text-label-lg" style="color:var(--error);text-transform:uppercase;">${t('bf_myth')}</span>
                <span class="material-symbols-outlined text-variant" style="margin-inline-start:auto;font-size:18px;">touch_app</span>
              </div>
              <p class="text-body-lg text-semibold" style="line-height:1.6;">${m.myth}</p>
            </div>
            <div style="position:absolute;inset:0;backface-visibility:hidden;transform:rotateY(180deg);padding:var(--space-xl);border-radius:var(--radius-xl);background:linear-gradient(135deg,rgba(40,167,69,0.08),rgba(40,167,69,0.03));border:2px solid rgba(40,167,69,0.2);">
              <div class="flex items-center gap-sm mb-md">
                <span style="font-size:20px;">✅</span>
                <span class="text-label-lg" style="color:#28a745;text-transform:uppercase;">${t('bf_reality')}</span>
              </div>
              <p class="text-body-lg text-semibold" style="line-height:1.6;">${m.reality}</p>
            </div>
          </div>
        </div>`;
      }).join('')}
    </div>
  `;
}

function renderSXConsult(container) {
  container.innerHTML = `
    <div class="card reveal" style="overflow:hidden;">
      <div style="background:linear-gradient(135deg,var(--error),#8e2020);padding:var(--space-2xl);text-align:center;color:white;">
        <span class="material-symbols-outlined" style="font-size:48px;margin-bottom:8px;">emergency</span>
        <h3 class="text-headline-sm">${t('sx_when_consult')}</h3>
      </div>
      <div class="card__body">
        <p class="text-body-md text-variant mb-lg">${t('sx_consult_intro')}</p>
        ${['ألم شديد أو مستمر أثناء العلاقة','نزيف غير طبيعي بعد العلاقة','جفاف شديد لا يتحسن','فقدان مستمر للرغبة مع تأثير نفسي واضح','أعراض اكتئاب ما بعد الولادة'].map(s => `
          <div class="flex items-center gap-md mb-lg" style="padding:var(--space-md) var(--space-lg);background:rgba(186,26,26,0.04);border-radius:var(--radius-xl);border-right:3px solid var(--error);">
            <span class="material-symbols-outlined" style="color:var(--error);font-size:20px;">warning</span>
            <span class="text-body-md text-semibold">${s}</span>
          </div>
        `).join('')}
        <div style="background:var(--primary-container);padding:var(--space-xl);border-radius:var(--radius-xl);margin-top:var(--space-xl);text-align:center;">
          <span class="material-symbols-outlined text-primary" style="font-size:32px;">support_agent</span>
          <p class="text-body-lg text-semibold mt-md" style="color:var(--on-primary-container);">${t('sx_consult_msg')}</p>
        </div>
      </div>
    </div>
  `;
}

// ══════════════════════════════════════════════════════════════
//  MODULE: NOUVEAU-NÉ (المولود الجديد)
// ══════════════════════════════════════════════════════════════

const nbChapters = [
  {
    icon: 'vaccines', title: 'العناية بالحبل السري', color: 'var(--primary)',
    content: `<div class="space-y-md" style="line-height:1.8;">
      ${['الحفاظ على نظافة الحبل السري وجفافه','تنظيفه بالكحول الطبي أو الماء حسب توصية المختص','طي الحفاض أسفل الحبل السري','عدم شد الحبل أو محاولة إزالته','يسقط عادة خلال 7 إلى 21 يوماً'].map(s => `<div class="flex items-center gap-md mb-sm"><span class="material-symbols-outlined text-primary" style="font-size:16px;">check_circle</span><span>${s}</span></div>`).join('')}
      <div class="alert-banner alert-banner--warning mt-lg">
        <span class="material-symbols-outlined">warning</span>
        <div><strong>استشيري الطبيب إذا ظهر:</strong> احمرار حول السرة، إفرازات ذات رائحة كريهة، نزيف، أو تأخر السقوط أكثر من 3 أسابيع.</div>
      </div>
    </div>`
  },
  {
    icon: 'bathtub', title: 'حمام المولود', color: 'var(--secondary)',
    content: `<div class="space-y-md" style="line-height:1.8;">
      <p style="font-weight:600;">🛁 متى وكيف؟</p>
      ${['أول حمام بعد سقوط الحبل السري (أو حسب توصية المختص)','استخدام ماء دافئ (37°C تقريباً)','صابون لطيف مخصص للأطفال','مدة الحمام 5 إلى 10 دقائق','تجفيف الطفل فوراً بعد الحمام','الحمام 2-3 مرات أسبوعياً كافٍ'].map(s => `<div class="flex items-center gap-md mb-sm"><span class="material-symbols-outlined" style="font-size:16px;color:var(--secondary);">check_circle</span><span>${s}</span></div>`).join('')}
    </div>`
  },
  {
    icon: 'wb_sunny', title: 'اليرقان (الصفراء)', color: '#daa520',
    content: `<div class="space-y-md" style="line-height:1.8;">
      <p>اصفرار الجلد والعينين شائع في الأيام الأولى.</p>
      <p style="font-weight:600;">الأنواع:</p>
      <div style="padding:var(--space-md);background:rgba(218,165,32,0.08);border-radius:var(--radius-lg);border-right:3px solid #daa520;margin-bottom:8px;">
        <strong>يرقان فسيولوجي:</strong> يظهر بعد 48 ساعة، طبيعي ويختفي خلال أسبوعين.
      </div>
      <div style="padding:var(--space-md);background:rgba(186,26,26,0.05);border-radius:var(--radius-lg);border-right:3px solid var(--error);margin-bottom:8px;">
        <strong>يرقان مرضي:</strong> يظهر خلال أول 24 ساعة أو يستمر أكثر من 14 يوماً — يتطلب متابعة طبية.
      </div>
      <p><strong>💡</strong> الرضاعة المتكررة تساعد على تقليل اليرقان.</p>
    </div>`
  },
  {
    icon: 'bedtime', title: 'نوم المولود', color: 'var(--tertiary)',
    content: `<div class="space-y-md" style="line-height:1.8;">
      <p>ينام المولود 16 إلى 18 ساعة يومياً في فترات متقطعة.</p>
      <p style="font-weight:600;">قواعد النوم الآمن:</p>
      ${['وضع الطفل على ظهره دائماً','استخدام سطح نوم صلب ومسطح','عدم وضع وسائد أو ألعاب في السرير','الحفاظ على درجة حرارة الغرفة مناسبة (18-20°C)','عدم تغطية رأس الطفل أثناء النوم','إبقاء سرير الطفل في غرفة الوالدين خلال الأشهر الأولى'].map(s => `<div class="flex items-center gap-md mb-sm"><span class="material-symbols-outlined" style="font-size:16px;color:var(--tertiary);">check_circle</span><span>${s}</span></div>`).join('')}
    </div>`
  },
  {
    icon: 'thermostat', title: 'درجة حرارة المولود', color: 'var(--primary)',
    content: `<div class="space-y-md" style="line-height:1.8;">
      <p>درجة الحرارة الطبيعية: <strong>36.5°C - 37.5°C</strong></p>
      ${['قياس الحرارة من المستقيم أدق عند الرضع','ارتداء طبقة واحدة أكثر مما يرتديه البالغ','تجنب التعرض المباشر للشمس أو التيارات الهوائية'].map(s => `<div class="flex items-center gap-md mb-sm"><span class="material-symbols-outlined text-primary" style="font-size:16px;">check_circle</span><span>${s}</span></div>`).join('')}
      <div class="alert-banner alert-banner--danger mt-md">
        <span class="material-symbols-outlined">emergency</span>
        <div><strong>استشيري الطبيب فوراً إذا:</strong> حرارة > 38°C أو < 36°C.</div>
      </div>
    </div>`
  },
  {
    icon: 'baby_changing_station', title: 'تغيير الحفاض والعناية بالبشرة', color: '#A3D9C8',
    content: `<div class="space-y-md" style="line-height:1.8;">
      ${['تغيير الحفاض فور اتساخه','تنظيف المنطقة بالماء الدافئ وقطن ناعم','التجفيف جيداً قبل وضع حفاض جديد','استخدام كريم واقي عند الحاجة','المسح من الأمام إلى الخلف (خاصة للبنات)','تجنب المناديل المعطرة'].map(s => `<div class="flex items-center gap-md mb-sm"><span class="material-symbols-outlined" style="font-size:16px;color:#A3D9C8;">check_circle</span><span>${s}</span></div>`).join('')}
    </div>`
  },
  {
    icon: 'vaccines', title: 'التطعيمات', color: 'var(--primary)',
    content: `<div class="space-y-md" style="line-height:1.8;">
      <p style="font-weight:600;">التطعيمات الأساسية في تونس:</p>
      <table style="width:100%;border-collapse:collapse;font-size:13px;margin:12px 0;">
        <tr style="background:var(--primary-container);"><th style="padding:10px;text-align:right;border-radius:8px 0 0 0;">العمر</th><th style="padding:10px;text-align:right;border-radius:0 8px 0 0;">التطعيم</th></tr>
        <tr style="background:var(--surface-container-low);"><td style="padding:10px;">عند الولادة</td><td style="padding:10px;">BCG + التهاب الكبد B</td></tr>
        <tr><td style="padding:10px;">شهران</td><td style="padding:10px;">DTC + شلل الأطفال + التهاب الكبد B</td></tr>
        <tr style="background:var(--surface-container-low);"><td style="padding:10px;">3 أشهر</td><td style="padding:10px;">DTC + شلل الأطفال</td></tr>
        <tr><td style="padding:10px;">6 أشهر</td><td style="padding:10px;">DTC + شلل الأطفال + التهاب الكبد B</td></tr>
        <tr style="background:var(--surface-container-low);"><td style="padding:10px;">9 أشهر</td><td style="padding:10px;">الحصبة</td></tr>
      </table>
      <p><strong>💡</strong> احتفظي بدفتر التطعيمات وراجعي المواعيد مع الطبيب.</p>
    </div>`
  },
  {
    icon: 'emergency', title: 'علامات الخطر عند المولود', color: 'var(--error)',
    content: `<div class="space-y-md" style="line-height:1.8;">
      <p style="font-weight:600;color:var(--error);">🚨 اذهبي فوراً إلى الطبيب إذا ظهر أي مما يلي:</p>
      ${['حرارة أكثر من 38°C أو أقل من 36°C','رفض الرضاعة لأكثر من رضعتين متتاليتين','صعوبة في التنفس أو تنفس سريع','ازرقاق الشفاه أو الأطراف','خمول شديد أو عدم الاستيقاظ','تشنجات','بكاء مستمر لا يتوقف','إسهال شديد أو قيء متكرر','انتفاخ البطن','إفرازات أو نزيف من السرة'].map(s => `<div class="flex items-center gap-md mb-md" style="padding:8px 12px;background:rgba(186,26,26,0.04);border-radius:var(--radius-lg);border-right:3px solid var(--error);">
          <span class="material-symbols-outlined" style="color:var(--error);font-size:18px;">warning</span><span class="text-semibold">${s}</span></div>`).join('')}
    </div>`
  }
];

let nbOpenChapter = -1;
let nbCurrentTab = 'guide';
let nbFlippedCards = {};

const nbMyths = [
  { myth: 'يجب إعطاء الماء للرضيع قبل 6 أشهر', reality: 'حليب الأم وحده يكفي خلال الأشهر الستة الأولى' },
  { myth: 'صغر حجم الثدي يعني قلة الحليب', reality: 'حجم الثدي لا يحدد كمية الحليب المنتجة' },
  { myth: 'كل بكاء يعني أن الطفل جائع', reality: 'قد يكون البكاء بسبب التعب أو المغص أو الحاجة للاحتضان' },
  { myth: 'يجب إرضاع الطفل كل 3 ساعات فقط', reality: 'الرضاعة تكون حسب طلب الطفل' },
  { myth: 'مرض الأم يعني التوقف عن الرضاعة', reality: 'غالباً يمكن الاستمرار بالرضاعة بعد استشارة المختص' },
  { myth: 'الحليب الصناعي أفضل من حليب الأم', reality: 'حليب الأم هو الغذاء الأمثل للرضيع' },
  { myth: 'التوتر يفسد الحليب', reality: 'التوتر قد يؤثر مؤقتاً على تدفق الحليب لكنه لا يفسده' },
  { myth: 'الأم المرضعة يجب أن تأكل لشخصين', reality: 'الجودة الغذائية أهم من الكمية' },
  { myth: 'الرضاعة المتكررة تعني أن الحليب غير كافٍ', reality: 'الرضاعة المتكررة طبيعية خاصة خلال فترات النمو السريع' },
  { myth: 'يجب إيقاف الرضاعة عند ظهور الأسنان', reality: 'يمكن مواصلة الرضاعة حتى عمر سنتين أو أكثر' }
];

function renderNewborn() {
  const container = document.getElementById('newborn-content');
  if (!container) return;
  let html = `
    <div class="flex items-center gap-md mb-xl">
      <button class="top-bar__btn" onclick="navigateTo('sage-femme')"><span class="material-symbols-outlined">arrow_back</span></button>
      <div style="flex:1;">
        <h2 class="text-headline-sm">${t('nb_title')}</h2>
        <p class="text-body-md text-variant">${t('nb_subtitle')}</p>
      </div>
      <span style="font-size:36px;">👶</span>
    </div>
    <div style="display:flex;gap:6px;margin-bottom:var(--space-xl);background:var(--surface-container-low);border-radius:var(--radius-xl);padding:4px;">
      <button onclick="nbCurrentTab='guide';renderNewborn();" style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;padding:10px 8px;border:none;border-radius:var(--radius-lg);cursor:pointer;font-family:inherit;font-size:12px;font-weight:600;transition:all 0.2s;${nbCurrentTab==='guide'?'background:var(--tertiary);color:white;box-shadow:0 2px 8px rgba(67,97,127,0.3);':'background:transparent;color:var(--on-surface-variant);'}">
        <span class="material-symbols-outlined" style="font-size:20px;">menu_book</span>${t('nb_tab_guide')}
      </button>
      <button onclick="nbCurrentTab='myths';renderNewborn();" style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;padding:10px 8px;border:none;border-radius:var(--radius-lg);cursor:pointer;font-family:inherit;font-size:12px;font-weight:600;transition:all 0.2s;${nbCurrentTab==='myths'?'background:var(--tertiary);color:white;box-shadow:0 2px 8px rgba(67,97,127,0.3);':'background:transparent;color:var(--on-surface-variant);'}">
        <span class="material-symbols-outlined" style="font-size:20px;">swap_horiz</span>${t('nb_tab_myths')}
      </button>
    </div>`;
  if (nbCurrentTab === 'guide') {
    html += `<div class="space-y-md">${nbChapters.map((ch, i) => `
      <div class="card card--flat reveal" style="overflow:hidden;animation-delay:${i*0.05}s">
        <button onclick="nbOpenChapter=nbOpenChapter===${i}?-1:${i};renderNewborn();" style="width:100%;display:flex;align-items:center;gap:var(--space-md);padding:var(--space-lg);border:none;background:transparent;cursor:pointer;font-family:inherit;text-align:right;">
          <div style="width:40px;height:40px;border-radius:var(--radius-full);background:${nbOpenChapter===i?ch.color:'var(--surface-container-high)'};display:flex;align-items:center;justify-content:center;transition:all 0.3s;flex-shrink:0;">
            <span class="material-symbols-outlined" style="font-size:20px;color:${nbOpenChapter===i?'white':'var(--on-surface-variant)'};">${ch.icon}</span>
          </div>
          <h4 class="text-body-lg text-semibold" style="flex:1;">${ch.title}</h4>
          <span class="material-symbols-outlined text-variant" style="transition:transform 0.3s;${nbOpenChapter===i?'transform:rotate(180deg)':''}">expand_more</span>
        </button>
        ${nbOpenChapter === i ? `<div style="padding:0 var(--space-lg) var(--space-xl);border-top:1px solid var(--outline-variant);padding-top:var(--space-lg);animation:fadeIn 0.3s ease;">${ch.content}</div>` : ''}
      </div>`).join('')}</div>`;
  } else {
    html += `<h3 class="text-headline-sm mb-md reveal">${t('nb_myths_title')}</h3>
    <p class="text-body-md text-variant mb-xl reveal">${t('nb_myths_desc')}</p>
    <div class="space-y-lg">${nbMyths.map((m, i) => {
      const fl = nbFlippedCards[i];
      return `<div class="reveal" style="animation-delay:${i*0.04}s;perspective:600px;">
        <div onclick="nbFlippedCards[${i}]=!nbFlippedCards[${i}];renderNewborn();" style="cursor:pointer;position:relative;min-height:120px;transition:transform 0.6s;transform-style:preserve-3d;${fl?'transform:rotateY(180deg)':''}">
          <div style="position:${fl?'absolute':'relative'};inset:0;backface-visibility:hidden;padding:var(--space-xl);border-radius:var(--radius-xl);background:linear-gradient(135deg,rgba(220,53,69,0.08),rgba(220,53,69,0.03));border:2px solid rgba(220,53,69,0.2);">
            <div class="flex items-center gap-sm mb-md"><span style="font-size:20px;">❌</span><span class="text-label-lg" style="color:var(--error);">${t('bf_myth')}</span><span class="material-symbols-outlined text-variant" style="margin-inline-start:auto;font-size:18px;">touch_app</span></div>
            <p class="text-body-lg text-semibold" style="line-height:1.6;">${m.myth}</p>
          </div>
          <div style="position:absolute;inset:0;backface-visibility:hidden;transform:rotateY(180deg);padding:var(--space-xl);border-radius:var(--radius-xl);background:linear-gradient(135deg,rgba(40,167,69,0.08),rgba(40,167,69,0.03));border:2px solid rgba(40,167,69,0.2);">
            <div class="flex items-center gap-sm mb-md"><span style="font-size:20px;">✅</span><span class="text-label-lg" style="color:#28a745;">${t('bf_reality')}</span></div>
            <p class="text-body-lg text-semibold" style="line-height:1.6;">${m.reality}</p>
          </div>
        </div>
      </div>`;}).join('')}</div>`;
  }
  container.innerHTML = html;
  setTimeout(() => initReveal(), 50);
}

// ══════════════════════════════════════════════════════════════
//  MODULE: MYTHES ET RÉALITÉS (خرافات وحقائق)
// ══════════════════════════════════════════════════════════════

const allMyths = [
  // Allaitement
  { cat: 'breastfeeding', myth: 'يجب إعطاء الماء للرضيع قبل 6 أشهر', reality: 'حليب الأم وحده يكفي خلال الأشهر الستة الأولى' },
  { cat: 'breastfeeding', myth: 'صغر حجم الثدي يعني قلة الحليب', reality: 'حجم الثدي لا يحدد كمية الحليب المنتجة' },
  { cat: 'breastfeeding', myth: 'كل بكاء يعني أن الطفل جائع', reality: 'قد يكون البكاء بسبب التعب أو المغص أو الحاجة للاحتضان' },
  { cat: 'breastfeeding', myth: 'يجب إرضاع الطفل كل 3 ساعات فقط', reality: 'الرضاعة تكون حسب طلب الطفل' },
  { cat: 'breastfeeding', myth: 'مرض الأم يعني التوقف عن الرضاعة', reality: 'غالباً يمكن الاستمرار بالرضاعة بعد استشارة المختص' },
  { cat: 'breastfeeding', myth: 'الحليب الصناعي أفضل من حليب الأم', reality: 'حليب الأم هو الغذاء الأمثل للرضيع' },
  { cat: 'breastfeeding', myth: 'التوتر يفسد الحليب', reality: 'التوتر قد يؤثر مؤقتاً على تدفق الحليب لكنه لا يفسده' },
  { cat: 'breastfeeding', myth: 'الأم المرضعة يجب أن تأكل لشخصين', reality: 'الجودة الغذائية أهم من الكمية' },
  { cat: 'breastfeeding', myth: 'الرضاعة المتكررة تعني أن الحليب غير كافٍ', reality: 'الرضاعة المتكررة طبيعية خاصة خلال فترات النمو السريع' },
  { cat: 'breastfeeding', myth: 'يجب إيقاف الرضاعة عند ظهور الأسنان', reality: 'يمكن مواصلة الرضاعة حتى عمر سنتين أو أكثر' },
  // Sexualité
  { cat: 'sexuality', myth: 'يجب استئناف العلاقة بعد 40 يوماً بالضبط', reality: 'لا يوجد وقت إلزامي ويختلف حسب كل امرأة' },
  { cat: 'sexuality', myth: 'الرضاعة الطبيعية تمنع الحمل %100', reality: 'تقلل الحمل لكنها ليست وسيلة مضمونة' },
  { cat: 'sexuality', myth: 'انخفاض الرغبة الجنسية مشكلة دائمة', reality: 'طبيعي ومؤقت بعد الولادة' },
  { cat: 'sexuality', myth: 'الألم أثناء العلاقة يجب تحمله', reality: 'الألم المستمر يحتاج استشارة' },
  { cat: 'sexuality', myth: 'الجفاف المهبلي مرض', reality: 'غالباً نتيجة تغيرات هرمونية بعد الولادة' },
  // Nouveau-né
  { cat: 'newborn', myth: 'يجب لف المولود بإحكام شديد (القماط)', reality: 'اللف اللطيف مفيد لكن الشد المفرط يضر بالمفاصل' },
  { cat: 'newborn', myth: 'المولود لا يسمع ولا يرى', reality: 'يسمع الأصوات ويرى على مسافة 20-30 سم' },
  { cat: 'newborn', myth: 'البكاء الكثير يدل على مشكلة صحية دائماً', reality: 'البكاء هو وسيلة التواصل الوحيدة للمولود وغالباً طبيعي' },
  { cat: 'newborn', myth: 'يجب وضع كحل في عيني المولود', reality: 'الكحل قد يحتوي على مواد سامة ولا ينصح به طبياً' },
  { cat: 'newborn', myth: 'المولود يحتاج ماء إضافي في الصيف', reality: 'حليب الأم يكفي حتى في الحر خلال الأشهر الستة الأولى' }
];

let myFlippedCards = {};
let myFilterCat = 'all';

function renderMyths() {
  const container = document.getElementById('myths-content');
  if (!container) return;

  const filtered = myFilterCat === 'all' ? allMyths : allMyths.filter(m => m.cat === myFilterCat);

  container.innerHTML = `
    <div class="flex items-center gap-md mb-xl">
      <button class="top-bar__btn" onclick="navigateTo('sage-femme')"><span class="material-symbols-outlined">arrow_back</span></button>
      <div style="flex:1;">
        <h2 class="text-headline-sm">${t('my_title')}</h2>
        <p class="text-body-md text-variant">${t('my_subtitle')}</p>
      </div>
      <span style="font-size:36px;">🧠</span>
    </div>

    <!-- Filters -->
    <div class="chips-scroll mb-xl">
      ${[
        { id: 'all', label: t('sf_all'), count: allMyths.length },
        { id: 'breastfeeding', label: '🤱 ${t("bf_title")}', count: allMyths.filter(m=>m.cat==='breastfeeding').length },
        { id: 'sexuality', label: '❤️ ${t("sx_title")}', count: allMyths.filter(m=>m.cat==='sexuality').length },
        { id: 'newborn', label: '👶 ${t("nb_title")}', count: allMyths.filter(m=>m.cat==='newborn').length }
      ].map(f => `
        <button class="chip chip--tonal ${myFilterCat===f.id?'active':''}" onclick="myFilterCat='${f.id}';myFlippedCards={};renderMyths();">
          ${f.label} <span style="opacity:0.7;font-size:11px;">(${f.count})</span>
        </button>
      `).join('')}
    </div>

    <p class="text-body-md text-variant mb-xl reveal"><span style="font-size:16px;">👆</span> ${t('my_tap_hint')}</p>

    <div class="space-y-lg">
      ${filtered.map((m, i) => {
        const flipped = myFlippedCards[i];
        const catIcon = m.cat === 'breastfeeding' ? '🤱' : m.cat === 'sexuality' ? '❤️' : '👶';
        return `
        <div class="reveal" style="animation-delay:${i*0.04}s;perspective:600px;">
          <div onclick="myFlippedCards[${i}]=!myFlippedCards[${i}];renderMyths();" style="cursor:pointer;position:relative;min-height:120px;transition:transform 0.6s;transform-style:preserve-3d;${flipped?'transform:rotateY(180deg)':''}">
            <div style="position:${flipped?'absolute':'relative'};inset:0;backface-visibility:hidden;padding:var(--space-xl);border-radius:var(--radius-xl);background:linear-gradient(135deg,rgba(220,53,69,0.08),rgba(220,53,69,0.03));border:2px solid rgba(220,53,69,0.2);">
              <div class="flex items-center gap-sm mb-md">
                <span style="font-size:20px;">❌</span>
                <span class="text-label-lg" style="color:var(--error);text-transform:uppercase;">${t('bf_myth')}</span>
                <span style="font-size:14px;margin-inline-start:4px;">${catIcon}</span>
                <span class="material-symbols-outlined text-variant" style="margin-inline-start:auto;font-size:18px;">touch_app</span>
              </div>
              <p class="text-body-lg text-semibold" style="line-height:1.6;">${m.myth}</p>
            </div>
            <div style="position:absolute;inset:0;backface-visibility:hidden;transform:rotateY(180deg);padding:var(--space-xl);border-radius:var(--radius-xl);background:linear-gradient(135deg,rgba(40,167,69,0.08),rgba(40,167,69,0.03));border:2px solid rgba(40,167,69,0.2);">
              <div class="flex items-center gap-sm mb-md">
                <span style="font-size:20px;">✅</span>
                <span class="text-label-lg" style="color:#28a745;text-transform:uppercase;">${t('bf_reality')}</span>
                <span style="font-size:14px;margin-inline-start:4px;">${catIcon}</span>
              </div>
              <p class="text-body-lg text-semibold" style="line-height:1.6;">${m.reality}</p>
            </div>
          </div>
        </div>`;
      }).join('')}
    </div>

    <div class="text-center mt-xl reveal" style="padding:var(--space-xl);background:var(--surface-container-low);border-radius:var(--radius-xl);">
      <span class="material-symbols-outlined text-primary" style="font-size:32px;">school</span>
      <p class="text-body-md text-semibold mt-md">${t('my_footer')}</p>
    </div>
  `;
  setTimeout(() => initReveal(), 50);
}

// ══════════════════════════════════════════════════════════════
//  SUIVI QUOTIDIEN
// ══════════════════════════════════════════════════════════════
async function renderSuivi() {
  const container = document.getElementById('suivi-content');
  if (!container) return;

  let entries = [];
  try {
    const data = await api('/daily');
    entries = data.entries || [];
  } catch (e) { console.error(e); }

  const chartData = entries.slice(0, 7).reverse();
  const days = [t('daily_days_dim'), t('daily_days_lun'), t('daily_days_mar'), t('daily_days_mer'), t('daily_days_jeu'), t('daily_days_ven'), t('daily_days_sam')];

  container.innerHTML = `
    <h2 class="text-headline-sm mb-md">${t('daily_title')}</h2>
    <p class="text-body-md text-variant mb-xl">${t('daily_subtitle')}</p>

    <div class="card card--flat mb-xl"><div class="card__body">
      <p class="text-label-lg text-variant mb-lg" style="text-transform:uppercase;letter-spacing:0.08em;">${t('daily_mood')}</p>
      <div class="mood-grid">
        ${[`😫|${t('daily_exhausted')}`, `😔|${t('daily_sad')}`, `😐|${t('daily_neutral')}`, `😊|${t('daily_good')}`, `😄|${t('daily_great')}`].map(m => {
          const [emoji, label] = m.split('|');
          return `<button class="mood-option" onclick="selectMood('${emoji}',this)"><span class="mood-option__emoji">${emoji}</span><span class="mood-option__label">${label}</span></button>`;
        }).join('')}
      </div>
    </div></div>

    <div class="card card--flat mb-xl"><div class="card__body">
      <div class="slider-container"><label><span>${t('daily_stress')}</span><span><span id="stress-val">5</span>/10</span></label>
        <input type="range" min="0" max="10" value="5" id="slider-stress" oninput="document.getElementById('stress-val').textContent=this.value"></div>
      <div class="slider-container"><label><span>${t('daily_conjugal')}</span><span><span id="conj-val">5</span>/10</span></label>
        <input type="range" min="0" max="10" value="5" id="slider-conj" oninput="document.getElementById('conj-val').textContent=this.value"></div>
      <div class="slider-container"><label><span>${t('daily_intimate')}</span><span><span id="intime-val">5</span>/10</span></label>
        <input type="range" min="0" max="10" value="5" id="slider-intime" oninput="document.getElementById('intime-val').textContent=this.value"></div>
    </div></div>

    <button class="btn btn--primary btn--full mb-3xl" id="save-daily-btn" onclick="saveDailyEntry()">
      <span class="material-symbols-outlined">save</span> ${t('daily_save')}
    </button>

    ${chartData.length > 0 ? `
    <div class="mini-chart mb-xl reveal">
      <h3 class="text-headline-sm mb-lg">${t('daily_evolution')}</h3>
      <svg viewBox="0 0 340 180" style="width:100%;">
        ${[0,1,2,3,4].map(i => `<line x1="40" y1="${20+i*35}" x2="330" y2="${20+i*35}" stroke="var(--outline-variant)" stroke-width="0.5" stroke-dasharray="4"/>`).join('')}
        <polyline points="${chartData.map((d,i) => `${40+i*(290/Math.max(chartData.length-1,1))},${160-d.stress*14}`).join(' ')}" fill="none" stroke="var(--error)" stroke-width="2.5" stroke-linecap="round" opacity="0.7"/>
        <polyline points="${chartData.map((d,i) => `${40+i*(290/Math.max(chartData.length-1,1))},${160-d.satisfaction_conjugale*14}`).join(' ')}" fill="none" stroke="var(--primary)" stroke-width="2.5" stroke-linecap="round"/>
        ${chartData.map((d,i) => `<circle cx="${40+i*(290/Math.max(chartData.length-1,1))}" cy="${160-d.satisfaction_conjugale*14}" r="4" fill="var(--primary)"/><circle cx="${40+i*(290/Math.max(chartData.length-1,1))}" cy="${160-d.stress*14}" r="3" fill="var(--error)" opacity="0.7"/>`).join('')}
        ${chartData.map((d,i) => `<text x="${40+i*(290/Math.max(chartData.length-1,1))}" y="178" text-anchor="middle" font-size="10" fill="var(--on-surface-variant)">${d.day_name||days[new Date(d.created_at).getDay()]}</text>`).join('')}
      </svg>
      <div class="flex justify-center gap-xl mt-md">
        <div class="flex items-center gap-sm"><span style="width:12px;height:3px;background:var(--primary);border-radius:2px;display:block"></span><span class="text-label-md text-variant">${t('daily_satisfaction')}</span></div>
        <div class="flex items-center gap-sm"><span style="width:12px;height:3px;background:var(--error);border-radius:2px;display:block;opacity:0.7"></span><span class="text-label-md text-variant">${t('daily_stress_label')}</span></div>
      </div>
    </div>` : ''}

    <h3 class="text-headline-sm mb-lg">${t('daily_history')}</h3>
    <div class="space-y-md">
      ${entries.length > 0 ? entries.slice(0, 7).map(e => `
        <div class="daily-entry">
          <span class="daily-entry__date">${e.day_name || ''}</span>
          <span style="font-size:24px;">${e.mood}</span>
          <div style="flex:1;"><div class="flex justify-between text-label-md">
            <span class="text-variant">${t('daily_stress_label')}: ${e.stress}/10</span>
            <span class="text-primary">${t('daily_conj_label')}: ${e.satisfaction_conjugale}/10</span>
          </div></div>
        </div>
      `).join('') : `<p class="text-body-md text-variant text-center">${t('daily_no_entries')}</p>`}
    </div>
  `;
  setTimeout(() => initReveal(), 50);
}

function selectMood(emoji, el) {
  document.querySelectorAll('.mood-option').forEach(o => o.classList.remove('selected'));
  el.classList.add('selected');
  state.currentMood = emoji;
}

async function saveDailyEntry() {
  const body = {
    mood: state.currentMood || '😊',
    stress: parseInt(document.getElementById('slider-stress')?.value || 5),
    satisfaction_conjugale: parseInt(document.getElementById('slider-conj')?.value || 5),
    satisfaction_intime: parseInt(document.getElementById('slider-intime')?.value || 5)
  };

  const btn = document.getElementById('save-daily-btn');
  try {
    await api('/daily', { method: 'POST', body });
    if (btn) {
      btn.innerHTML = `<span class="material-symbols-outlined">check</span> ${t('daily_saved')}`;
      btn.style.background = 'var(--primary-container)';
      btn.style.color = 'var(--on-primary-container)';
      setTimeout(() => renderSuivi(), 1500);
    }
  } catch (e) {
    if (btn) btn.innerHTML = `<span class="material-symbols-outlined">error</span> ${t('misc_error')}`;
  }
}

// ══════════════════════════════════════════════════════════════
//  PLAN PERSONNALISÉ
// ══════════════════════════════════════════════════════════════
let currentPlanDuration = 14;

async function renderPlan() {
  const container = document.getElementById('plan-content');
  if (!container) return;

  container.innerHTML = `
    <div class="flex items-center gap-md mb-xl">
      <div style="width:48px;height:48px;border-radius:var(--radius-full);background:var(--primary-fixed);display:flex;align-items:center;justify-content:center;">
        <span class="material-symbols-outlined text-primary icon-filled">route</span>
      </div>
      <div><h2 class="text-headline-sm">${t('plan_title')}</h2><p class="text-body-md text-variant">${t('plan_subtitle')}</p></div>
    </div>

    <div class="plan-duration-selector">
      <button class="plan-duration-card ${currentPlanDuration===7?'active':''}" onclick="selectPlanDuration(7)">
        <span class="plan-duration-card__days">7</span>
        <span class="plan-duration-card__label">${t('plan_days')}</span>
      </button>
      <button class="plan-duration-card ${currentPlanDuration===14?'active':''}" onclick="selectPlanDuration(14)">
        <span class="plan-duration-card__days">14</span>
        <span class="plan-duration-card__label">${t('plan_days')}</span>
      </button>
      <button class="plan-duration-card ${currentPlanDuration===30?'active':''}" onclick="selectPlanDuration(30)">
        <span class="plan-duration-card__days">30</span>
        <span class="plan-duration-card__label">${t('plan_days')}</span>
      </button>
    </div>

    <div id="plan-details"><div class="text-center"><span class="material-symbols-outlined" style="font-size:32px;color:var(--outline);animation:spin 1s linear infinite;">hourglass_top</span></div></div>
  `;

  loadPlanDetails();
}

async function selectPlanDuration(d) {
  currentPlanDuration = d;
  document.querySelectorAll('.plan-duration-card').forEach(c => {
    c.classList.toggle('active', parseInt(c.querySelector('.plan-duration-card__days').textContent) === d);
  });
  loadPlanDetails();
}

async function loadPlanDetails() {
  const detailsEl = document.getElementById('plan-details');
  if (!detailsEl) return;

  try {
    const data = await api(`/plan/${currentPlanDuration}`);
    const plan = data.plan;
    const completedDays = data.completedDays || [];
    const progress = plan.activities.length > 0
      ? Math.round((completedDays.length / plan.activities.length) * 100) : 0;

    let focusBanner = '';
    if (data.focusAreas.length > 0) {
      const areaLabels = { psychologique: t('plan_focus_psycho'), communication: t('plan_focus_comm'), 'post-partum': t('plan_focus_pp') };
      focusBanner = `
        <div class="plan-focus-banner reveal">
          <div class="flex items-center gap-md mb-md">
            <span class="material-symbols-outlined text-primary">tips_and_updates</span>
            <strong class="text-body-lg">${t('plan_focus')}</strong>
          </div>
          <p class="text-body-md text-variant">${t('plan_focus_desc')} <strong>${data.focusAreas.map(a => areaLabels[a] || a).join(', ')}</strong>.</p>
        </div>`;
    }

    detailsEl.innerHTML = `
      <div class="card card--flat mb-xl reveal">
        <div class="card__body">
          <h3 class="text-headline-sm mb-sm">${plan.title}</h3>
          <p class="text-body-md text-variant mb-lg">${plan.description}</p>
          <div class="progress-bar"><div class="progress-bar__fill" style="width:${progress}%"></div></div>
          <p class="text-label-md text-variant mt-sm">${completedDays.length}/${plan.activities.length} ${t('plan_completed')} (${progress}%)</p>
        </div>
      </div>

      ${focusBanner}

      <h3 class="text-label-lg text-primary mb-lg" style="text-transform:uppercase;letter-spacing:0.08em;">
        <span class="material-symbols-outlined" style="font-size:16px;vertical-align:middle;">checklist</span> ${t('plan_activities')}
      </h3>
      <div class="space-y-md">
        ${plan.activities.map(a => {
          const done = completedDays.includes(a.day);
          return `
            <div class="plan-activity ${done?'completed':''} reveal" id="plan-act-${a.day}">
              <div class="plan-activity__day"><span>J${a.day}</span></div>
              <div class="plan-activity__body">
                <div class="flex items-center gap-sm">
                  <span class="material-symbols-outlined" style="font-size:18px;color:var(--primary);">${a.icon}</span>
                  <span class="plan-activity__title">${a.title}</span>
                </div>
                <p class="plan-activity__desc">${a.desc}</p>
              </div>
              <button class="plan-activity__check ${done?'checked':''}" onclick="completePlanActivity(${currentPlanDuration},${a.day},this)">
                <span class="material-symbols-outlined" style="font-size:20px;">${done?'check':'radio_button_unchecked'}</span>
              </button>
            </div>`;
        }).join('')}
      </div>
    `;
    setTimeout(() => initReveal(), 50);
  } catch (e) {
    detailsEl.innerHTML = `<p class="text-body-md text-variant text-center">${t('plan_loading_error')}</p>`;
  }
}

async function completePlanActivity(duration, day, btn) {
  if (btn.classList.contains('checked')) return;
  try {
    await api('/plan/complete', { method: 'POST', body: { duration, day } });
    btn.classList.add('checked');
    btn.querySelector('.material-symbols-outlined').textContent = 'check';
    const actEl = document.getElementById(`plan-act-${day}`);
    if (actEl) actEl.classList.add('completed');
    // Reload to update progress
    setTimeout(() => loadPlanDetails(), 500);
  } catch (e) { console.error(e); }
}

// ══════════════════════════════════════════════════════════════
//  COUPLE CHECK-UP
// ══════════════════════════════════════════════════════════════
async function renderCheckup() {
  const container = document.getElementById('checkup-content');
  if (!container) return;

  container.innerHTML = `<div class="text-center" style="padding:var(--space-4xl);"><span class="material-symbols-outlined" style="font-size:32px;color:var(--outline);animation:spin 1s linear infinite;">hourglass_top</span><p class="text-body-md text-variant mt-lg">${t('checkup_generating')}</p></div>`;

  try {
    const data = await api('/checkup');
    const date = new Date(data.generatedAt);
    const dateStr = date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

    const trendIcon = { up: 'trending_up', down: 'trending_down', stable: 'trending_flat', new: 'new_releases' };
    const trendLabel = { up: t('checkup_trend_up'), down: t('checkup_trend_down'), stable: t('checkup_trend_stable'), new: t('checkup_trend_new') };
    const typeLabels = { psychologique: t('checkup_psycho'), conjugal: t('checkup_conjugal'), sexuel: t('checkup_sexual') };
    const typeIcons = { psychologique: 'psychology', conjugal: 'favorite', sexuel: 'diversity_3' };

    let evolutionSVG = '';
    const types = ['psychologique', 'conjugal', 'sexuel'];
    const colors = { psychologique: 'var(--secondary)', conjugal: 'var(--primary)', sexuel: 'var(--tertiary)' };
    const allEvols = types.map(t => data.evolution[t] || []);
    const maxPoints = Math.max(...allEvols.map(e => e.length), 1);

    if (maxPoints > 1) {
      const svgW = 300, svgH = 140, pad = 30;
      const lines = types.map((t, ti) => {
        const pts = data.evolution[t];
        if (pts.length < 2) return '';
        return `<polyline points="${pts.map((p,i) => `${pad+i*((svgW-2*pad)/Math.max(pts.length-1,1))},${svgH-pad-((p.score/100)*(svgH-2*pad))}`).join(' ')}" fill="none" stroke="${colors[t]}" stroke-width="2.5" stroke-linecap="round" opacity="${ti===0?'0.7':'1'}"/>
        ${pts.map((p,i) => `<circle cx="${pad+i*((svgW-2*pad)/Math.max(pts.length-1,1))}" cy="${svgH-pad-((p.score/100)*(svgH-2*pad))}" r="3.5" fill="${colors[t]}"/>`).join('')}`;
      }).join('');

      evolutionSVG = `
        <div class="card card--flat mb-xl reveal"><div class="card__body">
          <h3 class="text-headline-sm mb-lg flex items-center gap-sm"><span class="material-symbols-outlined text-primary">show_chart</span> ${t('checkup_evolution')}</h3>
          <svg viewBox="0 0 ${svgW} ${svgH}" style="width:100%;">
            ${[0,25,50,75,100].map(v => `<line x1="${pad}" y1="${svgH-pad-(v/100*(svgH-2*pad))}" x2="${svgW-pad}" y2="${svgH-pad-(v/100*(svgH-2*pad))}" stroke="var(--outline-variant)" stroke-width="0.5" stroke-dasharray="4"/><text x="${pad-5}" y="${svgH-pad-(v/100*(svgH-2*pad))+4}" text-anchor="end" font-size="9" fill="var(--outline)">${v}</text>`).join('')}
            ${lines}
          </svg>
          <div class="flex justify-center gap-xl mt-md">
            ${types.map(t => `<div class="flex items-center gap-sm"><span style="width:12px;height:3px;background:${colors[t]};border-radius:2px;display:block"></span><span class="text-label-md text-variant">${typeLabels[t]}</span></div>`).join('')}
          </div>
        </div></div>`;
    }

    container.innerHTML = `
      <div class="checkup-header reveal">
        <div style="position:relative;z-index:1;">
          <span class="text-label-lg" style="opacity:0.8;">${t('checkup_monthly')}</span>
          <h2 class="text-headline-md mt-sm" style="color:white;">${data.couple.partner1_name}${data.couple.partner2_name ? ' & ' + data.couple.partner2_name : ''}</h2>
          <p class="text-body-md mt-sm" style="opacity:0.8;">${dateStr}</p>
          <div style="margin-top:var(--space-xl);display:flex;align-items:baseline;gap:var(--space-md);">
            <span style="font-size:48px;font-weight:700;">${data.globalScore}%</span>
            <span style="opacity:0.8;">${t('checkup_global_score')}</span>
          </div>
        </div>
      </div>

      <h3 class="text-label-lg text-primary mb-lg reveal" style="text-transform:uppercase;letter-spacing:0.08em;">
        ${t('checkup_by_dimension')}
      </h3>
      <div class="mb-xl reveal">
        ${types.map(t => `
          <div class="checkup-score-row">
            <div class="flex items-center gap-md">
              <span class="material-symbols-outlined text-primary">${typeIcons[t]}</span>
              <div>
                <span class="text-body-lg text-semibold">${typeLabels[t]}</span>
                <span class="text-headline-sm text-primary" style="margin-left:var(--space-md);">${data.currentScores[t]}%</span>
              </div>
            </div>
            <span class="trend-indicator trend-indicator--${data.trends[t]}">
              <span class="material-symbols-outlined" style="font-size:16px;">${trendIcon[data.trends[t]]}</span>
              ${trendLabel[data.trends[t]]}
            </span>
          </div>
        `).join('')}
      </div>

      ${evolutionSVG}

      ${data.recommendations.length > 0 ? `
        <h3 class="text-label-lg text-primary mb-lg reveal" style="text-transform:uppercase;letter-spacing:0.08em;">
          ${t('checkup_recommendations')}
        </h3>
        <div class="space-y-md mb-xl reveal">
          ${data.recommendations.map(r => `
            <div class="recommendation-card recommendation-card--${r.priority}">
              <span class="material-symbols-outlined" style="color:${r.priority==='high'?'var(--error)':r.priority==='medium'?'var(--secondary)':'var(--primary)'};margin-top:2px;">${r.icon}</span>
              <p class="text-body-md">${r.text}</p>
            </div>
          `).join('')}
        </div>
      ` : ''}

      <button class="btn btn--primary btn--full mb-xl reveal" onclick="navigateTo('plan')">
        <span class="material-symbols-outlined">route</span> ${t('checkup_start_plan')}
      </button>

      <button class="btn btn--outline btn--full mb-xl reveal" onclick="navigateTo('evaluations')">
        <span class="material-symbols-outlined">assignment</span> ${t('checkup_see_results')}
      </button>
    `;
    setTimeout(() => initReveal(), 50);
  } catch (e) {
    container.innerHTML = `<p class="text-body-md text-variant text-center">${t('checkup_no_data')}</p>`;
  }
}

// ══════════════════════════════════════════════════════════════
//  TIMELINE ARTICLE VIEWER
// ══════════════════════════════════════════════════════════════
let timelineArticleData = null;

function openTimelineArticle(articleId, period) {
  timelineArticleData = { articleId, period };
  navigateTo('timeline-article');
}

async function renderTimelineArticle() {
  const container = document.getElementById('timeline-article-content');
  if (!container || !timelineArticleData) return;

  try {
    const data = await api(`/timeline/${timelineArticleData.period}`);
    const article = data.articles.find(a => a.id === timelineArticleData.articleId);
    if (!article) throw new Error('Article non trouvé');

    container.innerHTML = `
      <div class="timeline-article-viewer__header reveal">
        <button class="top-bar__btn" style="color:white;margin-bottom:var(--space-lg);" onclick="navigateTo('library')">
          <span class="material-symbols-outlined">arrow_back</span>
        </button>
        <div class="flex items-center gap-sm mb-md">
          <span class="material-symbols-outlined icon-filled" style="font-size:28px;">${article.icon}</span>
          <span style="background:rgba(255,255,255,0.2);padding:4px 12px;border-radius:var(--radius-full);font-size:11px;font-weight:600;">${article.category}</span>
        </div>
        <h1 class="text-headline-md">${article.title}</h1>
        <p class="text-body-md mt-sm" style="opacity:0.8;">
          <span class="material-symbols-outlined" style="font-size:16px;vertical-align:middle;">schedule</span> ${t('timeline_read_time', { n: article.readTime })} • ${t('timeline_period', { period: timelineArticleData.period })}
        </p>
      </div>
      <div class="timeline-article-viewer__body reveal" style="padding:0 var(--space-sm);">
        <p style="font-size:16px;line-height:1.9;color:var(--on-surface);">${article.content}</p>
      </div>
      <div class="mt-3xl reveal">
        <button class="btn btn--outline btn--full" onclick="navigateTo('library')">
          <span class="material-symbols-outlined">arrow_back</span> ${t('misc_back_library')}
        </button>
      </div>
    `;
    setTimeout(() => initReveal(), 50);
  } catch (e) {
    container.innerHTML = `<p class="text-body-md text-variant text-center">${t('timeline_article_not_found')}</p>`;
  }
}

// ══════════════════════════════════════════════════════════════
//  ALERTES SYSTÈME
// ══════════════════════════════════════════════════════════════
async function renderAlerts() {
  const container = document.getElementById('alerts-content');
  if (!container) return;

  // Local medical alerts (always available)
  const localAlerts = [
    { type: 'critical', icon: 'breastfeeding', title: t('alert_bf_fever_title'), message: t('alert_bf_fever_msg'), action: t('alert_action_bf'), nav: 'breastfeeding' },
    { type: 'critical', icon: 'local_hospital', title: t('alert_bf_redness_title'), message: t('alert_bf_redness_msg'), action: t('alert_action_bf'), nav: 'breastfeeding' },
    { type: 'critical', icon: 'medical_services', title: t('alert_bf_lump_title'), message: t('alert_bf_lump_msg'), action: t('alert_action_bf'), nav: 'breastfeeding' },
    { type: 'warning', icon: 'child_care', title: t('alert_bf_refuse_title'), message: t('alert_bf_refuse_msg'), action: t('alert_action_bf'), nav: 'breastfeeding' },
    { type: 'warning', icon: 'monitor_weight', title: t('alert_bf_weight_title'), message: t('alert_bf_weight_msg'), action: t('alert_action_bf'), nav: 'breastfeeding' },
    { type: 'critical', icon: 'healing', title: t('alert_epis_title'), message: t('alert_epis_msg'), action: t('alert_action_sx'), nav: 'sexuality' },
    { type: 'warning', icon: 'favorite', title: t('alert_sx_pain_title'), message: t('alert_sx_pain_msg'), action: t('alert_action_sx'), nav: 'sexuality' },
    { type: 'info', icon: 'psychology', title: t('alert_ppd_title'), message: t('alert_ppd_msg'), action: t('alert_action_eval'), nav: 'home' }
  ];

  // Try to get server alerts too
  let serverAlerts = [];
  try {
    const data = await api('/alerts');
    serverAlerts = data.alerts || [];
  } catch (e) { /* use local alerts only */ }

  const allAlerts = [...localAlerts, ...serverAlerts];
  const criticalCount = allAlerts.filter(a => a.type === 'critical').length;
  const warningCount = allAlerts.filter(a => a.type === 'warning').length;

  container.innerHTML = `
    <div class="flex items-center gap-md mb-xl">
      <div style="width:48px;height:48px;border-radius:var(--radius-full);background:${criticalCount>0?'var(--error-container)':'#fff3cd'};display:flex;align-items:center;justify-content:center;">
        <span class="material-symbols-outlined ${criticalCount>0?'text-error':''}" style="${criticalCount===0?'color:#856404':''}">notifications_active</span>
      </div>
      <div>
        <h2 class="text-headline-sm">${t('alerts_title')}</h2>
        <p class="text-body-md text-variant">${allAlerts.length} ${t('alerts_alert')} • ${criticalCount} ${t('alerts_critical')} • ${warningCount} ${t('alerts_warning')}</p>
      </div>
    </div>

    <p class="text-body-md text-variant mb-xl reveal">${t('alerts_medical_intro')}</p>

    <div id="alerts-list">
      ${allAlerts.map((alert, i) => `
        <div class="alert-card alert-card--${alert.type} reveal" style="animation-delay:${i*0.08}s;">
          <div class="alert-card__header">
            <div class="alert-card__icon">
              <span class="material-symbols-outlined">${alert.icon}</span>
            </div>
            <div>
              <h4 class="text-body-lg text-semibold">${alert.title}</h4>
            </div>
          </div>
          <p class="text-body-md" style="line-height:1.6;">${alert.message}</p>
          <button class="alert-card__action" onclick="navigateTo('${alert.nav || 'sage-femme'}')">
            <span class="material-symbols-outlined" style="font-size:16px;">${alert.type==='critical'?'emergency':'arrow_forward'}</span>
            ${alert.action}
          </button>
        </div>
      `).join('')}
    </div>

    <div class="glass-card reveal mt-xl" style="padding:var(--space-xl);border:1px solid rgba(214,194,200,0.3);">
      <h3 class="text-headline-sm text-primary mb-md flex items-center gap-sm">
        <span class="material-symbols-outlined">info</span> ${t('alerts_important')}
      </h3>
      <p class="text-body-md text-variant" style="line-height:1.7;">
        ${t('alerts_disclaimer')}
      </p>
    </div>
  `;
  setTimeout(() => initReveal(), 50);
}

// ══════════════════════════════════════════════════════════════
//  ADMIN DASHBOARD
// ══════════════════════════════════════════════════════════════
async function renderAdmin() {
  const container = document.getElementById('admin-content');
  if (!container) return;

  container.innerHTML = '<div class="text-center" style="padding:var(--space-4xl);"><span class="material-symbols-outlined" style="font-size:32px;color:var(--outline);animation:spin 1s linear infinite;">hourglass_top</span></div>';

  try {
    const data = await api('/admin/stats');

    const scoreLabels = { excellent: t('res_excellent'), bon: t('res_bon'), moyen: t('res_moyen'), faible: t('res_faible') };
    const scoreColors = { excellent: 'var(--primary)', bon: '#4caf50', moyen: '#ff9800', faible: 'var(--error)' };
    const totalScores = data.scoreDistrib.reduce((s, d) => s + d.count, 0) || 1;

    container.innerHTML = `
      <div class="admin-header reveal">
        <span class="text-label-lg" style="opacity:0.8;">${t('admin_dashboard')}</span>
        <h2 class="text-headline-md mt-sm" style="color:white;">${t('admin_title')}</h2>
        <p class="text-body-md mt-sm" style="opacity:0.8;">${t('admin_subtitle')}</p>
      </div>

      <div class="admin-stat-grid reveal">
        <div class="admin-stat-card">
          <span class="admin-stat-card__value">${data.totalCouples}</span>
          <span class="admin-stat-card__label">${t('admin_couples')}</span>
        </div>
        <div class="admin-stat-card">
          <span class="admin-stat-card__value">${data.activeCouples}</span>
          <span class="admin-stat-card__label">${t('admin_active')}</span>
        </div>
        <div class="admin-stat-card">
          <span class="admin-stat-card__value">${data.totalEvals}</span>
          <span class="admin-stat-card__label">${t('admin_evals')}</span>
        </div>
        <div class="admin-stat-card">
          <span class="admin-stat-card__value">${data.totalDaily}</span>
          <span class="admin-stat-card__label">${t('admin_daily')}</span>
        </div>
      </div>

      <div class="card card--flat mb-xl reveal"><div class="card__body">
        <h3 class="text-headline-sm mb-lg flex items-center gap-sm">
          <span class="material-symbols-outlined text-primary">analytics</span> ${t('admin_avg_scores')}
        </h3>
        ${['psychologique', 'conjugal', 'sexuel'].map(t => `
          <div class="flex items-center justify-between mb-md">
            <span class="text-body-lg">${capitalize(t)}</span>
            <span class="text-headline-sm text-primary">${data.avgScores[t]}%</span>
          </div>
          <div class="score-bar mb-lg"><div class="score-bar__fill" style="background:var(--primary);width:${data.avgScores[t]}%"></div></div>
        `).join('')}
      </div></div>

      ${data.scoreDistrib.length > 0 ? `
      <div class="card card--flat mb-xl reveal"><div class="card__body">
        <h3 class="text-headline-sm mb-lg flex items-center gap-sm">
          <span class="material-symbols-outlined text-primary">pie_chart</span> ${t('admin_score_distrib')}
        </h3>
        <div class="admin-distrib-bar">
          ${data.scoreDistrib.map(d => `<div class="admin-distrib-bar__segment" style="width:${(d.count/totalScores*100)}%;background:${scoreColors[d.level]||'var(--outline)'}"></div>`).join('')}
        </div>
        <div class="flex gap-lg" style="flex-wrap:wrap;">
          ${data.scoreDistrib.map(d => `<div class="flex items-center gap-sm"><span style="width:10px;height:10px;border-radius:50%;background:${scoreColors[d.level]||'var(--outline)'};display:block;"></span><span class="text-label-md text-variant">${scoreLabels[d.level]||d.level}: ${d.count}</span></div>`).join('')}
        </div>
      </div></div>
      ` : ''}

      <div class="card card--flat mb-xl reveal"><div class="card__body">
        <h3 class="text-headline-sm mb-lg flex items-center gap-sm">
          <span class="material-symbols-outlined text-primary">assessment</span> ${t('admin_evals_by_type')}
        </h3>
        <div class="grid-3">
          <div class="text-center">
            <span class="text-headline-md text-secondary">${data.evalsByType.psychologique || 0}</span>
            <p class="text-label-md text-variant">Psycho</p>
          </div>
          <div class="text-center">
            <span class="text-headline-md text-primary">${data.evalsByType.conjugal || 0}</span>
            <p class="text-label-md text-variant">Conjugal</p>
          </div>
          <div class="text-center">
            <span class="text-headline-md" style="color:var(--tertiary);">${data.evalsByType.sexuel || 0}</span>
            <p class="text-label-md text-variant">Sexuel</p>
          </div>
        </div>
      </div></div>

      <h3 class="text-label-lg text-primary mb-lg reveal" style="text-transform:uppercase;letter-spacing:0.08em;">
        <span class="material-symbols-outlined" style="font-size:16px;vertical-align:middle;">group</span> ${t('admin_recent_couples')}
      </h3>
      <div class="mb-xl reveal">
        ${data.recentCouples.map(c => `
          <div class="admin-couple-row" onclick="viewAdminCouple(${c.id})">
            <div class="admin-couple-row__avatar">
              <span class="material-symbols-outlined text-primary" style="font-size:20px;">group</span>
            </div>
            <div style="flex:1;">
              <p class="text-body-lg text-semibold">${c.partner1_name}${c.partner2_name ? ' & ' + c.partner2_name : ''}</p>
              <p class="text-label-md text-variant">${c.partner1_email}</p>
            </div>
            <span class="material-symbols-outlined text-outline">chevron_right</span>
          </div>
        `).join('')}
      </div>
    `;
    setTimeout(() => initReveal(), 50);
  } catch (e) {
    container.innerHTML = `
      <div class="text-center" style="padding:var(--space-4xl);">
        <span class="material-symbols-outlined" style="font-size:48px;color:var(--error);">lock</span>
        <h3 class="text-headline-sm mt-lg">${t('admin_restricted')}</h3>
        <p class="text-body-md text-variant mt-md">${t('admin_restricted_msg')}</p>
        <button class="btn btn--primary mt-xl" onclick="navigateTo('home')">
          <span class="material-symbols-outlined">home</span> ${t('admin_return')}
        </button>
      </div>
    `;
  }
}

async function viewAdminCouple(id) {
  const container = document.getElementById('admin-content');
  if (!container) return;

  container.innerHTML = '<div class="text-center" style="padding:var(--space-4xl);"><span class="material-symbols-outlined" style="font-size:32px;color:var(--outline);animation:spin 1s linear infinite;">hourglass_top</span></div>';

  try {
    const data = await api(`/admin/couple/${id}`);
    const c = data.couple;

    container.innerHTML = `
      <div class="flex items-center gap-md mb-xl">
        <button class="top-bar__btn" onclick="renderAdmin()"><span class="material-symbols-outlined">arrow_back</span></button>
        <div>
          <h2 class="text-headline-sm">${c.partner1_name}${c.partner2_name ? ' & ' + c.partner2_name : ''}</h2>
          <p class="text-body-md text-variant">${c.partner1_email}</p>
        </div>
      </div>

      <div class="card card--flat mb-xl reveal"><div class="card__body">
        <h3 class="text-label-lg text-primary mb-md" style="text-transform:uppercase;">${t('admin_info')}</h3>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-md);">
          <div><p class="text-label-md text-variant">${t('admin_age_p1')}</p><p class="text-body-lg text-semibold">${c.partner1_age || '-'} ${t('prof_ans')}</p></div>
          <div><p class="text-label-md text-variant">${t('admin_sex_p1')}</p><p class="text-body-lg text-semibold">${c.partner1_sex || '-'}</p></div>
          <div><p class="text-label-md text-variant">${t('admin_age_p2')}</p><p class="text-body-lg text-semibold">${c.partner2_age || '-'} ${t('prof_ans')}</p></div>
          <div><p class="text-label-md text-variant">${t('admin_sex_p2')}</p><p class="text-body-lg text-semibold">${c.partner2_sex || '-'}</p></div>
          <div><p class="text-label-md text-variant">${t('admin_marriage')}</p><p class="text-body-lg text-semibold">${c.marriage_duration || '-'}</p></div>
          <div><p class="text-label-md text-variant">${t('admin_baby_age')}</p><p class="text-body-lg text-semibold">${c.baby_age || '-'}</p></div>
        </div>
      </div></div>

      <div class="card card--flat mb-xl reveal"><div class="card__body">
        <h3 class="text-label-lg text-primary mb-md" style="text-transform:uppercase;">${t('admin_evals_count', { n: data.evaluations.length })}</h3>
        ${data.evaluations.length > 0 ? data.evaluations.map(e => `
          <div class="flex justify-between items-center mb-md" style="padding:var(--space-md);background:var(--surface);border-radius:var(--radius-lg);">
            <div>
              <span class="text-body-lg text-semibold">${capitalize(e.type)}</span>
              <span class="text-label-md text-variant ml-md">${new Date(e.created_at).toLocaleDateString('fr-FR')}</span>
            </div>
            <span class="text-headline-sm text-primary">${e.score}%</span>
          </div>
        `).join('') : `<p class="text-body-md text-variant">${t('admin_no_eval')}</p>`}
      </div></div>

      <div class="card card--flat mb-xl reveal"><div class="card__body">
        <h3 class="text-label-lg text-primary mb-md" style="text-transform:uppercase;">${t('admin_daily_count', { n: data.dailyEntries.length })}</h3>
        ${data.dailyEntries.length > 0 ? data.dailyEntries.map(d => `
          <div class="flex items-center gap-md mb-sm" style="padding:var(--space-sm) var(--space-md);background:var(--surface);border-radius:var(--radius-lg);">
            <span style="font-size:20px;">${d.mood}</span>
            <span class="text-label-md text-variant">${new Date(d.created_at).toLocaleDateString('fr-FR')}</span>
            <span class="text-label-md" style="margin-left:auto;">${t('daily_stress_label')}: ${d.stress}/10</span>
          </div>
        `).join('') : `<p class="text-body-md text-variant">${t('admin_no_daily')}</p>`}
      </div></div>
    `;
    setTimeout(() => initReveal(), 50);
  } catch (e) {
    container.innerHTML = `<p class="text-body-md text-variant text-center">${t('admin_loading_error')}</p>`;
  }
}

// ══════════════════════════════════════════════════════════════
//  MODULE: SEMAINES S1 → S12
// ══════════════════════════════════════════════════════════════
const weeksData = [
  {
    num: 1, title: 'Le choc de la naissance',
    medical: 'Consultation J8 : Contrôle sage-femme de la cicatrisation, saignements, lactation, et évaluation du moral.',
    maman: ['Fatigue extrême après l\'effort physique intense','Douleurs physiques (tranchées utérines, cicatrices)','Hypersensibilité émotionnelle (chute hormonale)','Possible baby blues (pleurs sans raison)'],
    couple: ['Redistribution brutale des rôles','Nuits fragmentées qui épuisent les deux','Sentiment d\'exclusion possible du partenaire','Communication réduite à l\'essentiel'],
    bebe: 'Pratiquez le peau à peau. Cela réconforte instantanément le bébé en lui rappelant l\'utérus, et aide les parents à réduire leur stress en stimulant l\'ocytocine.',
    solutions: ['Partager équitablement les tâches domestiques.','Créer des relais programmés pour que chacun dorme 3h de suite.','Discuter de l\'organisation sans faire de reproches directs.','Garder des gestes simples de tendresse sans attente sexuelle.']
  },
  {
    num: 2, title: 'Apprendre à devenir parents',
    medical: 'Vigilance psychologique : Consulter si la maman présente une tristesse intense, des pleurs fréquents ou une angoisse qui l\'empêche de dormir.',
    maman: ['Besoin impérieux de repos et de récupération','Émotions changeantes d\'une heure à l\'autre','Difficulté à organiser les tâches durant la journée','Besoin immense d\'être rassurée sur ses capacités'],
    couple: ['Irritabilité accrue due au manque chronique de sommeil','Tensions naissantes pour de minuscules détails du quotidien','Charge mentale de l\'organisation de la maison','Prise de décision parfois difficile sur les soins du bébé'],
    bebe: 'Votre bébé ressent vos émotions. Parlez-lui doucement, il reconnaît votre voix depuis la grossesse et cela l\'apaise instantanément.',
    solutions: ['Établir un tableau de répartition des tâches.','Prendre 10 minutes par jour pour parler de vos ressentis.','Accepter l\'aide extérieure sans culpabilité.','Pratiquer la respiration à deux avant le coucher.']
  },
  {
    num: 3, title: 'Le retour à la réalité',
    medical: 'Visite post-natale : Bilan complet maman (cicatrisation, périnée, allaitement). Évaluation du risque de dépression post-partum.',
    maman: ['La fatigue devient chronique','Possible sentiment de solitude si l\'entourage se raréfie','Questionnements sur l\'image corporelle','Début de la rééducation périnéale possible'],
    couple: ['Les conflits se cristallisent autour du sommeil','La vie sociale du couple est en pause','Le partenaire peut se sentir impuissant','Besoin de retrouver des moments à deux'],
    bebe: 'Je commence à sourire ! Chaque sourire est un cadeau qui vous rappelle pourquoi vous avez fait ce magnifique choix.',
    solutions: ['Planifier une sortie courte à deux.','Commencer un journal de gratitude en couple.','Inviter un proche pour garder bébé une heure.','Se féliciter mutuellement de ce que vous traversez.']
  },
  {
    num: 4, title: 'Trouver son rythme',
    medical: 'Suivi allaitement si nécessaire. Consultation sage-femme pour la rééducation périnéale.',
    maman: ['Le corps commence à récupérer lentement','L\'allaitement se stabilise ou pose encore des questions','Le sommeil reste fragmenté mais plus prévisible','Envie de reprendre certaines activités'],
    couple: ['Les routines se mettent en place','Moins de conflits liés à l\'urgence des premiers jours','Besoin de recréer une complicité','Les discussions sur la contraception commencent'],
    bebe: 'Je reconnais vos visages maintenant ! Vos câlins et vos jeux de regard nourrissent mon développement cérébral.',
    solutions: ['Créer un rituel de couple quotidien (thé du soir, promenade...).','Discuter de la contraception post-partum ensemble.','Reprendre une activité douce (marche, yoga...).','Remercier votre partenaire une fois par jour.']
  },
  {
    num: 5, title: 'La question de l\'intimité',
    medical: 'Consultation si douleurs persistantes. Évaluation de la reprise des rapports intimes.',
    maman: ['Le désir sexuel peut être encore absent','Le corps est en transformation (poids, vergétures)','La libido est influencée par la fatigue et les hormones','Possible appréhension de la reprise des rapports'],
    couple: ['Le sujet de la sexualité peut créer des tensions','Décalage de désir entre les partenaires','Besoin de communication ouverte sur l\'intimité','Peur de blesser l\'autre en parlant de ses envies'],
    bebe: 'Votre complicité de couple me rassure. Quand vous riez ensemble, je me sens en sécurité.',
    solutions: ['Parler ouvertement de vos envies et appréhensions.','Reprendre le contact physique progressivement (massages...).','Ne pas fixer de "deadline" pour la reprise des rapports.','Consulter une sage-femme si des douleurs persistent.']
  },
  {
    num: 6, title: 'Le cap du 2ème mois',
    medical: 'Consultation pédiatrique. Vaccination de bébé. Suivi périnéal.',
    maman: ['L\'énergie revient progressivement','L\'identité maternelle se construit','Possible anxiété liée à la reprise du travail','Le sommeil s\'améliore doucement'],
    couple: ['La vie de couple reprend doucement','Les sorties en famille sont plus faciles','Le partenaire trouve sa place de parent','Les grands-parents peuvent être source de tensions'],
    bebe: 'Je fais mes premières vocalises ! Parlez-moi, chantez-moi des berceuses, c\'est ma façon d\'apprendre.',
    solutions: ['Planifier la reprise du travail ensemble.','Organiser un rendez-vous en couple par semaine.','Discuter de l\'éducation de l\'enfant de façon préventive.','Gérer les intrusions de l\'entourage avec diplomatie.']
  },
  {
    num: 7, title: 'La reprise ou le choix de rester',
    medical: 'Visite de reprise si retour au travail. Gestion du sevrage ou maintien de l\'allaitement.',
    maman: ['Culpabilité possible de laisser bébé','Difficulté à concilier vie pro et maternité','Fatigue amplifiée par le double rôle','Besoin de reconnaissance dans son effort'],
    couple: ['Nouvelle organisation logistique complexe','Tension possible sur le partage des charges','Le couple doit fonctionner comme une équipe soudée','La fatigue peut réduire la patience mutuelle'],
    bebe: 'Même si vous partez travailler, je sais que vous reviendrez. La séparation renforce notre lien.',
    solutions: ['Préparer un planning familial détaillé.','Exprimer ses besoins sans accuser l\'autre.','Accepter que tout ne sera pas parfait.','Prévoir un temps de décompression après le travail.']
  },
  {
    num: 8, title: 'Retrouver l\'équilibre',
    medical: 'Consultation si fatigue persistante. Bilan thyroïdien si nécessaire.',
    maman: ['Le corps retrouve progressivement sa forme','La confiance en soi comme mère grandit','Le sommeil nocturne s\'améliore significativement','L\'envie de prendre soin de soi revient'],
    couple: ['Le couple retrouve un rythme de croisière','La complicité revient avec les rituels installés','La sexualité peut repartir doucement','Les projets à deux refont surface'],
    bebe: 'Je commence à jouer seul quelques minutes. Vous pouvez prendre ce temps pour vous, sans culpabilité !',
    solutions: ['Prévoir une activité sportive ou bien-être personnelle.','Reprendre les projets de couple mis en pause.','Évaluer ensemble votre satisfaction conjugale.','Fêter les petites victoires du quotidien.']
  },
  {
    num: 9, title: 'La diversification et les défis',
    medical: 'Début de la diversification alimentaire de bébé. Consultation pédiatrique.',
    maman: ['La routine est bien installée','Le corps a beaucoup récupéré','La vie sociale reprend normalement','Possible désir d\'un deuxième enfant ou pas du tout'],
    couple: ['Les discussions de fond reprennent (finances, logement)','Le couple est plus solide qu\'au début','La parentalité devient plus naturelle','La communication est plus fluide'],
    bebe: 'Mes premières purées ! Chaque goût est une découverte. Partagez ce moment en famille, c\'est précieux.',
    solutions: ['Faire un bilan de couple à mi-parcours.','Exprimer sa gratitude envers le partenaire.','Planifier un week-end en famille.','Discuter des objectifs communs pour l\'année.']
  },
  {
    num: 10, title: 'La complicité retrouvée',
    medical: 'Suivi de développement bébé. Évaluation globale maman.',
    maman: ['Se sent compétente dans son rôle de mère','La fatigue est gérable avec les bonnes habitudes','L\'image corporelle est mieux acceptée','La vie professionnelle et personnelle sont en harmonie'],
    couple: ['Le couple fonctionne comme une équipe','L\'intimité est rétablie ou en bonne voie','Les moments de qualité à deux sont réguliers','La communication est devenue une habitude'],
    bebe: 'Je bouge partout ! Votre maison est mon terrain de jeu. Jouez avec moi, c\'est le meilleur moment de ma journée.',
    solutions: ['Continuer les rituels de couple.','Prévoir un dîner romantique par mois.','Écrire une lettre d\'amour à son partenaire.','Rire ensemble au moins une fois par jour.']
  },
  {
    num: 11, title: 'Se projeter ensemble',
    medical: 'Bilan annuel bébé approche. Suivi gynécologique maman.',
    maman: ['Se sent épanouie dans sa nouvelle vie','Accepte les transformations de son corps','A développé une résilience impressionnante','Prête à relever de nouveaux défis'],
    couple: ['Les projets de couple sont clairs','La parentalité est une source de fierté commune','Le désir de renforcer le lien est mutuel','Les erreurs passées sont pardonnées'],
    bebe: 'Mes premiers pas approchent ! Votre encouragement est ma plus grande motivation.',
    solutions: ['Définir des objectifs de couple pour l\'année.','Planifier un voyage en famille.','Cultiver la reconnaissance quotidienne.','Rêver ensemble de l\'avenir.']
  },
  {
    num: 12, title: 'Un an déjà — Bilan et célébration',
    medical: 'Bilan pédiatrique annuel. Consultation gynécologique complète. Évaluation globale du couple.',
    maman: ['Fière du chemin parcouru','Le corps a trouvé un nouvel équilibre','L\'identité de femme-mère est construite','Prête pour la suite de l\'aventure'],
    couple: ['Le couple a traversé une tempête et en sort grandi','L\'amour a évolué et mûri','La parentalité est une force pour le couple','Les fondations sont solides pour l\'avenir'],
    bebe: 'Joyeux anniversaire ! Merci d\'avoir été les meilleurs parents du monde. Chaque jour avec vous est un cadeau.',
    solutions: ['Célébrer cette première année ensemble.','Écrire un bilan de gratitude à deux.','Se remémorer les moments clés de cette année.','S\'engager à continuer de communiquer et de s\'aimer.']
  }
];

let currentWeek = 0;
function renderSemaines() {
  const w = weeksData[currentWeek];
  const container = document.getElementById('semaines-content');
  container.innerHTML = `
    <div class="flex items-center gap-md mb-xl">
      <button class="top-bar__btn" onclick="navigateTo('home')"><span class="material-symbols-outlined">arrow_back</span></button>
      <h2 class="text-headline-sm">${t('sem_title')}</h2>
    </div>

    <!-- Week selector -->
    <div class="chips-scroll mb-xl" style="padding-bottom:4px;">
      ${weeksData.map((wk, i) => `
        <button class="chip ${i === currentWeek ? 'chip--filled' : 'chip--tonal'}" onclick="currentWeek=${i};renderSemaines();" style="min-width:48px;">S${wk.num}</button>
      `).join('')}
    </div>

    <div class="card mb-xl reveal" style="overflow:visible;">
      <div class="card__body">
        <span style="display:inline-block;background:var(--primary-container);color:var(--on-primary-container);padding:4px 14px;border-radius:var(--radius-full);font-size:12px;font-weight:700;letter-spacing:0.05em;margin-bottom:12px;">${t('sem_week')} ${w.num}</span>
        <h2 class="text-display-lg-mobile" style="margin-bottom:var(--space-xl);">${w.title}</h2>

        <!-- Suivi Médical -->
        <div style="background:var(--surface-container-low);border-radius:var(--radius-xl);padding:var(--space-xl);margin-bottom:var(--space-xl);border-left:4px solid var(--primary);">
          <h3 class="text-label-lg text-primary mb-md flex items-center gap-sm"><span class="material-symbols-outlined" style="font-size:18px;">medical_services</span> ${t('sem_medical')}</h3>
          <p class="text-body-md" style="line-height:1.7;">${w.medical}</p>
        </div>

        <!-- Pour la Maman -->
        <div style="background:rgba(196,69,105,0.06);border-radius:var(--radius-xl);padding:var(--space-xl);margin-bottom:var(--space-xl);border-left:4px solid var(--primary);">
          <h3 class="flex items-center gap-sm mb-lg" style="color:var(--primary);font-size:18px;font-weight:600;"><span>♀</span> ${t('sem_maman')}</h3>
          ${w.maman.map(m => `<div class="flex items-center gap-md mb-md"><span class="material-symbols-outlined" style="color:var(--primary);font-size:18px;">check_circle</span><span class="text-body-md">${m}</span></div>`).join('')}
        </div>

        <!-- Pour le Couple -->
        <div style="background:rgba(142,108,136,0.08);border-radius:var(--radius-xl);padding:var(--space-xl);margin-bottom:var(--space-xl);border-left:4px solid var(--secondary);">
          <h3 class="flex items-center gap-sm mb-lg" style="color:var(--secondary);font-size:18px;font-weight:600;"><span>♂♀</span> ${t('sem_couple')}</h3>
          ${w.couple.map(c => `<div class="flex items-center gap-md mb-md"><span class="material-symbols-outlined" style="color:var(--secondary);font-size:18px;">favorite</span><span class="text-body-md">${c}</span></div>`).join('')}
        </div>

        <!-- Message du Bébé -->
        <div style="background:rgba(212,107,80,0.08);border-radius:var(--radius-xl);padding:var(--space-xl);margin-bottom:var(--space-xl);border-left:4px solid var(--tertiary);">
          <h3 class="flex items-center gap-sm mb-md" style="color:var(--tertiary);font-size:18px;font-weight:600;"><span>👶</span> ${t('sem_bebe')}</h3>
          <p class="text-body-md" style="line-height:1.7;font-style:italic;">${w.bebe}</p>
        </div>

        <!-- Solutions Pratiques -->
        <div style="background:rgba(212,165,116,0.1);border-radius:var(--radius-xl);padding:var(--space-xl);border-left:4px solid #d4a574;">
          <h3 class="flex items-center gap-sm mb-lg" style="color:#d4a574;font-size:18px;font-weight:600;"><span>💡</span> ${t('sem_solutions')}</h3>
          ${w.solutions.map(s => `<div class="flex items-center gap-md mb-md"><span class="material-symbols-outlined" style="color:#d4a574;font-size:18px;">lightbulb</span><span class="text-body-md">${s}</span></div>`).join('')}
        </div>
      </div>
    </div>

    <!-- Navigation -->
    <div class="flex justify-between items-center" style="padding:var(--space-lg) 0;">
      <button class="btn btn--outline btn--sm" onclick="currentWeek=Math.max(0,currentWeek-1);renderSemaines();" ${currentWeek === 0 ? 'disabled style="opacity:0.3"' : ''}>${t('sem_prev')}</button>
      <span class="text-label-lg text-variant">${t('sem_week_of', { n: w.num })}</span>
      <button class="btn btn--outline btn--sm" onclick="currentWeek=Math.min(11,currentWeek+1);renderSemaines();" ${currentWeek === 11 ? 'disabled style="opacity:0.3"' : ''}>${t('sem_next')}</button>
    </div>
  `;
  setTimeout(() => initReveal(), 50);
}

// ══════════════════════════════════════════════════════════════
//  MODULE: JOURNAL DE BORD DU COUPLE
// ══════════════════════════════════════════════════════════════
let journalRole = 'maman';
let journalMood = null;
function getJournalEntries() {
  return JSON.parse(localStorage.getItem('nf_journal') || '[]');
}
function saveJournalEntry() {
  const need = document.getElementById('journal-need')?.value?.trim();
  const sweet = document.getElementById('journal-sweet')?.value?.trim();
  if (!journalMood) { alert(t('journal_select_mood')); return; }
  const entries = getJournalEntries();
  entries.unshift({
    role: journalRole,
    mood: journalMood,
    need: need || '',
    sweet: sweet || '',
    date: new Date().toISOString()
  });
  localStorage.setItem('nf_journal', JSON.stringify(entries));
  journalMood = null;
  renderJournal();
}
function renderJournal() {
  const container = document.getElementById('journal-content');
  const entries = getJournalEntries();
  const thisWeek = entries.filter(e => {
    const d = new Date(e.date);
    const now = new Date();
    return (now - d) < 7 * 24 * 60 * 60 * 1000;
  });
  const moods = ['❤️','🤩','😰','☀️','🤝'];
  container.innerHTML = `
    <div class="flex items-center gap-md mb-xl">
      <button class="top-bar__btn" onclick="navigateTo('home')"><span class="material-symbols-outlined">arrow_back</span></button>
      <h2 class="text-headline-sm">${t('journal_title')}</h2>
    </div>

    <!-- Espace d'Expression Banner -->
    <div class="reveal mb-xl" style="background:linear-gradient(135deg,rgba(196,69,105,0.1),rgba(142,108,136,0.1));border-radius:var(--radius-xl);padding:var(--space-xl);display:flex;align-items:center;gap:var(--space-lg);">
      <div style="width:56px;height:56px;border-radius:var(--radius-full);background:rgba(196,69,105,0.15);display:flex;align-items:center;justify-content:center;flex-shrink:0;"><span class="material-symbols-outlined text-primary" style="font-size:28px;">favorite</span></div>
      <div><h3 class="text-headline-sm" style="font-size:16px;">${t('journal_expression')}</h3><p class="text-body-md text-variant">${t('journal_expression_desc')}</p></div>
    </div>

    <div class="card mb-xl reveal">
      <div class="card__body">
        <div class="flex justify-between items-center mb-lg">
          <h3 class="text-headline-sm">${t('journal_our_journal')}</h3>
          <span style="background:var(--primary);color:white;padding:2px 10px;border-radius:var(--radius-full);font-size:10px;font-weight:700;">${t('journal_live')}</span>
        </div>

        <!-- Toggle Maman / Partenaire -->
        <div style="display:flex;border:2px solid var(--outline-variant);border-radius:var(--radius-full);overflow:hidden;margin-bottom:var(--space-xl);">
          <button style="flex:1;padding:12px;font-size:14px;font-weight:600;border:none;cursor:pointer;transition:all 0.2s;${journalRole==='maman'?'background:var(--primary-container);color:var(--on-primary-container);':'background:transparent;color:var(--on-surface-variant);'}" onclick="journalRole='maman';renderJournal();">${t('journal_maman')}</button>
          <button style="flex:1;padding:12px;font-size:14px;font-weight:600;border:none;cursor:pointer;transition:all 0.2s;${journalRole==='partenaire'?'background:var(--primary-container);color:var(--on-primary-container);':'background:transparent;color:var(--on-surface-variant);'}" onclick="journalRole='partenaire';renderJournal();">${t('journal_partner')}</button>
        </div>

        <!-- Mood -->
        <h4 class="text-label-lg mb-md" style="text-transform:uppercase;letter-spacing:0.08em;">${t('journal_today_feel')}</h4>
        <div class="mood-grid mb-xl">
          ${moods.map(m => `
            <button class="mood-option ${journalMood===m?'selected':''}" onclick="journalMood='${m}';document.querySelectorAll('.mood-option').forEach(b=>b.classList.remove('selected'));this.classList.add('selected');">
              <span class="mood-option__emoji">${m}</span>
            </button>
          `).join('')}
        </div>

        <!-- Need -->
        <h4 class="text-label-lg mb-md" style="text-transform:uppercase;letter-spacing:0.08em;">${t('journal_need')}</h4>
        <textarea id="journal-need" class="form-input mb-xl" rows="3" placeholder="${t('journal_need_placeholder')}" style="resize:none;"></textarea>

        <!-- Sweet word -->
        <h4 class="text-label-lg mb-md" style="text-transform:uppercase;letter-spacing:0.08em;">${t('journal_sweet')}</h4>
        <textarea id="journal-sweet" class="form-input mb-xl" rows="3" placeholder="${t('journal_sweet_placeholder')}" style="resize:none;"></textarea>

        <!-- Save -->
        <button class="btn btn--primary btn--full" onclick="saveJournalEntry()">${t('journal_save')}</button>
      </div>
    </div>

    <!-- Saved notes -->
    <div class="card card--flat reveal">
      <div class="card__body">
        <h4 class="text-label-lg text-primary mb-lg" style="text-transform:uppercase;letter-spacing:0.08em;">${t('journal_saved_notes')}</h4>
        ${thisWeek.length > 0 ? thisWeek.map(e => `
          <div style="padding:var(--space-lg);background:var(--surface-container-low);border-radius:var(--radius-xl);margin-bottom:var(--space-md);border-left:4px solid ${e.role==='maman'?'var(--primary)':'var(--secondary)'};">
            <div class="flex justify-between items-center mb-sm">
              <span class="text-label-lg">${e.mood} ${e.role === 'maman' ? t('journal_maman') : t('journal_partner')}</span>
              <span class="text-label-md text-variant">${new Date(e.date).toLocaleDateString('fr-FR')}</span>
            </div>
            ${e.need ? `<p class="text-body-md mb-sm"><strong>${t('journal_need_label')} :</strong> ${e.need}</p>` : ''}
            ${e.sweet ? `<p class="text-body-md" style="color:var(--primary);font-style:italic;">💕 ${e.sweet}</p>` : ''}
          </div>
        `).join('') : `<p class="text-body-md text-variant text-center" style="font-style:italic;">${t('journal_no_notes')}</p>`}
      </div>
    </div>
  `;
  setTimeout(() => initReveal(), 50);
}

// ══════════════════════════════════════════════════════════════
//  MODULE: ÉCHELLES CLINIQUES PISQ-12 & RAS
// ══════════════════════════════════════════════════════════════
const pisq12Questions = [
  'Ressentez-vous du désir sexuel (envie d\'avoir des rapports ou des moments intimes) ?',
  'Atteignez-vous l\'orgasme lors des rapports ou activités intimes ?',
  'Ressentez-vous de la satisfaction physique après vos rapports ?',
  'Êtes-vous satisfaite de la variété de votre activité sexuelle ?',
  'Ressentez-vous de la douleur pendant les rapports sexuels ?',
  'Souffrez-vous d\'incontinence urinaire pendant les rapports ?',
  'Évitez-vous les rapports sexuels par peur de la douleur ?',
  'Ressentez-vous de la gêne ou de la honte concernant votre corps ?',
  'Avez-vous des émotions négatives pendant les rapports (culpabilité, tristesse) ?',
  'Votre partenaire est-il compréhensif et patient concernant votre sexualité ?',
  'Êtes-vous satisfaite de la fréquence de vos rapports sexuels ?',
  'Considérez-vous que votre vie sexuelle est globalement satisfaisante ?'
];
const rasQuestions = [
  'Mon/Ma partenaire répond à mes besoins affectifs.',
  'Je suis satisfait(e) de notre relation.',
  'Notre relation est aussi bonne que les autres.',
  'Je souhaite souvent ne pas m\'être engagé(e) dans cette relation.',
  'Notre relation répond à mes attentes initiales.',
  'Je suis amoureux(se) de mon/ma partenaire.',
  'Il y a peu de problèmes dans notre relation.'
];
const freqLabels = () => [t('scales_never'), t('scales_rarely'), t('scales_sometimes'), t('scales_frequently'), t('scales_always')];

let currentScale = 'pisq12';
let scaleAnswers = {};

function renderEchelles() {
  const container = document.getElementById('echelles-content');
  const questions = currentScale === 'pisq12' ? pisq12Questions : rasQuestions;
  const maxScore = currentScale === 'pisq12' ? 48 : 28;
  const answeredCount = Object.keys(scaleAnswers).filter(k => k.startsWith(currentScale)).length;
  const totalScore = Object.keys(scaleAnswers).filter(k => k.startsWith(currentScale)).reduce((sum, k) => sum + scaleAnswers[k], 0);
  const allAnswered = answeredCount === questions.length;

  let diagnosis = '';
  let diagClass = '';
  let diagDetail = '';

  const diagTexts = {
    pisq12: {
      low: 'حياتك الجنسية الحالية مصدر معاناة أو قلق. لا تبقي صامتة. توجد حلول بسيطة (إعادة تأهيل العجان، علاج الجفاف). نشجعك على التحدث مع القابلة أو المختص.',
      mod: 'حياتك الجنسية تتعافى تدريجياً. بعض الجوانب لا تزال صعبة لكنك على الطريق الصحيح. الصبر والتواصل مع الشريك ضروريان.',
      good: 'حياتك الجنسية بعد الولادة جيدة! واصلي التواصل مع شريكك والعناية بنفسك.',
      excellent: 'تهانينا! حياتك الجنسية مزدهرة. واصلي تعزيز هذا التناغم مع شريكك.'
    },
    ras: {
      low: 'رضاك الزوجي يبدو هشاً. سيكون مفيداً مناقشة الأمر مع الشريك أو مختص لاستعادة التوازن.',
      mod: 'علاقتك تمر بتعديلات طبيعية. التواصل الطيب هو المفتاح لتقوية الرابط بينكما.',
      good: 'علاقتكما تبدو متينة! واصلا تخصيص وقت لكما.',
      excellent: 'علاقتكما مزدهرة جداً! وجدتما توازناً جميلاً.'
    }
  };

  if (answeredCount > 0) {
    const pct = totalScore / maxScore * 100;
    if (pct <= 37) { diagnosis = `${t('scales_low')} (${totalScore}/${maxScore})`; diagClass = 'color:var(--error);'; diagDetail = diagTexts[currentScale].low; }
    else if (pct <= 62) { diagnosis = `${t('scales_moderate')} (${totalScore}/${maxScore})`; diagClass = 'color:#d4a574;'; diagDetail = diagTexts[currentScale].mod; }
    else if (pct <= 87) { diagnosis = `${t('scales_good')} (${totalScore}/${maxScore})`; diagClass = 'color:var(--secondary);'; diagDetail = diagTexts[currentScale].good; }
    else { diagnosis = `${t('scales_excellent')} (${totalScore}/${maxScore})`; diagClass = 'color:var(--primary);'; diagDetail = diagTexts[currentScale].excellent; }
  }

  container.innerHTML = `
    <div class="flex items-center gap-md mb-xl">
      <button class="top-bar__btn" onclick="navigateTo('home')"><span class="material-symbols-outlined">arrow_back</span></button>
      <h2 class="text-headline-sm">${t('scales_title')}</h2>
    </div>

    <!-- Header -->
    <div class="reveal text-center mb-xl" style="background:linear-gradient(135deg,rgba(196,69,105,0.08),rgba(142,108,136,0.05));border-radius:var(--radius-xl);padding:var(--space-2xl);">
      <span style="display:inline-block;background:var(--primary);color:white;padding:4px 16px;border-radius:var(--radius-full);font-size:11px;font-weight:700;letter-spacing:0.08em;margin-bottom:12px;">${t('scales_tools')}</span>
      <h2 class="text-display-lg-mobile mb-sm">${t('scales_measure')}</h2>
      <p class="text-body-md text-variant">${t('scales_desc')}</p>
    </div>

    <!-- Scale toggle -->
    <div style="display:flex;gap:var(--space-md);margin-bottom:var(--space-xl);" class="reveal">
      <button style="flex:1;padding:14px;border-radius:var(--radius-xl);font-size:14px;font-weight:700;cursor:pointer;transition:all 0.2s;border:2px solid ${currentScale==='pisq12'?'var(--primary)':'var(--outline-variant)'};${currentScale==='pisq12'?'background:var(--primary);color:white;':'background:transparent;color:var(--on-surface);'}" onclick="currentScale='pisq12';scaleAnswers={};renderEchelles();">${t('scales_pisq12_title')}<br><span style="font-size:11px;font-weight:400;">${t('scales_pisq12_sub')}</span></button>
      <button style="flex:1;padding:14px;border-radius:var(--radius-xl);font-size:14px;font-weight:700;cursor:pointer;transition:all 0.2s;border:2px solid ${currentScale==='ras'?'var(--primary)':'var(--outline-variant)'};${currentScale==='ras'?'background:var(--primary);color:white;':'background:transparent;color:var(--on-surface);'}" onclick="currentScale='ras';scaleAnswers={};renderEchelles();">${t('scales_ras_title')}<br><span style="font-size:11px;font-weight:400;">${t('scales_ras_sub')}</span></button>
    </div>

    <!-- Score display -->
    <div class="card mb-xl reveal">
      <div class="card__body text-center">
        <h3 class="text-label-lg text-variant mb-md" style="text-transform:uppercase;">${t('scales_current_score')}</h3>
        <div class="text-display-lg text-primary" style="font-size:56px;font-weight:800;">${totalScore}</div>
        <p class="text-body-md text-variant">${t('scales_out_of', { max: maxScore, answered: answeredCount, total: questions.length })}</p>
        <div style="margin-top:12px;height:8px;background:var(--surface-container-high);border-radius:4px;overflow:hidden;">
          <div style="width:${(answeredCount/questions.length)*100}%;height:100%;background:${allAnswered?'var(--primary)':'var(--secondary)'};border-radius:4px;transition:width 0.3s;"></div>
        </div>
        <p class="text-label-md mt-sm" style="${allAnswered?'color:var(--primary);':'color:var(--on-surface-variant);'}">${allAnswered ? '✅ ' + t('scales_all_answered') : '⏳ ' + t('scales_remaining', { n: questions.length - answeredCount })}</p>
      </div>
    </div>

    ${diagnosis ? `
    <div class="card card--flat mb-xl reveal" id="scale-result">
      <div class="card__body">
        <h4 class="text-label-lg text-variant mb-md" style="text-transform:uppercase;">${t('scales_diag')}</h4>
        ${!allAnswered ? '<p class="text-body-sm text-variant mb-md" style="font-style:italic;">⚠️ ' + t('scales_partial_warning') + '</p>' : ''}
        <div style="padding:var(--space-xl);background:var(--surface-container-low);border-radius:var(--radius-xl);border-left:4px solid var(--primary);">
          <h4 style="font-weight:700;${diagClass}margin-bottom:8px;">${diagnosis}</h4>
          <p class="text-body-md" style="line-height:1.7;">${diagDetail}</p>
        </div>
      </div>
    </div>` : ''}

    <!-- Questions -->
    <div class="card mb-xl reveal">
      <div class="card__body">
        <h3 class="text-headline-sm mb-lg">${currentScale === 'pisq12' ? t('scales_pisq12_q_title') : t('scales_ras_q_title')}</h3>
        <p class="text-body-md text-variant mb-xl">${t('scales_instruction')}</p>
        ${questions.map((q, i) => {
          const answered = scaleAnswers[currentScale+'_'+i] !== undefined;
          return `
          <div style="padding:var(--space-xl);background:${answered ? 'rgba(163,217,200,0.08)' : 'var(--surface-container-low)'};border-radius:var(--radius-xl);margin-bottom:var(--space-lg);border:2px solid ${answered ? 'rgba(163,217,200,0.3)' : 'transparent'};transition:all 0.2s;">
            <p class="text-body-lg text-semibold mb-lg">${i+1}. ${q} ${answered ? '<span style="color:var(--secondary);">✓</span>' : ''}</p>
            <div style="display:flex;flex-wrap:wrap;gap:var(--space-sm);">
              ${freqLabels().map((label, val) => `
                <button style="padding:8px 16px;border-radius:var(--radius-full);font-size:13px;font-weight:500;cursor:pointer;transition:all 0.2s;border:2px solid ${scaleAnswers[currentScale+'_'+i]===val?'var(--primary)':'var(--outline-variant)'};${scaleAnswers[currentScale+'_'+i]===val?'background:var(--primary);color:white;':'background:transparent;color:var(--on-surface);'}"
                  onclick="scaleAnswers['${currentScale}_${i}']=${val};renderEchelles();">${label}</button>
              `).join('')}
            </div>
          </div>`;
        }).join('')}
      </div>
    </div>

    <!-- Actions -->
    <div class="flex flex-col gap-md mb-xl reveal">
      <button class="btn btn--primary btn--full" onclick="calculateScale();" ${answeredCount === 0 ? 'disabled style="opacity:0.5;"' : ''}>${t('scales_calculate')}</button>
      <button class="btn btn--outline btn--full" onclick="scaleAnswers={};renderEchelles();">${t('scales_reset')}</button>
    </div>

    <!-- Privacy note -->
    <div class="reveal" style="background:rgba(196,69,105,0.05);border-radius:var(--radius-xl);padding:var(--space-xl);">
      <p class="text-body-md"><span style="font-size:16px;">🔒</span> <strong>${t('scales_privacy')}</strong> ${t('scales_privacy_text')}</p>
    </div>
  `;
  setTimeout(() => initReveal(), 50);
}

function calculateScale() {
  const questions = currentScale === 'pisq12' ? pisq12Questions : rasQuestions;
  const answeredCount = Object.keys(scaleAnswers).filter(k => k.startsWith(currentScale)).length;
  if (answeredCount === 0) return;
  renderEchelles();
  setTimeout(() => {
    const result = document.getElementById('scale-result');
    if (result) result.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, 100);
}

// ══════════════════════════════════════════════════════════════
//  MODULE: COIN TUNISIEN ("BIL TOUNSI")
// ══════════════════════════════════════════════════════════════
const tounsiParoles = [
  { ar: 'يا عيني عليك، كي تعبت وما قلتلي', fr: 'Mon cœur, tu étais fatigué(e) et tu ne m\'as rien dit.' },
  { ar: 'ربي يخليلي إياك، أنت عمود الدار', fr: 'Que Dieu me te garde, tu es le pilier de notre foyer.' },
  { ar: 'ما تحملش الهمّ وحدك، أنا معاك', fr: 'Ne porte pas le fardeau seul(e), je suis avec toi.' },
  { ar: 'كل ما نشوفك مع صغيرنا، قلبي يطير', fr: 'Chaque fois que je te vois avec notre petit, mon cœur s\'envole.' },
  { ar: 'أنا فخور(ة) بيك، تعرف(ي) هاذا ولا لا ؟', fr: 'Je suis fier/fière de toi, tu le sais ça ?' },
  { ar: 'شكرًا على صبرك معايا، ربي يعطيك الصحة', fr: 'Merci pour ta patience avec moi, que Dieu te donne la santé.' },
  { ar: 'حتى كان الليل طويل، مع بعضنا نقدرو', fr: 'Même si la nuit est longue, ensemble on peut tout.' },
  { ar: 'إنت أحسن هدية جابهالي ربي', fr: 'Tu es le plus beau cadeau que Dieu m\'a donné.' },
  { ar: 'نحبك كيما نحب الحياة', fr: 'Je t\'aime comme j\'aime la vie.' },
  { ar: 'ما تنساش روحك، أنا هنا باش نعاونك', fr: 'N\'oublie pas de prendre soin de toi, je suis là pour t\'aider.' }
];

const nefssaRecipes = [
  { name: 'La Bsissa Tunisienne (البسيسة)', desc: 'Une mine d\'or nutritionnelle faite de blé moulu, d\'orge, de pois chiche et d\'épices (marjolaine, coriandre). Elle donne de l\'énergie rapide à la maman fatiguée et favorise une bonne lactation.', icon: '🌾' },
  { name: 'La Chamia (Halva de sésame)', desc: 'Riche en calcium et en bons lipides de sésame, la chamia est traditionnellement offerte à la maman pour l\'aider à récupérer et stimuler la production de lait.', icon: '🍯' },
  { name: 'Le Droo (الدرع)', desc: 'Bouillie de sorgho enrichie de miel et de beurre, le droo est un incontournable post-partum en Tunisie. Il réchauffe le corps et apporte des glucides complexes.', icon: '🥣' },
  { name: 'Les Dattes et le Lait (تمر و حليب)', desc: 'Combinaison ancestrale riche en fer, potassium et protéines. Les dattes combattent l\'anémie fréquente après l\'accouchement.', icon: '🥛' },
  { name: 'La Chorba Frik (شربة فريك)', desc: 'Soupe de blé vert concassé, riche en fibres et vitamines. Elle aide à la récupération digestive et à l\'hydratation de la maman.', icon: '🍲' }
];

const tounsiArticles = [
  { badge: 'RÔLE ESSENTIEL', title: 'Le Suivi de la Sage-femme', content: 'En Tunisie, votre sage-femme est votre plus proche alliée. Elle ne s\'occupe pas uniquement des pansements ou du bébé : elle est formée pour écouter vos baisses de moral (baby blues), détecter la dépression post-partum et guider la reprise en douceur de votre intimité conjugale.' },
  { badge: 'ACCEPTATION', title: 'Image du Corps après Bébé', content: 'Le corps a mis 9 mois à fabriquer la vie, il lui faudra au moins autant de temps pour s\'en remettre. Évitez les comparaisons avec les images de perfection sur les réseaux sociaux. Discutez de vos gênes ou douleurs physiques avec votre sage-femme.' },
  { badge: 'SOIN PHYSIQUE', title: 'Incontinence & Périnée', content: 'Les petites fuites urinaires après un accouchement ne sont pas une honte. C\'est le signe d\'un périnée fatigué. La rééducation périnéale, entamée après la consultation du J40, est cruciale pour restaurer le confort physique et redonner confiance lors des rapports intimes.' }
];

let currentParole = Math.floor(Math.random() * tounsiParoles.length);

function renderTounsi() {
  const container = document.getElementById('tounsi-content');
  const p = tounsiParoles[currentParole];
  container.innerHTML = `
    <div class="flex items-center gap-md mb-xl">
      <button class="top-bar__btn" onclick="navigateTo('home')"><span class="material-symbols-outlined">arrow_back</span></button>
      <h2 class="text-headline-sm">${t('tounsi_title')}</h2>
    </div>

    <!-- Header -->
    <div class="reveal text-center mb-xl" style="background:linear-gradient(135deg,rgba(212,165,116,0.15),rgba(196,69,105,0.05));border-radius:var(--radius-xl);padding:var(--space-2xl);">
      <span style="display:inline-block;background:#d4a574;color:white;padding:4px 16px;border-radius:var(--radius-full);font-size:11px;font-weight:700;letter-spacing:0.08em;margin-bottom:12px;">${t('tounsi_wisdom')}</span>
      <h2 class="text-display-lg-mobile mb-sm">${t('tounsi_main_title')}</h2>
      <p class="text-body-md text-variant">${t('tounsi_main_desc')}</p>
    </div>

    <!-- Paroles Chaleureuses -->
    <div class="card mb-xl reveal">
      <div class="card__body">
        <div class="flex items-center gap-sm mb-lg">
          <span style="font-size:20px;">✨</span>
          <h3 style="font-size:16px;font-weight:700;">${t('tounsi_paroles_title')} — <span style="color:var(--primary);">${t('tounsi_paroles_ar')}</span></h3>
        </div>
        <h3 class="text-headline-sm mb-md">${t('tounsi_generator')}</h3>
        <p class="text-body-md text-variant mb-xl">${t('tounsi_generator_desc')}</p>

        <div style="background:linear-gradient(135deg,rgba(196,69,105,0.08),rgba(212,165,116,0.1));border-radius:var(--radius-xl);padding:var(--space-2xl);text-align:center;margin-bottom:var(--space-xl);">
          <p style="font-size:22px;font-weight:700;color:var(--on-surface);line-height:1.6;margin-bottom:12px;direction:rtl;">" ${p.ar} "</p>
          <p class="text-body-md text-variant" style="font-style:italic;">${p.fr}</p>
        </div>

        <button class="btn btn--primary btn--full" onclick="currentParole=Math.floor(Math.random()*tounsiParoles.length);renderTounsi();">
          <span class="material-symbols-outlined" style="font-size:20px;margin-right:8px;">refresh</span> ${t('tounsi_generate_btn')}
        </button>
      </div>
    </div>

    <!-- Diététique d'El Nefsa -->
    <div class="card mb-xl reveal">
      <div class="card__body">
        <div class="flex items-center gap-md mb-xl">
          <div style="width:48px;height:48px;border-radius:var(--radius-full);background:rgba(212,165,116,0.2);display:flex;align-items:center;justify-content:center;"><span style="font-size:24px;">🫖</span></div>
          <div>
            <h3 class="text-headline-sm" style="font-size:16px;">${t('tounsi_nefsa_title')}</h3>
            <p class="text-label-lg" style="color:#d4a574;text-transform:uppercase;">${t('tounsi_nefsa_sub')}</p>
          </div>
        </div>

        ${nefssaRecipes.map((r, i) => `
          <div style="display:flex;gap:var(--space-lg);padding:var(--space-xl);${i < nefssaRecipes.length - 1 ? 'border-bottom:1px solid var(--outline-variant);margin-bottom:var(--space-lg);' : ''}">
            <div style="width:40px;height:40px;border-radius:var(--radius-full);background:rgba(212,165,116,0.15);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:20px;color:#d4a574;font-weight:800;">${i+1}</div>
            <div>
              <h4 class="text-body-lg text-semibold mb-sm">${r.name}</h4>
              <p class="text-body-md text-variant" style="line-height:1.7;">${r.desc}</p>
            </div>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- Articles bien-être -->
    <h3 class="text-label-lg text-primary mb-lg reveal" style="text-transform:uppercase;letter-spacing:0.1em;">${t('tounsi_articles')}</h3>
    ${tounsiArticles.map(a => `
      <div class="card card--flat mb-lg reveal">
        <div class="card__body">
          <span style="display:inline-block;background:rgba(196,69,105,0.1);color:var(--primary);padding:3px 12px;border-radius:var(--radius-full);font-size:10px;font-weight:700;letter-spacing:0.06em;margin-bottom:12px;">${a.badge}</span>
          <h3 class="text-headline-sm mb-md" style="font-size:18px;">${a.title}</h3>
          <p class="text-body-md text-variant" style="line-height:1.7;">${a.content}</p>
        </div>
      </div>
    `).join('')}

    <!-- Footer -->
    <div class="reveal text-center mt-xl mb-xl" style="padding:var(--space-2xl);opacity:0.7;">
      <p class="text-body-md text-semibold">${t('tounsi_footer')}</p>
      <p class="text-body-md text-variant" style="margin-top:4px;">${t('tounsi_footer_sub')}</p>
    </div>
  `;
  setTimeout(() => initReveal(), 50);
}

// ══════════════════════════════════════════════════════════════
//  HELPERS
// ══════════════════════════════════════════════════════════════
function capitalize(str) { return str.charAt(0).toUpperCase() + str.slice(1); }
function getTimeAgo(date) {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return t('misc_just_now');
  if (diff < 3600) return t('misc_ago_min', { n: Math.floor(diff / 60) });
  if (diff < 86400) return t('misc_ago_hours', { n: Math.floor(diff / 3600) });
  const days = Math.floor(diff / 86400);
  if (days === 1) return t('misc_yesterday');
  return t('misc_ago_days', { n: days });
}
