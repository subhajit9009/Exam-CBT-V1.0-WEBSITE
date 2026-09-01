/* ==========================================
   ExamVerse Exam Management
   Created by Subhajit Paul
========================================== */

const createExamBtn = document.getElementById("createExamBtn");

let examSections = [];

function showAccessDenied(action = "perform this action") {
    alert(`You do not have permission to ${action}.`);
}

createExamBtn.addEventListener("click", () => {

    if (
        window.examVerseAdmin?.hasPermission(
            "exams.create"
        ) !== true
    ) {
        showAccessDenied("create exams");
        return;
    }

    openExamModal();
});

function openExamModal(){

    window.currentExamId = null;

    document.getElementById("sectionalTimerEnabled").checked = false;

    document.getElementById("examModal").style.display="flex";

}

function closeExamModal(){

    document.getElementById("examModal").style.display="none";

}

// ==========================
// Logout
// ==========================

const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {

    logoutBtn.addEventListener("click", async () => {

        if (confirm("Are you sure you want to logout?")) {

            await supabaseClient.auth.signOut();

            localStorage.removeItem("currentUserId");
            localStorage.removeItem("rememberUser");

            window.location.href = "login.html";

        }

    });

}

// ==========================================
// SECTION BUILDER
// ==========================================

const sectionalTimerCheckbox =
    document.getElementById("sectionalTimerEnabled");

const sectionBuilder =
    document.getElementById("sectionBuilder");

const sectionsContainer =
    document.getElementById("sectionsContainer");

const addSectionBtn =
    document.getElementById("addSectionBtn");

const sectionQuestionTotal =
    document.getElementById("sectionQuestionTotal");

const examQuestionTotal =
    document.getElementById("examQuestionTotal");

const sectionTimeTotal =
    document.getElementById("sectionTimeTotal");

const examTimeTotal =
    document.getElementById("examTimeTotal");

const sectionValidationMessage =
    document.getElementById("sectionValidationMessage");


// ==========================================
// Toggle Section Builder
// ==========================================

sectionalTimerCheckbox.addEventListener(
    "change",
    () => {

        if (sectionalTimerCheckbox.checked) {

            sectionBuilder.style.display = "block";

            if (examSections.length === 0) {

                addSection();

            }

        } else {

            sectionBuilder.style.display = "none";

        }

        updateSectionSummary();

    }
);


// ==========================================
// Add Section
// ==========================================

addSectionBtn.addEventListener(
    "click",
    addSection
);


function addSection(data = null) {

    const section = {

        id: data?.id || null,

        section_name:
            data?.section_name || "",

        section_order:
            data?.section_order ||
            examSections.length + 1,

        duration_minutes:
            data?.duration_minutes || 0,

        question_count:
            data?.question_count || 0

    };

    examSections.push(section);

    renderSections();

    updateSectionSummary();

}


// ==========================================
// Render Sections
// ==========================================

function renderSections() {

    sectionsContainer.innerHTML = "";

    examSections.forEach(
        (section, index) => {

            const card =
                document.createElement("div");

            card.className =
                "section-card";

            card.innerHTML = `

                <div class="section-card-header">

                    <div class="section-card-title">

                        Section ${index + 1}

                    </div>

                    <button
                        type="button"
                        class="remove-section-btn"
                        onclick="removeSection(${index})">

                        ✕

                    </button>

                </div>

                <div class="section-fields">

                    <div>

                        <label>
                            Section Name
                        </label>

                        <input
                            type="text"
                            value="${section.section_name}"
                            placeholder="e.g. English Language"
                            oninput="updateSectionName(${index}, this.value)">

                    </div>

                    <div>

                        <label>
                            Questions
                        </label>

                        <input
                            type="number"
                            min="1"
                            value="${section.question_count || ""}"
                            placeholder="40"
                            oninput="updateSectionQuestions(${index}, this.value)">

                    </div>

                    <div>

                        <label>
                            Time (Minutes)
                        </label>

                        <input
                            type="number"
                            min="1"
                            value="${section.duration_minutes || ""}"
                            placeholder="15"
                            oninput="updateSectionTime(${index}, this.value)">

                    </div>

                </div>

            `;

            sectionsContainer.appendChild(card);

        }
    );

}


// ==========================================
// Update Section Name
// ==========================================

function updateSectionName(index, value) {

    examSections[index].section_name =
        value;

}


// ==========================================
// Update Question Count
// ==========================================

function updateSectionQuestions(
    index,
    value
) {

    examSections[index].question_count =
        Number(value) || 0;

    updateSectionSummary();

}


// ==========================================
// Update Section Time
// ==========================================

function updateSectionTime(
    index,
    value
) {

    examSections[index].duration_minutes =
        Number(value) || 0;

    updateSectionSummary();

}


// ==========================================
// Remove Section
// ==========================================

function removeSection(index) {

    examSections.splice(index, 1);

    examSections.forEach(
        (section, i) => {

            section.section_order =
                i + 1;

        }
    );

    renderSections();

    updateSectionSummary();

}


// ==========================================
// Section Summary
// ==========================================

function updateSectionSummary() {

    const totalQuestions =
        Number(
            document.getElementById(
                "totalQuestions"
            ).value
        ) || 0;

    const totalTime =
        Number(
            document.getElementById(
                "examDuration"
            ).value
        ) || 0;

    const sectionQuestions =
        examSections.reduce(
            (
                total,
                section
            ) =>
                total +
                Number(
                    section.question_count || 0
                ),
            0
        );

    const sectionTime =
        examSections.reduce(
            (
                total,
                section
            ) =>
                total +
                Number(
                    section.duration_minutes || 0
                ),
            0
        );

    sectionQuestionTotal.textContent =
        sectionQuestions;

    examQuestionTotal.textContent =
        totalQuestions;

    sectionTimeTotal.textContent =
        sectionTime;

    examTimeTotal.textContent =
        totalTime;

    validateSections();

}


// ==========================================
// Validate Sections
// ==========================================

function validateSections() {

    if (
        !sectionalTimerCheckbox.checked
    ) {

        sectionValidationMessage.textContent =
            "";

        return true;

    }


    if (
        examSections.length === 0
    ) {

        sectionValidationMessage.textContent =
            "⚠️ Add at least one section.";

        sectionValidationMessage.style.color =
            "#dc2626";

        return false;

    }


    const totalQuestions =
        Number(
            document.getElementById(
                "totalQuestions"
            ).value
        ) || 0;

    const totalTime =
        Number(
            document.getElementById(
                "examDuration"
            ).value
        ) || 0;


    const sectionQuestions =
        examSections.reduce(
            (
                total,
                section
            ) =>
                total +
                Number(
                    section.question_count || 0
                ),
            0
        );


    const sectionTime =
        examSections.reduce(
            (
                total,
                section
            ) =>
                total +
                Number(
                    section.duration_minutes || 0
                ),
            0
        );


    if (
        sectionQuestions !==
        totalQuestions
    ) {

        sectionValidationMessage.textContent =
            `⚠️ Section questions total ${sectionQuestions}, but exam has ${totalQuestions}.`;

        sectionValidationMessage.style.color =
            "#dc2626";

        return false;

    }


    if (
        sectionTime !==
        totalTime
    ) {

        sectionValidationMessage.textContent =
            `⚠️ Section time totals ${sectionTime} minutes, but exam duration is ${totalTime} minutes.`;

        sectionValidationMessage.style.color =
            "#dc2626";

        return false;

    }


    sectionValidationMessage.textContent =
        "✓ Section configuration is valid.";

    sectionValidationMessage.style.color =
        "#16a34a";

    return true;

}

//=========================
// Save Exam
//=========================

const saveExamBtn =
document.getElementById("saveExam");

saveExamBtn.addEventListener(
"click",
saveExam
);

async function saveExam(){

        const isEditing =
        !!window.currentExamId;

    const requiredPermission =
        isEditing
            ? "exams.edit"
            : "exams.create";

    if (
        window.examVerseAdmin?.hasPermission(
            requiredPermission
        ) !== true
    ) {
        showAccessDenied(
            isEditing
                ? "edit exams"
                : "create exams"
        );
        return;
    }

    const examName =
        document.getElementById("examName").value.trim();

    const examCode =
        document.getElementById("examCode").value.trim();

    const category =
        document.getElementById("examCategory").value;

    const duration =
        Number(
            document.getElementById("examDuration").value
        );

    const totalQuestions =
        Number(
            document.getElementById("totalQuestions").value
        );

    const totalMarks =
        Number(
            document.getElementById("totalMarks").value
        );

    const positiveMarks =
        Number(
            document.getElementById("positiveMarks").value
        );

    const negativeMarks =
        Number(
            document.getElementById("negativeMarks").value
        );

    const passingMarks =
        Number(
            document.getElementById("passingMarks").value
        );

    const description =
        document.getElementById("examDescription").value.trim();

    const status =
        document.getElementById("examStatus").value;

    const sectionalTimerEnabled =
        document.getElementById(
            "sectionalTimerEnabled"
        ).checked;


    // ==========================================
    // BASIC VALIDATION
    // ==========================================

    if(!examName || !examCode){

        alert(
            "Please fill Exam Name and Exam Code."
        );

        return;

    }


    // ==========================================
    // SECTION VALIDATION
    // ==========================================

    if(sectionalTimerEnabled){

        if(
            typeof validateSections === "function"
            &&
            !validateSections()
        ){

            alert(
                "Please correct the section configuration before saving."
            );

            return;

        }

    }


    let examId =
        window.currentExamId || null;


    // ==========================================
    // EXAM DATA
    // ==========================================

    const examData = {

        exam_name: examName,

        exam_code: examCode,

        category: category,

        duration: duration,

        total_questions: totalQuestions,

        total_marks: totalMarks,

        positive_marks: positiveMarks,

        negative_marks: negativeMarks,

        passing_marks: passingMarks,

        description: description,

        status: status,

        sectional_timer_enabled:
            sectionalTimerEnabled

    };


    // ==========================================
    // UPDATE EXISTING EXAM
    // ==========================================

    if(examId){

        const {
            error
        } = await supabaseClient

            .from("exams")

            .update(examData)

            .eq("id", examId);


        if(error){

            console.error(
                "Exam Update Error:",
                error
            );

            alert(error.message);

            return;

        }

    }


    // ==========================================
    // CREATE NEW EXAM
    // ==========================================

    else{

        const {
            data,
            error
        } = await supabaseClient

            .from("exams")

            .insert(examData)

            .select("id")

            .single();


        if(error){

            console.error(
                "Exam Create Error:",
                error
            );

            alert(error.message);

            return;

        }


        // Get newly created exam ID

        examId =
            data.id;

        window.currentExamId =
            examId;

    }


    // ==========================================
    // SAVE SECTIONS
    // ==========================================

    if(sectionalTimerEnabled){

        const sectionError =
            await saveExamSections(
                examId
            );


        if(sectionError){

            alert(
                "Exam saved, but sections could not be saved.\n\n"
                + sectionError
            );

            return;

        }

    }


    // ==========================================
    // SUCCESS
    // ==========================================

    alert(
        "Exam Saved Successfully ✅"
    );


    window.currentExamId =
        null;


    if(
        typeof examSections !== "undefined"
    ){

        examSections = [];

    }


    closeExamModal();

    (async () => {
    if (window.examVerseAdminReady) {
        await window.examVerseAdminReady;
    }

    await loadExams();
})();

}

// ==========================================
// SAVE EXAM SECTIONS
// ==========================================

async function saveExamSections(examId){

    if(
        !examSections ||
        examSections.length === 0
    ){

        return null;

    }


    // ==========================================
    // Get existing sections from database
    // ==========================================

    const {
        data: existingSections,
        error: fetchError
    } = await supabaseClient

        .from("exam_sections")

        .select("id")

        .eq(
            "exam_id",
            examId
        );


    if(fetchError){

        console.error(
            "Existing Sections Error:",
            fetchError
        );

        return fetchError.message;

    }


    const currentSectionIds =
        examSections

            .filter(
                section =>
                    section.id
            )

            .map(
                section =>
                    section.id
            );


    // ==========================================
    // Delete sections removed by admin
    // ==========================================

    const sectionsToDelete =
        (existingSections || [])

            .filter(
                section =>
                    !currentSectionIds.includes(
                        section.id
                    )
            );


    for(
        const section
        of sectionsToDelete
    ){

        const {
            error
        } = await supabaseClient

            .from("exam_sections")

            .delete()

            .eq(
                "id",
                section.id
            );


        if(error){

            console.error(
                "Section Delete Error:",
                error
            );

            return error.message;

        }

    }


    // ==========================================
    // Save / Update current sections
    // ==========================================

    for(
        let i = 0;
        i < examSections.length;
        i++
    ){

        const section =
            examSections[i];


        const sectionData = {

    exam_id: examId,

    section_name:
        section.section_name.trim(),

    section_order:
        i + 1,

    duration_minutes:
        Number(
            section.duration_minutes
        ) || 0,

    question_count:
        Number(
            section.question_count
        ) || 0

};


        // ======================================
        // Existing section → UPDATE
        // ======================================

        if(section.id){

            const {
                error
            } = await supabaseClient

                .from("exam_sections")

                .update(
                    sectionData
                )

                .eq(
                    "id",
                    section.id
                );


            if(error){

                console.error(
                    "Section Update Error:",
                    error
                );

                return error.message;

            }

        }


        // ======================================
        // New section → INSERT
        // ======================================

        else{

            const {
                data,
                error
            } = await supabaseClient

                .from("exam_sections")

                .insert(
                    sectionData
                )

                .select("id")

                .single();


            if(error){

                console.error(
                    "Section Insert Error:",
                    error
                );

                return error.message;

            }


            // Store database ID locally

            section.id =
                data.id;

        }

    }


    return null;

}


//=========================
// Load Exams
//=========================

async function loadExams() {

    const examBody =
        document.getElementById("examBody");


    // ==========================================
    // CHECK EXAM VIEW PERMISSION
    // ==========================================

    const isMainAdmin =
        window.examVerseAdmin?.isMainAdmin === true;


    const canViewExams =
        isMainAdmin ||
        window.examVerseAdmin?.hasPermission(
            "exams.view"
        ) === true;


    // ==========================================
    // ACCESS DENIED
    // ==========================================

    if (!canViewExams) {

        examBody.innerHTML = `
            <tr>
                <td colspan="5"
                    style="
                        text-align:center;
                        padding:30px;
                    "
                >
                    You do not have permission
                    to view exams.
                </td>
            </tr>
        `;

        return;
    }


    // ==========================================
    // LOAD EXAMS FROM DATABASE
    // ==========================================

    const {
        data,
        error
    } = await supabaseClient

        .from("exams")

        .select("*")

        .order(
            "created_at",
            {
                ascending: false
            }
        );


    // ==========================================
    // DATABASE ERROR
    // ==========================================

    if (error) {

        console.error(
            "Exam Load Error:",
            error
        );

        examBody.innerHTML = `
            <tr>
                <td colspan="5"
                    style="text-align:center;"
                >
                    Failed to load exams.
                </td>
            </tr>
        `;

        return;
    }


    // ==========================================
    // CLEAR TABLE
    // ==========================================

    examBody.innerHTML = "";


    // ==========================================
    // NO EXAMS
    // ==========================================

    if (!data || data.length === 0) {

        examBody.innerHTML = `
            <tr>

                <td colspan="5">
                    No Exams Created Yet
                </td>

            </tr>
        `;

        return;
    }


    // ==========================================
    // RENDER EXAMS
    // ==========================================

    data.forEach(exam => {

        examBody.innerHTML += `

            <tr>

                <td>
                    ${exam.exam_name || ""}
                </td>

                <td>
                    ${exam.category || ""}
                </td>

                <td>
                    ${exam.status || ""}
                </td>

                <td>
                    ${exam.total_questions ?? 0}
                </td>

                <td>

                    ${
                        window.examVerseAdmin?.hasPermission(
                            "exams.edit"
                        ) === true

                        ? `

                            <button
                                type="button"
                                onclick="
                                    editExam('${exam.id}')
                                "
                            >
                                ✏
                            </button>

                        `

                        : ""
                    }


                    ${
                        window.examVerseAdmin?.hasPermission(
                            "exams.delete"
                        ) === true

                        ? `

                            <button
                                type="button"
                                onclick="
                                    deleteExam('${exam.id}')
                                "
                            >
                                🗑
                            </button>

                        `

                        : ""
                    }

                </td>

            </tr>

        `;

    });

}

(async () => {
    if (window.examVerseAdminReady) {
        await window.examVerseAdminReady;
    }

    await loadExams();
})();

// ==========================================
// EDIT EXAM
// ==========================================

async function editExam(id){

        if (
        window.examVerseAdmin?.hasPermission(
            "exams.edit"
        ) !== true
    ) {
        showAccessDenied("edit exams");
        return;
    }

    // ==========================================
    // Load Exam
    // ==========================================

    const {
        data,
        error
    } = await supabaseClient

        .from("exams")

        .select("*")

        .eq(
            "id",
            id
        )

        .single();


    if(error){

        alert(
            error.message
        );

        return;

    }


    // ==========================================
    // Fill Exam Fields
    // ==========================================

    document.getElementById(
        "examName"
    ).value =
        data.exam_name;


    document.getElementById(
        "examCode"
    ).value =
        data.exam_code;


    document.getElementById(
        "examCategory"
    ).value =
        data.category;


    document.getElementById(
        "examDuration"
    ).value =
        data.duration;


    document.getElementById(
        "totalQuestions"
    ).value =
        data.total_questions;


    document.getElementById(
        "totalMarks"
    ).value =
        data.total_marks;


    document.getElementById(
        "positiveMarks"
    ).value =
        data.positive_marks;


    document.getElementById(
        "negativeMarks"
    ).value =
        data.negative_marks;


    document.getElementById(
        "passingMarks"
    ).value =
        data.passing_marks;


    document.getElementById(
        "examDescription"
    ).value =
        data.description || "";


    document.getElementById(
        "examStatus"
    ).value =
        data.status;


    // ==========================================
    // Store Current Exam ID
    // ==========================================

    window.currentExamId =
        id;


    // ==========================================
    // Sectional Timer
    // ==========================================

    const sectionalEnabled =
        data.sectional_timer_enabled === true;


    document.getElementById(
        "sectionalTimerEnabled"
    ).checked =
        sectionalEnabled;


    // ==========================================
    // Clear Current Sections
    // ==========================================

    examSections = [];


    // ==========================================
    // Load Sections
    // ==========================================

    const {
        data: sections,
        error: sectionError
    } = await supabaseClient

        .from("exam_sections")

        .select("*")

        .eq(
            "exam_id",
            id
        )

        .order(
            "section_order",
            {
                ascending: true
            }
        );


    if(sectionError){

        console.error(
            "Section Load Error:",
            sectionError
        );

        alert(
            sectionError.message
        );

        return;

    }


    // ==========================================
    // Load Section Question Counts
    // ==========================================

    for(
        const section
        of (sections || [])
    ){

        const questionCount =
    Number(
        section.question_count
    ) || 0;

    
        examSections.push({

            id:
                section.id,

            section_name:
                section.section_name,

            section_order:
                section.section_order,

            duration_minutes:
                section.duration_minutes,

            question_count:
                questionCount

        });

    }


    // ==========================================
    // Open Modal
    // ==========================================

    examModal.style.display =
        "flex";


    // ==========================================
    // Display Section Builder
    // ==========================================

    if(sectionalEnabled){

        sectionBuilder.style.display =
            "block";

        renderSections();

        updateSectionSummary();

    }

    else{

        sectionBuilder.style.display =
            "none";

    }

}

//=========================
// Delete Exam
//=========================

async function deleteExam(id){

        if (
        window.examVerseAdmin?.hasPermission(
            "exams.delete"
        ) !== true
    ) {
        showAccessDenied("delete exams");
        return;
    }

const ok = confirm("Delete this exam?");

if(!ok) return;

const { error } = await supabaseClient

.from("exams")

.delete()

.eq("id", id);

if(error){

alert(error.message);

return;

}

alert("Exam Deleted Successfully ✅");

(async () => {
    if (window.examVerseAdminReady) {
        await window.examVerseAdminReady;
    }

    await loadExams();
})();

// ==========================================
// AUTO REFRESH WHEN ADMIN PERMISSIONS CHANGE
// ==========================================

window.addEventListener(
    "storage",
    event => {

        if (
            event.key !==
            "examVersePermissionsUpdated"
        ) {
            return;
        }

        /*
         * Reload the complete page so the central
         * permission state is initialized again.
         */
        window.location.reload();

    }
);

}