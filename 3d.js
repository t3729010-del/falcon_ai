// =========================
// SESSION SIDEBAR
// =========================

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
        await loadSessions();
    }catch(e){
        console.error('Failed to create session:', e);
    }
}

async function loadSessionMessages(sessionId){
    currentSession = sessionId;
    chatHistory.innerHTML = '';
    try{
        const resp = await fetch(`http://127.0.0.1:5000/teaching_messages/${sessionId}`);
        const messages = await resp.json();
        messages.forEach(m => {
            const bubble = document.createElement('div');
            bubble.classList.add(m.sender === 'user' ? 'user-message' : 'falcon-message');
            bubble.textContent = m.content;
            chatHistory.appendChild(bubble);
        });
        chatHistory.scrollTop = chatHistory.scrollHeight;
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
        this.canvas.height = 80 * 2;
        this.canvas.style.width = w + 'px';
        this.canvas.style.height = '80px';
        this.ctx && this.ctx.scale(2, 2);
    },

    start(){
        if(!this.ctx) return;
        this.active = true;
        this._show(true);
        this._loop();
    },

    stop(){
        this.active = false;
        if(this.animId){
            cancelAnimationFrame(this.animId);
            this.animId = null;
        }
        this._drawFlat();
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
        const barH = h - 20;

        for(let i = 0; i < this.bars; i++){
            const phase = i / this.bars * Math.PI * 4 + now * 6;
            const envelope = 1 - Math.abs(i / this.bars - 0.5) * 0.6;
            const height = (0.08 + Math.abs(Math.sin(phase)) * 0.7 + Math.sin(phase * 0.7 + 1) * 0.22) * barH * envelope;

            const x = 10 + i * barW + gap / 2;
            const y = h - 10 - height;

            const hue = 185 + Math.sin(now * 0.5 + i * 0.3) * 5;
            ctx.fillStyle = `hsla(${hue}, 100%, 60%, ${0.35 + height / barH * 0.45})`;
            ctx.shadowColor = `rgba(0, 217, 255, ${0.15 + height / barH * 0.25})`;
            ctx.shadowBlur = 8;
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

// =========================
// STATE
// =========================

let currentSession = null;
let conversations = {};

const chatInput = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');
const chatHistory = document.getElementById('chat-history');
const micBtn = document.getElementById('mic-btn');
const voiceHint = document.getElementById('voice-hint');
const VisualizerLabel = document.getElementById('visualizer-label');

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

        const userBubble = document.createElement('div');
        userBubble.classList.add('user-message');
        userBubble.textContent = message;
        chatHistory.appendChild(userBubble);

        const falconBubble = document.createElement('div');
        falconBubble.classList.add('falcon-message');
        falconBubble.textContent = data.reply;
        chatHistory.appendChild(falconBubble);

        if(!conversations[currentSession]) conversations[currentSession] = [];
        conversations[currentSession].push({user: message, falcon: data.reply});

        chatHistory.scrollTop = chatHistory.scrollHeight;

        const speech = new SpeechSynthesisUtterance(data.reply);
        speech.lang = 'en-US';
        speech.rate = 1;
        speech.pitch = 1;
        speechSynthesis.speak(speech);

        await loadSessions();

    }catch(error){
        console.error(error);
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
// VOICE FLOW
// =========================

async function startVoiceFlow(){
    if(!currentSession){
        const resp = await fetch('http://127.0.0.1:5000/create_teaching_session');
        const data = await resp.json();
        currentSession = data.session_id;
    }
    micBtn.classList.add('listening');
    voiceHint.style.display = 'block';
    voiceHint.textContent = 'Listening...';
    voiceHint.className = 'voice-hint listening';
    const recognition = new webkitSpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.start();
    recognition.onresult = async (event) => {
        const transcript = event.results[0][0].transcript;
        micBtn.classList.remove('listening');
        micBtn.classList.add('processing');
        voiceHint.textContent = 'Processing...';
        voiceHint.className = 'voice-hint processing';
        try{
            const response = await fetch('http://127.0.0.1:5000/text-chat', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    session_id: currentSession,
                    message: transcript,
                    history: []
                })
            });
            const data = await response.json();

            const userBubble = document.createElement('div');
            userBubble.classList.add('user-message');
            userBubble.textContent = transcript;
            chatHistory.appendChild(userBubble);

            const falconBubble = document.createElement('div');
            falconBubble.classList.add('falcon-message');
            falconBubble.textContent = data.reply;
            chatHistory.appendChild(falconBubble);

            if(!conversations[currentSession]) conversations[currentSession] = [];
            conversations[currentSession].push({user: transcript, falcon: data.reply});

            chatHistory.scrollTop = chatHistory.scrollHeight;

            micBtn.classList.remove('processing');
            micBtn.classList.add('speaking');
            voiceHint.textContent = 'Falcon is responding...';
            voiceHint.className = 'voice-hint speaking';
            VisualizerLabel.textContent = 'Falcon is responding...';
            Visualizer.start();

            const utterance = new SpeechSynthesisUtterance(data.reply);
            utterance.lang = 'en-US';
            utterance.rate = 1;
            utterance.pitch = 1;
            utterance.onstart = () => {};
            utterance.onend = () => {
                Visualizer.stop();
                micBtn.classList.remove('speaking');
                voiceHint.style.display = 'none';
                voiceHint.textContent = 'Tap to speak';
                voiceHint.className = 'voice-hint';
            };
            utterance.onerror = () => {
                Visualizer.stop();
                micBtn.classList.remove('speaking');
                voiceHint.style.display = 'none';
            };
            await loadSessions();

            speechSynthesis.speak(utterance);

        }catch(error){
            console.error(error);
            micBtn.classList.remove('processing');
            voiceHint.textContent = 'Tap to speak';
            voiceHint.className = 'voice-hint';
        }
    };
    recognition.onend = () => {
        setTimeout(() => {
            if(!micBtn.classList.contains('speaking') && !micBtn.classList.contains('processing')){
                micBtn.classList.remove('listening');
                voiceHint.style.display = 'none';
                voiceHint.className = 'voice-hint';
            }
        }, 300);
    };
    recognition.onerror = (event) => {
        micBtn.classList.remove('listening');
        voiceHint.textContent = 'Tap to speak';
        voiceHint.className = 'voice-hint';
        console.log(event.error);
    };
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
// INIT
// =========================

Visualizer.init();
loadSessions();
