const form = document.getElementById("forgotForm");

form.addEventListener("submit", function(e){

    e.preventDefault();

    const phone = document.getElementById("phone").value.trim();

    const users = Storage.getUsers();

    const user = users.find(u => u.phone === phone);

    if(!user){

        alert("Phone number not found.");

        return;

    }

    alert(
`Your password is:

${user.password}`
    );

});