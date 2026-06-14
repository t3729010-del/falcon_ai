document
.getElementById("backBtn")
.addEventListener(
    "click",
    () => {

        window.location.href =
        "report.html";
    }
);

try {

const practiceData =
JSON.parse(
    sessionStorage.getItem(
        "reviewData"
    )
) || [];

const examData =
JSON.parse(
    sessionStorage.getItem(
        "examReviewData"
    )
) || [];

const allData = [
    ...practiceData.map(d => ({...d, source:"Practice"})),
    ...examData.map(d => ({...d, source:"Exam"}))
];

const reviewContainer =
document.getElementById(
    "reviewContainer"
);

if(allData.length === 0){

    reviewContainer.innerHTML =
    `<div class="empty-state">
        No review data found. Complete a practice or exam session first.
    </div>`;

} else {

    allData.forEach(
        (item,index)=>{

            const card =
            document.createElement(
                "div"
            );

            card.className =
            "review-card";

            let answerClass =
            "wrong-answer";

            let statusIcon = "❌";

            let reason = "";

            const explanation =
            item.explanation ||
            "No explanation provided for this question.";

            if(item.unattempted){

                answerClass =
                "unattempted-answer";

                statusIcon = "⚠️";

                reason =
                `Correct answer was <strong>${item.correctAnswer}</strong>.<br>` +
                explanation;

            } else if(item.isCorrect){

                answerClass =
                "correct-answer";

                statusIcon = "✅";

                reason =
                `<strong>${item.correctAnswer}</strong> is correct because:<br>` +
                explanation;

            } else {

                answerClass =
                "wrong-answer";

                statusIcon = "❌";

                reason =
                `You selected <strong>${item.selectedAnswer}</strong> but the correct answer is <strong>${item.correctAnswer}</strong>.<br>` +
                `${item.correctAnswer} is correct because:<br>` +
                explanation;
            }

            card.innerHTML = `

                <div class="card-header">

                    <span class="source-badge ${item.source === 'Practice' ? 'badge-practice' : 'badge-exam'}">
                        ${item.source}
                    </span>

                    <span class="question-number">
                        Question ${index + 1}
                    </span>

                </div>

                <div class="question-text">
                    ${item.question}
                </div>

                <div class="answer-row ${answerClass}">
                    ${statusIcon}
                    Your Answer:
                    <span class="answer-value">
                        ${item.selectedAnswer}
                    </span>
                </div>

                <div class="answer-row correct-answer">
                    ✅ Correct Answer:
                    <span class="answer-value">
                        ${item.correctAnswer}
                    </span>
                </div>

                <div class="explanation-box">
                    <div class="explanation-title">
                        ${item.isCorrect ? 'Why This Is Correct' : item.unattempted ? 'Explanation' : 'Why Your Answer Was Wrong'}
                    </div>
                    <div class="explanation-text">
                        ${reason}
                    </div>
                </div>

            `;

            reviewContainer.appendChild(
                card
            );
        }
    );
}

} catch(error) {

    document.getElementById(
        "reviewContainer"
    ).innerHTML =
    `<div class="empty-state">
        Error loading review data. Please try again.
    </div>`;

    console.error(
        "Review error:",
        error
    );
}
