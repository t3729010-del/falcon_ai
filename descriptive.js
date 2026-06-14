const menuBtn = document.getElementById("menu-btn");
const sidebar = document.getElementById("sidebar");
const answerBox = document.querySelector(".answer-box");
const uploadSection = document.querySelector(".upload-section");
const writeBtn = document.querySelectorAll(".mode-btn")[0];
const uploadBtn = document.querySelectorAll(".mode-btn")[1];
const fileInput = document.querySelector(".upload-section input");
const categories = document.querySelectorAll(".category");
const wordsDisplay = document.querySelector(".exam-stats div:nth-child(1)");
const charsDisplay = document.querySelector(".exam-stats div:nth-child(2)");
const timerDisplay = document.querySelector(".exam-stats div:nth-child(3)");
const actionBtns = document.querySelectorAll(".action-btn");
const prevBtn = actionBtns[0];
const saveBtn = actionBtns[1];
const submitBtn = actionBtns[2];
const nextBtn = actionBtns[3];

let timerMinutes = 45;
let timerSeconds = 0;
let timerInterval;

menuBtn.addEventListener("click", () => {
    sidebar.classList.toggle("sidebar-hidden");
});

answerBox.addEventListener("input", () => {
    const text = answerBox.value;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const chars = text.length;
    wordsDisplay.textContent = `Words: ${words}`;
    charsDisplay.textContent = `Characters: ${chars}`;
});

function startTimer() {
    timerInterval = setInterval(() => {
        if (timerSeconds === 0) {
            if (timerMinutes === 0) {
                clearInterval(timerInterval);
                timerDisplay.textContent = "Time Remaining: 00:00";
                alert("Time is up! Your exam will be submitted.");
                return;
            }
            timerMinutes--;
            timerSeconds = 59;
        } else {
            timerSeconds--;
        }
        const mm = String(timerMinutes).padStart(2, "0");
        const ss = String(timerSeconds).padStart(2, "0");
        timerDisplay.textContent = `Time Remaining: ${mm}:${ss}`;
    }, 1000);
}

writeBtn.addEventListener("click", () => {
    writeBtn.classList.add("active-mode");
    uploadBtn.classList.remove("active-mode");
    answerBox.style.display = "";
    uploadSection.style.display = "none";
});

uploadBtn.addEventListener("click", () => {
    uploadBtn.classList.add("active-mode");
    writeBtn.classList.remove("active-mode");
    answerBox.style.display = "none";
    uploadSection.style.display = "block";
});

uploadSection.style.display = "none";

fileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
            answerBox.value = ev.target.result;
            answerBox.dispatchEvent(new Event("input"));
        };
        if (file.type === "text/plain") {
            reader.readAsText(file);
        } else {
            alert("File selected: " + file.name + " (" + (file.size / 1024).toFixed(1) + " KB)");
        }
    }
});

categories.forEach((cat) => {
    cat.addEventListener("click", () => {
        categories.forEach((c) => c.classList.remove("active-category"));
        cat.classList.add("active-category");
    });
});

saveBtn.addEventListener("click", () => {
    const text = answerBox.value.trim();
    if (!text) {
        alert("Write an answer before saving.");
        return;
    }
    localStorage.setItem("descriptiveDraft", text);
    alert("Draft saved successfully!");
});

submitBtn.addEventListener("click", () => {
    const text = answerBox.value.trim();
    if (!text) {
        alert("Please write an answer before submitting.");
        return;
    }
    if (confirm("Are you sure you want to submit your answer?")) {
        clearInterval(timerInterval);
        localStorage.setItem("descriptiveAnswer", text);
        alert("Answer submitted successfully!");
    }
});

const savedDraft = localStorage.getItem("descriptiveDraft");
if (savedDraft) {
    answerBox.value = savedDraft;
    answerBox.dispatchEvent(new Event("input"));
}

document.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.key === "s") {
        e.preventDefault();
        saveBtn.click();
    }
});

startTimer();
