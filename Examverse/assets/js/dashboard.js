/* ==========================================
   ExamVerse Dashboard
   Supabase Connected
   Created by Subhajit Paul
========================================== */


// ==========================================
// CHECK SUPABASE LOGIN
// ==========================================

async function loadDashboard() {

    try {

        const {
            data: {
                user: authUser
            },
            error: authError
        } =
        await supabaseClient.auth.getUser();


        // ==========================================
        // USER NOT LOGGED IN
        // ==========================================

        if (
            authError ||
            !authUser
        ) {

            window.location.replace(
                "login.html"
            );

            return;

        }


        console.log(
            "Dashboard Auth User:",
            authUser
        );


        // ==========================================
        // LOAD PROFILE
        // ==========================================

        const {
            data: profile,
            error: profileError
        } =
        await supabaseClient

            .from("profiles")

            .select(`
                id,
                first_name,
                middle_name,
                last_name,
                age,
                gender,
                phone,
                email,
                exam1,
                exam2,
                exam3
            `)

            .eq(
                "id",
                authUser.id
            )

            .maybeSingle();


        if (profileError) {

            console.error(
                "Profile loading error:",
                profileError
            );

        }


        if (!profile) {

            console.error(
                "No profile found for user."
            );

            alert(
                "Your profile could not be loaded."
            );

            return;

        }


        // ==========================================
        // BUILD USER NAME
        // ==========================================

        const fullName = [

            profile.first_name,

            profile.middle_name,

            profile.last_name

        ]

            .filter(Boolean)

            .join(" ")

            .replace(/\s+/g, " ")

            .trim();


        // ==========================================
        // DISPLAY USER NAME
        // ==========================================

        document.getElementById(
            "userName"
        ).textContent =
            fullName || "Student";


        // ==========================================
        // PREFERRED EXAMS
        // ==========================================

        document.getElementById(
            "exam1"
        ).textContent =
            profile.exam1 || "Not Selected";


        document.getElementById(
            "exam2"
        ).textContent =
            profile.exam2 || "Not Selected";


        document.getElementById(
            "exam3"
        ).textContent =
            profile.exam3 || "Not Selected";


        // ==========================================
        // LOAD COMPLETED ATTEMPTS
        // ==========================================

        const {
            data: attempts,
            error: attemptsError
        } =
        await supabaseClient

            .from("exam_attempts")

            .select(`
                id,
                exam_id,
                score,
                percentage,
                attempted,
                correct,
                wrong,
                skipped,
                total_questions,
                status,
                submitted_at,
                time_taken
            `)

            .eq(
                "user_id",
                authUser.id
            )

            .eq(
                "status",
                "Completed"
            )

            .order(
                "submitted_at",
                {
                    ascending: false
                }
            );


        if (attemptsError) {

            console.error(
                "Attempts loading error:",
                attemptsError
            );

        }


        const completedAttempts =
            attempts || [];


        // ==========================================
        // NO COMPLETED TESTS
        // ==========================================

        if (
            completedAttempts.length === 0
        ) {

            document.getElementById(
                "tests"
            ).textContent = "0";


            document.getElementById(
                "highest"
            ).textContent = "0%";


            document.getElementById(
                "average"
            ).textContent = "0%";


            document.getElementById(
                "accuracy"
            ).textContent = "0%";


            document.getElementById(
                "level"
            ).textContent = "Beginner";


            document.getElementById(
                "rank"
            ).textContent = "N/A";


            document.getElementById(
                "history"
            ).innerHTML = `

                <tr>

                    <td colspan="4">

                        No tests attempted yet.

                    </td>

                </tr>

            `;

        }

        else {


            // ==========================================
            // TOTAL TESTS
            // ==========================================

            const totalTests =
                completedAttempts.length;


            document.getElementById(
                "tests"
            ).textContent =
                totalTests;


            // ==========================================
            // HIGHEST PERCENTAGE
            // ==========================================

            const highestPercentage =
                Math.max(

                    ...completedAttempts.map(
                        attempt =>
                            Number(
                                attempt.percentage
                            ) || 0
                    )

                );


            document.getElementById(
                "highest"
            ).textContent =
                highestPercentage
                    .toFixed(2)
                    .replace(/\.00$/, "") +
                "%";


            // ==========================================
            // AVERAGE PERCENTAGE
            // ==========================================

            const totalPercentage =
                completedAttempts.reduce(

                    (
                        sum,
                        attempt
                    ) => {

                        return sum +
                            (
                                Number(
                                    attempt.percentage
                                ) || 0
                            );

                    },

                    0

                );


            const averagePercentage =
                totalPercentage /
                totalTests;


            document.getElementById(
                "average"
            ).textContent =
                averagePercentage
                    .toFixed(2)
                    .replace(/\.00$/, "") +
                "%";


            // ==========================================
            // OVERALL ACCURACY
            //
            // Correct answers /
            // attempted questions
            // ==========================================

            const totalCorrect =
                completedAttempts.reduce(

                    (
                        sum,
                        attempt
                    ) => {

                        return sum +
                            (
                                Number(
                                    attempt.correct
                                ) || 0
                            );

                    },

                    0

                );


            const totalAttempted =
                completedAttempts.reduce(

                    (
                        sum,
                        attempt
                    ) => {

                        return sum +
                            (
                                Number(
                                    attempt.attempted
                                ) || 0
                            );

                    },

                    0

                );


            let overallAccuracy = 0;


            if (
                totalAttempted > 0
            ) {

                overallAccuracy =
                    (
                        totalCorrect /
                        totalAttempted
                    ) * 100;

            }


            document.getElementById(
                "accuracy"
            ).textContent =
                overallAccuracy
                    .toFixed(2)
                    .replace(/\.00$/, "") +
                "%";


            // ==========================================
            // USER LEVEL
            // ==========================================

            let level =
                "Beginner";


            if (
                totalTests >= 20 &&
                averagePercentage >= 80
            ) {

                level = "Expert";

            }

            else if (
                totalTests >= 10 &&
                averagePercentage >= 65
            ) {

                level = "Advanced";

            }

            else if (
                totalTests >= 5 &&
                averagePercentage >= 50
            ) {

                level = "Intermediate";

            }


            document.getElementById(
                "level"
            ).textContent =
                level;


            // ==========================================
            // CURRENT OVERALL RANK
            //
            // Rank based on user's BEST
            // completed percentage across users
            // ==========================================

            await loadDashboardRank(
                authUser.id
            );


            // ==========================================
            // RECENT TESTS
            // ==========================================

            await loadRecentTests(
                completedAttempts
            );

        }


        console.log(
            "✅ Dashboard loaded successfully."
        );

    }

    catch (error) {

        console.error(
            "Dashboard loading error:",
            error
        );

        alert(
            "Unable to load dashboard data."
        );

    }

}


// ==========================================
// DASHBOARD RANK
// ==========================================

async function loadDashboardRank(
    currentUserId
) {

    try {

        const {
            data: rank,
            error
        } =
        await supabaseClient
            .rpc(
                "get_dashboard_rank",
                {
                    p_user_id:
                        currentUserId
                }
            );


        if (error) {

            console.error(
                "Dashboard rank error:",
                error
            );

            document.getElementById(
                "rank"
            ).textContent = "N/A";

            return;

        }


        if (
            rank === null ||
            rank === undefined
        ) {

            document.getElementById(
                "rank"
            ).textContent = "N/A";

            return;

        }


        document.getElementById(
            "rank"
        ).textContent =
            "#" + rank;


        console.log(
            "Dashboard Global Rank:",
            rank
        );

    }

    catch (error) {

        console.error(
            "Dashboard rank exception:",
            error
        );

        document.getElementById(
            "rank"
        ).textContent = "N/A";

    }

}


// ==========================================
// RECENT TESTS
// ==========================================

async function loadRecentTests(
    attempts
) {

    const history =
        document.getElementById(
            "history"
        );


    if (
        !attempts ||
        attempts.length === 0
    ) {

        history.innerHTML = `

            <tr>

                <td colspan="4">

                    No tests attempted yet.

                </td>

            </tr>

        `;

        return;

    }


    // ==========================================
    // GET EXAM IDS
    // ==========================================

    const examIds = [

        ...new Set(

            attempts

                .map(
                    attempt =>
                        attempt.exam_id
                )

                .filter(Boolean)

        )

    ];


    let examMap =
        new Map();


    if (
        examIds.length > 0
    ) {

        const {
            data: exams,
            error
        } =
        await supabaseClient

            .from("exams")

            .select(
                "id, exam_name"
            )

            .in(
                "id",
                examIds
            );


        if (error) {

            console.error(
                "Exam name loading error:",
                error
            );

        }

        else {

            (
                exams || []
            ).forEach(
                exam => {

                    examMap.set(
                        exam.id,
                        exam.exam_name
                    );

                }
            );

        }

    }


    // ==========================================
    // SHOW RECENT TESTS
    // ==========================================

    history.innerHTML = "";


    attempts

        .slice(
            0,
            3
        )

        .forEach(
            attempt => {

                const examName =
                    examMap.get(
                        attempt.exam_id
                    ) ||
                    "Unknown Exam";


                const percentage =
                    Number(
                        attempt.percentage
                    ) || 0;


                const accuracy =
                    (
                        Number(
                            attempt.attempted
                        ) > 0
                    )

                    ?

                    (
                        (
                            Number(
                                attempt.correct
                            ) || 0
                        ) /

                        Number(
                            attempt.attempted
                        )
                    ) * 100

                    :

                    0;


                const date =
                    attempt.submitted_at

                    ?

                    new Date(
                        attempt.submitted_at
                    ).toLocaleDateString(
                        "en-IN",
                        {
                            day:
                                "2-digit",

                            month:
                                "short",

                            year:
                                "numeric"
                        }
                    )

                    :

                    "N/A";


                history.innerHTML += `

                    <tr>

                        <td>
                            ${date}
                        </td>

                        <td>
                            ${escapeHTML(
                                examName
                            )}
                        </td>

                        <td>
                            ${percentage
                                .toFixed(2)
                                .replace(
                                    /\.00$/,
                                    ""
                                )
                            }%
                        </td>

                        <td>
                            ${accuracy
                                .toFixed(2)
                                .replace(
                                    /\.00$/,
                                    ""
                                )
                            }%
                        </td>

                    </tr>

                `;

            }
        );

}


// ==========================================
// SAFE HTML TEXT
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
// LOGOUT
// ==========================================

document.getElementById(
    "logoutBtn"
)

.addEventListener(
    "click",
    async () => {

        if (
            !confirm(
                "Logout from ExamVerse?"
            )
        ) {

            return;

        }


        try {

            // ==================================
            // SUPABASE LOGOUT
            // ==================================

            const {
                error
            } =
            await supabaseClient
                .auth
                .signOut();


            if (error) {

                console.error(
                    "Supabase Logout Error:",
                    error
                );

            }


            // ==================================
            // CLEAR LOCAL USER
            // ==================================

            if (
                typeof Storage !==
                "undefined" &&
                typeof Storage.logout ===
                "function"
            ) {

                Storage.logout();

            }


            // ==================================
            // CLEAR EXAM SESSION
            // ==================================

            sessionStorage.removeItem(
                "selectedExam"
            );

            sessionStorage.removeItem(
                "attemptId"
            );

            sessionStorage.removeItem(
                "attemptStartedFresh"
            );

            sessionStorage.removeItem(
                "examStartTime"
            );

            sessionStorage.removeItem(
                "examActiveStartedAt"
            );

            sessionStorage.removeItem(
                "currentQuestionIndex"
            );

            sessionStorage.removeItem(
                "currentSectionIndex"
            );


            // ==================================
            // LOGIN
            // ==================================

            window.location.replace(
                "login.html"
            );

        }

        catch (error) {

            console.error(
                "Logout Error:",
                error
            );

            window.location.replace(
                "login.html"
            );

        }

    }
);


// ==========================================
// TAKE NEW TEST
// ==========================================

document.getElementById(
    "takeTest"
)

.addEventListener(
    "click",
    () => {

        window.location.href =
    "exam-list.html";

    }
);


// ==========================================
// NEW TEST SIDEBAR
// ==========================================

document.getElementById(
    "newTestBtn"
)

.addEventListener(
    "click",
    () => {

        window.location.href =
            "exam-list.html";

    }
);


// ==========================================
// START DASHBOARD
// ==========================================

loadDashboard();