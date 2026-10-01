/* ==========================================
   ExamVerse Admin Dashboard
   Created by Subhajit Paul
========================================== */

loadDashboard();

// ===============================
// Main
// ===============================

async function loadDashboard() {

    await loadCounts();

    await loadAdminName();

    await loadRecentActivity();

}

// ===============================
// Load Dashboard Counts
// ===============================

async function loadCounts() {

    // Users
    const { count: userCount } =
    await supabaseClient
    .from("profiles")
    .select("*", {
        count: "exact",
        head: true
    });

    document.getElementById("totalUsers").textContent =
        userCount ?? 0;

    // Exams
    const { count: examCount } =
    await supabaseClient
    .from("exams")
    .select("*", {
        count: "exact",
        head: true
    });

    document.getElementById("totalExams").textContent =
        examCount ?? 0;

    // Questions
    const { count: questionCount } =
    await supabaseClient
    .from("questions")
    .select("*", {
        count: "exact",
        head: true
    });

    document.getElementById("totalQuestions").textContent =
        questionCount ?? 0;

    // Results
const {
    data: resultRows,
    error: resultError
} = await supabaseClient
    .from("exam_attempts")
    .select("id, status, result, submitted_at");

console.log("ADMIN RESULT ROWS:", resultRows);
console.log("ADMIN RESULT ERROR:", resultError);

if (resultError) {

    console.error(
        "Unable to read exam_attempts:",
        resultError
    );

    document.getElementById("totalResults").textContent = "0";

} else {

    const completedResults =
        (resultRows || []).filter(row =>
            String(row.status || "").toLowerCase() === "completed"
        );

    console.log(
        "COMPLETED RESULTS:",
        completedResults
    );

    document.getElementById("totalResults").textContent =
        completedResults.length;
}

}

// ===============================
// Welcome Admin
// ===============================

async function loadAdminName() {

    const {

        data: { user }

    } = await supabaseClient.auth.getUser();

    if (!user) return;

    const { data: admin } =
    await supabaseClient

    .from("admins")

    .select("full_name")

    .eq("id", user.id)

    .maybeSingle();

    if (admin) {

        document.querySelector("header h1").textContent =
            "Welcome, " + admin.full_name + " 👑";

    }

}

// ===============================
// Logout
// ===============================

document

.getElementById("logoutBtn")

.addEventListener("click", logoutAdmin);

async function logoutAdmin() {

    if (!confirm("Logout from Admin Panel?"))

        return;

    await supabaseClient.auth.signOut();

    localStorage.removeItem("currentUser");

    window.location.href = "login.html";

}

// ===============================
// Recent Activity
// ===============================

async function loadRecentActivity() {

    const activityTable =
        document.getElementById("activityTable");

    if (!activityTable) return;


    // Show loading state

    activityTable.innerHTML = `
        <tr>
            <td colspan="3">
                Loading recent activity...
            </td>
        </tr>
    `;


    try {

        // ==========================================
        // Get latest completed exam attempts
        // ==========================================

        const {
            data: attempts,
            error: attemptsError
        } = await supabaseClient

            .from("exam_attempts")

            .select(`
                id,
                user_id,
                exam_id,
                score,
                percentage,
                result,
                status,
                submitted_at
            `)

            .eq(
                "status",
                "Completed"
            )

            .order(
                "submitted_at",
                {
                    ascending: false
                }
            )

            .limit(5);


        if (attemptsError) {

            console.error(
                "Recent activity error:",
                attemptsError
            );

            activityTable.innerHTML = `
                <tr>
                    <td colspan="3">
                        Unable to load recent activity
                    </td>
                </tr>
            `;

            return;
        }


        // ==========================================
        // No activity
        // ==========================================

        if (
            !attempts ||
            attempts.length === 0
        ) {

            activityTable.innerHTML = `
                <tr>
                    <td colspan="3">
                        No Recent Activity Yet
                    </td>
                </tr>
            `;

            return;
        }


        // ==========================================
        // Get User IDs
        // ==========================================

        const userIds = [
            ...new Set(
                attempts
                    .map(
                        attempt =>
                            attempt.user_id
                    )
                    .filter(Boolean)
            )
        ];


        // ==========================================
        // Get Exam IDs
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


        // ==========================================
        // Load Profiles
        // ==========================================

        let profiles = [];

        if (userIds.length > 0) {

            const {
                data,
                error
            } = await supabaseClient

                .from("profiles")

                .select(`
                    id,
                    first_name,
                    middle_name,
                    last_name,
                    email
                `)

                .in(
                    "id",
                    userIds
                );


            if (error) {

                console.error(
                    "Profile loading error:",
                    error
                );

            } else {

                profiles =
                    data || [];

            }

        }


        // ==========================================
        // Load Exams
        // ==========================================

        let exams = [];

        if (examIds.length > 0) {

            const {
                data,
                error
            } = await supabaseClient

                .from("exams")

                .select(`
                    id,
                    exam_name
                `)

                .in(
                    "id",
                    examIds
                );


            if (error) {

                console.error(
                    "Exam loading error:",
                    error
                );

            } else {

                exams =
                    data || [];

            }

        }


        // ==========================================
        // Create Lookup Maps
        // ==========================================

        const profileMap =
            new Map();

        profiles.forEach(
            profile => {

                profileMap.set(
                    String(profile.id),
                    profile
                );

            }
        );


        const examMap =
            new Map();

        exams.forEach(
            exam => {

                examMap.set(
                    String(exam.id),
                    exam
                );

            }
        );


        // ==========================================
        // Render Activities
        // ==========================================

        activityTable.innerHTML =
            attempts
                .map(
                    attempt => {

                        const profile =
                            profileMap.get(
                                String(
                                    attempt.user_id
                                )
                            );


                        const exam =
                            examMap.get(
                                String(
                                    attempt.exam_id
                                )
                            );


                        // Build user name

                        let userName =
                            "Unknown User";


                        if (profile) {

                            userName =
                                [
                                    profile.first_name,
                                    profile.middle_name,
                                    profile.last_name
                                ]
                                    .filter(Boolean)
                                    .join(" ")
                                    .trim();

                            if (
                                !userName
                            ) {

                                userName =
                                    profile.email ||
                                    "Unknown User";

                            }

                        }


                        // Exam name

                        const examName =
                            exam?.exam_name ||
                            "Unknown Exam";


                        // Score

                        // Score
// Use the actual score, NOT percentage

const actualScore =
    attempt.score;

let scoreText = "";

if (
    actualScore !== null &&
    actualScore !== undefined &&
    actualScore !== ""
) {

    scoreText =
        ` — Score ${actualScore}`;

}


                        // Date

                        let dateText =
                            "Unknown Date";


                        if (
                            attempt.submitted_at
                        ) {

                            const date =
                                new Date(
                                    attempt.submitted_at
                                );


                            if (
                                !Number.isNaN(
                                    date.getTime()
                                )
                            ) {

                                dateText =
                                    date.toLocaleString(
                                        "en-IN",
                                        {
                                            day: "2-digit",
                                            month: "short",
                                            year: "numeric",
                                            hour: "2-digit",
                                            minute: "2-digit"
                                        }
                                    );

                            }

                        }


                        return `

                            <tr>

                                <td>
                                    ${escapeHTML(
                                        userName
                                    )}
                                </td>


                                <td class="activity-cell">

    <span class="activity-completed">
        Completed
    </span>

    <strong class="activity-exam">
        ${escapeHTML(examName)}
    </strong>

    <span class="activity-score">
        ${escapeHTML(scoreText)}
    </span>

</td>


                                <td>
                                    ${escapeHTML(
                                        dateText
                                    )}
                                </td>

                            </tr>

                        `;

                    }
                )
                .join("");


    } catch (error) {

        console.error(
            "Recent activity failed:",
            error
        );


        activityTable.innerHTML = `

            <tr>

                <td colspan="3">

                    Unable to load recent activity

                </td>

            </tr>

        `;

    }

}

function escapeHTML(value) {

    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    return String(value)
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

/* ==========================================
   SUPABASE PROJECT HEALTH
========================================== */

const SUPABASE_HEALTH_FUNCTION =
    "admin-project-health";

const SUPABASE_HEALTH_REFRESH =
    60 * 1000;


/* ===========================
   Load Project Health
=========================== */

async function loadSupabaseProjectHealth() {

    try {

        setHealthChecking();


        const {
            data,
            error
        } = await supabaseClient.functions.invoke(
            SUPABASE_HEALTH_FUNCTION
        );


        if (error) {

            console.error(
                "Supabase health error:",
                error
            );

            setHealthUnavailable(
                "Unable to load"
            );

            return;

        }


        if (!data) {

            setHealthUnavailable(
                "No data"
            );

            return;

        }


        console.log(
            "SUPABASE PROJECT HEALTH:",
            data
        );


        /* ===========================
           Service Status
        =========================== */

        updateHealthService(
            "Database",
            data.services?.database,
            "healthDatabaseStatus",
            "healthDatabaseDot"
        );

        updateHealthService(
            "Authentication",
            data.services?.auth,
            "healthAuthStatus",
            "healthAuthDot"
        );

        updateHealthService(
            "Storage",
            data.services?.storage,
            "healthStorageStatus",
            "healthStorageDot"
        );

        updateHealthService(
            "Realtime",
            data.services?.realtime,
            "healthRealtimeStatus",
            "healthRealtimeDot"
        );


        /* ===========================
           Database
        =========================== */

        updateHealthUsage(
            "healthDatabaseUsage",
            "healthDatabasePercent",
            "healthDatabaseBar",
            "healthDatabaseLimit",
            data.database?.used,
            data.database?.limit,
            data.database?.unit || "MB"
        );


        /* ===========================
           Storage
        =========================== */

        updateHealthUsage(
            "healthStorageUsage",
            "healthStoragePercent",
            "healthStorageBar",
            "healthStorageLimit",
            data.storage?.used,
            data.storage?.limit,
            data.storage?.unit || "GB"
        );


        /* ===========================
           Users
        =========================== */

        updateHealthUsage(
            "healthUsersUsage",
            "healthUsersPercent",
            "healthUsersBar",
            "healthUsersLimit",
            data.users?.used,
            data.users?.limit,
            data.users?.unit || "users"
        );


        /* ===========================
           API Requests
        =========================== */

        updateHealthUsage(
            "healthApiUsage",
            "healthApiPercent",
            "healthApiBar",
            "healthApiLimit",
            data.api?.used,
            data.api?.limit,
            data.api?.unit || "requests"
        );


        /* ===========================
           Realtime
        =========================== */

        updateHealthUsage(
            "healthRealtimeUsage",
            "healthRealtimePercent",
            "healthRealtimeBar",
            "healthRealtimeLimit",
            data.realtime?.used,
            data.realtime?.limit,
            data.realtime?.unit || "messages"
        );


        /* ===========================
           Edge Functions
        =========================== */

        updateHealthUsage(
            "healthFunctionsUsage",
            "healthFunctionsPercent",
            "healthFunctionsBar",
            "healthFunctionsLimit",
            data.functions?.used,
            data.functions?.limit,
            data.functions?.unit || "invocations"
        );


        /* ===========================
           Last Updated
        =========================== */

        const updatedElement =
            document.getElementById(
                "healthLastUpdated"
            );


        if (updatedElement) {

            updatedElement.textContent =
                "Last updated: " +
                new Date().toLocaleString(
                    "en-IN",
                    {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit"
                    }
                );

        }


    } catch (error) {

        console.error(
            "Supabase project health failed:",
            error
        );

        setHealthUnavailable(
            "Unavailable"
        );

    }

}


/* ===========================
   Service Status
=========================== */

function updateHealthService(
    name,
    service,
    textId,
    dotId
) {

    const textElement =
        document.getElementById(textId);

    const dotElement =
        document.getElementById(dotId);


    if (!textElement || !dotElement)
        return;


    let status =
        "Unknown";


    if (
        service === true ||
        service === "online" ||
        service === "healthy"
    ) {

        status = "Online";

        dotElement.className =
            "health-status-dot online";

    }

    else if (
        service === "warning"
    ) {

        status = "Warning";

        dotElement.className =
            "health-status-dot warning";

    }

    else if (
        service === false ||
        service === "offline"
    ) {

        status = "Offline";

        dotElement.className =
            "health-status-dot offline";

    }

    else {

        status = "Unknown";

        dotElement.className =
            "health-status-dot checking";

    }


    textElement.textContent =
        status;

}


/* ===========================
   Usage Progress
=========================== */

function updateHealthUsage(
    valueId,
    percentId,
    barId,
    limitId,
    used,
    limit,
    unit
) {

    const valueElement =
        document.getElementById(valueId);

    const percentElement =
        document.getElementById(percentId);

    const barElement =
        document.getElementById(barId);

    const limitElement =
        document.getElementById(limitId);


    if (
        !valueElement ||
        !percentElement ||
        !barElement ||
        !limitElement
    ) {

        return;

    }


    const numericUsed =
        Number(used);

    const numericLimit =
        Number(limit);


    if (
        !Number.isFinite(numericUsed) ||
        !Number.isFinite(numericLimit) ||
        numericLimit <= 0
    ) {

        valueElement.textContent =
            "Unavailable";

        percentElement.textContent =
            "—";

        barElement.style.width =
            "0%";

        limitElement.textContent =
            "Usage data unavailable";

        return;

    }


    const percentage =
        Math.min(
            100,
            Math.max(
                0,
                (numericUsed / numericLimit) * 100
            )
        );


    valueElement.textContent =
        formatHealthNumber(
            numericUsed
        ) +
        " " +
        unit;


    percentElement.textContent =
        percentage.toFixed(1) +
        "%";


    barElement.style.width =
        percentage.toFixed(2) +
        "%";


    limitElement.textContent =
        "Limit: " +
        formatHealthNumber(
            numericLimit
        ) +
        " " +
        unit;

}


/* ===========================
   Number Formatting
=========================== */

function formatHealthNumber(
    value
) {

    const number =
        Number(value);


    if (!Number.isFinite(number))
        return "0";


    if (
        Math.abs(number) >=
        1000000
    ) {

        return (
            number / 1000000
        ).toFixed(2) + "M";

    }


    if (
        Math.abs(number) >=
        1000
    ) {

        return (
            number / 1000
        ).toFixed(2) + "K";

    }


    if (
        Number.isInteger(number)
    ) {

        return number.toLocaleString(
            "en-IN"
        );

    }


    return number.toFixed(2);

}


/* ===========================
   Checking State
=========================== */

function setHealthChecking() {

    const serviceIds = [

        "healthDatabaseStatus",
        "healthAuthStatus",
        "healthStorageStatus",
        "healthRealtimeStatus"

    ];


    const dotIds = [

        "healthDatabaseDot",
        "healthAuthDot",
        "healthStorageDot",
        "healthRealtimeDot"

    ];


    serviceIds.forEach(
        id => {

            const element =
                document.getElementById(id);

            if (element) {

                element.textContent =
                    "Checking...";

            }

        }
    );


    dotIds.forEach(
        id => {

            const element =
                document.getElementById(id);

            if (element) {

                element.className =
                    "health-status-dot checking";

            }

        }
    );

}


/* ===========================
   Unavailable State
=========================== */

function setHealthUnavailable(
    message
) {

    const serviceIds = [

        "healthDatabaseStatus",
        "healthAuthStatus",
        "healthStorageStatus",
        "healthRealtimeStatus"

    ];


    const dotIds = [

        "healthDatabaseDot",
        "healthAuthDot",
        "healthStorageDot",
        "healthRealtimeDot"

    ];


    serviceIds.forEach(
        id => {

            const element =
                document.getElementById(id);

            if (element) {

                element.textContent =
                    message;

            }

        }
    );


    dotIds.forEach(
        id => {

            const element =
                document.getElementById(id);

            if (element) {

                element.className =
                    "health-status-dot offline";

            }

        }
    );


    const usageIds = [

        "healthDatabaseUsage",
        "healthStorageUsage",
        "healthUsersUsage",
        "healthApiUsage",
        "healthRealtimeUsage",
        "healthFunctionsUsage"

    ];


    usageIds.forEach(
        id => {

            const element =
                document.getElementById(id);

            if (element) {

                element.textContent =
                    "Unavailable";

            }

        }
    );


    const percentageIds = [

        "healthDatabasePercent",
        "healthStoragePercent",
        "healthUsersPercent",
        "healthApiPercent",
        "healthRealtimePercent",
        "healthFunctionsPercent"

    ];


    percentageIds.forEach(
        id => {

            const element =
                document.getElementById(id);

            if (element) {

                element.textContent =
                    "—";

            }

        }
    );


    const barIds = [

        "healthDatabaseBar",
        "healthStorageBar",
        "healthUsersBar",
        "healthApiBar",
        "healthRealtimeBar",
        "healthFunctionsBar"

    ];


    barIds.forEach(
        id => {

            const element =
                document.getElementById(id);

            if (element) {

                element.style.width =
                    "0%";

            }

        }
    );

}


/* ===========================
   Start Health Monitoring
=========================== */

loadSupabaseProjectHealth();


setInterval(
    loadSupabaseProjectHealth,
    SUPABASE_HEALTH_REFRESH
);