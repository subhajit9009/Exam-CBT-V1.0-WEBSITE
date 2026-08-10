/* ==========================================
   ExamVerse Instructions
   Created by Subhajit Paul
   Updated CBT Review/Scoring Behavior
========================================== */


const examDetails =
    document.getElementById("examDetails");


const agree =
    document.getElementById("agree");


const startExamBtn =
    document.getElementById("startExamBtn");


let selectedExam = null;


// ==========================================
// Load Exam Details
// ==========================================

async function loadExam() {

    const examId =
        sessionStorage.getItem(
            "selectedExam"
        );


    if (!examId) {

        alert(
            "No Exam Selected."
        );


        window.location.replace(
            "exam-list.html"
        );


        return;

    }


    try {

        const {
            data,
            error
        } =
            await supabaseClient

                .from("exams")

                .select("*")

                .eq(
                    "id",
                    examId
                )

                .single();


        if (error) {

            console.error(
                "Exam Load Error:",
                error
            );


            alert(
                "Exam not found."
            );


            window.location.replace(
                "exam-list.html"
            );


            return;

        }


        selectedExam =
            data;


        // ==========================================
        // Display Exam Information
        // ==========================================

        examDetails.innerHTML = `

            <div class="exam-info">

                <h2>
                    ${escapeHTML(
                        data.exam_name ||
                        "Examination"
                    )}
                </h2>


                <p>
                    Review the examination details
                    before starting.
                </p>


                <div class="exam-info-grid">


                    <!-- Category -->

                    <div class="info-box">

                        <span>
                            Category
                        </span>

                        <strong>
                            ${escapeHTML(
                                data.category ||
                                "—"
                            )}
                        </strong>

                    </div>


                    <!-- Total Questions -->

                    <div class="info-box">

                        <span>
                            Total Questions
                        </span>

                        <strong>
                            ${data.total_questions ?? 0}
                        </strong>

                    </div>


                    <!-- Duration -->

                    <div class="info-box">

                        <span>
                            Duration
                        </span>

                        <strong>
                            ${data.duration ?? 0}
                            Minutes
                        </strong>

                    </div>


                    <!-- Total Marks -->

                    <div class="info-box">

                        <span>
                            Total Marks
                        </span>

                        <strong>
                            ${data.total_marks ?? 0}
                        </strong>

                    </div>


                    <!-- Positive Marks -->

                    <div class="info-box">

                        <span>
                            Positive Marks
                        </span>

                        <strong>
                            +${data.positive_marks ?? 0}
                        </strong>

                    </div>


                    <!-- Negative Marks -->

                    <div class="info-box">

                        <span>
                            Negative Marks
                        </span>

                        <strong>
                            ${formatNegativeMarks(
                                data.negative_marks
                            )}
                        </strong>

                    </div>


                    <!-- Passing Marks -->

                    <div class="info-box">

                        <span>
                            Passing Marks
                        </span>

                        <strong>
                            ${data.passing_marks ?? 0}
                        </strong>

                    </div>


                    <!-- Exam Name -->

                    <div class="info-box">

                        <span>
                            Exam Name
                        </span>

                        <strong>
                            ${escapeHTML(
                                data.exam_name ||
                                "—"
                            )}
                        </strong>

                    </div>


                </div>

            </div>

        `;

    }


    catch (error) {

        console.error(
            "Instruction Page Error:",
            error
        );


        alert(
            "Unable to load examination details."
        );

    }

}


// ==========================================
// Escape HTML
// ==========================================

function escapeHTML(
    value
) {

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


// ==========================================
// Format Negative Marks
// ==========================================

function formatNegativeMarks(
    value
) {

    const number =
        Number(
            value ?? 0
        );


    if (!number) {

        return "0";

    }


    /*
       Your Supabase negative_marks
       should now normally be stored
       as a positive number.

       Example:

       0.25

       This function displays:

       -0.25
    */

    return number > 0

        ? `-${number}`

        : String(number);

}


// ==========================================
// Enable Start Button
// ==========================================

agree.addEventListener(
    "change",
    () => {

        startExamBtn.disabled =
            !agree.checked;

    }
);


// ==========================================
// Start Exam
// ==========================================

startExamBtn.addEventListener(
    "click",
    startExam
);


// ==========================================
// Create Exam Attempt
// ==========================================

async function startExam() {

    if (!selectedExam) {

        alert(
            "Examination details are still loading."
        );

        return;

    }


    // Prevent double-click

    startExamBtn.disabled =
        true;


    try {


        // ==========================================
        // Get Logged-in User
        // ==========================================

        const {
            data,
            error: authError
        } =
            await supabaseClient
                .auth
                .getUser();


        if (
            authError ||
            !data.user
        ) {

            alert(
                "Please login again."
            );


            window.location.replace(
                "login.html"
            );


            return;

        }


        const user =
            data.user;


        // ==========================================
        // Create Exam Attempt
        // ==========================================

        const {
            data: attempt,
            error
        } =
            await supabaseClient

                .from(
                    "exam_attempts"
                )

                .insert({

                    user_id:
                        user.id,

                    exam_id:
                        selectedExam.id,

                    total_questions:
                        selectedExam.total_questions

                })

                .select()

                .single();


        if (error) {

            console.error(
                "Attempt Creation Error:",
                error
            );


            alert(
                error.message
            );


            startExamBtn.disabled =
                false;


            return;

        }


        // ==========================================
        // Clear Previous Exam Session
        // ==========================================

        sessionStorage.removeItem(
            "examSubmitted"
        );


        sessionStorage.removeItem(
            "examResult"
        );


        sessionStorage.removeItem(
            "attemptId"
        );


        sessionStorage.removeItem(
            "examStartTime"
        );


        // ==========================================
        // Save New Attempt ID
        // ==========================================

        sessionStorage.setItem(
            "attemptId",
            attempt.id
        );


        // ==========================================
        // Save Exam Start Time
        // ==========================================

        sessionStorage.setItem(
            "examStartTime",
            new Date().toISOString()
        );


        // ==========================================
        // Save Selected Exam
        // ==========================================

        localStorage.setItem(
            "selectedExam",
            JSON.stringify(
                selectedExam
            )
        );


        // ==========================================
        // Open Examination
        // ==========================================

        /*
           replace() is used instead of href
           so the instruction page is not
           unnecessarily kept in the history
           for this exam start.
        */

        window.location.replace(
            "exam.html"
        );

    }


    catch (error) {

        console.error(
            "Start Exam Error:",
            error
        );


        alert(
            "Unable to start the examination."
        );


        startExamBtn.disabled =
            false;

    }

}


// ==========================================
// Initial Load
// ==========================================

loadExam();