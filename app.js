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
  if (!res.ok) throw new Error(data.error || 'Erreur serveur');
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

// ── Questionnaire Data ──
const questionnaires = {
  psychologique: {
    title: 'Bien-être Psychologique',
    icon: 'psychology',
    color: 'var(--secondary)',
    questions: [
      { q: 'Comment évaluez-vous votre niveau de stress cette semaine ?', hint: 'Pensez aux moments de tension ou d\'inquiétude.' },
      { q: 'Avez-vous ressenti de la fatigue excessive ces derniers jours ?', hint: 'Fatigue physique et/ou mentale liée à la parentalité.' },
      { q: 'Comment décririez-vous votre humeur générale ?', hint: 'Réfléchissez à votre état émotionnel global.' },
      { q: 'Vous sentez-vous anxieux(se) face aux responsabilités parentales ?', hint: 'L\'inquiétude liée à votre rôle de parent.' },
      { q: 'Arrivez-vous à vous adapter aux changements depuis l\'arrivée de bébé ?', hint: 'Votre capacité à gérer la nouvelle routine.' },
      { q: 'Avez-vous eu des moments de découragement ?', hint: 'Sentiment de ne pas y arriver.' },
      { q: 'Vous accordez-vous du temps pour vous-même ?', hint: 'Moments de détente, loisirs, repos.' },
      { q: 'Dormez-vous suffisamment pour vous sentir reposé(e) ?', hint: 'Qualité et durée de votre sommeil.' },
      { q: 'Avez-vous le sentiment de contrôler votre quotidien ?', hint: 'Sentiment de maîtrise sur votre vie.' },
      { q: 'Vous sentez-vous soutenu(e) émotionnellement ?', hint: 'Soutien famille, amis, partenaire.' }
    ]
  },
  conjugal: {
    title: 'Relation Conjugale',
    icon: 'favorite',
    color: 'var(--primary)',
    questions: [
      { q: 'Comment évaluez-vous votre communication avec votre partenaire ?', hint: 'Vos échanges au cours des 7 derniers jours.' },
      { q: 'Vous sentez-vous soutenu(e) par votre partenaire ?', hint: 'Soutien pratique et émotionnel.' },
      { q: 'Avez-vous vécu des conflits ou des désaccords ?', hint: 'Tensions, disputes, malentendus.' },
      { q: 'Êtes-vous satisfait(e) de votre relation de couple ?', hint: 'Satisfaction globale.' },
      { q: 'Avez-vous passé du temps de qualité ensemble ?', hint: 'Moments partagés sans obligations parentales.' },
      { q: 'Partagez-vous équitablement les tâches parentales ?', hint: 'Répartition des soins et tâches.' },
      { q: 'Exprimez-vous facilement vos besoins ?', hint: 'Communication ouverte sur vos attentes.' },
      { q: 'Vous sentez-vous écouté(e) par votre partenaire ?', hint: 'Attention et compréhension.' },
      { q: 'Avez-vous partagé des moments de joie ensemble ?', hint: 'Complicité et bonheur partagé.' },
      { q: 'Ressentez-vous de la complicité avec votre partenaire ?', hint: 'Connexion et unité.' }
    ]
  },
  sexuel: {
    title: 'Vie Intime Post-Partum',
    icon: 'diversity_3',
    color: 'var(--tertiary)',
    questions: [
      { q: 'Ressentez-vous du désir pour votre partenaire ?', hint: 'Attraction et envie d\'intimité.' },
      { q: 'Êtes-vous satisfait(e) de votre vie intime actuelle ?', hint: 'Niveau de satisfaction.' },
      { q: 'Communiquez-vous ouvertement sur votre sexualité ?', hint: 'Capacité à aborder le sujet.' },
      { q: 'Avez-vous rencontré des difficultés physiques ?', hint: 'Douleurs, inconfort, changements.' },
      { q: 'Ressentez-vous de l\'appréhension ou de la douleur ?', hint: 'Craintes liées à la reprise.' },
      { q: 'Vous sentez-vous à l\'aise avec votre corps ?', hint: 'Image corporelle post-partum.' },
      { q: 'Avez-vous eu des moments d\'intimité non sexuelle ?', hint: 'Câlins, caresses, tendresse.' },
      { q: 'La fatigue affecte-t-elle votre vie intime ?', hint: 'Impact de l\'épuisement.' },
      { q: 'Avez-vous discuté de contraception ?', hint: 'Communication sur la prévention.' },
      { q: 'Vous sentez-vous désirable ?', hint: 'Sentiment d\'être attirant(e).' }
    ]
  }
};

const likertOptions = [
  { label: 'Jamais', value: 1 },
  { label: 'Rarement', value: 2 },
  { label: 'Parfois', value: 3 },
  { label: 'Souvent', value: 4 },
  { label: 'Toujours', value: 5 }
];

const sageFemmeTips = [
  { cat: 'post-partum', icon: 'medical_services', title: 'Récupération post-partum', text: 'Les premières semaines sont cruciales. Accordez-vous du repos, écoutez votre corps. Les lochies durent 4 à 6 semaines. Consultez si fièvre ou douleurs intenses.' },
  { cat: 'allaitement', icon: 'breastfeeding', title: 'Allaitement maternel', text: 'Mise au sein dans la première heure. Allaitez à la demande. Si douleurs, vérifiez la position et la prise du sein. Demandez l\'aide d\'une consultante.' },
  { cat: 'contraception', icon: 'medication', title: 'Contraception post-partum', text: 'Reprise possible dès 21 jours. Options : DIU, pilule progestative, implant. L\'allaitement exclusif n\'est PAS une contraception fiable.' },
  { cat: 'sexualite', icon: 'favorite', title: 'Reprise de la sexualité', text: 'Pas de délai obligatoire. Sécheresse vaginale normale. Utilisez un lubrifiant. Communiquez avec votre partenaire.' },
  { cat: 'alerte', icon: 'warning', title: 'Signes d\'alerte ⚠️', text: 'Consultez immédiatement si : fièvre >38°C, saignements abondants, douleur intense, tristesse >2 semaines, pensées sombres, difficultés d\'attachement au bébé.' },
  { cat: 'post-partum', icon: 'self_improvement', title: 'Baby blues vs Dépression', text: 'Baby blues (J3-J10) : normal, passager. Dépression post-partum (>2 semaines) : tristesse profonde, perte d\'intérêt. Parlez-en à un professionnel.' },
  { cat: 'allaitement', icon: 'local_hospital', title: 'Engorgement mammaire', text: 'Fréquent vers J3-J5. Compresses chaudes avant tétée, froides après. Massage sous la douche. Allaitez fréquemment.' },
  { cat: 'post-partum', icon: 'fitness_center', title: 'Rééducation périnéale', text: 'Recommandée après tout accouchement, dès 6-8 semaines. Prévient l\'incontinence et améliore le confort intime.' }
];

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

  // Auth and questionnaire screens hide shell
  const hideShell = ['auth', 'questionnaire'].includes(screenId);
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
      <h1 class="text-display-lg-mobile text-primary mt-lg">NurtureFlow</h1>
      <p class="text-body-lg text-variant mt-sm">De la conjugalité à la parentalité</p>
    </div>
    <div id="auth-error" class="mb-lg" style="display:none;"></div>
    <div class="space-y-lg">
      <div>
        <label class="text-label-lg text-variant" style="display:block;margin-bottom:6px;">Email</label>
        <input type="email" id="login-email" value="admin@nurtureflow.com"
          style="width:100%;padding:16px;background:var(--surface-container-low);border:1px solid var(--outline-variant);border-radius:var(--radius-xl);font-size:16px;color:var(--on-surface);outline:none;">
      </div>
      <div>
        <label class="text-label-lg text-variant" style="display:block;margin-bottom:6px;">Mot de passe</label>
        <input type="password" id="login-password" value="admin"
          style="width:100%;padding:16px;background:var(--surface-container-low);border:1px solid var(--outline-variant);border-radius:var(--radius-xl);font-size:16px;color:var(--on-surface);outline:none;">
      </div>
      <button class="btn btn--primary btn--full mt-xl" onclick="doLogin()">
        <span class="material-symbols-outlined">login</span> Se connecter
      </button>
      <div class="text-center mt-xl">
        <p class="text-body-md text-variant">Pas encore de compte ?</p>
        <button class="text-primary text-semibold mt-sm" style="font-size:16px;" onclick="showRegister()">
          Créer un compte couple
        </button>
      </div>
    </div>
  `;
}

function showRegister() {
  const c = document.getElementById('auth-content');
  c.innerHTML = `
    <div class="flex items-center gap-md mb-xl" style="padding-top:20px;">
      <button class="top-bar__btn" onclick="showLogin()"><span class="material-symbols-outlined">arrow_back</span></button>
      <h2 class="text-headline-sm text-primary">Créer votre espace couple</h2>
    </div>
    <div id="auth-error" class="mb-lg" style="display:none;"></div>

    <h3 class="text-label-lg text-primary mb-md" style="text-transform:uppercase;letter-spacing:0.08em;">
      <span class="material-symbols-outlined" style="font-size:16px;vertical-align:middle;">person</span> PARTENAIRE 1
    </h3>
    <div class="space-y-md mb-xl">
      <input type="text" id="reg-name1" placeholder="Prénom" class="form-input">
      <input type="email" id="reg-email" placeholder="Email" class="form-input">
      <div class="grid-2">
        <input type="number" id="reg-age1" placeholder="Âge" class="form-input">
        <select id="reg-sex1" class="form-input"><option value="Femme">Femme</option><option value="Homme">Homme</option></select>
      </div>
    </div>

    <h3 class="text-label-lg text-secondary mb-md" style="text-transform:uppercase;letter-spacing:0.08em;">
      <span class="material-symbols-outlined" style="font-size:16px;vertical-align:middle;">person</span> PARTENAIRE 2
    </h3>
    <div class="space-y-md mb-xl">
      <input type="text" id="reg-name2" placeholder="Prénom" class="form-input">
      <div class="grid-2">
        <input type="number" id="reg-age2" placeholder="Âge" class="form-input">
        <select id="reg-sex2" class="form-input"><option value="Homme">Homme</option><option value="Femme">Femme</option></select>
      </div>
    </div>

    <h3 class="text-label-lg text-variant mb-md" style="text-transform:uppercase;letter-spacing:0.08em;">
      <span class="material-symbols-outlined" style="font-size:16px;vertical-align:middle;">family_restroom</span> INFORMATIONS COUPLE
    </h3>
    <div class="space-y-md mb-xl">
      <input type="text" id="reg-marriage" placeholder="Durée du mariage (ex: 3 ans)" class="form-input">
      <input type="text" id="reg-baby" placeholder="Âge du bébé (ex: 4 mois)" class="form-input">
    </div>

    <h3 class="text-label-lg text-variant mb-md" style="text-transform:uppercase;letter-spacing:0.08em;">
      <span class="material-symbols-outlined" style="font-size:16px;vertical-align:middle;">lock</span> SÉCURITÉ
    </h3>
    <div class="space-y-md mb-xl">
      <input type="password" id="reg-password" placeholder="Mot de passe (min 4 caractères)" class="form-input">
      <input type="password" id="reg-password2" placeholder="Confirmer le mot de passe" class="form-input">
    </div>

    <button class="btn btn--primary btn--full" onclick="doRegister()">
      <span class="material-symbols-outlined">how_to_reg</span> Créer le compte
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
  if (!email || !password) return showAuthError('Veuillez remplir tous les champs');
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
  if (password !== password2) return showAuthError('Les mots de passe ne correspondent pas');

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

  if (!body.partner1_name || !body.partner1_email || !password) return showAuthError('Nom, email et mot de passe sont obligatoires');

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
        <h2 class="text-headline-sm text-primary">Créer un nouveau couple</h2>
        <p class="text-body-md text-variant">Enregistrer un couple dans la base</p>
      </div>
    </div>

    <div id="new-couple-msg" class="mb-lg" style="display:none;"></div>

    <div class="card card--flat mb-xl"><div class="card__body">
      <h3 class="text-label-lg text-primary mb-md" style="text-transform:uppercase;letter-spacing:0.08em;">
        <span class="material-symbols-outlined" style="font-size:16px;vertical-align:middle;">person</span> PARTENAIRE 1
      </h3>
      <div class="space-y-md">
        <input type="text" id="nc-name1" placeholder="Prénom" class="form-input">
        <input type="email" id="nc-email" placeholder="Email" class="form-input">
        <div class="grid-2">
          <input type="number" id="nc-age1" placeholder="Âge" class="form-input">
          <select id="nc-sex1" class="form-input"><option value="Femme">Femme</option><option value="Homme">Homme</option></select>
        </div>
      </div>
    </div></div>

    <div class="card card--flat mb-xl"><div class="card__body">
      <h3 class="text-label-lg text-secondary mb-md" style="text-transform:uppercase;letter-spacing:0.08em;">
        <span class="material-symbols-outlined" style="font-size:16px;vertical-align:middle;">person</span> PARTENAIRE 2
      </h3>
      <div class="space-y-md">
        <input type="text" id="nc-name2" placeholder="Prénom" class="form-input">
        <div class="grid-2">
          <input type="number" id="nc-age2" placeholder="Âge" class="form-input">
          <select id="nc-sex2" class="form-input"><option value="Homme">Homme</option><option value="Femme">Femme</option></select>
        </div>
      </div>
    </div></div>

    <div class="card card--flat mb-xl"><div class="card__body">
      <h3 class="text-label-lg text-variant mb-md" style="text-transform:uppercase;letter-spacing:0.08em;">
        <span class="material-symbols-outlined" style="font-size:16px;vertical-align:middle;">family_restroom</span> INFORMATIONS COUPLE
      </h3>
      <div class="space-y-md">
        <input type="text" id="nc-marriage" placeholder="Durée du mariage (ex: 3 ans)" class="form-input">
        <input type="text" id="nc-baby" placeholder="Âge du bébé (ex: 4 mois)" class="form-input">
      </div>
    </div></div>

    <div class="card card--flat mb-xl"><div class="card__body">
      <h3 class="text-label-lg text-variant mb-md" style="text-transform:uppercase;letter-spacing:0.08em;">
        <span class="material-symbols-outlined" style="font-size:16px;vertical-align:middle;">lock</span> SÉCURITÉ
      </h3>
      <div class="space-y-md">
        <input type="password" id="nc-password" placeholder="Mot de passe (min 4 caractères)" class="form-input">
        <input type="password" id="nc-password2" placeholder="Confirmer le mot de passe" class="form-input">
      </div>
    </div></div>

    <button class="btn btn--primary btn--full mb-xl" id="nc-submit-btn" onclick="createNewCouple()">
      <span class="material-symbols-outlined">group_add</span> Créer le couple
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
    msgEl.innerHTML = '<div class="alert-banner alert-banner--danger"><span class="material-symbols-outlined">error</span><span>Les mots de passe ne correspondent pas</span></div>';
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
    msgEl.innerHTML = '<div class="alert-banner alert-banner--danger"><span class="material-symbols-outlined">error</span><span>Prénom, email et mot de passe sont obligatoires</span></div>';
    return;
  }

  const btn = document.getElementById('nc-submit-btn');
  btn.disabled = true;
  btn.innerHTML = '<span class="material-symbols-outlined">hourglass_top</span> Création en cours...';

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
          <strong class="text-primary">Couple créé avec succès !</strong>
          <p class="text-body-md mt-sm"><strong>${body.partner1_name}</strong> & <strong>${body.partner2_name || '—'}</strong></p>
          <p class="text-body-md text-variant">${body.partner1_email}</p>
        </div>
      </div>
    `;
    btn.innerHTML = '<span class="material-symbols-outlined">check</span> Couple créé !';
    btn.style.background = 'var(--primary-container)';
    btn.style.color = 'var(--on-primary-container)';

    setTimeout(() => renderNewCouple(), 3000);
  } catch (e) {
    msgEl.style.display = 'block';
    msgEl.innerHTML = `<div class="alert-banner alert-banner--danger"><span class="material-symbols-outlined">error</span><span>${e.message}</span></div>`;
    btn.disabled = false;
    btn.innerHTML = '<span class="material-symbols-outlined">group_add</span> Créer le couple';
  }
}

// ══════════════════════════════════════════════════════════════
//  HOME / DASHBOARD
// ══════════════════════════════════════════════════════════════
async function renderHome() {
  if (!state.couple) return;

  // Update name
  const nameEl = document.getElementById('home-name');
  if (nameEl) nameEl.textContent = `Bonjour, ${state.couple.partner1_name}`;

  // Update drawer
  const drawerName = document.getElementById('drawer-name');
  if (drawerName) drawerName.textContent = state.couple.partner1_name;
  const drawerSub = document.getElementById('drawer-sub');
  if (drawerSub) drawerSub.textContent = state.couple.marriage_duration ? `Couple depuis ${state.couple.marriage_duration}` : 'Bienvenue';

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
    if (progText) progText.textContent = `${data.completedTypes}/3 évaluations complétées`;

    // Latest eval
    const latestEl = document.getElementById('home-latest-eval');
    if (latestEl && data.latestEval) {
      const d = new Date(data.latestEval.created_at);
      const ago = getTimeAgo(d);
      latestEl.innerHTML = `
        <div class="flex justify-between items-center mb-md">
          <h3 class="text-headline-sm" style="color:var(--on-surface);">Dernière Évaluation</h3>
          <span class="text-label-lg text-variant" style="font-style:italic;">${ago}</span>
        </div>
        <div style="display:flex;align-items:flex-start;gap:var(--space-md);padding:var(--space-lg);background:var(--surface);border-radius:var(--radius-lg);">
          <span class="material-symbols-outlined text-primary" style="margin-top:2px;">assignment_turned_in</span>
          <div>
            <p class="text-body-lg text-semibold" style="color:var(--on-surface);">${capitalize(data.latestEval.type)}</p>
            <p class="text-body-md text-variant">Score : ${data.latestEval.score}/100</p>
          </div>
        </div>
      `;
    } else if (latestEl) {
      latestEl.innerHTML = `
        <h3 class="text-headline-sm mb-md" style="color:var(--on-surface);">Première Évaluation</h3>
        <p class="text-body-md text-variant">Commencez votre première évaluation pour découvrir votre profil de couple.</p>
      `;
    }
  } catch (e) { console.error('Dashboard error:', e); }
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
  const qData = questionnaires[type];
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
        ${likertOptions.map(opt => {
          const sel = answered && state.answers[type][qi] === opt.value;
          return `<button class="likert-option ${sel ? 'selected' : ''}" data-value="${opt.value}">
            <span>${opt.label}</span>
            <span class="material-symbols-outlined" data-icon-radio="true">${sel ? 'check_circle' : 'radio_button_unchecked'}</span>
          </button>`;
        }).join('')}
      </div>
      <div class="flex gap-lg mt-3xl" style="padding-bottom:20px;">
        <button class="btn btn--outline" style="flex:1;${qi === 0 ? 'opacity:0.3;' : ''}" onclick="prevQuestion()" ${qi === 0 ? 'disabled' : ''}>Précédent</button>
        <button class="btn btn--primary" style="flex:1;" id="nextQuestionBtn" onclick="nextQuestion()" ${answered ? '' : 'disabled'}>${qi === total - 1 ? 'Terminer' : 'Suivant'}</button>
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
  const total = questionnaires[type].questions.length;
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
        explEl.innerHTML = 'Complétez vos premières évaluations pour recevoir une analyse personnalisée.';
      } else {
        let text = 'Votre relation traverse cette phase de transition ';
        if (globalScore >= 75) text += 'avec une grande résilience. ';
        else if (globalScore >= 55) text += 'de manière positive. ';
        else text += 'avec quelques défis à relever. ';

        const s = data.scores;
        if (s.psychologique > 0) {
          if (s.psychologique >= 70) text += `Excellent bien-être psychologique (${s.psychologique}%). `;
          else if (s.psychologique < 40) text += `Votre bien-être psychologique (${s.psychologique}%) nécessite une attention particulière. `;
        }
        if (s.conjugal > 0 && s.conjugal < 50) text += `La dimension conjugale (${s.conjugal}%) pourrait être renforcée. `;
        if (s.sexuel > 0 && s.sexuel < 40) text += `La dimension intime (${s.sexuel}%) mérite un accompagnement. `;
        explEl.innerHTML = text;
      }
    }

    // Alerts
    const alertC = document.getElementById('alert-container');
    if (alertC) {
      alertC.innerHTML = '';
      const low = Object.entries(data.scores).filter(([_, v]) => v > 0 && v < 40).map(([k]) => k);
      if (low.length > 0) {
        alertC.innerHTML = `<div class="alert-banner alert-banner--warning"><span class="material-symbols-outlined">warning</span><div><strong>Orientation recommandée</strong><p class="text-body-md mt-sm">Score ${low.join(' et ')} faible. Consultez un professionnel.</p></div></div>`;
      }
    }
  } catch (e) { console.error('Results error:', e); }
}

// ══════════════════════════════════════════════════════════════
//  LIBRARY
// ══════════════════════════════════════════════════════════════
function renderLibrary() {
  document.querySelectorAll('.timeline-toggle__btn').forEach(btn => {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.timeline-toggle__btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
    });
  });
  document.querySelectorAll('[data-category]').forEach(chip => {
    chip.addEventListener('click', function () {
      document.querySelectorAll('[data-category]').forEach(c => c.classList.remove('active'));
      this.classList.add('active');
    });
  });
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
    document.getElementById('profile-age').textContent = c.partner1_age ? c.partner1_age + ' ans' : '-';
    document.getElementById('profile-sex').textContent = c.partner1_sex || '-';
    document.getElementById('profile-marriage').textContent = c.marriage_duration || '-';
    document.getElementById('profile-baby').textContent = c.baby_age || '-';
    document.getElementById('profile-partner2').textContent = c.partner2_name ? `${c.partner2_name}, ${c.partner2_age || '?'} ans` : 'Non renseigné';
  } catch (e) { console.error('Profile error:', e); }
}

// ══════════════════════════════════════════════════════════════
//  SAGE-FEMME
// ══════════════════════════════════════════════════════════════
function renderSageFemme() {
  const container = document.getElementById('sage-femme-content');
  if (!container) return;
  let html = `
    <div class="chips-scroll mb-xl">
      <button class="chip chip--tonal active" data-sf-cat="tous" onclick="filterSF('tous',this)">Tous</button>
      <button class="chip chip--tonal" data-sf-cat="post-partum" onclick="filterSF('post-partum',this)">Post-partum</button>
      <button class="chip chip--tonal" data-sf-cat="allaitement" onclick="filterSF('allaitement',this)">Allaitement</button>
      <button class="chip chip--tonal" data-sf-cat="contraception" onclick="filterSF('contraception',this)">Contraception</button>
      <button class="chip chip--tonal" data-sf-cat="sexualite" onclick="filterSF('sexualite',this)">Sexualité</button>
      <button class="chip chip--tonal" data-sf-cat="alerte" onclick="filterSF('alerte',this)">⚠️ Alertes</button>
    </div>
    <div class="space-y-lg" id="sf-messages">`;
  sageFemmeTips.forEach((tip, i) => {
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
  const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

  container.innerHTML = `
    <h2 class="text-headline-sm mb-md">Comment vous sentez-vous ?</h2>
    <p class="text-body-md text-variant mb-xl">Enregistrez votre humeur quotidienne.</p>

    <div class="card card--flat mb-xl"><div class="card__body">
      <p class="text-label-lg text-variant mb-lg" style="text-transform:uppercase;letter-spacing:0.08em;">HUMEUR DU JOUR</p>
      <div class="mood-grid">
        ${['😫|Épuisé', '😔|Triste', '😐|Neutre', '😊|Bien', '😄|Super'].map(m => {
          const [emoji, label] = m.split('|');
          return `<button class="mood-option" onclick="selectMood('${emoji}',this)"><span class="mood-option__emoji">${emoji}</span><span class="mood-option__label">${label}</span></button>`;
        }).join('')}
      </div>
    </div></div>

    <div class="card card--flat mb-xl"><div class="card__body">
      <div class="slider-container"><label><span>Niveau de stress</span><span><span id="stress-val">5</span>/10</span></label>
        <input type="range" min="0" max="10" value="5" id="slider-stress" oninput="document.getElementById('stress-val').textContent=this.value"></div>
      <div class="slider-container"><label><span>Satisfaction conjugale</span><span><span id="conj-val">5</span>/10</span></label>
        <input type="range" min="0" max="10" value="5" id="slider-conj" oninput="document.getElementById('conj-val').textContent=this.value"></div>
      <div class="slider-container"><label><span>Satisfaction intime</span><span><span id="intime-val">5</span>/10</span></label>
        <input type="range" min="0" max="10" value="5" id="slider-intime" oninput="document.getElementById('intime-val').textContent=this.value"></div>
    </div></div>

    <button class="btn btn--primary btn--full mb-3xl" id="save-daily-btn" onclick="saveDailyEntry()">
      <span class="material-symbols-outlined">save</span> Enregistrer mon suivi
    </button>

    ${chartData.length > 0 ? `
    <div class="mini-chart mb-xl reveal">
      <h3 class="text-headline-sm mb-lg">Évolution récente</h3>
      <svg viewBox="0 0 340 180" style="width:100%;">
        ${[0,1,2,3,4].map(i => `<line x1="40" y1="${20+i*35}" x2="330" y2="${20+i*35}" stroke="var(--outline-variant)" stroke-width="0.5" stroke-dasharray="4"/>`).join('')}
        <polyline points="${chartData.map((d,i) => `${40+i*(290/Math.max(chartData.length-1,1))},${160-d.stress*14}`).join(' ')}" fill="none" stroke="var(--error)" stroke-width="2.5" stroke-linecap="round" opacity="0.7"/>
        <polyline points="${chartData.map((d,i) => `${40+i*(290/Math.max(chartData.length-1,1))},${160-d.satisfaction_conjugale*14}`).join(' ')}" fill="none" stroke="var(--primary)" stroke-width="2.5" stroke-linecap="round"/>
        ${chartData.map((d,i) => `<circle cx="${40+i*(290/Math.max(chartData.length-1,1))}" cy="${160-d.satisfaction_conjugale*14}" r="4" fill="var(--primary)"/><circle cx="${40+i*(290/Math.max(chartData.length-1,1))}" cy="${160-d.stress*14}" r="3" fill="var(--error)" opacity="0.7"/>`).join('')}
        ${chartData.map((d,i) => `<text x="${40+i*(290/Math.max(chartData.length-1,1))}" y="178" text-anchor="middle" font-size="10" fill="var(--on-surface-variant)">${d.day_name||days[new Date(d.created_at).getDay()]}</text>`).join('')}
      </svg>
      <div class="flex justify-center gap-xl mt-md">
        <div class="flex items-center gap-sm"><span style="width:12px;height:3px;background:var(--primary);border-radius:2px;display:block"></span><span class="text-label-md text-variant">Satisfaction</span></div>
        <div class="flex items-center gap-sm"><span style="width:12px;height:3px;background:var(--error);border-radius:2px;display:block;opacity:0.7"></span><span class="text-label-md text-variant">Stress</span></div>
      </div>
    </div>` : ''}

    <h3 class="text-headline-sm mb-lg">Historique récent</h3>
    <div class="space-y-md">
      ${entries.length > 0 ? entries.slice(0, 7).map(e => `
        <div class="daily-entry">
          <span class="daily-entry__date">${e.day_name || ''}</span>
          <span style="font-size:24px;">${e.mood}</span>
          <div style="flex:1;"><div class="flex justify-between text-label-md">
            <span class="text-variant">Stress: ${e.stress}/10</span>
            <span class="text-primary">Conj: ${e.satisfaction_conjugale}/10</span>
          </div></div>
        </div>
      `).join('') : '<p class="text-body-md text-variant text-center">Aucune entrée. Commencez votre suivi ci-dessus !</p>'}
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
      btn.innerHTML = '<span class="material-symbols-outlined">check</span> Enregistré !';
      btn.style.background = 'var(--primary-container)';
      btn.style.color = 'var(--on-primary-container)';
      setTimeout(() => renderSuivi(), 1500);
    }
  } catch (e) {
    if (btn) btn.innerHTML = '<span class="material-symbols-outlined">error</span> Erreur';
  }
}

// ══════════════════════════════════════════════════════════════
//  HELPERS
// ══════════════════════════════════════════════════════════════
function capitalize(str) { return str.charAt(0).toUpperCase() + str.slice(1); }
function getTimeAgo(date) {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return 'À l\'instant';
  if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)}h`;
  const days = Math.floor(diff / 86400);
  if (days === 1) return 'Hier';
  return `Il y a ${days} jours`;
}
