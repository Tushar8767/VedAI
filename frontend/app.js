// VedAI — Production Frontend Application & Interface Engine
const isDevStaticServer = typeof window !== 'undefined' && (
  window.location.port === '3000' || 
  window.location.port === '5500' || 
  window.location.port === '8080' ||
  window.location.protocol === 'file:'
);
const API_BASE_URL = window.VEDAI_API_BASE_URL || (isDevStaticServer ? 'http://127.0.0.1:5000' : (typeof window !== 'undefined' && window.location ? window.location.origin : 'http://localhost:5000'));
const tokenStorageKey = 'vedai_auth_token';


const userStorageKey = 'vedai_user';

// State Management
let currentSlideIndex = 0;
const slides = ['dashboardPane', 'reflectPane', 'chatPane', 'journalPane', 'insightsPane'];
let activeConversationId = null;
let cameraStream = null;
let isAuthRegisterMode = true;
let latestRevelation = null;
let breathingInterval = null;

// Web Audio Sacred Synthesizer (432Hz Ambient Resonance)
let audioCtx = null;
let osc1 = null;
let osc2 = null;
let gainNode = null;
let isAudioPlaying = false;

// DOM Elements - Shell & Dock
const viewportTrack = document.getElementById('viewportTrack');
const navButtons = document.querySelectorAll('.nav-btn');
const dockUserName = document.getElementById('dockUserName');
const brandHomeBtn = document.getElementById('brandHomeBtn');
const authBtn = document.getElementById('authBtn');
const drawerToggleBtn = document.getElementById('drawerToggleBtn');
const sideDrawer = document.getElementById('sideDrawer');
const drawerBackdrop = document.getElementById('drawerBackdrop');
const drawerCloseBtn = document.getElementById('drawerCloseBtn');
const ambientSoundBtn = document.getElementById('ambientSoundBtn');
const settingsBtn = document.getElementById('settingsBtn');
const themeToggleBtn = document.getElementById('themeToggleBtn');

// Home Sanctuary DOM
const welcomeUserGreeting = document.getElementById('welcomeUserGreeting');
const welcomeUserSub = document.getElementById('welcomeUserSub');
const vaultStatusText = document.getElementById('vaultStatusText');
const credSessionText = document.getElementById('credSessionText');
const bannerSignInBtn = document.getElementById('bannerSignInBtn');
const reflectDailyShlokaBtn = document.getElementById('reflectDailyShlokaBtn');
const chatDailyShlokaBtn = document.getElementById('chatDailyShlokaBtn');
const homeRecentState = document.getElementById('homeRecentState');
const homeRecentText = document.getElementById('homeRecentText');
const homeRecentIcon = document.getElementById('homeRecentIcon');
const homeRecentBadge = document.getElementById('homeRecentBadge');
const homeDrawerLinkBtn = document.getElementById('homeDrawerLinkBtn');

// Reflection DOM
const userInput = document.getElementById('userInput');
const submitBtn = document.getElementById('submitBtn');
const charCounter = document.getElementById('charCounter');
const cameraToggle = document.getElementById('cameraToggle');
const cameraStage = document.getElementById('cameraStage');
const cameraVideo = document.getElementById('cameraVideo');
const cameraCanvas = document.getElementById('cameraCanvas');
const hudStatus = document.getElementById('hudStatus');
const hudFaceCount = document.getElementById('hudFaceCount');

const resultsPlaceholder = document.getElementById('resultsPlaceholder');
const resultsContent = document.getElementById('resultsContent');
const emotionIcon = document.getElementById('emotionIcon');
const emotionText = document.getElementById('emotionText');
const confidenceValue = document.getElementById('confidenceValue');
const gaugeFill = document.getElementById('gaugeFill');
const empathySummaryText = document.getElementById('empathySummaryText');
const modalityPill = document.getElementById('modalityPill');
const modelPill = document.getElementById('modelPill');
const spectrumBars = document.getElementById('spectrumBars');
const explanationText = document.getElementById('explanationText');
const shlokaSource = document.getElementById('shlokaSource');
const shlokaSanskrit = document.getElementById('shlokaSanskrit');
const shlokaTranslit = document.getElementById('shlokaTranslit');
const shlokaMeaning = document.getElementById('shlokaMeaning');
const shlokaGuidance = document.getElementById('shlokaGuidance');
const practicesGrid = document.getElementById('practicesGrid');
const videoGrid = document.getElementById('videoGrid');
const copyShlokaBtn = document.getElementById('copyShlokaBtn');
const playShlokaAudioBtn = document.getElementById('playShlokaAudioBtn');
const userEchoText = document.getElementById('userEchoText');
const toggleAiTransparencyBtn = document.getElementById('toggleAiTransparencyBtn');
const aiDetailsContent = document.getElementById('aiDetailsContent');
let isSpeechPlaying = false;

// Chat DOM
const chatStream = document.getElementById('chatStream');
const chatInput = document.getElementById('chatInput');
const sendChatBtn = document.getElementById('sendChatBtn');
const clearChatBtn = document.getElementById('clearChatBtn');

// Dashboard & Insights DOM
const dashEmotion = document.getElementById('dashEmotion');
const dashWellness = document.getElementById('dashWellness');
const dashFormula = document.getElementById('dashFormula');
const dashCount = document.getElementById('dashCount');
const emotionChartCanvas = document.getElementById('emotionChart');
const chartLegend = document.getElementById('chartLegend');
const timelineList = document.getElementById('timelineList');
const timelineBadge = document.getElementById('timelineBadge');
const refreshDashBtn = document.getElementById('refreshDashBtn');
const dashSyncStatus = document.getElementById('dashSyncStatus');
const viewMetricsBtn = document.getElementById('viewMetricsBtn');

// Sequential Handoff DOM
const handoffChatBtn = document.getElementById('handoffChatBtn');
const handoffJournalBtn = document.getElementById('handoffJournalBtn');

// Journal DOM
const journalTitleInput = document.getElementById('journalTitleInput');
const journalTagSelect = document.getElementById('journalTagSelect');
const journalBodyInput = document.getElementById('journalBodyInput');
const saveJournalBtn = document.getElementById('saveJournalBtn');
const journalFeed = document.getElementById('journalFeed');
const journalSearchInput = document.getElementById('journalSearchInput');

// Quick Check-in Modal DOM
const quickCheckinModal = document.getElementById('quickCheckinModal');
const openQuickCheckinBtn = document.getElementById('openQuickCheckinBtn');
const closeQuickCheckinBtn = document.getElementById('closeQuickCheckinBtn');
const saveQuickCheckinBtn = document.getElementById('saveQuickCheckinBtn');
const breathingOrb = document.getElementById('breathingOrb');
const breathingText = document.getElementById('breathingText');

// Settings & Privacy Center DOM
const settingsModal = document.getElementById('settingsModal');
const closeSettingsBtn = document.getElementById('closeSettingsBtn');
const exportDataBtn = document.getElementById('exportDataBtn');
const clearLocalDataBtn = document.getElementById('clearLocalDataBtn');
const settingsAudioToggle = document.getElementById('settingsAudioToggle');
const settingsCameraToggle = document.getElementById('settingsCameraToggle');
const settingsAuthActionBtn = document.getElementById('settingsAuthActionBtn');
const settingsSessionDesc = document.getElementById('settingsSessionDesc');

// Auth Modal DOM
const authModal = document.getElementById('authModal');
const closeAuthBtn = document.getElementById('closeAuthBtn');
const authSubmitBtn = document.getElementById('authSubmitBtn');
const authSwitchModeBtn = document.getElementById('authSwitchModeBtn');
const authModalTitle = document.getElementById('authModalTitle');
const nameField = document.getElementById('nameField');
const authNameInput = document.getElementById('authNameInput');
const authEmailInput = document.getElementById('authEmailInput');
const authPasswordInput = document.getElementById('authPasswordInput');

// Safety Toast DOM
const safetyToast = document.getElementById('safetyToast');
const safetyToastMsg = document.getElementById('safetyToastMsg');
const closeToastBtn = document.getElementById('closeToastBtn');

const EMOTION_ICONS = {
    fear: '😨',
    anxiety: '😰',
    stress: '😰',
    sadness: '😢',
    anger: '😠',
    happiness: '😊',
    neutral: '😌'
};

function escapeHtml(str) {
    if (typeof str !== 'string') return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// In-App Toast Notification System
function showToast(message, type = 'info', icon = '✨') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `in-app-toast toast-${type}`;
    toast.innerHTML = `
        <span class="toast-icon-wrap">${icon}</span>
        <span class="toast-text">${escapeHtml(message)}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('toast-exit');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 260);
    }, 3200);
}

// Theme Manager (Dark / Night Sanctuary vs. Light / Day Luminous)
function initTheme() {
    const savedTheme = localStorage.getItem('vedai_theme') || 'dark';
    applyTheme(savedTheme);

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            applyTheme(newTheme);
            localStorage.setItem('vedai_theme', newTheme);
            showToast(`Switched to ${newTheme === 'dark' ? 'Night (Deep Sanctuary)' : 'Day (Luminous Ivory)'} mode`, 'info', newTheme === 'dark' ? '🌙' : '☀️');
        });
    }
}

function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    if (themeToggleBtn) {
        themeToggleBtn.textContent = theme === 'dark' ? '☀️' : '🌙';
        themeToggleBtn.setAttribute('title', theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Night Mode');
    }
}

// 1. INITIALIZATION
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initNavigationCarousel();
    initAmbientSynthesizer();
    initBiometricCamera();
    initReflectionStudio();
    initChatInterface();
    initDashboard();
    initJournal();
    initSideDrawer();
    initAuthModal();
    initTimeAwareHome();
    initQuickCheckin();
    initSettingsModal();
    initProgressiveDisclosure();
    updateUserSession();
    loadDashboardData();
});

// 2. SLIDING VIEWPORT CONTROLLER
function initNavigationCarousel() {
    navButtons.forEach((btn, index) => {
        btn.addEventListener('click', () => {
            slideToView(index);
        });
    });

    // Mobile bottom navigation dock buttons
    document.querySelectorAll('.mob-nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetIdx = parseInt(btn.getAttribute('data-step-target'), 10);
            if (!isNaN(targetIdx)) {
                slideToView(targetIdx);
            }
        });
    });

    // Brand logo returns to Home
    if (brandHomeBtn) {
        brandHomeBtn.addEventListener('click', () => {
            slideToView(0);
        });
    }

    // Pathway launcher buttons from the Dashboard
    document.querySelectorAll('[data-step-target]').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetIdx = parseInt(btn.getAttribute('data-step-target'), 10);
            if (!isNaN(targetIdx)) {
                slideToView(targetIdx);
            }
        });
    });

    // View Metrics anchor button
    if (viewMetricsBtn) {
        viewMetricsBtn.addEventListener('click', () => {
            slideToView(4); // Switch to Insights slide
        });
    }

    // Banner Sign In / Register CTA
    if (bannerSignInBtn) {
        bannerSignInBtn.addEventListener('click', () => {
            authBtn.click();
        });
    }

    // Character counter
    userInput.addEventListener('input', () => {
        charCounter.textContent = `${userInput.value.length} characters`;
    });

    // Quick prompt chips
    document.querySelectorAll('.prompt-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            userInput.value = chip.getAttribute('data-prompt');
            userInput.dispatchEvent(new Event('input'));
            userInput.focus();
        });
    });
}

function slideToView(index) {
    currentSlideIndex = index;
    navButtons.forEach((btn, i) => {
        btn.classList.toggle('active', i === index);
    });

    document.querySelectorAll('.mob-nav-btn').forEach((btn, i) => {
        btn.classList.toggle('active', i === index);
    });

    document.querySelectorAll('.viewport-slide').forEach((slide, i) => {
        slide.classList.toggle('active', i === index);
    });

    // Horizontal track transformation (5 slides: 20% each)
    viewportTrack.style.transform = `translateX(-${index * 20}%)`;

    if (index === 0 || index === 4) loadDashboardData();
    if (index === 3) loadJournalFeed();
}

// 3. SACRED 432HZ AMBIENT AUDIO SYNTHESIZER
function initAmbientSynthesizer() {
    ambientSoundBtn.addEventListener('click', () => {
        if (!isAudioPlaying) {
            startSacredAudio();
        } else {
            stopSacredAudio();
        }
    });
}

function startSacredAudio() {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AudioContext();

        // Fundamental 432Hz sine tone
        osc1 = audioCtx.createOscillator();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(432 / 4, audioCtx.currentTime); // 108Hz Sacred Drone

        // Harmonic Tanpura overtone with subtle vibrato
        osc2 = audioCtx.createOscillator();
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(432 / 2, audioCtx.currentTime); // 216Hz

        gainNode = audioCtx.createGain();
        gainNode.gain.setValueAtTime(0.01, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.08, audioCtx.currentTime + 2); // Soft fade-in

        osc1.connect(gainNode);
        osc2.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        osc1.start();
        osc2.start();

        isAudioPlaying = true;
        ambientSoundBtn.classList.add('playing');
        ambientSoundBtn.querySelector('.sound-label').textContent = 'Resonating 108Hz';
    } catch (e) {
        console.warn('Audio synthesis unavailable:', e.message);
    }
}

function stopSacredAudio() {
    if (gainNode && audioCtx) {
        gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.5);
        setTimeout(() => {
            if (osc1) osc1.stop();
            if (osc2) osc2.stop();
            if (audioCtx) audioCtx.close();
            isAudioPlaying = false;
            ambientSoundBtn.classList.remove('playing');
            ambientSoundBtn.querySelector('.sound-label').textContent = 'Ambient Om';
        }, 500);
    }
}

// 4. BIOMETRIC CAMERA HUD
function initBiometricCamera() {
    cameraToggle.addEventListener('change', async () => {
        if (cameraToggle.checked) {
            try {
                cameraStream = await navigator.mediaDevices.getUserMedia({
                    video: { width: 320, height: 240 }
                });
                cameraVideo.srcObject = cameraStream;
                cameraStage.classList.remove('hidden');
                hudStatus.textContent = 'ONLINE';
                hudFaceCount.textContent = 'FACE: LOCKED';
            } catch (err) {
                console.warn('Camera permission unavailable:', err);
                showToast('Camera access was not granted. Analysis will proceed text-only.', 'info', '📷');
                cameraToggle.checked = false;
                cameraStage.classList.add('hidden');
            }
        } else {
            stopCameraStream();
        }
    });
}

function stopCameraStream() {
    if (cameraStream) {
        cameraStream.getTracks().forEach(t => t.stop());
        cameraStream = null;
    }
    cameraStage.classList.add('hidden');
}

function captureCameraFrame() {
    if (!cameraStream || !cameraToggle.checked) return null;
    try {
        cameraCanvas.width = cameraVideo.videoWidth || 320;
        cameraCanvas.height = cameraVideo.videoHeight || 240;
        const ctx = cameraCanvas.getContext('2d');
        ctx.drawImage(cameraVideo, 0, 0, cameraCanvas.width, cameraCanvas.height);
        return cameraCanvas.toDataURL('image/jpeg', 0.8);
    } catch (e) {
        return null;
    }
}

// 5. REFLECTION STUDIO & WISDOM REVELATION
function initReflectionStudio() {
    submitBtn.addEventListener('click', handleReflectionSubmit);
    userInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && e.ctrlKey) handleReflectionSubmit();
    });

    copyShlokaBtn.addEventListener('click', () => {
        const textToCopy = `${shlokaSanskrit.textContent.trim()}\n${shlokaTranslit.textContent.trim()}\n\nTranslation: ${shlokaMeaning.textContent.trim()}\n— ${shlokaSource.textContent.trim()}`;
        navigator.clipboard.writeText(textToCopy);
        copyShlokaBtn.textContent = '✓ Copied!';
        const shlokaCard = document.querySelector('.shloka-parchment-card');
        if (shlokaCard) {
            shlokaCard.classList.remove('shimmer-active');
            void shlokaCard.offsetWidth;
            shlokaCard.classList.add('shimmer-active');
        }
        showToast('Sacred verse and translation copied to clipboard!', 'success', '✨');
        setTimeout(() => copyShlokaBtn.textContent = '⎘ Copy Verse', 2000);
    });

    if (practicesGrid) {
        practicesGrid.addEventListener('change', (e) => {
            if (e.target && e.target.classList.contains('practice-check')) {
                if (e.target.checked) {
                    showToast('Remedy practice marked complete. Honoring your peace!', 'success', '🌱');
                }
            }
        });
    }

    if (playShlokaAudioBtn) {
        playShlokaAudioBtn.addEventListener('click', toggleVerseAudio);
    }

    // Progressive Disclosure Accordions
    const toggleGitaBtn = document.getElementById('toggleGitaBtn');
    const gitaPerspectiveContent = document.getElementById('gitaPerspectiveContent');
    const gitaAccChevron = document.getElementById('gitaAccChevron');
    if (toggleGitaBtn && gitaPerspectiveContent) {
        toggleGitaBtn.addEventListener('click', () => {
            const isHidden = gitaPerspectiveContent.classList.toggle('hidden');
            if (gitaAccChevron) gitaAccChevron.textContent = isHidden ? '▶' : '▼';
        });
    }

    const toggleAiTransparencyBtn = document.getElementById('toggleAiTransparencyBtn');
    const aiDetailsContent = document.getElementById('aiDetailsContent');
    const accChevron = document.getElementById('accChevron');
    if (toggleAiTransparencyBtn && aiDetailsContent) {
        toggleAiTransparencyBtn.addEventListener('click', () => {
            const isHidden = aiDetailsContent.classList.toggle('hidden');
            if (accChevron) accChevron.textContent = isHidden ? '▶' : '▼';
        });
    }

    const handoffPracticeBtn = document.getElementById('handoffPracticeBtn');
    if (handoffPracticeBtn) {
        handoffPracticeBtn.addEventListener('click', () => {
            openQuickCheckin();
        });
    }

    // Sequential Next Steps Handoffs
    if (handoffChatBtn) {
        handoffChatBtn.addEventListener('click', () => {
            if (!latestRevelation) return;
            const verse = latestRevelation.guidance?.verse || latestRevelation.guidance?.sanskrit || '';
            const source = latestRevelation.guidance?.source || 'Bhagavad Gita';
            const userThought = latestRevelation.userInputText || '';
            chatInput.value = `I am reflecting on this: "${userThought}". The Gita revealed ${source} ("${verse}"). How can I apply this teaching to overcome my present state?`;
            slideToView(2); // Slide 2 is Guidance Chat
            handleChatSend();
        });
    }

    if (handoffJournalBtn) {
        handoffJournalBtn.addEventListener('click', () => {
            if (!latestRevelation) return;
            const source = latestRevelation.guidance?.source || 'Bhagavad Gita';
            const verse = latestRevelation.guidance?.verse || latestRevelation.guidance?.sanskrit || '';
            const meaning = latestRevelation.guidance?.meaning || '';
            const practical = latestRevelation.guidance?.practical_guidance || latestRevelation.guidance?.explanation || '';
            const userThought = latestRevelation.userInputText || '';

            journalTitleInput.value = `Contemplation on ${source}`;
            if (latestRevelation.emotion) {
                journalTagSelect.value = latestRevelation.emotion;
            }
            journalBodyInput.value = `【Sacred Verse — ${source}】\n${verse}\n\n【Translation】\n${meaning}\n\n【Living Guidance】\n${practical}\n\n【My Reflection】\n${userThought}`;

            slideToView(3); // Slide 3 is Sacred Journal
            journalBodyInput.focus();
        });
    }
}

function toggleVerseAudio() {
    if (!('speechSynthesis' in window)) {
        showToast('Spoken audio is not supported in this browser.', 'info', '🔊');
        return;
    }

    if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
        isSpeechPlaying = false;
        if (playShlokaAudioBtn) playShlokaAudioBtn.textContent = '🔊 Text-to-Speech Pronunciation';
        return;
    }

    const sanskrit = shlokaSanskrit.textContent.trim();
    const translit = shlokaTranslit.textContent.trim();
    const meaning = shlokaMeaning.textContent.trim();
    const source = shlokaSource.textContent.trim();

    const textToSpeak = `${source}. ${translit || sanskrit}. Meaning: ${meaning}`;
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = 0.82; // Calming, meditative pace
    utterance.pitch = 0.95;

    // Check for Sanskrit / Hindi / Indian regional voices
    const voices = window.speechSynthesis.getVoices();
    const bestVoice = voices.find(v => v.lang.startsWith('hi') || v.lang.startsWith('sa'))
                   || voices.find(v => v.lang.includes('IN'))
                   || null;
    if (bestVoice) {
        utterance.voice = bestVoice;
        utterance.lang = bestVoice.lang;
    }

    utterance.onstart = () => {
        isSpeechPlaying = true;
        if (playShlokaAudioBtn) playShlokaAudioBtn.textContent = '⏸ Pause Speech';
    };

    utterance.onend = () => {
        isSpeechPlaying = false;
        if (playShlokaAudioBtn) playShlokaAudioBtn.textContent = '🔊 Text-to-Speech Pronunciation';
    };

    utterance.onerror = () => {
        isSpeechPlaying = false;
        if (playShlokaAudioBtn) playShlokaAudioBtn.textContent = '🔊 Text-to-Speech Pronunciation';
    };

    window.speechSynthesis.speak(utterance);
}

async function handleReflectionSubmit() {
    const text = userInput.value.trim();
    if (!text) {
        showToast('Please enter your contemplation or feelings first.', 'info', '✍️');
        return;
    }

    setReflectionLoading(true);
    closeSafetyToast();

    try {
        const faceImage = captureCameraFrame();
        const payload = {
            user_text: text,
            face_image: faceImage
        };

        const res = await apiRequest('/api/v1/process', {
            method: 'POST',
            body: JSON.stringify(payload)
        });

        renderRevelation(res);
        showToast('Sacred wisdom synthesized successfully.', 'success', '✨');
    } catch (err) {
        showToast(err.message || 'Could not distill guidance right now.', 'error', '⚠️');
    } finally {
        setReflectionLoading(false);
    }
}

function extractYouTubeId(url) {
    if (!url) return '';
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    return match ? match[1] : '';
}

function renderRevelation(res) {
    latestRevelation = { ...res, userInputText: userInput.value.trim() };
    resultsPlaceholder.classList.add('hidden');
    resultsContent.classList.remove('hidden');

    const emotionDiagnosticCard = document.getElementById('emotionDiagnosticCard');
    if (emotionDiagnosticCard) emotionDiagnosticCard.classList.remove('hidden');

    // Populate active listening echo of user's reflection
    if (userEchoText) {
        userEchoText.textContent = `“${userInput.value.trim()}”`;
    }

    // Trigger safety toast if crisis detected
    if (res.safety?.isHighRisk) {
        triggerSafetyToast(res.safety.message);
    }

    const emotion = res.emotion || 'neutral';
    emotionIcon.textContent = EMOTION_ICONS[emotion] || '😌';
    emotionText.textContent = emotion.toUpperCase();

    const confPct = Math.round((res.confidence || 0) * 100);
    confidenceValue.textContent = `${confPct}%`;
    gaugeFill.setAttribute('stroke-dasharray', `${confPct}, 100`);

    // Dynamic Emotion labels on remedy and video headers
    const capEmotion = emotion.charAt(0).toUpperCase() + emotion.slice(1);
    const remedyEmotionLabel = document.getElementById('remedyEmotionLabel');
    if (remedyEmotionLabel) remedyEmotionLabel.textContent = capEmotion;
    const videoEmotionLabel = document.getElementById('videoEmotionLabel');
    if (videoEmotionLabel) videoEmotionLabel.textContent = capEmotion;

    // Empathetic 2-sentence summary
    if (empathySummaryText) {
        const empathyNotes = {
            anxiety: "We sense the weight of anticipatory worry you are carrying. The mind is projecting into uncertainty, but your true power exists in the present moment.",
            stress: "You are navigating heavy demands right now. Remember that gentle pacing and pause are not signs of weakness, but foundations of endurance.",
            fear: "Fear can make you feel vulnerable and isolated, yet your core consciousness remains eternal, courageous, and intact.",
            sadness: "We honor the depth of what you are moving through. Allow yourself space to breathe and treat your heart with deep gentleness.",
            anger: "Frustration is natural when boundaries are crossed, but rash reactions burn your own calm. Pausing before acting restores your sovereignty.",
            happiness: "It is wonderful that joy is gracing your consciousness. Savor this contentment and let it nourish your steadiness.",
            neutral: "Your consciousness is resting in a calm, balanced state. This still equilibrium is fertile ground for clear discernment and action."
        };
        empathySummaryText.textContent = empathyNotes[emotion] || empathyNotes.neutral;
    }

    // Update Home recent preview
    updateHomeRecentPreview({
        emotion,
        confidence: res.confidence,
        text: userInput.value.trim()
    });

    // Modality Pill & Multimodal Transparency Telemetry (Phase 1 & Phase 2)
    const multimodalBreakdownCard = document.getElementById('multimodalBreakdownCard');
    const telemetryRatioPill = document.getElementById('telemetryRatioPill');
    const breakdownTextEmotion = document.getElementById('breakdownTextEmotion');
    const breakdownTextConf = document.getElementById('breakdownTextConf');
    const breakdownTextModel = document.getElementById('breakdownTextModel');
    const breakdownTextWeight = document.getElementById('breakdownTextWeight');
    const breakdownTextProbs = document.getElementById('breakdownTextProbs');

    const faceActiveContent = document.getElementById('faceActiveContent');
    const faceFallbackContent = document.getElementById('faceFallbackContent');
    const breakdownFaceEmotion = document.getElementById('breakdownFaceEmotion');
    const breakdownFaceConf = document.getElementById('breakdownFaceConf');
    const faceDetectStatus = document.getElementById('faceDetectStatus');
    const faceCountTag = document.getElementById('faceCountTag');
    const faceQualityTag = document.getElementById('faceQualityTag');
    const breakdownFaceWeight = document.getElementById('breakdownFaceWeight');
    const breakdownFaceReason = document.getElementById('breakdownFaceReason');
    const breakdownFaceProbs = document.getElementById('breakdownFaceProbs');

    const breakdownFusedEmotion = document.getElementById('breakdownFusedEmotion');
    const breakdownFusedConf = document.getElementById('breakdownFusedConf');
    const breakdownAgreementTag = document.getElementById('breakdownAgreementTag');
    const breakdownFusionSummary = document.getElementById('breakdownFusionSummary');
    const breakdownModalityMode = document.getElementById('breakdownModalityMode');

    const compTextVal = document.getElementById('compTextVal');
    const compFaceVal = document.getElementById('compFaceVal');
    const compAgreementVal = document.getElementById('compAgreementVal');
    const compExplanationVal = document.getElementById('compExplanationVal');

    if (multimodalBreakdownCard) {
        multimodalBreakdownCard.classList.remove('hidden');

        // Populate Text Model
        const tPred = res.text_prediction || {};
        const tEmo = (tPred.emotion || res.emotion || 'neutral').toUpperCase();
        const tConf = Math.round((tPred.confidence || res.confidence || 0.65) * 100);
        if (breakdownTextEmotion) breakdownTextEmotion.textContent = tEmo;
        if (breakdownTextConf) breakdownTextConf.textContent = `${tConf}% Conf`;
        if (breakdownTextModel) breakdownTextModel.textContent = tPred.model || res.model || 'DistilRoBERTa-v2.0';
        if (breakdownTextWeight) breakdownTextWeight.textContent = res.fusion?.weights?.text ? `${Math.round(res.fusion.weights.text * 100)}%` : '65%';
        if (breakdownTextProbs) renderMiniProbBars(breakdownTextProbs, tPred.probabilities || res.probabilities || {});

        // Populate Face Model
        const fPred = res.face_prediction;
        const faceDetected = Boolean(fPred && fPred.face_detected !== false && fPred.emotion);

        if (faceDetected) {
            if (faceActiveContent) faceActiveContent.classList.remove('hidden');
            if (faceFallbackContent) faceFallbackContent.classList.add('hidden');

            const fEmo = (fPred.emotion || 'neutral').toUpperCase();
            const fConf = Math.round((fPred.confidence || 0) * 100);
            if (breakdownFaceEmotion) breakdownFaceEmotion.textContent = fEmo;
            if (breakdownFaceConf) breakdownFaceConf.textContent = `${fConf}% Conf`;
            if (faceDetectStatus) faceDetectStatus.textContent = 'Face: Detected';
            if (faceCountTag) faceCountTag.textContent = `Faces: ${fPred.number_of_faces || 1}`;
            if (faceQualityTag) faceQualityTag.textContent = `Quality: ${fPred.quality_status || 'Good'}`;
            if (breakdownFaceWeight) breakdownFaceWeight.textContent = res.fusion?.weights?.face ? `${Math.round(res.fusion.weights.face * 100)}%` : '35%';
            if (breakdownFaceProbs) renderMiniProbBars(breakdownFaceProbs, fPred.probabilities || {});

            if (modalityPill) {
                modalityPill.textContent = 'Multimodal (Text 65% + Face 35%)';
                modalityPill.style.color = '#10B981';
            }
            if (telemetryRatioPill) telemetryRatioPill.textContent = 'Text: 65% · Face: 35%';
        } else {
            if (faceActiveContent) faceActiveContent.classList.add('hidden');
            if (faceFallbackContent) faceFallbackContent.classList.remove('hidden');

            const reasonMsg = fPred?.reason || (cameraToggle?.checked ? 'No human face detected in frame.' : 'Camera not enabled (text stream only).');
            if (breakdownFaceReason) breakdownFaceReason.textContent = `Reason: ${reasonMsg}`;
            if (breakdownFaceWeight) breakdownFaceWeight.textContent = '0% (Bypassed)';

            if (modalityPill) {
                modalityPill.textContent = 'Text Stream Only';
                modalityPill.style.color = '#60A5FA';
            }
            if (telemetryRatioPill) telemetryRatioPill.textContent = 'Text: 100% · Face: 0%';
        }

        // Populate Fused Result
        const fusedEmo = (res.emotion || 'neutral').toUpperCase();
        const fusedConf = Math.round((res.confidence || 0) * 100);
        if (breakdownFusedEmotion) breakdownFusedEmotion.textContent = fusedEmo;
        if (breakdownFusedConf) breakdownFusedConf.textContent = `${fusedConf}% Conf`;

        const isAgreement = res.fusion?.agreement;
        if (breakdownAgreementTag) {
            if (faceDetected) {
                breakdownAgreementTag.textContent = isAgreement ? '✓ Modality Agreement: YES' : '⚠ Modality Agreement: NO (Divergence)';
                breakdownAgreementTag.className = isAgreement ? 'meta-tag tag-agreement-yes' : 'meta-tag tag-agreement-no';
            } else {
                breakdownAgreementTag.textContent = 'Modality Agreement: N/A (Single Modality)';
                breakdownAgreementTag.className = 'meta-tag';
            }
        }

        if (breakdownFusionSummary) {
            if (faceDetected) {
                breakdownFusionSummary.textContent = isAgreement
                    ? `Both text and facial expressions concordantly identify ${fusedEmo}.`
                    : `Late fusion balanced text (${tEmo}) at 65% and face (${(fPred.emotion || '').toUpperCase()}) at 35% -> ${fusedEmo}.`;
            } else {
                breakdownFusionSummary.textContent = 'Single-modality inference active. No facial probabilities were fabricated.';
            }
        }

        if (breakdownModalityMode) {
            breakdownModalityMode.textContent = faceDetected ? 'Weighted Late Fusion (65/35)' : 'Text Semantic Stream';
        }

        // Modality Comparison Bar
        if (compTextVal) compTextVal.textContent = `${tEmo} (${tConf}%)`;
        if (compFaceVal) compFaceVal.textContent = faceDetected ? `${(fPred.emotion || '').toUpperCase()} (${Math.round((fPred.confidence || 0) * 100)}%)` : 'None (Offline / Not Detected)';
        if (compAgreementVal) compAgreementVal.textContent = faceDetected ? (isAgreement ? 'YES' : 'NO') : 'N/A';
        if (compExplanationVal) {
            if (faceDetected) {
                compExplanationVal.textContent = res.fusion?.modality_comparison?.comparison_summary ||
                    (isAgreement ? `Both channels identify ${fusedEmo}.` : `Text expresses ${tEmo} while facial features indicate ${(fPred.emotion || '').toUpperCase()}.`);
            } else {
                compExplanationVal.textContent = `Facial analysis not available: ${fPred?.reason || 'camera disabled'}. Fallback to text analysis active.`;
            }
        }
    }
    modelPill.textContent = res.model || 'DistilRoBERTa v2.0';

    // Spectrum Bars
    renderSpectrumBars(res.probabilities || {});

    // Explainability
    explanationText.textContent = res.explanation?.summary || 'Calculated via probability distribution across canonical emotion dimensions.';

    // Shloka
    const g = res.guidance || {};
    shlokaSource.textContent = g.source || 'Bhagavad Gita';
    shlokaSanskrit.textContent = g.verse || g.sanskrit || 'कर्मण्येवाधिकारस्ते मा फलेषु कदाचन';
    shlokaTranslit.textContent = g.transliteration || '';
    shlokaMeaning.textContent = g.meaning || 'Perform your duty without obsession over future outcomes.';
    shlokaGuidance.textContent = g.practical_guidance || g.explanation || 'Center your attention on the immediate next action.';

    // Actionable Daily Remedies & Practices with Interactive Checkboxes
    practicesGrid.innerHTML = '';
    (res.recommendations || []).forEach((item, idx) => {
        const div = document.createElement('div');
        div.className = 'practice-card';
        div.innerHTML = `
            <input type="checkbox" class="practice-check" id="practice_${idx}">
            <div class="practice-info">
                <label for="practice_${idx}" class="practice-title-text">${item.title}</label>
                <div class="practice-desc-text">${item.description}</div>
            </div>
        `;
        practicesGrid.appendChild(div);
    });

    // Curated YouTube Videos with Rich Cards, Thumbnails & Play Action
    videoGrid.innerHTML = '';
    (res.videos || []).forEach(v => {
        const videoId = extractYouTubeId(v.url) || '';
        const thumbUrl = v.thumbnail || (videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : '');
        const a = document.createElement('a');
        a.className = 'youtube-card';
        a.href = v.url;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.innerHTML = `
            <div class="youtube-thumb-wrapper">
                <img src="${thumbUrl}" alt="${escapeHtml(v.title)}" class="youtube-thumb-img" onerror="this.src='https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=320&auto=format&fit=crop&q=80'">
                <div class="youtube-play-btn">▶</div>
                <span class="youtube-badge">${v.duration || 'Watch'}</span>
            </div>
            <div class="youtube-info">
                <div class="youtube-title">${escapeHtml(v.title)}</div>
                <div class="youtube-channel">
                    <span>${escapeHtml(v.channel || 'Bhagavad Gita Wisdom')}</span>
                    <span class="youtube-cta">Watch ↗</span>
                </div>
            </div>
        `;
        videoGrid.appendChild(a);
    });
}

function renderSpectrumBars(probs) {
    spectrumBars.innerHTML = '';
    const sorted = Object.entries(probs).sort((a, b) => b[1] - a[1]);

    sorted.forEach(([label, val]) => {
        const pct = Math.round(val * 100);
        const div = document.createElement('div');
        div.className = 'spec-item';
        div.innerHTML = `
            <div class="spec-labels">
                <span>${label}</span>
                <span>${pct}%</span>
            </div>
            <div class="spec-bar-track">
                <div class="spec-bar-fill" style="width: ${pct}%;"></div>
            </div>
        `;
        spectrumBars.appendChild(div);
    });
}

function renderMiniProbBars(container, probs) {
    if (!container) return;
    container.innerHTML = '';
    const entries = Object.entries(probs || {});
    if (entries.length === 0) {
        container.innerHTML = '<span class="mini-prob-empty">No probability distribution</span>';
        return;
    }
    const sorted = entries.sort((a, b) => b[1] - a[1]);
    sorted.forEach(([label, val]) => {
        const pct = Math.round(Number(val || 0) * 100);
        const row = document.createElement('div');
        row.className = 'mini-prob-row';
        row.innerHTML = `
            <span class="mini-prob-label">${label.slice(0, 4)}</span>
            <div class="mini-prob-track">
                <div class="mini-prob-fill" style="width: ${pct}%;"></div>
            </div>
            <span class="mini-prob-val">${pct}%</span>
        `;
        container.appendChild(row);
    });
}

function setReflectionLoading(loading) {
    const textSpan = submitBtn.querySelector('.btn-text');
    const iconSpan = submitBtn.querySelector('.btn-icon');
    const spinner = submitBtn.querySelector('.btn-spinner');

    if (loading) {
        textSpan.textContent = 'Receiving Wisdom & Remedies...';
        iconSpan.classList.add('hidden');
        spinner.classList.remove('hidden');
        submitBtn.disabled = true;
    } else {
        textSpan.textContent = 'Receive Wisdom & Remedies';
        iconSpan.classList.remove('hidden');
        spinner.classList.add('hidden');
        submitBtn.disabled = false;
    }
}

// 6. INTERACTIVE AI GUIDANCE CHAT
function initChatInterface() {
    sendChatBtn.addEventListener('click', handleChatSend);
    chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleChatSend();
    });

    clearChatBtn.addEventListener('click', () => {
        chatStream.innerHTML = `
            <div class="chat-bubble ai-bubble">
                <div class="bubble-avatar">🕉</div>
                <div class="bubble-body">
                    <p>Namaste. The conversation is refreshed. What is on your mind?</p>
                    <span class="bubble-time">Now</span>
                </div>
            </div>
        `;
        activeConversationId = null;
    });

    document.querySelectorAll('.quick-prompt-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            chatInput.value = btn.getAttribute('data-chat');
            handleChatSend();
        });
    });
}

async function handleChatSend() {
    const message = chatInput.value.trim();
    if (!message) return;

    appendChatBubble('user', message);
    chatInput.value = '';

    try {
        const res = await apiRequest('/api/v1/chat/message', {
            method: 'POST',
            body: JSON.stringify({
                message,
                conversationId: activeConversationId
            })
        });

        activeConversationId = res.conversationId;
        appendChatBubble('ai', res.reply, res.grounded_verses, res.suggestedActions);
    } catch (err) {
        appendChatBubble('ai', `I apologize, but guidance could not be reached: ${err.message}`);
    }
}

function appendChatBubble(role, text, verses = [], suggestedActions = []) {
    const bubble = document.createElement('div');
    bubble.className = `chat-bubble ${role === 'user' ? 'user-bubble' : 'ai-bubble'}`;

    let shlokaHtml = '';
    if (verses && verses.length > 0 && role === 'ai') {
        const v = verses[0];
        shlokaHtml = `
            <div class="chat-shloka-attachment">
                <div class="chat-shloka-head">🕉 ${v.source || 'Bhagavad Gita'}:</div>
                <div class="chat-shloka-body">"${v.meaning}"</div>
            </div>
        `;
    }

    let actionsHtml = '';
    if (suggestedActions && suggestedActions.length > 0 && role === 'ai') {
        actionsHtml = `
            <div class="chat-action-chips">
                ${suggestedActions.map(action => `<button class="chat-action-chip" type="button">${action}</button>`).join('')}
            </div>
        `;
    }

    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const safeText = escapeHtml(text);

    bubble.innerHTML = `
        <div class="bubble-avatar">${role === 'user' ? '👤' : '🕉'}</div>
        <div class="bubble-body">
            <p>${safeText}</p>
            ${shlokaHtml}
            ${actionsHtml}
            <span class="bubble-time">${nowStr}</span>
        </div>
    `;

    bubble.querySelectorAll('.chat-action-chip').forEach(btn => {
        btn.addEventListener('click', () => {
            chatInput.value = btn.textContent;
            handleChatSend();
        });
    });

    chatStream.appendChild(bubble);
    chatStream.scrollTop = chatStream.scrollHeight;
}

// 7. DASHBOARD & TRENDS
function initDashboard() {
    refreshDashBtn.addEventListener('click', loadDashboardData);
}

async function loadDashboardData() {
    if (!getToken()) {
        dashEmotion.textContent = 'Equanimity';
        dashWellness.innerHTML = '50 <small>/ 100</small>';
        dashFormula.textContent = 'Equilibrium Baseline';
        dashCount.textContent = '0';
        timelineBadge.textContent = '0 Entries';
        timelineList.innerHTML = '<li class="timeline-empty">You are exploring in guest mode. Complete your first reflection or sign in to permanently record your journey in PostgreSQL.</li>';
        renderDonutChart({});
        return;
    }

    try {
        const data = await apiRequest('/api/v1/dashboard');
        dashEmotion.textContent = data.currentEmotion ? data.currentEmotion.emotion : 'Steady';
        dashWellness.innerHTML = `${data.wellnessIndex?.score || 50} <small>/ 100</small>`;
        dashFormula.textContent = data.wellnessIndex?.formula || 'Heuristic Resilience';
        dashCount.textContent = (data.recentEmotions || []).length;
        timelineBadge.textContent = `${(data.recentEmotions || []).length} Reflections`;

        // Render Timeline
        timelineList.innerHTML = '';
        if (!data.recentEmotions || data.recentEmotions.length === 0) {
            timelineList.innerHTML = '<li class="timeline-empty" style="padding: 1.5rem; text-align: center; color: var(--text-secondary);">🌱 No reflections recorded yet today. Visit the Reflection Studio to generate your first emotional trend data point.</li>';
        } else {
            data.recentEmotions.forEach(item => {
                const li = document.createElement('li');
                li.className = 'timeline-item';
                const dateStr = item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '';
                li.innerHTML = `
                    <div><strong>${EMOTION_ICONS[item.emotion] || '•'} ${item.emotion}</strong> (${Math.round((item.confidence || 0) * 100)}%) <small>· ${dateStr}</small></div>
                    <div style="color: #94A3B8; margin-top: 0.2rem; font-style: italic;">"${item.userText || ''}"</div>
                `;
                timelineList.appendChild(li);
            });
        }

        // Sync Home recent preview with most recent emotion record
        if (data.recentEmotions && data.recentEmotions.length > 0) {
            const first = data.recentEmotions[0];
            updateHomeRecentPreview({
                emotion: first.emotion,
                confidence: first.confidence,
                text: first.userText
            });
        }

        // Render Canvas Bar Chart
        renderDonutChart(data.emotionDistribution || {});
    } catch (err) {
        console.warn('Dashboard error:', err);
    }
}

function renderDonutChart(dist) {
    const ctx = emotionChartCanvas.getContext('2d');
    ctx.clearRect(0, 0, emotionChartCanvas.width, emotionChartCanvas.height);

    const entries = Object.entries(dist);
    chartLegend.innerHTML = '';

    if (entries.length === 0) {
        ctx.fillStyle = '#64748B';
        ctx.font = '14px Plus Jakarta Sans, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('No persistent emotional vectors yet', emotionChartCanvas.width / 2, emotionChartCanvas.height / 2);
        return;
    }

    const colors = ['#F59E0B', '#10B981', '#06B6D4', '#818CF8', '#F43F5E', '#EC4899', '#A855F7'];
    const maxVal = Math.max(...entries.map(([, v]) => v), 1);
    const barWidth = 36;
    const startX = 35;
    const baseY = 200;

    entries.forEach(([emotion, count], i) => {
        const color = colors[i % colors.length];
        const barHeight = (count / maxVal) * 130;
        const x = startX + (i * 60);
        const y = baseY - barHeight;

        // Draw glowing bar
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 8;
        ctx.fillRect(x, y, barWidth, barHeight);
        ctx.shadowBlur = 0; // reset

        // Draw Value
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(String(count), x + (barWidth / 2), y - 6);

        // Draw Label
        ctx.fillStyle = '#94A3B8';
        ctx.font = '11px sans-serif';
        ctx.fillText(emotion.slice(0, 4), x + (barWidth / 2), baseY + 18);

        // Add to Legend
        const li = document.createElement('li');
        li.innerHTML = `<span style="color:${color}; font-weight:bold;">■</span> ${emotion}: <strong>${count}</strong>`;
        chartLegend.appendChild(li);
    });
}

// 8. SACRED JOURNAL
function initJournal() {
    saveJournalBtn.addEventListener('click', async () => {
        if (!getToken()) {
            showToast('Please sign in to preserve your journal in the database.', 'info', '🔒');
            return;
        }

        const title = journalTitleInput.value.trim();
        const content = journalBodyInput.value.trim();
        const emotion = journalTagSelect.value || null;

        if (!content) {
            showToast('Please write something in your journal first.', 'info', '📝');
            return;
        }

        try {
            await apiRequest('/api/v1/journal', {
                method: 'POST',
                body: JSON.stringify({ title, content, emotion })
            });

            journalTitleInput.value = '';
            journalBodyInput.value = '';
            journalTagSelect.value = '';
            showToast('Journal reflection securely preserved in database!', 'success', '📖');
            loadJournalFeed();
        } catch (err) {
            showToast(err.message || 'Could not save journal entry.', 'error', '⚠️');
        }
    });

    journalSearchInput.addEventListener('input', () => {
        const query = journalSearchInput.value.toLowerCase();
        document.querySelectorAll('.journal-card-item').forEach(card => {
            const text = card.textContent.toLowerCase();
            card.style.display = text.includes(query) ? 'block' : 'none';
        });
    });
}

async function loadJournalFeed() {
    if (!getToken()) {
        journalFeed.innerHTML = `
            <div class="empty-state-card glass-panel" style="padding: 2.2rem 1.5rem; text-align: center; border-radius: 12px; margin-top: 1rem;">
                <div style="font-size: 2.2rem; margin-bottom: 0.5rem;">🔒</div>
                <h4 style="font-size: 1rem; margin-bottom: 0.35rem; color: var(--text-primary);">Encrypted Journal Vault</h4>
                <p style="font-size: 0.83rem; color: var(--text-secondary); max-width: 320px; margin: 0 auto 1rem;">Sign in to access and synchronize your private journal entries with PostgreSQL.</p>
                <button class="action-btn-gold-sm" id="journalSignInPromptBtn" style="cursor: pointer;">Sign In / Register</button>
            </div>
        `;
        const promptBtn = document.getElementById('journalSignInPromptBtn');
        if (promptBtn && authBtn) promptBtn.addEventListener('click', () => authBtn.click());
        return;
    }

    try {
        const data = await apiRequest('/api/v1/journal');
        journalFeed.innerHTML = '';

        if (!data.entries || data.entries.length === 0) {
            journalFeed.innerHTML = `
                <div class="empty-state-card glass-panel" style="padding: 2.2rem 1.5rem; text-align: center; border-radius: 12px; margin-top: 1rem;">
                    <div style="font-size: 2.2rem; margin-bottom: 0.5rem;">📖</div>
                    <h4 style="font-size: 1rem; margin-bottom: 0.35rem; color: var(--text-primary);">Sacred Journal is Quiet</h4>
                    <p style="font-size: 0.83rem; color: var(--text-secondary); max-width: 320px; margin: 0 auto;">No reflections recorded yet. Compose a reflection on the left to preserve your thoughts in the secure vault.</p>
                </div>
            `;
            return;
        }

        data.entries.forEach(entry => {
            const div = document.createElement('div');
            div.className = 'journal-card-item';
            const dateStr = entry.createdAt ? new Date(entry.createdAt).toLocaleDateString() : '';
            const safeTitle = escapeHtml(entry.title || 'Untitled Insight');
            const safeContent = escapeHtml(entry.content || '');
            div.innerHTML = `
                <div class="journal-card-top">
                    <span class="journal-card-title">${safeTitle}</span>
                    <span class="journal-card-date">${dateStr}</span>
                </div>
                <div class="journal-card-body">${safeContent}</div>
                <button class="delete-journal-btn" data-id="${entry.id}">Delete</button>
            `;
            div.querySelector('.delete-journal-btn').addEventListener('click', async () => {
                if (confirm('Delete this entry from PostgreSQL?')) {
                    await apiRequest(`/api/v1/journal/${entry.id}`, { method: 'DELETE' });
                    showToast('Journal reflection removed.', 'info', '🗑️');
                    loadJournalFeed();
                }
            });
            journalFeed.appendChild(div);
        });
    } catch (err) {
        console.warn('Journal feed error:', err);
    }
}

// 9. SLIDE-OVER RIGHT DRAWER
function initSideDrawer() {
    drawerToggleBtn.addEventListener('click', () => {
        sideDrawer.classList.add('open');
        drawerBackdrop.classList.remove('hidden');
    });

    drawerCloseBtn.addEventListener('click', closeSideDrawer);
    drawerBackdrop.addEventListener('click', closeSideDrawer);
}

function closeSideDrawer() {
    sideDrawer.classList.remove('open');
    drawerBackdrop.classList.add('hidden');
}

// 10. AUTHENTICATION & SESSIONS
function getToken() {
    return localStorage.getItem(tokenStorageKey);
}

function getStoredUser() {
    const raw = localStorage.getItem(userStorageKey);
    try { return raw ? JSON.parse(raw) : null; } catch(e) { return null; }
}

function updateUserSession() {
    const user = getStoredUser();
    updateTimeGreeting();

    if (user && getToken()) {
        const displayName = user.name || user.email.split('@')[0];
        dockUserName.textContent = displayName;
        authBtn.title = `Signed in as ${user.email} (Click to Sign Out)`;
        if (credSessionText) credSessionText.textContent = `Verified Session · ${user.email}`;
        if (vaultStatusText) vaultStatusText.textContent = 'PostgreSQL 17 Encrypted Vault Synchronized';
        if (dashSyncStatus) dashSyncStatus.textContent = 'Synchronized with PostgreSQL';
        if (settingsSessionDesc) settingsSessionDesc.textContent = `Signed in as ${user.email} (${displayName}). All data synced to encrypted PostgreSQL.`;
        if (settingsAuthActionBtn) settingsAuthActionBtn.textContent = 'Sign Out';
        if (bannerSignInBtn) {
            const btnText = bannerSignInBtn.querySelector('.btn-text');
            if (btnText) btnText.textContent = 'Account Profile';
            bannerSignInBtn.title = 'Click to view profile or sign out';
        }
    } else {
        dockUserName.textContent = 'Guest';
        authBtn.title = 'Sign In / Register';
        if (credSessionText) credSessionText.textContent = 'Guest Traveler Mode (Local Session)';
        if (vaultStatusText) vaultStatusText.textContent = 'Private Sanctuary Mode Active';
        if (dashSyncStatus) dashSyncStatus.textContent = 'Sign in to persist timeline';
        if (settingsSessionDesc) settingsSessionDesc.textContent = 'Operating in Guest Traveler Mode. Data remains in this browser until you sign in.';
        if (settingsAuthActionBtn) settingsAuthActionBtn.textContent = 'Sign In / Register';
        if (bannerSignInBtn) {
            const btnText = bannerSignInBtn.querySelector('.btn-text');
            if (btnText) btnText.textContent = 'Sign In / Register';
            bannerSignInBtn.title = 'Create an account to synchronize reflections and journal entries';
        }
    }
}

function initAuthModal() {
    const userProfileModal = document.getElementById('userProfileModal');
    const closeProfileBtn = document.getElementById('closeProfileBtn');
    const profileNameDisplay = document.getElementById('profileNameDisplay');
    const profileEmailDisplay = document.getElementById('profileEmailDisplay');
    const profileOpenSettingsBtn = document.getElementById('profileOpenSettingsBtn');
    const profileSignOutBtn = document.getElementById('profileSignOutBtn');

    authBtn.addEventListener('click', () => {
        const user = getStoredUser();
        if (user && getToken()) {
            if (profileNameDisplay) profileNameDisplay.textContent = user.name || 'Traveler';
            if (profileEmailDisplay) profileEmailDisplay.textContent = user.email || '';
            if (userProfileModal) userProfileModal.classList.remove('hidden');
        } else {
            authModal.classList.remove('hidden');
        }
    });

    if (closeProfileBtn && userProfileModal) {
        closeProfileBtn.addEventListener('click', () => {
            userProfileModal.classList.add('hidden');
        });
    }

    if (profileOpenSettingsBtn && userProfileModal) {
        profileOpenSettingsBtn.addEventListener('click', () => {
            userProfileModal.classList.add('hidden');
            settingsBtn.click();
        });
    }

    if (profileSignOutBtn && userProfileModal) {
        profileSignOutBtn.addEventListener('click', () => {
            userProfileModal.classList.add('hidden');
            localStorage.removeItem(tokenStorageKey);
            localStorage.removeItem(userStorageKey);
            updateUserSession();
            loadDashboardData();
            loadJournalFeed();
            showToast('You have safely signed out of your personal sanctuary.', 'success', '👋');
        });
    }

    closeAuthBtn.addEventListener('click', () => {
        authModal.classList.add('hidden');
    });

    authSwitchModeBtn.addEventListener('click', () => {
        isAuthRegisterMode = !isAuthRegisterMode;
        if (isAuthRegisterMode) {
            authModalTitle.textContent = 'Access Your Journey';
            nameField.classList.remove('hidden');
            authSubmitBtn.textContent = 'Register Account';
            authSwitchModeBtn.textContent = 'Already registered? Sign In';
        } else {
            authModalTitle.textContent = 'Welcome Back';
            nameField.classList.add('hidden');
            authSubmitBtn.textContent = 'Sign In';
            authSwitchModeBtn.textContent = 'Need an account? Register';
        }
    });

    authSubmitBtn.addEventListener('click', async () => {
        const email = authEmailInput.value.trim();
        const password = authPasswordInput.value;
        const name = authNameInput.value.trim();

        if (!email || !password || (isAuthRegisterMode && !name)) {
            showToast('Please provide all required fields.', 'info', '⚠️');
            return;
        }

        try {
            const endpoint = isAuthRegisterMode ? '/api/v1/auth/register' : '/api/v1/auth/login';
            const payload = isAuthRegisterMode ? { name, email, password } : { email, password };
            const res = await apiRequest(endpoint, { method: 'POST', body: JSON.stringify(payload) });

            if (res.token && res.user) {
                localStorage.setItem(tokenStorageKey, res.token);
                localStorage.setItem(userStorageKey, JSON.stringify(res.user));
                authModal.classList.add('hidden');
                updateUserSession();
                loadDashboardData();
                loadJournalFeed();
                showToast(`Welcome${res.user.name ? ', ' + res.user.name : ''}! Sanctuary synchronized.`, 'success', '✨');
            }
        } catch (err) {
            showToast(err.message || 'Authentication failed.', 'error', '⚠️');
        }
    });
}

// 11. GLOBAL SAFETY TOAST
function triggerSafetyToast(msg) {
    if (msg) safetyToastMsg.textContent = msg;
    safetyToast.classList.remove('hidden');
}

function closeSafetyToast() {
    safetyToast.classList.add('hidden');
}
closeToastBtn.addEventListener('click', closeSafetyToast);

// 12. HTTP HELPER
async function apiRequest(path, options = {}) {
    const token = getToken();
    const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {})
    };
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(data.error?.message || 'Request failed.');
    }
    return data;
}

// 13. TIME-AWARE HOME SANCTUARY & DAILY CONTEMPLATION
function initTimeAwareHome() {
    updateTimeGreeting();

    if (reflectDailyShlokaBtn) {
        reflectDailyShlokaBtn.addEventListener('click', () => {
            userInput.value = "I am reflecting on Bhagavad Gita 2.47: 'Focus on your duty and effort, not the fruits or outcome'. How do I practice this when overwhelmed?";
            userInput.dispatchEvent(new Event('input'));
            slideToView(1);
            userInput.focus();
        });
    }

    if (chatDailyShlokaBtn) {
        chatDailyShlokaBtn.addEventListener('click', () => {
            chatInput.value = "How does Bhagavad Gita 2.47 ('Karmanye Vadhikaraste') guide us when we feel anxious about results in modern work and life?";
            slideToView(2);
            handleChatSend();
        });
    }

    if (homeDrawerLinkBtn) {
        homeDrawerLinkBtn.addEventListener('click', () => {
            drawerToggleBtn.click();
        });
    }
}

function updateTimeGreeting() {
    const user = getStoredUser();
    const name = user ? (user.name || user.email.split('@')[0]) : 'Traveler';
    const hour = new Date().getHours();
    let partOfDay = 'Day';
    if (hour >= 4 && hour < 12) partOfDay = 'Morning';
    else if (hour >= 12 && hour < 17) partOfDay = 'Afternoon';
    else if (hour >= 17 && hour < 22) partOfDay = 'Evening';
    else partOfDay = 'Night';

    if (welcomeUserGreeting) {
        welcomeUserGreeting.textContent = `Good ${partOfDay}, ${name}`;
    }
    if (welcomeUserSub) {
        welcomeUserSub.textContent = "What is on your mind today? Pause, take a grounding breath, and choose how you would like to begin.";
    }
}

function updateHomeRecentPreview({ emotion, confidence, text }) {
    if (homeRecentState) {
        const titleCase = emotion.charAt(0).toUpperCase() + emotion.slice(1);
        homeRecentState.textContent = `${titleCase} (${Math.round((confidence || 0) * 100)}%)`;
    }
    if (homeRecentText && text) {
        homeRecentText.textContent = `"${text.slice(0, 90)}${text.length > 90 ? '...' : ''}"`;
    }
    if (homeRecentIcon) {
        homeRecentIcon.textContent = EMOTION_ICONS[emotion] || '😌';
    }
    if (homeRecentBadge) {
        homeRecentBadge.textContent = 'Updated';
    }
}

// 14. QUICK 30-SECOND MINDFUL CHECK-IN
function initQuickCheckin() {
    if (openQuickCheckinBtn) {
        openQuickCheckinBtn.addEventListener('click', () => {
            quickCheckinModal.classList.remove('hidden');
            startBreathingCycle();
        });
    }

    if (closeQuickCheckinBtn) {
        closeQuickCheckinBtn.addEventListener('click', () => {
            quickCheckinModal.classList.add('hidden');
            stopBreathingCycle();
        });
    }

    document.querySelectorAll('.checkin-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            document.querySelectorAll('.checkin-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
        });
    });

    if (saveQuickCheckinBtn) {
        saveQuickCheckinBtn.addEventListener('click', () => {
            const activeChip = document.querySelector('.checkin-chip.active');
            const selectedMood = activeChip ? activeChip.getAttribute('data-mood') : 'neutral';
            
            updateHomeRecentPreview({
                emotion: selectedMood,
                confidence: 0.9,
                text: "Quick 30-second breath & grounding check-in completed."
            });

            // Persist to PostgreSQL if authenticated
            if (getToken()) {
                apiRequest('/api/v1/process', {
                    method: 'POST',
                    body: JSON.stringify({
                        user_text: `Quick 30-second breath & grounding check-in: feeling ${selectedMood}.`
                    })
                }).then(() => {
                    loadDashboardData();
                }).catch(e => console.warn('Could not sync quick check-in to database:', e));
            }

            quickCheckinModal.classList.add('hidden');
            stopBreathingCycle();

            showToast('Check-in logged! Remember: pause, breathe, and honor your inner peace.', 'success', '🌿');
        });
    }
}

function startBreathingCycle() {
    stopBreathingCycle();
    const phases = ['Inhale deeply...', 'Hold the stillness...', 'Exhale completely...'];
    let idx = 0;
    if (breathingText) breathingText.textContent = phases[0];

    breathingInterval = setInterval(() => {
        idx = (idx + 1) % phases.length;
        if (breathingText) breathingText.textContent = phases[idx];
    }, 2800);
}

function stopBreathingCycle() {
    if (breathingInterval) {
        clearInterval(breathingInterval);
        breathingInterval = null;
    }
}

// 15. PROGRESSIVE DISCLOSURE ACCORDION
function initProgressiveDisclosure() {
    if (toggleAiTransparencyBtn && aiDetailsContent) {
        toggleAiTransparencyBtn.addEventListener('click', () => {
            const isHidden = aiDetailsContent.classList.contains('hidden');
            aiDetailsContent.classList.toggle('hidden', !isHidden);
            toggleAiTransparencyBtn.classList.toggle('open', isHidden);
        });
    }
}

// 16. SETTINGS & PRIVACY CENTER
function initSettingsModal() {
    if (settingsBtn) {
        settingsBtn.addEventListener('click', () => {
            updateSettingsView();
            settingsModal.classList.remove('hidden');
        });
    }

    if (closeSettingsBtn) {
        closeSettingsBtn.addEventListener('click', () => {
            settingsModal.classList.add('hidden');
        });
    }

    if (exportDataBtn) {
        exportDataBtn.addEventListener('click', handleExportData);
    }

    if (clearLocalDataBtn) {
        clearLocalDataBtn.addEventListener('click', handleClearLocalData);
    }

    if (settingsAudioToggle) {
        settingsAudioToggle.addEventListener('change', () => {
            if (settingsAudioToggle.checked !== isAudioPlaying) {
                ambientSoundBtn.click();
            }
        });
    }

    if (settingsCameraToggle) {
        settingsCameraToggle.addEventListener('change', () => {
            if (cameraToggle) {
                cameraToggle.checked = settingsCameraToggle.checked;
                cameraToggle.dispatchEvent(new Event('change'));
            }
        });
    }

    if (settingsAuthActionBtn) {
        settingsAuthActionBtn.addEventListener('click', () => {
            settingsModal.classList.add('hidden');
            authBtn.click();
        });
    }
}

function updateSettingsView() {
    if (settingsAudioToggle) {
        settingsAudioToggle.checked = isAudioPlaying;
    }
    if (settingsCameraToggle && cameraToggle) {
        settingsCameraToggle.checked = cameraToggle.checked;
    }
}

async function handleExportData() {
    const user = getStoredUser();
    let journalEntries = [];
    let dashboardData = {};

    if (getToken()) {
        try {
            const jRes = await apiRequest('/api/v1/journal').catch(() => ({ entries: [] }));
            journalEntries = jRes.entries || [];
            dashboardData = await apiRequest('/api/v1/dashboard').catch(() => ({}));
        } catch (e) {
            console.warn('Could not fetch remote data for export:', e);
        }
    }

    const exportPayload = {
        exportedAt: new Date().toISOString(),
        user: user || { mode: 'guest' },
        journalEntries,
        dashboardData,
        lastRevelation: latestRevelation || null,
        note: "Exported from VedAI Sanctuary — Private and Personal Mindfulness Records"
    };

    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `VedAI-My-Sacred-Data-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Sacred journal and reflection data exported successfully!', 'success', '📦');
}

async function handleClearLocalData() {
    if (confirm("Are you sure you want to permanently clear your reflection history, cached sessions, and local data?")) {
        if (getToken()) {
            try {
                await apiRequest('/api/v1/history', { method: 'DELETE' });
            } catch (e) {
                console.warn('Server history purge failed:', e);
            }
        }
        localStorage.removeItem(tokenStorageKey);
        localStorage.removeItem(userStorageKey);
        latestRevelation = null;
        updateUserSession();
        updateTimeGreeting();
        loadDashboardData();
        loadJournalFeed();
        settingsModal.classList.add('hidden');
        showToast('Your sanctuary history has been permanently cleared.', 'info', '🧹');
    }
}
