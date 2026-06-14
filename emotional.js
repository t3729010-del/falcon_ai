let emotionStats =
JSON.parse(
    localStorage.getItem("emotionStats")
) || {
    happy: 0,
    sad: 0,
    calm: 0,
    motivated: 0,
    thoughtful: 0,
    confused: 0,
    overwhelmed: 0,
    frustrated: 0
};

// =========================
// AUDIO VISUALIZER
// =========================

const Visualizer = {
    canvas: null,
    ctx: null,
    animId: null,
    active: false,
    bars: 48,

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
        this.canvas.height = 100 * 2;
        this.canvas.style.width = w + 'px';
        this.canvas.style.height = '100px';
        this.ctx && this.ctx.scale(2, 2);
    },

    start(){
        const section = document.getElementById('visualizer-section');
        if(section) {
            section.classList.remove('preparing');
        }
        const label = document.getElementById('visualizer-label');
        if(label) {
            label.textContent = "Falcon is responding...";
        }
        if(!this.ctx) return;
        this.active = true;
        this._show(true);
        this._loop();
    },

    startPreparing(){
        const section = document.getElementById('visualizer-section');
        if(section) {
            section.classList.add('preparing');
            section.classList.add('visible');
        }
        const label = document.getElementById('visualizer-label');
        if(label) {
            label.textContent = "Falcon is preparing voice...";
        }
    },

    stop(){
        this.active = false;
        if(this.animId){
            cancelAnimationFrame(this.animId);
            this.animId = null;
        }
        this._drawFlat();
        const section = document.getElementById('visualizer-section');
        if(section) {
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
        const now = performance.now() / 1000;

        ctx.clearRect(0, 0, w, h);

        const barW = (w - 20) / this.bars;
        const gap = 1.5;
        const barH = h - 24;

        for(let i = 0; i < this.bars; i++){
            const phase = i / this.bars * Math.PI * 4 + now * 6;
            const envelope = 1 - Math.abs(i / this.bars - 0.5) * 0.6;
            const height = (0.08 + Math.abs(Math.sin(phase)) * 0.7 + Math.sin(phase * 0.7 + 1) * 0.22) * barH * envelope;

            const x = 10 + i * barW + gap / 2;
            const y = h - 12 - height;

            const hue = 185 + Math.sin(now * 0.5 + i * 0.3) * 5;
            ctx.fillStyle = `hsla(${hue}, 100%, 60%, ${0.35 + height / barH * 0.45})`;
            ctx.shadowColor = `rgba(0, 217, 255, ${0.15 + height / barH * 0.25})`;
            ctx.shadowBlur = 8;
            ctx.beginPath();
            const r = 2;
            ctx.roundRect(x, y, barW - gap, Math.max(2, height), r);
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
            const y = h - 14;
            ctx.fillStyle = `rgba(0, 217, 255, 0.08)`;
            ctx.beginPath();
            ctx.roundRect(x, y, barW - gap, 3, 2);
            ctx.fill();
        }

        this._show(false);
    }
};

async function loadSessions() {

    const response =
    await fetch(
        "http://127.0.0.1:5000/sessions"
    );

    const sessions =
    await response.json();

    sessionList.innerHTML = "";
    archiveList.innerHTML = "";

    sessions.forEach(session => {

        const sessionElement =
        document.createElement("div");

        sessionElement.classList.add(
            "session-item"
        );

        sessionElement.dataset.id =
        session.id;

        sessionElement.innerHTML = `

            <span class="session-title">
                ${session.title}
            </span>

            <button class="session-menu">
                ⋮
            </button>

            <div class="session-dropdown">

                <button class="share-btn">
                    Share
                </button>

                ${
                    session.is_archived
                    ? `<button class="unarchive-btn">
                        Unarchive
                    </button>`
                    : `<button class="archive-btn">
                        Archive
                    </button>`
                }

                <button class="delete-btn">
                    Delete
                </button>

            </div>

        `;

        if(session.is_archived){
            archiveList.appendChild(
                sessionElement
            );
        }else{
            sessionList.appendChild(
                sessionElement
            );
        }

    });

}

let conversations = {};

let currentSession = null;

// =========================
// AVATAR PROVIDER ABSTRACTION
// =========================

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

        // ── Show loading overlay with stage display ──
        const section = document.querySelector('.main-content');
        const loadingOverlay = document.createElement('div');
        loadingOverlay.className = 'avatar-loading-overlay';
        loadingOverlay.innerHTML = `
            <div class="avatar-loading-spinner"></div>
            <p class="avatar-loading-text" id="avatar-stage-text">Uploading image...</p>
            <div class="avatar-stage-track">
                <span class="avatar-stage-dot active" data-stage="0"></span>
                <span class="avatar-stage-dot" data-stage="1"></span>
                <span class="avatar-stage-dot" data-stage="2"></span>
                <span class="avatar-stage-dot" data-stage="3"></span>
            </div>
        `;
        if(section) section.appendChild(loadingOverlay);

        const setStage = (index, text) => {
            const textEl = document.getElementById('avatar-stage-text');
            if(textEl) textEl.textContent = text;
            const dots = loadingOverlay.querySelectorAll('.avatar-stage-dot');
            dots.forEach((d, i) => {
                d.classList.toggle('active', i <= index);
                d.classList.toggle('done', i < index);
            });
        };

        const sleep = (ms) => new Promise(r => setTimeout(r, ms));

        setStage(0, 'Uploading image...');
        await sleep(200);

        const reader = new FileReader();

        reader.onload = async (e) => {

            const imageDataUrl = e.target.result;

            console.log('%c[GENERATION_STARTED]', 'color:#ffaa00;font-weight:bold', `Payload: ${(imageDataUrl.length / 1024).toFixed(0)}KB`);

            setStage(1, 'Analyzing face...');
            await sleep(800);

            const startTime = Date.now();

            try{

                setStage(2, 'Generating avatar...');

                console.log('%c[MODEL_REQUEST_SENT]', 'color:#ffaa00;font-weight:bold', 'POST /generate_avatar');

                const response = await fetch(
                    'http://127.0.0.1:5000/generate_avatar',
                    {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({image: imageDataUrl}),
                        signal: AbortSignal.timeout(120000)
                    }
                );

                const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

                console.log(
                    '%c[MODEL_RESPONSE_RECEIVED]', 'color:#ffaa00;font-weight:bold',
                    `HTTP ${response.status} (${elapsed}s)`
                );

                if(!response.ok){
                    const errData = await response.json().catch(() => ({}));
                    throw new Error(errData.error || `Server returned ${response.status}`);
                }

                const result = await response.json();

                let avatarDataUrl = null;

                if(result.use_browser_fallback && typeof BrowserAvatar !== 'undefined'){
                    // ── BROWSER FALLBACK: process image in Canvas ──
                    setStage(1, 'Applying cartoonization...');
                    await sleep(200);
                    setStage(2, 'Framing avatar...');
                    await sleep(200);
                    setStage(3, 'Enhancing avatar...');

                    console.log('%c[BROWSER_AVATAR]', 'color:#ffaa00;font-weight:bold', 'Using Canvas-based avatar processor');
                    avatarDataUrl = await BrowserAvatar.generate(file);
                    console.log('%c[BROWSER_AVATAR]', 'color:#22c55e;font-weight:bold', `Generated: ${(avatarDataUrl.length / 1024).toFixed(0)}KB`);

                }else if(result.success && result.avatar){
                    if(result.avatar === imageDataUrl){
                        throw new Error('Generated avatar is identical to uploaded image — generation failed silently');
                    }
                    avatarDataUrl = result.avatar;

                }else{
                    throw new Error(result.error || 'Generation returned empty result');
                }

                // ── SUCCESS ──
                setStage(3, 'Enhancing avatar...');
                await sleep(500);

                if(loadingOverlay.parentNode) loadingOverlay.parentNode.removeChild(loadingOverlay);

                console.log('%c[AVATAR_GENERATED]', 'color:#22c55e;font-weight:bold', `Size: ${(avatarDataUrl.length / 1024).toFixed(0)}KB`);

                initializeAvatar();
                showAvatar();
                this.createImageAvatar(avatarDataUrl);

                const btn = document.getElementById('avatar-toggle-btn');
                if(btn){
                    btn.setAttribute('aria-label', 'Deactivate Falcon Avatar Assistant');
                    btn.title = 'Deactivate Avatar';
                }

                console.log('%c[AVATAR_RENDERED]', 'color:#22c55e;font-weight:bold', 'Avatar displayed in DOM');

            }catch(error){

                if(loadingOverlay.parentNode) loadingOverlay.parentNode.removeChild(loadingOverlay);

                const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
                console.log('%c[AVATAR_ERROR]', 'color:#ff4444;font-weight:bold', `${error.message} (${elapsed}s)`);

                // ── Show error state (NEVER display original image) ──
                const errorContainer = document.createElement('div');
                errorContainer.className = 'avatar-generation-error';
                errorContainer.innerHTML = `
                    <p style="color:#ff6b6b;text-align:center;margin-bottom:12px;">
                        ⚠ Avatar generation failed. Please try another image.
                    </p>
                    <p style="color:#889;text-align:center;font-size:13px;margin-bottom:16px;">
                        ${error.message}
                    </p>
                    <button class="avatar-retry-btn">↻ Try Again</button>
                `;
                if(section) section.appendChild(errorContainer);

                errorContainer.querySelector('.avatar-retry-btn').addEventListener('click', () => {
                    if(errorContainer.parentNode) errorContainer.parentNode.removeChild(errorContainer);
                    this.generateAvatarFromPhoto(file);
                });
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

    updateAvatarTexture(src){
        const imgEl = document.getElementById('avatar-image-el');
        if(imgEl) imgEl.src = src;
        this.imageSrc = src;
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
    enabled: false,
    initialized: false,
    state: 'idle',
    blinkTimer: null,
    idleRAF: null,
    lipSyncTimer: null,
    tts: window.speechSynthesis,
    utterance: null,
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
        ringInner: document.querySelector('.avatar-ring-inner'),
        staticImg: document.getElementById('static-humanoid'),
        section: document.querySelector('.main-content')
    };

    AvatarProvider.initializeImageElements();

    AVATAR.initialized = true;

}

function showAvatar(){

    if(!AVATAR.initialized) initializeAvatar();

    const e = AVATAR.els;

    if(e.staticImg) e.staticImg.style.opacity = '0';
    if(e.container) e.container.classList.remove('hidden-avatar');
    if(e.section) e.section.classList.add('avatar-active');

    AVATAR.enabled = true;

    if(AvatarProvider.isDefault()){

        const svgWrapper = document.getElementById('avatar-body');
        if(svgWrapper) svgWrapper.style.display = 'flex';

    }

    setAvatarState('idle');
    startIdleAnimation();

}

function hideAvatar(){

    if(!AVATAR.initialized) initializeAvatar();

    stopIdleAnimation();
    stopLipSync();

    if(AVATAR.tts.speaking){
        AVATAR.tts.cancel();
    }

    const e = AVATAR.els;

    if(e.staticImg) e.staticImg.style.opacity = '1';
    if(e.container) e.container.classList.add('hidden-avatar');
    if(e.section) e.section.classList.remove('avatar-active');

    AVATAR.enabled = false;
    AVATAR.state = 'idle';

}

function setAvatarState(state){

    if(!AVATAR.enabled) return;

    const validStates = ['idle','listening','thinking','speaking','preparing','loading','error'];

    if(!validStates.includes(state)) return;

    AVATAR.state = state;

    const e = AVATAR.els;

    if(!e.container) return;

    e.container.classList.remove(
        'idle','listening','thinking','speaking','preparing','loading','error'
    );

    e.container.classList.add(state);

    if(AvatarProvider.isDefault()){

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

    }

    if(state === 'error'){

        stopIdleAnimation();
        stopLipSync();

        if(AVATAR.tts.speaking){
            AVATAR.tts.cancel();
        }

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

                    },250);

                }

            }else{

                const overlay = document.getElementById('avatar-blink-overlay');

                if(overlay){

                    overlay.style.animation = 'none';
                    overlay.offsetHeight;
                    overlay.style.animation = 'imgBlink 0.25s ease';

                    setTimeout(() => {

                        if(overlay) overlay.style.animation = '';

                    },280);

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

// =========================
// SPEECH & LIP SYNC
// =========================

function speakResponse(text){

    if(!AVATAR.enabled) return;

    if(!text || typeof text !== 'string'){

        setAvatarState('error');
        setTimeout(() => setAvatarState('idle'),1500);
        return;

    }

    if(AVATAR.tts.speaking){
        AVATAR.tts.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);

    utterance.lang = 'en-US';
    utterance.rate = 1;
    utterance.pitch = 1;

    utterance.onstart = () => {

        startLipSync();
        setAvatarState('speaking');

    };

    utterance.onend = () => {

        stopLipSync();
        setAvatarState('idle');

    };

    utterance.onerror = () => {

        stopLipSync();
        setAvatarState('error');

        setTimeout(() => setAvatarState('idle'),2000);

    };

    AVATAR.utterance = utterance;

    AVATAR.tts.speak(utterance);

}

function handleAIResponse(responseText){
    if(!AVATAR.enabled) return;
    setAvatarState('speaking');
    Visualizer.start();
    if(AVATAR.tts.speaking) AVATAR.tts.cancel();
    const utterance = new SpeechSynthesisUtterance(responseText);
    utterance.lang = 'en-US';
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.onstart = () => {
        startLipSync();
        setAvatarState('speaking');
    };
    utterance.onend = () => {
        stopLipSync();
        Visualizer.stop();
        setAvatarState('idle');
    };
    utterance.onerror = () => {
        stopLipSync();
        Visualizer.stop();
        setAvatarState('error');
        setTimeout(() => setAvatarState('idle'), 2000);
    };
    AVATAR.utterance = utterance;
    AVATAR.tts.speak(utterance);
}

function startLipSync(){

    if(!AVATAR.enabled) return;

    stopLipSync();

    if(!AvatarProvider.isDefault()) return;

    AVATAR.lipSyncTimer = setInterval(() => {

        const e = AVATAR.els;

        if(!e.mouth) return;

        if(AVATAR.state !== 'speaking'){

            e.mouth.setAttribute('ry','5');
            return;

        }

        const openValues = [6,9,12,8,14,7,11,10];
        const ry = openValues[Math.floor(Math.random() * openValues.length)];

        e.mouth.setAttribute('ry',String(ry));

    },100);

}

function stopLipSync(){

    if(AVATAR.lipSyncTimer){
        clearInterval(AVATAR.lipSyncTimer);
        AVATAR.lipSyncTimer = null;
    }

    const e = AVATAR.els;

    if(e.mouth){
        e.mouth.setAttribute('ry','5');
    }

}

// =========================
// DROPDOWN & ACTIVATION HANDLERS
// =========================

const avatarToggleBtn =
document.getElementById('avatar-toggle-btn');

const avatarDropdown =
document.getElementById('avatar-dropdown');

const avatarFileInput =
document.getElementById('avatar-file-input');

const previewModal =
document.getElementById('avatar-preview-modal');

const confirmBtn =
document.getElementById('confirm-avatar-btn');

const cancelPreviewBtn =
document.getElementById('cancel-preview-btn');

function closeDropdown(){

    if(avatarDropdown){
        avatarDropdown.classList.add('hidden-dropdown');
    }

}

function toggleDropdown(){

    if(!avatarDropdown) return;

    const isHidden = avatarDropdown.classList.contains('hidden-dropdown');

    closeDropdown();

    if(isHidden){

        const deactivateItem =
        document.getElementById('dropdown-deactivate');

        if(deactivateItem){

            deactivateItem.style.display =
            AVATAR.enabled ? 'flex' : 'none';

        }

        avatarDropdown.classList.remove('hidden-dropdown');

        const firstItem = avatarDropdown.querySelector(
            '.avatar-dropdown-item:not(.dropdown-cancel)'
        );

        setTimeout(() => {

            if(firstItem) firstItem.focus();

        },50);

    }

}

avatarToggleBtn.addEventListener('click',(e) => {

    e.stopPropagation();

    if(!AVATAR.initialized) initializeAvatar();

    toggleDropdown();

});

avatarDropdown.addEventListener('click',(e) => {

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

        if(!AVATAR.enabled){

            showAvatar();

            avatarToggleBtn.setAttribute(
                'aria-label',
                'Deactivate Falcon Avatar Assistant'
            );

            avatarToggleBtn.title = 'Deactivate Avatar';

        }

        return;
    }

    if(action === 'upload'){

        AvatarProvider.handleImageUpload();
        return;
    }

    if(action === 'deactivate'){

        hideAvatar();

        avatarToggleBtn.setAttribute(
            'aria-label',
            'Activate Falcon Avatar Assistant'
        );

        avatarToggleBtn.title = 'Activate Avatar';

        return;
    }

});

document.addEventListener('click',(e) => {

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

document.addEventListener('keydown',(e) => {

    if(e.key === 'Escape' && avatarDropdown && !avatarDropdown.classList.contains('hidden-dropdown')){

        closeDropdown();
        avatarToggleBtn.focus();

    }

    if(e.key === 'Escape' && previewModal && !previewModal.classList.contains('hidden-modal')){

        previewModal.classList.add('hidden-modal');
        AvatarProvider.pendingFile = null;

    }

});

avatarFileInput.addEventListener('change',(e) => {

    const file = e.target.files && e.target.files[0];

    if(!file) return;

    AvatarProvider.previewUploadedImage(file);

    avatarFileInput.value = '';

});

confirmBtn.addEventListener('click',() => {

    AvatarProvider.confirmImage();

});

cancelPreviewBtn.addEventListener('click',() => {

    if(previewModal) previewModal.classList.add('hidden-modal');

    AvatarProvider.pendingFile = null;

});

previewModal.addEventListener('click',(e) => {

    if(e.target === previewModal){

        previewModal.classList.add('hidden-modal');
        AvatarProvider.pendingFile = null;

    }

});

// SIDEBAR TOGGLE

const menuBtn = document.getElementById("menu-btn");
const sidebar = document.getElementById("sidebar");

menuBtn.addEventListener("click", () => {

    sidebar.classList.toggle("hide-sidebar");

});


// NEW SESSION

const newChatBtn =
document.getElementById("new-chat-btn");

const sessionList =
document.querySelector(".session-list");

const archiveList =
document.querySelector(".archive-list");

const firstSession =
document.querySelector(".session-item");

if(firstSession){

    currentSession =
    firstSession.dataset.id;

    firstSession.classList.add(
        "active-session"
    );

}

let sessionCount =
document.querySelectorAll(".session-item").length;

newChatBtn.addEventListener("click",async () => {

    sessionCount++;

    const response =
    await fetch(
        "http://127.0.0.1:5000/create_session"
    );

    const data =
    await response.json();

    const sessionId =
    data.session_id;

    currentSession =
    sessionId;

    conversations[sessionId] = [];

    localStorage.setItem(
        "falconConversations",
        JSON.stringify(conversations)
    );

    document
    .querySelectorAll(".session-item")
    .forEach(item => {

        item.classList.remove(
        "active-session");

    });

    await loadSessions();

});

document.addEventListener("click", (e) => {

    const allMenus =
    document.querySelectorAll(
        ".session-dropdown"
    );

    if(e.target.classList.contains("session-menu")){

        const dropdown =
        e.target.nextElementSibling;
        const sessionItem =
        e.target.closest(".session-item");

        const overlay =
        document.querySelector(
            ".sidebar-overlay"
        );

        allMenus.forEach(menu => {

            if(menu !== dropdown){

                menu.classList.remove(
                    "show-dropdown"
                );

            }

        });

        dropdown.classList.toggle(
            "show-dropdown"
        );

        overlay.classList.toggle(
            "show"
        );

        sessionItem.classList.toggle(
            "menu-open"
        );

    }else{

        allMenus.forEach(menu => {

            menu.classList.remove(
                "show-dropdown"
            );

        });

        document
        .querySelectorAll(".session-item")
        .forEach(item => {

            item.classList.remove(
                "menu-open"
            );

        });

        document
        .querySelector(".sidebar-overlay")
        .classList.remove(
            "show"
        );

    }

});

document.addEventListener(
    "click",
    async (e) => {

        if(
            e.target.classList.contains(
                "delete-btn"
            )
        ){

            const sessionItem =
            e.target.closest(
                ".session-item"
            );

            const sessionId =
            sessionItem.dataset.id;

            await fetch(
                `http://127.0.0.1:5000/delete_session/${sessionId}`,
                {
                    method: "DELETE"
                }
            );

            await loadSessions();

        }

    }
);

document.addEventListener("click", async (e) => {

    if(
        e.target.classList.contains("archive-btn") ||
        e.target.classList.contains("unarchive-btn")
    ){

        const sessionItem =
        e.target.closest(".session-item");

        const dropdown =
        sessionItem.querySelector(
            ".session-dropdown"
        );

        dropdown.classList.remove(
            "show-dropdown"
        );

        if(
            e.target.classList.contains(
                "archive-btn"
            )
        ){

            e.target.textContent =
            "Unarchive";

            e.target.classList.remove(
                "archive-btn"
            );

            e.target.classList.add(
                "unarchive-btn"
            );

            const sessionId =
            sessionItem.dataset.id;

            await fetch(
                `http://127.0.0.1:5000/archive_session/${sessionId}`,
                {
                    method: "POST"
                }
            );

            await loadSessions();

        }else{

            e.target.textContent =
            "Archive";

            e.target.classList.remove(
                "unarchive-btn"
            );

            e.target.classList.add(
                "archive-btn"
            );

            const sessionId =
            sessionItem.dataset.id;

            await fetch(
                `http://127.0.0.1:5000/unarchive_session/${sessionId}`,
                {
                    method: "POST"
                }
            );

            await loadSessions();

        }

    }

});

const archiveToggle =
document.getElementById(
    "archive-toggle"
);

archiveToggle.addEventListener(
    "click",
    () => {

        archiveList.classList.toggle(
            "hidden-archive"
        );

        if(
            archiveList.classList.contains(
                "hidden-archive"
            )
        ){

            archiveToggle.textContent =
            "▶ Archived";

        }else{

            archiveToggle.textContent =
            "▼ Archived";

        }

    }
);

const chatInput =
document.getElementById(
    "chat-input"
);

const sendBtn =
document.getElementById(
    "send-btn"
);

const chatHistory =
document.getElementById(
    "chat-history"
);

const micBtn =
document.getElementById(
    "mic-btn"
);

const voiceHint =
document.getElementById(
    "voice-hint"
);

const VisualizerLabel =
document.getElementById(
    "visualizer-label"
);

// =========================
// TEXT CHAT
// =========================

async function sendTextMessage(message){
    if(!message) return;

    const emotionSection = document.querySelector(".emotion-section");
    const heroH1 = document.querySelector(".main-content h1");
    const heroSub = document.querySelector(".subtitle");
    const humanoidImg = document.getElementById("static-humanoid");
    const platformEl = document.querySelector(".platform");
    if(emotionSection) emotionSection.style.display = "none";
    if(heroH1) heroH1.style.display = "none";
    if(heroSub) heroSub.style.display = "none";
    if(humanoidImg) humanoidImg.style.display = "none";
    if(platformEl) platformEl.style.display = "none";

    if(!currentSession){
        const resp = await fetch("http://127.0.0.1:5000/create_session");
        const data = await resp.json();
        currentSession = data.session_id;
        await loadSessions();
    }

    const userBubble = document.createElement("div");
    userBubble.classList.add("user-message");
    userBubble.textContent = message;
    chatHistory.appendChild(userBubble);
    chatHistory.scrollTop = chatHistory.scrollHeight;

    if(voiceMode){
        if(!AVATAR.initialized) initializeAvatar();
        showAvatar();
        setAvatarState('listening');
    } else {
        if(AVATAR.enabled) setAvatarState('listening');
    }

    let falconBubble = null;
    if(!voiceMode){
        falconBubble = document.createElement("div");
        falconBubble.classList.add("falcon-message");
        falconBubble.textContent = "";
        chatHistory.appendChild(falconBubble);
    }

    let fullReply = "";
    ttsBuffer = "";
    ttsQueue = [];
    ttsPlaying = false;

    try{
        if(AVATAR.enabled) setAvatarState('thinking');
        const response = await fetch(
            "http://127.0.0.1:5000/chat-stream",
            {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                    session_id: currentSession,
                    message: message
                })
            }
        );

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while(true){
            const {done, value} = await reader.read();
            if(done) break;
            const chunk = decoder.decode(value);
            const lines = chunk.split("\n");
            for(const line of lines){
                if(line.startsWith("data: ")){
                    const token = line.slice(6);
                    if(token.trim() === "[DONE]") continue;
                    fullReply += token;
                    if(falconBubble) falconBubble.textContent = fullReply;
                    chatHistory.scrollTop = chatHistory.scrollHeight;
                    if(voiceMode) processTTSToken(token);
                }
            }
        }

        if(voiceMode) flushTTSBuffer();

        if(!conversations[currentSession]) conversations[currentSession] = [];
        if(currentSession){
            conversations[currentSession].push({user: message, falcon: fullReply});
            localStorage.setItem("falconConversations", JSON.stringify(conversations));
        }

        if(AVATAR.enabled && !voiceMode) handleAIResponse(fullReply);
    }catch(error){
        console.error(error);
        if(falconBubble) falconBubble.textContent = "Sorry, something went wrong. Please try again.";
        if(AVATAR.enabled){
            setAvatarState('error');
            setTimeout(() => setAvatarState('idle'), 2000);
        }
    }
}

sendBtn.addEventListener("click", () => {
    sendTextMessage(chatInput.value.trim());
    chatInput.value = "";
});

chatInput.addEventListener("keydown", (e) => {
    if(e.key === "Enter"){
        sendTextMessage(chatInput.value.trim());
        chatInput.value = "";
    }
});

// =========================
// VOICE CHAT (Vosk)
// =========================

let voiceMode = JSON.parse(localStorage.getItem("voiceMode")) || false;
let isRecording = false;
let mediaRecorder = null;
let audioChunks = [];

// =========================
// STREAMING TTS QUEUE
// =========================

let ttsQueue = [];
let ttsPlaying = false;
let ttsBuffer = "";
const TTS_MIN_CHUNK = 60;
const TTS_MAX_CHUNK = 200;
const TTS_SENTENCE_RE = /[^.!?,;:]+[.!?,;:]+/g;

function flushTTSBuffer(){
    const remaining = ttsBuffer.trim();
    ttsBuffer = "";
    if(remaining) enqueueTTSChunk(remaining);
}

function enqueueTTSChunk(text){
    const clean = text.trim();
    if(!clean) return;
    ttsQueue.push(clean);
    if(!ttsPlaying) playNextTTSChunk();
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
        audio.onplay = () => {
            if(AVATAR.enabled) {
                setAvatarState('speaking');
                Visualizer.start();
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

function processTTSToken(token){
    if(!voiceMode) return;
    ttsBuffer += token;
    let match;
    while((match = TTS_SENTENCE_RE.exec(ttsBuffer)) !== null){
        const endIdx = match.index + match[0].length;
        if(endIdx >= TTS_MIN_CHUNK){
            const chunk = ttsBuffer.slice(0, endIdx);
            ttsBuffer = ttsBuffer.slice(endIdx);
            enqueueTTSChunk(chunk);
            TTS_SENTENCE_RE.lastIndex = 0;
            break;
        }
    }
    if(ttsBuffer.length >= TTS_MAX_CHUNK){
        enqueueTTSChunk(ttsBuffer);
        ttsBuffer = "";
    }
}

const voiceToggleBtn = document.getElementById("voice-toggle-btn");

function updateVoiceToggleUI(){
    if(!voiceToggleBtn) return;
    if(voiceMode){
        voiceToggleBtn.classList.add("active");
        voiceToggleBtn.title = "Voice mode: ON (AI speaks replies)";
    } else {
        voiceToggleBtn.classList.remove("active");
        voiceToggleBtn.title = "Voice mode: OFF";
    }
}

if(voiceToggleBtn){
    voiceToggleBtn.addEventListener("click", () => {
        voiceMode = !voiceMode;
        localStorage.setItem("voiceMode", JSON.stringify(voiceMode));
        updateVoiceToggleUI();
        if(!voiceMode && AVATAR.enabled) hideAvatar();
        console.log("[VOICE] Voice mode:", voiceMode ? "ON" : "OFF");
    });
    updateVoiceToggleUI();
}

async function startVoiceFlow(){
    console.log("[VOICE] startVoiceFlow called, isRecording:", isRecording);

    if(isRecording){
        console.log("[VOICE] Stopping recording...");
        if(mediaRecorder && mediaRecorder.state === "recording"){
            mediaRecorder.stop();
        }
        return;
    }

    const emotionSection = document.querySelector(".emotion-section");
    const heroH1 = document.querySelector(".main-content h1");
    const heroSub = document.querySelector(".subtitle");
    const humanoidImg = document.getElementById("static-humanoid");
    const platformEl = document.querySelector(".platform");
    if(emotionSection) emotionSection.style.display = "none";
    if(heroH1) heroH1.style.display = "none";
    if(heroSub) heroSub.style.display = "none";
    if(humanoidImg) humanoidImg.style.display = "none";
    if(platformEl) platformEl.style.display = "none";

    try{
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        console.log("[VOICE] Mic access granted");

        audioChunks = [];
        mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm;codecs=opus" });

        mediaRecorder.ondataavailable = (e) => {
            if(e.data.size > 0) audioChunks.push(e.data);
        };

        mediaRecorder.onstop = async () => {
            console.log("[VOICE] Recording stopped, sending to /transcribe...");
            isRecording = false;
            micBtn.classList.remove("recording");
            voiceHint.style.display = "block";
            voiceHint.textContent = "Transcribing...";
            voiceHint.className = "voice-hint processing";

            stream.getTracks().forEach(t => t.stop());

            const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
            console.log("[VOICE] Audio size:", audioBlob.size, "bytes");

            if(audioBlob.size < 1000){
                voiceHint.textContent = "Recording too short — try again";
                voiceHint.className = "voice-hint error";
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
                console.log("[VOICE] Transcription:", data);

                if(data.error){
                    voiceHint.textContent = "Error: " + data.error;
                    voiceHint.className = "voice-hint error";
                    return;
                }

                const transcript = (data.transcript || "").trim();
                if(!transcript){
                    voiceHint.textContent = "No speech detected — try again";
                    voiceHint.className = "voice-hint error";
                    return;
                }

                voiceHint.style.display = "none";
                sendTextMessage(transcript);

            } catch(err){
                console.error("[VOICE] Transcribe error:", err);
                voiceHint.textContent = "Transcription failed — try again";
                voiceHint.className = "voice-hint error";
            }
        };

        mediaRecorder.start();
        isRecording = true;
        micBtn.classList.add("recording");
        voiceHint.style.display = "block";
        voiceHint.textContent = "Recording — tap to stop";
        voiceHint.className = "voice-hint listening";
        console.log("[VOICE] Recording started");

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

micBtn.addEventListener("click", startVoiceFlow);

const emotionButtons =
document.querySelectorAll(
    ".emotion-grid button"
);

emotionButtons.forEach(btn => {

    btn.addEventListener(
        "click",
        () => {

            const text =
            btn.textContent
            .trim();

            const emotion =
            text
            .toLowerCase()
            .replace(/[^\w]/g,"")
            .trim();

            emotionStats[emotion]++;

            localStorage.setItem(
                "emotionStats",
                JSON.stringify(emotionStats)
            );

            sendTextMessage(text);

            document.querySelector(
                ".emotion-section"
            ).style.display = "none";

            document.querySelector(
                ".main-content h1"
            ).style.display = "none";

            document.querySelector(
                ".subtitle"
            ).style.display = "none";

            document.getElementById(
                "static-humanoid"
            ).style.display = "none";

            document.querySelector(
                ".platform"
            ).style.display = "none";

        }
    );

});

document.addEventListener(
    "click",
    async (e) => {

        const session =
        e.target.closest(".session-item");

        if(!session) return;

        document
        .querySelectorAll(".session-item")
        .forEach(item => {

            item.classList.remove(
                "active-session"
            );

        });

        session.classList.add(
            "active-session"
        );

        currentSession =
        session.dataset.id;

        chatHistory.innerHTML = "";

        const response =
        await fetch(
            `http://127.0.0.1:5000/messages/${currentSession}`
        );

        const messages =
        await response.json();

        messages.forEach(msg => {

            const bubble =
            document.createElement("div");

            bubble.classList.add(
                msg.sender === "user"
                ? "user-message"
                : "falcon-message"
            );

            bubble.textContent =
            msg.content;

            chatHistory.appendChild(
                bubble
            );

        });

    }
);

loadSessions();
Visualizer.init();

const searchInput = document.getElementById(
    "search-conversations"
);

searchInput.addEventListener("input", () => {

    const searchTerm =
        searchInput.value.toLowerCase();

    const sessions =
        document.querySelectorAll(".session-item");

    sessions.forEach(session => {

        const text =
            session.textContent.toLowerCase();

        if (text.includes(searchTerm)) {

            session.style.display = "flex";

        } else {

            session.style.display = "none";

        }

    });

});