/** @format */

if ("scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}

const contactButton = document.getElementById("contact-button");
const contactForm = document.getElementById("contact-form");
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
    console.log(overlayImg.src);
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
    menuTriangle.classList.contains("active") &&
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
  if (!contactForm.classList.contains("hidden")) {
    contactForm.reset();
    contactForm.classList.add("hidden");
  } else {
    contactForm.classList.remove("hidden");
  }
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
  contactForm.reset();
  contactForm.classList.add("hidden");
  fullDarkeningOverlay.classList.toggle("active");
});

// Hide form upon submit, and then execute the submission function. ()
contactForm.addEventListener("submit", function (event) {
  // Hide the form immediately upon submission
  contactForm.classList.add("hidden"); // This keeps it invisible but still in the document flow
  fullDarkeningOverlay.classList.toggle("active");
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

//Add contact-form action - adds URL coded here
document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("contact-form");
  if (form) {
    const encoded = "aHR0cHM6Ly9mb3Jtc3ByZWUuaW8vZi9tYmxvcW56dg==";
    console.log(atob(encoded));
    form.setAttribute("action", atob(encoded));
  }
});

window.addEventListener("load", () => {
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

  if (window.location.pathname === "/video.html") {
    addVideoScrolling();
  }
});

window.addEventListener("resize", () => {
  if (window.location.pathname === "/video.html") {
    addVideoScrolling();
  }
});

var form = document.getElementById("contact-form");

async function handleSubmit(event) {
  event.preventDefault();
  var status = document.getElementById("my-form-status");
  var data = new FormData(event.target);
  fetch(event.target.action, {
    method: form.method,
    body: data,
    headers: {
      Accept: "application/json",
    },
  })
    .then((response) => {
      if (response.ok) {
        status.innerHTML = "Thanks!";
        form.reset();
      } else {
        response.json().then((data) => {
          if (Object.hasOwn(data, "errors")) {
            status.innerHTML = data["errors"].map((error) => error["message"]).join(", ");
          } else {
            status.innerHTML = "Oops! There was a problem submitting your form";
          }
        });
      }
    })
    .catch((error) => {
      status.innerHTML = "Oops! There was a problem submitting your form";
    });

  // Step 1: Make sure the status div is in the DOM
  status.style.display = "block";
  // Step 2: Wait a tick for layout to update, then fade in
  requestAnimationFrame(() => {
    status.classList.add("visible");
  });
  // Step 3: Wait 2 seconds, then fade out
  setTimeout(() => {
    status.classList.remove("visible");
    // Step 4: After fade-out, hide again
    setTimeout(() => {
      status.style.display = "none";
    }, 500); // match CSS transition duration
  }, 2000);
}
form.addEventListener("submit", handleSubmit);
