/** @format */

//Possible script for an image ("tv") to show on the home page upon clicking on the Larry logo
document.getElementById("logo").addEventListener("click", function () {
  const tv = document.getElementById("style-examples");
  tv.style.display = tv.style.display === "block" ? "none" : "block";
});

const toggleMenuBtn = document.getElementById("menu-button");
const menu = document.getElementById("dropdown-menu");
toggleMenuBtn.addEventListener("click", () => {
  menu.classList.toggle("visible");
  menu.classList.toggle("hidden");
});

const toggleContactForm = document.getElementById("contact-button");
const form = document.getElementById("contact-form");
toggleContactForm.addEventListener("click", () => {
  form.classList.toggle("visible");
  form.classList.toggle("hidden");
});
