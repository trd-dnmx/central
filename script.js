// ═════════════════════════════════════════════════════
//  DNMX CENTRAL COMMAND — SCRIPTS
//  Rebuilt from Scratch for Cleanliness and Performance
// ═════════════════════════════════════════════════════

// ═════════════════════════════════════=
//  FIREBASE IMPORTS & CONFIG
// ═════════════════════════════════════=
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
import { getFirestore, collection, addDoc, onSnapshot, deleteDoc, updateDoc, doc, serverTimestamp, query, orderBy, getDoc, getDocs, setDoc, where, limit } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCjxIlnqeqjMtNk2dzqHFOhP8FwMSupyMc",
  authDomain: "dnmx-central.firebaseapp.com",
  projectId: "dnmx-central",
  storageBucket: "dnmx-central.firebasestorage.app",
  messagingSenderId: "553958748933",
  appId: "1:553958748933:web:670279f4fb8112a39b7d6c",
  measurementId: "G-BSK4X4333C"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ═════════════════════════════════════=
//  ADMIN SYSTEM
// ═════════════════════════════════════=
const ADMIN_EMAILS = [
  "noah.dnmx@gmail.com",
  "tntplayertnt8@gmail.com",
  "drglass09yt@gmail.com",
  "cyberelite5253@gmail.com",
  "budavasile6211@gmail.com",
  "chickendajaja@gmail.com"
];

function isAdmin() {
  if (!CURRENT_USER) return false;
  const userEmail = CURRENT_USER.email.trim().toLowerCase();
  const match = ADMIN_EMAILS.some(e => e.trim().toLowerCase() === userEmail) || CURRENT_USER.isAdmin === true;
  return match;
}

// ═════════════════════════════════════=
//  STATIC DATA
// ═════════════════════════════════════=
const RANKS = [
  { id: 1, name: "Monarch", category: "Executive Council", tier: "Leader", preview: "Supreme Monarch of The Royal Dominion of Dnmx.", description: "Supreme Monarch of The Royal Dominion of Dnmx. Holder of the most authority and the executor of all decisions of the community. Their word equals to an order in the community.", powers: "Absolute executive authority across all clan matters; final decision-maker; issues decrees, pardons, and appointments; can dissolve or restructure councils.", requirements: "Founding member or unanimous Executive Council endorsement; demonstrated long-term leadership, strategic vision, and trustworthiness." },
  { id: 2, name: "Co-Monarch", category: "Executive Council", tier: "Co-Leader", preview: "Aide to the Monarch and holder of utmost authority.", description: "The Co-Monarch(s) of The Royal Dominion of Dnmx are responsible for ensuring that every single thing that comes under the umbrella of Dnmx is run fluently. Their responsibility is to reduce the burden from the Monarch(s) as much as they can. They act as the aides of the Supreme Monarch(s) and hold utmost authority.", powers: "Shared sovereign authority; executes Monarch directives; acts as regent during Monarch absence; coordinates Executive Council actions.", requirements: "Trusted senior leader chosen by Monarch and Executive Council; proven strategic and diplomatic capability." },
  { id: 3, name: "Director", category: "Executive Council", tier: "Overseer", preview: "Oversees everything happening in the community.", description: "The Directors of The Royal Dominion of Dnmx oversee everything happening in the community. They make sure everything on ground runs fluently and manage everything with their own manual participation when necessary. Their role is to portray the Dnmx Monarch's words whenever they're not available.", powers: "Operational oversight across assigned domains; enforce policies; coordinate cross-council initiatives; authorize major operational actions.", requirements: "Demonstrated management experience; endorsement from Executive Council and proven reliability." },
  { id: 4, name: "Defense Minister", category: "Executive Council", tier: "Peacekeeper", preview: "Responsible for internal and external security.", description: "The Defense Minister of Dnmx Community. The supreme executive who is responsible for maintaining both internal and external security of the community. They may also control all of Dnmx's external and internal foreign affairs and are directly answerable to the director(s) & monarch(s). They may take all major defense related decisions under the guidance of the monarch(s).", powers: "Authority over defense strategy, security operations, and force deployment; issues orders to Generals and Star Officers for military actions.", requirements: "Extensive combat and leadership experience; security clearance by Monarch/Directors; proven judgment under pressure." },
  { id: 5, name: "General", category: "Star Officers", tier: "Combat Leader", preview: "Commands warfare and major activities.", description: "Responsible for managing all PVP warfare and other types of warfare activities. They are not restricted just to PVP and also command every other activity such as economic activities, building activities and diplomatic activities. Answerable directly to the executive council, while they may stay in direct contact with the Defense Minister.", powers: "Direct command of military operations and campaign planning; authority to mobilize troops and issue tactical orders to Officers.", requirements: "Proven battlefield leadership record; recommendation from Defense Minister and Executive Council." },
  { id: 6, name: "Chief Overseer", category: "Star Officers", tier: "Combat Assistant", preview: "Maintains internal harmony within the community.", description: "They are responsible for maintaining internal level harmony within the community. Their position is of extreme importance. They are directly answerable to the General.", powers: "Oversees internal discipline and coordination among Star Officers; enforces conduct standards and resolves escalated disputes.", requirements: "Strong mediation experience; trusted by senior command and demonstrable impartiality." },
  { id: 7, name: "Sr. Overseer", category: "Star Officers", tier: "Mediator", preview: "Oversees projects and resolves disputes.", description: "They are people who have shown immense loyalty to the community. They manage and directly resolve all disputes and lower level issues under the able guidance of their seniors. Their default task is to oversee all types of projects within Dnmx, whether related to the defense, economy or building sector.", powers: "Authority to direct project leads, arbitrate disputes, and reassign resources to meet mission goals.", requirements: "Consistent service record, project management ability, and endorsement by senior Officers." },
  { id: 8, name: "Field Overseer", category: "Star Officers", tier: "Preventer", preview: "Ensures projects run smoothly on the ground.", description: "They are people responsible for ensuring things at a minor level are resolved before they are converted into bigger flames. They work on field to ensure everything happens without any issues and all necessary requirements of every project is met.", powers: "Directs on-ground teams, enforces task completion, and reports operational issues to Sr. Overseers.", requirements: "Active operational experience, strong communication, and reliability in field conditions." },
  { id: 9, name: "Group Leader", category: "Officers", tier: "Manager", preview: "Leads a division or group.", description: "The Group Leaders are responsible for directing their group. Their job is to ensure all things in their respective groups go fluently, for example PVPers should have gear, farms must be working fluently, building projects must be worked on and must be completed in time and all resources are provided. They also manage their group members' leaves.", powers: "Manages group resources and assignments; approves routine leaves and enforces group-level directives.", requirements: "Demonstrated leadership within group activities; recommendation from Officers and Council leads." },
  { id: 10, name: "Head Officer", category: "Officers", tier: "Facilitator", preview: "Assists Group Leaders.", description: "Head Officer's role is to assist the Group Leaders in their tasks to ensure everything is fluent.", powers: "Assists and temporarily assumes Group Leader duties; mentors junior officers and enforces local policies.", requirements: "Experience as Officer; proven organizational skills and mentorship capability." },
  { id: 11, name: "Sr. Officer", category: "Officers", tier: "Supervisor", preview: "Senior officer of Dnmx.", description: "A Senior Officer of Dnmx. They are responsible for working in accordance to the orders they're provided. They may assist their juniors in tasks as well.", powers: "Supervises Officers, issues day-to-day operational orders, and reports performance to Group Leaders.", requirements: "Consistent performance, adherence to clan rules, and leadership potential." },
  { id: 12, name: "Officer", category: "Officers", tier: "Executor", preview: "Regular officer of Dnmx.", description: "A regular Officer of Dnmx with the sole purpose of meeting the expectations of their seniors.", powers: "Carries out orders, leads small task teams, and maintains responsibility for assigned duties.", requirements: "Completed initiation and training; reliable participation and good conduct." },
  { id: 13, name: "Deputy Officer", category: "Officers", tier: "Initiator", preview: "First promotion after proving worth.", description: "A Deputy Officer of Dnmx. The first upgrade after proving themselves worthy of being a member.", powers: "Limited command authority in support roles; performs delegated tasks and stands in for Officers when needed.", requirements: "Promotion based on merit, training completion, and recommendation from senior Officers." },
  { id: 14, name: "Member", category: "Members", tier: "Newbies", preview: "Base member of Dnmx.", description: "A base Member of Dnmx who has the role of fulfilling all tasks given by seniors.", powers: "Access to member resources, participation in clan activities, and the ability to propose suggestions through proper channels.", requirements: "Successful recruitment vetting and adherence to clan rules and probationary commitments." },
  { id: 15, name: "New Member", category: "Members", tier: "Recruits", preview: "New recruit of Dnmx.", description: "A base New Member of Dnmx, who has to prove themselves worthy of being a full Member of Dnmx.", powers: "Limited privileges during probation; assigned mentor oversight and training tasks.", requirements: "Successful application, probationary period completion, and demonstration of loyalty and activity." }
];

const EXEC_MEMBERS = [
  { id: 1, name: "TNTplayerTNT", position: "Monarch", initials: "TNT", description: "The founding architect of DNMX. TNTplayerTNT has led the clan from its origins as a small unit to the sovereign force it is today. His tactical brilliance and vision are unmatched.", playstyle: "Tactician with a preference for overwhelming force and precise timing. Specializes in large-scale coordinated assaults.", responsibilities: "Supreme governance of DNMX. Final decision authority on all clan matters. Strategic direction and diplomacy. Preservation of legacy and core doctrine.", council: "Executive" },
  { id: 2, name: "CrazyCode1_", position: "Co-Monarch", initials: "CC", description: "CrazyCode1_ is the clan's co-leader, sharing command with the Monarch to drive strategy and maintain internal cohesion. His leadership ensures every campaign is executed with precision and every member remains aligned with the clan's core mission.", playstyle: "PvP strategist who excels in high-stakes engagements and tactical planning. He anticipates enemy movements, coordinates frontline assaults, and adapts quickly to dominate in both one-on-one duels and large team battles.", responsibilities: "Deputy sovereign authority. Joint campaign direction. Command of military operations and strategic coordination. Support of Monarch rulings.", council: "Executive" },
  { id: 3, name: "CyberElite", position: "Co-Monarch", initials: "CE", description: "CyberElite is the clan's co-leader, sharing command with the Monarch to drive strategy and maintain internal cohesion. His leadership ensures every campaign is executed with precision and every member remains aligned with the clan's core mission.", playstyle: "A masterful strategist who blends political influence, economic foresight, and decisive leadership. He shapes council decisions, coordinates elite operations, and inspires unwavering loyalty through his presence in every major campaign.", responsibilities: "Leadership of the Executive Council. Policy development and oversight. Conflict mediation among senior leaders. Alignment of council strategy with long-term clan goals.", council: "Executive" },
  { id: 4, name: "DrGlass09", position: "Director Of Intelligence", initials: "DG", description: "DrGlass09 is the clan's silent sentinel, quietly observing every move from the shadows while the world thinks it acts freely. As Director of Intelligence, he is intensely respected for his calm presence and ability to discover secrets before they become threats.", playstyle: "A reserved operative who prefers patient observation, data collection, and discreet influence. He moves without fanfare, extracting enemy intent and shaping outcomes from behind the scenes like a true intelligence director.", responsibilities: "Intelligence collection and analysis. Counter-intelligence and security. Covert operations oversight. Briefing Executive leadership on threats and opportunities.", council: "Executive" },
  { id: 5, name: "Noah_7219", position: "Economical Head", initials: "NH", description: "Noah_7219 is the architect of DNMX's economic power, steering the clan's treasury, logistics, and campaign funding with unmatched precision. His decisions keep resources flowing, strategic initiatives fueled, and the clan prepared for every clash.", playstyle: "Resource and economics specialist who designs the clan's supply networks, prioritizes strategic spending, and turns every asset into a battlefield advantage. He uses market insight and efficiency planning to keep DNMX strong in both peace and war.", responsibilities: "Economic planning and resource allocation. Budget management and logistics. Supply chain oversight. Financial strategy for sustained campaigns.", council: "Executive" },
  { id: 6, name: "ObsidianSoul", position: "Gamemode Leader", initials: "OS", description: "ObsidianSoul leads DNMX's dedicated gamemode team, designing, balancing, and managing the clan's signature event experiences. They ensure every custom mode runs smoothly, stays engaging, and aligns with the community's competitive standards.", playstyle: "Creative systems manager who focuses on mode design, testing, and player experience. They blend strategic planning with rapid adaptation to keep custom gamemodes fresh and fair.", responsibilities: "Oversees gamemode development and event scheduling. Manages mode-specific rules, balancing, and troubleshooting. Coordinates with leadership, guides mode operators, and ensures player satisfaction during special events.", council: "Executive" },
  { id: 7, name: "T_j4y", position: "Advisor", initials: "TJ", description: "T_j4y serves as a trusted advisor to the Executive Council, offering strategic guidance and support across multiple domains. With keen insight into clan operations and dynamics, T_j4y provides counsel on critical decisions and helps mentor emerging leaders within DNMX.", playstyle: "Consultative and supportive approach focused on providing strategic insights and mentorship. T_j4y excels at analyzing situations, identifying solutions, and guiding others toward informed decisions without commandeering operations.", responsibilities: "Provides strategic counsel to Executive Council members. Mentors rising talent and emerging leaders. Analyzes operational challenges and recommends solutions. Supports decision-making processes and ensures continuity of clan vision. Acts as a liaison between leadership and broader membership.", council: "Executive" },
  { id: 9, name: "Grim_Nightmare", position: "Resource Specialist", initials: "GN", description: "Grim_Nightmare ensures that DNMX is always fully stocked for its campaigns. Through tireless grinding and efficient extraction, he manages the massive logistics of supply lines.", playstyle: "Survivalist and master harvester. Focuses on scaling resource generation, locating rare assets, and maintaining deep-storage warehouses.", responsibilities: "Management of clan vaults and warehouses. Orchestrating grinding campaigns. Guaranteeing the supply of building and war materials for all members.", council: "Executive" },
];

const MGMT_MEMBERS = [
];

// Helper to get user photo/initials by In-Game Name
function getUserDataByIngameName(ingameName) {
  if (!ingameName) return null;
  let user = null;
  if (CURRENT_USER && CURRENT_USER.ingameName === ingameName) {
    user = { ...CURRENT_USER };
  } else {
    const found = ALL_USERS.find(u => u.ingameName === ingameName);
    if (found) {
      user = { ...found };
    }
  }
  const lowerName = ingameName.toLowerCase();
  if (lowerName === 'drglass09') {
    if (!user) user = { ingameName: 'DrGlass09', name: 'DrGlass09', initials: 'DG' };
    user.photoURL = 'assets/glasspfp.png';
  } else if (lowerName === 'tntplayertnt') {
    if (!user) user = { ingameName: 'TNTplayerTNT', name: 'TNTplayerTNT', initials: 'TNT' };
    user.photoURL = 'assets/tntpfp.png';
  } else if (lowerName === 'crazycode1_') {
    if (!user) user = { ingameName: 'CrazyCode1_', name: 'CrazyCode1_', initials: 'CC' };
    user.photoURL = 'assets/crazypfp.png';
  } else if (lowerName === 'cyberelite') {
    if (!user) user = { ingameName: 'CyberElite', name: 'CyberElite', initials: 'CE' };
    user.photoURL = 'assets/cyberpfp.png';

  } else if (lowerName === 'grim_nightmare') {
    if (!user) user = { ingameName: 'Grim_Nightmare', name: 'Grim_Nightmare', initials: 'GN' };
    user.photoURL = 'assets/grimpfp.png';
  }
  return user;
}

// ═════════════════════════════════════=
//  GLOBAL STATE
// ═════════════════════════════════════=
let CURRENT_USER = null;
let ANNOUNCEMENTS = [];
let TASKS = [];
let ALL_MEMORIES = [];
let ALL_USERS = [];
let MESSAGES = [];
let ACTIVE_CHAT_USER = null;
let LAST_MESSAGE_MAP = {};

let isAuthInitialized = false;
let isTimerFinished = false;

// Listeners
let unsubscribeUsers = null;
let unsubscribeMessages = null;
let unsubscribeAllUserMessages = null;
let unsubscribeTypingState = null;
let unsubscribeMemories = null;

// Chat typing trackers
let typingTimeout = null;
let isCurrentlyTyping = false;
let CHAT_SELECTED_MEDIA_BASE64 = '';

// UI state
let currentPage = 'home';
let rankFilter = 'all';
let announceFilter = 'all';
let announcePage = 1;
let taskFilter = 'all';
const ANNOUNCE_PER_PAGE = 4;

// Loader triggers
function tryHideLoader() {
  if (isAuthInitialized && isTimerFinished) {
    const loader = document.getElementById('loader');
    if (loader) loader.classList.add('hide');
  }
}

// ═════════════════════════════════════=
//  NAVIGATION & CORE UI ACTIONS
// ═════════════════════════════════════=
function navigate(page) {
  let target = page + '.html';
  if (page === 'home') target = 'index.html';
  if (page === 'councils') target = 'council.html';
  if (page === 'hierarchy') target = 'hierachy.html';
  window.location.href = target;
}

document.querySelectorAll('.nav-link, .mobile-nav-link').forEach(a => {
  a.addEventListener('click', e => {
    e.preventDefault();
    navigate(a.dataset.page);
  });
});

function toggleMobile() {
  const menu = document.getElementById('mobileMenu');
  const ham = document.getElementById('hamburger');
  if (menu) menu.classList.toggle('open');
  if (ham) ham.classList.toggle('open');
}

function closeMobile() {
  const menu = document.getElementById('mobileMenu');
  const ham = document.getElementById('hamburger');
  if (menu) menu.classList.remove('open');
  if (ham) ham.classList.remove('open');
}

// Canvas particle system for Central Command
function spawnParticles() {
  const container = document.getElementById('particles');
  if (!container) return;
  for (let i = 0; i < 30; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const size = Math.random() * 4 + 1;
    const x = Math.random() * 100;
    const dur = Math.random() * 15 + 8;
    const delay = Math.random() * 10;
    const isBlue = Math.random() > 0.5;
    p.style.cssText = `width:${size}px;height:${size}px;left:${x}%;bottom:0;
      background:${isBlue ? 'rgba(0,191,255,0.7)' : 'rgba(220,20,60,0.7)'};
      box-shadow:0 0 6px ${isBlue ? 'rgba(0,191,255,0.8)' : 'rgba(220,20,60,0.8)'};
      animation-duration:${dur}s;animation-delay:${delay}s;`;
    container.appendChild(p);
  }
}

// Stats Counter animation
function animateCounters() {
  document.querySelectorAll('[data-count]').forEach(el => {
    const target = parseInt(el.dataset.count);
    let current = 0;
    const step = Math.ceil(target / 60);
    const timer = setInterval(() => {
      current = Math.min(current + step, target);
      el.textContent = current + (el.dataset.count === '99' ? '%' : '');
      if (current >= target) clearInterval(timer);
    }, 30);
  });
}

// ═════════════════════════════════════=
//  MODAL OVERLAY SYSTEM
// ═════════════════════════════════════=
function openModal() {
  const modal = document.getElementById('modal');
  if (modal) modal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  const modal = document.getElementById('modal');
  if (modal) modal.classList.remove('open');
  document.body.style.overflow = '';
}

function closeModalOnOverlay(e) {
  if (e.target === document.getElementById('modal')) closeModal();
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
});

// Toast Notifications
function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.add('show');
  });

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  }, 4000);
}

// ═════════════════════════════════════=
//  UTILITIES & FORMATTERS
// ═════════════════════════════════════=
function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, tag => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  }[tag] || tag));
}

function collapseNewlines(str) {
  if (!str) return '';
  return str.replace(/[\n\r]+/g, ' ').replace(/\s+/g, ' ').trim();
}

// Base64 client-side image compression
function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxWH = 600;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxWH) {
            height = Math.round((height * maxWH) / width);
            width = maxWH;
          }
        } else {
          if (height > maxWH) {
            width = Math.round((width * maxWH) / height);
            height = maxWH;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
        resolve(dataUrl);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}

// Discord-style Markdown Parser
function parseDiscordFormatting(text) {
  if (!text) return '';
  let html = escapeHTML(text);
  const codeBlocks = [];

  // Multi-line code blocks
  html = html.replace(/```(?:[a-zA-Z0-9+#-]+)?\n?([^]+?)```/g, (match, code) => {
    const placeholder = `CODEBLOCKPLACEHOLDERMULTILINE${codeBlocks.length}XYZ`;
    codeBlocks.push({
      placeholder: placeholder,
      html: `<pre class="discord-code-block"><code>${code}</code></pre>`
    });
    return placeholder;
  });

  // Single-line code
  html = html.replace(/`([^`\n]+?)`/g, (match, code) => {
    const placeholder = `CODEBLOCKPLACEHOLDERINLINE${codeBlocks.length}XYZ`;
    codeBlocks.push({
      placeholder: placeholder,
      html: `<code class="discord-inline-code">${code}</code>`
    });
    return placeholder;
  });

  // Multi-line quotes
  if (html.startsWith('&gt;&gt;&gt; ')) {
    const content = html.slice(13);
    html = `<blockquote class="discord-blockquote">${content.replace(/\n/g, '<br>')}</blockquote>`;
  } else {
    html = html.replace(/(?:^|\n)&gt;&gt;&gt;\s+([^]+)$/g, (match, content) => {
      return `<blockquote class="discord-blockquote">${content.replace(/\n/g, '<br>')}</blockquote>`;
    });
  }

  // Single-line quotes
  html = html.split('\n').map(line => {
    if (line.startsWith('&gt; ')) {
      return `<blockquote class="discord-blockquote">${line.slice(5)}</blockquote>`;
    }
    return line;
  }).join('\n');

  // Spoilers
  html = html.replace(/\|\|([^|]+?)\|\|/g, '<span class="discord-spoiler" onclick="this.classList.toggle(\'revealed\')">$1</span>');

  // Bold & Italics combinations
  html = html.replace(/\*\*_(.+?)_\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/_\*\*(.+?)\*\*_/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__(.+?)__/g, '<u>$1</u>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  html = html.replace(/_(.+?)_/g, '<em>$1</em>');
  html = html.replace(/~~(.+?)~~/g, '<del>$1</del>');

  // Newlines to <br>
  html = html.split('\n').join('<br>');

  // Restore code blocks
  for (const block of codeBlocks) {
    html = html.replace(block.placeholder, block.html);
  }

  return html;
}

// User Avatars (Photo / Initials fallback)
function getAuthorDotHTML(photoUrl, initials, sizeStyle = '') {
  const dynamicStyle = sizeStyle ? ` style="${sizeStyle}"` : '';
  const parentStyle = sizeStyle ? ` style="${sizeStyle}"` : '';
  const imgInlineStyle = ' style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;"';

  if (photoUrl) {
    return `<div class="author-dot"${parentStyle}><img src="${escapeHTML(photoUrl)}"${imgInlineStyle} onerror="this.style.display='none'; this.parentElement.style.background=''; this.parentElement.innerHTML='${escapeHTML(initials)}';" /></div>`;
  }

  if (initials && initials.length > 3) {
    const factor = Math.max(0.35, 0.7 - (initials.length - 3) * 0.05);
    return `<div class="author-dot" style="font-size: ${factor}rem !important; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; padding: 2px; ${sizeStyle}">${escapeHTML(initials)}</div>`;
  }

  return `<div class="author-dot"${dynamicStyle}>${escapeHTML(initials || 'UN')}</div>`;
}

// Image upload previews on modals
function previewImageUpload(inputEl, previewImgId) {
  const file = inputEl.files[0];
  const form = inputEl.closest('form');
  const errorEl = form ? (form.querySelector('[id*="Error"]') || form.querySelector('[id*="error"]')) : null;
  if (errorEl) errorEl.textContent = '';

  if (file) {
    if (file.size > 10 * 1024 * 1024) {
      if (errorEl) errorEl.textContent = 'Image file size exceeds the 10MB limit. Please choose a smaller image.';
      inputEl.value = '';
      const previewEl = document.getElementById(previewImgId);
      if (previewEl) {
        previewEl.removeAttribute('src');
        previewEl.style.display = 'none';
      }
      return;
    }
    compressImage(file).then(dataUrl => {
      const previewEl = document.getElementById(previewImgId);
      if (previewEl) {
        previewEl.src = dataUrl;
        previewEl.style.display = '';
      }
    }).catch(err => {
      console.error("Error compressing preview:", err);
      if (errorEl) errorEl.textContent = 'Error loading image preview.';
    });
  }
}

function removePreviewImage(previewImgId) {
  const previewEl = document.getElementById(previewImgId);
  if (previewEl) {
    previewEl.removeAttribute('src');
    previewEl.style.display = 'none';
  }
}

// ═════════════════════════════════════=
//  FIREBASE AUTHENTICATION
// ═════════════════════════════════════=
onAuthStateChanged(auth, async (user) => {
  if (user) {
    CURRENT_USER = {
      uid: user.uid,
      email: user.email,
      name: user.displayName || user.email.split('@')[0],
      ingameName: user.displayName || user.email.split('@')[0],
      photoURL: user.photoURL || '',
      initials: ''
    };

    try {
      const userDocRef = doc(db, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);
      let needsSetup = false;

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        CURRENT_USER.ingameName = userData.ingameName || CURRENT_USER.ingameName;
        CURRENT_USER.name = userData.name || CURRENT_USER.name;
        CURRENT_USER.photoURL = userData.photoURL || user.photoURL || '';
        CURRENT_USER.initials = userData.initials || '';
        CURRENT_USER.bio = userData.bio || '';
        CURRENT_USER.nickname = userData.nickname || '';
        CURRENT_USER.speciality = userData.speciality || '';
        CURRENT_USER.favoriteGamemode = userData.favoriteGamemode || '';
        CURRENT_USER.isAdmin = userData.isAdmin || ADMIN_EMAILS.some(e => e.trim().toLowerCase() === user.email.trim().toLowerCase());

        if (!userData.ingameName || !userData.initials || !userData.photoURL) {
          needsSetup = true;
        }

        await updateDoc(userDocRef, {
          lastActive: serverTimestamp(),
          photoURL: CURRENT_USER.photoURL,
          initials: CURRENT_USER.initials,
          isAdmin: CURRENT_USER.isAdmin
        });
      } else {
        needsSetup = true;
        CURRENT_USER.isAdmin = ADMIN_EMAILS.some(e => e.trim().toLowerCase() === user.email.trim().toLowerCase());
        await setDoc(userDocRef, {
          uid: user.uid,
          email: user.email,
          name: CURRENT_USER.name,
          ingameName: CURRENT_USER.ingameName,
          photoURL: CURRENT_USER.photoURL,
          initials: '',
          bio: '',
          nickname: '',
          speciality: '',
          favoriteGamemode: '',
          isAdmin: CURRENT_USER.isAdmin,
          lastActive: serverTimestamp()
        });
      }

      if (needsSetup) {
        setTimeout(() => promptProfileSetupModal(), 500);
      }
    } catch (err) {
      console.error("Error syncing user profile:", err);
    }

    setupUsersListener();
    setupAllUserMessagesListener();
  } else {
    stopChatting();
    CURRENT_USER = null;
    if (unsubscribeUsers) { unsubscribeUsers(); unsubscribeUsers = null; }
    if (unsubscribeMessages) { unsubscribeMessages(); unsubscribeMessages = null; }
    if (unsubscribeAllUserMessages) { unsubscribeAllUserMessages(); unsubscribeAllUserMessages = null; }
    ACTIVE_CHAT_USER = null;
  }
  updateAuthUI();
  updateCreationButtonsVisibility();
  isAuthInitialized = true;
  tryHideLoader();
});

function updateAuthUI() {
  const area = document.getElementById('authArea');
  const mobileArea = document.getElementById('mobileAuthArea');
  const chatToggle = document.getElementById('chatToggleButton');
  const uploadImageTrigger = document.getElementById('uploadImageTrigger');
  if (!area) return;

  if (CURRENT_USER) {
    const avatarHTML = getAuthorDotHTML(CURRENT_USER.photoURL, CURRENT_USER.initials || 'UN', "width: 24px; height: 24px; font-size: 0.6rem; margin: 0;");
    const pfpHTML = `<div onclick="window.promptProfileSetupModal()" style="cursor: pointer; display: inline-flex; align-items: center; justify-content: center; border-radius: 50%; overflow: hidden; ${CURRENT_USER.photoURL ? 'border: 1px solid var(--crimson);' : ''}">${avatarHTML}</div>`;

    area.innerHTML = `
      <div style="display:flex;gap:8px;align-items:center">
        ${pfpHTML}
        <button class="btn-secondary" onclick="window.promptProfileSetupModal()">PROFILE</button>
        <button class="btn-secondary" onclick="window.signOutUser()">LOG OUT</button>
      </div>`;

    if (mobileArea) {
      mobileArea.innerHTML = `
        <button class="btn-secondary" onclick="window.toggleChatPanel(); window.closeMobile();" style="width: 100%;">CHAT</button>
        <button class="btn-secondary" onclick="window.promptProfileSetupModal(); window.closeMobile();" style="width: 100%;">PROFILE</button>
        <button class="btn-secondary" onclick="window.signOutUser(); window.closeMobile();" style="width: 100%;">LOG OUT</button>`;
    }

    if (chatToggle) chatToggle.style.display = '';
    if (uploadImageTrigger) uploadImageTrigger.style.display = '';
  } else {
    area.innerHTML = `<button class="btn-secondary" id="authButton" onclick="window.openLoginModal()">LOG IN</button>`;
    if (mobileArea) {
      mobileArea.innerHTML = `<button class="btn-secondary" onclick="window.openLoginModal(); window.closeMobile();" style="width: 100%;">LOG IN</button>`;
    }
    if (chatToggle) chatToggle.style.display = 'none';
    if (uploadImageTrigger) uploadImageTrigger.style.display = 'none';
    closeChatPanel();
  }
}

function updateCreationButtonsVisibility() {
  const announceBtn = document.getElementById('adminAnnounceBtn');
  const taskBtn = document.getElementById('adminTaskBtn');
  const adminTriggers = [announceBtn, taskBtn];
  const visible = isAdmin();

  adminTriggers.forEach((el) => {
    if (!el) return;
    el.style.display = visible ? 'inline-block' : 'none';
    el.disabled = !visible;
    el.style.opacity = '1';
    el.title = '';
  });
}

function openLoginModal() {
  document.getElementById('modalContent').innerHTML = `
    <h2 class="modal-title">Sign in with Google</h2>
    <p class="modal-subtitle">CLAN HEADQUARTERS</p>
    <p class="modal-text" style="margin-bottom: 20px;">Sign in to access chat, upload memories, and customize your profile.</p>
    <div id="gsiStatus" style="margin-top:12px;color:rgba(255,255,255,0.7)"></div>
    <div class="modal-actions">
      <button type="button" class="btn-secondary" onclick="window.closeModal()">CANCEL</button>
      <button type="button" class="btn-primary" onclick="window.signInWithGoogle()"><span>SIGN IN WITH GOOGLE</span></button>
    </div>
  `;
  openModal();
}

function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  signInWithPopup(auth, provider)
    .then(() => {
      closeModal();
      showToast('Signed in successfully.', 'success');
      setTimeout(() => {
        promptProfileSetupModal();
      }, 250);
    })
    .catch((error) => {
      const status = document.getElementById('gsiStatus');
      if (status) status.textContent = 'Sign-in failed: ' + error.message;
      showToast('Unable to sign in. Please try again.', 'error');
    });
}

function signOutUser() {
  document.getElementById('modalContent').innerHTML = `
    <h2 class="modal-title">Log Out</h2>
    <p class="modal-text">Log out of DNMX Clan Headquarters?</p>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="window.closeModal()">CANCEL</button>
      <button class="btn-primary" onclick="window.confirmSignOut()"><span>LOG OUT</span></button>
    </div>
  `;
  openModal();
}

function confirmSignOut() {
  firebaseSignOut(auth)
    .then(() => {
      closeModal();
      showToast('Signed out.', 'info');
    })
    .catch(err => {
      console.error('Sign-out error:', err);
      showToast('Error signing out.', 'error');
    });
}

// ═════════════════════════════════════=
//  PROFILE MODAL SETUP
// ═════════════════════════════════════=
function promptProfileSetupModal() {
  if (!CURRENT_USER) return;
  const preName = CURRENT_USER.ingameName || CURRENT_USER.name || '';
  const preInitials = CURRENT_USER.initials || '';
  const prePhoto = CURRENT_USER.photoURL || '';
  const preBio = CURRENT_USER.bio || '';
  const preNickname = CURRENT_USER.nickname || '';
  const preSpeciality = CURRENT_USER.speciality || '';
  const preGamemode = CURRENT_USER.favoriteGamemode || '';

  const initialsLen = preInitials.length;
  let containerStyle = "width: 80px; height: 80px; font-size: 2rem; border-radius: 50%; margin: 0 auto 10px; display: flex; align-items: center; justify-content: center; overflow: hidden; background: linear-gradient(135deg, rgba(220, 20, 60, 0.5), rgba(0, 102, 255, 0.5));";
  if (initialsLen > 3) {
    const factor = Math.max(0.7, 2 - (initialsLen - 3) * 0.2);
    containerStyle = `width: 80px; height: 80px; font-size: ${factor}rem; padding: 4px; border-radius: 50%; margin: 0 auto 10px; display: flex; align-items: center; justify-content: center; overflow: hidden; background: linear-gradient(135deg, rgba(220, 20, 60, 0.5), rgba(0, 102, 255, 0.5));`;
  }

  document.getElementById('modalContent').innerHTML = `
    <h2 class="modal-title">Profile Setup</h2>
    <p class="modal-subtitle">Configure your profile details for the clan system.</p>
    <form id="profileSetupForm" onsubmit="window.submitProfileSetup(event)">
      <div style="text-align:center; margin-bottom: 20px;">
        <div id="profileSetupPfpContainer" class="author-dot" style="${containerStyle}">
          ${prePhoto ? `<img id="profileSetupPreview" src="${escapeHTML(prePhoto)}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;" />` : `<span id="profileSetupInitialsText">${escapeHTML(preInitials || 'UN')}</span>`}
        </div>
        <label class="btn-secondary" style="display: inline-block; cursor: pointer; padding: 6px 12px; font-size: 0.75rem; border-radius: 4px;">
          UPLOAD PHOTO
          <input type="file" id="profileSetupFileInput" accept="image/*" style="display: none;" onchange="window.previewProfileSetupPhoto(this)" />
        </label>
      </div>
      <label>
        In-Game Name
        <input type="text" id="profileSetupNameInput" placeholder="Enter your in-game name" value="${escapeHTML(preName)}" required />
      </label>
      <label style="margin-top: 12px;">
        Initials (Displayed on Avatar)
        <input type="text" id="profileSetupInitialsInput" placeholder="e.g. TNT" maxlength="10" value="${escapeHTML(preInitials)}" required oninput="window.updateProfileSetupInitialsPreview(this.value)" />
      </label>
      <label style="margin-top: 12px;">
        Nickname
        <input type="text" id="profileNicknameInput" placeholder="Optional nickname" maxlength="32" value="${escapeHTML(preNickname)}" />
      </label>
      <label style="margin-top: 12px;">
        Bio
        <textarea id="profileBioInput" placeholder="Tell us about yourself..." maxlength="300" oninput="window.updateBioCounter(this)">${escapeHTML(preBio)}</textarea>
        <div class="char-counter" id="bioCounter" style="text-align: right; font-size: 0.75rem; color: rgba(255,255,255,0.4); margin-top: 4px;">${preBio.length}/300</div>
      </label>
      <label style="margin-top: 12px;">
        Speciality
        <input type="text" id="profileSpecialityInput" placeholder="Optional" value="${escapeHTML(preSpeciality)}" />
      </label>
      <label style="margin-top: 12px;">
        Favorite Gamemode
        <input type="text" id="profileGamemodeInput" placeholder="Optional" value="${escapeHTML(preGamemode)}" />
      </label>
      <div style="display:flex;gap:14px;justify-content:flex-end;margin-top:18px;flex-wrap:wrap;">
        <button type="button" class="btn-secondary" onclick="window.closeModal()">CANCEL</button>
        <button type="submit" class="btn-primary"><span>SAVE PROFILE</span></button>
      </div>
      <p id="profileSetupError" style="margin-top:14px;color:#ff7b7b;font-size:0.9rem;min-height:20px;"></p>
    </form>
  `;
  openModal();
}

function previewProfileSetupPhoto(input) {
  const file = input.files[0];
  if (file) {
    compressImage(file).then(dataUrl => {
      const container = document.getElementById('profileSetupPfpContainer');
      if (container) {
        container.innerHTML = `<img id="profileSetupPreview" src="${dataUrl}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;" />`;
      }
    }).catch(err => {
      console.error("Error compressing pfp:", err);
      const errEl = document.getElementById('profileSetupError');
      if (errEl) errEl.textContent = 'Failed to compress image.';
    });
  }
}

function updateProfileSetupInitialsPreview(val) {
  const previewImg = document.getElementById('profileSetupPreview');
  const container = document.getElementById('profileSetupPfpContainer');
  if (!previewImg) {
    const textEl = document.getElementById('profileSetupInitialsText');
    if (textEl) {
      textEl.textContent = val.toUpperCase().trim() || 'UN';
    }
    if (container) {
      const initialsLen = val.trim().length;
      if (initialsLen > 3) {
        const factor = Math.max(0.7, 2 - (initialsLen - 3) * 0.2);
        container.style.fontSize = `${factor}rem`;
        container.style.padding = '4px';
      } else {
        container.style.fontSize = '2rem';
        container.style.padding = '0';
      }
    }
  }
}

function updateBioCounter(textarea) {
  const counter = document.getElementById('bioCounter');
  if (counter) counter.textContent = `${textarea.value.length}/300`;
}

async function submitProfileSetup(e) {
  e.preventDefault();
  const nameVal = document.getElementById('profileSetupNameInput').value.trim();
  const initialsVal = document.getElementById('profileSetupInitialsInput').value.toUpperCase().trim();
  const previewImg = document.getElementById('profileSetupPreview');
  const photoVal = previewImg ? previewImg.src : '';
  const nicknameVal = (document.getElementById('profileNicknameInput')?.value || '').trim();
  const bioVal = (document.getElementById('profileBioInput')?.value || '').trim();
  const specialityVal = (document.getElementById('profileSpecialityInput')?.value || '').trim();
  const gamemodeVal = (document.getElementById('profileGamemodeInput')?.value || '').trim();
  const errEl = document.getElementById('profileSetupError');

  if (!nameVal || !initialsVal) {
    if (errEl) errEl.textContent = 'Please enter both in-game name and initials.';
    return;
  }
  if (!CURRENT_USER) {
    if (errEl) errEl.textContent = 'User not signed in.';
    return;
  }

  CURRENT_USER.ingameName = nameVal;
  CURRENT_USER.initials = initialsVal;
  CURRENT_USER.photoURL = photoVal;
  CURRENT_USER.nickname = nicknameVal;
  CURRENT_USER.bio = bioVal;
  CURRENT_USER.speciality = specialityVal;
  CURRENT_USER.favoriteGamemode = gamemodeVal;

  try {
    await setDoc(doc(db, 'users', CURRENT_USER.uid), {
      ingameName: nameVal,
      initials: initialsVal,
      photoURL: photoVal,
      nickname: nicknameVal,
      bio: bioVal,
      speciality: specialityVal,
      favoriteGamemode: gamemodeVal,
      lastActive: serverTimestamp()
    }, { merge: true });

    updateAuthUI();
    updateCreationButtonsVisibility();
    closeModal();
    showToast('Profile updated.', 'success');
  } catch (err) {
    console.error("Error saving profile setup:", err);
    if (errEl) errEl.textContent = 'Failed to save: ' + err.message;
  }
}

// ═════════════════════════════════════=
//  DIRECT CHAT SYSTEM
// ═════════════════════════════════════=
function toggleChatPanel() {
  const panel = document.getElementById('chatPanel');
  if (!panel) return;
  const isOpen = panel.classList.contains('open');
  if (isOpen) {
    closeChatPanel();
  } else {
    panel.classList.add('open');
    if (CURRENT_USER) {
      updateDoc(doc(db, 'users', CURRENT_USER.uid), {
        lastActive: serverTimestamp()
      }).catch(err => console.error("Error updating heartbeat:", err));
    }
  }
}

function closeChatPanel() {
  stopChatting();
  const panel = document.getElementById('chatPanel');
  if (panel) panel.classList.remove('open');
}

function goBackToUserList() {
  stopChatting();
  ACTIVE_CHAT_USER = null;
  if (unsubscribeMessages) {
    unsubscribeMessages();
    unsubscribeMessages = null;
  }
  const userListEl = document.getElementById('chatUserListContainer');
  const chatRoomEl = document.getElementById('chatRoomContainer');
  if (userListEl && chatRoomEl) {
    userListEl.style.display = 'flex';
    chatRoomEl.style.display = 'none';
  }
}

function setupUsersListener() {
  if (unsubscribeUsers) unsubscribeUsers();
  const q = query(collection(db, 'users'));
  unsubscribeUsers = onSnapshot(q, (snapshot) => {
    ALL_USERS = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      if (CURRENT_USER && data.uid !== CURRENT_USER.uid) {
        ALL_USERS.push({
          uid: data.uid,
          email: data.email || '',
          name: data.name || '',
          ingameName: data.ingameName || data.name || 'Unknown',
          initials: data.initials || '',
          photoURL: data.photoURL || '',
          lastActive: data.lastActive ? data.lastActive.toDate() : null
        });
      }
    });

    sortAndRenderUsers();

    if (ACTIVE_CHAT_USER) {
      const updatedUser = ALL_USERS.find(u => u.uid === ACTIVE_CHAT_USER.uid);
      if (updatedUser) {
        ACTIVE_CHAT_USER = updatedUser;
        const onlineStatusEl = document.getElementById('chatRoomHeaderStatus');
        if (onlineStatusEl) {
          const online = isUserOnline(ACTIVE_CHAT_USER);
          onlineStatusEl.innerHTML = online
            ? `<span class="status-dot online"></span>Online`
            : `<span class="status-dot offline"></span>Offline`;
        }
      }
    }
  }, (error) => {
    console.error('Error listening to users:', error);
  });
}

function sortAndRenderUsers() {
  ALL_USERS.sort((a, b) => {
    const aTime = LAST_MESSAGE_MAP[a.uid] ? LAST_MESSAGE_MAP[a.uid].getTime() : 0;
    const bTime = LAST_MESSAGE_MAP[b.uid] ? LAST_MESSAGE_MAP[b.uid].getTime() : 0;
    if (aTime > 0 && bTime > 0) return bTime - aTime;
    if (aTime > 0 && bTime === 0) return -1;
    if (aTime === 0 && bTime > 0) return 1;
    return a.ingameName.localeCompare(b.ingameName);
  });
  renderChatUserList();
}

function setupAllUserMessagesListener() {
  if (unsubscribeAllUserMessages) unsubscribeAllUserMessages();
  if (!CURRENT_USER) return;

  const q = query(
    collection(db, 'messages'),
    or(
      where('senderUid', '==', CURRENT_USER.uid),
      where('receiverUid', '==', CURRENT_USER.uid)
    )
  );

  unsubscribeAllUserMessages = onSnapshot(q, (snapshot) => {
    LAST_MESSAGE_MAP = {};
    snapshot.forEach((doc) => {
      const data = doc.data();
      const createdAt = data.createdAt && typeof data.createdAt.toDate === 'function'
        ? data.createdAt.toDate()
        : (data.createdAt instanceof Date ? data.createdAt : new Date());

      const otherUid = data.senderUid === CURRENT_USER.uid ? data.receiverUid : data.senderUid;
      if (otherUid) {
        const currentLast = LAST_MESSAGE_MAP[otherUid];
        if (!currentLast || createdAt > currentLast) {
          LAST_MESSAGE_MAP[otherUid] = createdAt;
        }
      }
    });
    sortAndRenderUsers();
  }, (error) => {
    console.error("Error listening to user messages:", error);
  });
}

async function updateMyTypingState(isTyping) {
  if (!CURRENT_USER || !ACTIVE_CHAT_USER) return;
  const uids = [CURRENT_USER.uid, ACTIVE_CHAT_USER.uid].sort();
  const chatId = uids.join('_');
  try {
    await setDoc(doc(db, 'typing_states', chatId), {
      [CURRENT_USER.uid]: isTyping
    }, { merge: true });
    isCurrentlyTyping = isTyping;
  } catch (err) {
    console.error("Error updating typing state:", err);
  }
}

function handleTypingInput() {
  if (!isCurrentlyTyping) updateMyTypingState(true);
  if (typingTimeout) clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    updateMyTypingState(false);
  }, 2000);
}

function setupTypingStateListener() {
  if (unsubscribeTypingState) {
    unsubscribeTypingState();
    unsubscribeTypingState = null;
  }

  const indicatorEl = document.getElementById('chatTypingIndicator');
  const textEl = document.getElementById('chatTypingText');
  if (indicatorEl) indicatorEl.style.display = 'none';

  if (!CURRENT_USER || !ACTIVE_CHAT_USER) return;

  const uids = [CURRENT_USER.uid, ACTIVE_CHAT_USER.uid].sort();
  const chatId = uids.join('_');

  unsubscribeTypingState = onSnapshot(doc(db, 'typing_states', chatId), (docSnap) => {
    if (docSnap.exists() && ACTIVE_CHAT_USER) {
      const data = docSnap.data();
      const isOtherTyping = data[ACTIVE_CHAT_USER.uid] === true;
      if (isOtherTyping) {
        if (textEl) textEl.textContent = `${ACTIVE_CHAT_USER.ingameName} is typing`;
        if (indicatorEl) indicatorEl.style.display = 'flex';
      } else {
        if (indicatorEl) indicatorEl.style.display = 'none';
      }
    } else {
      if (indicatorEl) indicatorEl.style.display = 'none';
    }
  }, (error) => {
    console.error("Error listening to typing state:", error);
  });
}

function stopChatting() {
  if (typingTimeout) {
    clearTimeout(typingTimeout);
    typingTimeout = null;
  }
  if (isCurrentlyTyping) updateMyTypingState(false);
  if (unsubscribeTypingState) {
    unsubscribeTypingState();
    unsubscribeTypingState = null;
  }
  const indicatorEl = document.getElementById('chatTypingIndicator');
  if (indicatorEl) indicatorEl.style.display = 'none';
  removeChatMedia();
}

function handleChatFile(file) {
  if (file && file.type.startsWith('image/')) {
    compressImage(file).then(dataUrl => {
      CHAT_SELECTED_MEDIA_BASE64 = dataUrl;
      const previewEl = document.getElementById('chatMediaPreview');
      const previewImg = document.getElementById('chatMediaPreviewImg');
      if (previewEl && previewImg) {
        previewImg.src = dataUrl;
        previewEl.style.display = 'flex';
      }
    }).catch(err => console.error("Error loading chat media:", err));
  }
}

function removeChatMedia() {
  CHAT_SELECTED_MEDIA_BASE64 = '';
  const previewEl = document.getElementById('chatMediaPreview');
  const previewImg = document.getElementById('chatMediaPreviewImg');
  if (previewEl) previewEl.style.display = 'none';
  if (previewImg) previewImg.removeAttribute('src');
}

function setupDragAndDropListeners() {
  const dropZone = document.getElementById('chatRoomContainer');
  const inputEl = document.getElementById('chatMessageInput');
  if (!dropZone || !inputEl) return;

  ['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.add('drag-active');
    }, false);
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.remove('drag-active');
    }, false);
  });

  dropZone.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    const files = dt.files;
    if (files && files.length > 0) {
      handleChatFile(files[0]);
    }
  }, false);

  inputEl.addEventListener('paste', (e) => {
    const items = (e.clipboardData || e.originalEvent.clipboardData).items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          e.preventDefault();
          handleChatFile(file);
          break;
        }
      }
    }
  });
}

function isUserOnline(user) {
  if (!user.lastActive) return false;
  const diffMins = (new Date() - user.lastActive) / 1000 / 60;
  return diffMins < 5;
}

function renderChatUserList() {
  const container = document.getElementById('chatUserList');
  if (!container) return;

  if (ALL_USERS.length === 0) {
    container.innerHTML = `
      <div style="text-align:center;padding:40px 20px;color:rgba(255,255,255,0.3);font-size:0.9rem;">
        <p>No other members found.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = ALL_USERS.map(user => {
    const online = isUserOnline(user);
    return `
      <div class="chat-user-card" onclick="window.openChatWithUser('${user.uid}')" style="display:flex; align-items:center; gap:10px;">
        ${getAuthorDotHTML(user.photoURL, user.initials || user.ingameName.split(' ').map(w => w[0]).join('').slice(0, 10), "width:24px; height:24px; font-size:0.6rem; margin:0; flex-shrink:0;")}
        <div class="chat-user-info" style="flex:1;">
          <span class="chat-user-name">${escapeHTML(user.ingameName)}</span>
        </div>
        <span class="status-dot ${online ? 'online' : 'offline'}" title="${online ? 'Online' : 'Offline'}"></span>
      </div>
    `;
  }).join('');
}

function openChatWithUser(userUid) {
  const targetUser = ALL_USERS.find(u => u.uid === userUid);
  if (!targetUser) return;
  stopChatting();
  ACTIVE_CHAT_USER = targetUser;

  const userListEl = document.getElementById('chatUserListContainer');
  const chatRoomEl = document.getElementById('chatRoomContainer');
  if (userListEl && chatRoomEl) {
    userListEl.style.display = 'none';
    chatRoomEl.style.display = 'flex';
  }

  const headerName = document.getElementById('chatRoomHeaderName');
  if (headerName) headerName.textContent = ACTIVE_CHAT_USER.ingameName;

  const onlineStatusEl = document.getElementById('chatRoomHeaderStatus');
  if (onlineStatusEl) {
    const online = isUserOnline(ACTIVE_CHAT_USER);
    onlineStatusEl.innerHTML = online
      ? `<span class="status-dot online"></span>Online`
      : `<span class="status-dot offline"></span>Offline`;
  }

  const inputEl = document.getElementById('chatMessageInput');
  if (inputEl) {
    inputEl.value = '';
    inputEl.style.height = '';
    inputEl.focus();
  }

  setupMessagesListener();
  setupTypingStateListener();
}

function setupMessagesListener() {
  if (unsubscribeMessages) unsubscribeMessages();
  if (!CURRENT_USER || !ACTIVE_CHAT_USER) return;

  const uids = [CURRENT_USER.uid, ACTIVE_CHAT_USER.uid].sort();
  const chatId = uids.join('_');

  const q = query(collection(db, 'messages'), where('chatId', '==', chatId));
  unsubscribeMessages = onSnapshot(q, (snapshot) => {
    MESSAGES = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      const createdAtValue = data.createdAt && typeof data.createdAt.toDate === 'function'
        ? data.createdAt.toDate()
        : (data.createdAt instanceof Date ? data.createdAt : new Date());
      MESSAGES.push({
        id: doc.id,
        senderUid: data.senderUid,
        senderName: data.senderName,
        text: data.text,
        imageUrl: data.imageUrl || '',
        createdAt: createdAtValue
      });
    });

    MESSAGES.sort((a, b) => a.createdAt - b.createdAt);
    renderChatMessages();
  }, (error) => {
    console.error('Error listening to messages:', error);
  });
}

function renderChatMessages() {
  const container = document.getElementById('chatMessagesBody');
  if (!container) return;

  if (MESSAGES.length === 0) {
    container.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;color:rgba(255,255,255,0.3);font-size:0.9rem;text-align:center;">
        <p>No messages yet.</p>
        <p style="font-size:0.75rem;color:rgba(255,255,255,0.2);margin-top:4px;">Say hi to start chatting!</p>
      </div>
    `;
    return;
  }

  container.innerHTML = MESSAGES.map(msg => {
    const isSelf = msg.senderUid === CURRENT_USER.uid;
    const timeStr = msg.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const messageClass = isSelf ? 'msg-self' : 'msg-other';
    const imageHTML = msg.imageUrl
      ? `<div style="margin-top: 6px;"><img src="${escapeHTML(msg.imageUrl)}" style="max-width: 100%; max-height: 200px; border-radius: 6px; cursor: pointer; border: 1px solid rgba(255,255,255,0.1);" onclick="window.openImageFullModal('${msg.id}', '${msg.imageUrl}', 'Chat Media')" /></div>`
      : '';

    return `
      <div class="msg-row ${isSelf ? 'row-self' : 'row-other'}">
        <div class="msg-bubble ${messageClass}">
          ${msg.text ? `<div class="msg-text">${parseDiscordFormatting(msg.text)}</div>` : ''}
          ${imageHTML}
          <div class="msg-time">${timeStr}</div>
        </div>
      </div>
    `;
  }).join('');

  container.scrollTop = container.scrollHeight;
}

async function sendChatMessage() {
  const inputEl = document.getElementById('chatMessageInput');
  if (!inputEl) return;
  const text = inputEl.value.trim();
  const hasMedia = CHAT_SELECTED_MEDIA_BASE64 !== '';
  if ((!text && !hasMedia) || !CURRENT_USER || !ACTIVE_CHAT_USER) return;

  const uids = [CURRENT_USER.uid, ACTIVE_CHAT_USER.uid].sort();
  const chatId = uids.join('_');
  const mediaBase64 = CHAT_SELECTED_MEDIA_BASE64;

  inputEl.value = '';
  inputEl.style.height = '';
  removeChatMedia();

  if (typingTimeout) {
    clearTimeout(typingTimeout);
    typingTimeout = null;
  }
  if (isCurrentlyTyping) updateMyTypingState(false);

  try {
    await addDoc(collection(db, 'messages'), {
      chatId: chatId,
      senderUid: CURRENT_USER.uid,
      senderName: CURRENT_USER.ingameName || CURRENT_USER.name,
      receiverUid: ACTIVE_CHAT_USER.uid,
      text: text,
      imageUrl: mediaBase64,
      createdAt: serverTimestamp()
    });

    await updateDoc(doc(db, 'users', CURRENT_USER.uid), {
      lastActive: serverTimestamp()
    });
  } catch (error) {
    console.error('Error sending message:', error);
  }
}

// ═════════════════════════════════════=
//  RANKS DIRECTORY RENDERING
// ═════════════════════════════════════=
function getBadgeClass(cat) {
  const map = { 'Executive Council': 'badge-executive', 'Star Officers': 'badge-star', 'Officers': 'badge-officer', 'Members': 'badge-member' };
  return map[cat] || 'badge-member';
}

function renderRanks() {
  const searchInput = document.getElementById('rankSearch');
  const grid = document.getElementById('rankGrid');
  if (!searchInput || !grid) return;
  const search = searchInput.value.toLowerCase().trim();

  const filtered = RANKS.filter(r => {
    const matchFilter = rankFilter === 'all' || r.category === rankFilter;
    const matchSearch = !search || r.name.toLowerCase().includes(search) || r.category.toLowerCase().includes(search) || r.preview.toLowerCase().includes(search);
    return matchFilter && matchSearch;
  });

  if (!filtered.length) {
    grid.innerHTML = `<div class="no-results" style="grid-column:1/-1">
      <div class="no-results-icon">🔍</div>
      <h3>No ranks found</h3><p>Try adjusting your search or filters.</p>
    </div>`;
    return;
  }

  grid.innerHTML = filtered.map(r => `
    <div class="rank-card" onclick="openRankModal(${r.id})">
      <span class="rank-badge ${getBadgeClass(r.category)}">${r.category}</span>
      <h3 class="rank-name">${r.name}</h3>
      <p class="rank-tier">${r.tier}</p>
      <p class="rank-preview">${r.preview}</p>
      <div class="rank-card-footer">
        <span class="rank-click-hint">VIEW DETAILS</span>
      </div>
    </div>
  `).join('');
}

function filterRanks() { renderRanks(); }
function setRankFilter(f, el) {
  rankFilter = f;
  document.querySelectorAll('#rankFilters .chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  renderRanks();
}

function openRankModal(id) {
  const r = RANKS.find(x => x.id === id);
  if (!r) return;
  document.getElementById('modalContent').innerHTML = `
    <span class="modal-badge ${getBadgeClass(r.category)}">${r.category}</span>
    <h2 class="modal-title">${r.name}</h2>
    <p class="modal-subtitle">${r.tier}</p>
    <div class="modal-divider"></div>
    <p class="modal-section-title">DESCRIPTION</p>
    <p class="modal-text">${r.description}</p>
    <div class="modal-grid">
      <div class="modal-info-box">
        <h4>POWERS & AUTHORITY</h4>
        <p>${r.powers}</p>
      </div>
      <div class="modal-info-box">
        <h4>REQUIREMENTS</h4>
        <p>${r.requirements}</p>
      </div>
    </div>
  `;
  openModal();
}

// ═════════════════════════════════════=
//  COUNCILS DIRECTORY RENDERING
// ═════════════════════════════════════=
function switchTab(tab, el) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  document.getElementById(`tab-${tab}`).classList.add('active');
}

function renderMembers(type) {
  const isExec = type === 'exec';
  const data = isExec ? EXEC_MEMBERS : MGMT_MEMBERS;
  const searchInput = document.getElementById(isExec ? 'execSearch' : 'mgmtSearch');
  const grid = document.getElementById(isExec ? 'execGrid' : 'mgmtGrid');
  if (!searchInput || !grid) return;
  const search = searchInput.value.toLowerCase().trim();

  const filtered = data.filter(m =>
    !search || m.name.toLowerCase().includes(search) || m.position.toLowerCase().includes(search) || m.description.toLowerCase().includes(search)
  );

  if (!filtered.length) {
    grid.innerHTML = `<div class="no-results" style="grid-column:1/-1">
      <div class="no-results-icon">🔍</div>
      <h3>No members found</h3><p>Try a different search.</p>
    </div>`;
    return;
  }

  grid.innerHTML = filtered.map(m => {
    const uData = getUserDataByIngameName(m.name);
    const hasPhoto = uData && uData.photoURL;
    const initials = uData ? uData.initials : m.initials;

    let fontStyle = '';
    if (!hasPhoto && initials.length > 3) {
      const factor = Math.max(0.6, 1.6 - (initials.length - 3) * 0.15);
      fontStyle = ` style="font-size: ${factor}rem !important; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; padding: 4px;"`;
    }

    const avatarHTML = hasPhoto
      ? `<img src="${escapeHTML(uData.photoURL)}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;" />`
      : escapeHTML(initials);
    return `
      <div class="member-card" onclick="openMemberModal(${m.id})">
        <div class="member-avatar"${fontStyle}>${avatarHTML}</div>
        <h3 class="member-name">${m.name}</h3>
        <p class="member-position">${m.position}</p>
        <p class="member-desc-preview">${m.description}</p>
        <div class="member-view-btn">VIEW FULL PROFILE →</div>
      </div>
    `;
  }).join('');
}

function filterMembers(type) { renderMembers(type); }

function openMemberModal(id) {
  const m = [...EXEC_MEMBERS, ...MGMT_MEMBERS].find(x => x.id === id);
  if (!m) return;
  const uData = getUserDataByIngameName(m.name);
  const hasPhoto = uData && uData.photoURL;
  const initials = uData ? uData.initials : m.initials;

  let fontStyle = '';
  if (!hasPhoto && initials.length > 3) {
    const factor = Math.max(0.7, 1.8 - (initials.length - 3) * 0.15);
    fontStyle = ` font-size: ${factor}rem !important; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; padding: 6px;`;
  }

  const avatarHTML = hasPhoto
    ? `<img src="${escapeHTML(uData.photoURL)}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;" />`
    : escapeHTML(initials);

  document.getElementById('modalContent').innerHTML = `
    <div style="display:flex;align-items:center;gap:20px;margin-bottom:24px;">
      <div class="member-avatar" style="width:80px;height:80px;overflow:hidden;display:flex;align-items:center;justify-content:center;${fontStyle}">${avatarHTML}</div>
      <div>
        <h2 class="modal-title" style="margin-bottom:4px;">${m.name}</h2>
        <p class="modal-subtitle" style="margin-bottom:0;">${m.position}</p>
        <span class="rank-badge ${m.council === 'Executive' ? 'badge-executive' : 'badge-officer'}" style="margin-top:8px;display:inline-block;">${m.council} Council</span>
      </div>
    </div>
    <div class="modal-divider"></div>
    <p class="modal-section-title">ABOUT</p>
    <p class="modal-text">${m.description}</p>
    <div class="modal-grid" style="margin-top:20px;">
      <div class="modal-info-box">
        <h4>PLAYSTYLE</h4>
        <p>${m.playstyle}</p>
      </div>
      <div class="modal-info-box">
        <h4>COUNCIL RESPONSIBILITIES</h4>
        <p>${m.responsibilities}</p>
      </div>
    </div>
  `;
  openModal();
}

// ═════════════════════════════════════=
//  ANNOUNCEMENTS LOGIC
// ═════════════════════════════════════=
function setupAnnouncementsListener() {
  const q = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'));
  onSnapshot(q, (snapshot) => {
    ANNOUNCEMENTS = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      const createdAtValue = data.createdAt && typeof data.createdAt.toDate === 'function'
        ? data.createdAt.toDate()
        : (data.createdAt instanceof Date ? data.createdAt : new Date());
      const formattedDate = createdAtValue.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

      ANNOUNCEMENTS.push({
        id: doc.id,
        title: data.title || '',
        body: data.content || '',
        category: data.category || 'update',
        author: data.author || 'Unknown',
        authorName: data.authorName || data.author || 'Unknown',
        authorInitials: data.authorInitials || (data.authorName ? data.authorName.split(' ').map(w => w[0]).join('').slice(0, 10) : (data.author ? data.author.split(' ').map(w => w[0]).join('').slice(0, 10) : 'UN')),
        authorPhotoUrl: data.authorPhotoUrl || '',
        imageUrl: data.imageUrl || '',
        date: formattedDate,
        createdAt: createdAtValue,
        preview: (() => {
          const collapsed = collapseNewlines(data.content || '');
          return collapsed.length > 140 ? collapsed.slice(0, 137) + '...' : collapsed;
        })(),
        featured: data.featured === true
      });
    });
    renderAnnouncements();
  }, (error) => {
    console.error('Error listening to announcements:', error);
  });
}

function renderAnnouncements() {
  const searchInput = document.getElementById('announceSearch');
  if (!searchInput) return;
  const search = searchInput.value.toLowerCase().trim();
  const sortedAnnouncements = [...ANNOUNCEMENTS].sort((a, b) => b.createdAt - a.createdAt);
  const featured = sortedAnnouncements.find(a => a.featured);
  const featuredArea = document.getElementById('featuredArea');

  if (featuredArea) {
    if (featured && !search && announceFilter === 'all') {
      featuredArea.innerHTML = `
        <div class="featured-announcement">
          <span class="featured-tag tag-${featured.category}">${featured.category.toUpperCase()}</span>
          <h2 class="featured-title">${featured.title}</h2>
          <div class="featured-body">${parseDiscordFormatting(featured.body)}</div>
          <div class="announce-meta" style="display:flex; align-items:center; gap:8px;">
            <span>${featured.date}</span>
            <div class="announce-dot"></div>
            <div style="display:inline-flex; align-items:center; gap:6px;">
              ${getAuthorDotHTML(featured.authorPhotoUrl, featured.authorInitials, "width:18px; height:18px; font-size:0.5rem; margin:0;")}
              <span style="font-weight: 500; color: #fff;">${featured.authorName || featured.author}</span>
            </div>
            <div class="announce-dot"></div>
            <span>PINNED</span>
          </div>
        </div>`;
    } else {
      featuredArea.innerHTML = '';
    }
  }

  const rest = sortedAnnouncements.filter(a => {
    const matchFilter = announceFilter === 'all' || a.category === announceFilter;
    const matchSearch = !search || a.title.toLowerCase().includes(search) || (a.body || '').toLowerCase().includes(search) || (a.authorName || a.author).toLowerCase().includes(search);
    return matchFilter && matchSearch && !(a.featured && !search && announceFilter === 'all');
  });

  const totalPages = Math.max(1, Math.ceil(rest.length / ANNOUNCE_PER_PAGE));
  if (announcePage > totalPages) announcePage = 1;
  const paginated = rest.slice((announcePage - 1) * ANNOUNCE_PER_PAGE, announcePage * ANNOUNCE_PER_PAGE);

  const grid = document.getElementById('announceGrid');
  if (!paginated.length) {
    grid.innerHTML = `<div class="no-results" style="grid-column:1/-1">
      <div class="no-results-icon">📣</div>
      <h3>No announcements found</h3><p>Try adjusting your search or filters.</p>
    </div>`;
  } else {
    grid.innerHTML = paginated.map(a => `
      <div class="announce-card" onclick="openAnnouncementModal('${a.id}')">
        <div class="announce-card-top">
          <span class="announce-tag tag-${a.category}">${a.category.toUpperCase()}</span>
          <span class="announce-date">${a.date}</span>
        </div>
        <h3 class="announce-title">${a.title}</h3>
        <div class="announce-preview">${parseDiscordFormatting(a.preview)}</div>
        <div class="announce-card-footer">
          <div class="announce-author">
            ${getAuthorDotHTML(a.authorPhotoUrl, a.authorInitials)}
            ${a.authorName || a.author}
          </div>
        </div>
      </div>
    `).join('');
  }

  // Pagination
  const pag = document.getElementById('pagination');
  if (pag) {
    if (totalPages <= 1) { pag.innerHTML = ''; return; }
    let pagHTML = `<button class="page-btn arrow" onclick="goPage(${announcePage - 1})" ${announcePage === 1 ? 'disabled style="opacity:0.3;cursor:not-allowed"' : ''}>‹</button>`;
    for (let i = 1; i <= totalPages; i++) {
      pagHTML += `<button class="page-btn ${i === announcePage ? 'active' : ''}" onclick="goPage(${i})">${i}</button>`;
    }
    pagHTML += `<button class="page-btn arrow" onclick="goPage(${announcePage + 1})" ${announcePage === totalPages ? 'disabled style="opacity:0.3;cursor:not-allowed"' : ''}>›</button>`;
    pag.innerHTML = pagHTML;
  }
}

function goPage(p) {
  const total = Math.ceil(ANNOUNCEMENTS.filter(a => {
    const matchFilter = announceFilter === 'all' || a.category === announceFilter;
    return matchFilter && !a.featured;
  }).length / ANNOUNCE_PER_PAGE);
  if (p < 1 || p > total) return;
  announcePage = p;
  renderAnnouncements();
  window.scrollTo({ top: document.getElementById('announcements-page').offsetTop, behavior: 'smooth' });
}

function filterAnnouncements() { announcePage = 1; renderAnnouncements(); }
function setAnnounceFilter(f, el) {
  announceFilter = f; announcePage = 1;
  document.querySelectorAll('#announceFilters .chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  renderAnnouncements();
}

function openAnnouncementModal(id) {
  const a = ANNOUNCEMENTS.find(x => x.id === id);
  if (!a) return;
  document.getElementById('modalContent').innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:20px;flex-wrap:wrap;">
      <span class="featured-tag tag-${a.category}" style="margin:0;">${a.category.toUpperCase()}</span>
      <div class="announce-meta">${a.date}</div>
    </div>
    <h2 class="modal-title">${a.title}</h2>
    <div class="announce-meta" style="margin:12px 0 24px;">
      ${getAuthorDotHTML(a.authorPhotoUrl, a.authorInitials, "width:28px;height:28px;border-radius:50%;font-size:.7rem;")}
      <span>Issued by ${a.authorName || a.author}</span>
    </div>
    <div class="modal-divider"></div>
    <div class="modal-text" style="line-height:1.9;">${parseDiscordFormatting(a.body)}</div>
    <div style="display:flex;gap:12px;justify-content:flex-end;margin-top:24px;align-items:center;flex-wrap:wrap;">
      ${a.imageUrl ? `
        <button type="button" class="btn-primary" style="padding: 10px 20px; font-family: 'Orbitron', sans-serif; font-size: 0.65rem; letter-spacing: 0.15em;" onclick="window.openMediaFullModal('${a.imageUrl}', 'image', '${escapeHTML(a.title)}')">VIEW MEDIA</button>
      ` : ''}
      ${isAdmin() ? `
        <button type="button" class="btn-secondary" style="padding: 10px 20px; font-family: 'Orbitron', sans-serif; font-size: 0.65rem; letter-spacing: 0.15em;" onclick="window.openEditAnnouncementModal('${a.id}')">EDIT</button>
        <button type="button" class="btn-primary" style="padding: 10px 20px; font-family: 'Orbitron', sans-serif; font-size: 0.65rem; letter-spacing: 0.15em; background: linear-gradient(135deg, var(--crimson-deep), var(--crimson)); border: none;" onclick="window.requestDeleteAnnouncement('${a.id}')">DELETE</button>
      ` : ''}
      <button type="button" class="btn-secondary" onclick="closeModal()">CLOSE</button>
    </div>
  `;
  openModal();
}

function selectAnnouncementType(type, element) {
  document.querySelectorAll('.task-type-btn').forEach(btn => btn.classList.remove('selected'));
  element.classList.add('selected');
  document.getElementById('announceCategory').value = type;
}

function openNewAnnouncementModal() {
  if (!isAdmin()) return;
  const authorVal = CURRENT_USER ? CURRENT_USER.ingameName : '';
  const initialsVal = CURRENT_USER ? (CURRENT_USER.initials || CURRENT_USER.ingameName.split(' ').map(w => w[0]).join('').slice(0, 10)) : '';

  document.getElementById('modalContent').innerHTML = `
    <h2 class="modal-title">New Announcement</h2>
    <p class="modal-subtitle" style="margin-bottom:18px;">Choose a category, enter the title, body, and your in-game name.</p>
    <form id="announceForm" onsubmit="window.submitAnnouncementForm(event)">
      <label style="margin-bottom:14px;">
        Announcement Type
        <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:8px;">
          <button type="button" class="task-type-btn" onclick="window.selectAnnouncementType('update', this)">UPDATE</button>
          <button type="button" class="task-type-btn" onclick="window.selectAnnouncementType('event', this)">EVENT</button>
          <button type="button" class="task-type-btn" onclick="window.selectAnnouncementType('alert', this)">ALERT</button>
          <button type="button" class="task-type-btn" onclick="window.selectAnnouncementType('recruit', this)">RECRUIT</button>
          <button type="button" class="task-type-btn" onclick="window.selectAnnouncementType('decree', this)">DECREE</button>
        </div>
        <input type="hidden" id="announceCategory" required />
      </label>
      <label>
        Title
        <input type="text" id="announceTitle" placeholder="Enter headline" required />
      </label>
      <label>
        Body
        <textarea id="announceBody" placeholder="Write the announcement details" required></textarea>
      </label>
      <label>
        Your In-Game Name
        <input type="text" id="announceAuthor" placeholder="Enter your in-game name" value="${escapeHTML(authorVal)}" required />
      </label>
      <label>
        Initials
        <input type="text" id="announceInitials" placeholder="Enter your initials" value="${escapeHTML(initialsVal)}" maxlength="10" required />
      </label>
      <label style="margin-top: 14px;">
        Attach Image (Optional)
        <input type="file" id="announceImageFile" accept="image/*" onchange="window.previewImageUpload(this, 'announceImagePreview')" />
        <img id="announceImagePreview" class="modal-image-preview" style="display:none;" />
      </label>
      <div style="display:flex;gap:14px;justify-content:flex-end;margin-top:18px;flex-wrap:wrap;">
        <button type="button" class="btn-secondary" onclick="closeModal()">CANCEL</button>
        <button type="submit" class="btn-primary"><span>PUBLISH</span></button>
      </div>
      <p id="announceError" style="margin-top:14px;color:#ff7b7b;font-size:0.9rem;min-height:20px;"></p>
    </form>
  `;
  openModal();
}

async function submitAnnouncementForm(event) {
  event.preventDefault();
  const category = document.getElementById('announceCategory').value;
  const title = document.getElementById('announceTitle').value.trim();
  const body = document.getElementById('announceBody').value.trim();
  const authorName = document.getElementById('announceAuthor').value.trim();
  const initials = document.getElementById('announceInitials').value.trim();
  const errorEl = document.getElementById('announceError');

  if (!category || !title || !body || !authorName || !initials) {
    if (errorEl) errorEl.textContent = 'All fields are required.';
    return;
  }

  try {
    const imgPreview = document.getElementById('announceImagePreview');
    const imageUrl = imgPreview && imgPreview.src ? imgPreview.src : '';
    await saveAnnouncementToFirestore(category, title, body, authorName, initials, imageUrl);
    closeModal();
    announceFilter = 'all';
    renderAnnouncements();
    showToast('Announcement published.', 'success');
  } catch (error) {
    if (errorEl) errorEl.textContent = 'Error publishing announcement: ' + error.message;
  }
}

async function saveAnnouncementToFirestore(category, title, body, authorName, authorInitials, imageUrl = '') {
  await addDoc(collection(db, 'announcements'), {
    title: title,
    content: body,
    author: CURRENT_USER ? CURRENT_USER.email : 'unknown@example.com',
    authorName: authorName,
    authorInitials: authorInitials,
    authorPhotoUrl: CURRENT_USER ? (CURRENT_USER.photoURL || '') : '',
    createdAt: serverTimestamp(),
    imageUrl: imageUrl,
    category: category
  });
}

function requestDeleteAnnouncement(id) {
  document.getElementById('modalContent').innerHTML = `
    <h2 class="modal-title">Confirm Delete Announcement</h2>
    <p class="modal-subtitle" style="margin-bottom:18px;">Are you sure you want to delete this announcement?</p>
    <div style="display:flex;gap:14px;justify-content:flex-end;flex-wrap:wrap;">
      <button type="button" class="btn-secondary" onclick="window.openAnnouncementModal('${id}')">CANCEL</button>
      <button type="button" class="btn-primary" onclick="window.confirmDeleteAnnouncement('${id}')"><span>DELETE</span></button>
    </div>
    <p id="announceDeleteError" style="margin-top:14px;color:#ff7b7b;font-size:0.9rem;min-height:20px;"></p>
  `;
}

async function confirmDeleteAnnouncement(id) {
  const errorEl = document.getElementById('announceDeleteError');
  try {
    await deleteDoc(doc(db, 'announcements', id));
    closeModal();
    renderAnnouncements();
    showToast('Announcement deleted.', 'success');
  } catch (error) {
    if (errorEl) errorEl.textContent = 'Error: ' + error.message;
  }
}

function openEditAnnouncementModal(id) {
  const a = ANNOUNCEMENTS.find(x => x.id === id);
  if (!a) return;

  document.getElementById('modalContent').innerHTML = `
    <h2 class="modal-title">Edit Announcement</h2>
    <form id="editAnnouncementForm" onsubmit="window.submitEditAnnouncement(event, '${a.id}')">
      <label style="margin-bottom:14px;">
        Announcement Type
        <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:8px;">
          <button type="button" class="task-type-btn ${a.category === 'update' ? 'selected' : ''}" onclick="window.selectAnnouncementType('update', this)">UPDATE</button>
          <button type="button" class="task-type-btn ${a.category === 'event' ? 'selected' : ''}" onclick="window.selectAnnouncementType('event', this)">EVENT</button>
          <button type="button" class="task-type-btn ${a.category === 'alert' ? 'selected' : ''}" onclick="window.selectAnnouncementType('alert', this)">ALERT</button>
          <button type="button" class="task-type-btn ${a.category === 'recruit' ? 'selected' : ''}" onclick="window.selectAnnouncementType('recruit', this)">RECRUIT</button>
          <button type="button" class="task-type-btn ${a.category === 'decree' ? 'selected' : ''}" onclick="window.selectAnnouncementType('decree', this)">DECREE</button>
        </div>
        <input type="hidden" id="announceCategory" value="${a.category}" required />
      </label>
      <label>
        Title
        <input type="text" id="announceTitle" value="${escapeHTML(a.title)}" required />
      </label>
      <label>
        Body
        <textarea id="announceBody" required>${escapeHTML(a.body)}</textarea>
      </label>
      <label style="margin-top: 14px;">
        Image (Optional)
        <input type="file" id="announceImageFile" accept="image/*" onchange="window.previewImageUpload(this, 'announceImagePreview')" />
        <div style="margin-top:8px; display:flex; gap:10px; align-items:center;">
          <img id="announceImagePreview" class="modal-image-preview" src="${a.imageUrl || ''}" style="${a.imageUrl ? '' : 'display:none;'}" />
          ${a.imageUrl ? `<button type="button" class="btn-secondary" style="padding: 5px 10px; font-size: 0.6rem;" onclick="window.removePreviewImage('announceImagePreview')">REMOVE</button>` : ''}
        </div>
      </label>
      <div style="display:flex;gap:14px;justify-content:flex-end;margin-top:18px;flex-wrap:wrap;">
        <button type="button" class="btn-secondary" onclick="window.openAnnouncementModal('${a.id}')">CANCEL</button>
        <button type="submit" class="btn-primary"><span>SAVE</span></button>
      </div>
      <p id="announceEditError" style="margin-top:14px;color:#ff7b7b;font-size:0.9rem;min-height:20px;"></p>
    </form>
  `;
}

async function submitEditAnnouncement(event, id) {
  event.preventDefault();
  const category = document.getElementById('announceCategory').value;
  const title = document.getElementById('announceTitle').value.trim();
  const body = document.getElementById('announceBody').value.trim();
  const errorEl = document.getElementById('announceEditError');
  const imgPreview = document.getElementById('announceImagePreview');
  const imageUrl = imgPreview && imgPreview.src ? imgPreview.src : '';

  try {
    await updateDoc(doc(db, 'announcements', id), {
      category: category,
      title: title,
      content: body,
      imageUrl: imageUrl
    });
    closeModal();
    renderAnnouncements();
    showToast('Announcement updated.', 'success');
  } catch (error) {
    if (errorEl) errorEl.textContent = 'Error: ' + error.message;
  }
}

// ═════════════════════════════════════=
//  TASKS BOARD LOGIC
// ═════════════════════════════════════=
function setupTasksListener() {
  const q = query(collection(db, 'tasks'), orderBy('createdAt', 'desc'));
  onSnapshot(q, (snapshot) => {
    TASKS = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      const createdAtValue = data.createdAt && typeof data.createdAt.toDate === 'function'
        ? data.createdAt.toDate()
        : (data.createdAt instanceof Date ? data.createdAt : new Date());

      TASKS.push({
        id: doc.id,
        title: data.title || '',
        details: data.details || '',
        category: data.category || 'support',
        author: data.author || 'Unknown',
        authorName: data.authorName || data.author || 'Unknown',
        authorInitials: data.authorInitials || (data.authorName ? data.authorName.split(' ').map(w => w[0]).join('').slice(0, 10) : (data.author ? data.author.split(' ').map(w => w[0]).join('').slice(0, 10) : 'UN')),
        authorPhotoUrl: data.authorPhotoUrl || '',
        imageUrl: data.imageUrl || '',
        preview: (() => {
          const collapsed = collapseNewlines(data.details || '');
          return collapsed.length > 140 ? collapsed.slice(0, 137) + '...' : collapsed;
        })(),
        completed: data.completed === true,
        createdAt: createdAtValue
      });
    });
    renderTasks();
  }, (error) => {
    console.error('Error listening to tasks:', error);
  });
}

function renderTasks() {
  const searchInput = document.getElementById('taskSearch');
  if (!searchInput) return;
  const search = searchInput.value.toLowerCase().trim();

  const results = TASKS.filter(t => {
    let matchFilter = false;
    if (taskFilter === 'all') matchFilter = true;
    else if (taskFilter === 'completed') matchFilter = t.completed === true;
    else if (taskFilter === 'due') matchFilter = t.completed !== true;
    else matchFilter = t.category === taskFilter;

    const matchSearch = !search || t.title.toLowerCase().includes(search) || t.preview.toLowerCase().includes(search) || (t.authorName || '').toLowerCase().includes(search);
    return matchFilter && matchSearch;
  }).sort((a, b) => b.createdAt - a.createdAt);

  const grid = document.getElementById('taskGrid');
  if (!results.length) {
    grid.innerHTML = `<div class="no-results" style="grid-column:1/-1">
      <div class="no-results-icon">🛠️</div>
      <h3>No tasks found</h3><p>Try a different search term or category.</p>
    </div>`;
    return;
  }

  grid.innerHTML = results.map(t => {
    const dueDisplay = t.completed
      ? '<span class="task-due-completed">Completed</span>'
      : '<span class="task-due-pending">Due</span>';
    return `
    <div class="announce-card" onclick="window.openTaskModal('${t.id}')">
      <div class="announce-card-top">
        <span class="announce-tag tag-${t.category}">${t.category.toUpperCase()}</span>
        ${dueDisplay}
      </div>
      <h3 class="announce-title">${t.title}</h3>
      <div class="announce-preview">${parseDiscordFormatting(t.preview)}</div>
      <div class="announce-card-footer" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
        <div style="display:flex; flex-direction:column; gap:6px;">
          <div class="announce-author">
            ${getAuthorDotHTML(t.authorPhotoUrl, t.authorInitials)}
            ${t.authorName || t.author}
          </div>
        </div>
      </div>
    </div>
    `;
  }).join('');
}

function filterTasks() { renderTasks(); }
function setTaskFilter(f, el) {
  taskFilter = f;
  document.querySelectorAll('#taskFilters .chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  renderTasks();
}

function openTaskModal(id) {
  const t = TASKS.find(x => x.id === id);
  if (!t) return;
  const admin = isAdmin();
  const dueDisplay = t.completed
    ? '<span class="task-due-completed">Completed</span>'
    : '<span class="task-due-pending">Due</span>';

  document.getElementById('modalContent').innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:20px;flex-wrap:wrap;">
      <span class="featured-tag tag-${t.category}" style="margin:0;">${t.category.toUpperCase()}</span>
      ${dueDisplay}
    </div>
    <h2 class="modal-title">${t.title}</h2>
    <div class="announce-meta" style="margin:12px 0 24px; display:flex; gap:16px; align-items:center; flex-wrap:wrap;">
      <div style="display:flex; align-items:center; gap:8px;">
        ${getAuthorDotHTML(t.authorPhotoUrl, t.authorInitials, "width:28px;height:28px;border-radius:50%;font-size:.7rem;")}
        <span>Assigned by ${t.authorName || t.author}</span>
      </div>
    </div>
    <div class="modal-divider"></div>
    <div class="modal-text" style="line-height:1.9;">${parseDiscordFormatting(t.details)}</div>
    <div style="display:flex;gap:12px;justify-content:flex-end;margin-top:24px;align-items:center;flex-wrap:wrap;">
      ${t.imageUrl ? `
        <button type="button" class="btn-primary" style="padding: 10px 20px; font-family: 'Orbitron', sans-serif; font-size: 0.65rem; letter-spacing: 0.15em;" onclick="window.openMediaFullModal('${t.imageUrl}', 'image', '${escapeHTML(t.title)}')">VIEW TASK MEDIA</button>
      ` : ''}
      ${admin ? `
        <button type="button" class="btn-primary" style="padding: 10px 20px; font-family: 'Orbitron', sans-serif; font-size: 0.65rem; letter-spacing: 0.15em; background: linear-gradient(135deg, #ff007b, #9d00ff); border: none;" onclick="window.open('https://docs.google.com/spreadsheets/d/1_Ne9NHpq5UxfcFw6B-wL4y042xVD56c9HhVnmPMGXUg/edit?usp=sharing', '_blank')">VIEW COMPLETION PROOFS</button>
        <button type="button" class="btn-secondary" style="padding: 10px 20px; font-family: 'Orbitron', sans-serif; font-size: 0.65rem; letter-spacing: 0.15em;" onclick="window.openEditTaskModal('${t.id}')">EDIT</button>
        <button type="button" class="task-action-btn task-delete-btn" onclick="window.requestDeleteTask('${t.id}')">✕</button>
        ${!t.completed ? `<button type="button" class="task-action-btn task-complete-btn" onclick="window.requestCompleteTask('${t.id}')">✓</button>` : ''}
      ` : ''}
      ${!t.completed ? `
        <button type="button" class="btn-primary" style="padding: 10px 20px; font-family: 'Orbitron', sans-serif; font-size: 0.65rem; letter-spacing: 0.15em;" onclick="window.openSubmitProofModal()">TASK COMPLETED</button>
      ` : ''}
      <button type="button" class="btn-secondary" onclick="window.closeModal()">CLOSE</button>
    </div>
  `;
  openModal();
}

function selectTaskType(type, el) {
  document.getElementById('assignTaskCategory').value = type;
  document.querySelectorAll('.task-type-btn').forEach(b => b.classList.remove('selected'));
  el.classList.add('selected');
}

function openAssignTaskModal() {
  if (!isAdmin()) return;
  const assignedName = CURRENT_USER ? CURRENT_USER.ingameName : '';
  const initialsVal = CURRENT_USER ? (CURRENT_USER.initials || CURRENT_USER.ingameName.split(' ').map(w => w[0]).join('').slice(0, 10)) : '';

  document.getElementById('modalContent').innerHTML = `
    <h2 class="modal-title">Assign New Task</h2>
    <p class="modal-subtitle" style="margin-bottom:18px;">Enter the task details and your in-game name.</p>
    <form id="assignTaskForm" onsubmit="window.submitTaskForm(event)">
      <label style="margin-bottom:14px;">
        Task Type
        <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:8px;">
          <button type="button" class="task-type-btn" data-type="building" onclick="window.selectTaskType('building', this)">BUILDING</button>
          <button type="button" class="task-type-btn" data-type="grinding" onclick="window.selectTaskType('grinding', this)">GRINDING</button>
          <button type="button" class="task-type-btn" data-type="fighting" onclick="window.selectTaskType('fighting', this)">FIGHTING</button>
          <button type="button" class="task-type-btn" data-type="support" onclick="window.selectTaskType('support', this)">SUPPORT</button>
          <button type="button" class="task-type-btn" data-type="defense" onclick="window.selectTaskType('defense', this)">DEFENSE</button>
        </div>
        <input type="hidden" id="assignTaskCategory" required />
      </label>
      <label>
        Task Heading
        <input type="text" id="assignTaskTitle" placeholder="Enter task heading" required />
      </label>
      <label>
        Task Description
        <textarea id="assignTaskDetails" placeholder="Describe the task in detail" required></textarea>
      </label>
      <label>
        Your In-Game Name
        <input type="text" id="assignTaskName" value="${escapeHTML(assignedName)}" required />
      </label>
      <label>
        Initials
        <input type="text" id="assignTaskInitials" value="${escapeHTML(initialsVal)}" maxlength="10" required />
      </label>
      <label style="margin-top: 14px;">
        Attach Image (Optional)
        <input type="file" id="taskImageFile" accept="image/*" onchange="window.previewImageUpload(this, 'taskImagePreview')" />
        <img id="taskImagePreview" class="modal-image-preview" style="display:none;" />
      </label>
      <div style="display:flex;gap:14px;justify-content:flex-end;margin-top:18px;flex-wrap:wrap;">
        <button type="button" class="btn-secondary" onclick="closeModal()">CANCEL</button>
        <button type="submit" class="btn-primary"><span>SUBMIT TASK</span></button>
      </div>
      <p id="taskError" style="margin-top:14px;color:#ff7b7b;font-size:0.9rem;min-height:20px;"></p>
    </form>
  `;
  openModal();
}

async function submitTaskForm(event) {
  event.preventDefault();
  const category = document.getElementById('assignTaskCategory').value;
  const title = document.getElementById('assignTaskTitle').value.trim();
  const details = document.getElementById('assignTaskDetails').value.trim();
  const assignedTo = document.getElementById('assignTaskName').value.trim();
  const initials = document.getElementById('assignTaskInitials').value.trim();
  const errorEl = document.getElementById('taskError');

  if (!category || !title || !details || !assignedTo || !initials) {
    if (errorEl) errorEl.textContent = 'All fields are required. Please select a task type.';
    return;
  }

  try {
    const imgPreview = document.getElementById('taskImagePreview');
    const imageUrl = imgPreview && imgPreview.src ? imgPreview.src : '';
    await addDoc(collection(db, 'tasks'), {
      category: category,
      task: title,
      title: title,
      details: details,
      author: CURRENT_USER ? CURRENT_USER.email : 'unknown@example.com',
      authorName: assignedTo,
      authorInitials: initials,
      authorPhotoUrl: CURRENT_USER ? (CURRENT_USER.photoURL || '') : '',
      completed: false,
      imageUrl: imageUrl,
      createdAt: serverTimestamp()
    });
    closeModal();
    taskFilter = 'all';
    renderTasks();
    showToast('Task assigned.', 'success');
  } catch (error) {
    if (errorEl) errorEl.textContent = 'Error: ' + error.message;
  }
}

function requestDeleteTask(id) {
  document.getElementById('modalContent').innerHTML = `
    <h2 class="modal-title">Confirm Deletion</h2>
    <p class="modal-subtitle" style="margin-bottom:18px;">Are you sure you want to delete this task?</p>
    <div style="display:flex;gap:14px;justify-content:flex-end;flex-wrap:wrap;">
      <button type="button" class="btn-secondary" onclick="window.openTaskModal('${id}')">CANCEL</button>
      <button type="button" class="btn-primary" onclick="window.confirmDeleteTask('${id}')"><span>DELETE</span></button>
    </div>
    <p id="deleteError" style="margin-top:14px;color:#ff7b7b;font-size:0.9rem;min-height:20px;"></p>
  `;
}

async function confirmDeleteTask(id) {
  const errorEl = document.getElementById('deleteError');
  try {
    await deleteDoc(doc(db, 'tasks', id));
    closeModal();
    renderTasks();
    showToast('Task deleted.', 'success');
  } catch (error) {
    if (errorEl) errorEl.textContent = 'Error: ' + error.message;
  }
}

function requestCompleteTask(id) {
  document.getElementById('modalContent').innerHTML = `
    <h2 class="modal-title">Mark as Complete</h2>
    <p class="modal-subtitle" style="margin-bottom:18px;">Are you sure you want to mark this task as complete?</p>
    <div style="display:flex;gap:14px;justify-content:flex-end;flex-wrap:wrap;">
      <button type="button" class="btn-secondary" onclick="window.openTaskModal('${id}')">CANCEL</button>
      <button type="button" class="btn-primary" onclick="window.confirmCompleteTask('${id}')"><span>COMPLETE</span></button>
    </div>
    <p id="completeError" style="margin-top:14px;color:#ff7b7b;font-size:0.9rem;min-height:20px;"></p>
  `;
}

async function confirmCompleteTask(id) {
  const errorEl = document.getElementById('completeError');
  try {
    await updateDoc(doc(db, 'tasks', id), { completed: true });
    closeModal();
    renderTasks();
    showToast('Task completed.', 'success');
  } catch (error) {
    if (errorEl) errorEl.textContent = 'Error: ' + error.message;
  }
}

function openEditTaskModal(id) {
  const t = TASKS.find(x => x.id === id);
  if (!t) return;

  document.getElementById('modalContent').innerHTML = `
    <h2 class="modal-title">Edit Task</h2>
    <form id="editTaskForm" onsubmit="window.submitEditTask(event, '${t.id}')">
      <label style="margin-bottom:14px;">
        Task Type
        <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:8px;">
          <button type="button" class="task-type-btn ${t.category === 'building' ? 'selected' : ''}" data-type="building" onclick="window.selectTaskType('building', this)">BUILDING</button>
          <button type="button" class="task-type-btn ${t.category === 'grinding' ? 'selected' : ''}" data-type="grinding" onclick="window.selectTaskType('grinding', this)">GRINDING</button>
          <button type="button" class="task-type-btn ${t.category === 'fighting' ? 'selected' : ''}" data-type="fighting" onclick="window.selectTaskType('fighting', this)">FIGHTING</button>
          <button type="button" class="task-type-btn ${t.category === 'support' ? 'selected' : ''}" data-type="support" onclick="window.selectTaskType('support', this)">SUPPORT</button>
          <button type="button" class="task-type-btn ${t.category === 'defense' ? 'selected' : ''}" data-type="defense" onclick="window.selectTaskType('defense', this)">DEFENSE</button>
        </div>
        <input type="hidden" id="assignTaskCategory" value="${t.category}" required />
      </label>
      <label>
        Task Heading
        <input type="text" id="assignTaskTitle" value="${escapeHTML(t.title)}" required />
      </label>
      <label>
        Task Description
        <textarea id="assignTaskDetails" required>${escapeHTML(t.details)}</textarea>
      </label>
      <label style="margin-top: 14px;">
        Image (Optional)
        <input type="file" id="taskImageFile" accept="image/*" onchange="window.previewImageUpload(this, 'taskImagePreview')" />
        <div style="margin-top:8px; display:flex; gap:10px; align-items:center;">
          <img id="taskImagePreview" class="modal-image-preview" src="${t.imageUrl || ''}" style="${t.imageUrl ? '' : 'display:none;'}" />
          ${t.imageUrl ? `<button type="button" class="btn-secondary" style="padding: 5px 10px; font-size: 0.6rem;" onclick="window.removePreviewImage('taskImagePreview')">REMOVE</button>` : ''}
        </div>
      </label>
      <div style="display:flex;gap:14px;justify-content:flex-end;margin-top:18px;flex-wrap:wrap;">
        <button type="button" class="btn-secondary" onclick="window.openTaskModal('${t.id}')">CANCEL</button>
        <button type="submit" class="btn-primary"><span>SAVE</span></button>
      </div>
      <p id="taskEditFormError" style="margin-top:14px;color:#ff7b7b;font-size:0.9rem;min-height:20px;"></p>
    </form>
  `;
}

async function submitEditTask(event, id) {
  event.preventDefault();
  const category = document.getElementById('assignTaskCategory').value;
  const title = document.getElementById('assignTaskTitle').value.trim();
  const details = document.getElementById('assignTaskDetails').value.trim();
  const errorEl = document.getElementById('taskEditFormError');
  const imgPreview = document.getElementById('taskImagePreview');
  const imageUrl = imgPreview && imgPreview.src ? imgPreview.src : '';

  try {
    await updateDoc(doc(db, 'tasks', id), {
      category: category,
      title: title,
      details: details,
      imageUrl: imageUrl
    });
    closeModal();
    showToast('Task updated.', 'success');
  } catch (error) {
    if (errorEl) errorEl.textContent = 'Error: ' + error.message;
  }
}

// ═════════════════════════════════════=
//  TASK PROOF REDIRECT
// ═════════════════════════════════════=
// Submit proof → Google Form (for all members)
// View proof   → Google Sheets (for admins, from the task modal button)
function openSubmitProofModal() {
  window.open('https://forms.gle/rWCzM3DgKiE9Hr6t6', '_blank');
}

// ═════════════════════════════════════=
//  TASK PROOFS MODAL
// ═════════════════════════════════════=
async function openTaskProofsListModal(taskId) {
  const t = TASKS.find(x => x.id === taskId);
  if (!t) return;

  document.getElementById('modalContent').innerHTML = `
    <h2 class="modal-title">Completion Proofs</h2>
    <p class="modal-subtitle" style="margin-bottom:18px;">Proofs for: <strong>${escapeHTML(t.title)}</strong></p>
    <div style="max-height: 300px; overflow-y: auto; margin-top: 15px;">
      <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.85rem; color: rgba(255,255,255,0.85);">
        <thead>
          <tr style="border-bottom: 2px solid rgba(255,255,255,0.1); color: var(--cyan); font-family: 'Orbitron', sans-serif; font-size: 0.75rem;">
            <th style="padding: 10px 5px;">Username</th>
            <th style="padding: 10px 5px;">Date and time</th>
            <th style="padding: 10px 5px; text-align: right;">View Proof</th>
          </tr>
        </thead>
        <tbody id="proofsListTableBody">
          <tr>
            <td colspan="3" style="text-align: center; padding: 20px; color: rgba(255,255,255,0.4);">Loading proofs...</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div style="display:flex; justify-content:flex-end; margin-top:20px; gap: 12px;">
      <button class="btn-secondary" onclick="window.openTaskModal('${t.id}')">BACK</button>
      <button class="btn-secondary" onclick="closeModal()">CLOSE</button>
    </div>
  `;
  openModal();

  try {
    const [snapshot, usersSnapshot] = await Promise.all([
      getDocs(query(collection(db, 'logs'), where('taskTitle', '==', t.title))),
      getDocs(collection(db, 'users'))
    ]);

    const userMap = {};
    usersSnapshot.forEach(uDoc => {
      const uData = uDoc.data();
      if (uData.email) userMap[uData.email.toLowerCase().trim()] = uData.ingameName || uData.name;
    });

    const tbody = document.getElementById('proofsListTableBody');
    if (snapshot.empty) {
      tbody.innerHTML = `<tr><td colspan="3" style="text-align: center; padding: 20px; color: rgba(255,255,255,0.4);">No proofs found.</td></tr>`;
      return;
    }

    const docs = [];
    snapshot.forEach(doc => docs.push({ id: doc.id, ...doc.data() }));
    docs.sort((a, b) => {
      const aTime = a.submittedAt && typeof a.submittedAt.toDate === 'function' ? a.submittedAt.toDate() : new Date(0);
      const bTime = b.submittedAt && typeof b.submittedAt.toDate === 'function' ? b.submittedAt.toDate() : new Date(0);
      return bTime - aTime;
    });

    tbody.innerHTML = docs.map(docData => {
      const submittedAt = docData.submittedAt && typeof docData.submittedAt.toDate === 'function' ? docData.submittedAt.toDate() : new Date();
      const dateStr = submittedAt.toLocaleDateString() + ' ' + submittedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const emailKey = (docData.email || '').toLowerCase().trim();
      const displayName = userMap[emailKey] || docData.username || 'Member';

      return `
        <tr style="border-bottom: 1px solid rgba(255,255,255,0.05); font-family: 'Rajdhani', sans-serif;">
          <td style="padding: 12px 5px; color: #fff;">${escapeHTML(displayName)}</td>
          <td style="padding: 12px 5px; color: rgba(255,255,255,0.6);">${dateStr}</td>
          <td style="padding: 12px 5px; text-align: right;">
            <button type="button" class="btn-primary" style="padding: 6px 12px; font-size: 0.6rem;" onclick="window.openSingleProofDetailModal('${docData.id}', '${taskId}')">View Proof</button>
          </td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    console.error(err);
    const tbody = document.getElementById('proofsListTableBody');
    if (tbody) tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; padding:20px; color:#ff7b7b;">Failed to load.</td></tr>`;
  }
}

async function openSingleProofDetailModal(proofId, taskId) {
  document.getElementById('modalContent').innerHTML = `
    <h2 class="modal-title">Loading Proof...</h2>
    <div style="display:flex; justify-content:flex-end; margin-top:20px;">
      <button class="btn-secondary" onclick="window.openTaskProofsListModal('${taskId}')">BACK</button>
    </div>
  `;
  openModal();

  try {
    const docSnap = await getDoc(doc(db, 'logs', proofId));
    if (docSnap.exists()) {
      const data = docSnap.data();
      let displayName = data.username || 'Member';
      if (data.email) {
        const uSnap = await getDocs(query(collection(db, 'users'), where('email', '==', data.email), limit(1)));
        if (!uSnap.empty) {
          displayName = uSnap.docs[0].data().ingameName || uSnap.docs[0].data().name || displayName;
        }
      }

      const proofFile = data.proofFile || data.media;
      const mediaHTML = data.fileType === 'video'
        ? `<video src="${proofFile}" controls style="width:100%; max-height:55vh; border-radius:8px; border:1px solid rgba(255,255,255,0.1); margin-top:15px;"></video>`
        : `<img src="${proofFile}" style="width:100%; max-height:55vh; object-fit:contain; border-radius:8px; border:1px solid rgba(255,255,255,0.1); margin-top:15px;" />`;

      document.getElementById('modalContent').innerHTML = `
        <h2 class="modal-title">Proof by ${escapeHTML(displayName)}</h2>
        ${mediaHTML}
        ${data.message ? `
          <div style="margin-top: 15px; padding: 12px; background: rgba(255,255,255,0.05); border-radius: 6px; font-size: 0.9rem; color: rgba(255,255,255,0.8);">
            <strong style="color: var(--cyan); font-family: 'Orbitron'; font-size: 0.75rem; display: block; margin-bottom: 4px;">NOTE:</strong>
            ${parseDiscordFormatting(data.message)}
          </div>
        ` : ''}
        <div style="display:flex; justify-content:flex-end; margin-top:20px; gap: 12px;">
          <button class="btn-secondary" onclick="window.openTaskProofsListModal('${taskId}')">BACK</button>
          <button class="btn-secondary" onclick="closeModal()">CLOSE</button>
        </div>
      `;
    }
  } catch (err) {
    console.error(err);
    document.getElementById('modalContent').innerHTML = `<h2>Error</h2><p>${err.message}</p>`;
  }
}

// ═════════════════════════════════════=
//  MEMORIES SECTION LOGIC
// ═════════════════════════════════════=
function setupMemoriesListener() {
  if (unsubscribeMemories) unsubscribeMemories();
  const q = query(collection(db, 'memories'), orderBy('createdAt', 'desc'));
  unsubscribeMemories = onSnapshot(q, (snapshot) => {
    ALL_MEMORIES = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      const createdAtValue = data.createdAt && typeof data.createdAt.toDate === 'function'
        ? data.createdAt.toDate()
        : (data.createdAt instanceof Date ? data.createdAt : new Date());
      ALL_MEMORIES.push({
        id: doc.id,
        name: data.name || 'Untitled',
        imageUrl: data.imageUrl || '',
        description: data.description || '',
        uploadedBy: data.uploadedBy || 'Member',
        createdAt: createdAtValue
      });
    });
    renderMemoriesGrid();
  }, (error) => {
    console.error(error);
  });
}

function renderMemoriesGrid() {
  const grid = document.getElementById('memoriesGrid');
  if (!grid) return;
  const searchInput = document.getElementById('memorySearch');
  const search = searchInput ? searchInput.value.toLowerCase().trim() : '';
  const filtered = ALL_MEMORIES.filter(m => m.name.toLowerCase().includes(search));

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="no-results" style="grid-column: 1 / -1;">
        <div class="no-results-icon">🖼️</div>
        <h3>No images found</h3>
        <p>Search by a different name or upload a memory!</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered.map(m => `
    <div class="memory-card" onclick="window.openImageFullModal('${m.id}', '${m.imageUrl}', '${escapeHTML(m.name)}')">
      <div class="memory-img-container">
        <img src="${m.imageUrl}" class="memory-img" alt="${escapeHTML(m.name)}" loading="lazy" />
      </div>
      <div class="memory-info">
        <h4 class="memory-title">${escapeHTML(m.name)}</h4>
        <div class="memory-meta">
          <span>By ${escapeHTML(m.uploadedBy)}</span>
          <span>${m.createdAt.toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  `).join('');
}

function filterMemories() { renderMemoriesGrid(); }

function openImageFullModal(id, url, title) {
  const m = ALL_MEMORIES.find(x => x.id === id);
  const desc = m && m.description ? m.description : '';

  const deleteBtn = isAdmin()
    ? `<button type="button" class="btn-primary" style="padding: 10px 20px; font-family: 'Orbitron'; font-size: 0.65rem; background: linear-gradient(135deg, var(--crimson-deep), var(--crimson)); border: none; margin-right: auto;" onclick="window.requestDeleteMemory('${id}', '${url}', '${escapeHTML(title)}')">DELETE</button>`
    : '';

  document.getElementById('modalContent').innerHTML = `
    <h2 class="modal-title">${escapeHTML(title)}</h2>
    <img src="${url}" style="width:100%; max-height:75vh; object-fit:contain; border-radius:8px; border:1px solid rgba(255,255,255,0.1); margin-top:15px;" />
    ${desc ? `<div style="margin-top:15px; padding:12px; background:rgba(255,255,255,0.05); border-radius:6px; font-size:0.9rem; line-height:1.5; text-align:left;"><strong style="color:var(--cyan); font-family:'Orbitron'; font-size:0.75rem; display:block; margin-bottom:4px;">DESCRIPTION:</strong>${parseDiscordFormatting(desc)}</div>` : ''}
    <div style="display:flex; justify-content:flex-end; margin-top:20px; gap: 12px; align-items: center; width: 100%;">
      ${deleteBtn}
      <button class="btn-secondary" onclick="closeModal()">CLOSE</button>
    </div>
  `;
  openModal();
}

function requestDeleteMemory(id, url, title) {
  document.getElementById('modalContent').innerHTML = `
    <h2 class="modal-title">Confirm Delete</h2>
    <p class="modal-subtitle">Delete this memory?</p>
    <div style="display:flex; gap:14px; justify-content:flex-end;">
      <button class="btn-secondary" onclick="window.openImageFullModal('${id}', '${url}', '${escapeHTML(title)}')">CANCEL</button>
      <button class="btn-primary" onclick="window.confirmDeleteMemory('${id}')"><span>DELETE</span></button>
    </div>
    <p id="memoryDeleteError" style="margin-top:14px;color:#ff7b7b;"></p>
  `;
}

async function confirmDeleteMemory(id) {
  const errorEl = document.getElementById('memoryDeleteError');
  try {
    await deleteDoc(doc(db, 'memories', id));
    closeModal();
    showToast('Memory deleted.', 'success');
  } catch (error) {
    if (errorEl) errorEl.textContent = 'Error: ' + error.message;
  }
}

function openUploadImageModal() {
  if (!CURRENT_USER) return;
  document.getElementById('modalContent').innerHTML = `
    <h2 class="modal-title">Upload Memory Image</h2>
    <p class="modal-subtitle">Share an image memory with the clan.</p>
    <form id="uploadMemoryForm" onsubmit="window.submitUploadMemory(event)">
      <label>
        Image Title / Name
        <input type="text" id="memoryTitleInput" placeholder="Enter memory name" required />
      </label>
      <label style="margin-top:14px;">
        Description (Optional)
        <textarea id="memoryDescriptionInput" placeholder="Describe this memory..." style="min-height:80px;"></textarea>
      </label>
      <label style="margin-top:14px;">
        Choose Image (Max size 10MB)
        <input type="file" id="memoryFileInput" accept="image/*" onchange="window.previewImageUpload(this, 'memoryUploadPreview')" required />
        <img id="memoryUploadPreview" class="modal-image-preview" style="display:none;" />
      </label>
      <div style="display:flex; gap:14px; justify-content:flex-end; margin-top:24px;">
        <button type="button" class="btn-secondary" onclick="closeModal()">CANCEL</button>
        <button type="submit" class="btn-primary"><span>UPLOAD</span></button>
      </div>
      <p id="memoryUploadError" style="margin-top:14px; color:#ff7b7b;"></p>
    </form>
  `;
  openModal();
}

async function submitUploadMemory(event) {
  event.preventDefault();
  const title = document.getElementById('memoryTitleInput').value.trim();
  const description = document.getElementById('memoryDescriptionInput').value.trim();
  const previewEl = document.getElementById('memoryUploadPreview');
  const errorEl = document.getElementById('memoryUploadError');

  if (!title || !previewEl.src) {
    if (errorEl) errorEl.textContent = 'Please choose a title and image.';
    return;
  }

  try {
    if (errorEl) errorEl.textContent = 'Uploading...';
    await addDoc(collection(db, 'memories'), {
      name: title,
      imageUrl: previewEl.src,
      description: description,
      uploadedBy: CURRENT_USER.ingameName || CURRENT_USER.name,
      createdAt: serverTimestamp()
    });
    closeModal();
    showToast('Memory uploaded successfully.', 'success');
  } catch (err) {
    if (errorEl) errorEl.textContent = 'Upload failed: ' + err.message;
  }
}

// ═════════════════════════════════════=
//  TACTICAL/CENTRAL MISCELLANEOUS MODALS
// ═════════════════════════════════════=
function openWallOfHonorModal() {
  document.getElementById('modalContent').innerHTML = `
    <h2 class="modal-title">Wall of Honor</h2>
    <p class="modal-subtitle">Dedicated to the supreme vanguards of DNMX.</p>
    <img src="assets/WOH.png" class="woh-img" alt="Wall Of Honor" onerror="this.src='https://placehold.co/600x400?text=WOH.png+Not+Found'" />
    <div style="display:flex; justify-content:flex-end; margin-top:20px;">
      <button class="btn-secondary" onclick="closeModal()">CLOSE</button>
    </div>
  `;
  openModal();
}

function openPWsModal() {
  const warps = [
    { cmd: '/pw DnmxHQ', desc: 'Main Headquarters & clan hub.' },
    { cmd: '/pw DnmxMall', desc: 'Clan resources, tools, and armor shop.' },
    { cmd: '/pw DnmxBlaze', desc: 'High efficiency XP grinder and blaze spawners.' },
    { cmd: '/pw DnmxCow', desc: 'High Speed Cow Farm.' },
    { cmd: '/pw DnmxEme', desc: 'High speed emerald farm.' },
    { cmd: '/pw DnmxHomes', desc: 'Apartment style bases for members.' }
  ];

  let listHtml = warps.map(w => `
    <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.07); padding:12px; margin-bottom:10px; border-radius:6px; flex-wrap:wrap; gap:10px;">
      <div>
        <span style="font-family:'Courier New',monospace; color:#00bfff; font-weight:bold; font-size:0.95rem;">${w.cmd}</span>
        <p style="margin:4px 0 0 0; color:rgba(255,255,255,0.6); font-size:0.75rem; font-family:'Orbitron',sans-serif;">${w.desc}</p>
      </div>
      <button class="btn-secondary" style="padding:6px 12px; font-size:0.6rem;" onclick="window.copyPWCmd('${w.cmd}', this)">COPY</button>
    </div>
  `).join('');

  document.getElementById('modalContent').innerHTML = `
    <h2 class="modal-title">Dnmx Playerwarps</h2>
    <p class="modal-subtitle" style="margin-bottom:20px;">Warp commands for clan landmarks.</p>
    <div style="max-height:55vh; overflow-y:auto;">
      ${listHtml}
    </div>
    <div style="display:flex; justify-content:flex-end; margin-top:20px;">
      <button class="btn-secondary" onclick="closeModal()">CLOSE</button>
    </div>
  `;
  openModal();
}

function copyPWCmd(cmd, btn) {
  navigator.clipboard.writeText(cmd).then(() => {
    const originalText = btn.textContent;
    btn.textContent = 'COPIED!';
    btn.style.color = '#39ff14';
    btn.style.borderColor = '#39ff14';
    setTimeout(() => {
      btn.textContent = originalText;
      btn.style.color = '';
      btn.style.borderColor = '';
    }, 1500);
  }).catch(err => {
    console.error("Clipboard copy failed", err);
  });
}

function openMediaFullModal(url, mediaType, title, message = '') {
  let mediaHTML = mediaType === 'video'
    ? `<video src="${url}" controls style="width:100%; max-height:75vh; border-radius:8px; border:1px solid rgba(255,255,255,0.1); margin-top:15px;"></video>`
    : `<img src="${url}" style="width:100%; max-height:75vh; object-fit:contain; border-radius:8px; border:1px solid rgba(255,255,255,0.1); margin-top:15px;" />`;

  document.getElementById('modalContent').innerHTML = `
    <h2 class="modal-title">${escapeHTML(title)}</h2>
    ${mediaHTML}
    ${message ? `<div style="margin-top: 15px; padding: 12px; background: rgba(255,255,255,0.05); border-radius: 6px; font-size: 0.9rem; text-align: left;"><strong style="color: var(--cyan); font-family: 'Orbitron'; font-size: 0.75rem; display: block; margin-bottom: 4px;">NOTE:</strong>${parseDiscordFormatting(message)}</div>` : ''}
    <div style="display:flex; justify-content:flex-end; margin-top:20px;">
      <button class="btn-secondary" onclick="closeModal()">CLOSE</button>
    </div>
  `;
  openModal();
}

// ═════════════════════════════════════=
//  EXPOSE MODULE BINDINGS TO WINDOW
// ═════════════════════════════════════=
window.navigate = navigate;
window.toggleMobile = toggleMobile;
window.closeMobile = closeMobile;

window.toggleChatPanel = toggleChatPanel;
window.closeChatPanel = closeChatPanel;
window.goBackToUserList = goBackToUserList;
window.sendChatMessage = sendChatMessage;
window.handleTypingInput = handleTypingInput;
window.removeChatMedia = removeChatMedia;
window.openChatWithUser = openChatWithUser;
window.openImageFullModal = openImageFullModal;
window.openMediaFullModal = openMediaFullModal;

window.openLoginModal = openLoginModal;
window.signInWithGoogle = signInWithGoogle;
window.signOutUser = signOutUser;
window.confirmSignOut = confirmSignOut;

window.promptProfileSetupModal = promptProfileSetupModal;
window.submitProfileSetup = submitProfileSetup;
window.previewProfileSetupPhoto = previewProfileSetupPhoto;
window.updateProfileSetupInitialsPreview = updateProfileSetupInitialsPreview;
window.updateBioCounter = updateBioCounter;

window.filterRanks = filterRanks;
window.setRankFilter = setRankFilter;
window.openRankModal = openRankModal;
window.switchTab = switchTab;
window.filterMembers = filterMembers;
window.openMemberModal = openMemberModal;

window.filterTasks = filterTasks;
window.setTaskFilter = setTaskFilter;
window.openAssignTaskModal = openAssignTaskModal;
window.selectTaskType = selectTaskType;
window.submitTaskForm = submitTaskForm;
window.openTaskModal = openTaskModal;
window.requestDeleteTask = requestDeleteTask;
window.confirmDeleteTask = confirmDeleteTask;
window.requestCompleteTask = requestCompleteTask;
window.confirmCompleteTask = confirmCompleteTask;
window.openEditTaskModal = openEditTaskModal;
window.submitEditTask = submitEditTask;

window.openSubmitProofModal = openSubmitProofModal;
window.openTaskProofsListModal = openTaskProofsListModal;
window.openSingleProofDetailModal = openSingleProofDetailModal;

window.filterAnnouncements = filterAnnouncements;
window.setAnnounceFilter = setAnnounceFilter;
window.openAnnouncementModal = openAnnouncementModal;
window.selectAnnouncementType = selectAnnouncementType;
window.openNewAnnouncementModal = openNewAnnouncementModal;
window.submitAnnouncementForm = submitAnnouncementForm;
window.requestDeleteAnnouncement = requestDeleteAnnouncement;
window.confirmDeleteAnnouncement = confirmDeleteAnnouncement;
window.openEditAnnouncementModal = openEditAnnouncementModal;
window.submitEditAnnouncement = submitEditAnnouncement;
window.goPage = goPage;

window.filterMemories = filterMemories;
window.openUploadImageModal = openUploadImageModal;
window.submitUploadMemory = submitUploadMemory;
window.requestDeleteMemory = requestDeleteMemory;
window.confirmDeleteMemory = confirmDeleteMemory;
window.previewImageUpload = previewImageUpload;
window.removePreviewImage = removePreviewImage;

window.openWallOfHonorModal = openWallOfHonorModal;
window.openPWsModal = openPWsModal;
window.copyPWCmd = copyPWCmd;

window.closeModal = closeModal;
window.closeModalOnOverlay = closeModalOnOverlay;
window.showToast = showToast;

// ═════════════════════════════════════=
//  PAGE INITIALIZATION
// ═════════════════════════════════════=
window.addEventListener('load', () => {
  const activeSection = document.querySelector('section.page.active');
  if (activeSection) {
    const activePageId = activeSection.id.replace('-page', '');
    currentPage = activePageId;
    document.querySelectorAll('.nav-link, .mobile-nav-link').forEach(a => {
      a.classList.toggle('active', a.dataset.page === activePageId);
    });
  }

  // Load appropriate components for active page elements
  if (document.getElementById('rankGrid')) renderRanks();
  if (document.getElementById('execGrid') || document.getElementById('mgmtGrid')) {
    renderMembers('exec');
    renderMembers('mgmt');
  }

  setupAnnouncementsListener();
  setupTasksListener();
  if (document.getElementById('memoriesGrid')) setupMemoriesListener();

  setTimeout(() => {
    isTimerFinished = true;
    tryHideLoader();
    spawnParticles();
    animateCounters();
    setupDragAndDropListeners();
  }, 2000);

  // Fallback loader cover removal
  setTimeout(() => {
    isAuthInitialized = true;
    tryHideLoader();
  }, 5000);
});