/* Set the width of the side navigation to 250px */
function openNav() {
  document.getElementById("mySidenav").style.width = "250px";

  // Pushing content
  document.getElementById("main").style.marginLeft = "250px";
  // document.getElementById("main").style.marginRight = "-250px";
}

/* Set the width of the side navigation to 0 */
function closeNav() {
  document.getElementById("mySidenav").style.width = "0";
  document.getElementById("main").style.marginLeft = "0";
  // document.getElementById("main").style.marginRight = "auto";
  document.body.style.backgroundColor = "white";
}
