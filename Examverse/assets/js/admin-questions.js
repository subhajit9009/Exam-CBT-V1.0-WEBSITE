/* ==========================================
   ExamVerse Question Management
   Created by Subhajit Paul
========================================== */

"use strict";

/* =========================================================
   ELEMENT REFERENCES
========================================================= */

const questionModal =
    document.getElementById("questionModal");

const addQuestionBtn =
    document.getElementById("addQuestionBtn");

const closeQuestionBtn =
    document.getElementById("closeQuestionBtn");

const importExcelBtnOpen =
    document.getElementById("importExcelBtn");

const excelImportModal =
    document.getElementById("excelImportModal");

const closeExcelImportBtn =
    document.getElementById("closeExcelBtn");

const excelExamSelect =
    document.getElementById("excelExamSelect");

const excelFile =
    document.getElementById("excelFile");

const excelFileStatus =
    document.getElementById("excelFileStatus");

const validateExcelBtn =
    document.getElementById("validateExcelBtn");

const importExcelBtn =
    document.getElementById("importExcelBtnModal");

const excelExamInfo =
    document.getElementById("excelExamInfo");

const questionTable =
    document.getElementById("questionTable");

const examSelect =
    document.getElementById("examSelect");

const filterExam =
    document.getElementById("filterExam");

const filterDifficulty =
    document.getElementById("filterDifficulty");

const searchQuestion =
    document.getElementById("searchQuestion");

const saveQuestionBtn =
    document.getElementById("saveQuestionBtn");


/* =========================================================
   GLOBAL STATE
========================================================= */

let validatedExcelRows = [];

window.currentQuestionId = null;


/* =========================================================
   BASIC ELEMENT CHECK
========================================================= */

function elementMissing(element, name) {

    if (!element) {

        console.warn(
            `ExamVerse: HTML element #${name} was not found.`
        );

        return true;
    }

    return false;
}


/* =========================================================
   OPEN ADD QUESTION MODAL
========================================================= */

if (addQuestionBtn && questionModal) {

    addQuestionBtn.onclick = () => {

        window.currentQuestionId = null;

        resetQuestionForm();

        questionModal.style.display = "flex";

    };

}


/* =========================================================
   CLOSE QUESTION MODAL
========================================================= */

if (closeQuestionBtn && questionModal) {

    closeQuestionBtn.onclick = () => {

        questionModal.style.display = "none";

    };

}


/* =========================================================
   OPEN EXCEL IMPORT MODAL
========================================================= */

if (
    importExcelBtnOpen &&
    excelImportModal
) {

    importExcelBtnOpen.onclick = async () => {

        excelImportModal.style.display = "flex";

        resetExcelImportState();

        await loadExcelExams();

    };

}


/* =========================================================
   CLOSE EXCEL IMPORT MODAL
========================================================= */

if (
    closeExcelImportBtn &&
    excelImportModal
) {

    closeExcelImportBtn.onclick = () => {

        excelImportModal.style.display = "none";

    };

}


/* =========================================================
   CLOSE MODALS WHEN CLICKING OUTSIDE
========================================================= */

window.addEventListener(
    "click",
    (event) => {

        if (
            questionModal &&
            event.target === questionModal
        ) {

            questionModal.style.display = "none";

        }


        if (
            excelImportModal &&
            event.target === excelImportModal
        ) {

            excelImportModal.style.display = "none";

        }

    }
);


/* =========================================================
   LOAD EXAMS
========================================================= */

async function loadExams() {

    if (!examSelect &&
        !filterExam &&
        !excelExamSelect) {

        console.warn(
            "ExamVerse: No exam select elements found."
        );

        return;

    }


    try {

        const {
            data,
            error
        } = await supabaseClient

            .from("exams")

            .select("id, exam_name")

            .order(
                "exam_name",
                {
                    ascending: true
                }
            );


        if (error) {

            console.error(
                "Load exams error:",
                error
            );

            return;

        }


        if (!data) {

            return;

        }


        /* -------------------------
           Add Question Exam Select
        ------------------------- */

        if (examSelect) {

            examSelect.innerHTML =
                '<option value="">Select Exam</option>';

        }


        /* -------------------------
           Filter Exam Select
        ------------------------- */

        if (filterExam) {

            filterExam.innerHTML =
                '<option value="">All Exams</option>';

        }


        /* -------------------------
           Excel Exam Select
        ------------------------- */

        if (excelExamSelect) {

            excelExamSelect.innerHTML =
                '<option value="">Select Exam</option>';

        }


        data.forEach(
            (exam) => {

                const safeName =
                    escapeHTML(
                        exam.exam_name || ""
                    );


                if (examSelect) {

                    examSelect.innerHTML += `

                        <option value="${exam.id}">
                            ${safeName}
                        </option>

                    `;

                }


                if (filterExam) {

                    filterExam.innerHTML += `

                        <option value="${exam.id}">
                            ${safeName}
                        </option>

                    `;

                }


                if (excelExamSelect) {

                    excelExamSelect.innerHTML += `

                        <option value="${exam.id}">
                            ${safeName}
                        </option>

                    `;

                }

            }
        );


    } catch (error) {

        console.error(
            "Unexpected loadExams error:",
            error
        );

    }

}


/* =========================================================
   LOAD QUESTIONS
========================================================= */

async function loadQuestions() {

    if (!questionTable) {

        console.warn(
            "ExamVerse: #questionTable not found."
        );

        return;

    }


    try {

        const examFilterValue =
            filterExam
                ? filterExam.value
                : "";


        const difficultyFilterValue =
            filterDifficulty
                ? filterDifficulty.value
                : "";


        const searchValue =
            searchQuestion
                ? searchQuestion.value
                    .trim()
                    .toLowerCase()
                : "";


        let query =
            supabaseClient

                .from("questions")

                .select(`
                    *,
                    exams(exam_name)
                `);


        if (examFilterValue) {

            query =
                query.eq(
                    "exam_id",
                    examFilterValue
                );

        }


        if (difficultyFilterValue) {

            query =
                query.eq(
                    "difficulty",
                    difficultyFilterValue
                );

        }


        const {
            data,
            error
        } = await query.order(
            "question_no",
            {
                ascending: true
            }
        );


        if (error) {

            console.error(
                "Load questions error:",
                error
            );

            questionTable.innerHTML = `

                <tr>

                    <td colspan="6">

                        Unable to load questions.

                    </td>

                </tr>

            `;

            return;

        }


        questionTable.innerHTML = "";


        let visibleCount = 0;


        if (!data || data.length === 0) {

            questionTable.innerHTML = `

                <tr>

                    <td
                        colspan="6"
                        style="text-align:center;"
                    >

                        No Questions Available

                    </td>

                </tr>

            `;

            return;

        }


        data.forEach(
            (q) => {

                const questionText =
                    String(
                        q.question || ""
                    );


                if (
                    searchValue &&
                    !questionText
                        .toLowerCase()
                        .includes(searchValue)
                ) {

                    return;

                }


                visibleCount++;


                const examName =
                    q.exams &&
                    q.exams.exam_name
                        ? q.exams.exam_name
                        : "Unknown Exam";


                const difficulty =
                    q.difficulty || "Easy";


                const difficultyClass =
                    String(
                        difficulty
                    )
                    .toLowerCase()
                    .replace(
                        /\s+/g,
                        "-"
                    );


                questionTable.innerHTML += `

                    <tr>

                        <td>
                            ${visibleCount}
                        </td>

                        <td>
                            ${escapeHTML(examName)}
                        </td>

                        <td>
                            ${escapeHTML(
                                q.subject || ""
                            )}
                        </td>

                        <td>

                            <span
                                class="${difficultyClass}"
                            >

                                ${escapeHTML(
                                    difficulty
                                )}

                            </span>

                        </td>

                        <td>
                            ${q.marks ?? 0}
                        </td>

                        <td>

                            <button
                                type="button"
                                onclick="previewQuestion('${q.id}')"
                                title="Preview"
                            >
                                👁
                            </button>


                            <button
                                type="button"
                                onclick="editQuestion('${q.id}')"
                                title="Edit"
                            >
                                ✏
                            </button>


                            <button
                                type="button"
                                onclick="deleteQuestion('${q.id}')"
                                title="Delete"
                            >
                                🗑
                            </button>

                        </td>

                    </tr>

                `;

            }
        );


        if (visibleCount === 0) {

            questionTable.innerHTML = `

                <tr>

                    <td
                        colspan="6"
                        style="text-align:center;"
                    >

                        No matching questions found.

                    </td>

                </tr>

            `;

        }


    } catch (error) {

        console.error(
            "Unexpected loadQuestions error:",
            error
        );

    }

}


/* =========================================================
   SAVE QUESTION
========================================================= */

if (saveQuestionBtn) {

    saveQuestionBtn.onclick =
        saveQuestion;

}


async function saveQuestion() {

    try {

        const examId =
            getValue("examSelect");

        const questionNo =
            getValue("questionNo");

        const subject =
            getValue("subject");

        const question =
            getValue("question");

        const optionA =
            getValue("optionA");

        const optionB =
            getValue("optionB");

        const optionC =
            getValue("optionC");

        const optionD =
            getValue("optionD");

        const correctAnswer =
            getValue("correctAnswer");

        const explanation =
            getValue("explanation");

        const marks =
            Number(
                getValue("marks") || 1
            );

        const negativeMarks =
            Number(
                getValue("negativeMarks") || 0
            );

        const difficulty =
            getValue("difficulty") ||
            "Easy";

        const questionType =
            getValue("questionType") ||
            "MCQ";


        /* -------------------------
           Validation
        ------------------------- */

        if (
            !examId ||
            !questionNo ||
            !subject ||
            !question ||
            !optionA ||
            !optionB ||
            !optionC ||
            !optionD ||
            !correctAnswer
        ) {

            alert(
                "Please fill all required fields."
            );

            return;

        }


        if (
            !Number.isInteger(
                Number(questionNo)
            ) ||
            Number(questionNo) <= 0
        ) {

            alert(
                "Question number must be a positive integer."
            );

            return;

        }


        if (
            !["A", "B", "C", "D"]
                .includes(
                    correctAnswer
                        .trim()
                        .toUpperCase()
                )
        ) {

            alert(
                "Correct answer must be A, B, C or D."
            );

            return;

        }


        /* -------------------------
           Database Payload
        ------------------------- */

        const payload = {

            exam_id:
                examId,

            question_no:
                Number(questionNo),

            subject:
                subject,

            question:
                question,

            option_a:
                optionA,

            option_b:
                optionB,

            option_c:
                optionC,

            option_d:
                optionD,

            correct_answer:
                correctAnswer
                    .trim()
                    .toUpperCase(),

            explanation:
                explanation,

            marks:
                marks,

            negative_marks:
                negativeMarks,

            difficulty:
                difficulty,

            question_type:
                questionType

        };


        let response;


        /* -------------------------
           UPDATE
        ------------------------- */

        if (
            window.currentQuestionId
        ) {

            response =
                await supabaseClient

                    .from("questions")

                    .update(payload)

                    .eq(
                        "id",
                        window.currentQuestionId
                    );

        }


        /* -------------------------
           INSERT
        ------------------------- */

        else {

            response =
                await supabaseClient

                    .from("questions")

                    .insert(
                        payload
                    );

        }


        if (response.error) {

            console.error(
                "Save question error:",
                response.error
            );

            alert(
                response.error.message
            );

            return;

        }


        alert(
            window.currentQuestionId
                ? "Question Updated Successfully ✅"
                : "Question Saved Successfully ✅"
        );


        window.currentQuestionId =
            null;


        resetQuestionForm();


        if (questionModal) {

            questionModal.style.display =
                "none";

        }


        await loadQuestions();


    } catch (error) {

        console.error(
            "Unexpected save question error:",
            error
        );

        alert(
            error.message ||
            "Unable to save question."
        );

    }

}


/* =========================================================
   RESET QUESTION FORM
========================================================= */

function resetQuestionForm() {

    setValue(
        "questionNo",
        ""
    );

    setValue(
        "subject",
        ""
    );

    setValue(
        "question",
        ""
    );

    setValue(
        "optionA",
        ""
    );

    setValue(
        "optionB",
        ""
    );

    setValue(
        "optionC",
        ""
    );

    setValue(
        "optionD",
        ""
    );

    setValue(
        "correctAnswer",
        ""
    );

    setValue(
        "explanation",
        ""
    );

    setValue(
        "marks",
        "1"
    );

    setValue(
        "negativeMarks",
        "0"
    );

    setValue(
        "difficulty",
        "Easy"
    );

    setValue(
        "questionType",
        "MCQ"
    );

}


/* =========================================================
   EDIT QUESTION
========================================================= */

async function editQuestion(id) {

    try {

        const {
            data,
            error
        } = await supabaseClient

            .from("questions")

            .select("*")

            .eq(
                "id",
                id
            )

            .single();


        if (error) {

            console.error(
                "Edit question error:",
                error
            );

            alert(
                error.message
            );

            return;

        }


        setValue(
            "examSelect",
            data.exam_id
        );

        setValue(
            "questionNo",
            data.question_no
        );

        setValue(
            "subject",
            data.subject
        );

        setValue(
            "question",
            data.question
        );

        setValue(
            "optionA",
            data.option_a
        );

        setValue(
            "optionB",
            data.option_b
        );

        setValue(
            "optionC",
            data.option_c
        );

        setValue(
            "optionD",
            data.option_d
        );

        setValue(
            "correctAnswer",
            data.correct_answer
        );

        setValue(
            "explanation",
            data.explanation
        );

        setValue(
            "marks",
            data.marks
        );

        setValue(
            "negativeMarks",
            data.negative_marks
        );

        setValue(
            "difficulty",
            data.difficulty
        );

        setValue(
            "questionType",
            data.question_type
        );


        window.currentQuestionId =
            id;


        if (questionModal) {

            questionModal.style.display =
                "flex";

        }


    } catch (error) {

        console.error(
            "Unexpected edit error:",
            error
        );

        alert(
            error.message ||
            "Unable to edit question."
        );

    }

}


/* =========================================================
   PREVIEW QUESTION
========================================================= */

async function previewQuestion(id) {

    try {

        const {
            data,
            error
        } = await supabaseClient

            .from("questions")

            .select("*")

            .eq(
                "id",
                id
            )

            .single();


        if (error) {

            alert(
                error.message
            );

            return;

        }


        alert(

`Question

${data.question || ""}

----------------------------

A. ${data.option_a || ""}

B. ${data.option_b || ""}

C. ${data.option_c || ""}

D. ${data.option_d || ""}

Correct Answer: ${data.correct_answer || ""}

Marks: ${data.marks ?? 0}

Negative Marks: ${data.negative_marks ?? 0}

Difficulty: ${data.difficulty || ""}

Explanation:
${data.explanation || "No explanation provided."}`

        );


    } catch (error) {

        console.error(
            "Preview error:",
            error
        );

        alert(
            error.message ||
            "Unable to preview question."
        );

    }

}


/* =========================================================
   DELETE QUESTION
========================================================= */

async function deleteQuestion(id) {

    const confirmed =
        confirm(
            "Delete this question?"
        );


    if (!confirmed) {

        return;

    }


    try {

        const {
            error
        } = await supabaseClient

            .from("questions")

            .delete()

            .eq(
                "id",
                id
            );


        if (error) {

            console.error(
                "Delete question error:",
                error
            );

            alert(
                error.message
            );

            return;

        }


        alert(
            "Question Deleted Successfully ✅"
        );


        await loadQuestions();


    } catch (error) {

        console.error(
            "Unexpected delete error:",
            error
        );

        alert(
            error.message ||
            "Unable to delete question."
        );

    }

}


/* =========================================================
   SEARCH
========================================================= */

if (searchQuestion) {

    searchQuestion.addEventListener(
        "input",
        loadQuestions
    );

}


/* =========================================================
   EXAM FILTER
========================================================= */

if (filterExam) {

    filterExam.addEventListener(
        "change",
        loadQuestions
    );

}


/* =========================================================
   DIFFICULTY FILTER
========================================================= */

if (filterDifficulty) {

    filterDifficulty.addEventListener(
        "change",
        loadQuestions
    );

}


/* =========================================================
   EXCEL IMPORT
========================================================= */


/* ---------------------------------------------------------
   RESET EXCEL IMPORT STATE
--------------------------------------------------------- */

function resetExcelImportState() {

    validatedExcelRows = [];


    if (excelFile) {

        excelFile.value = "";

    }


    if (validateExcelBtn) {

        validateExcelBtn.disabled =
            true;

    }


    if (importExcelBtn) {

        importExcelBtn.disabled =
            true;

        importExcelBtn.textContent =
            "💾 Import Questions";

    }


    if (excelFileStatus) {

        excelFileStatus.textContent =
            "No file selected.";

    }


    if (excelExamInfo) {

        excelExamInfo.innerHTML =
            "<strong>Select an exam first.</strong>";

    }

}


/* =========================================================
   LOAD EXCEL EXAMS
========================================================= */

async function loadExcelExams() {

    if (!excelExamSelect) {

        console.warn(
            "ExamVerse: #excelExamSelect not found."
        );

        return;

    }


    try {

        const {
            data,
            error
        } = await supabaseClient

            .from("exams")

            .select(
                "id, exam_name"
            )

            .order(
                "exam_name",
                {
                    ascending: true
                }
            );


        if (error) {

            console.error(
                "Excel exam loading error:",
                error
            );

            alert(
                "Unable to load exams."
            );

            return;

        }


        excelExamSelect.innerHTML =
            '<option value="">Select Exam</option>';


        (data || []).forEach(
            (exam) => {

                excelExamSelect.innerHTML += `

                    <option value="${exam.id}">
                        ${escapeHTML(
                            exam.exam_name || ""
                        )}
                    </option>

                `;

            }
        );


    } catch (error) {

        console.error(
            "Unexpected Excel exam loading error:",
            error
        );

    }

}


/* =========================================================
   EXCEL EXAM SELECTION
   IMPORTANT:
   THIS IS THE ONLY CHANGE LISTENER.
========================================================= */

if (excelExamSelect) {

    excelExamSelect.addEventListener(
        "change",
        handleExcelExamSelection
    );

}


async function handleExcelExamSelection() {

    const examId =
        excelExamSelect
            ? excelExamSelect.value
            : "";

    validatedExcelRows = [];

    if (validateExcelBtn) {
        validateExcelBtn.disabled = true;
    }

    if (importExcelBtn) {
        importExcelBtn.disabled = true;
    }

    if (excelFile) {
        excelFile.value = "";
    }

    if (excelFileStatus) {
        excelFileStatus.textContent =
            "No file selected.";
    }

    /* ==========================
       NO EXAM SELECTED
    ========================== */

    if (!examId) {

        if (excelExamInfo) {

            excelExamInfo.style.display = "block";

            excelExamInfo.innerHTML =
                "<strong>Select an exam first.</strong>";

        }

        return;
    }


    /* ==========================
       LOADING
    ========================== */

    if (excelExamInfo) {

        excelExamInfo.style.display = "block";

        excelExamInfo.innerHTML = `
            ⏳ Checking exam configuration...
        `;

    }


    try {

        /* ==========================
           LOAD EXAM
        ========================== */

        const {
            data: exam,
            error: examError
        } = await supabaseClient

            .from("exams")

            .select("*")

            .eq("id", examId)

            .single();


        if (examError) {
            throw examError;
        }


        /* ==========================
           LOAD SECTIONS
        ========================== */

        const {
            data: sections,
            error: sectionError
        } = await supabaseClient

            .from("exam_sections")

            .select(`
                id,
                section_name,
                question_count,
                section_order
            `)

            .eq("exam_id", examId)

            .order(
                "section_order",
                {
                    ascending: true
                }
            );


        if (sectionError) {
            throw sectionError;
        }


        /* ==========================
           SECTIONAL EXAM
        ========================== */

        if (
            sections &&
            sections.length > 0
        ) {

            let html = `

                <div
                    style="
                        color:#1d4ed8;
                        font-weight:700;
                        font-size:16px;
                    "
                >
                    📌 Sectional Exam
                </div>

                <div style="margin-top:6px;">
                    <strong>
                        ${escapeHTML(
                            exam.exam_name || ""
                        )}
                    </strong>
                </div>

                <div>
                    Sections configured:
                    <strong>
                        ${sections.length}
                    </strong>
                </div>

                <div
                    style="
                        margin-top:8px;
                        padding-top:8px;
                        border-top:1px solid #dbe3ef;
                    "
                >
            `;


            sections.forEach(
                (section) => {

                    html += `

                        <div>
                            •
                            ${escapeHTML(
                                section.section_name || ""
                            )}
                            :
                            <strong>
                                ${Number(
                                    section.question_count || 0
                                )}
                            </strong>
                            questions
                        </div>

                    `;

                }
            );


            html += `
                </div>
            `;


            excelExamInfo.innerHTML =
                html;


            console.log(
                "Selected sectional exam:",
                exam
            );

            console.log(
                "Exam sections:",
                sections
            );


        }

        /* ==========================
           NON-SECTIONAL EXAM
        ========================== */

        else {

            const totalQuestions =
                Number(
                    exam.total_questions || 0
                );


            const duration =
                exam.duration_minutes ??
                exam.duration ??
                0;


            excelExamInfo.innerHTML = `

                <div
                    style="
                        color:#15803d;
                        font-weight:700;
                        font-size:16px;
                    "
                >
                    📘 Non-Sectional Exam
                </div>

                <div style="margin-top:6px;">
                    <strong>
                        ${escapeHTML(
                            exam.exam_name || ""
                        )}
                    </strong>
                </div>

                <div>
                    Total Questions:
                    <strong>
                        ${totalQuestions}
                    </strong>
                </div>

                <div>
                    Duration:
                    <strong>
                        ${duration}
                    </strong>
                    minutes
                </div>

            `;


            console.log(
                "Selected non-sectional exam:",
                exam
            );

        }


    } catch (error) {

        console.error(
            "Excel exam configuration error:",
            error
        );


        if (excelExamInfo) {

            excelExamInfo.innerHTML = `

                <div
                    style="
                        color:#dc2626;
                        font-weight:600;
                    "
                >
                    ❌ Unable to load exam configuration.
                </div>

                <div style="margin-top:5px;">
                    ${escapeHTML(
                        error.message ||
                        "Unknown error"
                    )}
                </div>

            `;

        }

    }

}

/* =========================================================
   EXCEL FILE SELECTION
========================================================= */

if (excelFile) {

    excelFile.addEventListener(
        "change",
        handleExcelFileSelection
    );

}


function handleExcelFileSelection() {

    const file =
        excelFile
            ? excelFile.files[0]
            : null;


    validatedExcelRows = [];


    if (validateExcelBtn) {

        validateExcelBtn.disabled =
            true;

    }


    if (importExcelBtn) {

        importExcelBtn.disabled =
            true;

    }


    if (!file) {

        if (excelFileStatus) {

            excelFileStatus.textContent =
                "No file selected.";

        }

        return;

    }


    const fileName =
        file.name.toLowerCase();


    const validExtension =
        fileName.endsWith(".xlsx") ||
        fileName.endsWith(".xls");


    if (!validExtension) {

        if (excelFileStatus) {

            excelFileStatus.innerHTML =
                "❌ Please select an Excel file (.xlsx or .xls).";

        }


        excelFile.value = "";

        return;

    }


    if (excelFileStatus) {

        excelFileStatus.innerHTML = `

            📄 <strong>
                ${escapeHTML(file.name)}
            </strong>

            <br>

            ${(file.size / 1024).toFixed(1)}
            KB

        `;

    }


    if (validateExcelBtn) {

        validateExcelBtn.disabled =
            false;

    }

}


/* =========================================================
   READ EXCEL FILE
========================================================= */

async function readExcelFile() {

    if (!excelFile) {

        throw new Error(
            "Excel file input is not available."
        );

    }


    const file =
        excelFile.files[0];


    if (!file) {

        throw new Error(
            "Please select an Excel file."
        );

    }


    if (
        typeof XLSX ===
        "undefined"
    ) {

        throw new Error(
            "SheetJS (XLSX) library is not loaded. Add the XLSX script to admin-questions.html."
        );

    }


    const arrayBuffer =
        await file.arrayBuffer();


    const workbook =
        XLSX.read(
            arrayBuffer,
            {
                type: "array"
            }
        );


    if (
        !workbook.SheetNames ||
        !workbook.SheetNames.length
    ) {

        throw new Error(
            "Excel file contains no worksheet."
        );

    }


    const firstSheet =
        workbook.Sheets[
            workbook.SheetNames[0]
        ];


    const rows =
        XLSX.utils.sheet_to_json(
            firstSheet,
            {
                defval: "",
                raw: false
            }
        );


    return rows;

}


/* =========================================================
   VALIDATE EXCEL BUTTON
========================================================= */

if (validateExcelBtn) {

    validateExcelBtn.onclick =
        validateExcel;

}


async function validateExcel() {

    try {

        validateExcelBtn.disabled =
            true;


        if (excelFileStatus) {

            excelFileStatus.innerHTML =
                "⏳ Reading Excel file...";

        }


        const rows =
            await readExcelFile();


        if (!rows.length) {

            throw new Error(
                "Excel file contains no questions."
            );

        }


        validatedExcelRows =
            validateQuestionRows(
                rows
            );


        if (excelFileStatus) {

            excelFileStatus.innerHTML = `

                ✅ Excel validated successfully.

                <br><br>

                Questions found:
                <strong>
                    ${validatedExcelRows.length}
                </strong>

            `;

        }


        if (importExcelBtn) {

            importExcelBtn.disabled =
                false;

        }


    } catch (error) {

        console.error(
            "Excel validation error:",
            error
        );


        validatedExcelRows = [];


        if (importExcelBtn) {

            importExcelBtn.disabled =
                true;

        }


        if (excelFileStatus) {

            excelFileStatus.innerHTML = `

                ❌ ${escapeHTML(
                    error.message ||
                    "Excel validation failed."
                )}

            `;

        }

    } finally {

        validateExcelBtn.disabled =
            false;

    }

}


/* =========================================================
   NORMALIZE EXCEL COLUMN NAME
========================================================= */

function normalizeColumnName(name) {

    return String(name || "")

        .trim()

        .toLowerCase()

        .replace(
            /\s+/g,
            "_"
        )

        .replace(
            /[()]/g,
            ""
        )

        .replace(
            /-/g,
            "_"
        );

}


/* =========================================================
   VALIDATE QUESTION ROWS
========================================================= */

function validateQuestionRows(rows) {

    const requiredColumns = [

        "question_no",

        "subject",

        "question",

        "option_a",

        "option_b",

        "option_c",

        "option_d",

        "correct_answer"

    ];


    if (
        !Array.isArray(rows) ||
        rows.length === 0
    ) {

        throw new Error(
            "Excel contains no question rows."
        );

    }


    const firstRow =
        rows[0];


    const originalColumns =
        Object.keys(firstRow);


    const normalizedColumns =
        originalColumns.map(
            normalizeColumnName
        );


    const missingColumns =
        requiredColumns.filter(
            required =>
                !normalizedColumns
                    .includes(required)
        );


    if (
        missingColumns.length
    ) {

        throw new Error(

            "Missing Excel columns: " +
            missingColumns.join(", ")

        );

    }


    return rows.map(
        (row, index) => {

            const normalized = {};


            Object.keys(row).forEach(
                (key) => {

                    normalized[
                        normalizeColumnName(
                            key
                        )
                    ] = row[key];

                }
            );


            /* -------------------------
               Question Number
            ------------------------- */

            const questionNo =
                Number(
                    normalized.question_no
                );


            if (
                !Number.isInteger(
                    questionNo
                ) ||
                questionNo <= 0
            ) {

                throw new Error(

                    `Invalid question number at Excel row ${index + 2}.`

                );

            }


            /* -------------------------
               Question
            ------------------------- */

            const question =
                String(
                    normalized.question || ""
                ).trim();


            if (!question) {

                throw new Error(

                    `Question is empty at Excel row ${index + 2}.`

                );

            }


            /* -------------------------
               Subject
            ------------------------- */

            const subject =
                String(
                    normalized.subject || ""
                ).trim();


            if (!subject) {

                throw new Error(

                    `Subject is empty at Excel row ${index + 2}.`

                );

            }


            /* -------------------------
               Options
            ------------------------- */

            const optionA =
                String(
                    normalized.option_a || ""
                ).trim();

            const optionB =
                String(
                    normalized.option_b || ""
                ).trim();

            const optionC =
                String(
                    normalized.option_c || ""
                ).trim();

            const optionD =
                String(
                    normalized.option_d || ""
                ).trim();


            if (
                !optionA ||
                !optionB ||
                !optionC ||
                !optionD
            ) {

                throw new Error(

                    `All four options are required at Excel row ${index + 2}.`

                );

            }


            /* -------------------------
               Correct Answer
            ------------------------- */

            const correctAnswer =
                String(
                    normalized.correct_answer || ""
                )
                .trim()
                .toUpperCase();


            if (
                ![
                    "A",
                    "B",
                    "C",
                    "D"
                ].includes(
                    correctAnswer
                )
            ) {

                throw new Error(

                    `Invalid correct answer at Excel row ${index + 2}. Use A, B, C or D.`

                );

            }


            /* -------------------------
               Marks
            ------------------------- */

            let marks =
                Number(
                    normalized.marks
                );


            if (
                !Number.isFinite(marks)
            ) {

                marks = 1;

            }


            /* -------------------------
               Negative Marks
            ------------------------- */

            let negativeMarks =
                Number(
                    normalized.negative_marks
                );


            if (
                !Number.isFinite(
                    negativeMarks
                )
            ) {

                negativeMarks = 0;

            }


            /* -------------------------
               Difficulty
            ------------------------- */

            const difficulty =
                String(
                    normalized.difficulty ||
                    "Easy"
                )
                .trim();


            const validDifficulty = [
                "Easy",
                "Medium",
                "Hard"
            ];


            const matchedDifficulty =
                validDifficulty.find(
                    value =>
                        value.toLowerCase() ===
                        difficulty.toLowerCase()
                );


            if (!matchedDifficulty) {

                throw new Error(

                    `Invalid difficulty at Excel row ${index + 2}. Use Easy, Medium or Hard.`

                );

            }


            /* -------------------------
               Question Type
            ------------------------- */

            const questionType =
                String(
                    normalized.question_type ||
                    "MCQ"
                )
                .trim();


            /* -------------------------
               Section
            ------------------------- */

            const sectionName =
                String(
                    normalized.section_name ||
                    ""
                ).trim();


            return {

                question_no:
                    questionNo,

                subject:
                    subject,

                question:
                    question,

                option_a:
                    optionA,

                option_b:
                    optionB,

                option_c:
                    optionC,

                option_d:
                    optionD,

                correct_answer:
                    correctAnswer,

                explanation:
                    String(
                        normalized.explanation ||
                        ""
                    ).trim(),

                marks:
                    marks,

                negative_marks:
                    negativeMarks,

                difficulty:
                    matchedDifficulty,

                question_type:
                    questionType,

                section_name:
                    sectionName

            };

        }
    );

}


/* =========================================================
   IMPORT EXCEL QUESTIONS
========================================================= */

if (importExcelBtn) {

    importExcelBtn.onclick =
        importExcelQuestions;

}


async function importExcelQuestions() {

    const examId =
        excelExamSelect
            ? excelExamSelect.value
            : "";


    if (!examId) {

        alert(
            "Please select an exam."
        );

        return;

    }


    if (
        !validatedExcelRows.length
    ) {

        alert(
            "Please validate the Excel file first."
        );

        return;

    }


    try {

        importExcelBtn.disabled =
            true;


        importExcelBtn.textContent =
            "⏳ Importing...";


        /* =================================================
           GET EXAM
        ================================================= */

        const {
            data: exam,
            error: examError
        } = await supabaseClient

            .from("exams")

            .select("*")

            .eq(
                "id",
                examId
            )

            .single();


        if (examError) {

            throw examError;

        }


        if (!exam) {

            throw new Error(
                "Selected exam was not found."
            );

        }


        /* =================================================
           GET SECTIONS
        ================================================= */

        const {
            data: sections,
            error: sectionError
        } = await supabaseClient

            .from("exam_sections")

            .select(`
                id,
                section_name,
                question_count,
                section_order
            `)

            .eq(
                "exam_id",
                examId
            )

            .order(
                "section_order",
                {
                    ascending: true
                }
            );


        if (sectionError) {

            throw sectionError;

        }


        const isSectional =
            Array.isArray(sections) &&
            sections.length > 0;


        /* =================================================
           EXPECTED QUESTION COUNT
        ================================================= */

        let expectedCount = 0;


        if (isSectional) {

            expectedCount =
                sections.reduce(
                    (
                        total,
                        section
                    ) => {

                        return (
                            total +
                            Number(
                                section.question_count ||
                                0
                            )
                        );

                    },
                    0
                );

        } else {

            expectedCount =
                Number(
                    exam.total_questions ||
                    0
                );

        }


        /* =================================================
           TOTAL QUESTION COUNT VALIDATION
        ================================================= */

        if (
            expectedCount > 0 &&
            validatedExcelRows.length !==
            expectedCount
        ) {

            throw new Error(

                `Question count mismatch. Exam expects ${expectedCount} questions, but Excel contains ${validatedExcelRows.length}.`

            );

        }


        /* =================================================
           SECTION VALIDATION
        ================================================= */

        if (isSectional) {

            validateSectionalRows(
                validatedExcelRows,
                sections
            );

        }


        /* =================================================
           PREPARE DATABASE RECORDS
        ================================================= */

        const records =
            validatedExcelRows.map(
                row => {

                    return {

                        exam_id:
                            examId,

                        question_no:
                            row.question_no,

                        subject:
                            row.subject,

                        question:
                            row.question,

                        option_a:
                            row.option_a,

                        option_b:
                            row.option_b,

                        option_c:
                            row.option_c,

                        option_d:
                            row.option_d,

                        correct_answer:
                            row.correct_answer,

                        explanation:
                            row.explanation,

                        marks:
                            row.marks,

                        negative_marks:
                            row.negative_marks,

                        difficulty:
                            row.difficulty,

                        question_type:
                            row.question_type

                    };

                }
            );


        /* =================================================
           IMPORTANT:
           SECTION NAME IS VALIDATED BUT NOT INSERTED
           because the current question-management code
           does not establish that questions.section_name
           exists in your database schema.

           We therefore avoid creating a new schema
           assumption that could cause another Supabase
           column error.
        ================================================= */


        /* =================================================
           INSERT INTO SUPABASE
        ================================================= */

        const {
            error: insertError
        } = await supabaseClient

            .from("questions")

            .insert(records);


        if (insertError) {

            throw insertError;

        }


        /* =================================================
           SUCCESS
        ================================================= */

        alert(

            `Successfully imported ${records.length} questions ✅`

        );


        resetExcelImportState();


        if (excelImportModal) {

            excelImportModal.style.display =
                "none";

        }


        await loadQuestions();


    } catch (error) {

        console.error(
            "Excel import error:",
            error
        );


        alert(

            error.message ||
            "Excel import failed."

        );


    } finally {

        if (importExcelBtn) {

            importExcelBtn.disabled =
                false;

            importExcelBtn.textContent =
                "💾 Import Questions";

        }

    }

}


/* =========================================================
   SECTIONAL VALIDATION
========================================================= */

function validateSectionalRows(
    rows,
    sections
) {

    const sectionMap =
        new Map();


    /* -------------------------
       Build configured sections
    ------------------------- */

    sections.forEach(
        section => {

            const name =
                String(
                    section.section_name ||
                    ""
                )
                .trim();


            if (!name) {

                throw new Error(
                    "An exam section has an empty section name."
                );

            }


            const key =
                name.toLowerCase();


            const count =
                Number(
                    section.question_count ||
                    0
                );


            sectionMap.set(
                key,
                {
                    name:
                        name,

                    count:
                        count
                }
            );

        }
    );


    /* -------------------------
       Count Excel rows
    ------------------------- */

    const sectionCounts =
        new Map();


    rows.forEach(
        (row, index) => {

            if (
                !row.section_name
            ) {

                throw new Error(

                    `Section name is required for sectional exam at Excel row ${index + 2}.`

                );

            }


            const key =
                row.section_name
                    .trim()
                    .toLowerCase();


            if (
                !sectionMap.has(key)
            ) {

                throw new Error(

                    `Unknown section "${row.section_name}" at Excel row ${index + 2}.`

                );

            }


            sectionCounts.set(

                key,

                (
                    sectionCounts.get(
                        key
                    ) || 0
                ) + 1

            );

        }
    );


    /* -------------------------
       Compare counts
    ------------------------- */

    for (
        const [
            sectionKey,
            sectionInfo
        ]
        of sectionMap
    ) {

        const actualCount =
            sectionCounts.get(
                sectionKey
            ) || 0;


        if (
            actualCount !==
            sectionInfo.count
        ) {

            throw new Error(

                `Section "${sectionInfo.name}" expects ${sectionInfo.count} questions, but Excel contains ${actualCount}.`

            );

        }

    }

}


/* =========================================================
   HELPER: GET VALUE
========================================================= */

function getValue(id) {

    const element =
        document.getElementById(id);


    if (!element) {

        console.warn(
            `ExamVerse: #${id} not found.`
        );

        return "";

    }


    return String(
        element.value ?? ""
    ).trim();

}


/* =========================================================
   HELPER: SET VALUE
========================================================= */

function setValue(
    id,
    value
) {

    const element =
        document.getElementById(id);


    if (!element) {

        console.warn(
            `ExamVerse: #${id} not found.`
        );

        return;

    }


    element.value =
        value ?? "";

}


/* =========================================================
   HELPER: ESCAPE HTML
========================================================= */

function escapeHTML(value) {

    return String(
        value ?? ""
    )

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}


/* =========================================================
   INITIAL LOAD
========================================================= */

async function initializeQuestionManagement() {

    try {

        await loadExams();

        await loadQuestions();

        console.log(
            "ExamVerse Question Management initialized successfully ✅"
        );

    } catch (error) {

        console.error(
            "Question Management initialization error:",
            error
        );

    }

}


/* =========================================================
   START
========================================================= */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initializeQuestionManagement
    );

} else {

    initializeQuestionManagement();

}