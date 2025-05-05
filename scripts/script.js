/** @format */

// Code to handle graphic art image gallery``
if (window.location.pathname === "/graphicart.html") {
  // Code that runs only on /about.html

  const overlay = document.getElementById("overlay");
  const overlayImg = document.getElementById("overlay-img");

  let currentImages = [];
  let currentIndex = -1;

  const grids = document.querySelectorAll(".grid");

  grids.forEach((grid) => {
    const images = grid.querySelectorAll(".grid-img");
    images.forEach((img, idx) => {
      img.addEventListener("click", () => {
        currentImages = Array.from(images); // Only images in this grid
        showImage(idx);
      });
    });
  });

  function showImage(index) {
    if (index < 0) index = currentImages.length - 1;
    if (index >= currentImages.length) index = 0;
    currentIndex = index;
    overlayImg.src = currentImages[currentIndex].src;
    overlay.classList.add("visible");
  }

  function hideOverlay() {
    overlay.classList.remove("visible");
    currentIndex = -1;
  }

  // Overlay click to close
  overlay.addEventListener("click", hideOverlay);

  // Keyboard navigation
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
}

const menuButton = document.getElementById("menu-button");
const menuTriangle = document.getElementById("menu-triangle-wrapper");
const darkeningOverlay = document.querySelector(".darkening-overlay");
menuButton.addEventListener("click", () => {
  // triangle.classList.toggle("visible");
  // triangle.classList.toggle("hidden");
  menuTriangle.classList.toggle("active");
  darkeningOverlay.classList.toggle("active");
});
window.addEventListener("resize", function () {
  if (menuTriangle.classList.contains("active")) {
    menuTriangle.classList.toggle("active");
    darkeningOverlay.classList.toggle("active");
  }
});
document.addEventListener("click", function (event) {
  if (!menuButton.contains(event.target)) {
    menuTriangle.classList.remove("active");
    darkeningOverlay.classList.remove("active");
  }
});

// Undo the click color on the menu button after 200ms
menuButton.addEventListener("pointerdown", () => {
  menuButton.classList.add("touched");
  setTimeout(() => {
    menuButton.classList.remove("touched");
  }, 200);
});

const contactButton = document.getElementById("contact-button");
const form = document.getElementById("contact-form");
const firstField = document.getElementById("name");
const fullDarkeningOverlay = document.querySelector(".full-darkening-overlay");
contactButton.addEventListener("click", () => {
  form.classList.toggle("hidden");
  firstField.focus();
  fullDarkeningOverlay.classList.toggle("active");
});

// Undo the click color on the menu button after 200ms
contactButton.addEventListener("pointerdown", () => {
  contactButton.classList.add("touched");
  setTimeout(() => {
    contactButton.classList.remove("touched");
  }, 200);
});

//Cancel button for form
document.getElementById("cancel").addEventListener("click", function () {
  form.classList.toggle("hidden");
  fullDarkeningOverlay.classList.toggle("active");
});

// Hide form upon submit, and then execute the submission function. ()
form.addEventListener("submit", function (event) {
  event.preventDefault(); // Prevent the default form submission (which triggers the redirect)
  alert("Form submission is under construction...");
  // Hide the form immediately upon submission
  form.classList.toggle("hidden"); // This keeps it invisible but still in the document flow
  fullDarkeningOverlay.classList.toggle("active");

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

// Go to top of page on page load
window.addEventListener("load", function () {
  window.scrollTo(0, 0);
});
