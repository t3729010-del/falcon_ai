const practiceBtn = document.getElementById("practiceBtn");
const examBtn = document.getElementById("examBtn");

async function generateQuiz(questionCount, btn, originalText) {

    const materialIds =
        JSON.parse(
            localStorage.getItem(
                "selectedMaterials"
            )
        ) || [];

    if(materialIds.length === 0){

        alert(
            "Please select materials first."
        );

        return null;
    }

    btn.textContent = "Generating...";
    btn.classList.add("generating");
    btn.disabled = true;

    await new Promise(r => setTimeout(r, 50));

    try {

        const response =
        await fetch(
            "http://127.0.0.1:5000/generate_selected_quiz",
            {
                method:"POST",
                headers:{
                    "Content-Type":"application/json"
                },
                body:JSON.stringify({
                    material_ids:materialIds,
                    question_count: questionCount
                })
            }
        );

        const data =
        await response.json();

        if(!data.success){

            alert(
                data.error
            );

            btn.textContent = originalText;
            btn.classList.remove("generating");
            btn.disabled = false;

            return null;
        }

        sessionStorage.setItem(
            "currentQuizId",
            data.quiz_id
        );

        localStorage.setItem(
            "currentQuizId",
            data.quiz_id
        );

        return data.quiz_id;

    } catch(error){

        console.error("Quiz generation error:", error);

        alert(
            "Error: " + error.message +
            "\n\nMake sure the backend is running and you have selected a valid material."
        );

        btn.textContent = originalText;
        btn.classList.remove("generating");
        btn.disabled = false;

        return null;
    }
}

practiceBtn.addEventListener(
    "click",
    async function(){

        const btn = this;
        const quizId =
        await generateQuiz(undefined, btn, "Start Practice");

        if(quizId){
            window.location.href =
            "practice.html";
        }
    }
);

examBtn.addEventListener(
    "click",
    async function(){

        const btn = this;
        const quizId =
        await generateQuiz(50, btn, "Start Exam");

        if(quizId){
            window.location.href =
            "exam.html";
        }
    }
);
