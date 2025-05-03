/** @format */

// Code to handle graphic art image gallery``
if (window.location.pathname === "/graphicart.html") {
  // Code that runs only on /about.html

  const overlay = document.getElementById("overlay");
  const overlayImg = document.getElementById("overlay-img");
  const gridImages = document.querySelectorAll(".grid-img");

  let currentIndex = -1; // index of the currently viewed image

  // Show overlay with a specific image
  function showImage(index) {
    if (index < 0) index = gridImages.length - 2; // Change this to 1 at the end if there is no "more to come" image in the cycle
    if (index >= gridImages.length - 1) index = 0; // Change this to remove the -1 if there is no "more to come" image in the cycle
    currentIndex = index;
    overlayImg.src = gridImages[currentIndex].src;
    overlay.classList.add("visible");
  }

  // Hide overlay
  function hideOverlay() {
    overlay.classList.remove("visible");
    currentIndex = -1;
  }

  // When any image is clicked
  gridImages.forEach((img, index) => {
    img.addEventListener("click", () => {
      showImage(index);
    });
  });

  // Clicking the overlay hides it
  overlay.addEventListener("click", () => {
    hideOverlay();
  });

  // Keyboard controls
  document.addEventListener("keydown", (e) => {
    if (!overlay.classList.contains("visible")) return;

    if (e.key === "Escape") {
      hideOverlay();
    } else if (e.key === "ArrowLeft") {
      showImage(currentIndex - 1);
    } else if (e.key === "ArrowRight") {
      showImage(currentIndex + 1);
    }
  });

  // Deal with touch swiping left and right toolbar
  let touchStartX = 0;
  let touchEndX = 0;

  document.addEventListener("touchstart", (e) => {
    if (!overlay.classList.contains("visible")) return;
    touchStartX = e.changedTouches[0].screenX;
  });

  document.addEventListener("touchend", (e) => {
    if (!overlay.classList.contains("visible")) return;
    touchEndX = e.changedTouches[0].screenX;
    handleGesture();
  });

  function handleGesture() {
    const swipeThreshold = 50; // Minimum distance for a swipe
    const swipeDistance = touchEndX - touchStartX;

    if (Math.abs(swipeDistance) > swipeThreshold) {
      if (swipeDistance > 0) {
        // Swiped right
        showImage(currentIndex - 1);
      } else {
        // Swiped left
        showImage(currentIndex + 1);
      }
    }
  }
}

const toggleMenuBtn = document.getElementById("menu-button");
const triangle = document.getElementById("triangle");
const bodyOverlay = document.getElementById("body-overlay");
toggleMenuBtn.addEventListener("click", () => {
  // triangle.classList.toggle("visible");
  // triangle.classList.toggle("hidden");
  triangle.classList.toggle("active");
  bodyOverlay.classList.toggle("active");
});

function toggleTriangle() {
  alert("pressed");
  const triangle = document.getElementById("triangle");
}

const toggleContactForm = document.getElementById("contact-button");
const form = document.getElementById("contact-form");
toggleContactForm.addEventListener("click", () => {
  form.classList.toggle("hidden");
});

//Cancel button for form
document.getElementById("cancel").addEventListener("click", function () {
  form.classList.toggle("hidden");
});

// window.addEventListener("resize", function () {
//   if (menu.classList.contains("visible")) {
//     menu.classList.remove("visible");
//     menu.classList.add("hidden");
//   }
// });

// document.addEventListener("click", function (event) {
//   if (!menu.contains(event.target) && !toggleMenuBtn.contains(event.target)) {
//     menu.classList.remove("visible");
//     menu.classList.add("hidden");
//   }
// });

// Hide form upon submit, and then execute the submission function. ()
form.addEventListener("submit", function (event) {
  event.preventDefault(); // Prevent the default form submission (which triggers the redirect)

  // Hide the form immediately upon submission
  form.classList.toggle("hidden"); // This keeps it invisible but still in the document flow

  alert("Form submission is under construction...");
  return;

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

//Preload images for graphic art page
const barShowImages = [
  "BarShow2009.webp",
  "BarShow2010.webp",
  "BarShow2011.webp",
  "BarShow2012.webp",
  "BarShow2013.webp",
  "BarShow2014.webp",
  "BarShow2014b.webp",
  "BarShow2015.webp",
  "BarShow2016.webp",
  "BarShow2017.webp",
  "BarShow2018.webp",
  "BarShow2019.webp",
  "BarShow2020.webp",
  "BarShow2024.webp",
  "BarShow2025.webp",
];
window.addEventListener("load", () => {
  barShowImages.forEach((filename) => {
    const img = new Image();
    img.src = `/images/BarShow/${filename}`;
  });
});
