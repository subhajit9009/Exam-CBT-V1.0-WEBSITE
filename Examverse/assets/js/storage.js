/* ==========================================
   ExamVerse Storage Manager
   Created by Subhajit Paul
========================================== */

const Storage = {

    USER_KEY: "users",
    CURRENT_USER_KEY: "currentUserId",

    // ==========================
    // Get All Users
    // ==========================

    getUsers() {

        return JSON.parse(localStorage.getItem(this.USER_KEY)) || [];

    },

    // ==========================
    // Save Users
    // ==========================

    saveUsers(users) {

        localStorage.setItem(
            this.USER_KEY,
            JSON.stringify(users)
        );

    },

    // ==========================
    // Add User
    // ==========================

    addUser(user) {

        const users = this.getUsers();

        users.push(user);

        this.saveUsers(users);

    },

    // ==========================
    // Update User
    // ==========================

    updateUser(updatedUser) {

        const users = this.getUsers();

        const index = users.findIndex(
            user => user.id === updatedUser.id
        );

        if (index !== -1) {

            users[index] = updatedUser;

            this.saveUsers(users);

        }

    },

    // ==========================
    // Check Phone Exists
    // ==========================

    userExists(phone) {

        return this.getUsers().some(
            user => user.phone === phone
        );

    },

    // ==========================
    // Get User By Phone
    // ==========================

    getUserByPhone(phone) {

        return this.getUsers().find(
            user => user.phone === phone
        );

    },

    // ==========================
    // Login
    // ==========================

    login(user) {

    localStorage.setItem(
        this.CURRENT_USER_KEY,
        JSON.stringify(user)
    );

},

    // ==========================
    // Logout
    // ==========================

    logout() {

        localStorage.removeItem(
            this.CURRENT_USER_KEY
        );

    },

    // ==========================
    // Current User
    // ==========================

    getCurrentUser() {

    const user = localStorage.getItem(
        this.CURRENT_USER_KEY
    );

    if (!user) {

        return null;

    }

    return JSON.parse(user);

},

};