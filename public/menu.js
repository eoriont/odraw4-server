var navState = false;
var toolBtns;
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

  let toolIds = ["toolPencil", "toolRect", "toolEllipse", "toolLine"];
  toolBtns = toolIds.map(document.getElementById.bind(document));
  for (let btn of toolBtns) {
    btn.addEventListener("click", (e) =>
      changeTool(e.target.attributes.name.value)
    );
  }
  changeTool("pencil");

  let fillShape = document.getElementById("fillShape");
  fillShape.value = currentStyle.fillShape;
  fillShape.addEventListener("input", (e) => {
    currentStyle.fillShape = e.target.checked;
  });

  let colorPickModeBtn = document.getElementById("colorPickMode");
  colorPickModeBtn.addEventListener("click", (e) => {
    colorPickMode = true;
  });
});

function changeTool(newTool) {
  currentType = newTool;
  for (let btn of toolBtns) {
    if (btn.attributes.name.value == newTool) {
      btn.style.backgroundColor = "#FFF";
    } else {
      btn.style.backgroundColor = "transparent";
    }
  }
}

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
