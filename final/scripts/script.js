/** @format */

if ("scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}

const contactButton = document.getElementById("contact-button");
const form = document.getElementById("contact-form");
const firstField = document.getElementById("name");
const fullDarkeningOverlay = document.querySelector(".full-darkening-overlay");
const menuButton = document.getElementById("menu-button");
const menuTriangle = document.getElementById("menu-triangle-wrapper");
const darkeningOverlay = document.querySelector(".darkening-overlay");

//Manage whether the page can scroll. (For use when presenting an overlay below.)
let scrollY = 0;
function stopScrolling() {
  scrollY = window.scrollY; // Save the current vertical scroll position
  document.body.style.position = "fixed";
  document.body.style.top = `-${scrollY}px`;
  document.body.style.width = "100%";
}
function startScrolling() {
  document.body.style.position = "";
  document.body.style.top = "";
  document.body.style.width = "";
  window.scrollTo(0, scrollY); // Restore scroll position
}

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
    stopScrolling();
  }

  function hideOverlay() {
    overlay.classList.remove("visible");
    currentIndex = -1;
    startScrolling();
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

//Show or hide the menu, and when showing the menu, freeze background scrolling
function showMenu() {
  menuTriangle.classList.add("active");
  darkeningOverlay.classList.add("active");
  stopScrolling();
}
function hideMenu() {
  menuTriangle.classList.remove("active");
  darkeningOverlay.classList.remove("active");
  startScrolling();
}

menuButton.addEventListener("click", () => {
  if (menuTriangle.classList.contains("active")) {
    hideMenu();
  } else {
    showMenu();
  }
});
window.addEventListener("resize", function () {
  if (menuTriangle.classList.contains("active")) {
    hideMenu();
  }
});
document.addEventListener("click", function (event) {
  if (
    !menuButton.contains(event.target) &&
    !contactButton.contains(event.target) &&
    !contactForm.contains(event.target)
  ) {
    hideMenu();
  }
});

// Undo the click color on the menu button after 200ms
menuButton.addEventListener("pointerdown", () => {
  menuButton.classList.add("touched");
  setTimeout(() => {
    menuButton.classList.remove("touched");
  }, 200);
});

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
  "BarShow/BarShow2009.webp",
  "BarShow/BarShow2010.webp",
  "BarShow/BarShow2011.webp",
  "BarShow/BarShow2012.webp",
  "BarShow/BarShow2013.webp",
  "BarShow/BarShow2014.webp",
  "BarShow/BarShow2014b.webp",
  "BarShow/BarShow2015.webp",
  "BarShow/BarShow2016.webp",
  "BarShow/BarShow2017.webp",
  "BarShow/BarShow2018.webp",
  "BarShow/BarShow2019.webp",
  "BarShow/BarShow2020.webp",
  "BarShow/BarShow2024.webp",
  "BarShow/BarShow2025.webp",
  "OtherArt/GlassBowlingBall.webp",
  "OtherArt/HexIn3D.webp",
  "OtherArt/LarryInPixels.webp",
  "OtherArt/TrickOrTree.webp",
  "OtherArt/TriColoredGlobe.webp",
];
window.addEventListener("load", () => {
  window.scrollTo(0, 0);
  barShowImages.forEach((filename) => {
    const img = new Image();
    img.src = `/images/${filename}`;
  });
});

function addVideoScrolling() {
  const left = document.querySelector(".left-column");
  const right = document.querySelector(".right-column");
  const spacer = document.getElementById("scroll-spacer");
  const maxHeight = Math.max(
    left.offsetTop + left.offsetHeight,
    right.offsetTop + right.offsetHeight
  );
  spacer.style.height = maxHeight + "px";
}

// function positionMedia(videoContainer) {
//   return;
//   const media = videoContainer.querySelectorAll(".media");
//   const tvShell = videoContainer.querySelector(".tv-shell");
//   if (!media[0] || !tvShell) return;

//   // Read the anchor points from image2's data attributes
//   const topPct = parseFloat(tvShell.dataset.top);
//   const leftPct = parseFloat(tvShell.dataset.left);
//   const bottomPct = parseFloat(tvShell.dataset.bottom);
//   const rightPct = parseFloat(tvShell.dataset.right);

//   // These calculate how far the top-left corner of tvShell is from the top-left of the container.
//   const containerRect = videoContainer.getBoundingClientRect();
//   const tvShellRect = tvShell.getBoundingClientRect();

//   // These calculate how far the top-left corner of tvShell is from the top-left of the container.
//   const offsetX = tvShellRect.left - containerRect.left;
//   const offsetY = tvShellRect.top - containerRect.top;

//   // Get the dimensions of the tvShell
//   const tvShellWidth = tvShellRect.width;
//   const tvShellHeight = tvShellRect.height;

//   // These lines turn the percent values from the data-* attributes into actual pixel coordinates inside the container.
//   const left = offsetX + (leftPct / 100) * tvShellWidth;
//   const top = offsetY + (topPct / 100) * tvShellHeight;
//   const right = offsetX + tvShellWidth - (rightPct / 100) * tvShellWidth;
//   const bottom = offsetY + tvShellHeight - (bottomPct / 100) * tvShellHeight;

//   // These calculate the final size. Namely, derive the pixel dimensions of the .media element based on the bounding box formed by top/left and bottom/right.
//   const width = right - left;
//   const height = bottom - top;

//   // Then assign the absolute pixel positions for the image in the container,
//   // to be positioned as designatged in the tv-shell.
//   media.forEach((mediaInstance, index) => {
//     mediaInstance.style.position = "absolute";
//     mediaInstance.style.left = `${left}px`;
//     mediaInstance.style.top = `${top}px`;
//     mediaInstance.style.width = `${width}px`;
//     mediaInstance.style.height = `${height}px`;
//     mediaInstance.style.objectFit = "fill";
//   });
// }

// Run the positionMedia function for each element of class .video-container if any
// function positionAllMedia() {
//   const allVideoContainers = document.querySelectorAll(".video-container");
//   if (allVideoContainers.length > 0) {
//     allVideoContainers.forEach(positionMedia);
//   }
// }

window.addEventListener("load", () => {
  // position media in tv-shells if there are any .video-container elements on the page.
  // positionAllMedia();

  // Set scanlines in header dynamically based on logo height
  const logo = document.getElementById("logo");
  const scanlines = document.querySelector(".scanlines");
  const resizeObserver = new ResizeObserver((entries) => {
    const entry = entries[0];
    const height = entry.contentRect.height;
    const stripeHeight = height / 45;
    scanlines.style.backgroundImage = `
      repeating-linear-gradient(
        to bottom,
        rgba(21, 21, 21, 0.4),
        rgba(21, 21, 21, 0.4) ${stripeHeight / 3}px,
        transparent ${stripeHeight / 3}px,
        transparent ${stripeHeight}px
      )
    `;
  });
  resizeObserver.observe(logo);
});

window.addEventListener("load", () => {
  // Set attributes of all YouTube video frames, to avoid having to repeat them in HTML.
  const videos = document.querySelectorAll(".video");
  if (videos.length > 0) {
    videos.forEach((iframe) => {
      iframe.setAttribute("frameborder", "0");
      iframe.setAttribute(
        "allow",
        "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      );
      iframe.setAttribute("referrerpolicy", "no-referrer");
    });
  }
});

window.addEventListener("load", () => {
  if (window.location.pathname === "/video.html") {
    addVideoScrolling();
  }
});

window.addEventListener("resize", () => {
  if (window.location.pathname === "/video.html") {
    addVideoScrolling();
  }
});
