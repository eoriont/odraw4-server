var navState = false;
var toolBtns;

var canvas, ctx;

window.addEventListener("resize", (e) => {
  windowSize = [window.innerWidth, window.innerHeight];
  sizeCanvas(canvas, windowSize);
  drawAllActions();
});

function sizeCanvas(c, size) {
  c.width = size[0];
  c.height = size[1];
}

document.addEventListener("contextmenu", (event) => event.preventDefault());

document.addEventListener("DOMContentLoaded", () => {
  canvas = document.getElementById("canvas");
  ctx = canvas.getContext("2d");
  windowSize = [window.innerWidth, window.innerHeight];
  sizeCanvas(canvas, windowSize);

  window.focus();
  document
    .getElementById("close")
    .parentElement.addEventListener("click", closeNav);

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
    btn.parentElement.addEventListener("click", (e) => {
      let elm = e.target.classList.contains("menu-option")
        ? e.target.children[0]
        : e.target;
      changeTool(elm.attributes.name.value);
    });
  }
  changeTool("pencil");

  let fillShapeBtn = document.getElementById("fillShape").parentElement;
  setFillShapeMode(false);
  fillShapeBtn.addEventListener("click", () =>
    setFillShapeMode(!currentStyle.fillShape)
  );

  let colorPickModeBtn = document.getElementById("colorPickMode").parentElement;
  setColorPickMode(false);
  colorPickModeBtn.addEventListener("click", () =>
    setColorPickMode(!colorPickMode)
  );
});

function setColorPickMode(state) {
  let elm = document.getElementById("colorPickMode").parentElement;
  if (state) {
    colorPickMode = true;
    elm.style.backgroundColor = "orange";
  } else {
    colorPickMode = false;
    elm.style.backgroundColor = "transparent";
  }
}

function setFillShapeMode(state) {
  let elm = document.getElementById("fillShape").parentElement;
  if (state) {
    currentStyle.fillShape = true;
    elm.style.backgroundColor = "lightblue";
  } else {
    currentStyle.fillShape = false;
    elm.style.backgroundColor = "transparent";
  }
}

function changeTool(newTool) {
  currentType = newTool;
  for (let btn of toolBtns) {
    let elm = btn.parentElement;
    if (btn.attributes.name.value == newTool) {
      elm.style.backgroundColor = "#FFF";
    } else {
      elm.style.backgroundColor = "transparent";
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
