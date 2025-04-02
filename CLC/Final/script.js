/** @format */

// Set the width of the svg viewbox for the monitor sides to be vw.
function updateViewBox() {
  const svgSides = document.getElementById("monitorborder-sides");
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  // Set viewBox dynamically to match viewport dimensions
  svgSides.setAttribute("viewBox", `0 0 ${viewportWidth} ${viewportHeight}`);
}

// Update viewBox on load and resize
window.addEventListener("load", updateViewBox);
window.addEventListener("resize", updateViewBox);
