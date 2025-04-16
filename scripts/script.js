/** @format */

//Possible script for an image ("tv") to show on the home page upon clicking on the Larry logo
document.getElementById("logo").addEventListener("click", function () {
  const tv = document.getElementById("style-examples");
  tv.style.display = tv.style.display === "block" ? "none" : "block";
});
