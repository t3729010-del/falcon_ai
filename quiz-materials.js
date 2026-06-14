console.log("Quiz Materials JS Loaded");

let selectedMaterialIds =
JSON.parse(
    localStorage.getItem("selectedMaterials")
) || [];

document.addEventListener("DOMContentLoaded", () => {

    const menuBtn =
        document.querySelector(".menu-btn");

    const sidebar =
        document.querySelector(".sidebar");

    menuBtn.addEventListener("click", () => {

        sidebar.classList.toggle("collapsed");

    });

    const categoryButtons =
        document.querySelectorAll(".category-btn");

    const uploadBox =
        document.querySelector(".upload-box");

    const uploadBtn =
        document.querySelector(".upload-btn");

    const processingFill =
        document.querySelector(".processing-fill");

    const processingText =
        document.querySelector(".processing-card span");



    // CATEGORY SELECTION

    categoryButtons.forEach(button => {

        button.addEventListener("click", () => {

            categoryButtons.forEach(btn =>
                btn.classList.remove("active")
            );

            button.classList.add("active");

        });

    });

    loadMaterials();

    // CREATE FILE INPUT

    const fileInput =
        document.createElement("input");

    fileInput.type = "file";

    fileInput.multiple = true;

    fileInput.accept =
        ".pdf,.ppt,.pptx,.doc,.docx,.png,.jpg,.jpeg";



    uploadBtn.addEventListener("click", () => {

        fileInput.click();

    });



    // FILE SELECT

    fileInput.addEventListener("change", () => {

        if (fileInput.files.length > 0) {

            handleFiles(fileInput.files);

        }

    });



    // DRAG EVENTS

    uploadBox.addEventListener("dragover", e => {

        e.preventDefault();

        uploadBox.style.borderColor =
            "#00d9ff";

    });

    uploadBox.addEventListener("dragleave", () => {

        uploadBox.style.borderColor =
            "rgba(0,217,255,0.35)";

    });

    uploadBox.addEventListener("drop", e => {

        e.preventDefault();

        uploadBox.style.borderColor =
            "rgba(0,217,255,0.35)";

        handleFiles(e.dataTransfer.files);

    });



    async function handleFiles(files) {

        processingText.textContent =
            "Uploading material...";

        simulateProgress();

        for (let file of files) {

            // Backend Upload

            const formData = new FormData();

            formData.append("file", file);

            try {

                const uploadResponse=

                await fetch(
                    "http://127.0.0.1:5000/upload_material",
                    {
                        method: "POST",
                        body: formData
                    }
                );

                const uploadData =
                await uploadResponse.json();

                console.log("UPLOAD DATA:", uploadData);

                if(!uploadData.success){

                    console.error(
                        "Upload Failed:",
                        uploadData
                    );

                    return;
                }

                console.log(
                    "Material ID:",
                    uploadData.material_id
                );

                loadMaterials();

            } catch (error) {

                console.error(error);

            }

        }

        processingText.textContent =
            "Quiz generation ready";

    }



    function simulateProgress() {

        let width = 0;

        const interval = setInterval(() => {

            width += 10;

            processingFill.style.width =
                width + "%";

            if (width >= 100) {

                clearInterval(interval);

            }

        }, 250);

    }



    function addMaterialCard(fileName) {

        const historyGrid =
            document.querySelector(".history-grid");

        const card =
            document.createElement("div");

        card.className =
            "history-card";

        card.innerHTML = `

            <div class="file-icon">
                📄
            </div>

            <h3>${fileName}</h3>

            <p>
                Uploaded just now
            </p>

        `;

        historyGrid.prepend(card);

    }

    const mcqLink = document.querySelector(
        'a[href="mcq.html"]'
    );

    mcqLink.addEventListener("click", function(e){

        if(selectedMaterialIds.length === 0){

            e.preventDefault();

            alert(
                "Please select at least one file first."
            );

            return;
        }

        localStorage.setItem(
            "selectedMaterials",
            JSON.stringify(selectedMaterialIds)
        );

    });

    const descriptiveLink = document.querySelector(
        'a[href="descriptive.html"]'
    );

    descriptiveLink.addEventListener("click", function(e){

        if(selectedMaterialIds.length === 0){

            e.preventDefault();

            alert(
                "Please select at least one file first."
            );

            return;
        }

        localStorage.setItem(
            "selectedMaterials",
            JSON.stringify(selectedMaterialIds)
        );

    });

});

async function loadMaterials() {

    const response =
        await fetch(
            "http://127.0.0.1:5000/materials"
        );

    const materials =
        await response.json();

    const historyGrid =
        document.querySelector(
            ".history-grid"
        );

    historyGrid.innerHTML = "";

    materials.forEach(material => {

        const card =
            document.createElement("div");

        card.className =
            "history-card";

        card.innerHTML = `
            <div class="file-icon">
                📄
            </div>

            <h3>${material.title}</h3>

            <p>${material.type}</p>

            <div class="material-actions">
                <button
                    class="choose-btn"
                    onclick="toggleMaterial(${material.id}, this)">
                    Choose
                </button>

                <button
                    class="delete-btn"
                    onclick="deleteMaterial(${material.id})">
                    Delete
                </button>
            </div>
        `;

        const savedSelections = 
        JSON.parse(
            localStorage.getItem("selectedMaterials")
        ) || [];

        if(savedSelections.includes(material.id))
        {
            card.classList.add("selected-material")

            card.querySelector(".choose-btn")
                .textContent = "Selected ✓";
        }

        historyGrid.appendChild(card);

    });

}

async function deleteMaterial(materialId){

    const confirmDelete =
    confirm(
        "Delete this material?"
    );

    if(!confirmDelete){
        return;
    }

    try{

        await fetch(
            `http://127.0.0.1:5000/material/${materialId}`,
            {
                method:"DELETE"
            }
        );

        selectedMaterialIds = 
        selectedMaterialIds.filter(
            id => id !== materialId
        );

        localStorage.setItem(
            "selectedMaterials",
            JSON.stringify(selectedMaterialIds)
        );

        loadMaterials();

    }

    catch(error){

        console.error(error);

    }

}

function toggleMaterial(id, button)
{
    const card = button.closest(".history-card");

    if(selectedMaterialIds.includes(id))
    {
        selectedMaterialIds =
            selectedMaterialIds.filter(
                item => item !== id
            );

        button.textContent = "Choose";
        card.classList.remove("selected-material");
    }
    else
    {
        selectedMaterialIds.push(id);

        button.textContent = "Selected ✓";
        card.classList.add("selected-material");
    }

    localStorage.setItem(
        "selectedMaterials",
        JSON.stringify(selectedMaterialIds)
    );
}