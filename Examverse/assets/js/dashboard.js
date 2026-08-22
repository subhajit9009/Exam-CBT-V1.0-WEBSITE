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

            // =====================================================
// PREFERRED EXAM QUICK ACTIONS
// =====================================================

const preferredExamButtons =
    document.querySelectorAll(
        ".preferredExamBtn"
    );


preferredExamButtons.forEach(
    button => {

        button.addEventListener(
            "click",
            () => {

                const slot =
                    button.dataset.examSlot;


                let selectedExamName = "";


                // ======================================
                // GET THE CLICKED PREFERENCE
                // ======================================

                if (slot === "1") {

                    selectedExamName =
                        profile.exam1;

                }

                else if (slot === "2") {

                    selectedExamName =
                        profile.exam2;

                }

                else if (slot === "3") {

                    selectedExamName =
                        profile.exam3;

                }


                // ======================================
                // CHECK WHETHER IT IS SELECTED
                // ======================================

                if (
                    !selectedExamName ||
                    selectedExamName ===
                    "Not Selected"
                ) {

                    alert(
                        "This preferred exam is not available."
                    );

                    return;

                }


                // ======================================
                // SAVE ONLY THE CLICKED PREFERENCE
                // ======================================

                sessionStorage.setItem(
                    "selectedPreferredExam",
                    selectedExamName
                );


                // ======================================
                // OPEN EXAM LIST
                // ======================================

                window.location.href =
                    "exam-list.html";

            }
        );

    }
);

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
// XP + USER LEVEL + MILESTONES
// ==========================================

const achievementData =
    calculateAchievements(
        completedAttempts
    );


const userXP =
    achievementData.totalXP;


const userLevel =
    getUserLevel(
        userXP,
        completedAttempts.length
    );


document.getElementById(
    "level"
).textContent =
    userLevel.name;


// ==========================================
// XP DISPLAY
// ==========================================

const xpTotalElement =
    document.getElementById(
        "xpTotal"
    );

if (xpTotalElement) {

    xpTotalElement.textContent =
        userXP + " XP";

}


const xpLevelElement =
    document.getElementById(
        "xpLevel"
    );

if (xpLevelElement) {

    xpLevelElement.textContent =
        userLevel.name;

}


const xpCurrentText =
    document.getElementById(
        "xpCurrentText"
    );

if (xpCurrentText) {

    xpCurrentText.textContent =
        userXP + " XP";

}


const xpNextText =
    document.getElementById(
        "xpNextText"
    );

// ==========================================
// NEXT LEVEL REQUIREMENT DISPLAY
// ==========================================

if (xpNextText) {

    // ======================================
    // MAXIMUM LEVEL
    // ======================================

    if (
        userLevel.nextXP === null ||
        userLevel.nextTests === null
    ) {

        xpNextText.textContent =
            "👑 Maximum Level";

    }

    else {

        const remainingXP =
            Math.max(
                0,
                userLevel.nextXP -
                userXP
            );


        const remainingTests =
            Math.max(
                0,
                userLevel.nextTests -
                completedAttempts.length
            );


        // ==================================
        // BOTH REQUIREMENTS REMAIN
        // ==================================

        if (
            remainingXP > 0 &&
            remainingTests > 0
        ) {

            xpNextText.textContent =
                remainingXP +
                " XP • " +
                remainingTests +
                " tests to " +
                userLevel.nextLevelName;

        }


        // ==================================
        // ONLY XP REMAINS
        // ==================================

        else if (
            remainingXP > 0 &&
            remainingTests === 0
        ) {

            xpNextText.textContent =
                remainingXP +
                " XP to " +
                userLevel.nextLevelName;

        }


        // ==================================
        // ONLY TESTS REMAIN
        // ==================================

        else if (
            remainingXP === 0 &&
            remainingTests > 0
        ) {

            xpNextText.textContent =
                remainingTests +
                " tests to " +
                userLevel.nextLevelName;

        }


        // ==================================
        // EVERYTHING COMPLETE
        // ==================================

        else {

            xpNextText.textContent =
                "Ready for " +
                userLevel.nextLevelName;

        }

    }

}

// ==========================================
// XP PROGRESS BAR
// ==========================================

const xpProgressFill =
    document.getElementById(
        "xpProgressFill"
    );

// ==========================================
// COMBINED LEVEL PROGRESS
// XP + COMPLETED TESTS
// ==========================================

if (xpProgressFill) {

    let progress = 100;


    // ======================================
    // LEGEND = MAXIMUM LEVEL
    // ======================================

    if (
        userLevel.nextXP === null ||
        userLevel.nextTests === null
    ) {

        progress = 100;

    }

    else {

        // ==================================
        // XP PROGRESS
        // ==================================

        const xpRange =
            userLevel.nextXP -
            userLevel.currentXP;


        const xpEarned =
            userXP -
            userLevel.currentXP;


        let xpProgress = 100;


        if (xpRange > 0) {

            xpProgress =
                (
                    xpEarned /
                    xpRange
                ) * 100;

        }


        xpProgress =
            Math.max(
                0,
                Math.min(
                    100,
                    xpProgress
                )
            );


        // ==================================
        // TEST PROGRESS
        // ==================================

        const testRange =
            userLevel.nextTests -
            userLevel.currentTests;


        const testsEarned =
            completedAttempts.length -
            userLevel.currentTests;


        let testProgress = 100;


        if (testRange > 0) {

            testProgress =
                (
                    testsEarned /
                    testRange
                ) * 100;

        }


        testProgress =
            Math.max(
                0,
                Math.min(
                    100,
                    testProgress
                )
            );


        // ==================================
        // COMBINE
        //
        // XP      = 70%
        // TESTS   = 30%
        // ==================================

        progress =
            (
                xpProgress * 0.70
            ) +
            (
                testProgress * 0.30
            );


        progress =
            Math.max(
                0,
                Math.min(
                    100,
                    progress
                )
            );

    }


    xpProgressFill.style.width =
        progress + "%";

}


// ==========================================
// MILESTONE DISPLAY
// ==========================================

renderMilestones(
    achievementData.milestones
);


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
                "id, exam_name, total_marks"
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
                        {
                            name:
                                exam.exam_name,

                            totalMarks:
                                Number(
                                    exam.total_marks
                                ) || 0
                        }
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

                                // ==========================================
                // EXAM INFORMATION
                // ==========================================

                const examInfo =
                    examMap.get(
                        attempt.exam_id
                    ) || {

                        name:
                            "Unknown Exam",

                        totalMarks:
                            0
                    };


                const examName =
                    examInfo.name;


                // ==========================================
                // ACTUAL SCORE
                // ==========================================

                const actualScore =
                    Number(
                        attempt.score
                    ) || 0;


                const totalMarks =
                    Number(
                        examInfo.totalMarks
                    ) || 0;


                // ==========================================
                // OVERALL ACCURACY
                //
                // Correct answers /
                // Total attempted questions
                // ==========================================

                const attemptedQuestions =
                    Number(
                        attempt.attempted
                    ) || 0;


                const correctAnswers =
                    Number(
                        attempt.correct
                    ) || 0;


                const accuracy =
                    attemptedQuestions > 0

                    ?

                    (
                        correctAnswers /
                        attemptedQuestions
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
                            ${actualScore
                                .toFixed(2)
                                .replace(
                                    /\.00$/,
                                    ""
                                )
                            }
                            /
                            ${totalMarks}
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
// ACHIEVEMENT DEFINITIONS
// ==========================================

const ACHIEVEMENTS = [

    // ======================================
    // COMPLETED EXAMS
    // ======================================

    {
        id: "tests_1",
        icon: "📝",
        title: "First Step",
        description: "Complete your first exam.",
        type: "tests",
        target: 1,
        xp: 50
    },

    {
        id: "tests_5",
        icon: "📚",
        title: "Getting Started",
        description: "Complete 5 exams.",
        type: "tests",
        target: 5,
        xp: 100
    },

    {
        id: "tests_10",
        icon: "🔥",
        title: "Test Runner",
        description: "Complete 10 exams.",
        type: "tests",
        target: 10,
        xp: 250
    },

    {
        id: "tests_25",
        icon: "🚀",
        title: "Dedicated Learner",
        description: "Complete 25 exams.",
        type: "tests",
        target: 25,
        xp: 500
    },

    {
        id: "tests_50",
        icon: "🏅",
        title: "Test Warrior",
        description: "Complete 50 exams.",
        type: "tests",
        target: 50,
        xp: 1000
    },

    {
        id: "tests_100",
        icon: "🏆",
        title: "Century",
        description: "Complete 100 exams.",
        type: "tests",
        target: 100,
        xp: 2000
    },

    {
        id: "tests_250",
        icon: "💎",
        title: "Elite Grinder",
        description: "Complete 250 exams.",
        type: "tests",
        target: 250,
        xp: 4000
    },

    {
        id: "tests_500",
        icon: "👑",
        title: "Exam Master",
        description: "Complete 500 exams.",
        type: "tests",
        target: 500,
        xp: 6000
    },

    {
        id: "tests_1000",
        icon: "🌟",
        title: "1000 Club",
        description: "Complete 1,000 exams.",
        type: "tests",
        target: 1000,
        xp: 10000
    },

    {
        id: "tests_2500",
        icon: "🔥",
        title: "Legendary Grinder",
        description: "Complete 2,500 exams.",
        type: "tests",
        target: 2500,
        xp: 15000
    },

    {
        id: "tests_5000",
        icon: "💫",
        title: "Ultimate Grinder",
        description: "Complete 5,000 exams.",
        type: "tests",
        target: 5000,
        xp: 25000
    },

    {
        id: "tests_10000",
        icon: "👑",
        title: "ExamVerse Legend",
        description: "Complete 10,000 exams.",
        type: "tests",
        target: 10000,
        xp: 50000
    },


    // ======================================
    // PASSES
    // ======================================

    {
        id: "passes_1",
        icon: "🎯",
        title: "First Pass",
        description: "Pass your first exam.",
        type: "passes",
        target: 1,
        xp: 100
    },

    {
        id: "passes_5",
        icon: "⭐",
        title: "Pass Collector",
        description: "Pass 5 exams.",
        type: "passes",
        target: 5,
        xp: 250
    },

    {
        id: "passes_10",
        icon: "🔥",
        title: "Pass Champion",
        description: "Pass 10 exams.",
        type: "passes",
        target: 10,
        xp: 500
    },

    {
        id: "passes_25",
        icon: "🏆",
        title: "Reliable Performer",
        description: "Pass 25 exams.",
        type: "passes",
        target: 25,
        xp: 1000
    },

    {
        id: "passes_50",
        icon: "💎",
        title: "Pass Master",
        description: "Pass 50 exams.",
        type: "passes",
        target: 50,
        xp: 2500
    },

    {
        id: "passes_100",
        icon: "👑",
        title: "100 Pass Club",
        description: "Pass 100 exams.",
        type: "passes",
        target: 100,
        xp: 5000
    },

    {
        id: "passes_500",
        icon: "🌟",
        title: "Grand Champion",
        description: "Pass 500 exams.",
        type: "passes",
        target: 500,
        xp: 15000
    },

    {
        id: "passes_1000",
        icon: "👑",
        title: "Legendary Passer",
        description: "Pass 1,000 exams.",
        type: "passes",
        target: 1000,
        xp: 30000
    },


    // ======================================
    // PERFORMANCE
    // ======================================

    {
        id: "score_50",
        icon: "🎯",
        title: "First Step",
        description: "Score 50% or higher.",
        type: "score",
        target: 50,
        xp: 50
    },

    {
        id: "score_60",
        icon: "⭐",
        title: "Good Performer",
        description: "Score 60% or higher.",
        type: "score",
        target: 60,
        xp: 100
    },

    {
        id: "score_70",
        icon: "🔥",
        title: "Strong Performer",
        description: "Score 70% or higher.",
        type: "score",
        target: 70,
        xp: 150
    },

    {
        id: "score_80",
        icon: "💎",
        title: "Excellent",
        description: "Score 80% or higher.",
        type: "score",
        target: 80,
        xp: 250
    },

    {
        id: "score_90",
        icon: "🏆",
        title: "Elite",
        description: "Score 90% or higher.",
        type: "score",
        target: 90,
        xp: 500
    },

    {
        id: "score_95",
        icon: "👑",
        title: "Master",
        description: "Score 95% or higher.",
        type: "score",
        target: 95,
        xp: 1000
    },

    {
        id: "score_100",
        icon: "💯",
        title: "Perfect Score",
        description: "Achieve 100%.",
        type: "score",
        target: 100,
        xp: 2000
    },


    // ======================================
    // IMPROVEMENT
    // ======================================

    {
        id: "comeback_1",
        icon: "🔥",
        title: "Comeback",
        description: "Improve your score by 10+ points.",
        type: "comeback",
        target: 1,
        xp: 100
    },

    {
        id: "comeback_5",
        icon: "🚀",
        title: "Comeback Champion",
        description: "Achieve 5 major improvements.",
        type: "comeback",
        target: 5,
        xp: 500
    },

    {
        id: "comeback_10",
        icon: "👑",
        title: "Comeback King",
        description: "Achieve 10 major improvements.",
        type: "comeback",
        target: 10,
        xp: 1500
    },

    {
        id: "perfect_1",
        icon: "💯",
        title: "Perfect Beginning",
        description: "Achieve 100% once.",
        type: "perfect",
        target: 1,
        xp: 200
    },

    {
        id: "perfect_5",
        icon: "💯",
        title: "Perfect Performer",
        description: "Achieve 100% five times.",
        type: "perfect",
        target: 5,
        xp: 750
    },

    {
        id: "perfect_10",
        icon: "💎",
        title: "Perfect Master",
        description: "Achieve 100% ten times.",
        type: "perfect",
        target: 10,
        xp: 2000
    },


    // ======================================
    // HIGH SCORE COUNT
    // ======================================

    {
        id: "elite_5",
        icon: "⭐",
        title: "Elite Five",
        description: "Score 90%+ in 5 exams.",
        type: "elite",
        target: 5,
        xp: 500
    },

    {
        id: "elite_10",
        icon: "🏆",
        title: "Elite Ten",
        description: "Score 90%+ in 10 exams.",
        type: "elite",
        target: 10,
        xp: 1500
    },

    {
        id: "elite_25",
        icon: "👑",
        title: "Elite Performer",
        description: "Score 90%+ in 25 exams.",
        type: "elite",
        target: 25,
        xp: 4000
    },


    // ======================================
    // EXCELLENT SCORE COUNT
    // ======================================

    {
        id: "excellent_10",
        icon: "💎",
        title: "Excellent Ten",
        description: "Score 80%+ in 10 exams.",
        type: "excellent",
        target: 10,
        xp: 750
    },

    {
        id: "excellent_25",
        icon: "🔥",
        title: "Excellent Performer",
        description: "Score 80%+ in 25 exams.",
        type: "excellent",
        target: 25,
        xp: 2000
    },

    {
        id: "excellent_50",
        icon: "👑",
        title: "Excellence Master",
        description: "Score 80%+ in 50 exams.",
        type: "excellent",
        target: 50,
        xp: 5000
    },


    // ======================================
    // ACCURACY
    // ======================================

    {
        id: "accuracy_90",
        icon: "🎯",
        title: "Sharp Shooter",
        description: "Achieve 90% accuracy.",
        type: "accuracy",
        target: 90,
        xp: 500
    },

    {
        id: "accuracy_95",
        icon: "🎯",
        title: "Precision Expert",
        description: "Achieve 95% accuracy.",
        type: "accuracy",
        target: 95,
        xp: 1000
    },


    // ======================================
    // ATTEMPTED QUESTIONS
    // ======================================

    {
        id: "questions_100",
        icon: "📝",
        title: "Question Explorer",
        description: "Attempt 100 questions.",
        type: "questions",
        target: 100,
        xp: 100
    },

    {
        id: "questions_500",
        icon: "📚",
        title: "Question Hunter",
        description: "Attempt 500 questions.",
        type: "questions",
        target: 500,
        xp: 500
    },

    {
        id: "questions_1000",
        icon: "🔥",
        title: "Question Warrior",
        description: "Attempt 1,000 questions.",
        type: "questions",
        target: 1000,
        xp: 1500
    },

    {
        id: "questions_5000",
        icon: "💎",
        title: "Question Master",
        description: "Attempt 5,000 questions.",
        type: "questions",
        target: 5000,
        xp: 5000
    },

    {
        id: "questions_10000",
        icon: "👑",
        title: "Question Legend",
        description: "Attempt 10,000 questions.",
        type: "questions",
        target: 10000,
        xp: 15000
    },


    // ======================================
    // CONSISTENCY
    // ======================================

    {
        id: "consistent_5",
        icon: "🔥",
        title: "Consistent Learner",
        description: "Complete 5 exams with 60%+.",
        type: "consistent",
        target: 5,
        xp: 250
    },

    {
        id: "consistent_10",
        icon: "🚀",
        title: "Consistent Performer",
        description: "Complete 10 exams with 60%+.",
        type: "consistent",
        target: 10,
        xp: 750
    },

    {
        id: "consistent_25",
        icon: "🏆",
        title: "Consistency Champion",
        description: "Complete 25 exams with 60%+.",
        type: "consistent",
        target: 25,
        xp: 2500
    },

];

// ==========================================
// CALCULATE ACHIEVEMENTS
// ==========================================

function calculateAchievements(
    attempts
) {

    const completed =
        [...attempts]

            .filter(
                attempt =>
                    attempt.status ===
                    "Completed"
            )

            .sort(
                (
                    a,
                    b
                ) =>
                    new Date(
                        a.submitted_at || 0
                    ) -
                    new Date(
                        b.submitted_at || 0
                    )
            );


    const totalTests =
        completed.length;


    // ==========================================
    // PASS COUNT
    //
    // ExamVerse default pass percentage = 40%
    // ==========================================

    const PASS_PERCENTAGE = 40;


    const passes =
        completed.filter(
            attempt =>
                (
                    Number(
                        attempt.percentage
                    ) || 0
                ) >=
                PASS_PERCENTAGE
        ).length;


    // ==========================================
    // BEST SCORE
    // ==========================================

    const bestScore =
        completed.length > 0

        ?

        Math.max(
            ...completed.map(
                attempt =>
                    Number(
                        attempt.percentage
                    ) || 0
            )
        )

        :

        0;


    // ==========================================
    // COMEBACKS
    // Improvement >= 10 percentage points
    // ==========================================

    let comebacks = 0;


    for (
        let i = 1;
        i < completed.length;
        i++
    ) {

        const previousScore =
            Number(
                completed[
                    i - 1
                ].percentage
            ) || 0;


        const currentScore =
            Number(
                completed[
                    i
                ].percentage
            ) || 0;


        if (
            currentScore -
            previousScore >=
            10
        ) {

            comebacks++;

        }

    }


    // ==========================================
    // ACHIEVEMENT VALUES
    // ==========================================

    // ==========================================
// ADDITIONAL ACHIEVEMENT STATISTICS
// ==========================================

const perfectScores =
    completed.filter(
        attempt =>
            (
                Number(
                    attempt.percentage
                ) || 0
            ) >= 100
    ).length;


const eliteScores =
    completed.filter(
        attempt =>
            (
                Number(
                    attempt.percentage
                ) || 0
            ) >= 90
    ).length;


const excellentScores =
    completed.filter(
        attempt =>
            (
                Number(
                    attempt.percentage
                ) || 0
            ) >= 80
    ).length;


// ==========================================
// ACCURACY
// ==========================================

const totalCorrect =
    completed.reduce(
        (
            total,
            attempt
        ) =>
            total +
            (
                Number(
                    attempt.correct
                ) || 0
            ),
        0
    );


const totalAttempted =
    completed.reduce(
        (
            total,
            attempt
        ) =>
            total +
            (
                Number(
                    attempt.attempted
                ) || 0
            ),
        0
    );


const overallAccuracy =
    totalAttempted > 0

        ?

        (
            totalCorrect /
            totalAttempted
        ) * 100

        :

        0;


// ==========================================
// ATTEMPTED QUESTIONS
// ==========================================

const totalQuestionsAttempted =
    totalAttempted;


// ==========================================
// CONSISTENT PERFORMANCE
// ==========================================

const consistentExams =
    completed.filter(
        attempt =>
            (
                Number(
                    attempt.percentage
                ) || 0
            ) >= 60
    ).length;


// ==========================================
// ACHIEVEMENT VALUES
// ==========================================

const values = {

    tests:
        totalTests,

    passes:
        passes,

    score:
        bestScore,

    comeback:
        comebacks,

    perfect:
        perfectScores,

    elite:
        eliteScores,

    excellent:
        excellentScores,

    accuracy:
        overallAccuracy,

    questions:
        totalQuestionsAttempted,

    consistent:
        consistentExams

};


    // ==========================================
    // DETERMINE UNLOCKED
    // ==========================================

    const milestones =
        ACHIEVEMENTS.map(
            achievement => {

                const current =
                    values[
                        achievement.type
                    ] || 0;


                const unlocked =
                    current >=
                    achievement.target;


                const progress =
                    Math.min(
                        100,

                        (
                            current /
                            achievement.target
                        ) * 100
                    );


                return {

                    ...achievement,

                    current:
                        current,

                    unlocked:
                        unlocked,

                    progress:
                        progress

                };

            }
        );


    // ==========================================
    // TOTAL XP
    // ==========================================

    const totalXP =
        milestones.reduce(

            (
                total,
                milestone
            ) => {

                return total +
                    (
                        milestone.unlocked
                            ? milestone.xp
                            : 0
                    );

            },

            0

        );


    return {

        totalXP:
            totalXP,

        milestones:
            milestones,

        totalTests:
            totalTests,

        passes:
            passes,

        bestScore:
            bestScore,

        comebacks:
            comebacks

    };

}

// ==========================================
// USER LEVEL
// BASED ON XP + COMPLETED TESTS
// ==========================================

function getUserLevel(
    xp,
    completedTests
) {

    const levels = [

        {
            name: "Beginner",
            minXP: 0,
            minTests: 0,
            maxXP: 500,
            maxTests: 5
        },

        {
            name: "Intermediate",
            minXP: 500,
            minTests: 5,
            maxXP: 1500,
            maxTests: 15
        },

        {
            name: "Advanced",
            minXP: 1500,
            minTests: 15,
            maxXP: 4000,
            maxTests: 40
        },

        {
            name: "Expert",
            minXP: 4000,
            minTests: 40,
            maxXP: 8000,
            maxTests: 100
        },

        {
            name: "Master",
            minXP: 8000,
            minTests: 100,
            maxXP: 15000,
            maxTests: 250
        },

        {
            name: "Legend",
            minXP: 15000,
            minTests: 250,
            maxXP: null,
            maxTests: null
        }

    ];


    let currentLevel =
        levels[0];


    // ======================================
    // FIND HIGHEST LEVEL WHERE
    // BOTH REQUIREMENTS ARE MET
    // ======================================

    for (
        const level of levels
    ) {

        const xpRequirementMet =
            xp >= level.minXP;


        const testRequirementMet =
            completedTests >=
            level.minTests;


        if (
            xpRequirementMet &&
            testRequirementMet
        ) {

            currentLevel =
                level;

        }

    }


    // ======================================
    // NEXT LEVEL
    // ======================================

    const currentIndex =
        levels.indexOf(
            currentLevel
        );


    const nextLevel =
        levels[
            currentIndex + 1
        ] || null;


    return {

        name:
            currentLevel.name,

        currentXP:
            currentLevel.minXP,

        currentTests:
            currentLevel.minTests,

        nextXP:
            nextLevel
                ? nextLevel.minXP
                : null,

        nextTests:
            nextLevel
                ? nextLevel.minTests
                : null,

        nextLevelName:
            nextLevel
                ? nextLevel.name
                : null

    };

}

// ==========================================
// RENDER ORGANIZED MILESTONES
// ==========================================

function renderMilestones(
    milestones
) {

    const grid =
        document.getElementById(
            "milestoneGrid"
        );


    const count =
        document.getElementById(
            "milestoneCount"
        );


    if (!grid) return;


    // ======================================
    // UNLOCKED COUNT
    // ======================================

    const unlockedCount =
        milestones.filter(
            milestone =>
                milestone.unlocked
        ).length;


    if (count) {

        count.textContent =
            unlockedCount +
            " Unlocked";

    }


    // ======================================
    // CATEGORY DEFINITIONS
    // ======================================

    const categories = [

        {
            key: "tests",
            icon: "📝",
            title: "Exam Completion",
            description:
                "Complete exams and build your journey."
        },

        {
            key: "passes",
            icon: "🎯",
            title: "Passing",
            description:
                "Keep collecting successful exams."
        },

        {
            key: "performance",
            icon: "💎",
            title: "Performance",
            description:
                "Push your scores toward excellence."
        },

        {
            key: "questions",
            icon: "📚",
            title: "Question Mastery",
            description:
                "Answer more questions and sharpen your skills."
        },

        {
            key: "improvement",
            icon: "🔥",
            title: "Improvement & Consistency",
            description:
                "Reward progress, comebacks and consistency."
        }

    ];


    // ======================================
    // MAP TYPES TO CATEGORIES
    // ======================================

    const categoryMap = {

        tests:
            "tests",

        passes:
            "passes",

        score:
            "performance",

        perfect:
            "performance",

        elite:
            "performance",

        excellent:
            "performance",

        accuracy:
            "performance",

        questions:
            "questions",

        comeback:
            "improvement",

        consistent:
            "improvement"

    };


    // ======================================
    // BUILD HTML
    // ======================================

    let html = "";


    categories.forEach(
        category => {

            const categoryMilestones =
                milestones.filter(
                    milestone =>
                        categoryMap[
                            milestone.type
                        ] ===
                        category.key
                );


            if (
                categoryMilestones.length === 0
            ) {

                return;

            }


            const categoryUnlocked =
                categoryMilestones.filter(
                    milestone =>
                        milestone.unlocked
                ).length;


            html += `

                <section
                    class="milestoneCategory"
                >

                    <div
                        class="milestoneCategoryHeader"
                    >

                        <div
                            class="milestoneCategoryTitle"
                        >

                            <span
                                class="milestoneCategoryIcon"
                            >
                                ${
                                    category.icon
                                }
                            </span>

                            <div>

                                <h3>
                                    ${
                                        category.title
                                    }
                                </h3>

                                <p>
                                    ${
                                        category.description
                                    }
                                </p>

                            </div>

                        </div>


                        <span
                            class="milestoneCategoryCount"
                        >
                            ${
                                categoryUnlocked
                            }
                            /
                            ${
                                categoryMilestones.length
                            }
                        </span>

                    </div>


                    <div
                        class="milestoneCategoryGrid"
                    >

            `;


            categoryMilestones.forEach(
                milestone => {

                    // ==================================
                    // SAFE PROGRESS
                    // ==================================

                    const progress =
                        Math.min(
                            100,
                            Math.max(
                                0,
                                Number(
                                    milestone.progress
                                ) || 0
                            )
                        );


                    const current =
                        Math.min(
                            Number(
                                milestone.current
                            ) || 0,
                            Number(
                                milestone.target
                            ) || 0
                        );


                    // ==================================
                    // COMPLETED / LOCKED CLASS
                    // ==================================

                    const stateClass =
                        milestone.unlocked
                            ? "unlocked"
                            : "locked";


                    // ==================================
                    // CARD
                    // ==================================

                    html += `

                        <article
                            class="
                                milestoneCard
                                ${stateClass}
                            "
                        >

                            <div
                                class="milestoneIcon"
                            >
                                ${
                                    milestone.unlocked
                                        ? milestone.icon
                                        : "🔒"
                                }
                            </div>


                            <div
                                class="milestoneCardContent"
                            >

                                <div
                                    class="milestoneTitle"
                                >
                                    ${
                                        escapeHTML(
                                            milestone.title
                                        )
                                    }
                                </div>


                                <div
                                    class="milestoneDescription"
                                >
                                    ${
                                        escapeHTML(
                                            milestone.description
                                        )
                                    }
                                </div>


                                <div
                                    class="milestoneProgressRow"
                                >

                                    <span
                                        class="milestoneProgressText"
                                    >
                                        ${
                                            current
                                        }
                                        /
                                        ${
                                            milestone.target
                                        }
                                    </span>


                                    <span
                                        class="milestoneProgressPercent"
                                    >
                                        ${
                                            Math.round(
                                                progress
                                            )
                                        }%
                                    </span>

                                </div>


                                <div
                                    class="milestoneMiniBar"
                                >

                                    <div
                                        class="milestoneMiniFill"
                                        style="
                                            width:
                                            ${progress}%;
                                        "
                                    ></div>

                                </div>


                                <div
                                    class="milestoneXP"
                                >

                                    ${
                                        milestone.unlocked

                                            ? "✓ Completed"

                                            : "+" +
                                              milestone.xp +
                                              " XP"
                                    }

                                </div>

                            </div>

                        </article>

                    `;

                }
            );


            html += `

                    </div>

                </section>

            `;

        }
    );


    grid.innerHTML =
        html;

}

// ==========================================
// TOGGLE MILESTONES
// ==========================================

function toggleMilestones() {

    const section =
        document.querySelector(
            ".milestoneSection"
        );


    const button =
        document.querySelector(
            ".milestoneToggleBtn"
        );


    if (!section) return;


    const expanded =
        section.classList.toggle(
            "expanded"
        );


    if (button) {

        button.setAttribute(
            "aria-expanded",
            expanded
                ? "true"
                : "false"
        );

    }

}

document.addEventListener(
    "keydown",
    function (event) {

        const toggle =
            event.target.closest(
                ".milestoneToggleBtn"
            );


        if (!toggle) return;


        if (
            event.key === "Enter" ||
            event.key === " "
        ) {

            event.preventDefault();

            toggleMilestones();

        }

    }
);


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

        // ======================================
        // NORMAL EXAM BROWSING
        // Remove temporary preferred-exam
        // priority.
        // ======================================

        sessionStorage.removeItem(
    "selectedPreferredExam"
);


        // Open complete exam list

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

        sessionStorage.removeItem(
    "selectedPreferredExam"
);


        window.location.href =
            "exam-list.html";

    }
);


// ==========================================
// START DASHBOARD
// ==========================================

loadDashboard();