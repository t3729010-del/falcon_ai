const menuToggle = document.querySelector(".menu-toggle");
const sidebar = document.querySelector(".sidebar");
const chatArea = document.querySelector(".chat-area");

const newChatBtn = document.querySelector(".new-chat");
const chatHistory = document.querySelector(".chat-history");

const chatBox = document.querySelector(".chat-box");

const userInput = document.querySelector(".input-area input");

const sendBtn = document.querySelector(".send-btn");
const voiceBtn = document.querySelector(".voice-btn");

sidebar.classList.add("hidden");
chatArea.classList.add("full");

const sessionSearch =
    document.querySelector(
        "#sessionSearch"
    );
let currentSession = null;
let sessionPromise = null;

async function ensureSession(){
    if(currentSession) return currentSession;
    if(sessionPromise) return sessionPromise;
    sessionPromise = fetch(
        "http://127.0.0.1:5000/create_teaching_session"
    ).then(r => r.json()).then(d => {
        currentSession = d.session_id;
        sessionPromise = null;
        return currentSession;
    });
    return sessionPromise;
}

ensureSession();

menuToggle.addEventListener("click", () => {

    sidebar.classList.toggle("hidden");

    chatArea.classList.toggle("full");

});

const archivedHistory =
    document.querySelector(
        ".archived-history"
    );

newChatBtn.addEventListener(
    "click",
    async () => {

        const response =
            await fetch(
                "http://127.0.0.1:5000/create_teaching_session"
            );

        const data =
            await response.json();

        currentSession =
            data.session_id;

        console.log(
            "Current Session:",
            currentSession
        )

        chatBox.innerHTML = `
            <div class="message ai-message">
                <div class="message-content">
                    Hello. I am Falcon AI.
                    What would you like to learn today?
                </div>
            </div>
        `;

        await loadTeachingSessions();

        const activeItem =
            document.querySelector(
                `[data-id="${currentSession}"]`
            );

        if(activeItem){

            activeItem.classList.add(
                "active-session"
            );

        }
    }
);

function addMessage(message, sender) {

    const messageDiv =
        document.createElement("div");

    messageDiv.classList.add(
        "message"
    );

    if(sender === "user"){

        messageDiv.classList.add(
            "user-message"
        );

    }else{

        messageDiv.classList.add(
            "ai-message"
        );
    }

   const content = document.createElement("div");

    content.classList.add(
        "message-content"
    );

    if(sender === "ai"){

        content.innerHTML =
            marked.parse(message);

    }else{

        content.textContent =
            message;
    }

    messageDiv.appendChild(content);

    if(sender === "ai"){

        const actions =
            document.createElement("div");

        actions.classList.add(
            "message-actions"
        );

        actions.dataset.originalText = message;

        actions.innerHTML = `
            <button class="copy-btn">
                📋 Copy
            </button>

            <button class="example-btn">
                💡 Examples
            </button>

            <button class="quiz-btn">
                🎯 Quiz Me
            </button>

            <button class="regen-btn">
                🔄 Regenerate
            </button>
        `;

        content.appendChild(actions);
    }

    chatBox.appendChild(
        messageDiv
    );

    chatBox.scrollTop =
        chatBox.scrollHeight;
}

sendBtn.addEventListener(
    "click",
    sendMessage
);

userInput.addEventListener(
    "keypress",
    (e) => {

        if(e.key === "Enter"){

            sendMessage();
        }
    }
);

async function sendMessage(){

    const message =
        userInput.value.trim();

    if(!message) return;

    const sid = await ensureSession();
    if(!sid) return;

    addMessage(
        message,
        "user"
    );

    userInput.value = "";

    const thinkingBubble = showThinking();

    fetch(
        "http://127.0.0.1:5000/text-chat",
        {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                message: message,
                session_id: currentSession
            })
        }
    )
    .then(response => response.json())
    .then(data => {
        thinkingBubble.remove();

        addMessage(
            data.reply,
            "ai"
        );

        loadTeachingSessions();

    })
    .catch(error => {
        thinkingBubble.remove();
        addMessage(
            "Error connecting to Falcon AI.",
            "ai"
        );

        console.error(error);

    });
}

function showThinking(){

    const thinkingDiv =
        document.createElement("div");

    thinkingDiv.classList.add(
        "message",
        "ai-message",
        "thinking-message"
    );

    thinkingDiv.innerHTML = `
        <div class="message-content">
            ⚡ Falcon AI is thinking
            <span class="dots">
                <span>.</span>
                <span>.</span>
                <span>.</span>
            </span>
        </div>
    `;

    chatBox.appendChild(
        thinkingDiv
    );

    chatBox.scrollTop =
        chatBox.scrollHeight;

    return thinkingDiv;
}

document.addEventListener("click", (e) => {

    if (e.target.classList.contains("copy-btn")) {

        const aiMessage =
            e.target.closest(".message-content");

        const text =
            aiMessage.innerText
                .replace("📋 Copy", "")
                .replace("💡 Examples", "")
                .replace("🎯 Quiz Me", "")
                .replace("🔄 Regenerate", "");

        navigator.clipboard.writeText(text);

        e.target.textContent = "✅ Copied";

        setTimeout(() => {

            e.target.textContent = "📋 Copy";

        }, 1500);
    }

});

document.addEventListener(
    "click",
    async (e) => {

        if(
            e.target.classList.contains(
                "example-btn"
            )
        ){

            const actions =
                e.target.closest(
                    ".message-actions"
                );

            const topic =
                actions.dataset.originalText;

            const thinkingBubble =
                showThinking();

            try{

                const response =
                    await fetch(
                        "http://127.0.0.1:5000/text-chat",
                        {
                            method:"POST",

                            headers:{
                                "Content-Type":
                                "application/json"
                            },

                            body:JSON.stringify({
                                message:
                                `Give 5 simple real-world examples for this topic:\n\n${topic}`
                            })
                        }
                    );

                const data =
                    await response.json();

                thinkingBubble.remove();

                addMessage(
                    data.reply,
                    "ai"
                );

            }catch(error){

                thinkingBubble.remove();

                addMessage(
                    "Unable to generate examples.",
                    "ai"
                );

                console.error(
                    error
                );
            }
        }
    }
);

document.addEventListener(
    "click",
    async (e) => {

        if(
            e.target.classList.contains(
                "quiz-btn"
            )
        ){

            const actions =
                e.target.closest(
                    ".message-actions"
                );

            const topic =
                actions.dataset.originalText;

            const thinkingBubble =
                showThinking();

            try{

                const response =
                    await fetch(
                        "http://127.0.0.1:5000/text-chat",
                        {
                            method:"POST",

                            headers:{
                                "Content-Type":
                                "application/json"
                            },

                            body:JSON.stringify({
                                message:
                                `Create 5 multiple-choice questions from this topic. Include answers at the end.

                                ${topic}`
                            })
                        }
                    );

                const data =
                    await response.json();

                thinkingBubble.remove();

                addMessage(
                    data.reply,
                    "ai"
                );

            }catch(error){

                thinkingBubble.remove();

                addMessage(
                    "Unable to generate quiz.",
                    "ai"
                );

                console.error(
                    error
                );
            }
        }
    }
);

document.addEventListener(
    "click",
    async (e) => {

        if(
            e.target.classList.contains(
                "regen-btn"
            )
        ){

            const actions =
                e.target.closest(
                    ".message-actions"
                );

            const topic =
                actions.dataset.originalText;

            const thinkingBubble =
                showThinking();

            try{

                const response =
                    await fetch(
                        "http://127.0.0.1:5000/text-chat",
                        {
                            method:"POST",

                            headers:{
                                "Content-Type":
                                "application/json"
                            },

                            body:JSON.stringify({
                                message:
                                `Explain this topic again using a different teaching style and different examples:

${topic}`
                            })
                        }
                    );

                const data =
                    await response.json();

                thinkingBubble.remove();

                const currentMessage = 
                    e.target.closest(
                        ".message"
                    );

                const newContent = 
                    currentMessage.querySelector(
                        ".message-content"
                    );

                newContent.innerHTML = 
                    marked.parse(
                        data.reply
                    )

                newContent.innerHTML += `
                    <div class="message-actions"
                        data-original-text="${data.reply}">

                        <button class="copy-btn">
                            📋 Copy
                        </button>

                        <button class="example-btn">
                            💡 Examples
                        </button>

                        <button class="quiz-btn">
                            🎯 Quiz Me
                        </button>

                        <button class="regen-btn">
                            🔄 Regenerate
                        </button>

                    </div>
                `;

            }catch(error){

                thinkingBubble.remove();

                addMessage(
                    "Unable to regenerate response.",
                    "ai"
                );

                console.error(error);
            }
        }
    }
);

async function loadTeachingSessions(){

    const response =
        await fetch(
            "http://127.0.0.1:5000/teaching_sessions"
        );

    const sessions =
        await response.json();

    chatHistory.innerHTML = "";
    archivedHistory.innerHTML = "";

    sessions.forEach(session => {

        const item =
            document.createElement("div");

        item.classList.add(
            "history-item"
        );

        item.innerHTML = `
            <span>
                ${session.title}
            </span>

            <div class="session-actions">

                <button
                    class="export-session-btn"
                    data-id="${session.id}"
                >
                    📄
                </button>

                <button
                    class="archive-session-btn"
                    data-id="${session.id}"
                >
                    ${session.is_archived ? "↩" : "📦"}
                </button>

                <button
                    class="delete-session-btn"
                    data-id="${session.id}"
                >
                    🗑
                </button>

            </div>
        `;

        item.dataset.id =
            session.id;

        if(session.id == currentSession){
            item.classList.add(
                "active-session"
            );
        }

        item.addEventListener(
            "click",
            async () => {

                currentSession =
                    session.id;

                document
                .querySelectorAll(
                    ".history-item"
                )
                .forEach(item => {

                    item.classList.remove(
                        "active-session"
                    );

                });

                item.classList.add(
                    "active-session"
                );

                console.log(
                    "New Session:",
                    currentSession
                )

                const response =
                    await fetch(
                        `http://127.0.0.1:5000/teaching_messages/${session.id}`
                    );

                const messages =
                    await response.json();

                chatBox.innerHTML = "";

                messages.forEach(message => {

                    addMessage(
                        message.content,
                        message.sender
                    );

                });

            }
        );

        if(session.is_archived){

            archivedHistory.appendChild(
                item
            );

        }else{

            chatHistory.appendChild(
                item
            );

        }

        const deleteBtn =
            item.querySelector(
                ".delete-session-btn"
            );

        const archiveBtn =
            item.querySelector(
                ".archive-session-btn"
            );

        const exportBtn =
            item.querySelector(
                ".export-session-btn"
            );

        exportBtn.addEventListener(
            "click",
            (e) => {

                e.stopPropagation();

                const link =
                    document.createElement("a");

                link.href =
                    `http://127.0.0.1:5000/export_teaching_pdf/${session.id}`;

                link.download = "";

                document.body.appendChild(link);

                link.click();

                document.body.removeChild(link);

            }
        );
        deleteBtn.addEventListener(
            "click",
            async (e) => {

                e.stopPropagation();

                await fetch(
                    `http://127.0.0.1:5000/delete_teaching_session/${session.id}`,
                    {
                        method: "DELETE"
                    }
                );

                await loadTeachingSessions();

            }
        );

        archiveBtn.addEventListener(
            "click",
            async (e) => {

                e.stopPropagation();

                const endpoint =
                    session.is_archived
                    ?
                    `http://127.0.0.1:5000/unarchive_teaching_session/${session.id}`
                    :
                    `http://127.0.0.1:5000/archive_teaching_session/${session.id}`;

                await fetch(
                    endpoint,
                    {
                        method: "POST"
                    }
                );

                await loadTeachingSessions();

            }
        );

    });

}

loadTeachingSessions();

// ── VOICE INPUT ───────────────────────────────────────

let isListening = false;

const SpeechRecognitionAPI =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;

function createRecognition(){
    if(!SpeechRecognitionAPI) return null;
    const rec = new SpeechRecognitionAPI();
    rec.lang = "en-US";
    rec.continuous = false;
    rec.interimResults = false;
    rec.onaudiostart = () => {
        voiceBtn.textContent = "🎙";
    };
    rec.onresult = (event) => {
        const transcript =
            event.results[0][0].transcript;
        userInput.value = transcript;
        sendMessage();
    };
    rec.onend = () => {
        voiceBtn.textContent = "🎤";
        voiceBtn.classList.remove("listening");
        isListening = false;
    };
    rec.onerror = () => {
        voiceBtn.textContent = "🎤";
        voiceBtn.classList.remove("listening");
        isListening = false;
    };
    return rec;
}

voiceBtn.addEventListener("click", () => {
    if(!SpeechRecognitionAPI){
        const notice = document.createElement("div");
        notice.className = "voice-notice";
        notice.textContent = "Voice input not supported in this browser. Try Chrome.";
        document.querySelector(".input-area").prepend(notice);
        setTimeout(() => notice.remove(), 3000);
        return;
    }
    if(isListening) return;
    const recognition = createRecognition();
    if(!recognition) return;
    isListening = true;
    voiceBtn.textContent = "🔴";
    voiceBtn.classList.add("listening");
    try {
        recognition.start();
    } catch(e) {
        voiceBtn.textContent = "🎤";
        voiceBtn.classList.remove("listening");
        isListening = false;
    }
});

sessionSearch.addEventListener(
    "input",
    () => {

        const searchTerm =
            sessionSearch.value
            .toLowerCase();

        document
        .querySelectorAll(
            ".history-item"
        )
        .forEach(item => {

            const title =
                item.innerText
                .toLowerCase();

            if(
                title.includes(
                    searchTerm
                )
            ){

                item.style.display =
                    "flex";

            }else{

                item.style.display =
                    "none";
            }

        });

    }
);

