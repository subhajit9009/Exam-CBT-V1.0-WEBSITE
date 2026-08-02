const startBtn=document.getElementById("startBtn");

const popup=document.getElementById("privacyPopup");

const accept=document.getElementById("acceptBtn");

const reject=document.getElementById("rejectBtn");

startBtn.onclick=()=>{

if(localStorage.getItem("privacyAccepted")){

window.location="register.html";

}

else{

popup.style.display="flex";

}

};

accept.onclick=()=>{

localStorage.setItem("privacyAccepted","yes");

window.location="register.html";

};

reject.onclick=()=>{

alert("You must accept the Privacy Policy to continue.");

popup.style.display="none";

};