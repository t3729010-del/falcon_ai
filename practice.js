let questions = [];
let currentQuestion = 0;

let attempted = 0;
let correct = 0;
let incorrect = 0;

let selectedAnswer = null;

let answeredCurrentQuestion = false;

let incorrectQuestions = [];
let userAnswers = [];

async function loadQuestions() {

    try {

        const quizId =
            sessionStorage.getItem("currentQuizId") ||
            localStorage.getItem("currentQuizId");

        if (!quizId) {
            document.getElementById("questionText").textContent =
                "No quiz found. Please return to MCQ page.";
            return;
        }

        const response = await fetch(
            `http://127.0.0.1:5000/mcq_questions/${quizId}`
        );

        questions = await response.json();

        if (!questions || questions.length === 0) {
            document.getElementById("questionText").textContent =
                "No questions found. Please try again.";
            return;
        }

        showQuestion();

    } catch(error) {

        console.error(error);
        document.getElementById("questionText").textContent =
            "Failed to load questions. Make sure the backend is running.";
    }
}

function showQuestion(){

    answeredCurrentQuestion = false;

    document.querySelector(
        ".submit-btn"
    ).disabled = false;

    if(currentQuestion >= questions.length){

        showReport();

        return;
    }

    const q = questions[currentQuestion];

    document.getElementById(
        "questionNumber"
    ).textContent =
    `Question ${currentQuestion + 1}`;

    document.getElementById(
        "questionText"
    ).textContent = q.question;

    const options = document.querySelectorAll(
        ".option"
    );

    options[0].textContent = q.option_a;
    options[1].textContent = q.option_b;
    options[2].textContent = q.option_c;
    options[3].textContent = q.option_d;

    options.forEach(option => {

        option.classList.remove(
            "selected-option"
        );
        option.style.background = "";
        option.style.borderColor = "";

    });

    selectedAnswer = null;

    sessionStorage.setItem(
        "reviewData",
        JSON.stringify(
            userAnswers
        )
    );
}

document.querySelectorAll(
    ".option"
).forEach((option,index)=>{

    option.addEventListener(
        "click",
        ()=>{

            document
            .querySelectorAll(".option")
            .forEach(o=>{

                o.classList.remove(
                    "selected-option"
                );

            });

            option.classList.add(
                "selected-option"
            );

            selectedAnswer =
            ["A","B","C","D"][index];

        }
    );

});

document.querySelector(
    ".submit-btn"
).addEventListener(
    "click",
    ()=>{

        if(answeredCurrentQuestion){

            return;

        }

        if(!selectedAnswer){

            alert(
                "Select an answer first"
            );

            return;
        }

        const q =
        questions[currentQuestion];

        attempted++;

        userAnswers.push({

            question: q.question,

            selectedAnswer: selectedAnswer,

            correctAnswer: q.correct_answer,

            explanation: q.explanation,

            isCorrect: selectedAnswer === q.correct_answer


        })

        const options =
        document.querySelectorAll(
            ".option"
        );

        options.forEach(
            option => {

                option.style.borderColor =
                "";

                option.style.background =
                "";

            }
        );

        const selectedIndex =
        ["A","B","C","D"]
        .indexOf(selectedAnswer);

        const correctIndex =
        ["A","B","C","D"]
        .indexOf(q.correct_answer);

        if(
            selectedAnswer ===
            q.correct_answer
        ){

            correct++;

            options[
                selectedIndex
            ].style.background =
            "#22c55e";

            document.getElementById(
                "feedbackText"
            ).textContent =
            "✅ Correct! " +
            q.explanation;

        }

        else{

            incorrect++;

            incorrectQuestions.push({

                question: q.question,

                userAnswer: selectedAnswer,

                correctAnswer: q.correct_answer,

                explanation: q.explanation

            })

            options[
                selectedIndex
            ].style.background =
            "#ef4444";

            options[
                correctIndex
            ].style.background =
            "#22c55e";

            document.getElementById(
                "feedbackText"
            ).textContent =
            "❌ Incorrect. " +
            q.explanation;

        }

        document.getElementById(
            "attemptedCount"
        ).textContent =
        attempted;

        document.getElementById(
            "correctCount"
        ).textContent =
        correct;

        document.getElementById(
            "incorrectCount"
        ).textContent =
        incorrect;

        answeredCurrentQuestion = true;

        document.querySelector(
            ".submit-btn"
        ).disabled = true;

    }
);

document.querySelector(
    ".next-btn"
).addEventListener(
    "click",
    ()=>{

        currentQuestion++;

        showQuestion();

    }
);

document.getElementById(
    "stopBtn"
).addEventListener(
    "click",
    showReport
);

function showReport(){

    const accuracy =
    attempted > 0
    ? ((correct / attempted) * 100).toFixed(1)
    : 0;

    sessionStorage.setItem(
        "practiceReport",

        JSON.stringify({

            attempted,

            correct,

            incorrect,

            accuracy,

            incorrectQuestions

        })
    );

    sessionStorage.setItem(
        "reviewData",
        JSON.stringify(
            userAnswers
        )
    )

    fetch("http://127.0.0.1:5000/save_report", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
            type:"practice",
            total: questions.length,
            correct,
            incorrect,
            unattempted: questions.length - attempted,
            percentage: parseFloat(accuracy)
        })
    }).catch(()=>{});

    window.location.href =
    "report.html";
}

loadQuestions();
