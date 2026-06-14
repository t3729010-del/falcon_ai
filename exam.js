let allQuestions = [];

let examQuestions = [];

let currentQuestion = 0;

let selectedAnswers = {};

let examSize = 15;

let timeRemaining = 0;

let timerInterval = null;

let correctAnswers = 0;

let incorrectAnswers = 0;

let unattemptedAnswers = 0;

document
.getElementById("btn15")
.addEventListener(
    "click",
    () => startExam(15)
);

document
.getElementById("btn30")
.addEventListener(
    "click",
    () => startExam(30)
);

document
.getElementById("btn60")
.addEventListener(
    "click",
    () => startExam(60)
);

async function startExam(size){

    examSize = size;

    let quizId =
        sessionStorage.getItem("currentQuizId") ||
        localStorage.getItem("currentQuizId");

    if (!quizId) {

        const materialIds =
            JSON.parse(localStorage.getItem("selectedMaterials")) || [];

        if (materialIds.length === 0) {
            document.getElementById("questionText").textContent =
                "No materials selected. Please go back to Quiz Materials first.";
            return;
        }

        document.getElementById("questionText").textContent =
            "Generating quiz, please wait...";

        const response = await fetch(
            "http://127.0.0.1:5000/generate_selected_quiz",
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ material_ids: materialIds })
            }
        );

        const data = await response.json();

        if (!data.success) {
            document.getElementById("questionText").textContent =
                "Failed to generate quiz: " + data.error;
            return;
        }

        quizId = data.quiz_id;
        localStorage.setItem("currentQuizId", quizId);
        sessionStorage.setItem("currentQuizId", quizId);
    }

    const response =
    await fetch(
        `http://127.0.0.1:5000/mcq_questions/${quizId}`
    );

    allQuestions = await response.json();

    if (!allQuestions || allQuestions.length === 0) {
        document.getElementById("questionText").textContent =
            "No questions found. Please generate a quiz first.";
        return;
    }

    examQuestions = allQuestions.slice(0, size);

    currentQuestion = 0;
    selectedAnswers = {};

    generateNavigator();
    showQuestion();
    updateStats();
    startTimer();

    document.querySelector(".exam-size-container").style.display = "none";
}

function generateNavigator(){

    const grid =
    document.getElementById(
        "navigatorGrid"
    );

    grid.innerHTML = "";

    examQuestions.forEach(
        (question,index)=>{

            const btn =
            document.createElement(
                "button"
            );

            btn.className =
            "nav-btn";

            btn.textContent =
            index + 1;

            btn.addEventListener(
                "click",
                ()=>{

                    currentQuestion =
                    index;

                    showQuestion();

                    updateNavigator();

                }
            );

            grid.appendChild(
                btn
            );

        }
    );

    updateNavigator();
}

function showQuestion(){

    if (!examQuestions || examQuestions.length === 0) {
        return;
    }

    const q =
    examQuestions[
        currentQuestion
    ];

    document.getElementById(
        "questionNumber"
    ).textContent =
    `Question ${
        currentQuestion + 1
    }`;

    document.getElementById(
        "questionText"
    ).textContent =
    q.question;

    const options =
    document.querySelectorAll(
        ".option"
    );

    options[0].textContent = q.option_a;
    options[1].textContent = q.option_b;
    options[2].textContent = q.option_c;
    options[3].textContent = q.option_d;

    const letters =
    ["A","B","C","D"];

    options.forEach(
        (option,index)=>{

            option.classList.remove(
                "selected"
            );

            if(
                selectedAnswers[
                    currentQuestion
                ] === letters[index]
            ){

                option.classList.add(
                    "selected"
                );

            }

            option.onclick = ()=>{

                selectedAnswers[
                    currentQuestion
                ] = letters[index];

                showQuestion();

                updateStats();

                updateNavigator();

            };

        }
    );
}

function updateStats(){

    const answered =
    Object.keys(
        selectedAnswers
    ).length;

    const remaining =
    examQuestions.length -
    answered;

    document.getElementById(
        "answeredCount"
    ).textContent =
    answered;

    document.getElementById(
        "remainingCount"
    ).textContent =
    remaining;
}

function updateNavigator(){

    const buttons =
    document.querySelectorAll(
        ".nav-btn"
    );

    buttons.forEach(
        (button,index)=>{

            button.classList.remove(
                "current",
                "answered",
                "unanswered"
            );

            if(
                index === currentQuestion
            ){

                button.classList.add(
                    "current"
                );

            }

            else if(
                selectedAnswers[index]
            ){

                button.classList.add(
                    "answered"
                );

            }

            else{

                button.classList.add(
                    "unanswered"
                );

            }

        }
    );
}

function startTimer(){

    clearInterval(
        timerInterval
    );

    timeRemaining =
    examSize * 60;

    timerInterval =
    setInterval(()=>{

        const minutes =
        Math.floor(
            timeRemaining / 60
        );

        const seconds =
        timeRemaining % 60;

        document
        .getElementById(
            "timer"
        )
        .textContent =

        `${minutes}:${
            seconds
            .toString()
            .padStart(2,"0")
        }`;

        timeRemaining--;

        if(
            timeRemaining < 0
        ){

            clearInterval(
                timerInterval
            );

            submitExam();

        }

    },1000);
}

document
.getElementById("prevBtn")
.addEventListener(
    "click",
    ()=>{

        if(currentQuestion > 0){

            currentQuestion--;

            showQuestion();

            updateNavigator();

        }

    }
);

document
.getElementById("nextBtn")
.addEventListener(
    "click",
    ()=>{

        if(
            currentQuestion <
            examQuestions.length - 1
        ){

            currentQuestion++;

            showQuestion();

            updateNavigator();

        }

    }
);

function submitExam(){

    clearInterval(
        timerInterval
    );

    correctAnswers = 0;
    incorrectAnswers = 0;
    unattemptedAnswers = 0;

    examQuestions.forEach(
        (question,index)=>{

            const userAnswer =
            selectedAnswers[index];

            if(
                !userAnswer
            ){

                unattemptedAnswers++;

            }

            else if(
                userAnswer ===
                question.correct_answer
            ){

                correctAnswers++;

            }

            else{

                incorrectAnswers++;

            }

        }
    );

    const percentage =

    (
        correctAnswers /
        examQuestions.length
    ) * 100;

    sessionStorage.setItem(
        "examReport",

        JSON.stringify({

            total:
            examQuestions.length,

            correct:
            correctAnswers,

            incorrect:
            incorrectAnswers,

            unattempted:
            unattemptedAnswers,

            percentage:
            percentage.toFixed(1)

        })
    );

    const examReviewData =
    examQuestions.map(
        (question,index)=>{

            const userAnswer =
            selectedAnswers[index];

            return {
                question: question.question,
                selectedAnswer: userAnswer || "Not Answered",
                correctAnswer: question.correct_answer,
                explanation: question.explanation,
                isCorrect: userAnswer === question.correct_answer,
                unattempted: !userAnswer
            };
        }
    );

    sessionStorage.setItem(
        "examReviewData",
        JSON.stringify(examReviewData)
    );

    fetch("http://127.0.0.1:5000/save_report", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
            type:"exam",
            total: examQuestions.length,
            correct: correctAnswers,
            incorrect: incorrectAnswers,
            unattempted: unattemptedAnswers,
            percentage: parseFloat(percentage.toFixed(1))
        })
    }).catch(()=>{});

    window.location.href =
    "report.html";
}

document
.getElementById(
    "submitExamBtn"
)
.addEventListener(
    "click",
    submitExam
);