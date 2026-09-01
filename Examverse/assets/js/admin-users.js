let allUsers = [];

document.addEventListener(
    "DOMContentLoaded",
    initializeUsers
);

async function initializeUsers() {

    setupSearch();

    setupRefresh();

    setupModal();

    setupUsersTableScroll();

    if (
        window.examVerseAdminReady
    ) {
        await window.examVerseAdminReady;
    }

    await loadUsers();

    startLastSeenTracking();
}

async function loadUsers() {

    const tableBody =
        document.getElementById(
            "usersTableBody"
        );

    const userCount =
        document.getElementById(
            "userCount"
        );

    tableBody.innerHTML = `
        <tr>
            <td
                colspan="11"
                class="loading-cell"
            >
                <i
                    class="fa-solid fa-spinner fa-spin"
                ></i>
                Loading users...
            </td>
        </tr>
    `;

    try {

        const {
            data,
            error
        } =
            await supabaseClient.rpc(
                "get_admin_user_directory"
            );

        if (error) {
            throw error;
        }

        const users =
            Array.isArray(data)
                ? data
                : [];

        allUsers =
            users.map(
                user => ({

                    id:
                        user.id,

                    first_name:
                        user.first_name,

                    middle_name:
                        user.middle_name,

                    last_name:
                        user.last_name,

                    email:
                        user.email,

                    phone:
                        user.phone,

                    age:
                        user.age,

                    gender:
                        user.gender,

                    exam1:
                        user.exam1,

                    exam2:
                        user.exam2,

                    exam3:
                        user.exam3,

                    account_created_at:
                        user.account_created_at,

                    last_login_at:
                        user.last_login_at,

                    last_seen_at:
                        user.last_seen_at,

                    is_online:
                        user.is_online,

                    activity_status:
                        user.activity_status,

                    admin:
                        user.role
                            ? {

                                role:
                                    user.role,

                                created_at:
                                    user.account_created_at,

                                email:
                                    user.email

                            }
                            : null

                })
            );

        renderUsers(
            allUsers
        );

        userCount.textContent =
            `${allUsers.length} user${
                allUsers.length === 1
                    ? ""
                    : "s"
            }`;
    }

    catch (error) {

        console.error(
            "Unable to load users:",
            error
        );

        tableBody.innerHTML = `
            <tr>
                <td
                    colspan="11"
                    class="error-cell"
                >
                    <i
                        class="fa-solid fa-circle-exclamation"
                    ></i>
                    Unable to load users.
                </td>
            </tr>
        `;

        userCount.textContent =
            "Unable to load users.";
    }
}

function renderUsers(users) {

    const tableBody =
        document.getElementById(
            "usersTableBody"
        );

    if (
        !users ||
        users.length === 0
    ) {

        tableBody.innerHTML = `
            <tr>
                <td
                    colspan="11"
                    class="empty-cell"
                >
                    No users found.
                </td>
            </tr>
        `;

        return;
    }

    const isMainAdmin =
        window.examVerseAdmin?.isMainAdmin === true;

    tableBody.innerHTML =
        users.map(
            user => {

                const fullName =
                    [
                        user.first_name,
                        user.middle_name,
                        user.last_name
                    ]
                    .filter(
                        value =>
                            value &&
                            String(value).trim()
                    )
                    .join(" ")
                    .trim() ||
                    "Unnamed User";

                let status =
                    "USER";

                let statusClass =
                    "user";

                if (
                    user.admin
                ) {

                    if (
                        user.admin.role ===
                        "main_admin"
                    ) {

                        status =
                            "MAIN ADMIN";

                        statusClass =
                            "main-admin";

                    }

                    else {

                        status =
                            "ADMIN";

                        statusClass =
                            "admin";
                    }
                }

                const email =
    user.email ||
    "—";

const phone =
    user.phone ||
    "—";

const maskedEmail =
    maskEmail(email);

const maskedPhone =
    maskPhone(phone);

const maskedAge =
    maskPrivateValue(user.age);

const maskedGender =
    maskGender(user.gender);

const maskedCreatedAt =
    maskCreatedDate(
        user.account_created_at
    );

                const createdAt =
                    user.account_created_at ||
                    null;

                const lastLogin =
                    user.last_login_at ||
                    null;

                const lastSeen =
                    user.last_seen_at ||
                    null;

                const activityStatus =
                    user.activity_status ||
                    "Never Active";

                const isOnline =
                    user.is_online === true;

                    const canViewUsers =
    isMainAdmin ||
    window.examVerseAdmin?.hasPermission(
        "users.view"
    ) === true;

const canEditUsers =
    isMainAdmin ||
    window.examVerseAdmin?.hasPermission(
        "users.edit"
    ) === true;

const canDeleteUsers =
    isMainAdmin ||
    window.examVerseAdmin?.hasPermission(
        "users.delete"
    ) === true;

                const canMakeAdmin =
                    isMainAdmin ||
                    window.examVerseAdmin?.hasPermission(
                        "admin_management.make_admin"
                    ) === true;

                const canChangePermissions =
                    isMainAdmin ||
                    window.examVerseAdmin?.hasPermission(
                        "admin_management.change_permissions"
                    ) === true;

                const canRemoveAdmin =
                    isMainAdmin ||
                    window.examVerseAdmin?.hasPermission(
                        "admin_management.remove_admin"
                    ) === true;

                let actionHTML = "";

                /*
                 * ==================================================
                 * MAIN ADMIN
                 * ==================================================
                 *
                 * Main Admin can manage everyone, BUT the buttons
                 * depend on the TARGET USER'S actual role.
                 */

                if (isMainAdmin) {

                    /*
                     * TARGET = MAIN ADMIN
                     *
                     * Never show Remove Admin or Permissions
                     * for the Main Admin itself.
                     */

                    if (
                        user.admin?.role ===
                        "main_admin"
                    ) {

                        actionHTML = `
                            <span
                                class="full-access-badge"
                            >
                                <i
                                    class="fa-solid fa-crown"
                                ></i>
                                Full Access
                            </span>
                        `;
                    }

                    /*
                     * TARGET = DELEGATED ADMIN
                     *
                     * Only delegated admins receive:
                     * Permissions + Remove Admin.
                     */

                    else if (
                        user.admin?.role ===
                        "admin"
                    ) {

                        actionHTML = `
                            <div class="admin-actions">

                                <button
                                    type="button"
                                    class="view-btn permission-btn"
                                    data-user-id="${escapeHTML(
                                        user.id
                                    )}"
                                >
                                    <i
                                        class="fa-solid fa-key"
                                    ></i>
                                    Permissions
                                </button>

                                <button
                                    type="button"
                                    class="view-btn remove-admin-btn"
                                    data-user-id="${escapeHTML(
                                        user.id
                                    )}"
                                >
                                    <i
                                        class="fa-solid fa-user-minus"
                                    ></i>
                                    Remove Admin
                                </button>

                            </div>
                        `;
                    }

                    /*
                     * TARGET = NORMAL USER
                     *
                     * Normal users receive Make Admin.
                     */

                    else {

                        actionHTML = `
                            <button
                                type="button"
                                class="view-btn make-admin-btn"
                                data-user-id="${escapeHTML(
                                    user.id
                                )}"
                            >
                                <i
                                    class="fa-solid fa-user-shield"
                                ></i>
                                Make Admin
                            </button>
                        `;
                    }
                }

                /*
                 * ==================================================
                 * DELEGATED ADMIN
                 * ==================================================
                 *
                 * A delegated Admin can only see the admin-management
                 * actions for another delegated Admin if their own
                 * permissions allow it.
                 */

                else if (
    user.admin?.role ===
    "main_admin"
) {

    actionHTML = `
        <span
            class="full-access-badge"
        >
            <i
                class="fa-solid fa-crown"
            ></i>
            Full Access
        </span>
    `;
}


                else if (
                    user.admin?.role ===
                    "admin"
                ) {

                    const adminActions = [];

                    if (
                        canChangePermissions
                    ) {

                        adminActions.push(`
                            <button
                                type="button"
                                class="view-btn permission-btn"
                                data-user-id="${escapeHTML(
                                    user.id
                                )}"
                            >
                                <i
                                    class="fa-solid fa-key"
                                ></i>
                                Permissions
                            </button>
                        `);
                    }

                    if (
                        canRemoveAdmin
                    ) {

                        adminActions.push(`
                            <button
                                type="button"
                                class="view-btn remove-admin-btn"
                                data-user-id="${escapeHTML(
                                    user.id
                                )}"
                            >
                                <i
                                    class="fa-solid fa-user-minus"
                                ></i>
                                Remove Admin
                            </button>
                        `);
                    }

                    actionHTML =
                        adminActions.length > 0
                            ? `
                                <div class="admin-actions">
                                    ${adminActions.join("")}
                                </div>
                            `
                            : "";
                }

                /*
                 * ==================================================
                 * NORMAL USER
                 * ==================================================
                 */

                else {

                    if (
                        canMakeAdmin
                    ) {

                        actionHTML = `
                            <button
                                type="button"
                                class="view-btn make-admin-btn"
                                data-user-id="${escapeHTML(
                                    user.id
                                )}"
                            >
                                <i
                                    class="fa-solid fa-user-shield"
                                ></i>
                                Make Admin
                            </button>
                        `;
                    }
                }

                return `
                    <tr>

                        <td>

                            <strong>
                                ${escapeHTML(
                                    fullName
                                )}
                            </strong>

                        </td>

                        <td>

                            <span
                                class="
                                    status-badge
                                    ${statusClass}
                                "
                            >

                                ${
                                    status ===
                                    "MAIN ADMIN"

                                        ? "👑 MAIN ADMIN"

                                        : status
                                }

                            </span>

                        </td>

                        <td>

    ${maskedEmail}

</td>

                        <td>

    ${maskedPhone}

</td>

                        <td>

    ${maskedAge}

</td>

                        <td>

    ${maskedGender}

</td>

                        <td>

    ${maskedCreatedAt}

</td>

                        <td>

                            ${
                                lastLogin
                                    ? formatDate(
                                        lastLogin
                                    )
                                    : "Never"
                            }

                        </td>

                        <td>

                            ${
                                lastSeen
                                    ? formatDate(
                                        lastSeen
                                    )
                                    : "Never"
                            }

                        </td>

                        <td>

                            ${
                                isOnline
                                    ? `
                                        <span
                                            class="activity-badge online"
                                        >
                                            <span
                                                class="activity-dot"
                                            ></span>
                                            Online
                                        </span>
                                      `
                                    : `
                                        <span
                                            class="activity-badge offline"
                                        >
                                            <span
                                                class="activity-dot"
                                            ></span>
                                            ${escapeHTML(
                                                activityStatus
                                            )}
                                        </span>
                                      `
                            }

                        </td>

                        <td>

                            <div class="user-action-group">

    ${
        canViewUsers
            ? `
                <button
                    type="button"
                    class="view-btn user-view-btn"
                    data-user-id="${escapeHTML(
                        user.id
                    )}"
                >
                    <i
                        class="fa-solid fa-eye"
                    ></i>
                    View
                </button>
            `
            : ""
    }


    ${
        canEditUsers
            ? `
                <button
                    type="button"
                    class="edit-btn user-edit-btn"
                    data-user-id="${escapeHTML(
                        user.id
                    )}"
                >
                    <i
                        class="fa-solid fa-pen"
                    ></i>
                    Edit
                </button>
            `
            : ""
    }


    ${
        canDeleteUsers &&
        user.admin?.role !== "main_admin"
            ? `
                <button
                    type="button"
                    class="delete-btn user-delete-btn"
                    data-user-id="${escapeHTML(
                        user.id
                    )}"
                >
                    <i
                        class="fa-solid fa-trash"
                    ></i>
                    Delete
                </button>
            `
            : ""
    }


    ${actionHTML}

</div>

                        </td>

                    </tr>
                `;
            }
        )
        .join("");

    /*
     * ==========================================================
     * MAKE ADMIN BUTTONS
     * ==========================================================
     */

    tableBody
        .querySelectorAll(
            ".make-admin-btn"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    async () => {

                        await makeUserAdmin(
                            button.dataset.userId
                        );

                    }
                );
            }
        );

    /*
     * ==========================================================
     * REMOVE ADMIN BUTTONS
     * ==========================================================
     */

    tableBody
        .querySelectorAll(
            ".remove-admin-btn"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    async () => {

                        await removeAdmin(
                            button.dataset.userId
                        );

                    }
                );
            }
        );

    /*
     * ==========================================================
     * PERMISSION BUTTONS
     * ==========================================================
     */

    tableBody
        .querySelectorAll(
            ".permission-btn"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    async () => {

                        await openPermissions(
                            button.dataset.userId
                        );

                    }
                );
            }
        );

    /*
 * ==========================================================
 * VIEW USERS
 * ==========================================================
 */

tableBody
    .querySelectorAll(
        ".user-view-btn"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    const isMainAdmin =
                        window.examVerseAdmin?.isMainAdmin === true;

                    const canViewUsers =
                        isMainAdmin ||
                        window.examVerseAdmin?.hasPermission(
                            "users.view"
                        ) === true;


                    if (!canViewUsers) {

                        showAccessDenied(
                            "view users"
                        );

                        return;
                    }


                    showUserDetails(
                        button.dataset.userId
                    );

                }
            );

        }
    );

    /*
     * ==========================================================
     * EDIT USERS
     * ==========================================================
     */

    // ==========================================
// EDIT USERS
// ==========================================
//
// Use event delegation because renderUsers()
// replaces the table rows with innerHTML.
// This keeps Edit working after refresh,
// search, delete, and every table re-render.
//

if (!tableBody.dataset.editHandlerAttached) {

    tableBody.addEventListener(
        "click",
        async event => {

            const button =
                event.target.closest(
                    ".user-edit-btn"
                );

            if (!button) {
                return;
            }

            event.preventDefault();
            event.stopPropagation();

            const userId =
                button.dataset.userId;

            if (!userId) {
                console.error(
                    "Edit User: missing user ID"
                );

                return;
            }

            await editUser(
                userId
            );

        }
    );

    tableBody.dataset.editHandlerAttached =
        "true";

}

    /*
     * ==========================================================
     * DELETE USERS
     * ==========================================================
     */

    tableBody
        .querySelectorAll(
            ".user-delete-btn"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    async () => {

                        await deleteUser(
                            button.dataset.userId
                        );

                    }
                );
            }
        );
}

function setupSearch() {

    const searchInput =
        document.getElementById(
            "userSearch"
        );

    searchInput?.addEventListener(
        "input",
        () => {

            const query =
                searchInput.value
                    .trim()
                    .toLowerCase();

            if (!query) {

                renderUsers(
                    allUsers
                );

                return;
            }

            const filtered =
                allUsers.filter(
                    user => {

                        const name =
                            [
                                user.first_name,
                                user.middle_name,
                                user.last_name
                            ]
                            .filter(Boolean)
                            .join(" ");

                        const email =
                            user.email ||
                            user.admin?.email ||
                            "";

                        const phone =
                            user.phone ||
                            "";

                        return (

                            name
                                .toLowerCase()
                                .includes(query)

                            ||

                            email
                                .toLowerCase()
                                .includes(query)

                            ||

                            phone
                                .toLowerCase()
                                .includes(query)

                        );
                    }
                );

            renderUsers(
                filtered
            );
        }
    );
}

function setupRefresh() {

    const button =
        document.getElementById(
            "refreshUsersBtn"
        );

    button?.addEventListener(
        "click",
        async () => {

            button.disabled =
                true;

            await loadUsers();

            button.disabled =
                false;
        }
    );
}

function setupModal() {

    const modal =
        document.getElementById(
            "userDetailsModal"
        );

    const closeButton =
        document.getElementById(
            "closeUserModal"
        );

    closeButton?.addEventListener(
        "click",
        () => {

            modal.classList.remove(
                "show"
            );
        }
    );

    modal?.addEventListener(
        "click",
        event => {

            if (
                event.target === modal
            ) {

                modal.classList.remove(
                    "show"
                );
            }
        }
    );
}

function showUserDetails(
    userId
) {

    const user =
        allUsers.find(
            item =>
                item.id === userId
        );

    if (!user) {
        return;
    }

    const modal =
        document.getElementById(
            "userDetailsModal"
        );

    const content =
        document.getElementById(
            "userDetailsContent"
        );

    const fullName =
        [
            user.first_name,
            user.middle_name,
            user.last_name
        ]
        .filter(Boolean)
        .join(" ")
        .trim() ||
        "Unnamed User";

    let status =
        "USER";

    if (
        user.admin
    ) {

        status =
            user.admin.role ===
            "main_admin"

                ? "MAIN ADMIN"

                : "ADMIN";
    }

    content.innerHTML = `

        <div class="detail-row">

            <span>Name</span>

            <strong>
                ${escapeHTML(
                    fullName
                )}
            </strong>

        </div>

        <div class="detail-row">

            <span>Status</span>

            <strong>
                ${status}
            </strong>

        </div>

        <div class="detail-row">

            <span>Email</span>

            <strong>
                ${escapeHTML(
                    user.email ||
                    user.admin?.email ||
                    "—"
                )}
            </strong>

        </div>

        <div class="detail-row">

            <span>Phone</span>

            <strong>
                ${escapeHTML(
                    user.phone ||
                    "—"
                )}
            </strong>

        </div>

        <div class="detail-row">

            <span>Age</span>

            <strong>
                ${
                    user.age ??
                    "—"
                }
            </strong>

        </div>

        <div class="detail-row">

            <span>Gender</span>

            <strong>
                ${
                    user.gender
                        ? escapeHTML(
                            user.gender
                        )
                        : "—"
                }
            </strong>

        </div>

        <div class="detail-row">

            <span>Account Created</span>

            <strong>
                ${
                    user.account_created_at
                        ? formatDate(
                            user.account_created_at
                        )
                        : "—"
                }
            </strong>

        </div>

    `;

    modal.classList.add(
        "show"
    );
}

function formatDate(
    value
) {

    if (!value) {
        return "—";
    }

    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "—";
    }

    return date.toLocaleString(
        undefined,
        {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }
    );
}

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
// MASK USER DATA FOR TABLE
// ==========================================

function maskEmail(email) {

    if (!email) {
        return "—";
    }

    const value = String(email).trim();

    if (value.length <= 5) {
        return "xxxxx";
    }

    return (
        escapeHTML(value.slice(0, 3)) +
        "xxx" +
        escapeHTML(value.slice(-2))
    );
}


function maskPhone(phone) {

    if (!phone) {
        return "—";
    }

    const value = String(phone).trim();

    if (value.length <= 5) {
        return "xxxxx";
    }

    return (
        escapeHTML(value.slice(0, 3)) +
        "xxx" +
        escapeHTML(value.slice(-2))
    );
}


function maskPrivateValue(value) {

    if (
        value === null ||
        value === undefined ||
        String(value).trim() === ""
    ) {
        return "—";
    }

    return "XX";
}


function maskGender(value) {

    if (
        value === null ||
        value === undefined ||
        String(value).trim() === ""
    ) {
        return "—";
    }

    return "XXX";
}


function maskCreatedDate(value) {

    if (
        value === null ||
        value === undefined ||
        String(value).trim() === ""
    ) {
        return "—";
    }

    return "XXXX";
}

async function makeUserAdmin(
    userId
) {

    if (
        window.examVerseAdmin?.isMainAdmin !== true &&
        window.examVerseAdmin?.hasPermission(
            "admin_management.make_admin"
        ) !== true
    ) {

        showAccessDenied(
            "make users Admin"
        );

        return;
    }

    const user =
        allUsers.find(
            item =>
                item.id === userId
        );

    if (!user) {
        return;
    }

    const name =
        [
            user.first_name,
            user.middle_name,
            user.last_name
        ]
        .filter(Boolean)
        .join(" ")
        .trim() ||
        "this user";

    const confirmed =
        window.confirm(
            `Make ${name} an Admin?\n\n` +
            `You will be able to assign their ` +
            `permissions after they become an Admin.`
        );

    if (!confirmed) {
        return;
    }

    try {

        const {
            error
        } =
            await supabaseClient.rpc(
                "set_user_admin_role",
                {
                    target_user_id:
                        userId,

                    make_admin:
                        true
                }
            );

        if (error) {
            throw error;
        }

        await loadUsers();

        alert(
            `${name} is now an Admin.`
        );
    }

    catch (error) {

        console.error(
            "Make Admin error:",
            error
        );

        alert(
            error.message ||
            "Unable to make this user an Admin."
        );
    }
}

async function removeAdmin(
    userId
) {

    if (
        window.examVerseAdmin?.isMainAdmin !== true &&
        window.examVerseAdmin?.hasPermission(
            "admin_management.remove_admin"
        ) !== true
    ) {

        showAccessDenied(
            "remove Admin access"
        );

        return;
    }

    const user =
        allUsers.find(
            item =>
                item.id === userId
        );

    if (!user) {
        return;
    }

    const name =
        [
            user.first_name,
            user.middle_name,
            user.last_name
        ]
        .filter(Boolean)
        .join(" ")
        .trim() ||
        "this Admin";

    const confirmed =
        window.confirm(
            `Remove Admin access from ${name}?\n\n` +
            `Their administrator permissions will also be removed.`
        );

    if (!confirmed) {
        return;
    }

    try {

        const {
            error
        } =
            await supabaseClient.rpc(
                "set_user_admin_role",
                {
                    target_user_id:
                        userId,

                    make_admin:
                        false
                }
            );

        if (error) {
            throw error;
        }

        await loadUsers();

        alert(
            `${name} is now a normal User.`
        );
    }

    catch (error) {

        console.error(
            "Remove Admin error:",
            error
        );

        alert(
            error.message ||
            "Unable to remove Admin access."
        );
    }
}

async function openPermissions(
    adminId
) {

    if (
        window.examVerseAdmin?.isMainAdmin !== true &&
        window.examVerseAdmin?.hasPermission(
            "admin_management.change_permissions"
        ) !== true
    ) {

        showAccessDenied(
            "change administrator permissions"
        );

        return;
    }

    const adminUser =
        allUsers.find(
            user =>
                user.id === adminId
        );

    if (!adminUser) {
        return;
    }

    if (
        adminUser.admin?.role !==
        "admin"
    ) {

        alert(
            "This user is not a delegated Admin."
        );

        return;
    }

    try {

        const {
            data,
            error
        } =
            await supabaseClient.rpc(
                "get_admin_permissions",
                {
                    target_admin_id:
                        adminId
                }
            );

        if (error) {
            throw error;
        }

        const currentPermissions =
            Array.isArray(data)
                ? data.map(
                    item =>
                        item.permission
                )
                : [];

        createPermissionModal(
            adminUser,
            currentPermissions
        );
    }

    catch (error) {

        console.error(
            "Permission loading error:",
            error
        );

        alert(
            error.message ||
            "Unable to load permissions."
        );
    }
}

function createPermissionModal(
    adminUser,
    currentPermissions
) {

    const existing =
        document.getElementById(
            "adminPermissionModal"
        );

    if (existing) {
        existing.remove();
    }

    const fullName =
        [
            adminUser.first_name,
            adminUser.middle_name,
            adminUser.last_name
        ]
        .filter(Boolean)
        .join(" ")
        .trim() ||
        "Administrator";

    const permissionGroups = [

        {
            title: "Users",
            icon: "fa-users",

            permissions: [

                {
                    id: "users.view",
                    label: "View"
                },

                {
                    id: "users.edit",
                    label: "Edit"
                },

                {
                    id: "users.delete",
                    label: "Delete"
                }

            ]
        },

        {
            title: "Exams",
            icon: "fa-file-lines",

            permissions: [

                {
                    id: "exams.view",
                    label: "View"
                },

                {
                    id: "exams.create",
                    label: "Create"
                },

                {
                    id: "exams.edit",
                    label: "Edit"
                },

                {
                    id: "exams.delete",
                    label: "Delete"
                }

            ]
        },

        {
            title: "Questions",
            icon: "fa-book",

            permissions: [

                {
                    id: "questions.view",
                    label: "View"
                },

                {
                    id: "questions.create",
                    label: "Create"
                },

                {
                    id: "questions.edit",
                    label: "Edit"
                },

                {
                    id: "questions.delete",
                    label: "Delete"
                }

            ]
        },

        {
            title: "Results",
            icon: "fa-chart-column",

            permissions: [

                {
                    id: "results.view",
                    label: "View"
                }

            ]
        },

        {
            title: "Analytics",
            icon: "fa-chart-line",

            permissions: [

                {
                    id: "analytics.view",
                    label: "View"
                }

            ]
        },

        {
            title: "Settings",
            icon: "fa-gear",

            permissions: [

                {
                    id: "settings.view",
                    label: "View"
                },

                {
                    id: "settings.edit",
                    label: "Edit"
                }

            ]
        },

        {
            title: "Admin Management",
            icon: "fa-user-shield",

            permissions: [

                {
                    id:
                        "admin_management.make_admin",

                    label:
                        "Make Admin"
                },

                {
                    id:
                        "admin_management.change_permissions",

                    label:
                        "Change Permissions"
                },

                {
                    id:
                        "admin_management.remove_admin",

                    label:
                        "Remove Admin"
                }

            ]
        }

    ];

    const modal =
        document.createElement(
            "div"
        );

    modal.id =
        "adminPermissionModal";

    modal.className =
        "admin-permission-modal";

    modal.innerHTML = `

        <div
            class="permission-modal-box"
        >

            <button
                type="button"
                class="permission-close"
                id="permissionCloseBtn"
                aria-label="Close"
            >
                &times;
            </button>

            <div
                class="permission-modal-header"
            >

                <div
                    class="permission-icon"
                >

                    <i
                        class="
                            fa-solid
                            fa-user-shield
                        "
                    ></i>

                </div>

                <div>

                    <h2>
                        Admin Permissions
                    </h2>

                    <p>
                        ${escapeHTML(
                            fullName
                        )}
                    </p>

                </div>

            </div>

            <div
                class="permission-info"
            >
                Choose exactly what this
                administrator can view,
                create, edit or delete.
            </div>

            <div
                class="permission-list"
            >

                ${
                    permissionGroups
                        .map(
                            group => `

                                <div
                                    class="
                                        permission-group
                                    "
                                >

                                    <div
                                        class="
                                            permission-group-title
                                        "
                                    >

                                        <i
                                            class="
                                                fa-solid
                                                ${group.icon}
                                            "
                                        ></i>

                                        <span>
                                            ${group.title}
                                        </span>

                                    </div>

                                    <div
                                        class="
                                            permission-group-options
                                        "
                                    >

                                        ${
                                            group.permissions
                                                .map(
                                                    permission => `

                                                        <label
                                                            class="
                                                                permission-item
                                                            "
                                                        >

                                                            <input
                                                                type="checkbox"
                                                                class="
                                                                    admin-permission-checkbox
                                                                "
                                                                value="${permission.id}"
                                                                ${
                                                                    currentPermissions
                                                                        .includes(
                                                                            permission.id
                                                                        )
                                                                            ? "checked"
                                                                            : ""
                                                                }
                                                            >

                                                            <span
                                                                class="
                                                                    permission-item-text
                                                                "
                                                            >
                                                                ${permission.label}
                                                            </span>

                                                            <span
                                                                class="
                                                                    permission-check
                                                                "
                                                            >

                                                                <i
                                                                    class="
                                                                        fa-solid
                                                                        fa-check
                                                                    "
                                                                ></i>

                                                            </span>

                                                        </label>

                                                    `
                                                )
                                                .join("")
                                        }

                                    </div>

                                </div>

                            `
                        )
                        .join("")
                }

            </div>

            <div
                class="
                    permission-modal-actions
                "
            >

                <button
                    type="button"
                    id="permissionCancelBtn"
                    class="
                        permission-cancel-btn
                    "
                >
                    Cancel
                </button>

                <button
                    type="button"
                    id="permissionSaveBtn"
                    class="
                        permission-save-btn
                    "
                >

                    <i
                        class="
                            fa-solid
                            fa-floppy-disk
                        "
                    ></i>

                    Save Permissions

                </button>

            </div>

        </div>

    `;

    document.body.appendChild(
        modal
    );

    document
        .getElementById(
            "permissionCloseBtn"
        )
        .addEventListener(
            "click",
            () => {

                modal.remove();

            }
        );

    document
        .getElementById(
            "permissionCancelBtn"
        )
        .addEventListener(
            "click",
            () => {

                modal.remove();

            }
        );

    modal.addEventListener(
        "click",
        event => {

            if (
                event.target === modal
            ) {

                modal.remove();

            }
        }
    );

    document
        .getElementById(
            "permissionSaveBtn"
        )
        .addEventListener(
            "click",
            async () => {

                await saveAdminPermissions(
                    adminUser.id,
                    modal
                );

            }
        );
}

async function saveAdminPermissions(
    adminId,
    modal
) {

    const checkboxes =
        modal.querySelectorAll(
            ".admin-permission-checkbox"
        );

    const permissions =
        Array.from(
            checkboxes
        )
        .filter(
            checkbox =>
                checkbox.checked
        )
        .map(
            checkbox =>
                checkbox.value
        );

    const saveButton =
        document.getElementById(
            "permissionSaveBtn"
        );

    if (!saveButton) {
        return;
    }

    saveButton.disabled =
        true;

    saveButton.innerHTML = `

        <i
            class="
                fa-solid
                fa-spinner
                fa-spin
            "
        ></i>

        Saving...

    `;

    try {

        const {
            error
        } =
            await supabaseClient.rpc(
                "set_admin_permissions",
                {
                    target_admin_id:
                        adminId,

                    new_permissions:
                        permissions
                }
            );

        if (error) {
            throw error;
        }

        modal.remove();

/*
 * Re-render this Users page immediately.
 */
await loadUsers();

showAccessMessage(
    "Administrator permissions updated successfully.",
    "success"
);
    }

    catch (error) {

        console.error(
            "Permission save error:",
            error
        );

        showAccessMessage(
            error.message ||
            "Unable to save administrator permissions.",
            "error"
        );

        saveButton.disabled =
            false;

        saveButton.innerHTML = `

            <i
                class="
                    fa-solid
                    fa-floppy-disk
                "
            ></i>

            Save Permissions

        `;
    }
}

function showAccessMessage(
    message,
    type = "error"
) {

    const existing =
        document.getElementById(
            "examVerseAccessMessage"
        );

    if (existing) {
        existing.remove();
    }

    const popup =
        document.createElement(
            "div"
        );

    popup.id =
        "examVerseAccessMessage";

    popup.className =
        `examverse-access-message ${type}`;

    popup.innerHTML = `

        <div
            class="access-message-icon"
        >

            <i
                class="
                    fa-solid
                    ${
                        type === "success"
                            ? "fa-circle-check"
                            : "fa-lock"
                    }
                "
            ></i>

        </div>

        <div
            class="access-message-content"
        >

            <strong>

                ${
                    type === "success"
                        ? "Success"
                        : "Access Denied"
                }

            </strong>

            <span>

                ${escapeHTML(
                    message
                )}

            </span>

        </div>

        <button
            type="button"
            class="access-message-close"
            aria-label="Close"
        >
            &times;
        </button>

    `;

    document.body.appendChild(
        popup
    );

    popup
        .querySelector(
            ".access-message-close"
        )
        .addEventListener(
            "click",
            () => {

                popup.remove();

            }
        );

    setTimeout(
        () => {

            popup.remove();

        },
        4500
    );
}

async function updateLastSeen() {

    try {

        const {
            data: {
                user
            }
        } =
            await supabaseClient
                .auth
                .getUser();

        if (!user) {
            return;
        }

        const {
            error
        } =
            await supabaseClient.rpc(
                "update_my_last_seen"
            );

        if (error) {

            console.error(
                "Last seen update failed:",
                error
            );
        }
    }

    catch (error) {

        console.error(
            "Last seen error:",
            error
        );
    }
}

async function startLastSeenTracking() {

    await updateLastSeen();

    setInterval(
        updateLastSeen,
        60 * 1000
    );
}

async function editUser(userId) {

    if (
        window.examVerseAdmin?.hasPermission(
            "users.edit"
        ) !== true
    ) {
        showAccessDenied("edit users");
        return;
    }

    const targetId =
        String(userId || "").trim();

    if (!targetId) {
        alert("Invalid user ID.");
        return;
    }

    const user =
        allUsers.find(
            item =>
                String(item.id || "").trim() ===
                targetId
        );

    if (!user) {
        alert(
            "User not found. Please refresh the Users page."
        );
        return;
    }


    /* ================================
       GET EDIT VALUES
       ================================ */

    const firstName =
        prompt(
            "First name:",
            user.first_name || ""
        );

    if (firstName === null) return;


    const middleName =
        prompt(
            "Middle name:",
            user.middle_name || ""
        );

    if (middleName === null) return;


    const lastName =
        prompt(
            "Last name:",
            user.last_name || ""
        );

    if (lastName === null) return;


    const phone =
        prompt(
            "Phone:",
            user.phone || ""
        );

    if (phone === null) return;


    const ageInput =
        prompt(
            "Age:",
            user.age ?? ""
        );

    if (ageInput === null) return;


    let age = null;

    const cleanAge =
        String(ageInput).trim();


    if (cleanAge !== "") {

        age =
            Number(cleanAge);

        if (
            !Number.isInteger(age) ||
            age < 1 ||
            age > 120
        ) {

            alert(
                "Age must be between 1 and 120."
            );

            return;
        }
    }


    const gender =
        prompt(
            "Gender:",
            user.gender || ""
        );

    if (gender === null) return;


    /* ================================
       ADMIN UPDATE
       ================================ */

    try {

        const {
            error
        } =
            await supabaseClient.rpc(
                "admin_edit_user_profile",
                {

                    target_user_id:
                        targetId,

                    new_first_name:
                        String(firstName).trim(),

                    new_middle_name:
                        String(middleName).trim(),

                    new_last_name:
                        String(lastName).trim(),

                    new_phone:
                        String(phone).trim(),

                    new_age:
                        age,

                    new_gender:
                        String(gender).trim()

                }
            );


        if (error) {
            throw error;
        }


        /* ================================
           REFRESH TABLE
           ================================ */

        await loadUsers();


        alert(
            "User information updated successfully."
        );

    }

    catch (error) {

        console.error(
            "Admin user edit failed:",
            error
        );

        alert(
            error?.message ||
            "The user's information could not be updated."
        );
    }
}

async function deleteUser(
    userId
) {

    if (
        !window.examVerseAdmin?.hasPermission(
            "users.delete"
        )
    ) {

        showAccessDenied(
            "delete users"
        );

        return;
    }

    const user =
        allUsers.find(
            item =>
                item.id === userId
        );

    if (!user) {
        return;
    }

    const name =
        [
            user.first_name,
            user.middle_name,
            user.last_name
        ]
        .filter(Boolean)
        .join(" ")
        .trim() ||
        "this user";

    const confirmed =
        window.confirm(
            `Delete ${name}?\n\n` +
            `This action cannot be undone.`
        );

    if (!confirmed) {
        return;
    }

    try {

        const {
            error
        } =
            await supabaseClient.rpc(
                "delete_user_profile",
                {
                    target_user_id:
                        userId
                }
            );

        if (error) {
            throw error;
        }

        await loadUsers();

        showPopup(
            "success",
            "User Deleted",
            `${name} has been removed successfully.`
        );
    }

    catch (error) {

        console.error(
            "Delete user error:",
            error
        );

        showPopup(
            "error",
            "Unable to Delete User",
            error.message ||
            "The user could not be deleted."
        );
    }
}

function showAccessDenied(
    action
) {

    showPopup(
        "error",
        "Access Restricted",
        `You don't have permission to ${action}. Please contact the Main Admin.`
    );
}

function setupUsersTableScroll() {

    const scrollContainer =
        document.getElementById(
            "usersTableScroll"
        );

    const leftButton =
        document.getElementById(
            "usersScrollLeft"
        );

    const rightButton =
        document.getElementById(
            "usersScrollRight"
        );

    if (
        !scrollContainer ||
        !leftButton ||
        !rightButton
    ) {

        console.warn(
            "Users table scroll controls not found."
        );

        return;
    }

    const scrollAmount = 500;

    leftButton.addEventListener(
        "click",
        function () {

            scrollContainer.scrollBy({

                left:
                    -scrollAmount,

                behavior:
                    "smooth"

            });
        }
    );

    rightButton.addEventListener(
        "click",
        function () {

            scrollContainer.scrollBy({

                left:
                    scrollAmount,

                behavior:
                    "smooth"

            });
        }
    );

    console.log(
        "Users table horizontal scroll ready."
    );
}
