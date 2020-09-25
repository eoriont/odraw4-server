var navState = false;
document.addEventListener("DOMContentLoaded", () => {
  window.focus();
  document.getElementById("close").onclick = () => closeNav();

  document.addEventListener("keydown", (e) => {
    if (e.code == "Space") {
      toggleNav();
    }
  });

  let colorPicker = document.getElementById("colorPicker");
  colorPicker.value = currentStyle.color;
  colorPicker.addEventListener("input", (e) => {
    currentStyle.color = e.target.value;
  });

  let brushSize = document.getElementById("brushSize");
  brushSize.value = currentStyle.brushSize;
  brushSize.addEventListener("input", (e) => {
    currentStyle.brushSize = e.target.value;
  });
});

function toggleNav() {
  if (navState) closeNav();
  else openNav();
}

function openNav() {
  navState = true;
  document.getElementById("menu").style.left = "0px";
}

function closeNav() {
  navState = false;
  document.getElementById("menu").style.left = "-250px";
}
