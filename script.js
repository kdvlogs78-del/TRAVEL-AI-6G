/* ============================================================
   PLAN YOUR TRIP INDIA — Complete JavaScript
   AI Chatbot · Clickable India Map · Light/Dark Theme
   ============================================================ */

// ─── STATE ──────────────────────────────────────────────────────
let travelerCount = 2;
let currentCityKey = '';
let currentStateClicked = '';
let indiaMapInstance = null;
let stateLayer = null;
let deferredInstallPrompt = null;

// chatHistory holds only live conversation turns.
// System prompt is handled by the backend proxy.
let chatHistory = [];

// ─── CURRENT LOCATION ────────────────────────────────────────────
function useCurrentLocation() {
    const btn = document.getElementById('useLocationBtn');
    const btnText = document.getElementById('locationBtnText');
    const fromInput = document.getElementById('wizFromInput');

    if (!navigator.geolocation) {
        showToast('Geolocation is not supported by your browser.', 'error');
        return;
    }

    btn.classList.add('loading');
    btnText.textContent = 'Detecting...';

    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const { latitude, longitude } = position.coords;
            try {
                const res = await fetch(
                    `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&zoom=10&addressdetails=1`
                );
                const data = await res.json();
                const addr = data.address || {};
                const city = addr.city
                    || addr.town
                    || addr.municipality
                    || '';

                if (city) {
                    fromInput.value = city;
                    wizState.from = city;
                    // Visually pulse the FROM box so user sees it filled
                    fromInput.style.transition = 'box-shadow 0.3s, border-color 0.3s';
                    fromInput.style.borderColor = '#ABD1C6';
                    fromInput.style.boxShadow = '0 0 0 3px rgba(171,209,198,0.35)';
                    setTimeout(() => { fromInput.style.borderColor = ''; fromInput.style.boxShadow = ''; }, 2500);
                    showToast(`📍 From set to: ${city}`, 'success');
                } else {
                    fromInput.value = '';
                    showToast('📍 Could not detect city. Please type it manually.', 'error');
                }
            } catch (e) {
                fromInput.value = '';
                showToast('📍 Location error. Please type your city.', 'error');
            }
            btn.classList.remove('loading');
            btnText.textContent = '✓ City Detected';
            setTimeout(() => { btnText.textContent = '📍 Detect My City (sets From)'; }, 3000);
        },
        (err) => {
            btn.classList.remove('loading');
            btnText.textContent = '📍 Detect My City (sets From)';
            const msgs = {
                1: 'Location access denied. Please allow location in your browser.',
                2: 'Unable to detect location. Check GPS/network.',
                3: 'Location request timed out. Please try again.'
            };
            showToast(msgs[err.code] || 'Could not get location.', 'error');
        },
        { timeout: 10000, enableHighAccuracy: false }
    );
}


const CITY_DATA = {
    jaipur: {
        name: 'Jaipur', badge: 'Rajasthan', tagline: 'The Pink City – Palaces, Forts & Royal Heritage',
        img: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=1200&q=80',
        famous: ['Amber Fort', 'City Palace', 'Hawa Mahal', 'Jantar Mantar', 'Nahargarh Fort'],
        food: [{ name: 'Pyaaz Kachori', price: '₹20' }, { name: 'Dal Baati Churma', price: '₹80' }, { name: 'Laal Maas', price: '₹200' }, { name: 'Ghewar', price: '₹60' }, { name: 'Mawa Kachori', price: '₹30' }],
        hidden: ['Panna Meena ka Kund', 'Sisodia Rani Garden', 'Khole ke Hanuman Ji', 'Sanganer Village', 'Galtaji Temple'],
        hotels: ['Rambagh Palace (Luxury)', 'Hotel Pearl Palace (Budget)', 'Jai Mahal Palace (Heritage)', 'Zostel Jaipur (Backpacker)'],
        tips: 'Visit forts early morning to avoid crowds. Hire a local guide for ₹500.',
        per_day: { budget: 1100, normal: 2900, luxury: 8700 }
    },
    goa: {
        name: 'Goa', badge: 'Beach', tagline: 'Sun, Sand & Portuguese Charm on India\'s Coast',
        img: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=1200&q=80',
        famous: ['Baga Beach', 'Basilica of Bom Jesus', 'Fort Aguada', 'Anjuna Beach', 'Calangute Beach'],
        food: [{ name: 'Prawn Balchão', price: '₹150' }, { name: 'Bebinca Dessert', price: '₹60' }, { name: 'Goan Fish Curry', price: '₹200' }, { name: 'Cafreal Chicken', price: '₹180' }],
        hidden: ['Butterfly Beach', 'Arambol Sweet Lake', 'Divar Island', 'Cabo de Rama Fort', 'Chorla Ghats'],
        hotels: ['Taj Exotica (Luxury)', 'Zostel Goa (Budget)', 'La Maison Fontaine (Boutique)', 'Backpacker Panda Calangute'],
        tips: 'North Goa for parties, South Goa for peace. Rent a scooter for ₹300/day.',
        per_day: { budget: 1550, normal: 4200, luxury: 10500 }
    },
    manali: {
        name: 'Manali', badge: 'Mountains', tagline: 'Snow-Capped Peaks, Rivers & Adventure Awaits',
        img: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=1200&q=80',
        famous: ['Rohtang Pass', 'Solang Valley', 'Hadimba Temple', 'Beas River', 'Mall Road'],
        food: [{ name: 'Siddu (Local Bread)', price: '₹50' }, { name: 'Trout Fish Fry', price: '₹250' }, { name: 'Aktori Pancake', price: '₹40' }, { name: 'Dham Feast', price: '₹120' }],
        hidden: ['Naggar Castle', 'Great Himalayan National Park', 'Chandrakhani Pass', 'Bijli Mahadev', 'Malana Village'],
        hotels: ['Span Resort (Luxury)', 'Zostel Manali (Budget)', 'Johnson Lodge (Mid-range)', 'Snow Valley Resorts'],
        tips: 'Carry warm clothes even in summer. Book Rohtang Pass permits online 24hrs in advance.',
        per_day: { budget: 1400, normal: 3500, luxury: 8800 }
    },
    varanasi: {
        name: 'Varanasi', badge: 'Spiritual', tagline: 'The Oldest Living City – Ghats, Temples & Ganga',
        img: 'https://images.unsplash.com/photo-1561361058-c24e01238a46?w=1200&q=80',
        famous: ['Dashashwamedh Ghat', 'Kashi Vishwanath Temple', 'Sarnath', 'Manikarnika Ghat', 'Assi Ghat'],
        food: [{ name: 'Kachori Sabzi', price: '₹30' }, { name: 'Banarasi Paan', price: '₹20' }, { name: 'Thandai', price: '₹50' }, { name: 'Tamatar Chaat', price: '₹40' }, { name: 'Malaiyo', price: '₹30' }],
        hidden: ['Lalita Ghat', 'Scindia Ghat', 'Tulsi Manas Temple', 'Ramnagar Fort', 'Banaras Ghats at Dawn'],
        hotels: ['BrijRama Palace (Heritage)', 'Stops Hostel (Budget)', 'Hotel Surya (Mid-range)', 'Ganges View Hotel'],
        tips: 'Wake up for sunrise boat ride on Ganga (₹200). Ganga Aarti at 7pm is unmissable.',
        per_day: { budget: 950, normal: 2550, luxury: 6500 }
    },
    kerala: {
        name: 'Kerala', badge: 'Nature', tagline: 'God\'s Own Country – Backwaters, Spice & Serenity',
        img: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=1200&q=80',
        famous: ['Alleppey Backwaters', 'Munnar Tea Gardens', 'Kovalam Beach', 'Periyar Wildlife Sanctuary', 'Varkala Cliff'],
        food: [{ name: 'Appam & Stew', price: '₹80' }, { name: 'Kerala Sadya', price: '₹150' }, { name: 'Karimeen Pollichathu', price: '₹300' }, { name: 'Puttu & Kadala', price: '₹60' }, { name: 'Pazham Pori', price: '₹20' }],
        hidden: ['Gavi Eco Forest', 'Bekal Fort', 'Thenmala Eco Tourism', 'Athirapally Waterfalls', 'Wayanad Hills'],
        hotels: ['Kumarakom Lake Resort (Luxury)', 'Zostel Varkala (Budget)', 'Philipkutty Farm (Boutique)', 'EarthHome Stays'],
        tips: 'Houseboat stay in Alleppey is a must-do (from ₹6000/night). Oct–Feb is peak season.',
        per_day: { budget: 1400, normal: 3850, luxury: 10000 }
    },
    ladakh: {
        name: 'Ladakh', badge: 'High Altitude', tagline: 'Moonscapes, Monasteries & Cosmic Landscapes',
        img: 'https://images.unsplash.com/photo-1604537529428-15bcbeecfe4d?w=1200&q=80',
        famous: ['Pangong Lake', 'Nubra Valley', 'Leh Palace', 'Magnetic Hill', 'Hemis Monastery'],
        food: [{ name: 'Thukpa Noodle Soup', price: '₹80' }, { name: 'Skyu Pasta', price: '₹70' }, { name: 'Butter Tea', price: '₹30' }, { name: 'Tsampa Porridge', price: '₹50' }, { name: 'Steamed Momos', price: '₹60' }],
        hidden: ['Tso Moriri Lake', 'Zanskar Valley', 'Dah Hanu Village', 'Phugtal Monastery', 'Hanle Dark Sky Reserve'],
        hotels: ['Grand Dragon Ladakh (Luxury)', 'Zostel Leh (Budget)', 'Stok Palace Heritage (Heritage)', 'The Indus Valley'],
        tips: 'Acclimatize 2 days in Leh before excursions. Carry cash — ATMs are unreliable above 3500m.',
        per_day: { budget: 1900, normal: 4700, luxury: 12000 }
    }
};

// ─── STATE FLAGS / EMOJIS ───────────────────────────────────────
const STATE_FLAGS = {
    'Rajasthan': '🏜️', 'Maharashtra': '🌆', 'Tamil Nadu': '🏛️',
    'Kerala': '🌴', 'Goa': '🏖️', 'Himachal Pradesh': '🏔️',
    'Uttarakhand': '⛰️', 'Jammu & Kashmir': '❄️', 'Ladakh': '🌌',
    'Punjab': '🌾', 'Haryana': '🌾', 'Delhi': '🕌',
    'Uttar Pradesh': '🛕', 'Bihar': '🪷', 'West Bengal': '🐯',
    'Odisha': '🌊', 'Andhra Pradesh': '🌶️', 'Telangana': '💎',
    'Karnataka': '🌳', 'Gujarat': '🦁', 'Madhya Pradesh': '🐆',
    'Chhattisgarh': '🌿', 'Jharkhand': '⛏️', 'Assam': '🍵',
    'Meghalaya': '🌧️', 'Sikkim': '🏔️', 'Arunachal Pradesh': '🦅',
    'Manipur': '💃', 'Mizoram': '🌸', 'Nagaland': '🎭',
    'Tripura': '🏯', 'Andaman and Nicobar': '🐢', 'Lakshadweep': '🪸',
    'Chandigarh': '🏙️', 'Puducherry': '⛵'
};

// ─── WELCOME OVERLAY ────────────────────────────────────────────
const WELCOME_GREETINGS = [
    { word: 'Namaste', lang: 'Hindi · नमस्ते' },
    { word: 'Kem Cho', lang: 'Gujarati · કેમ છો' },
    { word: 'Vanakkam', lang: 'Tamil · வணக்கம்' },
    { word: 'Namaskar', lang: 'Marathi · नमस्कार' },
    { word: 'Sat Sri Akal', lang: 'Punjabi · ਸਤ ਸ੍ਰੀ ਅਕਾਲ' },
    { word: 'Nomoshkar', lang: 'Bengali · নমস্কার' },
    { word: 'Marhaba', lang: 'Urdu · مرحبا' },
];

function initWelcomeOverlay() {
    const overlay = document.getElementById('welcomeOverlay');
    const wordEl = document.getElementById('welcomeWord');
    const langEl = document.getElementById('welcomeLang');
    const dotsEl = document.getElementById('welcomeDots');
    if (!overlay) return;

    WELCOME_GREETINGS.forEach((_, i) => {
        const dot = document.createElement('div');
        dot.className = 'welcome-dot' + (i === 0 ? ' active' : '');
        dotsEl.appendChild(dot);
    });

    let idx = 0;
    const dots = dotsEl.querySelectorAll('.welcome-dot');

    function showGreeting(i) {
        const g = WELCOME_GREETINGS[i];
        wordEl.textContent = g.word;
        langEl.textContent = g.lang;
        wordEl.style.animation = 'none';
        langEl.style.animation = 'none';
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                wordEl.style.animation = 'welcomeFadeSlide 1.3s ease forwards';
                langEl.style.animation = 'welcomeFadeSlide 1.3s ease forwards';
            });
        });
        dots.forEach((d, di) => d.classList.toggle('active', di === i));
    }

    showGreeting(0);

    const interval = setInterval(() => {
        idx++;
        if (idx >= WELCOME_GREETINGS.length) {
            clearInterval(interval);
            setTimeout(() => {
                overlay.classList.add('hidden');
                overlay.style.pointerEvents = 'none';
                const loader = document.getElementById('loader');
                if (loader) {
                    loader.classList.add('active');
                    setTimeout(() => {
                        loader.classList.remove('active');
                        loader.classList.add('hidden');
                        loader.style.pointerEvents = 'none';
                        loader.style.display = 'none';
                        initScrollReveal();
                        initGreeting();
                        initIndiaMap();
                    }, 1800);
                }
            }, 400);
            return;
        }
        showGreeting(idx);
    }, 1400);
}

// ─── LOADER ─────────────────────────────────────────────────────
window.addEventListener('load', () => {
    initWelcomeOverlay();
});

function initGreeting() {
    const hour = new Date().getHours();
    let g = 'Namaste 🙏';
    if (hour < 12) g = 'Good Morning 🌅';
    else if (hour < 17) g = 'Good Afternoon ☀️';
    else if (hour < 20) g = 'Good Evening 🌇';
    const el = document.getElementById('greetingText');
    if (el) el.textContent = g;
}

// ─── THEME TOGGLE ─────────────────────────────────────────────
function getThemeIcon(theme) {
    return theme === 'dark' ? '🌙' : '🌊';
}

function toggleTheme() {
    const html = document.documentElement;
    const current = html.getAttribute('data-theme') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', next);
    localStorage.setItem('pyti_theme', next);
}

(function initTheme() {
    const saved = localStorage.getItem('pyti_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', saved);
})();

// ─── NAVBAR ─────────────────────────────────────────────────────
window.addEventListener('scroll', () => {
    const navbar = document.getElementById('navbar');
    navbar.classList.toggle('scrolled', window.scrollY > 50);
    updateActiveNav();
});

function updateActiveNav() {
    const sections = document.querySelectorAll('section[id]');
    const links = document.querySelectorAll('.nav-link');
    let current = '';
    sections.forEach(sec => {
        if (window.scrollY >= sec.offsetTop - 120) current = sec.id;
    });
    links.forEach(l => l.classList.toggle('active', l.getAttribute('href') === `#${current}`));
}

// ─── MOBILE NAV OVERLAY ─────────────────────────────────────────
(function setupMobileNav() {
    const hamburger = document.getElementById('hamburger');
    if (!hamburger) return;

    const overlay = document.createElement('div');
    overlay.className = 'nav-mobile-overlay';
    overlay.id = 'navMobileOverlay';
    overlay.innerHTML = `
    <a href="#home"      class="nav-link" data-close>Home</a>
    <a href="#india-map" class="nav-link" data-close>India Map</a>
    <a href="#places"    class="nav-link" data-close>Places</a>
    <a href="#all-cities" class="nav-link" data-close>All Cities</a>
    <a href="#planner"   class="nav-link" data-close>AI Planner</a>
    <a href="#about"     class="nav-link" data-close>About</a>
    <a href="#contact"   class="nav-link" data-close>Contact</a>
    <div class="nav-mobile-divider"></div>
    <div class="nav-mobile-auth" id="mobileAuthBtns">
      <button class="btn-nav-login" id="mobLoginBtn">Login</button>
      <button class="btn-nav-signup" id="mobSignupBtn">Sign Up ✦</button>
    </div>
  `;
    document.body.appendChild(overlay);

    function openNav() {
        hamburger.classList.add('open');
        overlay.classList.add('open');
        document.body.style.overflow = 'hidden';
        if (window.updateMobileAuthUI) window.updateMobileAuthUI();
    }
    function closeNav() {
        hamburger.classList.remove('open');
        overlay.classList.remove('open');
        document.body.style.overflow = '';
    }

    hamburger.addEventListener('click', () => {
        overlay.classList.contains('open') ? closeNav() : openNav();
    });

    overlay.querySelectorAll('[data-close]').forEach(el => {
        el.addEventListener('click', closeNav);
    });

    overlay.addEventListener('click', e => {
        const t = e.target;
        if (t.id === 'mobLoginBtn') { closeNav(); openModal('loginModal'); }
        if (t.id === 'mobSignupBtn') { closeNav(); openModal('signupModal'); }
        if (t.dataset.logout !== undefined) { closeNav(); logoutUser(); }
    });

    window.updateMobileAuthUI = function () {
        const area = document.getElementById('mobileAuthBtns');
        if (!area) return;
        if (currentUser) {
            const initials = ((currentUser.first || '?')[0] + (currentUser.last || '?')[0]).toUpperCase();
            area.innerHTML = `
        <div class="nav-user-badge" style="justify-content:center;gap:.6rem">
          <div class="nav-user-avatar">${initials}</div>
          <span>${currentUser.first}</span>
          <button data-logout style="background:none;border:none;color:var(--text-dim);font-size:.82rem;cursor:pointer;margin-left:.3rem">↩ Out</button>
        </div>`;
        } else {
            area.innerHTML = `
        <button class="btn-nav-login" id="mobLoginBtn">Login</button>
        <button class="btn-nav-signup" id="mobSignupBtn">Sign Up ✦</button>`;
        }
    };

    document.querySelectorAll('.nav-link').forEach(l => l.addEventListener('click', closeNav));

    window.closeMobileNav = closeNav;
    window.openMobileNav = openNav;
})();

// ─── SCROLL REVEAL ──────────────────────────────────────────────
function initScrollReveal() {
    const observer = new IntersectionObserver(entries => {
        entries.forEach((entry, i) => {
            if (entry.isIntersecting) {
                setTimeout(() => entry.target.classList.add('visible'), i * 80);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
}

// ─── INDIA MAP ─────────────────────────────────────────────────
function initIndiaMap() {
    // SVG map is initialized inline in index.html
}

async function onStateClick(stateName) {
    if (!stateName) return;
    currentStateClicked = stateName;

    document.getElementById('mapPanelDefault').style.display = 'none';
    document.getElementById('mapPanelResult').style.display = 'flex';
    document.getElementById('mapStateFlag').textContent = STATE_FLAGS[stateName] || '🗺️';
    document.getElementById('mapStateName').textContent = stateName;
    document.getElementById('mapStateTagline').textContent = 'Getting AI recommendations...';
    document.getElementById('mapResultLoading').style.display = 'block';
    document.getElementById('mapResultContent').style.display = 'none';
    document.getElementById('mapResultActions').style.display = 'none';

    const prompt = `Give me a concise travel overview of ${stateName}, India. Format exactly like this:

📍 QUICK FACTS
• Capital: [city]
• Best season: [months]
• Known for: [2-3 things]

🌟 TOP 3 MUST-VISIT PLACES
• [Place 1] — [one line why]
• [Place 2] — [one line why]
• [Place 3] — [one line why]

🍽️ LOCAL FOOD TO TRY
• [Food 1], [Food 2], [Food 3]

💡 TRAVELLER TIP
[One practical tip for visiting ${stateName}]

Keep it under 180 words total.`;

    try {
        const response = await callGroqAI([{ role: 'user', content: prompt }]);
        document.getElementById('mapResultLoading').style.display = 'none';
        document.getElementById('mapResultContent').style.display = 'block';
        document.getElementById('mapResultContent').textContent = response;
        document.getElementById('mapResultActions').style.display = 'flex';
        document.getElementById('mapStateTagline').textContent = `Explore ${stateName}`;
    } catch (err) {
        document.getElementById('mapResultLoading').style.display = 'none';
        document.getElementById('mapResultContent').style.display = 'block';
        document.getElementById('mapResultContent').textContent = `Could not load AI info for ${stateName}. Please check your connection and try again.`;
    }
}

function triggerStateAI(stateName) {
    onStateClick(stateName);
}

function chatAboutState() {
    openChat();
    setTimeout(() => {
        const msg = `Tell me more about travelling in ${currentStateClicked}, India — best hidden gems, visa-free zones, must-try local experiences and a suggested 5-day itinerary.`;
        document.getElementById('chatInput').value = msg;
        sendMessage();
    }, 300);
}

function planThisState() {
    wizSelectDest(currentStateClicked);
    document.getElementById('planner').scrollIntoView({ behavior: 'smooth' });
}

// ─── WIZARD STATE ────────────────────────────────────────────────
let wizCurrentStep = 1;
const WIZ_TOTAL = 6;
const wizState = {
    from: '',
    destination: '',
    dateFrom: '',
    dateTo: '',
    duration: 0,
    styles: [],
    adults: 2,
    children: 0,
    budget: 'normal',
    customBudget: 0,
    accom: ['Resort'],
    food: '',
    diet: []
};

function wizNextStep() {
    if (!wizValidate(wizCurrentStep)) return;
    if (wizCurrentStep === WIZ_TOTAL) { wizGeneratePlan(); return; }

    const curItem = document.getElementById('wizStep' + wizCurrentStep);
    curItem.classList.remove('active');
    curItem.classList.add('completed');
    curItem.querySelector('.wiz-step-circle').innerHTML = '✓';
    document.getElementById('wizPanel' + wizCurrentStep).classList.remove('active');

    wizCurrentStep++;
    document.getElementById('wizStep' + wizCurrentStep).classList.add('active');
    document.getElementById('wizPanel' + wizCurrentStep).classList.add('active');

    document.getElementById('wizBackBtn').disabled = false;
    document.getElementById('wizStepCount').textContent = `Step ${wizCurrentStep} of ${WIZ_TOTAL}`;
    document.getElementById('wizNextBtnText').textContent = wizCurrentStep === WIZ_TOTAL ? 'Generate Plan ✦' : 'Continue';

    if (wizCurrentStep === WIZ_TOTAL) wizPopulateSummary();
    document.getElementById('wizardCard').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function wizPrevStep() {
    if (wizCurrentStep === 1) return;
    document.getElementById('wizPanel' + wizCurrentStep).classList.remove('active');
    document.getElementById('wizStep' + wizCurrentStep).classList.remove('active');

    wizCurrentStep--;
    document.getElementById('wizPanel' + wizCurrentStep).classList.add('active');
    const item = document.getElementById('wizStep' + wizCurrentStep);
    item.classList.remove('completed');
    item.classList.add('active');
    item.querySelector('.wiz-step-circle').innerHTML = wizCurrentStep;

    document.getElementById('wizBackBtn').disabled = (wizCurrentStep === 1);
    document.getElementById('wizStepCount').textContent = `Step ${wizCurrentStep} of ${WIZ_TOTAL}`;
    document.getElementById('wizNextBtnText').textContent = 'Continue';
}

// Jump directly to any step from the Review summary edit buttons
function wizJumpToStep(targetStep) {
    if (targetStep === wizCurrentStep) return;

    // Hide current panel + deactivate step bar item
    document.getElementById('wizPanel' + wizCurrentStep).classList.remove('active');
    const curItem = document.getElementById('wizStep' + wizCurrentStep);
    if (curItem) { curItem.classList.remove('active'); curItem.classList.remove('completed'); }

    // Restore all steps between target and current back to completed state
    for (let s = 1; s < WIZ_TOTAL; s++) {
        const si = document.getElementById('wizStep' + s);
        if (!si) continue;
        si.classList.remove('active', 'completed');
        if (s < targetStep) {
            si.classList.add('completed');
            si.querySelector('.wiz-step-circle').innerHTML = '✓';
        } else if (s === targetStep) {
            si.classList.add('active');
            si.querySelector('.wiz-step-circle').innerHTML = s;
        } else {
            si.querySelector('.wiz-step-circle').innerHTML = s;
        }
    }

    wizCurrentStep = targetStep;
    document.getElementById('wizPanel' + wizCurrentStep).classList.add('active');
    document.getElementById('wizBackBtn').disabled = (wizCurrentStep === 1);
    document.getElementById('wizStepCount').textContent = `Step ${wizCurrentStep} of ${WIZ_TOTAL}`;
    document.getElementById('wizNextBtnText').textContent = wizCurrentStep === WIZ_TOTAL ? 'Generate Plan ✦' : 'Continue';
    document.getElementById('wizardCard').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function wizValidate(step) {
    if (step === 1) {
        const dest = document.getElementById('wizDestInput')?.value?.trim() || '';
        wizState.destination = dest;
        wizState.from = document.getElementById('wizFromInput')?.value?.trim() || '';
        if (!dest) {
            showToast('📍 Please enter where you want to go!');
            document.getElementById('wizDestInput').focus();
            return false;
        }
    }
    if (step === 2) {
        if (!wizState.dateFrom || !wizState.dateTo) {
            showToast('📅 Please select both departure and return dates');
            return false;
        }
        if (new Date(wizState.dateFrom) >= new Date(wizState.dateTo)) {
            showToast('📅 Return date must be after departure date');
            return false;
        }
    }
    return true;
}

function wizSwapRoutes() {
    const fromEl = document.getElementById('wizFromInput');
    const toEl = document.getElementById('wizDestInput');
    if (!fromEl || !toEl) return;
    const tmp = fromEl.value;
    fromEl.value = toEl.value;
    toEl.value = tmp;
    wizState.from = fromEl.value;
    wizState.destination = toEl.value;
}

function wizSelectDest(name) {
    wizState.destination = name;
    const inp = document.getElementById('wizDestInput');
    if (inp) inp.value = name;
    document.querySelectorAll('#wizDestChips .wiz-chip').forEach(c => {
        c.classList.toggle('selected', c.textContent.trim().includes(name));
    });
}

function wizFilterChips(val) {
    wizState.destination = val;
    document.querySelectorAll('#wizDestChips .wiz-chip').forEach(c => {
        const name = c.textContent.replace(/^[\u{1F000}-\u{1FFFF}]|\s*/gu, '').trim();
        c.style.display = (!val || name.toLowerCase().includes(val.toLowerCase())) ? '' : 'none';
    });
}

function wizCalcDuration() {
    const f = document.getElementById('wizDateFrom').value;
    const t = document.getElementById('wizDateTo').value;
    wizState.dateFrom = f; wizState.dateTo = t;
    if (f && t) {
        const days = Math.round((new Date(t) - new Date(f)) / 86400000);
        if (days > 0) {
            wizState.duration = days;
            document.getElementById('wizDurationBadge').textContent =
                `🗺️ ${days} day${days > 1 ? 's' : ''} trip · ${wizFmtDate(f)} → ${wizFmtDate(t)}`;
        } else {
            document.getElementById('wizDurationBadge').textContent = '⚠️ Return date must be after departure';
        }
    }
}

function wizFmtDate(str) {
    return new Date(str).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function wizSetDuration(days) {
    const from = new Date(); from.setDate(from.getDate() + 7);
    const to = new Date(from); to.setDate(from.getDate() + days);
    const fStr = from.toISOString().split('T')[0];
    const tStr = to.toISOString().split('T')[0];
    document.getElementById('wizDateFrom').value = fStr;
    document.getElementById('wizDateTo').value = tStr;
    wizState.dateFrom = fStr; wizState.dateTo = tStr; wizState.duration = days;
    document.getElementById('wizDurationBadge').textContent =
        `🗺️ ${days} day${days > 1 ? 's' : ''} trip · ${wizFmtDate(fStr)} → ${wizFmtDate(tStr)}`;
}

function wizToggleChip(el, group) {
    el.classList.toggle('selected');
    const name = el.textContent.replace(/^\S+\s*/, '').trim();
    if (group === 'style') {
        wizState.styles = el.classList.contains('selected')
            ? [...new Set([...wizState.styles, name])]
            : wizState.styles.filter(s => s !== name);
    } else if (group === 'diet') {
        wizState.diet = el.classList.contains('selected')
            ? [...new Set([...wizState.diet, name])]
            : wizState.diet.filter(s => s !== name);
    } else {
        wizState.accom = el.classList.contains('selected')
            ? [...new Set([...wizState.accom, name])]
            : wizState.accom.filter(s => s !== name);
    }
}

function wizChangeTrav(type, delta) {
    if (type === 'adults') {
        wizState.adults = Math.max(1, wizState.adults + delta);
        document.getElementById('wizAdultsCount').textContent = wizState.adults;
        document.getElementById('wizAdultsDown').disabled = (wizState.adults <= 1);
    } else {
        wizState.children = Math.max(0, wizState.children + delta);
        document.getElementById('wizChildCount').textContent = wizState.children;
        document.getElementById('wizChildDown').disabled = (wizState.children <= 0);
    }
}

function wizSelectBudget(el, val) {
    document.querySelectorAll('.wiz-budget-card').forEach(c => c.classList.remove('selected'));
    el.classList.add('selected');
    wizState.budget = val;
    wizState.customBudget = 0;
    const inp = document.getElementById('wizCustomBudget');
    if (inp) inp.value = '';
    const note = document.getElementById('wizCustomBudgetNote');
    if (note) note.textContent = '';
}

function wizSetCustomBudget(val) {
    const amount = parseInt(val, 10);
    const note = document.getElementById('wizCustomBudgetNote');
    if (!amount || amount < 500) {
        wizState.customBudget = 0;
        if (note) note.textContent = '';
        return;
    }
    wizState.customBudget = amount;
    document.querySelectorAll('.wiz-budget-card').forEach(c => c.classList.remove('selected'));
    if (amount < 15000) wizState.budget = 'budget';
    else if (amount < 40000) wizState.budget = 'normal';
    else wizState.budget = 'luxury';
    if (note) note.textContent = `✓ Custom budget set: ₹${amount.toLocaleString('en-IN')} per person`;
}

function wizSelectFood(el, val) {
    document.querySelectorAll('.wiz-food-card').forEach(c => c.classList.remove('selected'));
    el.classList.add('selected');
    wizState.food = val;
}

function wizPopulateSummary() {
    const fromCity = document.getElementById('wizFromInput')?.value?.trim() || wizState.from || '—';
    wizState.from = fromCity;
    const destVal = document.getElementById('wizDestInput')?.value?.trim() || wizState.destination || '—';
    wizState.destination = destVal;

    const routeText = fromCity && fromCity !== '—'
        ? `${fromCity} → ${destVal}`
        : destVal;
    document.getElementById('wizSumDest').textContent = routeText;
    document.getElementById('wizSumDuration').textContent = wizState.duration
        ? `${wizState.duration} days · ${wizFmtDate(wizState.dateFrom)} to ${wizFmtDate(wizState.dateTo)}`
        : '—';
    document.getElementById('wizSumTravelers').textContent =
        `${wizState.adults} adult${wizState.adults > 1 ? 's' : ''}${wizState.children ? ` + ${wizState.children} child${wizState.children > 1 ? 'ren' : ''}` : ''}`;
    const bl = { budget: '🎒 Budget (₹5k–₹15k)', normal: '✈️ Mid-Range (₹15k–₹40k)', luxury: '👑 Luxury (₹40k+)' };
    const budgetText = wizState.customBudget
        ? `✏️ Custom — ₹${wizState.customBudget.toLocaleString('en-IN')} per person`
        : (bl[wizState.budget] || '—');
    document.getElementById('wizSumBudget').textContent = budgetText;
    document.getElementById('wizSumStyle').textContent = wizState.styles.length ? wizState.styles.join(' · ') : 'Not specified';
    const foodLabels = { veg: '🥗 Vegetarian', both: '🍱 Both / No Preference' };
    let foodText = foodLabels[wizState.food] || '—';
    if (wizState.diet && wizState.diet.length) foodText += ' · ' + wizState.diet.join(', ');
    document.getElementById('wizSumFood').textContent = foodText;
}

async function wizGeneratePlan() {
    const dest = wizState.destination;
    const from = wizState.from;
    const dur = wizState.duration || 5;
    const people = wizState.adults + wizState.children;
    const style = wizState.styles.join(', ') || 'cultural';
    const foodPref = wizState.food === 'veg' ? 'Vegetarian only' : 'Both veg and non-veg';
    const dietExtra = wizState.diet && wizState.diet.length ? `, special needs: ${wizState.diet.join(', ')}` : '';
    const budgetPerPerson = wizState.customBudget || { budget: 10000, normal: 27000, luxury: 60000 }[wizState.budget] || 27000;
    const budgetLabel = wizState.customBudget
        ? `Custom ₹${wizState.customBudget.toLocaleString('en-IN')} per person`
        : { budget: 'Budget (₹5k–₹15k)', normal: 'Mid-Range (₹15k–₹40k)', luxury: 'Luxury (₹40k+)' }[wizState.budget];
    const cityKey = Object.keys(CITY_DATA).find(k => dest.toLowerCase().includes(k));
    const cityData = cityKey ? CITY_DATA[cityKey] : null;

    // ── Hide wizard steps, show AI loading panel inside the card ──
    document.querySelectorAll('.wiz-panel').forEach(p => p.classList.remove('active'));
    document.getElementById('wizStepBar').style.display = 'none';
    document.getElementById('wizFooter').style.display = 'none';

    let aiLoadEl = document.getElementById('wizAILoadPanel');
    if (!aiLoadEl) {
        aiLoadEl = document.createElement('div');
        aiLoadEl.id = 'wizAILoadPanel';
        document.getElementById('wizardCard').appendChild(aiLoadEl);
    }
    aiLoadEl.style.display = 'block';
    aiLoadEl.innerHTML = `
      <div class="wiz-ai-load-wrap">
        <div class="wiz-ai-load-top">
          <div class="wiz-ai-orb">
            <div class="wiz-ai-orb-ring"></div>
            <div class="wiz-ai-orb-ring wiz-ai-orb-ring2"></div>
            <span class="wiz-ai-orb-icon">✦</span>
          </div>
          <div class="wiz-ai-load-text">
            <h3>Crafting Your Perfect Plan…</h3>
            <p>AI is building a personalised <strong>${dur}-day itinerary</strong> for <strong>${dest}</strong></p>
          </div>
        </div>
        <div class="wiz-ai-stages">
          <div class="wiz-ai-stage"         id="wizAIStage0"><span class="wiz-ai-stage-dot anim"></span><span>🗺️ Mapping best spots &amp; attractions</span></div>
          <div class="wiz-ai-stage pending" id="wizAIStage1"><span class="wiz-ai-stage-dot"></span><span>🏨 Selecting top hotels for your budget</span></div>
          <div class="wiz-ai-stage pending" id="wizAIStage2"><span class="wiz-ai-stage-dot"></span><span>🚆 Finding best trains &amp; transport routes</span></div>
          <div class="wiz-ai-stage pending" id="wizAIStage3"><span class="wiz-ai-stage-dot"></span><span>🍽️ Adding street food &amp; dining spots</span></div>
          <div class="wiz-ai-stage pending" id="wizAIStage4"><span class="wiz-ai-stage-dot"></span><span>💡 Gathering local insider tips</span></div>
          <div class="wiz-ai-stage pending" id="wizAIStage5"><span class="wiz-ai-stage-dot"></span><span>✦ Finalising your AI itinerary</span></div>
        </div>
        <div class="wiz-ai-progress-wrap">
          <div class="wiz-ai-progress-bar"><div class="wiz-ai-progress-fill" id="wizAIProgress" style="width:0%"></div></div>
          <span class="wiz-ai-progress-label" id="wizAIProgressLabel">0%</span>
        </div>
        <div class="wiz-ai-typing-row">
          <div class="wiz-ai-typing-dots"><span></span><span></span><span></span></div>
          <span class="wiz-ai-typing-text">AI is thinking…</span>
        </div>
      </div>`;

    document.getElementById('wizardCard').scrollIntoView({ behavior: 'smooth', block: 'start' });

    // ── Animate stages while API call runs ──
    const stagePcts = [12, 28, 46, 62, 78, 92];
    const stageTimers = stagePcts.map((pct, si) => setTimeout(() => {
        if (si > 0) {
            const prev = document.getElementById(`wizAIStage${si - 1}`);
            if (prev) { prev.classList.add('done'); prev.querySelector('.wiz-ai-stage-dot').classList.remove('anim'); }
        }
        const cur = document.getElementById(`wizAIStage${si}`);
        if (cur) { cur.classList.remove('pending'); cur.querySelector('.wiz-ai-stage-dot').classList.add('anim'); }
        const prog = document.getElementById('wizAIProgress');
        const lbl  = document.getElementById('wizAIProgressLabel');
        if (prog) prog.style.width = pct + '%';
        if (lbl)  lbl.textContent  = pct + '%';
    }, si * 1200));

    function finishLoading() {
        stageTimers.forEach(t => clearTimeout(t));
        for (let i = 0; i < 6; i++) {
            const s = document.getElementById(`wizAIStage${i}`);
            if (s) { s.classList.remove('pending'); s.classList.add('done'); s.querySelector('.wiz-ai-stage-dot').classList.remove('anim'); }
        }
        const prog = document.getElementById('wizAIProgress');
        const lbl  = document.getElementById('wizAIProgressLabel');
        if (prog) prog.style.width = '100%';
        if (lbl)  lbl.textContent  = '100%';
    }

    try {
        // Build per-day unique slot schema so AI generates distinct spots each day
        const dayThemes = ['Arrival & Iconic Landmarks','History & Heritage','Nature & Outdoors','Culture & Local Life','Food & Markets','Hidden Gems','Leisure & Departure'];
        const perDaySchema = Array.from({length: dur}, (_, i) => {
            const theme = dayThemes[i % dayThemes.length];
            return `{"day":${i+1},"title":"Day ${i+1} – ${theme}","theme_color":"<unique hex>","spots":[`
                + `{"order":1,"name":"<UNIQUE place NOT in any other day>","category":"Attraction","emoji":"🏛️","description":"<2 sentences>","time":"9:00 AM","duration":"2 hrs","entry_fee":"<₹X or Free>","tip":"<tip>","travel_to_next":{"mins":15,"mode":"auto","distance":"2km"}},`
                + `{"order":2,"name":"<2nd UNIQUE place for day ${i+1}>","category":"<Museum/Temple/Fort/Garden>","emoji":"🗺️","description":"<2 sentences>","time":"11:30 AM","duration":"1.5 hrs","entry_fee":"<₹X or Free>","tip":"<tip>","travel_to_next":{"mins":10,"mode":"walk","distance":"800m"}},`
                + `{"order":3,"name":"<Local food spot unique to day ${i+1}>","category":"Restaurant","emoji":"🍽️","description":"<2 sentences>","time":"1:30 PM","duration":"1 hr","entry_fee":"<₹X avg>","tip":"<tip>","travel_to_next":{"mins":20,"mode":"auto","distance":"3km"}},`
                + `{"order":4,"name":"<Afternoon attraction unique to day ${i+1}>","category":"<Attraction/Market/Lake>","emoji":"🌇","description":"<2 sentences>","time":"3:30 PM","duration":"1.5 hrs","entry_fee":"<₹X or Free>","tip":"<tip>","travel_to_next":{"mins":15,"mode":"auto","distance":"2km"}},`
                + `{"order":5,"name":"<Evening spot unique to day ${i+1}>","category":"<Temple/Park/Ghat/Market>","emoji":"🌙","description":"<2 sentences>","time":"6:30 PM","duration":"1 hr","entry_fee":"<₹X or Free>","tip":"<tip>","travel_to_next":null}]}`;
        }).join(',');

        const prompt = `You are an expert India travel planner. Create a COMPLETE ${dur}-day itinerary for ${dest}${from ? ` from ${from}` : ''}.
People: ${people}. Budget: ${budgetLabel} (Rs.${budgetPerPerson.toLocaleString('en-IN')}/person). Style: ${style}. Food: ${foodPref}${dietExtra}.

STRICT RULES:
1. Reply ONLY in valid JSON. No markdown, no code fences, no text outside JSON.
2. Every day MUST have EXACTLY 5 spots. All ${dur * 5} spots must be UNIQUE place names — no repeats across any day.
3. All places, hotels, trains, buses must be REAL and actually exist in ${dest}.
4. budget_per_person values must be plain integers in INR (no Rs symbol, no commas).

{"city":"${dest}","tagline":"<punchy 1-line about ${dest}>","overview":"<2 vivid sentences about this ${dur}-day trip>",
"transport":{"summary":"<how to reach ${dest}${from ? ' from ' + from : ''}>","options":[
{"mode":"Train","icon":"🚂","color":"#3b82f6","routes":[{"name":"<REAL train name>","number":"<number>","from":"<origin station>","to":"<${dest} station>","duration":"<Xhr Xm>","fare":"<Rs.X-X SL/3A>","frequency":"<X daily>","departs":"<HH:MM>","tip":"<tip>"}]},
{"mode":"Bus","icon":"🚌","color":"#10b981","routes":[{"name":"<REAL operator>","from":"<origin stand>","to":"<${dest} stand>","duration":"<Xhr>","fare":"<Rs.X-X>","frequency":"Multiple daily","departs":"Morning and Night","tip":"<tip>"}]},
{"mode":"Flight","icon":"✈️","color":"#8b5cf6","routes":[{"name":"IndiGo / Air India","from":"<origin airport>","to":"<nearest airport to ${dest}>","duration":"<Xhr>","fare":"<Rs.X-X>","frequency":"Daily","departs":"Multiple","tip":"<tip>"}]}
],"local_transport":{"options":[
{"mode":"Auto-rickshaw","icon":"🛺","cost":"Rs.X/km","tip":"<tip>"},
{"mode":"Local Bus","icon":"🚌","cost":"Rs.X-X","tip":"<tip>"},
{"mode":"Cab / Ola / Uber","icon":"🚕","cost":"Rs.X/km","tip":"<tip>"}
]}},
"hotels":[
{"name":"<REAL luxury hotel in ${dest}>","type":"Luxury","area":"<area>","address":"<address>","price_per_night":"Rs.X","price_range":"Rs.X-X","rating":"4.6","stars":5,"amenities":["Pool","Spa","Restaurant","WiFi","AC"],"distance_from_center":"Xkm","why":"<reason>","book_via":"MakeMyTrip"},
{"name":"<REAL mid-range hotel in ${dest}>","type":"Mid-range","area":"<area>","address":"<address>","price_per_night":"Rs.X","price_range":"Rs.X-X","rating":"4.1","stars":3,"amenities":["AC","WiFi","Restaurant"],"distance_from_center":"Xkm","why":"<reason>","book_via":"Booking.com"},
{"name":"<REAL budget hotel in ${dest}>","type":"Budget","area":"<area>","address":"<address>","price_per_night":"Rs.X","price_range":"Rs.X-X","rating":"3.8","stars":2,"amenities":["WiFi","AC","Hot Water"],"distance_from_center":"Xkm","why":"<reason>","book_via":"OYO"}
],
"days":[${perDaySchema}],
"budget_per_person":{"accommodation":0,"food":0,"transport":0,"activities":0},
"best_time":"<best months to visit ${dest}>",
"local_tips":["<tip1>","<tip2>","<tip3>","<tip4>"],
"emergency":{"police":"100","tourist_helpline":"1800-111-363","hospital":"<real hospital in ${dest}>"}}

FINAL CHECK: The days array must have EXACTLY ${dur} objects. Each with EXACTLY 5 spots. Zero repeated spot names. Return ONLY the JSON.`;

        const response = await callGroqAI([{ role: 'user', content: prompt }]);
        finishLoading();
        await new Promise(r => setTimeout(r, 500));
        aiLoadEl.style.display = 'none';
        document.getElementById('wizFooter').style.display = '';
        let planData;
        try {
            planData = JSON.parse(response.replace(/```json|```/g, '').trim());
        } catch (e) {
            planData = wizBuildFallback(dest, dur, cityData);
        }
        wizRenderResults(planData, dest, dur);
    } catch (err) {
        finishLoading();
        await new Promise(r => setTimeout(r, 400));
        aiLoadEl.style.display = 'none';
        document.getElementById('wizFooter').style.display = '';
        wizRenderResults(wizBuildFallback(dest, dur, cityData), dest, dur);
    }
}

function wizBuildFallback(destination, days, cityData) {
    const d = cityData || {};
    const perDay = d.per_day?.[wizState.budget] || 3000;
    const totalDays = Math.min(days, 7);
    const famous = d.famous || [`${destination} Heritage Site`, `${destination} City Centre`, `${destination} Museum`, 'Local Market', 'Sunset Point'];
    const spotsPool = [
        { name: famous[0], category: 'Attraction', emoji: '🏛️', description: `One of the most iconic sites in ${destination}. A must-visit on any trip.`, time: '9:00 AM', duration: '2 hrs', entry_fee: '₹50', tip: 'Visit early morning to avoid crowds.' },
        { name: famous[1] || `${destination} Old City`, category: 'Attraction', emoji: '🗺️', description: `Explore the historic heart of ${destination}.`, time: '11:30 AM', duration: '1.5 hrs', entry_fee: 'Free', tip: 'Wear comfortable shoes for walking.' },
        { name: (d.food && d.food[0]?.name ? `${d.food[0].name} at local dhaba` : `Famous ${destination} Thali`), category: 'Restaurant', emoji: '🍽️', description: `Try authentic local cuisine. A beloved spot among locals and tourists alike.`, time: '1:00 PM', duration: '1 hr', entry_fee: '₹150–300', tip: 'Order the house special.' },
        { name: famous[2] || `${destination} Museum`, category: 'Museum', emoji: '🏺', description: `Discover the rich cultural heritage and history of the region.`, time: '3:00 PM', duration: '1.5 hrs', entry_fee: '₹30', tip: 'Audio guides available at the entrance.' },
        { name: famous[3] || 'Local Bazaar', category: 'Market', emoji: '🛍️', description: `Browse colourful stalls selling local handicrafts and souvenirs.`, time: '5:00 PM', duration: '1.5 hrs', entry_fee: 'Free', tip: 'Bargain politely — start at 50% of asking price.' }
    ];
    return {
        city: destination,
        tagline: `Discover the wonders of ${destination}`,
        overview: `${destination} offers an unforgettable blend of culture, history, and natural beauty. This ${totalDays}-day plan takes you through its most iconic landmarks and hidden treasures.`,
        transport: {
            summary: `Multiple options available to reach ${destination} from ${wizState.from || 'your city'}.`,
            options: [
                {
                    mode: 'Train', icon: '🚂', color: '#3b82f6',
                    routes: [
                        { name: 'Express Train (check IRCTC)', number: '—', from: wizState.from || 'Your City', to: `${destination} Railway Station`, duration: 'Varies', fare: '₹300–₹2000 (SL/3A/2A)', frequency: 'Multiple daily', departs: 'Various', tip: 'Book 60 days ahead on IRCTC for best availability.' }
                    ]
                },
                {
                    mode: 'Bus', icon: '🚌', color: '#10b981',
                    routes: [
                        { name: 'State Transport / KSRTC / MSRTC', from: `${wizState.from || 'Your City'} Bus Stand`, to: `${destination} Bus Stand`, duration: 'Varies', fare: '₹200–₹800', frequency: 'Multiple daily', departs: 'Morning & Night', tip: 'Book on RedBus or at the bus stand counter.' }
                    ]
                },
                {
                    mode: 'Flight', icon: '✈️', color: '#8b5cf6',
                    routes: [
                        { name: 'IndiGo / Air India / SpiceJet', from: `${wizState.from || 'Nearest'} Airport`, to: `${destination} Airport`, duration: '1–3 hrs', fare: '₹2500–₹9000', frequency: 'Daily', departs: 'Multiple', tip: 'Book 4–6 weeks in advance for lowest fares.' }
                    ]
                }
            ],
            local_transport: {
                options: [
                    { mode: 'Auto-rickshaw', icon: '🛺', cost: '₹15–₹25/km', tip: 'Use meter or pre-negotiate fare.' },
                    { mode: 'Local Bus', icon: '🚌', cost: '₹5–₹20', tip: 'Cheapest way to explore.' },
                    { mode: 'Cab / Ola / Uber', icon: '🚕', cost: '₹12–₹18/km', tip: 'Most convenient, use app for fixed price.' }
                ]
            }
        },
        hotels: [
            { name: `Heritage Resort ${destination}`, type: 'Luxury', area: 'City Centre', address: `Near Main Chowk, ${destination}`, price_per_night: '₹4500', price_range: '₹4000–₹6000', rating: '4.4', stars: 4, amenities: ['Pool', 'Spa', 'Restaurant', 'Free WiFi', 'AC'], distance_from_center: '0.5 km from city centre', why: 'Best views, heritage property, central location.', book_via: 'MakeMyTrip / Booking.com' },
            { name: `Comfort Inn ${destination}`, type: 'Mid-range', area: 'Near Bus Stand', address: `Bus Stand Road, ${destination}`, price_per_night: '₹1800', price_range: '₹1500–₹2200', rating: '4.0', stars: 3, amenities: ['AC', 'Free WiFi', 'Restaurant', 'Parking'], distance_from_center: '1.2 km from city centre', why: 'Clean rooms, great value, easy access.', book_via: 'MakeMyTrip / Booking.com' },
            { name: `Budget Stay ${destination}`, type: 'Budget', area: 'Old City', address: `Old Market Area, ${destination}`, price_per_night: '₹700', price_range: '₹500–₹900', rating: '3.8', stars: 2, amenities: ['WiFi', 'AC', 'Hot Water'], distance_from_center: '1.8 km from city centre', why: 'Affordable, well-located near main attractions.', book_via: 'OYO / Booking.com' }
        ],
        days: Array.from({ length: totalDays }, (_, i) => ({
            day: i + 1,
            title: i === 0 ? 'Arrival & First Impressions' : i === totalDays - 1 ? 'Final Gems & Departure' : `Explore ${destination} — Day ${i + 1}`,
            theme_color: ['#3a8c7e', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#10b981', '#f97316'][i % 7],
            spots: spotsPool.map((s, si) => ({
                ...s,
                order: si + 1,
                travel_to_next: si < spotsPool.length - 1 ? { mins: 10 + Math.floor(Math.random() * 15), mode: si % 2 === 0 ? 'walk' : 'auto', distance: `${(0.5 + Math.random() * 1.5).toFixed(1)}km` } : null
            }))
        })),
        budget_per_person: {
            accommodation: Math.round(perDay * 0.4) * totalDays,
            food: Math.round(perDay * 0.25) * totalDays,
            transport: Math.round(perDay * 0.2) * totalDays,
            activities: Math.round(perDay * 0.15) * totalDays
        },
        best_time: 'October to March for most parts of India.',
        local_tips: [`Carry cash — many local shops don't accept cards in ${destination}.`, 'Dress modestly when visiting temples and religious sites.', 'Download offline maps before you travel.'],
        emergency: { police: '100', tourist_helpline: '1800-111-363', hospital: `District Hospital, ${destination}` }
    };
}


// ── Booking URL map ──────────────────────────────────────────────
const BOOKING_URLS = {
    train:   'https://www.irctc.co.in/nget/train-search',
    bus:     'https://www.redbus.in',
    flight:  'https://www.makemytrip.com/flights/',
    MakeMyTrip:  'https://www.makemytrip.com/hotels/',
    'Booking.com':'https://www.booking.com',
    OYO:         'https://www.oyorooms.com',
    Goibibo:     'https://www.goibibo.com/hotels/',
    Agoda:       'https://www.agoda.com',
    Airbnb:      'https://www.airbnb.com',
    Treebo:      'https://www.treebo.com',
    FabHotels:   'https://www.fabhotels.com',
};
function getBookingUrl(key) {
    return BOOKING_URLS[key] || 'https://www.makemytrip.com/hotels/';
}
function getTransportUrl(mode) {
    if (!mode) return '#';
    const m = mode.toLowerCase();
    if (m.includes('train')) return BOOKING_URLS.train;
    if (m.includes('bus'))   return BOOKING_URLS.bus;
    if (m.includes('flight') || m.includes('air')) return BOOKING_URLS.flight;
    return '#';
}

function wizRenderResults(plan, destination, duration) {
    document.querySelectorAll('.wiz-panel').forEach(p => p.classList.remove('active'));
    document.getElementById('wizStepBar').style.display = 'none';
    document.getElementById('wizResultPanel').classList.add('active');

    const budgetData = plan.budget_per_person || plan.budget || {};
    const total = Object.values(budgetData).reduce((a, b) => a + (Number(b) || 0), 0);
    const people = wizState.adults + wizState.children;
    const totalAll = total * people;
    const budgetLabel = wizState.customBudget
        ? `Custom ₹${wizState.customBudget.toLocaleString('en-IN')}/person`
        : { budget: 'Budget 🎒', normal: 'Mid-Range ✈️', luxury: 'Luxury 👑' }[wizState.budget] || '';
    const foodLabel = { veg: '🥗 Veg', both: '🍱 All Food' }[wizState.food] || '';

    document.getElementById('wizResultTitle').textContent = `Your ${plan.city || destination} Plan ✦`;
    document.getElementById('wizResultSubtitle').textContent =
        `${duration} days · ${budgetLabel} · ${people} traveller${people > 1 ? 's' : ''}`;

    const bTotal = total || 1;
    const bPct = (v) => Math.round(((v || 0) / bTotal) * 100);

    // Support both new "days" format and legacy "day_plan"
    const daysData = plan.days || (plan.day_plan || []).map(d => ({
        day: d.day, title: d.title,
        theme_color: '#3a8c7e',
        spots: [
            { order: 1, name: d.morning?.place || d.morning || 'Morning Activity', category: 'Attraction', emoji: '🌅', description: d.morning?.activity || (typeof d.morning === 'string' ? d.morning : ''), time: d.morning?.time || '9:00 AM', duration: '2 hrs', entry_fee: '', tip: d.morning?.tip || '', travel_to_next: { mins: 20, mode: 'auto', distance: '1.5km' } },
            { order: 2, name: d.afternoon?.place || d.afternoon || 'Afternoon Spot', category: 'Attraction', emoji: '☀️', description: d.afternoon?.activity || (typeof d.afternoon === 'string' ? d.afternoon : ''), time: d.afternoon?.time || '1:00 PM', duration: '2 hrs', entry_fee: '', tip: d.afternoon?.tip || '', travel_to_next: { mins: 15, mode: 'walk', distance: '800m' } },
            { order: 3, name: d.food || 'Local Restaurant', category: 'Restaurant', emoji: '🍽️', description: 'Enjoy authentic local cuisine.', time: '3:30 PM', duration: '1 hr', entry_fee: '₹150–300', tip: 'Try the house special.', travel_to_next: null },
            { order: 4, name: d.evening?.place || d.evening || 'Evening Activity', category: 'Attraction', emoji: '🌙', description: d.evening?.activity || (typeof d.evening === 'string' ? d.evening : ''), time: d.evening?.time || '6:00 PM', duration: '2 hrs', entry_fee: '', tip: d.evening?.tip || '', travel_to_next: null }
        ]
    }));

    // Category colour mapping
    const catColor = { Attraction: '#3b82f6', Restaurant: '#f59e0b', Temple: '#8b5cf6', Museum: '#ec4899', Market: '#f97316', Nature: '#10b981', Hotel: '#3a8c7e', Shopping: '#e879f9', default: '#6b7280' };
    const modeIcon = { walk: '🚶', auto: '🛺', taxi: '🚕', bus: '🚌', default: '🚗' };

    // Build day tabs
    const tabsHtml = daysData.map((d, i) => `
      <button class="rp-day-tab ${i === 0 ? 'active' : ''}" onclick="rpSwitchDay(${i})" data-day="${i}">
        <span class="rp-tab-num">Day ${d.day}</span>
        <span class="rp-tab-title">${d.title || ''}</span>
      </button>`).join('');

    // Build each day's spots — beautiful timeline style
    const daysHtml = daysData.map((d, di) => `
      <div class="rp-day-panel ${di === 0 ? 'active' : ''}" id="rpDay${di}">
        <div class="rp-day-header" style="border-left:4px solid ${d.theme_color || '#3a8c7e'}; background: ${d.theme_color || '#3a8c7e'}0f; border-radius: 0 10px 10px 0; padding: 12px 16px; margin-bottom: 16px;">
          <div class="rp-day-badge" style="background: linear-gradient(135deg, ${d.theme_color || '#3a8c7e'}, ${d.theme_color || '#3a8c7e'}cc); box-shadow: 0 3px 12px ${d.theme_color || '#3a8c7e'}44;">Day ${d.day}</div>
          <div class="rp-day-title-full" style="font-size: 1rem; font-weight: 700;">${d.title || `Day ${d.day} in ${plan.city || destination}`}</div>
          <div class="rp-day-spot-count" style="background: ${d.theme_color || '#3a8c7e'}22; color: ${d.theme_color || '#3a8c7e'}; border-radius: 20px; padding: 2px 10px; font-size: 0.72rem; font-weight: 600;">${(d.spots || []).length} stops</div>
        </div>
        <div class="rp-spots-list" style="position: relative; padding-left: 8px;">
          ${(d.spots || []).map((s, si) => `
          <div class="rp-spot-item" style="display: flex; gap: 14px; margin-bottom: 6px; position: relative;">
            <div style="display: flex; flex-direction: column; align-items: center; flex-shrink: 0;">
              <div class="rp-spot-num" style="width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, ${catColor[s.category] || catColor.default}, ${catColor[s.category] || catColor.default}99); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 700; flex-shrink: 0; box-shadow: 0 3px 10px ${catColor[s.category] || catColor.default}44;">${s.order || si + 1}</div>
              ${s.travel_to_next ? `<div style="width: 2px; flex: 1; min-height: 20px; background: linear-gradient(to bottom, ${catColor[s.category] || catColor.default}66, transparent); margin-top: 4px;"></div>` : ''}
            </div>
            <div class="rp-spot-body" style="flex: 1; background: var(--bg-card); border: 1px solid var(--border); border-radius: 14px; padding: 14px; margin-bottom: 4px; transition: all 0.2s; border-left: 3px solid ${catColor[s.category] || catColor.default};">
              <div class="rp-spot-top" style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; margin-bottom: 8px;">
                <div class="rp-spot-info" style="flex: 1; min-width: 0;">
                  <div class="rp-spot-name" style="font-weight: 700; font-size: 0.9rem; color: var(--text); margin-bottom: 6px;">${s.emoji || '📍'} ${s.name}</div>
                  <div class="rp-spot-meta" style="display: flex; flex-wrap: wrap; gap: 5px;">
                    <span class="rp-spot-cat" style="background:${(catColor[s.category] || catColor.default)}18; color:${catColor[s.category] || catColor.default}; border: 1px solid ${catColor[s.category] || catColor.default}30; border-radius: 20px; padding: 2px 8px; font-size: 0.68rem; font-weight: 600; letter-spacing: 0.03em;">${s.category || 'Attraction'}</span>
                    ${s.time ? `<span style="background: var(--bg-2); color: var(--text-muted); border-radius: 20px; padding: 2px 8px; font-size: 0.68rem; border: 1px solid var(--border);">🕐 ${s.time}</span>` : ''}
                    ${s.duration ? `<span style="background: var(--bg-2); color: var(--text-muted); border-radius: 20px; padding: 2px 8px; font-size: 0.68rem; border: 1px solid var(--border);">⏱ ${s.duration}</span>` : ''}
                  </div>
                </div>
                ${s.entry_fee ? `<div style="background: #f59e0b18; color: #f59e0b; border: 1px solid #f59e0b30; border-radius: 8px; padding: 4px 10px; font-size: 0.75rem; font-weight: 700; white-space: nowrap; flex-shrink: 0;">${s.entry_fee}</div>` : ''}
              </div>
              ${s.description ? `<p style="font-size: 0.82rem; color: var(--text-muted); line-height: 1.55; margin-bottom: 8px;">${s.description}</p>` : ''}
              ${s.tip ? `<div style="background: #ABD1C614; border: 1px solid #ABD1C630; border-radius: 8px; padding: 7px 10px; font-size: 0.78rem; color: var(--uv); display: flex; gap: 6px; align-items: flex-start;"><span style="flex-shrink:0;">💡</span><span>${s.tip}</span></div>` : ''}
              ${s.travel_to_next ? `
              <div style="display: flex; align-items: center; gap: 8px; margin-top: 10px; padding-top: 10px; border-top: 1px dashed var(--border);">
                <span style="font-size: 1rem;">${modeIcon[s.travel_to_next.mode] || '🚗'}</span>
                <span style="font-size: 0.75rem; color: var(--text-dim);">${s.travel_to_next.mins} min · ${s.travel_to_next.distance} · ${s.travel_to_next.mode}</span>
              </div>` : ''}
            </div>
          </div>`).join('')}
        </div>
      </div>`).join('');

    document.getElementById('wizResultCards').innerHTML = `
    <style>
      .nr-hero { background: linear-gradient(135deg, var(--bg-card) 0%, var(--bg-2) 100%); border: 1px solid var(--border); border-radius: 20px; padding: 28px 24px; margin-bottom: 20px; position: relative; overflow: hidden; }
      .nr-hero::before { content: ''; position: absolute; top: -40px; right: -40px; width: 180px; height: 180px; border-radius: 50%; background: radial-gradient(circle, var(--uv-mist) 0%, transparent 70%); pointer-events: none; }
      .nr-hero-title { font-family: 'Cormorant Garamond', serif; font-size: 2rem; font-weight: 700; color: var(--uv); margin-bottom: 4px; letter-spacing: -0.02em; }
      .nr-hero-tagline { font-size: 0.88rem; color: var(--text-muted); margin-bottom: 18px; font-style: italic; }
      .nr-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
      @media (max-width: 500px) { .nr-stats { grid-template-columns: repeat(2, 1fr); } .nr-hero-title { font-size: 1.5rem; } }
      .nr-stat { background: var(--bg); border: 1px solid var(--border); border-radius: 12px; padding: 12px 10px; text-align: center; }
      .nr-stat-val { font-size: 1.3rem; font-weight: 700; color: var(--uv); line-height: 1.1; }
      .nr-stat-lbl { font-size: 0.65rem; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.06em; margin-top: 3px; }
      .nr-overview { background: var(--bg-card); border: 1px solid var(--border); border-left: 4px solid var(--uv); border-radius: 14px; padding: 16px 18px; margin-bottom: 20px; font-size: 0.88rem; color: var(--text-muted); line-height: 1.65; font-style: italic; }
      .nr-section { background: var(--bg-card); border: 1px solid var(--border); border-radius: 18px; overflow: hidden; margin-bottom: 16px; }
      .nr-section-head { display: flex; align-items: center; gap: 10px; padding: 14px 18px; border-bottom: 1px solid var(--border); }
      .nr-section-icon { font-size: 1.2rem; width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
      .nr-section-title { font-size: 0.88rem; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; color: var(--text); flex: 1; }
      .nr-section-badge { font-size: 0.68rem; color: var(--uv); background: var(--uv-mist); border: 1px solid var(--lc-border); border-radius: 20px; padding: 2px 10px; font-weight: 600; }
      .nr-section-body { padding: 16px 18px; }
      .nr-hotel-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 12px; padding: 16px 18px; }
      .nr-hotel { background: var(--bg); border: 1px solid var(--border); border-radius: 14px; padding: 14px; transition: all 0.2s; }
      .nr-hotel:hover { border-color: var(--uv); transform: translateY(-2px); box-shadow: 0 8px 24px var(--lc-glow); }
      .nr-hotel-badge { display: inline-block; border-radius: 6px; padding: 2px 9px; font-size: 0.68rem; font-weight: 700; margin-bottom: 6px; }
      .nr-hotel-name { font-size: 0.92rem; font-weight: 700; color: var(--text); margin-bottom: 6px; }
      .nr-hotel-loc { font-size: 0.75rem; color: var(--text-dim); margin-bottom: 8px; display: flex; align-items: flex-start; gap: 4px; }
      .nr-hotel-amenities { display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 10px; }
      .nr-amenity { background: var(--bg-2); border: 1px solid var(--border); border-radius: 6px; padding: 2px 7px; font-size: 0.65rem; color: var(--text-muted); }
      .nr-hotel-footer { display: flex; justify-content: space-between; align-items: flex-end; border-top: 1px solid var(--border); padding-top: 8px; }
      .nr-hotel-price { font-size: 1.05rem; font-weight: 700; color: var(--uv); }
      .nr-hotel-price span { font-size: 0.68rem; font-weight: 400; color: var(--text-dim); }
      .nr-hotel-book { font-size: 0.68rem; color: var(--text-dim); text-align: right; }
      .nr-hotel-stars { color: #f59e0b; font-size: 0.75rem; letter-spacing: 1px; }
      .nr-bud-row { margin-bottom: 12px; }
      .nr-bud-label-row { display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 0.82rem; color: var(--text-muted); }
      .nr-bud-amt { font-weight: 700; color: var(--text); }
      .nr-bud-bar { height: 7px; background: var(--bg-2); border-radius: 4px; overflow: hidden; }
      .nr-bud-fill { height: 100%; border-radius: 4px; transition: width 0.8s ease; }
      .nr-bud-total { display: flex; justify-content: space-between; align-items: center; padding: 12px 0 0; border-top: 1px solid var(--border); margin-top: 8px; }
      .nr-bud-total-lbl { font-size: 0.85rem; color: var(--text-muted); font-weight: 600; }
      .nr-bud-total-val { font-size: 1.1rem; font-weight: 700; color: var(--uv); }
      .nr-tip-item { display: flex; gap: 10px; align-items: flex-start; padding: 10px 0; border-bottom: 1px solid var(--border); font-size: 0.83rem; color: var(--text-muted); line-height: 1.5; }
      .nr-tip-item:last-child { border-bottom: none; }
      .nr-tip-dot { color: var(--uv); font-size: 0.8rem; flex-shrink: 0; margin-top: 2px; }
      .nr-em-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
      .nr-em-item { background: var(--bg); border: 1px solid var(--border); border-radius: 10px; padding: 10px 12px; display: flex; flex-direction: column; gap: 2px; }
      .nr-em-label { font-size: 0.68rem; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.05em; }
      .nr-em-val { font-size: 1rem; font-weight: 700; color: var(--uv); }
      .nr-best-time { font-size: 0.85rem; color: var(--text-muted); line-height: 1.6; }
      .nr-bottom-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
      @media (max-width: 560px) { .nr-bottom-grid { grid-template-columns: 1fr; } }
      .nr-trans-tabs { display: flex; gap: 8px; padding: 12px 18px; border-bottom: 1px solid var(--border); }
      .nr-trans-tab { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 10px 6px; border-radius: 10px; border: 1px solid var(--border); background: var(--bg); cursor: pointer; transition: all 0.2s; font-family: inherit; color: var(--text-muted); font-size: 0.78rem; font-weight: 600; }
      .nr-trans-tab.active { background: var(--uv-mist); border-color: var(--uv); color: var(--uv); }
      .nr-trans-panel { display: none; padding: 16px 18px; gap: 12px; flex-direction: column; }
      .nr-trans-panel.active { display: flex; }
      .nr-route-card { background: var(--bg); border: 1px solid var(--border); border-radius: 12px; padding: 14px; }
      .nr-route-name { font-weight: 700; font-size: 0.88rem; color: var(--text); margin-bottom: 10px; }
      .nr-route-journey { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
      .nr-route-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
      .nr-route-from, .nr-route-to { flex-shrink: 0; }
      .nr-route-station-lbl { font-size: 0.6rem; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-dim); }
      .nr-route-station { font-size: 0.8rem; font-weight: 600; color: var(--text); }
      .nr-route-line { flex: 1; height: 1px; background: var(--border); position: relative; display: flex; align-items: center; justify-content: center; }
      .nr-route-dur { background: var(--bg-card); border: 1px solid var(--border); border-radius: 20px; padding: 2px 8px; font-size: 0.7rem; color: var(--text-muted); white-space: nowrap; }
      .nr-route-meta { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 8px; }
      .nr-route-chip { background: var(--bg-2); border: 1px solid var(--border); border-radius: 20px; padding: 2px 9px; font-size: 0.7rem; color: var(--text-muted); }
      .nr-route-tip { background: var(--uv-mist); border: 1px solid var(--lc-border); border-radius: 8px; padding: 7px 10px; font-size: 0.75rem; color: var(--uv); }
      .nr-local-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; padding-top: 12px; border-top: 1px solid var(--border); margin-top: 4px; }
      @media (max-width: 480px) { .nr-local-grid { grid-template-columns: 1fr 1fr; } }
      .nr-local-item { background: var(--bg); border: 1px solid var(--border); border-radius: 10px; padding: 10px; text-align: center; }
      .nr-local-icon { font-size: 1.4rem; }
      .nr-local-mode { font-size: 0.72rem; font-weight: 700; color: var(--text); margin-top: 4px; }
      .nr-local-cost { font-size: 0.7rem; color: var(--uv); font-weight: 600; }
    </style>

    <!-- HERO HEADER -->
    <div class="nr-hero">
      <div class="nr-hero-title">${plan.city || destination}</div>
      <div class="nr-hero-tagline">${plan.tagline || `Discover the wonders of ${plan.city || destination}`}</div>
      <div class="nr-stats">
        <div class="nr-stat"><div class="nr-stat-val">${duration}</div><div class="nr-stat-lbl">Days</div></div>
        <div class="nr-stat"><div class="nr-stat-val">${people}</div><div class="nr-stat-lbl">Traveller${people > 1 ? 's' : ''}</div></div>
        <div class="nr-stat"><div class="nr-stat-val">₹${(total / 1000).toFixed(1)}k</div><div class="nr-stat-lbl">Per Person</div></div>
        <div class="nr-stat"><div class="nr-stat-val">₹${(totalAll / 1000).toFixed(1)}k</div><div class="nr-stat-lbl">Total Est.</div></div>
      </div>
    </div>

    ${plan.overview ? `<div class="nr-overview">"${plan.overview}"</div>` : ''}

    <!-- DAY-BY-DAY ITINERARY -->
    <div class="nr-section">
      <div class="nr-section-head">
        <div class="nr-section-icon" style="background: #3b82f620; color: #3b82f6;">📅</div>
        <div class="nr-section-title">Day-by-Day Itinerary</div>
        <div class="nr-section-badge">✦ AI Generated</div>
      </div>
      <div style="padding: 12px 16px 0;">
        <div class="rp-day-tabs" id="rpDayTabs">${tabsHtml}</div>
      </div>
      <div style="padding: 16px 16px 8px;" id="rpDaysContainer">${daysHtml}</div>
    </div>

    <!-- TRANSPORT -->
    ${plan.transport ? (() => {
        const t = plan.transport;
        const isNew = t.options && Array.isArray(t.options);
        if (!isNew) {
            return `<div class="nr-section">
              <div class="nr-section-head"><div class="nr-section-icon" style="background:#3b82f620;color:#3b82f6;">🚆</div><div class="nr-section-title">How to Get There</div></div>
              <div class="nr-section-body">
                ${t.how_to_reach ? `<div class="nr-tip-item"><span class="nr-tip-dot">✈️</span><span>${t.how_to_reach}</span></div>` : ''}
                ${t.train ? `<div class="nr-tip-item"><span class="nr-tip-dot">🚂</span><span>${t.train}</span></div>` : ''}
                ${t.local_transport ? `<div class="nr-tip-item"><span class="nr-tip-dot">🛺</span><span>${t.local_transport}</span></div>` : ''}
              </div></div>`;
        }
        return `<div class="nr-section">
          <div class="nr-section-head"><div class="nr-section-icon" style="background:#3b82f620;color:#3b82f6;">🗺️</div><div class="nr-section-title">How to Get There</div><div class="nr-section-badge">✦ Route Guide</div></div>
          ${t.summary ? `<div style="padding: 10px 18px; font-size: 0.83rem; color: var(--text-muted); border-bottom: 1px solid var(--border);">${t.summary}</div>` : ''}
          <div class="nr-trans-tabs">
            ${t.options.map((opt, i) => `<button class="nr-trans-tab ${i === 0 ? 'active' : ''}" onclick="rpSwitchTransportNr(this, ${i})" style="${i===0?'--tc:'+opt.color:''}"><span style="font-size:1.3rem">${opt.icon}</span><span>${opt.mode}</span></button>`).join('')}
          </div>
          ${t.options.map((opt, i) => `
          <div class="nr-trans-panel ${i === 0 ? 'active' : ''}" id="nrTrans${i}">
            ${(opt.routes || []).map(r => `
            <div class="nr-route-card" style="border-left: 3px solid ${opt.color || '#3b82f6'};">
              <div class="nr-route-name">${r.name}${r.number && r.number !== '—' ? ` <span style="background:${opt.color}22;color:${opt.color};border-radius:5px;padding:1px 6px;font-size:0.65rem;margin-left:5px;">#${r.number}</span>` : ''} <span style="float:right;color:${opt.color};font-weight:700;font-size:0.85rem;">${r.fare || ''}</span></div>
              <div class="nr-route-journey">
                <div class="nr-route-from"><div class="nr-route-station-lbl">FROM</div><div class="nr-route-station">${r.from || ''}</div></div>
                <div class="nr-route-line"><div class="nr-route-dur">${r.duration || ''}</div></div>
                <div class="nr-route-to"><div class="nr-route-station-lbl">TO</div><div class="nr-route-station">${r.to || ''}</div></div>
              </div>
              <div class="nr-route-meta">
                ${r.departs ? `<span class="nr-route-chip">🕐 ${r.departs}</span>` : ''}
                ${r.frequency ? `<span class="nr-route-chip">📅 ${r.frequency}</span>` : ''}
              </div>
              ${r.tip ? `<div class="nr-route-tip">💡 ${r.tip}</div>` : ''}
              <a href="${getTransportUrl(opt.mode)}" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:6px;margin-top:10px;padding:7px 14px;background:${opt.color||'#3b82f6'}18;border:1px solid ${opt.color||'#3b82f6'}44;border-radius:8px;color:${opt.color||'#3b82f6'};font-size:0.75rem;font-weight:700;text-decoration:none;transition:all 0.2s;" onmouseover="this.style.background='${opt.color||'#3b82f6'}30'" onmouseout="this.style.background='${opt.color||'#3b82f6'}18'">
                ${opt.mode==='Train'?'🚂 Book on IRCTC':opt.mode==='Bus'?'🚌 Book on RedBus':'✈️ Search Flights'} ↗
              </a>
            </div>`).join('')}
          </div>`).join('')}
          ${t.local_transport && t.local_transport.options ? `
          <div style="padding: 0 18px 16px;">
            <div style="font-size:0.78rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:8px;">🏙️ Getting Around ${plan.city || destination}</div>
            <div class="nr-local-grid">
              ${t.local_transport.options.map(lo => `<div class="nr-local-item"><div class="nr-local-icon">${lo.icon}</div><div class="nr-local-mode">${lo.mode}</div><div class="nr-local-cost">${lo.cost}</div></div>`).join('')}
            </div>
          </div>` : ''}
        </div>`;
    })() : ''}

    <!-- HOTELS -->
    ${(plan.hotels && plan.hotels.length) ? `
    <div class="nr-section">
      <div class="nr-section-head">
        <div class="nr-section-icon" style="background: #10b98120; color: #10b981;">🏨</div>
        <div class="nr-section-title">Where to Stay</div>
        <div class="nr-section-badge">✦ ${plan.hotels.length} Options</div>
      </div>
      <div class="nr-hotel-grid">
        ${plan.hotels.map(h => {
            const stars = Math.max(1, Math.min(5, parseInt(h.stars) || Math.round(parseFloat(h.rating || 4))));
            const typeColor = { Luxury: '#f59e0b', 'Mid-range': '#3b82f6', Budget: '#10b981' };
            const col = typeColor[h.type] || '#3a8c7e';
            return `<div class="nr-hotel">
              <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px;">
                <span class="nr-hotel-badge" style="background:${col}18;color:${col};border:1px solid ${col}30;">${h.type || 'Hotel'}</span>
                <div class="nr-hotel-stars">${'★'.repeat(stars)}<span style="opacity:0.25">${'★'.repeat(5-stars)}</span></div>
              </div>
              <div class="nr-hotel-name">${h.name}</div>
              <div class="nr-hotel-loc"><span>📍</span><span>${h.area || ''}${h.address ? ' · ' + h.address : ''}${h.distance_from_center ? ' · ' + h.distance_from_center : ''}</span></div>
              ${h.amenities && h.amenities.length ? `<div class="nr-hotel-amenities">${h.amenities.slice(0,5).map(a=>`<span class="nr-amenity">${a}</span>`).join('')}</div>` : ''}
              ${h.why ? `<div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:8px;font-style:italic;">✦ ${h.why}</div>` : ''}
              <div class="nr-hotel-footer">
                <div><div class="nr-hotel-price">₹${h.price_per_night || ''}<span>/night</span></div>${h.price_range?`<div style="font-size:0.65rem;color:var(--text-dim);">${h.price_range}</div>`:''}</div>
                ${h.book_via?`<a href="${getBookingUrl(h.book_via)}" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:5px;padding:6px 12px;background:var(--uv-mist);border:1px solid var(--lc-border);border-radius:8px;color:var(--uv);font-size:0.72rem;font-weight:700;text-decoration:none;">🔗 ${h.book_via} ↗</a>`:''}
              </div>
            </div>`;}).join('')}
      </div>
    </div>` : ''}

    <!-- BUDGET BREAKDOWN -->
    <div class="nr-section">
      <div class="nr-section-head">
        <div class="nr-section-icon" style="background: #8b5cf620; color: #8b5cf6;">💰</div>
        <div class="nr-section-title">Budget Breakdown</div>
        <div class="nr-section-badge">Per Person</div>
      </div>
      <div class="nr-section-body">
        ${[['🏨','Accommodation','accommodation','var(--uv)'],['🍽️','Food & Dining','food','#f59e0b'],['🚆','Transport','transport','#8b5cf6'],['🎭','Activities','activities','#ec4899']].map(([ic,lb,key,col]) => `
        <div class="nr-bud-row">
          <div class="nr-bud-label-row"><span>${ic} ${lb}</span><span class="nr-bud-amt">₹${(budgetData[key] || 0).toLocaleString('en-IN')}</span></div>
          <div class="nr-bud-bar"><div class="nr-bud-fill" style="width:${bPct(budgetData[key])}%;background:${col}"></div></div>
        </div>`).join('')}
        <div class="nr-bud-total"><span class="nr-bud-total-lbl">Per Person Total</span><span class="nr-bud-total-val">₹${total.toLocaleString('en-IN')}</span></div>
        ${people > 1 ? `<div class="nr-bud-total" style="border-top:none;padding-top:0;"><span class="nr-bud-total-lbl" style="color:var(--text-dim)">Total for ${people} people</span><span style="font-size:0.95rem;font-weight:700;color:var(--uv-dark)">₹${totalAll.toLocaleString('en-IN')}</span></div>` : ''}
      </div>
    </div>

    <!-- TIPS + BOTTOM INFO -->
    <div class="nr-bottom-grid">
      ${((plan.local_tips && plan.local_tips.length) || plan.tips) ? `
      <div class="nr-section" style="margin-bottom:0">
        <div class="nr-section-head"><div class="nr-section-icon" style="background:#f59e0b20;color:#f59e0b;">💡</div><div class="nr-section-title">Local Tips</div></div>
        <div class="nr-section-body">
          ${(plan.local_tips || [plan.tips]).filter(Boolean).map(t => `<div class="nr-tip-item"><span class="nr-tip-dot">✦</span><span>${t}</span></div>`).join('')}
        </div>
      </div>` : `<div></div>`}

      <div style="display:flex;flex-direction:column;gap:12px;">
        ${plan.best_time ? `
        <div class="nr-section" style="margin-bottom:0">
          <div class="nr-section-head"><div class="nr-section-icon" style="background:#10b98120;color:#10b981;">🌤️</div><div class="nr-section-title">Best Time</div></div>
          <div class="nr-section-body"><div class="nr-best-time">${plan.best_time}</div></div>
        </div>` : ''}
        ${plan.emergency ? `
        <div class="nr-section" style="margin-bottom:0">
          <div class="nr-section-head"><div class="nr-section-icon" style="background:#ef444420;color:#ef4444;">🆘</div><div class="nr-section-title">Emergency</div></div>
          <div class="nr-section-body">
            <div class="nr-em-grid">
              <div class="nr-em-item"><div class="nr-em-label">Police</div><div class="nr-em-val">${plan.emergency.police || '100'}</div></div>
              <div class="nr-em-item"><div class="nr-em-label">Tourist Helpline</div><div class="nr-em-val" style="font-size:0.75rem">${plan.emergency.tourist_helpline || '1800-111-363'}</div></div>
              ${plan.emergency.hospital ? `<div class="nr-em-item" style="grid-column:1/-1"><div class="nr-em-label">Hospital</div><div style="font-size:0.78rem;color:var(--text-muted)">${plan.emergency.hospital}</div></div>` : ''}
            </div>
          </div>
        </div>` : ''}
      </div>
    </div>
    `;

    document.getElementById('wizFooter').innerHTML = `
      <button class="wiz-btn-back" onclick="wizReset()">← Plan Another Trip</button>
      <span class="wiz-step-count">✦ AI Plan Ready</span>
      <button class="wiz-btn-next wiz-btn-pdf" onclick="wizDownloadPDF()">⬇ Download PDF</button>`;

    document.getElementById('wizResultPanel').scrollIntoView({ behavior: 'smooth', block: 'start' });
    window._lastPlanData = { plan, destination, duration, wizState: { ...wizState }, total, totalAll, budgetLabel, foodLabel };
}

function rpSwitchTransportNr(btn, idx) {
    const allBtns = btn.closest('.nr-trans-tabs').querySelectorAll('.nr-trans-tab');
    allBtns.forEach((b, i) => b.classList.toggle('active', i === idx));
    const container = btn.closest('.nr-section');
    container.querySelectorAll('.nr-trans-panel').forEach((p, i) => p.classList.toggle('active', i === idx));
}

// ── Tab switching for Roamy-style day view ──────────────────────
function rpSwitchDay(idx) {
    document.querySelectorAll('.rp-day-tab').forEach((t, i) => t.classList.toggle('active', i === idx));
    document.querySelectorAll('.rp-day-panel').forEach((p, i) => p.classList.toggle('active', i === idx));
    const panel = document.getElementById(`rpDay${idx}`);
    if (panel) panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ── Tab switching for transport modes ───────────────────────────
function rpSwitchTransport(idx) {
    document.querySelectorAll('.rp-trans-tab').forEach((t, i) => t.classList.toggle('active', i === idx));
    document.querySelectorAll('.rp-trans-panel').forEach((p, i) => p.classList.toggle('active', i === idx));
}

function wizDownloadPDF() {
    const btn = document.querySelector('.wiz-btn-pdf');
    if (btn) { btn.disabled = true; btn.innerHTML = '⏳ Generating…'; }

    const { plan, destination, duration, total, budgetLabel, foodLabel } = window._lastPlanData || {};
    if (!plan) {
        showToast('No plan data found. Please generate a plan first.', 'error');
        if (btn) { btn.disabled = false; btn.innerHTML = '⬇ Download PDF'; }
        return;
    }

    const people = wizState.adults + wizState.children;
    const city = plan.city || destination;
    const budgetData = plan.budget_per_person || plan.budget || {};
    const bPct = (v) => Math.round(((v || 0) / (total || 1)) * 100);

    // Use new `days` format if available, fallback to day_plan
    const daysData = plan.days || (plan.day_plan || []).map(d => ({
        day: d.day,
        title: d.title || `Day ${d.day}`,
        theme_color: '#3a8c7e',
        spots: [
            { order: 1, name: d.morning?.place || d.morning || 'Morning', emoji: '🌅', time: '9:00 AM', description: d.morning?.activity || (typeof d.morning === 'string' ? d.morning : ''), tip: d.morning?.tip || '' },
            { order: 2, name: d.afternoon?.place || d.afternoon || 'Afternoon', emoji: '☀️', time: '1:00 PM', description: d.afternoon?.activity || (typeof d.afternoon === 'string' ? d.afternoon : ''), tip: d.afternoon?.tip || '' },
            { order: 3, name: d.evening?.place || d.evening || 'Evening', emoji: '🌙', time: '6:00 PM', description: d.evening?.activity || (typeof d.evening === 'string' ? d.evening : ''), tip: d.evening?.tip || '' },
            ...(d.food ? [{ order: 4, name: d.food, emoji: '🍽️', time: '3:30 PM', description: 'Local culinary experience', tip: '' }] : [])
        ].filter(s => s.name && s.name !== 'Morning' && s.name !== 'Afternoon' && s.name !== 'Evening' || (d.morning || d.afternoon || d.evening))
    }));

    const dayColors = ['#3a8c7e','#3b82f6','#f59e0b','#8b5cf6','#ec4899','#10b981','#f97316'];

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>${city} · Travel Plan</title>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet"/>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'DM Sans',sans-serif;background:#f8fffe;color:#0f2e28;padding:0;font-size:13px;line-height:1.6;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  
  /* ── COVER PAGE ── */
  .cover{background:linear-gradient(145deg,#0a1412 0%,#1a3630 50%,#0d2220 100%);min-height:100vh;display:flex;flex-direction:column;padding:48px 40px 36px;position:relative;overflow:hidden;page-break-after:always}
  .cover::before{content:'';position:absolute;top:-80px;right:-80px;width:400px;height:400px;border-radius:50%;background:radial-gradient(circle,rgba(171,209,198,.15) 0%,transparent 70%);pointer-events:none}
  .cover::after{content:'';position:absolute;bottom:-60px;left:-60px;width:300px;height:300px;border-radius:50%;background:radial-gradient(circle,rgba(171,209,198,.08) 0%,transparent 70%);pointer-events:none}
  .cover-brand{font-size:10px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:rgba(171,209,198,.6);margin-bottom:auto}
  .cover-main{margin-bottom:40px}
  .cover-eyebrow{font-size:11px;font-weight:600;letter-spacing:.15em;text-transform:uppercase;color:#ABD1C6;margin-bottom:12px;opacity:.85}
  .cover-title{font-family:'Cormorant Garamond',serif;font-size:64px;font-weight:700;color:#ABD1C6;line-height:1.05;letter-spacing:-.02em;margin-bottom:8px}
  .cover-tagline{font-size:16px;color:rgba(171,209,198,.7);font-style:italic;margin-bottom:32px}
  .cover-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
  .cv-stat{background:rgba(171,209,198,.08);border:1px solid rgba(171,209,198,.18);border-radius:14px;padding:16px 14px;text-align:center}
  .cv-stat-val{font-size:22px;font-weight:700;color:#ABD1C6;line-height:1.1}
  .cv-stat-lbl{font-size:9px;text-transform:uppercase;letter-spacing:.1em;color:rgba(171,209,198,.55);margin-top:3px}
  .cover-meta{display:flex;gap:20px;padding-top:24px;border-top:1px solid rgba(171,209,198,.15)}
  .cv-meta-item{font-size:11px;color:rgba(171,209,198,.5)}
  .cv-meta-item strong{color:rgba(171,209,198,.8);display:block;font-size:12px}

  /* ── CONTENT PAGES ── */
  .page{background:#f8fffe;padding:32px 36px;page-break-inside:avoid}
  
  /* ── SECTION HEADER ── */
  .sec-head{display:flex;align-items:center;gap:10px;margin-bottom:18px;padding-bottom:12px;border-bottom:2px solid #e0f0ec}
  .sec-icon{width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0}
  .sec-title{font-size:15px;font-weight:700;color:#0f2e28;text-transform:uppercase;letter-spacing:.06em;flex:1}
  .sec-badge{font-size:9px;font-weight:700;color:#3a8c7e;background:#e0f5f0;border:1px solid #b8e2d8;border-radius:20px;padding:3px 10px;letter-spacing:.05em}

  /* ── OVERVIEW ── */
  .overview{background:#fff;border:1px solid #d1ede8;border-left:4px solid #3a8c7e;border-radius:12px;padding:16px 18px;font-size:13px;color:#4a8c7e;line-height:1.7;font-style:italic;margin-bottom:22px}

  /* ── DAY CARDS ── */
  .days-wrap{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:22px}
  .day-card{background:#fff;border:1px solid #d1ede8;border-radius:14px;overflow:hidden;break-inside:avoid}
  .day-head{padding:12px 14px 10px;display:flex;align-items:center;gap:8px}
  .day-badge-pdf{border-radius:6px;padding:3px 10px;font-size:10px;font-weight:700;color:#fff;flex-shrink:0}
  .day-title-pdf{font-size:12px;font-weight:700;color:#0f2e28}
  .day-body{padding:0 14px 12px}
  .spot-row{display:flex;gap:8px;align-items:flex-start;padding:7px 0;border-bottom:1px solid #f0f9f7}
  .spot-row:last-child{border-bottom:none}
  .spot-num-pdf{width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;color:#fff;flex-shrink:0;margin-top:1px}
  .spot-info{flex:1;min-width:0}
  .spot-name-pdf{font-size:11px;font-weight:700;color:#0f2e28;margin-bottom:2px}
  .spot-desc-pdf{font-size:10px;color:#6aada0;line-height:1.45}
  .spot-meta-row{display:flex;gap:6px;margin-top:3px;flex-wrap:wrap}
  .spot-chip{background:#f0f9f7;border-radius:4px;padding:1px 6px;font-size:9px;color:#4a8c7e}
  .spot-tip-pdf{background:#f0fdf8;border:1px solid #b8e2d8;border-radius:6px;padding:5px 8px;font-size:10px;color:#3a8c7e;margin-top:4px}

  /* ── HOTELS ── */
  .hotels-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:22px}
  .hotel-card-pdf{background:#fff;border:1px solid #d1ede8;border-radius:12px;padding:14px;break-inside:avoid}
  .hotel-badge-pdf{display:inline-block;border-radius:5px;padding:2px 8px;font-size:9px;font-weight:700;margin-bottom:6px}
  .hotel-stars-pdf{color:#f59e0b;font-size:11px;margin-bottom:4px}
  .hotel-name-pdf{font-size:12px;font-weight:700;color:#0f2e28;margin-bottom:4px}
  .hotel-loc-pdf{font-size:10px;color:#6aada0;margin-bottom:6px;line-height:1.4}
  .hotel-amenities-pdf{display:flex;flex-wrap:wrap;gap:3px;margin-bottom:8px}
  .amenity-chip-pdf{background:#f0f9f7;border:1px solid #d1ede8;border-radius:4px;padding:1px 5px;font-size:8px;color:#4a8c7e}
  .hotel-footer-pdf{display:flex;justify-content:space-between;align-items:flex-end;padding-top:8px;border-top:1px solid #e8f5f2}
  .hotel-price-pdf{font-size:14px;font-weight:700;color:#3a8c7e}
  .hotel-price-pdf span{font-size:9px;font-weight:400;color:#6aada0}
  .hotel-book-pdf{font-size:9px;color:#6aada0;text-align:right}

  /* ── BUDGET ── */
  .budget-card{background:#fff;border:1px solid #d1ede8;border-radius:14px;padding:18px 20px;margin-bottom:22px}
  .bud-row-pdf{margin-bottom:12px}
  .bud-lbl-row{display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px;color:#0f2e28}
  .bud-amt-pdf{font-weight:700;color:#3a8c7e}
  .bud-bar-pdf{height:7px;background:#e0f0ec;border-radius:4px;overflow:hidden}
  .bud-fill-pdf{height:100%;border-radius:4px}
  .bud-total-pdf{display:flex;justify-content:space-between;padding-top:12px;margin-top:4px;border-top:1px solid #d1ede8;font-weight:700;font-size:14px;color:#3a8c7e}

  /* ── TRANSPORT ── */
  .transport-card{background:#fff;border:1px solid #d1ede8;border-radius:14px;padding:18px 20px;margin-bottom:22px}
  .route-pdf{border:1px solid #d1ede8;border-radius:10px;padding:12px 14px;margin-bottom:10px;border-left:3px solid #3b82f6}
  .route-name-pdf{font-size:12px;font-weight:700;color:#0f2e28;margin-bottom:8px;display:flex;justify-content:space-between}
  .route-fare-pdf{color:#3b82f6;font-size:11px}
  .route-journey-pdf{display:flex;align-items:center;gap:8px;margin-bottom:8px}
  .route-dot-pdf{width:9px;height:9px;border-radius:50%;flex-shrink:0}
  .route-line-pdf{flex:1;height:1px;background:#d1ede8;position:relative;display:flex;align-items:center;justify-content:center}
  .route-dur-pdf{background:#fff;border:1px solid #d1ede8;border-radius:20px;padding:1px 7px;font-size:9px;color:#6aada0;white-space:nowrap}
  .route-station-lbl-pdf{font-size:8px;text-transform:uppercase;letter-spacing:.06em;color:#6aada0}
  .route-station-pdf{font-size:11px;font-weight:600;color:#0f2e28}
  .route-chips-pdf{display:flex;gap:5px;flex-wrap:wrap}
  .route-chip-pdf{background:#f0f9f7;border:1px solid #d1ede8;border-radius:20px;padding:2px 8px;font-size:9px;color:#4a8c7e}
  .route-tip-pdf{background:#f0fdf8;border:1px solid #b8e2d8;border-radius:6px;padding:5px 8px;font-size:10px;color:#3a8c7e;margin-top:6px}
  .local-grid-pdf{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:14px;padding-top:12px;border-top:1px solid #e8f5f2}
  .local-item-pdf{background:#f8fffe;border:1px solid #e0f0ec;border-radius:8px;padding:10px;text-align:center}
  .local-icon-pdf{font-size:18px;margin-bottom:3px}
  .local-mode-pdf{font-size:10px;font-weight:700;color:#0f2e28}
  .local-cost-pdf{font-size:9px;color:#3a8c7e;font-weight:600}

  /* ── TIPS ── */
  .tips-card-pdf{background:#fff;border:1px solid #d1ede8;border-left:4px solid #f59e0b;border-radius:12px;padding:16px 18px;margin-bottom:22px}
  .tip-row-pdf{display:flex;gap:8px;align-items:flex-start;padding:6px 0;border-bottom:1px solid #f0f9f7;font-size:12px;color:#0f2e28;line-height:1.5}
  .tip-row-pdf:last-child{border-bottom:none}
  .tip-dot-pdf{color:#3a8c7e;font-size:10px;flex-shrink:0;margin-top:2px}
  
  /* ── BOTTOM 2-COL ── */
  .bottom-grid-pdf{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:22px}
  .info-card-pdf{background:#fff;border:1px solid #d1ede8;border-radius:12px;padding:14px 16px}
  .em-grid-pdf{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:8px}
  .em-item-pdf{background:#f8fffe;border:1px solid #e0f0ec;border-radius:8px;padding:8px 10px}
  .em-lbl-pdf{font-size:8px;text-transform:uppercase;letter-spacing:.06em;color:#6aada0}
  .em-val-pdf{font-size:13px;font-weight:700;color:#3a8c7e}

  /* ── FOOTER ── */
  .pdf-footer{text-align:center;padding:20px;color:#6aada0;font-size:10px;border-top:1px solid #e0f0ec;margin-top:8px}

  @media print{
    body{padding:0}
    .cover{-webkit-print-color-adjust:exact;print-color-adjust:exact}
    .page{padding:24px 28px}
  }
</style>
</head>
<body>

<!-- ══ COVER PAGE ══ -->
<div class="cover">
  <div class="cover-brand">Plan Your Trip India · AI Travel Planner</div>
  <div class="cover-main">
    <div class="cover-eyebrow">✦ Your Personalised Travel Plan</div>
    <div class="cover-title">${city}</div>
    <div class="cover-tagline">${plan.tagline || `Discover the wonders of ${city}`}</div>
    <div class="cover-stats">
      <div class="cv-stat"><div class="cv-stat-val">${duration}</div><div class="cv-stat-lbl">Days</div></div>
      <div class="cv-stat"><div class="cv-stat-val">${people}</div><div class="cv-stat-lbl">Travellers</div></div>
      <div class="cv-stat"><div class="cv-stat-val">₹${(total / 1000).toFixed(1)}k</div><div class="cv-stat-lbl">Est. / Person</div></div>
      <div class="cv-stat"><div class="cv-stat-val">₹${((total * people) / 1000).toFixed(1)}k</div><div class="cv-stat-lbl">Total Est.</div></div>
    </div>
  </div>
  <div class="cover-meta">
    <div class="cv-meta-item"><strong>Budget</strong>${budgetLabel || '—'}</div>
    <div class="cv-meta-item"><strong>Food Preference</strong>${foodLabel || 'No preference'}</div>
    <div class="cv-meta-item"><strong>Best Time to Visit</strong>${plan.best_time ? plan.best_time.split('.')[0] : 'Oct – Mar'}</div>
    <div class="cv-meta-item"><strong>Generated</strong>${new Date().toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'})}</div>
  </div>
</div>

<!-- ══ CONTENT PAGES ══ -->
<div class="page">

  ${plan.overview ? `<div class="overview">"${plan.overview}"</div>` : ''}

  <!-- Day-by-Day Itinerary -->
  <div class="sec-head">
    <div class="sec-icon" style="background:#3b82f618;">📅</div>
    <div class="sec-title">Day-by-Day Itinerary</div>
    <div class="sec-badge">AI Generated · ${daysData.length} Days</div>
  </div>
  <div class="days-wrap">
    ${daysData.map((d, di) => {
        const col = d.theme_color || dayColors[di % dayColors.length];
        return `<div class="day-card">
          <div class="day-head" style="background:${col}12;border-bottom:2px solid ${col}25;">
            <span class="day-badge-pdf" style="background:${col};">${d.day}</span>
            <span class="day-title-pdf">${d.title || `Day ${d.day} in ${city}`}</span>
          </div>
          <div class="day-body">
            ${(d.spots || []).map((s, si) => `
            <div class="spot-row">
              <div class="spot-num-pdf" style="background:${col};">${s.order || si + 1}</div>
              <div class="spot-info">
                <div class="spot-name-pdf">${s.emoji || '📍'} ${s.name}</div>
                ${s.description ? `<div class="spot-desc-pdf">${s.description.substring(0, 80)}${s.description.length > 80 ? '…' : ''}</div>` : ''}
                <div class="spot-meta-row">
                  ${s.time ? `<span class="spot-chip">🕐 ${s.time}</span>` : ''}
                  ${s.duration ? `<span class="spot-chip">⏱ ${s.duration}</span>` : ''}
                  ${s.entry_fee ? `<span class="spot-chip">${s.entry_fee}</span>` : ''}
                </div>
                ${s.tip ? `<div class="spot-tip-pdf">💡 ${s.tip.substring(0, 70)}${s.tip.length > 70 ? '…' : ''}</div>` : ''}
              </div>
            </div>`).join('')}
          </div>
        </div>`;
    }).join('')}
  </div>

  <!-- Hotels -->
  ${plan.hotels && plan.hotels.length ? `
  <div class="sec-head">
    <div class="sec-icon" style="background:#10b98118;">🏨</div>
    <div class="sec-title">Where to Stay</div>
    <div class="sec-badge">${plan.hotels.length} Curated Options</div>
  </div>
  <div class="hotels-grid">
    ${plan.hotels.map(h => {
        const stars = Math.max(1, Math.min(5, parseInt(h.stars) || 4));
        const typeColor = { Luxury: '#f59e0b', 'Mid-range': '#3b82f6', Budget: '#10b981' };
        const col = typeColor[h.type] || '#3a8c7e';
        return `<div class="hotel-card-pdf">
          <span class="hotel-badge-pdf" style="background:${col}18;color:${col};border:1px solid ${col}30;">${h.type || 'Hotel'}</span>
          <div class="hotel-stars-pdf">${'★'.repeat(stars)}<span style="opacity:.25">${'★'.repeat(5-stars)}</span></div>
          <div class="hotel-name-pdf">${h.name}</div>
          <div class="hotel-loc-pdf">📍 ${h.area || ''}${h.address ? ' · ' + h.address : ''}</div>
          ${h.amenities && h.amenities.length ? `<div class="hotel-amenities-pdf">${h.amenities.slice(0,4).map(a=>`<span class="amenity-chip-pdf">${a}</span>`).join('')}</div>` : ''}
          ${h.why ? `<div style="font-size:9px;color:#6aada0;margin-bottom:6px;font-style:italic;">✦ ${h.why.substring(0,60)}${h.why.length>60?'…':''}</div>` : ''}
          <div class="hotel-footer-pdf">
            <div><div class="hotel-price-pdf">₹${h.price_per_night || ''}<span>/night</span></div></div>
            ${h.book_via ? `<div class="hotel-book-pdf">via <strong style="color:#3a8c7e">${h.book_via}</strong></div>` : ''}
          </div>
        </div>`;}).join('')}
  </div>` : ''}

  <!-- Budget -->
  <div class="sec-head">
    <div class="sec-icon" style="background:#8b5cf618;">💰</div>
    <div class="sec-title">Budget Breakdown</div>
    <div class="sec-badge">Per Person · ${people} Traveller${people > 1 ? 's' : ''}</div>
  </div>
  <div class="budget-card">
    ${[['🏨','Accommodation','accommodation','#3a8c7e'],['🍽️','Food & Dining','food','#f59e0b'],['🚆','Transport','transport','#8b5cf6'],['🎭','Activities','activities','#ec4899']].map(([ic,lb,key,col]) => `
    <div class="bud-row-pdf">
      <div class="bud-lbl-row"><span>${ic} ${lb}</span><span class="bud-amt-pdf">₹${(budgetData[key] || 0).toLocaleString('en-IN')}</span></div>
      <div class="bud-bar-pdf"><div class="bud-fill-pdf" style="width:${bPct(budgetData[key])}%;background:${col}"></div></div>
    </div>`).join('')}
    <div class="bud-total-pdf"><span>Per Person Total</span><span>₹${total.toLocaleString('en-IN')}</span></div>
    ${people > 1 ? `<div class="bud-total-pdf" style="font-size:12px;color:#6aada0;border-top:none;padding-top:4px;"><span>Total for ${people} travellers</span><span>₹${(total * people).toLocaleString('en-IN')}</span></div>` : ''}
  </div>

  <!-- Transport -->
  ${plan.transport && plan.transport.options ? `
  <div class="sec-head">
    <div class="sec-icon" style="background:#3b82f618;">🗺️</div>
    <div class="sec-title">How to Get There</div>
    <div class="sec-badge">Route Guide</div>
  </div>
  <div class="transport-card">
    ${plan.transport.summary ? `<div style="font-size:12px;color:#4a8c7e;font-style:italic;margin-bottom:14px;padding-bottom:12px;border-bottom:1px solid #e8f5f2;">${plan.transport.summary}</div>` : ''}
    ${(plan.transport.options || []).map(opt => `
      <div style="margin-bottom:14px;">
        <div style="font-size:11px;font-weight:700;color:#0f2e28;text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px;">${opt.icon} ${opt.mode}</div>
        ${(opt.routes || []).map(r => `
        <div class="route-pdf" style="border-left-color:${opt.color||'#3b82f6'}">
          <div class="route-name-pdf">${r.name}${r.number&&r.number!=='—'?` <span style="background:${opt.color}18;color:${opt.color};border-radius:4px;padding:1px 5px;font-size:9px;">#${r.number}</span>`:''} <span class="route-fare-pdf">${r.fare||''}</span></div>
          <div class="route-journey-pdf">
            <div><div class="route-station-lbl-pdf">FROM</div><div class="route-station-pdf">${r.from||''}</div></div>
            <div class="route-line-pdf"><div class="route-dur-pdf">${r.duration||''}</div></div>
            <div><div class="route-station-lbl-pdf">TO</div><div class="route-station-pdf">${r.to||''}</div></div>
          </div>
          <div class="route-chips-pdf">
            ${r.departs?`<span class="route-chip-pdf">🕐 ${r.departs}</span>`:''}
            ${r.frequency?`<span class="route-chip-pdf">📅 ${r.frequency}</span>`:''}
          </div>
          ${r.tip?`<div class="route-tip-pdf">💡 ${r.tip}</div>`:''}
        </div>`).join('')}
      </div>`).join('')}
    ${plan.transport.local_transport && plan.transport.local_transport.options ? `
    <div>
      <div style="font-size:11px;font-weight:700;color:#0f2e28;text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px;">🏙️ Getting Around ${city}</div>
      <div class="local-grid-pdf">
        ${plan.transport.local_transport.options.map(lo=>`<div class="local-item-pdf"><div class="local-icon-pdf">${lo.icon}</div><div class="local-mode-pdf">${lo.mode}</div><div class="local-cost-pdf">${lo.cost}</div></div>`).join('')}
      </div>
    </div>` : ''}
  </div>` : ''}

  <!-- Tips + Info -->
  ${(plan.local_tips && plan.local_tips.length) || plan.tips ? `
  <div class="sec-head">
    <div class="sec-icon" style="background:#f59e0b18;">💡</div>
    <div class="sec-title">Local Insider Tips</div>
  </div>
  <div class="tips-card-pdf">
    ${(plan.local_tips || [plan.tips]).filter(Boolean).map(t=>`<div class="tip-row-pdf"><span class="tip-dot-pdf">✦</span><span>${t}</span></div>`).join('')}
  </div>` : ''}

  ${(plan.best_time || plan.emergency) ? `
  <div class="bottom-grid-pdf">
    ${plan.best_time ? `
    <div class="info-card-pdf">
      <div class="sec-head" style="margin-bottom:8px;padding-bottom:8px;border-bottom:1px solid #e0f0ec;"><div class="sec-icon" style="background:#10b98118;width:28px;height:28px;font-size:13px;">🌤️</div><div class="sec-title" style="font-size:12px;">Best Time to Visit</div></div>
      <div style="font-size:12px;color:#4a8c7e;line-height:1.6;">${plan.best_time}</div>
    </div>` : '<div></div>'}
    ${plan.emergency ? `
    <div class="info-card-pdf">
      <div class="sec-head" style="margin-bottom:8px;padding-bottom:8px;border-bottom:1px solid #e0f0ec;"><div class="sec-icon" style="background:#ef444418;width:28px;height:28px;font-size:13px;">🆘</div><div class="sec-title" style="font-size:12px;">Emergency Numbers</div></div>
      <div class="em-grid-pdf">
        <div class="em-item-pdf"><div class="em-lbl-pdf">Police</div><div class="em-val-pdf">${plan.emergency.police||'100'}</div></div>
        <div class="em-item-pdf"><div class="em-lbl-pdf">Tourist Helpline</div><div class="em-val-pdf" style="font-size:10px;">${plan.emergency.tourist_helpline||'1800-111-363'}</div></div>
        ${plan.emergency.hospital?`<div class="em-item-pdf" style="grid-column:1/-1"><div class="em-lbl-pdf">Hospital</div><div style="font-size:10px;color:#4a8c7e;">${plan.emergency.hospital}</div></div>`:''}
      </div>
    </div>` : '<div></div>'}
  </div>` : ''}

  <div class="pdf-footer">Generated by Plan Your Trip India · AI-Powered Travel Planning · planyyourtripindia.com · ${new Date().toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'})}</div>
</div>
</body></html>`;

    const printWin = window.open('', '_blank', 'width=1000,height=800');
    if (!printWin) {
        showToast('Please allow pop-ups in your browser to download PDF', 'error');
        if (btn) { btn.disabled = false; btn.innerHTML = '⬇ Download PDF'; }
        return;
    }
    printWin.document.write(htmlContent);
    printWin.document.close();
    printWin.onload = () => {
        setTimeout(() => {
            printWin.focus();
            printWin.print();
            if (btn) { btn.disabled = false; btn.innerHTML = '⬇ Download PDF'; }
        }, 800);
    };
    setTimeout(() => {
        if (btn) { btn.disabled = false; btn.innerHTML = '⬇ Download PDF'; }
    }, 6000);
}

function wizReset() {
    // Reset wizard state
    wizCurrentStep = 1;
    wizState.from = '';
    wizState.destination = '';
    wizState.dateFrom = '';
    wizState.dateTo = '';
    wizState.duration = 0;
    wizState.styles = [];
    wizState.adults = 2;
    wizState.children = 0;
    wizState.budget = 'normal';
    wizState.customBudget = 0;
    wizState.accom = ['Resort'];
    wizState.food = '';
    wizState.diet = [];
    window._lastPlanData = null;

    // Hide result panel
    document.getElementById('wizResultPanel').classList.remove('active');
    document.getElementById('wizResultCards').innerHTML = '';

    // Show step bar and reset all steps
    const stepBar = document.getElementById('wizStepBar');
    if (stepBar) stepBar.style.display = '';

    for (let s = 1; s <= WIZ_TOTAL; s++) {
        const item = document.getElementById('wizStep' + s);
        const panel = document.getElementById('wizPanel' + s);
        if (item) {
            item.classList.remove('active', 'completed');
            const circle = item.querySelector('.wiz-step-circle');
            if (circle) circle.innerHTML = s;
        }
        if (panel) panel.classList.remove('active');
    }

    // Activate step 1
    const step1 = document.getElementById('wizStep1');
    const panel1 = document.getElementById('wizPanel1');
    if (step1) step1.classList.add('active');
    if (panel1) panel1.classList.add('active');

    // Reset input fields
    const fromInput = document.getElementById('wizFromInput');
    const destInput = document.getElementById('wizDestInput');
    if (fromInput) fromInput.value = '';
    if (destInput) destInput.value = '';

    const dateFrom = document.getElementById('wizDateFrom');
    const dateTo = document.getElementById('wizDateTo');
    if (dateFrom) dateFrom.value = '';
    if (dateTo) dateTo.value = '';

    const durationBadge = document.getElementById('wizDurationBadge');
    if (durationBadge) durationBadge.textContent = '📅 Select dates to see trip duration';

    // Reset traveler counts
    const adultsCount = document.getElementById('wizAdultsCount');
    const childCount = document.getElementById('wizChildCount');
    if (adultsCount) adultsCount.textContent = '2';
    if (childCount) childCount.textContent = '0';
    const adultsDown = document.getElementById('wizAdultsDown');
    const childDown = document.getElementById('wizChildDown');
    if (adultsDown) adultsDown.disabled = true;
    if (childDown) childDown.disabled = true;

    // Reset budget selection
    document.querySelectorAll('.wiz-budget-card').forEach((c, i) => {
        c.classList.toggle('selected', i === 1);
    });
    const customBudget = document.getElementById('wizCustomBudget');
    if (customBudget) customBudget.value = '';
    const customNote = document.getElementById('wizCustomBudgetNote');
    if (customNote) customNote.textContent = '';

    // Reset chip selections
    document.querySelectorAll('.wiz-chip.selected').forEach(c => c.classList.remove('selected'));

    // Restore footer
    const footer = document.getElementById('wizFooter');
    if (footer) {
        footer.style.display = '';
        footer.innerHTML = `
          <button class="wiz-btn-back" id="wizBackBtn" onclick="wizPrevStep()" disabled>&#8592; Back</button>
          <span class="wiz-step-count" id="wizStepCount">Step 1 of 6</span>
          <button class="wiz-btn-next" onclick="wizNextStep()"><span id="wizNextBtnText">Continue</span> &#8594;</button>`;
    }

    // Scroll to planner
    const planner = document.getElementById('planner');
    if (planner) planner.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ─── WIZARD INIT ─────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
    const today = new Date().toISOString().split('T')[0];
    const df = document.getElementById('wizDateFrom');
    const dt = document.getElementById('wizDateTo');
    if (df) df.min = today;
    if (dt) dt.min = today;
    const wi = document.getElementById('wizDestInput');
    if (wi) wi.addEventListener('input', function () { wizState.destination = this.value; });
    const cd = document.getElementById('wizChildDown');
    if (cd) cd.disabled = true;
    const ad = document.getElementById('wizAdultsDown');
    if (ad) ad.disabled = true;
});

// ─── CITY PAGE ───────────────────────────────────────────────────
function openCityPage(key) {
    const city = CITY_DATA[key];
    if (!city) return;
    currentCityKey = key;
    document.getElementById('mainContent') && (document.getElementById('mainContent').style.display = 'none');
    const page = document.getElementById('cityPage');
    page.style.display = 'block';
    page.scrollTop = 0;
    window.scrollTo(0, 0);

    const hero = document.getElementById('cityHero');
    hero.style.backgroundImage = `url('${city.img}')`;
    hero.style.backgroundSize = 'cover';
    hero.style.backgroundPosition = 'center';

    document.getElementById('cityBadge').textContent = city.badge;
    document.getElementById('cityTitle').textContent = city.name;
    document.getElementById('cityTagline').textContent = city.tagline;

    document.getElementById('famousCards').innerHTML = city.famous.map(p => `
    <div class="city-info-card"><div class="card-icon">🏛️</div><h4>${p}</h4><p>Must-visit attraction in ${city.name}</p></div>
  `).join('');

    document.getElementById('foodCards').innerHTML = city.food.map(f => `
    <div class="city-info-card"><div class="card-icon">🍜</div><h4>${f.name}</h4><p>Local street food delicacy</p><span class="price-tag">${f.price}</span></div>
  `).join('');

    document.getElementById('hiddenCards').innerHTML = city.hidden.map(p => `
    <div class="city-info-card"><div class="card-icon">💎</div><h4>${p}</h4><p>Hidden gem locals love</p></div>
  `).join('');

    document.getElementById('hotelCards').innerHTML = city.hotels.map(h => `
    <div class="city-info-card"><div class="card-icon">🏨</div><h4>${h}</h4><p>Recommended stay in ${city.name}</p></div>
  `).join('');

    document.querySelectorAll('.city-tab').forEach(tab => {
        tab.onclick = () => {
            document.querySelectorAll('.city-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.city-tab-content').forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(`tab-${tab.dataset.tab}`).classList.add('active');
        };
    });
}

function closeCityPage() {
    document.getElementById('cityPage').style.display = 'none';
    const mc = document.getElementById('mainContent');
    if (mc) mc.style.display = 'block';
    window.scrollTo(0, 0);
}

function quickPlanCity() {
    const city = CITY_DATA[currentCityKey];
    if (!city) return;
    closeCityPage();
    wizSelectDest(city.name);
    document.getElementById('planner').scrollIntoView({ behavior: 'smooth' });
}

function showMain() { closeCityPage(); }

// ─── AI CHATBOT ──────────────────────────────────────────────────
function toggleChat() {
    const win = document.getElementById('chatWindow');
    win.classList.toggle('open');
    const notif = document.getElementById('chatNotif');
    if (notif) notif.style.display = 'none';
}

function openChat() {
    document.getElementById('chatWindow').classList.add('open');
    const notif = document.getElementById('chatNotif');
    if (notif) notif.style.display = 'none';
}

function sendQuickMsg(msg) {
    openChat();
    document.getElementById('chatInput').value = msg;
    sendMessage();
}

async function sendMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    if (!message) return;

    appendChatMsg('user', '🧳', message);
    input.value = '';
    chatHistory.push({ role: 'user', content: message });

    const typingId = showTypingIndicator();

    try {
        const response = await callGroqAI(chatHistory);
        removeTyping(typingId);
        appendChatMsg('bot', '🤖', response);
        chatHistory.push({ role: 'assistant', content: response });
        // FIX 3: Trim without locking old messages
        if (chatHistory.length > 20) {
            chatHistory = chatHistory.slice(-20);
        }
    } catch (err) {
        removeTyping(typingId);
        appendChatMsg('bot', '🤖', `Sorry, I couldn't connect to AI right now. ${err.message}`);
    }
}

function appendChatMsg(type, avatar, text) {
    const msgs = document.getElementById('chatMessages');
    const div = document.createElement('div');
    div.className = `chat-msg ${type}`;
    div.innerHTML = `
    <div class="msg-avatar">${avatar}</div>
    <div class="msg-content">${formatText(text)}</div>
  `;
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
}

function formatText(text) {
    return text
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br>');
}

function showTypingIndicator() {
    const msgs = document.getElementById('chatMessages');
    const id = 'typing-' + Date.now();
    const div = document.createElement('div');
    div.className = 'chat-msg bot'; div.id = id;
    div.innerHTML = `
    <div class="msg-avatar">🤖</div>
    <div class="msg-content">
      <div class="ai-typing-dots"><span></span><span></span><span></span></div>
    </div>
  `;
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
    return id;
}

function removeTyping(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
}

// ═══════════════════════════════════════════════════════════════
//  GROQ AI — Direct browser API (works on GitHub Pages!)
//  ✅ No backend server needed — calls Groq directly
//  ⬇️  PASTE YOUR FREE GROQ API KEY BELOW
//     Get one free at: https://console.groq.com → API Keys
// ═══════════════════════════════════════════════════════════════
 // ← Replace this!
const AI_PROXY_URL = 'https://travel-ai-server-btgt.onrender.com/api/chat';

// FIX 1: Renamed from callClaudeAI → callGroqAI so all callers work
async function callGroqAI(messages) {
    // Filter to only user/assistant roles
    const apiMessages = messages
        .filter(m => m.role === 'user' || m.role === 'assistant')
        .map(m => ({ role: m.role, content: m.content }));

    // FIX 4: Only check for empty messages, no fragile role check
    if (!apiMessages.length) {
        throw new Error('No messages to send');
    }

    const response = await fetch(AI_PROXY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages })
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err?.error || `Server Error: ${response.status}`);
    }

    const data = await response.json();
    return data.reply || '';
}

// ─── CONTACT FORM ───────────────────────────────────────────────
function submitContact(event) {
    event.preventDefault();
    const success = document.getElementById('formSuccess');
    success.style.display = 'block';
    event.target.reset();
    setTimeout(() => success.style.display = 'none', 5000);
}

// ─── TOAST ──────────────────────────────────────────────────────
function showToast(message, duration = 3500) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), duration);
}

// ─── KEYBOARD ───────────────────────────────────────────────────
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
        document.getElementById('chatWindow').classList.remove('open');
        if (document.getElementById('cityPage').style.display !== 'none') closeCityPage();
    }
});

// ════════════════════════════════════════════════
//  AUTH — Login / Sign Up System
// ════════════════════════════════════════════════
let currentUser = JSON.parse(localStorage.getItem('pyti_user') || 'null');

window.addEventListener('DOMContentLoaded', () => {
    refreshNavAuth();

    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', function (e) {
            const target = document.querySelector(this.getAttribute('href'));
            if (!target) return;
            e.preventDefault();
            const navH = document.getElementById('navbar')?.offsetHeight || 70;
            const top = target.getBoundingClientRect().top + window.scrollY - navH;
            window.scrollTo({ top, behavior: 'smooth' });
        }, { passive: false });
    });
});

function refreshNavAuth() {
    const navActions = document.getElementById('navActions');
    if (navActions) {
        if (currentUser) {
            const initials = ((currentUser.first || '?')[0] + (currentUser.last || '?')[0]).toUpperCase();
            navActions.innerHTML = `
        <div class="nav-user-badge">
          <div class="nav-user-avatar">${initials}</div>
          <span>${currentUser.first}</span>
          <button style="background:none;border:none;color:var(--text-dim);font-size:.8rem;cursor:pointer;margin-left:.3rem;" onclick="logoutUser()">↩ Out</button>
        </div>`;
        } else {
            navActions.innerHTML = `
        <button class="btn-nav-login" onclick="openModal('loginModal')">Login</button>
        <button class="btn-nav-signup" onclick="openModal('signupModal')">Sign Up ✦</button>`;
        }
    }
    if (window.updateMobileAuthUI) window.updateMobileAuthUI();
}

function openModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
    setTimeout(() => {
        const inp = modal.querySelector('.auth-input');
        if (inp) inp.focus();
    }, 350);
}

function closeModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.classList.remove('open');
    document.body.style.overflow = '';
    clearAuthErrors(id);
}

function switchModal(fromId, toId) {
    closeModal(fromId);
    setTimeout(() => openModal(toId), 200);
}

document.addEventListener('click', (e) => {
    if (e.target.classList.contains('auth-modal-backdrop')) {
        closeModal(e.target.id);
    }
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const mo = document.getElementById('navMobileOverlay');
        if (mo && mo.classList.contains('open')) {
            document.getElementById('hamburger').classList.remove('open');
            mo.classList.remove('open');
            document.body.style.overflow = '';
        }
        closeModal('loginModal');
        closeModal('signupModal');
        if (document.getElementById('chatWindow').classList.contains('open')) {
            document.getElementById('chatWindow').classList.remove('open');
        }
        if (document.getElementById('cityPage').style.display !== 'none') closeCityPage();
    }
});

function clearAuthErrors(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.querySelectorAll('.auth-error,.auth-success').forEach(el => {
        el.style.display = 'none';
        el.textContent = '';
    });
    modal.querySelectorAll('.auth-input').forEach(el => el.value = '');
}

function togglePw(inputId, btn) {
    const inp = document.getElementById(inputId);
    if (!inp) return;
    if (inp.type === 'password') {
        inp.type = 'text';
        btn.textContent = '🙈';
    } else {
        inp.type = 'password';
        btn.textContent = '👁';
    }
}

function checkPwStrength(pw) {
    const fill = document.getElementById('pwStrengthFill');
    const label = document.getElementById('pwStrengthLabel');
    if (!fill || !label) return;
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;

    const levels = [
        { pct: '0%', color: '#f87171', text: '' },
        { pct: '25%', color: '#f87171', text: 'Weak' },
        { pct: '50%', color: '#fb923c', text: 'Fair' },
        { pct: '75%', color: '#facc15', text: 'Good' },
        { pct: '100%', color: '#4ade80', text: 'Strong ✓' },
    ];
    const lvl = levels[score];
    fill.style.width = lvl.pct;
    fill.style.background = lvl.color;
    label.textContent = lvl.text;
    label.style.color = lvl.color;
}

function showAuthError(modalId, errorId, msg) {
    const el = document.getElementById(errorId);
    if (!el) return;
    el.textContent = msg;
    el.style.display = 'block';
}

function showAuthSuccess(successId, msg) {
    const el = document.getElementById(successId);
    if (!el) return;
    el.textContent = msg;
    el.style.display = 'block';
}

function setLoading(btnId, loading) {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    if (loading) btn.classList.add('loading');
    else btn.classList.remove('loading');
    btn.disabled = loading;
}

function handleLogin() {
    const email = document.getElementById('loginEmail')?.value.trim();
    const password = document.getElementById('loginPassword')?.value;
    document.getElementById('loginError').style.display = 'none';

    if (!email || !password) {
        showAuthError('loginModal', 'loginError', '⚠ Please fill in all fields.');
        return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
        showAuthError('loginModal', 'loginError', '⚠ Please enter a valid email address.');
        return;
    }

    setLoading('loginSubmitBtn', true);

    setTimeout(() => {
        setLoading('loginSubmitBtn', false);
        const users = JSON.parse(localStorage.getItem('pyti_users') || '[]');
        const user = users.find(u => u.email === email && u.password === btoa(password));
        if (user) {
            currentUser = user;
            localStorage.setItem('pyti_user', JSON.stringify(user));
            closeModal('loginModal');
            refreshNavAuth();
            showToast('🎉 Welcome back, ' + user.first + '! Ready to explore India?');
        } else {
            showAuthError('loginModal', 'loginError', '✕ Invalid email or password. Please try again.');
        }
    }, 1200);
}

function handleSignup() {
    const first = document.getElementById('signupFirst')?.value.trim();
    const last = document.getElementById('signupLast')?.value.trim();
    const email = document.getElementById('signupEmail')?.value.trim();
    const password = document.getElementById('signupPassword')?.value;

    document.getElementById('signupError').style.display = 'none';
    document.getElementById('signupSuccess').style.display = 'none';

    if (!first || !last || !email || !password) {
        showAuthError('signupModal', 'signupError', '⚠ Please fill in all fields.');
        return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
        showAuthError('signupModal', 'signupError', '⚠ Please enter a valid email address.');
        return;
    }
    if (password.length < 8) {
        showAuthError('signupModal', 'signupError', '⚠ Password must be at least 8 characters.');
        return;
    }

    setLoading('signupSubmitBtn', true);

    setTimeout(() => {
        setLoading('signupSubmitBtn', false);
        const users = JSON.parse(localStorage.getItem('pyti_users') || '[]');
        if (users.find(u => u.email === email)) {
            showAuthError('signupModal', 'signupError', '✕ An account with this email already exists.');
            return;
        }
        const newUser = { first, last, email, password: btoa(password), joined: new Date().toISOString() };
        users.push(newUser);
        localStorage.setItem('pyti_users', JSON.stringify(users));
        currentUser = newUser;
        localStorage.setItem('pyti_user', JSON.stringify(newUser));
        showAuthSuccess('signupSuccess', '🎉 Account created! Welcome to Plan Your Trip India!');
        setTimeout(() => {
            closeModal('signupModal');
            refreshNavAuth();
            showToast('🎉 Welcome aboard, ' + first + '! Start planning your dream trip!');
        }, 1600);
    }, 1400);
}

function handleSocialLogin(provider) {
    showToast('🔗 ' + provider + ' login coming soon!');
}

function logoutUser() {
    currentUser = null;
    localStorage.removeItem('pyti_user');
    refreshNavAuth();
    showToast('👋 Logged out. Come back soon!');
}
