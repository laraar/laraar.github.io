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
  form.classList.toggle("hidden");
});

//Cancel button for form
document.getElementById("cancel").addEventListener("click", function () {
  form.classList.toggle("hidden");
});

window.addEventListener("resize", function () {
  if (menu.classList.contains("visible")) {
    menu.classList.remove("visible");
    menu.classList.add("hidden");
  }
});

document.addEventListener("click", function (event) {
  if (!menu.contains(event.target) && !toggleMenuBtn.contains(event.target)) {
    menu.classList.remove("visible");
    menu.classList.add("hidden");
  }
});

// Hide form upon submit, and then execute the submission function. ()
form.addEventListener("submit", function (event) {
  event.preventDefault(); // Prevent the default form submission (which triggers the redirect)

  // Hide the form immediately upon submission
  form.classList.toggle("hidden"); // This keeps it invisible but still in the document flow

  // Create a FormData object to collect the form data
  const formData = new FormData(form);

  // Use Fetch API to submit the form data to the Google Apps Script Web App
  fetch(form.action, {
    method: "POST",
    body: formData,
  })
    .then((response) => response.text()) // Parse the response as text
    .then((data) => {
      // Optionally, you can handle the response here if you need
      console.log("Form submission successful:", data);
    })
    .catch((error) => {
      console.error("Error submitting form:", error);
    });
});
//Should really add some sort of notice to the user to indicate that the submission worked. Later
