// =========================
// SESSION SIDEBAR
// =========================

let currentSession = null;
let conversations = {};

async function loadSessions(){
    const list = document.getElementById('lesson-list');
    if(!list) return;
    try{
        const resp = await fetch('http://127.0.0.1:5000/teaching_sessions');
        const sessions = await resp.json();
        list.innerHTML = '';
        const newBtn = document.createElement('button');
        newBtn.className = 'new-lesson-btn';
        newBtn.textContent = '+ New Lesson';
        newBtn.addEventListener('click', createNewSession);
        list.appendChild(newBtn);
        sessions.forEach(s => {
            const item = document.createElement('div');
            item.className = 'lesson-item';
            item.dataset.id = s.id;
            const titleSpan = document.createElement('span');
            titleSpan.className = 'lesson-title';
            titleSpan.textContent = s.title;
            const delBtn = document.createElement('button');
            delBtn.className = 'lesson-delete';
            delBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>';
            delBtn.title = 'Delete session';
            delBtn.addEventListener('click', async e => {
                e.stopPropagation();
                await deleteSession(s.id);
            });
            item.appendChild(titleSpan);
            item.appendChild(delBtn);
            if(currentSession == s.id) item.classList.add('active');
            item.addEventListener('click', () => loadSessionMessages(s.id));
            list.appendChild(item);
        });
    }catch(e){
        console.error('Failed to load sessions:', e);
    }
}

async function createNewSession(){
    try{
        const resp = await fetch('http://127.0.0.1:5000/create_teaching_session');
        const data = await resp.json();
        currentSession = data.session_id;
        chatHistory.innerHTML = '';
        // Show top-bar again for a fresh session
        topBarHidden = false;
        const topBar = document.querySelector('.top-bar');
        if(topBar) topBar.classList.remove('hidden');
        await loadSessions();
    }catch(e){
        console.error('Failed to create session:', e);
    }
}

async function loadSessionMessages(sessionId){
    currentSession = sessionId;
    chatHistory.innerHTML = '';
    // Reset top-bar state for this session
    topBarHidden = false;
    const topBar = document.querySelector('.top-bar');
    if(topBar) topBar.classList.remove('hidden');
    try{
        const resp = await fetch(`http://127.0.0.1:5000/teaching_messages/${sessionId}`);
        const messages = await resp.json();
        messages.forEach(m => {
            const bubble = document.createElement('div');
            bubble.classList.add(m.sender === 'user' ? 'user-message' : 'falcon-message');
            bubble.textContent = m.content;
            chatHistory.appendChild(bubble);
        });
        // Hide top-bar if this session has messages
        if(messages.length > 0) hideTopBar();
        const mainArea = document.querySelector('.main-area');
        if(mainArea) mainArea.scrollTop = mainArea.scrollHeight;
        await loadSessions();
    }catch(e){
        console.error('Failed to load messages:', e);
    }
}

async function deleteSession(sessionId){
    try{
        await fetch(`http://127.0.0.1:5000/delete_teaching_session/${sessionId}`, {method: 'DELETE'});
        if(currentSession == sessionId){
            currentSession = null;
            chatHistory.innerHTML = '';
        }
        await loadSessions();
    }catch(e){
        console.error('Failed to delete session:', e);
    }
}

// =========================
// HIDE TOP BAR AFTER FIRST MSG
// =========================

let topBarHidden = false;

function hideTopBar(){
    if(topBarHidden) return;
    topBarHidden = true;
    const topBar = document.querySelector('.top-bar');
    if(topBar) topBar.classList.add('hidden');
}



const Visualizer = {
    canvas: null,
    ctx: null,
    animId: null,
    active: false,
    bars: 48,

    // Web Audio API
    audioCtx: null,
    analyser: null,
    source: null,
    dataArray: null,

    init(){
        this.canvas = document.getElementById('visualizer-canvas');
        if(!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this._resize();
    },

    _resize(){
        if(!this.canvas) return;
        const rect = this.canvas.parentElement.getBoundingClientRect();
        const w = Math.min(rect.width - 4, 560);
        this.canvas.width = w * 2;
        this.canvas.height = 80 * 2;
        this.canvas.style.width = w + 'px';
        this.canvas.style.height = '80px';
        this.ctx && this.ctx.scale(2, 2);
    },

    _ensureAudioCtx(){
        if(!this.audioCtx || this.audioCtx.state === 'closed'){
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if(this.audioCtx.state === 'suspended'){
            this.audioCtx.resume();
        }
    },

    /* Call with the Audio element so we can tap real frequency data */
    start(audioEl){
        const section = document.getElementById('visualizer-section');
        if(section) section.classList.remove('preparing');
        const label = document.getElementById('visualizer-label');
        if(label) label.textContent = 'Falcon is responding...';
        if(!this.ctx) return;

        // Disconnect previous source if any
        this._disconnectSource();

        if(audioEl){
            try{
                this._ensureAudioCtx();
                if(!this.analyser){
                    this.analyser = this.audioCtx.createAnalyser();
                    this.analyser.fftSize = 128;          // 64 frequency bins
                    this.analyser.smoothingTimeConstant = 0.8;
                    this.analyser.connect(this.audioCtx.destination);
                    this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
                }
                this.source = this.audioCtx.createMediaElementSource(audioEl);
                this.source.connect(this.analyser);
            }catch(e){
                // If createMediaElementSource fails (already captured), ignore
                this.source = null;
            }
        }

        this.active = true;
        this._show(true);
        this._loop();
    },

    _disconnectSource(){
        if(this.source){
            try{ this.source.disconnect(); }catch(e){}
            this.source = null;
        }
    },

    startPreparing(){
        const section = document.getElementById('visualizer-section');
        if(section){
            section.classList.add('preparing');
            section.classList.add('visible');
        }
        const label = document.getElementById('visualizer-label');
        if(label) label.textContent = 'Falcon is preparing voice...';
    },

    stop(){
        this.active = false;
        if(this.animId){
            cancelAnimationFrame(this.animId);
            this.animId = null;
        }
        this._disconnectSource();
        this._drawFlat();
        const section = document.getElementById('visualizer-section');
        if(section){
            section.classList.remove('preparing');
            section.classList.remove('visible');
        }
    },

    _show(show){
        const section = document.getElementById('visualizer-section');
        if(!section) return;
        section.classList.toggle('visible', show);
        if(show) this._resize();
    },

    _loop(){
        if(!this.active) return;
        this._drawFrame();
        this.animId = requestAnimationFrame(() => this._loop());
    },

    _drawFrame(){
        const ctx = this.ctx;
        const w = ctx.canvas.width / 2;
        const h = ctx.canvas.height / 2;

        ctx.clearRect(0, 0, w, h);

        const barW = (w - 20) / this.bars;
        const gap = 1.5;
        const barH = h - 20;

        // Get real frequency data if analyser is connected
        let freqData = null;
        if(this.analyser && this.dataArray){
            this.analyser.getByteFrequencyData(this.dataArray);
            freqData = this.dataArray;
        }

        for(let i = 0; i < this.bars; i++){
            let height;
            if(freqData){
                // Map bar index to frequency bin (use lower half for more vocal range)
                const binIndex = Math.floor(i / this.bars * (freqData.length * 0.75));
                const raw = freqData[binIndex] / 255;   // 0..1
                // Shape envelope: taper the edges slightly
                const envelope = 1 - Math.abs(i / this.bars - 0.5) * 0.4;
                height = Math.max(2, raw * barH * envelope);
            } else {
                // Fallback: gentle idle pulse
                const now = performance.now() / 1000;
                const phase = i / this.bars * Math.PI * 4 + now * 3;
                height = (0.06 + Math.abs(Math.sin(phase)) * 0.15) * barH;
            }

            const x = 10 + i * barW + gap / 2;
            const y = h - 10 - height;

            const intensity = height / barH;
            ctx.fillStyle = `hsla(188, 100%, ${52 + intensity * 14}%, ${0.4 + intensity * 0.5})`;
            ctx.shadowColor = `rgba(0, 217, 255, ${0.1 + intensity * 0.3})`;
            ctx.shadowBlur = 6 + intensity * 10;
            ctx.beginPath();
            ctx.roundRect(x, y, barW - gap, Math.max(2, height), 2);
            ctx.fill();
        }

        ctx.shadowBlur = 0;
    },

    _drawFlat(){
        const ctx = this.ctx;
        if(!ctx) return;
        const w = ctx.canvas.width / 2;
        const h = ctx.canvas.height / 2;
        ctx.clearRect(0, 0, w, h);

        const barW = (w - 20) / this.bars;
        const gap = 1.5;

        for(let i = 0; i < this.bars; i++){
            const x = 10 + i * barW + gap / 2;
            const y = h - 12;
            ctx.fillStyle = `rgba(0, 217, 255, 0.06)`;
            ctx.beginPath();
            ctx.roundRect(x, y, barW - gap, 3, 2);
            ctx.fill();
        }

        this._show(false);
    }
};

const AvatarProvider = {
    type: 'default',
    imageSrc: null,
    pendingFile: null,

    isImage(){
        return this.type === 'image';
    },

    isDefault(){
        return this.type === 'default';
    },

    initializeImageElements(){
        return {
            wrapper: document.getElementById('avatar-image-wrapper'),
            imageEl: document.getElementById('avatar-image-el'),
            blinkOverlay: document.getElementById('avatar-blink-overlay')
        };
    },

    switchToDefault(){
        this.type = 'default';
        this.imageSrc = null;

        const svgWrapper = document.getElementById('avatar-body');
        const imgWrapper = document.getElementById('avatar-image-wrapper');

        if(svgWrapper) svgWrapper.style.display = 'flex';
        if(imgWrapper){
            imgWrapper.classList.remove('visible');
        }

        const e = AVATAR.els;
        if(e.mouth) e.mouth.setAttribute('ry','5');
        if(e.eyeLeft) e.eyeLeft.style.animation = '';
        if(e.eyeRight) e.eyeRight.style.animation = '';
    },

    switchToImage(src){
        this.type = 'image';
        this.imageSrc = src;

        const svgWrapper = document.getElementById('avatar-body');
        const imgWrapper = document.getElementById('avatar-image-wrapper');
        const imgEl = document.getElementById('avatar-image-el');

        if(svgWrapper) svgWrapper.style.display = 'none';
        if(imgEl) imgEl.src = src;
        if(imgWrapper){
            imgWrapper.classList.add('visible');
        }
    },

    handleImageUpload(){
        const input = document.getElementById('avatar-file-input');
        if(input) input.click();
    },

    previewUploadedImage(file){
        if(!file) return;

        const validTypes = ['image/jpeg','image/png','image/webp'];

        if(!validTypes.includes(file.type)){
            const previewModal = document.getElementById('avatar-preview-modal');
            const previewImg = document.getElementById('avatar-preview-img');

            if(previewImg) previewImg.src = '';
            if(previewModal) previewModal.classList.add('hidden-modal');
            return;
        }

        this.pendingFile = file;

        const reader = new FileReader();

        reader.onload = (e) => {
            const previewImg = document.getElementById('avatar-preview-img');
            const previewModal = document.getElementById('avatar-preview-modal');

            if(previewImg) previewImg.src = e.target.result;
            if(previewModal) previewModal.classList.remove('hidden-modal');
        };

        reader.readAsDataURL(file);
    },

    confirmImage(){
        if(!this.pendingFile) return;
        this.generateAvatarFromPhoto(this.pendingFile);
        this.pendingFile = null;
    },

    async generateAvatarFromPhoto(file){
        const previewModal = document.getElementById('avatar-preview-modal');
        if(previewModal) previewModal.classList.add('hidden-modal');

        console.log('%c[UPLOAD_RECEIVED]', 'color:#00d9ff;font-weight:bold', `File: ${file.name} (${(file.size / 1024).toFixed(1)}KB, ${file.type})`);

        // Loading overlay
        const section = document.querySelector('.main-area');
        const loadingOverlay = document.createElement('div');
        loadingOverlay.className = 'avatar-loading-overlay';
        loadingOverlay.innerHTML = `
            <div class="avatar-loading-spinner" style="border: 4px solid rgba(0,217,255,0.1); border-left-color: #00d9ff; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto 15px auto;"></div>
            <p class="avatar-loading-text" id="avatar-stage-text" style="color: #00d9ff; font-weight: 500; font-size: 15px;">Uploading image...</p>
            <style>
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                .avatar-loading-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(4,8,22,0.85);
                    backdrop-filter: blur(8px);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    z-index: 99999;
                }
            </style>
        `;
        if(section) section.appendChild(loadingOverlay);

        const sleep = (ms) => new Promise(r => setTimeout(r, ms));

        await sleep(200);

        const reader = new FileReader();

        reader.onload = async (e) => {
            const imageDataUrl = e.target.result;
            const textEl = document.getElementById('avatar-stage-text');

            if(textEl) textEl.textContent = 'Analyzing face...';
            await sleep(800);

            try{
                if(textEl) textEl.textContent = 'Generating avatar...';
                const response = await fetch(
                    'http://127.0.0.1:5000/generate_avatar',
                    {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({image: imageDataUrl}),
                        signal: AbortSignal.timeout(120000)
                    }
                );

                if(!response.ok){
                    const errData = await response.json().catch(() => ({}));
                    throw new Error(errData.error || `Server returned ${response.status}`);
                }

                const result = await response.json();
                let avatarDataUrl = null;

                if(result.use_browser_fallback && typeof BrowserAvatar !== 'undefined'){
                    if(textEl) textEl.textContent = 'Enhancing avatar...';
                    avatarDataUrl = await BrowserAvatar.generate(file);
                }else if(result.success && result.avatar){
                    avatarDataUrl = result.avatar;
                }else{
                    throw new Error(result.error || 'Generation returned empty result');
                }

                if(loadingOverlay.parentNode) loadingOverlay.parentNode.removeChild(loadingOverlay);

                initializeAvatar();
                showAvatar();
                this.createImageAvatar(avatarDataUrl);

            }catch(error){
                if(loadingOverlay.parentNode) loadingOverlay.parentNode.removeChild(loadingOverlay);
                console.error('[AVATAR_ERROR]', error);

                // Simple alert fallback for user experience
                alert('Avatar generation failed: ' + error.message);
            }
        };

        reader.readAsDataURL(file);
    },

    createImageAvatar(src){
        initializeAvatar();
        this.switchToImage(src);
        if(!AVATAR.enabled){
            showAvatar();
        }else{
            const e = AVATAR.els;
            if(e.container){
                e.container.classList.remove('hidden-avatar');
            }
            setAvatarState('idle');
            startIdleAnimation();
        }
    },

    removeAvatar(){
        const wrapper = document.getElementById('avatar-image-wrapper');
        const imgEl = document.getElementById('avatar-image-el');

        if(imgEl) imgEl.src = '';
        if(wrapper) wrapper.classList.remove('visible');

        this.type = 'default';
        this.imageSrc = null;
        this.pendingFile = null;

        const svgWrapper = document.getElementById('avatar-body');
        if(svgWrapper) svgWrapper.style.display = 'flex';

        const e = AVATAR.els;
        if(e.mouth) e.mouth.setAttribute('ry','5');
    }
};

// =========================
// AVATAR SYSTEM
// =========================

const AVATAR = {
    enabled: true,
    initialized: false,
    state: 'idle',
    blinkTimer: null,
    idleRAF: null,
    lipSyncTimer: null,
    els: {}
};

function initializeAvatar(){
    if(AVATAR.initialized) return;

    AVATAR.els = {
        container: document.getElementById('avatar-container'),
        body: document.getElementById('avatar-body'),
        face: document.getElementById('avatar-face'),
        mouth: document.getElementById('avatar-mouth'),
        eyeLeft: document.getElementById('left-eye-white'),
        eyeRight: document.getElementById('right-eye-white'),
        pupilLeft: document.getElementById('left-pupil'),
        pupilRight: document.getElementById('right-pupil'),
        browLeft: document.querySelector('#avatar-brows line:first-child'),
        browRight: document.querySelector('#avatar-brows line:last-child'),
        glow: document.getElementById('ambient-glow-el'),
        ringOuter: document.querySelector('.avatar-ring-outer'),
        ringInner: document.querySelector('.avatar-ring-inner')
    };

    AvatarProvider.initializeImageElements();

    AVATAR.initialized = true;
}

function showAvatar(){
    if(!AVATAR.initialized) initializeAvatar();
    const e = AVATAR.els;
    if(e.container) e.container.classList.remove('hidden-avatar');
    AVATAR.enabled = true;
    setAvatarState('idle');
    startIdleAnimation();
}

function setAvatarState(state){
    if(!AVATAR.enabled) return;
    const validStates = ['idle','listening','thinking','speaking','preparing','loading','error'];
    if(!validStates.includes(state)) return;

    AVATAR.state = state;
    const e = AVATAR.els;
    if(!e.container) return;

    e.container.classList.remove('idle','listening','thinking','speaking','preparing','loading','error');
    e.container.classList.add(state);

    if(state === 'thinking'){
        stopIdleAnimation();
        if(e.browLeft) e.browLeft.setAttribute('y1','134');
        if(e.browLeft) e.browLeft.setAttribute('y2','136');
        if(e.browRight) e.browRight.setAttribute('y1','134');
        if(e.browRight) e.browRight.setAttribute('y2','136');
    }

    if(state === 'speaking'){
        stopIdleAnimation();
        if(e.browLeft) e.browLeft.setAttribute('y1','138');
        if(e.browLeft) e.browLeft.setAttribute('y2','140');
        if(e.browRight) e.browRight.setAttribute('y1','138');
        if(e.browRight) e.browRight.setAttribute('y2','140');
    }

    if(state === 'idle'){
        if(e.browLeft) e.browLeft.setAttribute('y1','138');
        if(e.browLeft) e.browLeft.setAttribute('y2','140');
        if(e.browRight) e.browRight.setAttribute('y1','140');
        if(e.browRight) e.browRight.setAttribute('y2','138');
    }

    if(state === 'preparing' || state === 'loading'){
        stopIdleAnimation();
        if(e.browLeft) e.browLeft.setAttribute('y1','138');
        if(e.browLeft) e.browLeft.setAttribute('y2','140');
        if(e.browRight) e.browRight.setAttribute('y1','140');
        if(e.browRight) e.browRight.setAttribute('y2','138');
    }

    if(state === 'error'){
        stopIdleAnimation();
        stopLipSync();
    }
}

function startIdleAnimation(){
    if(!AVATAR.enabled) return;
    let lastBlink = performance.now();
    const blinkInterval = 3000 + Math.random() * 4000;

    function idleLoop(time){
        if(!AVATAR.enabled || AVATAR.state === 'speaking' || AVATAR.state === 'thinking'){
            AVATAR.idleRAF = requestAnimationFrame(idleLoop);
            return;
        }

        if(time - lastBlink > blinkInterval){
            lastBlink = time;
            const e = AVATAR.els;
            if(AvatarProvider.isDefault()){
                if(e.eyeLeft && e.eyeRight){
                    e.eyeLeft.style.animation = 'blink 0.2s ease';
                    e.eyeRight.style.animation = 'blink 0.2s ease';
                    setTimeout(() => {
                        if(e.eyeLeft) e.eyeLeft.style.animation = '';
                        if(e.eyeRight) e.eyeRight.style.animation = '';
                    }, 250);
                }
            } else {
                const overlay = document.getElementById('avatar-blink-overlay');
                if(overlay){
                    overlay.style.animation = 'none';
                    overlay.offsetHeight; // force reflow
                    overlay.style.animation = 'imgBlink 0.25s ease';
                    setTimeout(() => {
                        if(overlay) overlay.style.animation = '';
                    }, 250);
                }
            }
        }
        AVATAR.idleRAF = requestAnimationFrame(idleLoop);
    }
    AVATAR.idleRAF = requestAnimationFrame(idleLoop);
}

function stopIdleAnimation(){
    if(AVATAR.idleRAF){
        cancelAnimationFrame(AVATAR.idleRAF);
        AVATAR.idleRAF = null;
    }
    const e = AVATAR.els;
    if(e.eyeLeft) e.eyeLeft.style.animation = '';
    if(e.eyeRight) e.eyeRight.style.animation = '';
    const overlay = document.getElementById('avatar-blink-overlay');
    if(overlay) overlay.style.animation = '';
}

function startLipSync(){
    if(!AVATAR.enabled) return;
    stopLipSync();
    AVATAR.lipSyncTimer = setInterval(() => {
        const e = AVATAR.els;
        if(!e.mouth) return;
        if(AVATAR.state !== 'speaking'){
            e.mouth.setAttribute('ry','5');
            return;
        }
        const openValues = [6,9,12,8,14,7,11,10];
        const ry = openValues[Math.floor(Math.random() * openValues.length)];
        e.mouth.setAttribute('ry', String(ry));
    }, 100);
}

function stopLipSync(){
    if(AVATAR.lipSyncTimer){
        clearInterval(AVATAR.lipSyncTimer);
        AVATAR.lipSyncTimer = null;
    }
    const e = AVATAR.els;
    if(e.mouth) e.mouth.setAttribute('ry','5');
}

// =========================
// STREAMING TTS QUEUE
// =========================

let ttsQueue = [];
let ttsPlaying = false;
let currentAudio = null;
let voiceMode = true; // Spoken output on by default

function speakText(text){
    if(!voiceMode) return;
    ttsQueue = [];
    if(currentAudio){
        currentAudio.pause();
        currentAudio = null;
    }
    ttsPlaying = false;

    // Split into sentences/chunks
    const sentences = text.match(/[^.!?,;:]+[.!?,;:]+/g) || [text];
    sentences.forEach(s => {
        const clean = s.trim();
        if(clean) ttsQueue.push(clean);
    });
    if(ttsQueue.length > 0 && !ttsPlaying) {
        playNextTTSChunk();
    }
}

function playNextTTSChunk(){
    if(ttsQueue.length === 0){
        ttsPlaying = false;
        if(AVATAR.enabled){
            stopLipSync();
            Visualizer.stop();
            setAvatarState('idle');
        }
        return;
    }
    ttsPlaying = true;
    if(AVATAR.enabled){
        setAvatarState('preparing');
        Visualizer.startPreparing();
    }
    const text = ttsQueue.shift();
    fetch("http://127.0.0.1:5000/tts", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({text: text})
    })
    .then(resp => {
        if(!resp.ok) throw new Error("TTS failed");
        return resp.blob();
    })
    .then(blob => {
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        currentAudio = audio;
        audio.onplay = () => {
            if(AVATAR.enabled) {
                setAvatarState('speaking');
                Visualizer.start(audio);
                startLipSync();
            }
        };
        audio.onended = () => {
            URL.revokeObjectURL(url);
            if(AVATAR.enabled) stopLipSync();
            playNextTTSChunk();
        };
        audio.onerror = () => {
            URL.revokeObjectURL(url);
            if(AVATAR.enabled) stopLipSync();
            playNextTTSChunk();
        };
        audio.play().catch(() => {
            if(AVATAR.enabled) stopLipSync();
            playNextTTSChunk();
        });
    })
    .catch(() => {
        if(AVATAR.enabled) stopLipSync();
        playNextTTSChunk();
    });
}

// =========================
// STATE & DOM REFS
// =========================

const chatInput = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');
const chatHistory = document.getElementById('chat-history');
const micBtn = document.getElementById('mic-btn');
const voiceHint = document.getElementById('voice-hint');
const VisualizerLabel = document.getElementById('visualizer-label');

let isRecording = false;
let mediaRecorder = null;
let audioChunks = [];

// =========================
// SEND TEXT MESSAGE
// =========================

async function sendTextMessage(message){
    if(!message) return;
    if(!currentSession){
        const resp = await fetch('http://127.0.0.1:5000/create_teaching_session');
        const data = await resp.json();
        currentSession = data.session_id;
    }
    
    // Clear any playing audio immediately when user interacts
    if(currentAudio){
        currentAudio.pause();
        currentAudio = null;
    }
    ttsQueue = [];
    ttsPlaying = false;

    // Display user message bubble
    const userBubble = document.createElement('div');
    userBubble.classList.add('user-message');
    userBubble.textContent = message;
    chatHistory.appendChild(userBubble);
    // Hide top-bar on first message
    hideTopBar();
    const mainArea = document.querySelector('.main-area');
    if(mainArea) mainArea.scrollTop = mainArea.scrollHeight;

    setAvatarState('thinking');

    try{
        const response = await fetch('http://127.0.0.1:5000/text-chat', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                session_id: currentSession,
                message: message,
                history: []
            })
        });
        const data = await response.json();

        // Display falcon response bubble
        const falconBubble = document.createElement('div');
        falconBubble.classList.add('falcon-message');
        falconBubble.textContent = data.reply;
        chatHistory.appendChild(falconBubble);
        if(mainArea) mainArea.scrollTop = mainArea.scrollHeight;

        if(!conversations[currentSession]) conversations[currentSession] = [];
        conversations[currentSession].push({user: message, falcon: data.reply});

        // Trigger TTS audio
        speakText(data.reply);

        await loadSessions();

    }catch(error){
        console.error(error);
        setAvatarState('error');
        setTimeout(() => setAvatarState('idle'), 2000);
    }
}

sendBtn.addEventListener('click', () => {
    sendTextMessage(chatInput.value.trim());
    chatInput.value = '';
});

chatInput.addEventListener('keydown', (e) => {
    if(e.key === 'Enter'){
        sendTextMessage(chatInput.value.trim());
        chatInput.value = '';
    }
});

// =========================
// VOICE FLOW (Vosk speech-to-text)
// =========================

async function startVoiceFlow(){
    if(isRecording){
        if(mediaRecorder && mediaRecorder.state === "recording"){
            mediaRecorder.stop();
        }
        return;
    }

    if(!currentSession){
        const resp = await fetch('http://127.0.0.1:5000/create_teaching_session');
        const data = await resp.json();
        currentSession = data.session_id;
    }

    // Stop currently playing audio on mic tap
    if(currentAudio){
        currentAudio.pause();
        currentAudio = null;
    }
    ttsQueue = [];
    ttsPlaying = false;

    try{
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioChunks = [];
        mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm;codecs=opus" });

        mediaRecorder.ondataavailable = (e) => {
            if(e.data.size > 0) audioChunks.push(e.data);
        };

        mediaRecorder.onstop = async () => {
            isRecording = false;
            micBtn.classList.remove("recording");
            setAvatarState('thinking');
            voiceHint.style.display = "block";
            voiceHint.textContent = "Transcribing...";
            voiceHint.className = "voice-hint processing";

            stream.getTracks().forEach(t => t.stop());

            const audioBlob = new Blob(audioChunks, { type: "audio/webm" });

            if(audioBlob.size < 1000){
                voiceHint.textContent = "Recording too short — try again";
                voiceHint.className = "voice-hint error";
                setAvatarState('idle');
                return;
            }

            const formData = new FormData();
            formData.append("audio", audioBlob, "recording.webm");

            try{
                const resp = await fetch("http://127.0.0.1:5000/transcribe", {
                    method: "POST",
                    body: formData
                });
                const data = await resp.json();

                if(data.error){
                    voiceHint.textContent = "Error: " + data.error;
                    voiceHint.className = "voice-hint error";
                    setAvatarState('idle');
                    return;
                }

                const transcript = (data.transcript || "").trim();
                if(!transcript){
                    voiceHint.textContent = "No speech detected — try again";
                    voiceHint.className = "voice-hint error";
                    setAvatarState('idle');
                    return;
                }

                voiceHint.style.display = "none";
                sendTextMessage(transcript);

            } catch(err){
                console.error("[VOICE] Transcribe error:", err);
                voiceHint.textContent = "Transcription failed — try again";
                voiceHint.className = "voice-hint error";
                setAvatarState('idle');
            }
        };

        mediaRecorder.start();
        isRecording = true;
        micBtn.classList.add("recording");
        setAvatarState('listening');
        voiceHint.style.display = "block";
        voiceHint.textContent = "Recording — tap to stop";
        voiceHint.className = "voice-hint listening";

    } catch(err){
        console.error("[VOICE] Mic access denied:", err);
        voiceHint.style.display = "block";
        if(err.name === "NotAllowedError"){
            voiceHint.textContent = "Microphone permission denied";
        } else {
            voiceHint.textContent = "Mic error: " + err.message;
        }
        voiceHint.className = "voice-hint error";
    }
}

micBtn.addEventListener('click', startVoiceFlow);

// =========================
// MENU TOGGLE
// =========================

const menuToggle = document.getElementById('menuToggle');
const sidebar = document.querySelector('.sidebar');
menuToggle.addEventListener('click', () => {
    sidebar.classList.toggle('hide-sidebar');
});

// =========================
// AVATAR UI CONTROLS & LISTENERS
// =========================

const avatarToggleBtn = document.getElementById('avatar-toggle-btn');
const avatarDropdown = document.getElementById('avatar-dropdown');
const avatarFileInput = document.getElementById('avatar-file-input');
const previewModal = document.getElementById('avatar-preview-modal');
const confirmBtn = document.getElementById('confirm-avatar-btn');
const cancelPreviewBtn = document.getElementById('cancel-preview-btn');

function toggleDropdown(){
    if(avatarDropdown) avatarDropdown.classList.toggle('hidden-dropdown');
}

function closeDropdown(){
    if(avatarDropdown) avatarDropdown.classList.add('hidden-dropdown');
}

if(avatarToggleBtn){
    avatarToggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleDropdown();
    });
}

if(avatarDropdown){
    avatarDropdown.addEventListener('click', (e) => {
        const item = e.target.closest('.avatar-dropdown-item');
        if(!item) return;

        const action = item.dataset.action;
        closeDropdown();

        if(action === 'cancel') return;

        if(action === 'default'){
            initializeAvatar();
            if(AvatarProvider.isImage()){
                AvatarProvider.switchToDefault();
            }
            return;
        }

        if(action === 'upload'){
            AvatarProvider.handleImageUpload();
            return;
        }
    });
}

document.addEventListener('click', (e) => {
    if(
        avatarDropdown &&
        !avatarDropdown.classList.contains('hidden-dropdown') &&
        !avatarDropdown.contains(e.target) &&
        e.target !== avatarToggleBtn &&
        !avatarToggleBtn.contains(e.target)
    ){
        closeDropdown();
    }
});

document.addEventListener('keydown', (e) => {
    if(e.key === 'Escape' && avatarDropdown && !avatarDropdown.classList.contains('hidden-dropdown')){
        closeDropdown();
        if(avatarToggleBtn) avatarToggleBtn.focus();
    }

    if(e.key === 'Escape' && previewModal && !previewModal.classList.contains('hidden-modal')){
        previewModal.classList.add('hidden-modal');
        AvatarProvider.pendingFile = null;
    }
});

if(avatarFileInput){
    avatarFileInput.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        if(!file) return;
        AvatarProvider.previewUploadedImage(file);
        avatarFileInput.value = '';
    });
}

if(confirmBtn){
    confirmBtn.addEventListener('click', () => {
        AvatarProvider.confirmImage();
    });
}

if(cancelPreviewBtn){
    cancelPreviewBtn.addEventListener('click', () => {
        if(previewModal) previewModal.classList.add('hidden-modal');
        AvatarProvider.pendingFile = null;
    });
}

if(previewModal){
    previewModal.addEventListener('click', (e) => {
        if(e.target === previewModal){
            previewModal.classList.add('hidden-modal');
            AvatarProvider.pendingFile = null;
        }
    });
}

// =========================
// INIT
// =========================

Visualizer.init();
loadSessions();
initializeAvatar();
showAvatar();
