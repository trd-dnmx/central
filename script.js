// ═════════════════════════════════════=
//  FIREBASE IMPORTS & CONFIG
// ═════════════════════════════════════=
import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.14.0/firebase-app.js';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js';
import { getFirestore, collection, addDoc, onSnapshot, deleteDoc, updateDoc, doc, serverTimestamp, query, orderBy, getDoc, getDocs, setDoc, where, limit, or } from 'https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js';

// FIREBASE: Initialize Firebase with your config
const firebaseConfig = {
  apiKey: "AIzaSyBULCM4XITTUrxhyKrLH1fHwSWGzdBt2xw",
  authDomain: "trd-dnmx-web.firebaseapp.com",
  projectId: "trd-dnmx-web",
  storageBucket: "trd-dnmx-web.firebasestorage.app",
  messagingSenderId: "743367336796",
  appId: "1:743367336796:web:302083b8a34c050c75d799",
  measurementId: "G-QP3S2P403F"
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
  "tk.dnmx@gmail.com",
  "chickendajaja@gmail.com",
];

function isAdmin() {
  return CURRENT_USER && ADMIN_EMAILS.includes(CURRENT_USER.email.trim().toLowerCase());
}

// ═════════════════════════════════════=
//  AUTH / DATA
// ═════════════════════════════════════=

let CURRENT_USER = null;
let ANNOUNCEMENTS = [];
let TASKS = [];
let isAuthInitialized = false;
let isTimerFinished = false;

function tryHideLoader() {
  if (isAuthInitialized && isTimerFinished) {
    const loader = document.getElementById('loader');
    if (loader) loader.classList.add('hide');
  }
}

// ═════════════════════════════════════=
//  MEMBER CHAT SYSTEM VARIABLES
// ═════════════════════════════════════=
let ALL_USERS = [];
let MESSAGES = [];
let ACTIVE_CHAT_USER = null;
let unsubscribeUsers = null;
let unsubscribeMessages = null;
let unsubscribeAllUserMessages = null;
let LAST_MESSAGE_MAP = {};
let unsubscribeTypingState = null;
let typingTimeout = null;
let isCurrentlyTyping = false;
let CHAT_SELECTED_MEDIA_BASE64 = '';

// FIREBASE: Listen for auth state changes
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
        CURRENT_USER.photoURL = userData.photoURL || user.photoURL || CURRENT_USER.photoURL || '';
        CURRENT_USER.initials = userData.initials || '';
        CURRENT_USER.bio = userData.bio || '';
        CURRENT_USER.nickname = userData.nickname || '';
        CURRENT_USER.speciality = userData.speciality || '';
        CURRENT_USER.favoriteGamemode = userData.favoriteGamemode || '';

        if (!userData.ingameName || !userData.initials || !userData.photoURL) {
          needsSetup = true;
        }

        // Update active heartbeat
        await updateDoc(userDocRef, {
          lastActive: serverTimestamp(),
          photoURL: CURRENT_USER.photoURL,
          initials: CURRENT_USER.initials
        });
      } else {
        needsSetup = true;
        // Register user profile
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
          lastActive: serverTimestamp()
        });
      }

      if (needsSetup) {
        setTimeout(() => {
          promptProfileSetupModal();
        }, 500);
      }
    } catch (err) {
      console.error("Error syncing user profile:", err);
    }

    // Initialize users buddy list listener
    setupUsersListener();
    setupAllUserMessagesListener();
  } else {
    stopChatting();
    CURRENT_USER = null;
    if (unsubscribeUsers) {
      unsubscribeUsers();
      unsubscribeUsers = null;
    }
    if (unsubscribeMessages) {
      unsubscribeMessages();
      unsubscribeMessages = null;
    }
    if (unsubscribeAllUserMessages) {
      unsubscribeAllUserMessages();
      unsubscribeAllUserMessages = null;
    }
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
          </div>
        `;

    if (mobileArea) {
      mobileArea.innerHTML = `
            <button class="btn-secondary" onclick="window.toggleChatPanel(); window.closeMobile();" style="width: 100%;">CHAT</button>
            <button class="btn-secondary" onclick="window.promptProfileSetupModal(); window.closeMobile();" style="width: 100%;">PROFILE</button>
            <button class="btn-secondary" onclick="window.signOutUser(); window.closeMobile();" style="width: 100%;">LOG OUT</button>
          `;
    }

    if (chatToggle) chatToggle.style.display = '';
    if (uploadImageTrigger) uploadImageTrigger.style.display = '';
  } else {
    area.innerHTML = `<button class="btn-secondary" id="authButton" onclick="window.openLoginModal()">LOG IN</button>`;
    if (mobileArea) {
      mobileArea.innerHTML = `
            <button class="btn-secondary" onclick="window.openLoginModal(); window.closeMobile();" style="width: 100%;">LOG IN</button>
          `;
    }
    if (chatToggle) chatToggle.style.display = 'none';
    if (uploadImageTrigger) uploadImageTrigger.style.display = 'none';
    closeChatPanel();
  }
}

// FIREBASE: Sign in with Google
function openLoginModal() {
  document.getElementById('modalContent').innerHTML = `
    <h2 class="modal-title">Sign in with Google</h2>
    <p class="modal-subtitle">Sign in via Google to access admin features.</p>
    <div id="gsiStatus" style="margin-top:12px;color:rgba(255,255,255,0.7)"></div>
    <div style="display:flex;gap:14px;justify-content:flex-end;margin-top:18px;flex-wrap:wrap;">
      <button type="button" class="btn-secondary" onclick="closeModal()">CANCEL</button>
      <button type="button" class="btn-primary" onclick="window.signInWithGoogle()"><span>SIGN IN WITH GOOGLE</span></button>
    </div>
  `;
  openModal();
}

// FIREBASE: Sign in with Google usinfunction promptProfileSetupModal() {
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
  if (counter) {
    counter.textContent = `${textarea.value.length}/300`;
  }
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
  } catch (err) {
    console.error("Error saving profile setup:", err);
    if (errEl) errEl.textContent = 'Failed to save: ' + err.message;
  }
}
// FIREBASE: Update visibility of creation buttons based on admin status
function updateCreationButtonsVisibility() {
  const announceBtn = document.querySelector('button[onclick="openNewAnnouncementModal()"]');
  const taskBtn = document.querySelector('button[onclick="openAssignTaskModal()"]');
  const adminTriggers = [announceBtn, taskBtn];
  const visible = isAdmin();

  adminTriggers.forEach((el) => {
    if (!el) return;
    el.style.display = visible ? '' : 'none';
    el.disabled = !visible;
    el.style.opacity = visible ? '1' : '0.5';
    el.title = visible ? '' : 'Admin only';
  });
}

// ═════════════════════════════════════=
//  MEMBER CHAT SYSTEM JS LOGIC
// ═════════════════════════════════════=

// Toggle chat panel drawer
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

// Close chat panel drawer
function closeChatPanel() {
  stopChatting();
  const panel = document.getElementById('chatPanel');
  if (panel) {
    panel.classList.remove('open');
  }
}

// Go back from messaging view to online user buddy list
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

// Real-time listener for the registered user list
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

    // Keep header user status updated if a chat is active
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

    if (aTime > 0 && bTime > 0) {
      return bTime - aTime; // both have messages, sort descending by time
    }
    if (aTime > 0 && bTime === 0) {
      return -1; // a has message, b doesn't -> a comes first
    }
    if (aTime === 0 && bTime > 0) {
      return 1; // b has message, a doesn't -> b comes first
    }
    // neither has messages, sort alphabetically
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
  if (!isCurrentlyTyping) {
    updateMyTypingState(true);
  }

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
  if (isCurrentlyTyping) {
    updateMyTypingState(false);
  }
  if (unsubscribeTypingState) {
    unsubscribeTypingState();
    unsubscribeTypingState = null;
  }
  const indicatorEl = document.getElementById('chatTypingIndicator');
  if (indicatorEl) indicatorEl.style.display = 'none';

  const emojiPicker = document.getElementById('chatEmojiPicker');
  if (emojiPicker) emojiPicker.style.display = 'none';

  const gifPicker = document.getElementById('chatGifPicker');
  if (gifPicker) gifPicker.style.display = 'none';

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
    }).catch(err => console.error("Error loading dropped/pasted chat media:", err));
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

  // Drag and Drop events
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

  // Clipboard Paste event
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

// Online state threshold (5 minutes active)
function isUserOnline(user) {
  if (!user.lastActive) return false;
  const now = new Date();
  const diffMs = now - user.lastActive;
  const diffMins = diffMs / 1000 / 60;
  return diffMins < 5;
}

// Render online buddy list DOM
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

// Set up active room container with a specific user
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

// Listen to Firestore updates for a specific 1-to-1 conversation
function setupMessagesListener() {
  if (unsubscribeMessages) unsubscribeMessages();
  if (!CURRENT_USER || !ACTIVE_CHAT_USER) return;

  const uids = [CURRENT_USER.uid, ACTIVE_CHAT_USER.uid].sort();
  const chatId = uids.join('_');

  const q = query(
    collection(db, 'messages'),
    where('chatId', '==', chatId)
  );

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
        createdAt: createdAtValue
      });
    });

    MESSAGES.sort((a, b) => a.createdAt - b.createdAt);
    renderChatMessages();
  }, (error) => {
    console.error('Error listening to messages:', error);
  });
}

// Render message bubbles DOM
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

// Save message to Firestore database
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
  if (isCurrentlyTyping) {
    updateMyTypingState(false);
  }

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

// Escape helper to avoid XSS injections
function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g,
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
}

// Helper to collapse newlines and consecutive whitespace into a single space for previews
function collapseNewlines(str) {
  if (!str) return '';
  return str.replace(/\s+/g, ' ').trim();
}

// Resize, compress, and output base64 data URL for images (guarantees fitting in Firestore's 1MB limit)
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

function previewImageUpload(inputEl, previewImgId) {
  const file = inputEl.files[0];
  const form = inputEl.closest('form');
  const errorEl = form ? (form.querySelector('[id*="Error"]') || form.querySelector('[id*="error"]')) : null;
  if (errorEl) errorEl.textContent = '';

  if (file) {
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      if (errorEl) errorEl.textContent = 'Image file size exceeds the 10MB limit. Please choose a smaller image.';
      inputEl.value = ''; // clear input
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

// Parse Discord markdown formatting (Bold, Italics, Underline, Strikethrough, Code blocks, Blockquotes, Spoilers)
function parseDiscordFormatting(text) {
  if (!text) return '';

  // 1. First escape HTML to prevent XSS
  let html = escapeHTML(text);

  const codeBlocks = [];

  // 2. Temporarily extract multi-line code blocks
  html = html.replace(/```(?:[a-zA-Z0-9+#-]+)?\n?([^]+?)```/g, (match, code) => {
    const placeholder = `CODEBLOCKPLACEHOLDERMULTILINE${codeBlocks.length}XYZ`;
    codeBlocks.push({
      placeholder: placeholder,
      html: `<pre class="discord-code-block"><code>${code}</code></pre>`
    });
    return placeholder;
  });

  // 3. Temporarily extract single-line code blocks
  html = html.replace(/`([^`\n]+?)`/g, (match, code) => {
    const placeholder = `CODEBLOCKPLACEHOLDERINLINE${codeBlocks.length}XYZ`;
    codeBlocks.push({
      placeholder: placeholder,
      html: `<code class="discord-inline-code">${code}</code>`
    });
    return placeholder;
  });

  // 4. Multi-line Blockquotes: >>> content
  if (html.startsWith('&gt;&gt;&gt; ')) {
    const content = html.slice(13);
    html = `<blockquote class="discord-blockquote">${content.replace(/\n/g, '<br>')}</blockquote>`;
  } else {
    html = html.replace(/(?:^|\n)&gt;&gt;&gt;\s+([^]+)$/g, (match, content) => {
      return `<blockquote class="discord-blockquote">${content.replace(/\n/g, '<br>')}</blockquote>`;
    });
  }

  // 5. Single-line Blockquotes: > content
  html = html.split('\n').map(line => {
    if (line.startsWith('&gt; ')) {
      return `<blockquote class="discord-blockquote">${line.slice(5)}</blockquote>`;
    }
    return line;
  }).join('\n');

  // 6. Spoilers: ||content||
  html = html.replace(/\|\|([^|]+?)\|\|/g, '<span class="discord-spoiler" onclick="this.classList.toggle(\'revealed\')">$1</span>');

  // 7. Bold + Italics: **_content_** or __**content**__ etc.
  html = html.replace(/\*\*_(.+?)_\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/_\*\*(.+?)\*\*_/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');

  // 8. Bold: **content**
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

  // 9. Underline: __content__
  html = html.replace(/__(.+?)__/g, '<u>$1</u>');

  // 10. Italics: *content* or _content_
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  html = html.replace(/_(.+?)_/g, '<em>$1</em>');

  // 11. Strikethrough: ~~content~~
  html = html.replace(/~~(.+?)~~/g, '<del>$1</del>');

  // 12. Convert newlines to <br> outside of placeholders
  html = html.split('\n').join('<br>');

  // 13. Restore code blocks from placeholders
  for (const block of codeBlocks) {
    html = html.replace(block.placeholder, block.html);
  }

  return html;
}

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
    if (!user) {
      user = { ingameName: 'DrGlass09', name: 'DrGlass09', initials: 'DG' };
    }
    user.photoURL = 'assets/glasspfp.png';
  } else if (lowerName === 'tntplayertnt') {
    if (!user) {
      user = { ingameName: 'TNTplayerTNT', name: 'TNTplayerTNT', initials: 'TNT' };
    }
    user.photoURL = 'assets/tntpfp.png';
  } else if (lowerName === 'crazycode1_') {
    if (!user) {
      user = { ingameName: 'CrazyCode1_', name: 'CrazyCode1_', initials: 'CC' };
    }
    user.photoURL = 'assets/crazypfp.png';
  } else if (lowerName === 'cyberelite') {
    if (!user) {
      user = { ingameName: 'CyberElite', name: 'CyberElite', initials: 'CE' };
    }
    user.photoURL = 'assets/cyberpfp.png';
  } else if (lowerName === 'thekiller87') {
    if (!user) {
      user = { ingameName: 'TheKiller87', name: 'TheKiller87', initials: 'TK' };
    }
    user.photoURL = 'assets/tkpfp.png';
  } else if (lowerName === 'grim_nightmare') {
    if (!user) {
      user = { ingameName: 'Grim_Nightmare', name: 'Grim_Nightmare', initials: 'GN' };
    }
    user.photoURL = 'assets/grimpfp.png';
  }
  return user;
}

// ═════════════════════════════════════=
//  FIRESTORE ANNOUNCEMENTS
// ═════════════════════════════════════=

function getAuthorDotHTML(photoUrl, initials, sizeStyle = '') {
  const inlineStyle = sizeStyle ? ` style="${sizeStyle}"` : '';
  const imgInlineStyle = sizeStyle ? ` style="${sizeStyle} border-radius:50%; object-fit:cover;"` : ' style="width:100%; height:100%; border-radius:50%; object-fit:cover;"';
  if (photoUrl) {
    const parentStyle = sizeStyle
      ? ` style="${sizeStyle} background:none !important; display:flex; align-items:center; justify-content:center; border:none;"`
      : ' style="background:none !important; border:none;"';
    return `<div class="author-dot"${parentStyle}><img src="${escapeHTML(photoUrl)}"${imgInlineStyle} onerror="this.style.display='none'; this.parentElement.style.background=''; this.parentElement.innerHTML='${escapeHTML(initials)}';" /></div>`;
  }

  let dynamicStyle = inlineStyle;
  if (initials && initials.length > 3) {
    const factor = Math.max(0.35, 0.7 - (initials.length - 3) * 0.05);
    const fontSizeStr = `font-size: ${factor}rem !important; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; padding: 2px;`;
    dynamicStyle = sizeStyle
      ? ` style="${sizeStyle}; ${fontSizeStr}"`
      : ` style="${fontSizeStr}"`;
  }
  return `<div class="author-dot"${dynamicStyle}>${escapeHTML(initials)}</div>`;
}

// FIREBASE: Load announcements from Firestore in real-time
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
        featured: false
      });
    });
    renderAnnouncements();
  }, (error) => {
    console.error('Error listening to announcements:', error);
  });
}

// FIREBASE: Save announcement to Firestore
async function saveAnnouncementToFirestore(category, title, body, authorName, authorInitials, imageUrl = '') {
  try {
    await addDoc(collection(db, 'announcements'), {
      title: title,
      content: body,
      author: CURRENT_USER ? CURRENT_USER.email : 'unknown@example.com',
      authorName: authorName,
      authorInitials: authorInitials || (authorName ? authorName.split(' ').map(w => w[0]).join('').slice(0, 10) : ''),
      authorPhotoUrl: CURRENT_USER ? (CURRENT_USER.photoURL || '') : '',
      createdAt: serverTimestamp(),
      imageUrl: imageUrl,
      ...(category ? { category: category } : {})
    });
  } catch (error) {
    console.error('Error saving announcement:', error);
    throw error;
  }
}

// FIREBASE: Delete announcement from Firestore
async function deleteAnnouncementFromFirestore(id) {
  try {
    await deleteDoc(doc(db, 'announcements', id));
  } catch (error) {
    console.error('Error deleting announcement:', error);
    throw error;
  }
}

// ═════════════════════════════════════=
//  FIRESTORE TASKS
// ═════════════════════════════════════=

// FIREBASE: Load tasks from Firestore in real-time
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

// FIREBASE: Save task to Firestore
async function saveTaskToFirestore(category, title, details, authorName, authorInitials, imageUrl = '') {
  try {
    await addDoc(collection(db, 'tasks'), {
      category: category,
      task: title,
      title: title,
      details: details,
      author: CURRENT_USER ? CURRENT_USER.email : 'unknown@example.com',
      authorName: authorName,
      authorInitials: authorInitials,
      authorPhotoUrl: CURRENT_USER ? (CURRENT_USER.photoURL || '') : '',
      completed: false,
      imageUrl: imageUrl,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error saving task:', error);
    throw error;
  }
}

// FIREBASE: Delete task from Firestore
async function deleteTaskFromFirestore(id) {
  try {
    await deleteDoc(doc(db, 'tasks', id));
  } catch (error) {
    console.error('Error deleting task:', error);
    throw error;
  }
}

// FIREBASE: Mark task as complete in Firestore
async function completeTaskInFirestore(id) {
  try {
    await updateDoc(doc(db, 'tasks', id), {
      completed: true
    });
  } catch (error) {
    console.error('Error completing task:', error);
    throw error;
  }
}

// Initialize listeners on page load
setupAnnouncementsListener();
setupTasksListener();

// ═════════════════════════════════════=
//  DATA
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
  { id: 8, name: "TheKiller87", position: "PVP Head", initials: "TK", description: "TheKiller87 is DNMX's PVP head, responsible for training clan members in combat, organizing tactical battle units, and leading frontline engagements to ensure dominance in every skirmish and war.", playstyle: "Aggressive frontliner specializing in quick decision-making, shield tactics, and critical timing during high-pressure combat situations.", responsibilities: "Frontline combat leadership and tactical command. Organizing PVP training sessions and trial duels for members. Coordinating battlefield logistics and defensive operations during clan conflicts.", council: "Management" },
];

// REPLACED BY FIRESTORE: localStorage loading functions removed
// ANNOUNCEMENTS and TASKS are now managed by Firestore listeners

// ══════════════════════════════════════
//  STATE
// ══════════════════════════════════════
let currentPage = 'home';
let rankFilter = 'all';
let announceFilter = 'all';
let announcePage = 1;
let taskFilter = 'all';
const ANNOUNCE_PER_PAGE = 4;

// ══════════════════════════════════════
//  NAVIGATION
// ══════════════════════════════════════
function navigate(page) {
  let target = page + '.html';
  if (page === 'home') target = 'index.html';
  if (page === 'councils') target = 'council.html';
  if (page === 'hierarchy') target = 'hierachy.html';
  window.location.href = target;
}

document.querySelectorAll('.nav-link, .mobile-nav-link').forEach(a => {
  a.addEventListener('click', e => { e.preventDefault(); navigate(a.dataset.page); });
});

// ══════════════════════════════════════
//  MOBILE MENU
// ══════════════════════════════════════
function toggleMobile() {
  const menu = document.getElementById('mobileMenu');
  const ham = document.getElementById('hamburger');
  menu.classList.toggle('open');
  ham.classList.toggle('open');
}
function closeMobile() {
  document.getElementById('mobileMenu').classList.remove('open');
  document.getElementById('hamburger').classList.remove('open');
}

// ══════════════════════════════════════
//  PARTICLES
// ══════════════════════════════════════
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

// ══════════════════════════════════════
//  STATS COUNTER
// ══════════════════════════════════════
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

// ══════════════════════════════════════
//  HIERARCHY
// ══════════════════════════════════════
function getBadgeClass(cat) {
  const map = { 'Executive Council': 'badge-executive', 'Star Officers': 'badge-star', 'Officers': 'badge-officer', 'Members': 'badge-member' };
  return map[cat] || 'badge-member';
}

function renderRanks() {
  const searchInput = document.getElementById('rankSearch');
  const grid = document.getElementById('rankGrid');
  if (!searchInput || !grid) return;
  const search = searchInput.value.toLowerCase();
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

// ══════════════════════════════════════
//  COUNCILS
// ══════════════════════════════════════
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
  const search = searchInput.value.toLowerCase();

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

// ══════════════════════════════════════
//  ANNOUNCEMENTS
// ══════════════════════════════════════
function renderAnnouncements() {
  const searchInput = document.getElementById('announceSearch');
  if (!searchInput) return;
  const search = searchInput.value.toLowerCase();
  const sortedAnnouncements = [...ANNOUNCEMENTS].sort((a, b) => b.createdAt - a.createdAt);
  const featured = sortedAnnouncements.find(a => a.featured);
  const featuredArea = document.getElementById('featuredArea');

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
  if (totalPages <= 1) { pag.innerHTML = ''; return; }
  let pagHTML = `<button class="page-btn arrow" onclick="goPage(${announcePage - 1})" ${announcePage === 1 ? 'disabled style="opacity:0.3;cursor:not-allowed"' : ''}>‹</button>`;
  for (let i = 1; i <= totalPages; i++) {
    pagHTML += `<button class="page-btn ${i === announcePage ? 'active' : ''}" onclick="goPage(${i})">${i}</button>`;
  }
  pagHTML += `<button class="page-btn arrow" onclick="goPage(${announcePage + 1})" ${announcePage === totalPages ? 'disabled style="opacity:0.3;cursor:not-allowed"' : ''}>›</button>`;
  pag.innerHTML = pagHTML;
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

function renderTasks() {
  const searchInput = document.getElementById('taskSearch');
  if (!searchInput) return;
  const search = searchInput.value.toLowerCase();
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
            <span style="font-size:0.75rem; color:rgba(255,255,255,0.3);">By:</span>
            ${getAuthorDotHTML(t.authorPhotoUrl, t.authorInitials, "width:20px; height:20px; font-size:0.55rem;")}
            <span style="color:rgba(255,255,255,0.7);">${t.authorName || t.author}</span>
          </div>
        </div>
        ${!t.completed ? `
          <button type="button" class="btn-primary" style="padding: 6px 12px; font-size: 0.6rem; font-family:'Orbitron',sans-serif; letter-spacing:0.05em; border-radius: 4px; box-shadow: 0 0 10px rgba(0, 191, 255, 0.2);" onclick="event.stopPropagation(); window.openSubmitProofModal('${t.id}')">TASK COMPLETED</button>
        ` : ''}
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

function selectTaskType(type, element) {
  document.querySelectorAll('.task-type-btn').forEach(btn => btn.classList.remove('selected'));
  element.classList.add('selected');
  document.getElementById('assignTaskCategory').value = type;
}

function selectAnnouncementType(type, element) {
  document.querySelectorAll('.task-type-btn').forEach(btn => btn.classList.remove('selected'));
  element.classList.add('selected');
  document.getElementById('announceCategory').value = type;
}

function openNewAnnouncementModal() {
  if (!isAdmin()) {
    document.getElementById('modalContent').innerHTML = `
      <h2 class="modal-title">Admin Only</h2>
      <p class="modal-subtitle">Only admins can create announcements.</p>
      <div style="display:flex;gap:14px;justify-content:flex-end;flex-wrap:wrap;margin-top:18px;">
        <button type="button" class="btn-secondary" onclick="closeModal()">CLOSE</button>
      </div>
    `;
    openModal();
    return;
  }

  const authorVal = CURRENT_USER ? CURRENT_USER.ingameName : '';
  const initialsVal = CURRENT_USER ? (CURRENT_USER.initials || CURRENT_USER.ingameName.split(' ').map(w => w[0]).join('').slice(0, 10)) : '';
  document.getElementById('modalContent').innerHTML = `
    <h2 class="modal-title">New Announcement</h2>
    <p class="modal-subtitle" style="margin-bottom:18px;">Choose a category, enter the title, body, and your in-game name.</p>
    <form id="announceForm" onsubmit="submitAnnouncementForm(event)">
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

// FIREBASE: Submit announcement to Firestore
async function submitAnnouncementForm(event) {
  event.preventDefault();
  const category = document.getElementById('announceCategory').value;
  const title = document.getElementById('announceTitle').value.trim();
  const body = document.getElementById('announceBody').value.trim();
  const authorName = document.getElementById('announceAuthor').value.trim();
  const initials = document.getElementById('announceInitials').value.trim();
  const errorEl = document.getElementById('announceError');

  if (!category || !title || !body || !authorName || !initials) {
    errorEl.textContent = 'All fields are required.';
    return;
  }
  if (!isAdmin()) {
    errorEl.textContent = 'You must be an admin to publish announcements.';
    return;
  }

  try {
    const imgPreview = document.getElementById('announceImagePreview');
    const imageUrl = imgPreview && imgPreview.src ? imgPreview.src : '';
    await saveAnnouncementToFirestore(category, title, body, authorName, initials, imageUrl);
    closeModal();
    announceFilter = 'all';
    document.querySelectorAll('#announceFilters .chip').forEach(c => c.classList.remove('active'));
    document.querySelector('#announceFilters .chip[data-filter="all"]').classList.add('active');
    document.getElementById('announceSearch').value = '';
    renderAnnouncements();
  } catch (error) {
    errorEl.textContent = 'Error publishing announcement: ' + error.message;
  }
}

function openAssignTaskModal() {
  if (!isAdmin()) {
    document.getElementById('modalContent').innerHTML = `
      <h2 class="modal-title">Admin Only</h2>
      <p class="modal-subtitle">Only admins can assign tasks.</p>
      <div style="display:flex;gap:14px;justify-content:flex-end;flex-wrap:wrap;margin-top:18px;">
        <button type="button" class="btn-secondary" onclick="closeModal()">CLOSE</button>
      </div>
    `;
    openModal();
    return;
  }

  const assignedName = CURRENT_USER ? CURRENT_USER.ingameName : '';
  const initialsVal = CURRENT_USER ? (CURRENT_USER.initials || CURRENT_USER.ingameName.split(' ').map(w => w[0]).join('').slice(0, 10)) : '';
  document.getElementById('modalContent').innerHTML = `
    <h2 class="modal-title">Assign New Task</h2>
    <p class="modal-subtitle" style="margin-bottom:18px;">Enter the task details and your in-game name.</p>
    <form id="assignTaskForm" onsubmit="submitTaskForm(event)">
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
        <input type="text" id="assignTaskName" placeholder="Enter your in-game name" value="${escapeHTML(assignedName)}" required />
      </label>
      <label>
        Initials
        <input type="text" id="assignTaskInitials" placeholder="Enter your initials" value="${escapeHTML(initialsVal)}" maxlength="10" required />
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

// FIREBASE: Submit task to Firestore
async function submitTaskForm(event) {
  event.preventDefault();
  const category = document.getElementById('assignTaskCategory').value;
  const title = document.getElementById('assignTaskTitle').value.trim();
  const details = document.getElementById('assignTaskDetails').value.trim();
  const assignedTo = document.getElementById('assignTaskName').value.trim();
  const initials = document.getElementById('assignTaskInitials').value.trim();
  const errorEl = document.getElementById('taskError');

  if (!category || !title || !details || !assignedTo || !initials) {
    errorEl.textContent = 'All fields are required. Please select a task type.';
    return;
  }
  if (!isAdmin()) {
    errorEl.textContent = 'You must be an admin to assign tasks.';
    return;
  }

  try {
    const imgPreview = document.getElementById('taskImagePreview');
    const imageUrl = imgPreview && imgPreview.src ? imgPreview.src : '';
    await saveTaskToFirestore(category, title, details, assignedTo, initials, imageUrl);
    closeModal();
    taskFilter = 'all';
    document.querySelectorAll('#taskFilters .chip').forEach(c => c.classList.remove('active'));
    document.querySelector('#taskFilters .chip[data-filter="all"]').classList.add('active');
    document.getElementById('taskSearch').value = '';
    renderTasks();
  } catch (error) {
    errorEl.textContent = 'Error assigning task: ' + error.message;
  }
}

function openTaskModal(id) {
  const t = TASKS.find(x => x.id === id);
  if (!t) return;
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
      <div id="taskProofMediaBtnContainer" style="display:inline-flex;"></div>
      ${t.imageUrl ? `
        <button type="button" class="btn-primary" style="padding: 10px 20px; font-family: 'Orbitron', sans-serif; font-size: 0.65rem; letter-spacing: 0.15em;" onclick="window.openMediaFullModal('${t.imageUrl}', 'image', '${escapeHTML(t.title)}')">VIEW TASK MEDIA</button>
      ` : ''}
      ${isAdmin() ? `
        <button type="button" class="btn-primary" style="padding: 10px 20px; font-family: 'Orbitron', sans-serif; font-size: 0.65rem; letter-spacing: 0.15em; background: linear-gradient(135deg, #ff007b, #9d00ff); border: none;" onclick="window.open('https://docs.google.com/spreadsheets/d/1_Ne9NHpq5UxfcFw6B-wL4y042xVD56c9HhVnmPMGXUg/edit?usp=sharing', '_blank')">View Completion proof</button>
        <button type="button" class="btn-secondary" style="padding: 10px 20px; font-family: 'Orbitron', sans-serif; font-size: 0.65rem; letter-spacing: 0.15em;" onclick="window.openEditTaskModal('${t.id}')">EDIT</button>
        <button type="button" class="task-action-btn task-delete-btn" onclick="window.requestDeleteTask('${t.id}')">✕</button>
        ${!t.completed ? `<button type="button" class="task-action-btn task-complete-btn" onclick="window.requestCompleteTask('${t.id}')">✓</button>` : ''}
      ` : ''}
      ${!t.completed ? `
        <button type="button" class="btn-primary" style="padding: 10px 20px; font-family: 'Orbitron', sans-serif; font-size: 0.65rem; letter-spacing: 0.15em;" onclick="window.openSubmitProofModal('${t.id}')">TASK COMPLETED</button>
      ` : ''}
      <button type="button" class="btn-secondary" onclick="window.closeModal()">CLOSE</button>
    </div>
  `;
  openModal();

  if (t.completed) {
    const proofsRef = collection(db, 'logs');
    const q = query(proofsRef, where('taskTitle', '==', t.title));
    getDocs(q).then((snapshot) => {
      if (!snapshot.empty) {
        // Find the most recent proof by sorting client-side
        const sortedDocs = snapshot.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => {
          const aTime = a.submittedAt && typeof a.submittedAt.toDate === 'function' ? a.submittedAt.toDate() : (a.submittedAt instanceof Date ? a.submittedAt : (a.timestamp && typeof a.timestamp.toDate === 'function' ? a.timestamp.toDate() : new Date(0)));
          const bTime = b.submittedAt && typeof b.submittedAt.toDate === 'function' ? b.submittedAt.toDate() : (b.submittedAt instanceof Date ? b.submittedAt : (b.timestamp && typeof b.timestamp.toDate === 'function' ? b.timestamp.toDate() : new Date(0)));
          return bTime - aTime;
        });
        const proofData = sortedDocs[0];
        const proofFile = proofData.proofFile || proofData.media;
        if (proofFile) {
          const btnContainer = document.getElementById('taskProofMediaBtnContainer');
          if (btnContainer) {
            const escMsg = (proofData.message || '').replace(/'/g, "\\'");
            btnContainer.innerHTML = `
                  <button type="button" class="btn-primary" style="padding: 10px 20px; font-family: 'Orbitron', sans-serif; font-size: 0.65rem; letter-spacing: 0.15em; background: linear-gradient(135deg, #00e676, #00b0ff); margin-right: 12px;" onclick="window.openMediaFullModal('${proofFile}', '${proofData.fileType || 'image'}', 'Proof: ${escapeHTML(t.title)}', '${escMsg}')">VIEW MEDIA</button>
                `;
          }
        }
      }
    }).catch(err => console.error("Error querying task proof:", err));
  }
}

function requestDeleteTask(id) {
  if (!isAdmin()) {
    document.getElementById('modalContent').innerHTML = `
      <h2 class="modal-title">Admin Only</h2>
      <p class="modal-subtitle">Only admins can delete tasks.</p>
      <div style="display:flex;gap:14px;justify-content:flex-end;flex-wrap:wrap;margin-top:18px;">
        <button type="button" class="btn-secondary" onclick="window.openTaskModal('${id}')">BACK</button>
      </div>
    `;
    return;
  }
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

function verifyAndDeleteTask(id) {
  // kept for compatibility; not used
}

// FIREBASE: Delete task from Firestore
async function confirmDeleteTask(id) {
  const errorEl = document.getElementById('deleteError');
  if (!isAdmin()) {
    if (errorEl) errorEl.textContent = 'Only admins can delete tasks.';
    return;
  }
  try {
    await deleteTaskFromFirestore(id);
    closeModal();
    renderTasks();
  } catch (error) {
    if (errorEl) errorEl.textContent = 'Error deleting task: ' + error.message;
  }
}

function requestCompleteTask(id) {
  if (!isAdmin()) {
    document.getElementById('modalContent').innerHTML = `
      <h2 class="modal-title">Admin Only</h2>
      <p class="modal-subtitle">Only admins can mark tasks complete.</p>
      <div style="display:flex;gap:14px;justify-content:flex-end;flex-wrap:wrap;margin-top:18px;">
        <button type="button" class="btn-secondary" onclick="window.openTaskModal('${id}')">BACK</button>
      </div>
    `;
    return;
  }
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

function verifyAndCompleteTask(id) {
  // kept for compatibility; not used
}

// FIREBASE: Mark task as complete in Firestore
async function confirmCompleteTask(id) {
  const errorEl = document.getElementById('completeError');
  if (!isAdmin()) {
    if (errorEl) errorEl.textContent = 'Only admins can complete tasks.';
    return;
  }
  try {
    await completeTaskInFirestore(id);
    closeModal();
    renderTasks();
  } catch (error) {
    if (errorEl) errorEl.textContent = 'Error completing task: ' + error.message;
  }
}

function openEditTaskModal(id) {
  const t = TASKS.find(x => x.id === id);
  if (!t) return;

  document.getElementById('modalContent').innerHTML = `
          <h2 class="modal-title">Edit Task</h2>
          <p class="modal-subtitle" style="margin-bottom:18px;">Update the task details.</p>
          <form id="editTaskForm" onsubmit="submitEditTask(event, '${t.id}')">
            <label style="margin-bottom:14px;">
              Task Type
              <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:8px;">
                <button type="button" class="task-type-btn ${t.category === 'building' ? 'selected' : ''}" data-type="building" onclick="selectTaskType('building', this)">BUILDING</button>
                <button type="button" class="task-type-btn ${t.category === 'grinding' ? 'selected' : ''}" data-type="grinding" onclick="selectTaskType('grinding', this)">GRINDING</button>
                <button type="button" class="task-type-btn ${t.category === 'fighting' ? 'selected' : ''}" data-type="fighting" onclick="selectTaskType('fighting', this)">FIGHTING</button>
                <button type="button" class="task-type-btn ${t.category === 'support' ? 'selected' : ''}" data-type="support" onclick="selectTaskType('support', this)">SUPPORT</button>
                <button type="button" class="task-type-btn ${t.category === 'defense' ? 'selected' : ''}" data-type="defense" onclick="selectTaskType('defense', this)">DEFENSE</button>
              </div>
              <input type="hidden" id="assignTaskCategory" value="${t.category}" required />
            </label>
            <label>
              Task Heading
              <input type="text" id="assignTaskTitle" placeholder="Enter task heading" value="${escapeHTML(t.title)}" required />
            </label>
            <label>
              Task Description
              <textarea id="assignTaskDetails" placeholder="Describe the task in detail" required>${escapeHTML(t.details)}</textarea>
            </label>
            <label style="margin-top: 14px;">
              Update Image (Optional)
              <input type="file" id="taskImageFile" accept="image/*" onchange="window.previewImageUpload(this, 'taskImagePreview')" />
              <div style="margin-top:8px; display:flex; gap:10px; align-items:center;">
                <img id="taskImagePreview" class="modal-image-preview" src="${t.imageUrl || ''}" style="${t.imageUrl ? '' : 'display:none;'}" />
                ${t.imageUrl ? `<button type="button" class="btn-secondary" style="padding: 5px 10px; font-size: 0.6rem;" onclick="window.removePreviewImage('taskImagePreview')">REMOVE</button>` : ''}
              </div>
            </label>
            <div style="display:flex;gap:14px;justify-content:flex-end;margin-top:18px;flex-wrap:wrap;">
              <button type="button" class="btn-secondary" onclick="window.openTaskModal('${t.id}')">CANCEL</button>
              <button type="submit" class="btn-primary"><span>SAVE CHANGES</span></button>
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

  if (!category || !title || !details) {
    if (errorEl) errorEl.textContent = 'All fields are required.';
    return;
  }

  try {
    const docRef = doc(db, 'tasks', id);
    await updateDoc(docRef, {
      category: category,
      title: title,
      details: details,
      imageUrl: imageUrl
    });
    closeModal();
  } catch (error) {
    if (errorEl) errorEl.textContent = 'Error updating task: ' + error.message;
  }
}

// ═════════════════════════════════════=
//  MEMORIES SECTION JS LOGIC
// ═════════════════════════════════════=
let ALL_MEMORIES = [];
let unsubscribeMemories = null;



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
    console.error("Error loading memories:", error);
  });
}

function renderMemoriesGrid() {
  const grid = document.getElementById('memoriesGrid');
  if (!grid) return;

  const search = document.getElementById('memorySearch').value.toLowerCase().trim();
  const filtered = ALL_MEMORIES.filter(m => m.name.toLowerCase().includes(search));

  if (filtered.length === 0) {
    grid.innerHTML = `
            <div class="no-results" style="grid-column: 1 / -1;">
              <div class="no-results-icon">🖼️</div>
              <h3>No images found</h3>
              <p>Search by a different name or be the first to upload a memory!</p>
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

function filterMemories() {
  renderMemoriesGrid();
}

function openImageFullModal(id, url, title) {
  const m = ALL_MEMORIES.find(x => x.id === id);
  const desc = m && m.description ? m.description : '';

  const deleteBtn = isAdmin()
    ? `<button type="button" class="btn-primary" style="padding: 10px 20px; font-family: 'Orbitron', sans-serif; font-size: 0.65rem; letter-spacing: 0.15em; background: linear-gradient(135deg, var(--crimson-deep), var(--crimson)); border: none; margin-right: auto;" onclick="window.requestDeleteMemory('${id}', '${url}', '${escapeHTML(title)}')">DELETE</button>`
    : '';

  const descriptionHTML = desc ? `
        <div style="margin-top: 15px; padding: 12px; background: rgba(255,255,255,0.05); border-radius: 6px; font-size: 0.9rem; color: rgba(255,255,255,0.8); line-height: 1.5; text-align: left;">
          <strong style="color: var(--cyan); font-family: 'Orbitron', sans-serif; font-size: 0.75rem; display: block; margin-bottom: 4px;">DESCRIPTION:</strong>
          ${parseDiscordFormatting(desc)}
        </div>
      ` : '';

  document.getElementById('modalContent').innerHTML = `
          <h2 class="modal-title">${escapeHTML(title)}</h2>
          <img src="${url}" style="width:100%; max-height:75vh; object-fit:contain; border-radius:8px; border:1px solid rgba(255,255,255,0.1); margin-top:15px;" />
          ${descriptionHTML}
          <div style="display:flex; justify-content:flex-end; margin-top:20px; gap: 12px; align-items: center; width: 100%;">
            ${deleteBtn}
            <button class="btn-secondary" onclick="closeModal()">CLOSE</button>
          </div>
        `;
  openModal();
}

function requestDeleteMemory(id, url, title) {
  if (!isAdmin()) {
    document.getElementById('modalContent').innerHTML = `
          <h2 class="modal-title">Admin Only</h2>
          <p class="modal-subtitle">Only admins can delete memory archives.</p>
          <div style="display:flex;gap:14px;justify-content:flex-end;flex-wrap:wrap;margin-top:18px;">
            <button type="button" class="btn-secondary" onclick="window.openImageFullModal('${id}', '${url}', '${escapeHTML(title)}')">BACK</button>
          </div>
        `;
    return;
  }
  document.getElementById('modalContent').innerHTML = `
        <h2 class="modal-title">Confirm Delete Memory</h2>
        <p class="modal-subtitle" style="margin-bottom:18px;">Are you sure you want to delete this memory archive?</p>
        <div style="display:flex;gap:14px;justify-content:flex-end;flex-wrap:wrap;">
          <button type="button" class="btn-secondary" onclick="window.openImageFullModal('${id}', '${url}', '${escapeHTML(title)}')">CANCEL</button>
          <button type="button" class="btn-primary" onclick="window.confirmDeleteMemory('${id}')"><span>DELETE</span></button>
        </div>
        <p id="memoryDeleteError" style="margin-top:14px;color:#ff7b7b;font-size:0.9rem;min-height:20px;"></p>
      `;
}

async function confirmDeleteMemory(id) {
  const errorEl = document.getElementById('memoryDeleteError');
  if (!isAdmin()) {
    if (errorEl) errorEl.textContent = 'Only admins can delete memory archives.';
    return;
  }
  try {
    await deleteDoc(doc(db, 'memories', id));
    closeModal();
  } catch (error) {
    if (errorEl) errorEl.textContent = 'Error deleting memory: ' + error.message;
  }
}

function openMediaFullModal(url, mediaType, title, message = '') {
  let mediaHTML = '';
  if (mediaType === 'video') {
    mediaHTML = `<video src="${url}" controls style="width:100%; max-height:75vh; border-radius:8px; border:1px solid rgba(255,255,255,0.1); margin-top:15px;"></video>`;
  } else {
    mediaHTML = `<img src="${url}" style="width:100%; max-height:75vh; object-fit:contain; border-radius:8px; border:1px solid rgba(255,255,255,0.1); margin-top:15px;" />`;
  }

  const messageHTML = message ? `
        <div style="margin-top: 15px; padding: 12px; background: rgba(255,255,255,0.05); border-radius: 6px; font-size: 0.9rem; color: rgba(255,255,255,0.8); line-height: 1.5; text-align: left; max-width: 100%;">
          <strong style="color: var(--cyan); font-family: 'Orbitron', sans-serif; font-size: 0.75rem; display: block; margin-bottom: 4px;">NOTE:</strong>
          ${parseDiscordFormatting(message)}
        </div>
      ` : '';

  document.getElementById('modalContent').innerHTML = `
          <h2 class="modal-title">${escapeHTML(title)}</h2>
          ${mediaHTML}
          ${messageHTML}
          <div style="display:flex; justify-content:flex-end; margin-top:20px;">
            <button class="btn-secondary" onclick="closeModal()">CLOSE</button>
          </div>
        `;
  openModal();
}

async function openTaskProofsListModal(taskId) {
  const t = TASKS.find(x => x.id === taskId);
  if (!t) return;

  document.getElementById('modalContent').innerHTML = `
        <h2 class="modal-title">Completion Proofs</h2>
        <p class="modal-subtitle" style="margin-bottom:18px;">Members who submitted proof for: <strong>${escapeHTML(t.title)}</strong></p>
        <div style="max-height: 300px; overflow-y: auto; margin-top: 15px;">
          <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.85rem; color: rgba(255,255,255,0.85);">
            <thead>
              <tr style="border-bottom: 2px solid rgba(255,255,255,0.1); color: var(--cyan); font-family: 'Orbitron', sans-serif; font-size: 0.75rem; letter-spacing: 0.05em;">
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
    const proofsRef = collection(db, 'logs');
    const q = query(proofsRef, where('taskTitle', '==', t.title));
    const [snapshot, usersSnapshot] = await Promise.all([
      getDocs(q),
      getDocs(collection(db, 'users'))
    ]);

    const userMap = {};
    usersSnapshot.forEach((uDoc) => {
      const uData = uDoc.data();
      if (uData.email) {
        userMap[uData.email.toLowerCase().trim()] = uData.ingameName || uData.name || 'Member';
      }
    });

    const tbody = document.getElementById('proofsListTableBody');
    if (snapshot.empty) {
      tbody.innerHTML = `
            <tr>
              <td colspan="3" style="text-align: center; padding: 20px; color: rgba(255,255,255,0.4);">No proofs found.</td>
            </tr>
          `;
      return;
    }

    // Sort documents descending client-side by submittedAt/timestamp to prevent composite index errors
    const docs = [];
    snapshot.forEach((doc) => {
      docs.push({ id: doc.id, ...doc.data() });
    });
    docs.sort((a, b) => {
      const aTime = a.submittedAt && typeof a.submittedAt.toDate === 'function' ? a.submittedAt.toDate() : (a.submittedAt instanceof Date ? a.submittedAt : (a.timestamp && typeof a.timestamp.toDate === 'function' ? a.timestamp.toDate() : new Date(0)));
      const bTime = b.submittedAt && typeof b.submittedAt.toDate === 'function' ? b.submittedAt.toDate() : (b.submittedAt instanceof Date ? b.submittedAt : (b.timestamp && typeof b.timestamp.toDate === 'function' ? b.timestamp.toDate() : new Date(0)));
      return bTime - aTime;
    });

    let rowsHTML = '';
    docs.forEach((docData) => {
      const submittedAt = docData.submittedAt && typeof docData.submittedAt.toDate === 'function'
        ? docData.submittedAt.toDate()
        : (docData.submittedAt instanceof Date ? docData.submittedAt : (docData.timestamp && typeof docData.timestamp.toDate === 'function' ? docData.timestamp.toDate() : new Date()));
      const dateStr = submittedAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' ' +
        submittedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      const emailKey = (docData.email || '').toLowerCase().trim();
      const displayName = userMap[emailKey] || docData.username || 'Member';

      rowsHTML += `
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.05); font-family: 'Rajdhani', sans-serif; font-size: 0.95rem; font-weight: 500;">
              <td style="padding: 12px 5px; color: #fff;">${escapeHTML(displayName)}</td>
              <td style="padding: 12px 5px; color: rgba(255,255,255,0.6);">${dateStr}</td>
              <td style="padding: 12px 5px; text-align: right;">
                <button type="button" class="btn-primary" style="padding: 6px 12px; font-size: 0.6rem; font-family: 'Orbitron', sans-serif;" onclick="window.openSingleProofDetailModal('${docData.id}', '${taskId}')">View Proof</button>
              </td>
            </tr>
          `;
    });
    tbody.innerHTML = rowsHTML;
  } catch (err) {
    console.error("Error loading task proofs list:", err);
    const tbody = document.getElementById('proofsListTableBody');
    if (tbody) {
      tbody.innerHTML = `
            <tr>
              <td colspan="3" style="text-align: center; padding: 20px; color: #ff7b7b;">Failed to load proofs.</td>
            </tr>
          `;
    }
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
    const proofDocRef = doc(db, 'logs', proofId);
    const docSnap = await getDoc(proofDocRef);
    if (docSnap.exists()) {
      const data = docSnap.data();

      let displayName = data.username || 'Member';
      if (data.email) {
        try {
          const usersRef = collection(db, 'users');
          const uQuery = query(usersRef, where('email', '==', data.email), limit(1));
          const uSnapshot = await getDocs(uQuery);
          if (!uSnapshot.empty) {
            const userData = uSnapshot.docs[0].data();
            displayName = userData.ingameName || userData.name || displayName;
          }
        } catch (uErr) {
          console.error("Error looking up user for proof detail:", uErr);
        }
      }

      let mediaHTML = '';
      const proofFile = data.proofFile || data.media;
      if (data.fileType === 'video') {
        mediaHTML = `<video src="${proofFile}" controls style="width:100%; max-height:55vh; border-radius:8px; border:1px solid rgba(255,255,255,0.1); margin-top:15px;"></video>`;
      } else {
        mediaHTML = `<img src="${proofFile}" style="width:100%; max-height:55vh; object-fit:contain; border-radius:8px; border:1px solid rgba(255,255,255,0.1); margin-top:15px;" />`;
      }

      document.getElementById('modalContent').innerHTML = `
            <h2 class="modal-title">Proof by ${escapeHTML(displayName)}</h2>
            <p class="modal-subtitle">Submitted for task completion</p>
            ${mediaHTML}
            ${data.message ? `
              <div style="margin-top: 15px; padding: 12px; background: rgba(255,255,255,0.05); border-radius: 6px; font-size: 0.9rem; color: rgba(255,255,255,0.8); line-height: 1.5; text-align: left;">
                <strong style="color: var(--cyan); font-family: 'Orbitron', sans-serif; font-size: 0.75rem; display: block; margin-bottom: 4px;">NOTE:</strong>
                ${parseDiscordFormatting(data.message)}
              </div>
            ` : ''}
            <div style="display:flex; justify-content:flex-end; margin-top:20px; gap: 12px;">
              <button class="btn-secondary" onclick="window.openTaskProofsListModal('${taskId}')">BACK</button>
              <button class="btn-secondary" onclick="closeModal()">CLOSE</button>
            </div>
          `;
    } else {
      document.getElementById('modalContent').innerHTML = `
            <h2 class="modal-title">Proof Not Found</h2>
            <div style="display:flex; justify-content:flex-end; margin-top:20px;">
              <button class="btn-secondary" onclick="window.openTaskProofsListModal('${taskId}')">BACK</button>
            </div>
          `;
    }
  } catch (err) {
    console.error("Error loading single proof detail:", err);
    document.getElementById('modalContent').innerHTML = `
          <h2 class="modal-title">Error Loading Proof</h2>
          <p class="modal-subtitle" style="color: #ff7b7b;">${err.message}</p>
          <div style="display:flex; justify-content:flex-end; margin-top:20px;">
            <button class="btn-secondary" onclick="window.openTaskProofsListModal('${taskId}')">BACK</button>
          </div>
        `;
  }
}

function openUploadImageModal() {
  if (!CURRENT_USER) {
    document.getElementById('modalContent').innerHTML = `
            <h2 class="modal-title">Authentication Required</h2>
            <p class="modal-subtitle">Please log in to upload memories.</p>
            <div style="display:flex; justify-content:flex-end; margin-top:20px;">
              <button class="btn-secondary" onclick="closeModal()">CLOSE</button>
            </div>
          `;
    openModal();
    return;
  }

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
              <textarea id="memoryDescriptionInput" placeholder="Add a description or story about this memory..." style="min-height:80px;"></textarea>
            </label>
            <label style="margin-top:14px;">
              Choose Image (Max size 10MB)
              <input type="file" id="memoryFileInput" accept="image/*" onchange="window.previewImageUpload(this, 'memoryUploadPreview')" required />
              <img id="memoryUploadPreview" class="modal-image-preview" style="display:none;" />
            </label>
            <div style="display:flex; gap:14px; justify-content:flex-end; margin-top:24px; flex-wrap:wrap;">
              <button type="button" class="btn-secondary" onclick="closeModal()">CANCEL</button>
              <button type="submit" class="btn-primary"><span>UPLOAD</span></button>
            </div>
            <p id="memoryUploadError" style="margin-top:14px; color:#ff7b7b; font-size:0.9rem; min-height:20px;"></p>
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
    if (errorEl) errorEl.textContent = 'Please provide a title and choose an image.';
    return;
  }

  try {
    if (errorEl) errorEl.textContent = 'Uploading...';

    await addDoc(collection(db, 'memories'), {
      name: title,
      imageUrl: previewEl.src,
      description: description,
      uploadedBy: CURRENT_USER ? (CURRENT_USER.ingameName || CURRENT_USER.name) : 'Member',
      createdAt: serverTimestamp()
    });
    closeModal();
  } catch (err) {
    console.error("Error uploading memory image:", err);
    if (errorEl) errorEl.textContent = 'Upload failed: ' + err.message;
  }
}

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
              <span style="font-family:'Courier New',Courier,monospace; color:#00bfff; font-weight:bold; font-size:0.95rem;">${w.cmd}</span>
              <p style="margin:4px 0 0 0; color:rgba(255,255,255,0.6); font-size:0.75rem; font-family:'Orbitron',sans-serif;">${w.desc}</p>
            </div>
            <button class="btn-secondary" style="padding:6px 12px; font-size:0.6rem; letter-spacing:0.05em;" onclick="window.copyPWCmd('${w.cmd}', this)">COPY</button>
          </div>
        `).join('');

  document.getElementById('modalContent').innerHTML = `
          <h2 class="modal-title">Dnmx Playerwarps</h2>
          <p class="modal-subtitle" style="margin-bottom:20px;">Use these in-game commands to visit our designated clan landmarks.</p>
          <div style="max-height:55vh; overflow-y:auto; padding-right:5px;">
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

function previewProofFile(inputEl) {
  const file = inputEl.files[0];
  const errorEl = document.getElementById('proofSubmitError');
  if (errorEl) errorEl.textContent = '';

  if (!file) return;

  const imgPreview = document.getElementById('proofImagePreview');
  const vidPreview = document.getElementById('proofVideoPreview');
  const container = document.getElementById('proofPreviewContainer');

  imgPreview.style.display = 'none';
  vidPreview.style.display = 'none';
  container.style.display = 'none';

  if (file.type.startsWith('image/')) {
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      if (errorEl) errorEl.textContent = 'Image file size exceeds the 10MB limit. Please choose a smaller image.';
      inputEl.value = ''; // clear input
      return;
    }
    compressImage(file).then(dataUrl => {
      imgPreview.src = dataUrl;
      imgPreview.style.display = 'block';
      container.style.display = 'block';
    }).catch(err => {
      console.error("Error compressing proof image:", err);
      if (errorEl) errorEl.textContent = 'Error loading image preview.';
    });
  } else if (file.type.startsWith('video/')) {
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      if (errorEl) errorEl.textContent = 'Video file size exceeds the 10MB limit. Please upload a smaller video clip.';
      inputEl.value = ''; // clear input
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      vidPreview.src = e.target.result;
      vidPreview.style.display = 'block';
      container.style.display = 'block';
    };
    reader.onerror = (err) => {
      console.error("Error reading video:", err);
      if (errorEl) errorEl.textContent = 'Error loading video preview.';
    };
    reader.readAsDataURL(file);
  }
}

function openSubmitProofModal(taskId) {
  if (!isAdmin()) {
    window.open('https://forms.gle/rWCzM3DgKiE9Hr6t6', '_blank');
    return;
  }

  if (!CURRENT_USER) {
    document.getElementById('modalContent').innerHTML = `
            <h2 class="modal-title">Authentication Required</h2>
            <p class="modal-subtitle">Please log in to submit task proof.</p>
            <div style="display:flex; justify-content:flex-end; margin-top:20px;">
              <button class="btn-secondary" onclick="closeModal()">CLOSE</button>
            </div>
          `;
    openModal();
    return;
  }

  const t = TASKS.find(x => x.id === taskId);
  if (!t) return;

  document.getElementById('modalContent').innerHTML = `
          <h2 class="modal-title">Submit Task Proof</h2>
          <p class="modal-subtitle" style="margin-bottom:18px;">Upload image/video proof of completing: <strong>${escapeHTML(t.title)}</strong></p>
          <form id="submitProofForm" onsubmit="window.submitTaskProof(event, '${t.id}')">
            <label style="margin-top:14px;">
              Choose Image or Video Proof (Max size 10MB)
              <input type="file" id="proofFileInput" accept="image/*,video/*" onchange="window.previewProofFile(this)" required />
              <div id="proofPreviewContainer" style="margin-top:10px; display:none; text-align:center;">
                <img id="proofImagePreview" class="modal-image-preview" style="max-height:200px; display:none; margin: 0 auto;" />
                <video id="proofVideoPreview" controls style="max-height:200px; max-width:100%; display:none; border-radius:6px; border:1px solid rgba(255,255,255,0.1); margin: 0 auto;"></video>
              </div>
            </label>
            <label style="margin-top:14px;">
              Note for Admins (Optional)
              <textarea id="proofMessageInput" placeholder="Add a note or message for the admins about this task completion..." style="min-height:80px;"></textarea>
            </label>
            <div style="display:flex; gap:14px; justify-content:flex-end; margin-top:24px; flex-wrap:wrap;">
              <button type="button" class="btn-secondary" onclick="window.openTaskModal('${t.id}')">BACK</button>
              <button type="submit" class="btn-primary"><span>SUBMIT</span></button>
            </div>
            <p id="proofSubmitError" style="margin-top:14px; color:#ff7b7b; font-size:0.9rem; min-height:20px;"></p>
          </form>
        `;
  openModal();
}

async function submitTaskProof(event, taskId) {
  event.preventDefault();
  const t = TASKS.find(x => x.id === taskId);
  if (!t) return;

  const errorEl = document.getElementById('proofSubmitError');
  const message = document.getElementById('proofMessageInput').value.trim();
  const imgPreview = document.getElementById('proofImagePreview');
  const vidPreview = document.getElementById('proofVideoPreview');

  if (!CURRENT_USER) {
    if (errorEl) errorEl.textContent = 'You must be logged in to submit proof.';
    return;
  }

  let fileData = '';
  let fileType = '';

  if (imgPreview && imgPreview.style.display === 'block') {
    fileData = imgPreview.src;
    fileType = 'image';
  } else if (vidPreview && vidPreview.style.display === 'block') {
    fileData = vidPreview.src;
    fileType = 'video';
  }

  if (!fileData) {
    if (errorEl) errorEl.textContent = 'Please choose a valid image or video file.';
    return;
  }

  try {
    if (errorEl) errorEl.textContent = 'Submitting proof...';

    await addDoc(collection(db, 'logs'), {
      taskId: taskId,
      taskTitle: t.title,
      taskName: t.title,
      username: CURRENT_USER.ingameName || CURRENT_USER.name || 'Member',
      email: CURRENT_USER.email,
      proofFile: fileData,
      media: fileData,
      fileType: fileType,
      message: message,
      submittedAt: serverTimestamp(),
      timestamp: serverTimestamp()
    });

    const docRef = doc(db, 'tasks', taskId);
    await updateDoc(docRef, {
      completed: true
    });

    closeModal();
    renderTasks();
  } catch (err) {
    console.error("Error submitting task proof:", err);
    if (errorEl) errorEl.textContent = 'Submission failed: ' + err.message;
  }
}

// REPLACED BY FIRESTORE: deleteTask function
// Now handled by deleteTaskFromFirestore

// REPLACED BY FIRESTORE: completeTask function
// Now handled by completeTaskInFirestore

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
        <button type="button" class="btn-secondary" style="padding: 10px 20px; font-family: 'Orbitron', sans-serif; font-size: 0.65rem; letter-spacing: 0.15em;" onclick="openEditAnnouncementModal('${a.id}')">EDIT</button>
        <button type="button" class="btn-primary" style="padding: 10px 20px; font-family: 'Orbitron', sans-serif; font-size: 0.65rem; letter-spacing: 0.15em; background: linear-gradient(135deg, var(--crimson-deep), var(--crimson)); border: none;" onclick="requestDeleteAnnouncement('${a.id}')">DELETE</button>
      ` : ''}
      <button type="button" class="btn-secondary" onclick="closeModal()">CLOSE</button>
    </div>
  `;
  openModal();
}

function requestDeleteAnnouncement(id) {
  if (!isAdmin()) {
    document.getElementById('modalContent').innerHTML = `
      <h2 class="modal-title">Admin Only</h2>
      <p class="modal-subtitle">Only admins can delete announcements.</p>
      <div style="display:flex;gap:14px;justify-content:flex-end;flex-wrap:wrap;margin-top:18px;">
        <button type="button" class="btn-secondary" onclick="openAnnouncementModal('${id}')">BACK</button>
      </div>
    `;
    return;
  }
  document.getElementById('modalContent').innerHTML = `
    <h2 class="modal-title">Confirm Delete Announcement</h2>
    <p class="modal-subtitle" style="margin-bottom:18px;">Are you sure you want to delete this announcement?</p>
    <div style="display:flex;gap:14px;justify-content:flex-end;flex-wrap:wrap;">
      <button type="button" class="btn-secondary" onclick="openAnnouncementModal('${id}')">CANCEL</button>
      <button type="button" class="btn-primary" onclick="confirmDeleteAnnouncement('${id}')"><span>DELETE</span></button>
    </div>
    <p id="announceDeleteError" style="margin-top:14px;color:#ff7b7b;font-size:0.9rem;min-height:20px;"></p>
  `;
}

function verifyAndDeleteAnnouncement(id) {
  // kept for compatibility; not used
}

// FIREBASE: Delete announcement from Firestore
async function confirmDeleteAnnouncement(id) {
  const errorEl = document.getElementById('announceDeleteError');
  if (!isAdmin()) {
    if (errorEl) errorEl.textContent = 'Only admins can delete announcements.';
    return;
  }
  try {
    await deleteAnnouncementFromFirestore(id);
    closeModal();
    renderAnnouncements();
  } catch (error) {
    if (errorEl) errorEl.textContent = 'Error deleting announcement: ' + error.message;
  }
}

function openEditAnnouncementModal(id) {
  const a = ANNOUNCEMENTS.find(x => x.id === id);
  if (!a) return;

  document.getElementById('modalContent').innerHTML = `
          <h2 class="modal-title">Edit Announcement</h2>
          <p class="modal-subtitle" style="margin-bottom:18px;">Update the announcement details.</p>
          <form id="editAnnouncementForm" onsubmit="submitEditAnnouncement(event, '${a.id}')">
            <label style="margin-bottom:14px;">
              Announcement Type
              <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:8px;">
                <button type="button" class="task-type-btn ${a.category === 'update' ? 'selected' : ''}" onclick="selectAnnouncementType('update', this)">UPDATE</button>
                <button type="button" class="task-type-btn ${a.category === 'event' ? 'selected' : ''}" onclick="selectAnnouncementType('event', this)">EVENT</button>
                <button type="button" class="task-type-btn ${a.category === 'alert' ? 'selected' : ''}" onclick="selectAnnouncementType('alert', this)">ALERT</button>
                <button type="button" class="task-type-btn ${a.category === 'recruit' ? 'selected' : ''}" onclick="selectAnnouncementType('recruit', this)">RECRUIT</button>
                <button type="button" class="task-type-btn ${a.category === 'decree' ? 'selected' : ''}" onclick="selectAnnouncementType('decree', this)">DECREE</button>
              </div>
              <input type="hidden" id="announceCategory" value="${a.category}" required />
            </label>
            <label>
              Title
              <input type="text" id="announceTitle" placeholder="Enter headline" value="${escapeHTML(a.title)}" required />
            </label>
            <label>
              Body
              <textarea id="announceBody" placeholder="Write the announcement details" required>${escapeHTML(a.body)}</textarea>
            </label>
            <label style="margin-top: 14px;">
              Update Image (Optional)
              <input type="file" id="announceImageFile" accept="image/*" onchange="window.previewImageUpload(this, 'announceImagePreview')" />
              <div style="margin-top:8px; display:flex; gap:10px; align-items:center;">
                <img id="announceImagePreview" class="modal-image-preview" src="${a.imageUrl || ''}" style="${a.imageUrl ? '' : 'display:none;'}" />
                ${a.imageUrl ? `<button type="button" class="btn-secondary" style="padding: 5px 10px; font-size: 0.6rem;" onclick="window.removePreviewImage('announceImagePreview')">REMOVE</button>` : ''}
              </div>
            </label>
            <div style="display:flex;gap:14px;justify-content:flex-end;margin-top:18px;flex-wrap:wrap;">
              <button type="button" class="btn-secondary" onclick="openAnnouncementModal('${a.id}')">CANCEL</button>
              <button type="submit" class="btn-primary"><span>SAVE CHANGES</span></button>
            </div>
            <p id="announceEditFormError" style="margin-top:14px;color:#ff7b7b;font-size:0.9rem;min-height:20px;"></p>
          </form>
        `;
}

async function submitEditAnnouncement(event, id) {
  event.preventDefault();
  const category = document.getElementById('announceCategory').value;
  const title = document.getElementById('announceTitle').value.trim();
  const body = document.getElementById('announceBody').value.trim();
  const errorEl = document.getElementById('announceEditFormError');
  const imgPreview = document.getElementById('announceImagePreview');
  const imageUrl = imgPreview && imgPreview.src ? imgPreview.src : '';

  if (!category || !title || !body) {
    if (errorEl) errorEl.textContent = 'All fields are required.';
    return;
  }

  try {
    const docRef = doc(db, 'announcements', id);
    await updateDoc(docRef, {
      category: category,
      title: title,
      content: body,
      imageUrl: imageUrl
    });
    closeModal();
  } catch (error) {
    if (errorEl) errorEl.textContent = 'Error updating announcement: ' + error.message;
  }
}

// REPLACED BY FIRESTORE: old deleteAnnouncement function now handled by deleteAnnouncementFromFirestore

// ══════════════════════════════════════
//  MODAL
// ══════════════════════════════════════
function openModal() {
  document.getElementById('modal').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeModal() {
  document.getElementById('modal').classList.remove('open');
  document.body.style.overflow = '';
}
function closeModalOnOverlay(e) {
  if (e.target === document.getElementById('modal')) closeModal();
}
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

// ══════════════════════════════════════

// Expose module functions globally for inline event handlers
window.navigate = navigate;
window.toggleMobile = toggleMobile;
window.openLoginModal = openLoginModal;
window.signInWithGoogle = signInWithGoogle;
window.signOutUser = signOutUser;
window.openNewAnnouncementModal = openNewAnnouncementModal;
window.openAssignTaskModal = openAssignTaskModal;
window.openRankModal = openRankModal;
window.openMemberModal = openMemberModal;
window.openTaskModal = openTaskModal;
window.openAnnouncementModal = openAnnouncementModal;
window.openEditTaskModal = openEditTaskModal;
window.openEditAnnouncementModal = openEditAnnouncementModal;
window.submitEditTask = submitEditTask;
window.submitEditAnnouncement = submitEditAnnouncement;
window.requestDeleteTask = requestDeleteTask;
window.confirmDeleteTask = confirmDeleteTask;
window.requestCompleteTask = requestCompleteTask;
window.confirmCompleteTask = confirmCompleteTask;
window.requestDeleteAnnouncement = requestDeleteAnnouncement;
window.confirmDeleteAnnouncement = confirmDeleteAnnouncement;
window.selectTaskType = selectTaskType;
window.selectAnnouncementType = selectAnnouncementType;
window.filterRanks = filterRanks;
window.setRankFilter = setRankFilter;
window.filterMembers = filterMembers;
window.switchTab = switchTab;
window.filterTasks = filterTasks;
window.setTaskFilter = setTaskFilter;
window.filterAnnouncements = filterAnnouncements;
window.setAnnounceFilter = setAnnounceFilter;
window.goPage = goPage;
window.promptProfileSetupModal = promptProfileSetupModal;
window.previewProfileSetupPhoto = previewProfileSetupPhoto;
window.updateProfileSetupInitialsPreview = updateProfileSetupInitialsPreview;
window.updateBioCounter = updateBioCounter;
window.submitProfileSetup = submitProfileSetup;
window.submitAnnouncementForm = submitAnnouncementForm;
window.submitTaskForm = submitTaskForm;
window.closeModalOnOverlay = closeModalOnOverlay;
window.closeModal = closeModal;

// Expose Chat Panel functions
window.toggleChatPanel = toggleChatPanel;
window.closeChatPanel = closeChatPanel;
window.goBackToUserList = goBackToUserList;
window.openChatWithUser = openChatWithUser;
window.sendChatMessage = sendChatMessage;
window.handleTypingInput = handleTypingInput;
window.removeChatMedia = removeChatMedia;

// Expose Memories functions
window.setupMemoriesListener = setupMemoriesListener;
window.filterMemories = filterMemories;
window.openImageFullModal = openImageFullModal;
window.requestDeleteMemory = requestDeleteMemory;
window.confirmDeleteMemory = confirmDeleteMemory;
window.openMediaFullModal = openMediaFullModal;
window.openUploadImageModal = openUploadImageModal;
window.submitUploadMemory = submitUploadMemory;
window.openWallOfHonorModal = openWallOfHonorModal;
window.previewImageUpload = previewImageUpload;
window.removePreviewImage = removePreviewImage;

// Expose PWs List & Proof submission functions
window.openPWsModal = openPWsModal;
window.copyPWCmd = copyPWCmd;
window.previewProofFile = previewProofFile;
window.openSubmitProofModal = openSubmitProofModal;
window.submitTaskProof = submitTaskProof;
window.openTaskProofsListModal = openTaskProofsListModal;
window.openSingleProofDetailModal = openSingleProofDetailModal;

//  INIT
// ══════════════════════════════════════
window.addEventListener('load', () => {
  // Initialize active links based on body ID or active sections
  const activeSection = document.querySelector('section.page.active');
  if (activeSection) {
    const activePageId = activeSection.id.replace('-page', '');
    currentPage = activePageId;
    document.querySelectorAll('.nav-link, .mobile-nav-link').forEach(a => {
      a.classList.toggle('active', a.dataset.page === activePageId);
    });
  }

  // Page-specific setup based on what exists
  if (document.getElementById('rankGrid')) renderRanks();
  if (document.getElementById('execGrid') || document.getElementById('mgmtGrid')) {
    renderMembers('exec');
    renderMembers('mgmt');
  }
  if (document.getElementById('taskGrid')) renderTasks();
  if (document.getElementById('announceGrid')) renderAnnouncements();
  if (document.getElementById('memoriesGrid')) setupMemoriesListener();

  setTimeout(() => {
    isTimerFinished = true;
    tryHideLoader();
    spawnParticles();
    animateCounters();
    setupDragAndDropListeners();
  }, 2000);

  // Fallback to force hide loader if auth initialization takes too long (e.g. offline/error)
  setTimeout(() => {
    isAuthInitialized = true;
    tryHideLoader();
  }, 5000);
});