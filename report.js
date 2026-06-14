const menuBtn =
document.getElementById("menuBtn");

const sidebar =
document.getElementById("sidebar");

const mainContent =
document.getElementById("mainContent");

const historyList =
document.getElementById("historyList");

menuBtn.addEventListener(
    "click",
    () => {

        sidebar.classList.toggle(
            "hidden"
        );

        mainContent.classList.toggle(
            "full"
        );

    }
);

const practiceReport =
JSON.parse(
    sessionStorage.getItem(
        "practiceReport"
    )
);

const examReport =
JSON.parse(
    sessionStorage.getItem(
        "examReport"
    )
);

if(practiceReport){

    document.getElementById(
        "correctCount"
    ).textContent =
    practiceReport.correct;

    document.getElementById(
        "incorrectCount"
    ).textContent =
    practiceReport.incorrect;

    document.getElementById(
        "unattemptedCount"
    ).textContent = 0;

    document.getElementById(
        "percentageCount"
    ).textContent =
    practiceReport.accuracy + "%";

    setGrade(
        parseFloat(
            practiceReport.accuracy
        )
    );

}

else if(examReport){

    document.getElementById(
        "correctCount"
    ).textContent =
    examReport.correct;

    document.getElementById(
        "incorrectCount"
    ).textContent =
    examReport.incorrect;

    document.getElementById(
        "unattemptedCount"
    ).textContent =
    examReport.unattempted;

    document.getElementById(
        "percentageCount"
    ).textContent =
    examReport.percentage + "%";

    setGrade(
        parseFloat(
            examReport.percentage
        )
    );

}

function setGrade(score){

    let grade = "F";

    if(score >= 90)
        grade = "A+";

    else if(score >= 80)
        grade = "A";

    else if(score >= 70)
        grade = "B";

    else if(score >= 60)
        grade = "C";

    else if(score >= 50)
        grade = "D";

    document.getElementById(
        "gradeText"
    ).textContent =
    grade;
}

document.getElementById(
    "reviewBtn"
).addEventListener(
    "click",
    () => {

        window.location.href =
        "review.html";

    }
);

async function deleteReport(id, element){

    try {

        await fetch(
            `http://127.0.0.1:5000/delete_report/${id}`,
            {method:"DELETE"}
        );

        element.remove();

    } catch(error) {

        console.error(
            "Failed to delete report:",
            error
        );
    }
}

async function loadHistory(){

    try {

        const response =
        await fetch(
            "http://127.0.0.1:5000/reports"
        );

        const reports =
        await response.json();

        historyList.innerHTML = "";

        reports.forEach(
            (report,i)=>{

                const item =
                document.createElement(
                    "div"
                );

                item.className =
                "history-item";

                const label =
                report.type === "practice"
                ? "Practice"
                : "Exam";

                const date =
                new Date(
                    report.created_at
                );

                const info =
                document.createElement(
                    "span"
                );

                info.className =
                "history-info";

                info.textContent =
                `${label} Session #${reports.length - i} - ${report.percentage}%`;

                const delBtn =
                document.createElement(
                    "button"
                );

                delBtn.className =
                "delete-btn";

                delBtn.textContent =
                "✕";

                delBtn.addEventListener(
                    "click",
                    (e)=>{

                        e.stopPropagation();

                        deleteReport(
                            report.id,
                            item
                        );
                    }
                );

                item.appendChild(
                    info
                );

                item.appendChild(
                    delBtn
                );

                item.addEventListener(
                    "click",
                    ()=>{

                        document.getElementById(
                            "correctCount"
                        ).textContent =
                        report.correct;

                        document.getElementById(
                            "incorrectCount"
                        ).textContent =
                        report.incorrect;

                        document.getElementById(
                            "unattemptedCount"
                        ).textContent =
                        report.unattempted;

                        document.getElementById(
                            "percentageCount"
                        ).textContent =
                        report.percentage + "%";

                        setGrade(
                            parseFloat(
                                report.percentage
                            )
                        );

                    }
                );

                historyList.appendChild(
                    item
                );

            }
        );

    } catch(error) {

        console.error(
            "Failed to load history:",
            error
        );
    }
}

loadHistory();
