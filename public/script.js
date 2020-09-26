var roomId = location.href
  .split("/")
  .filter((x) => x !== "")
  .pop();

const socket = io.connect("/canvas", {
  query: "roomId=" + roomId,
});
var userId;
var canvas, ctx;
var actions = {};
var mouseDown = false;
var currentAction = null;
var windowSize = [];
var clientActionList = [];
var actionIndex = 0;
var currentStyle = {
  color: "#FFFFFF",
  brushSize: 5,
  fillShape: false,
};
var currentType = "pencil";
var colorPickMode = false;
var canvasStyle = {};

document.addEventListener("DOMContentLoaded", () => {
  canvas = document.getElementById("canvas");
  canvas.style.backgroundColor = canvasStyle.backgroundColor;
  ctx = canvas.getContext("2d");
  windowSize = [window.innerWidth, window.innerHeight];
  sizeCanvas(canvas, windowSize);
});

window.addEventListener("resize", (e) => {
  windowSize = [window.innerWidth, window.innerHeight];
  sizeCanvas(canvas, windowSize);
  drawAllActions();
});

document.addEventListener("contextmenu", (event) => event.preventDefault());

document.addEventListener("mousedown", (e) => {
  if (e.target.id != "canvas") return;
  if (e.button != 0) return; //left click only
  if (colorPickMode) {
    let imageData = ctx.getImageData(e.offsetX, e.offsetY, 1, 1);
    currentStyle.color = rgbToHex(...imageData.data);
    colorPicker.value = currentStyle.color;
    colorPickMode = false;
    return;
  }
  mouseDown = true;
  newAction([[e.offsetX, e.offsetY]]);
  drawAction(actions[currentAction]);
});

function componentToHex(c) {
  var hex = c.toString(16);
  return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(r, g, b) {
  return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

function newAction(points) {
  actionIndex++;

  let id = newId();
  let newAction = {
    points,
    style: Object.assign({}, currentStyle),
    id,
    actionType: currentType,
  };

  socket.emit("newAction", newAction);
  currentAction = id;
  clientActionList.push(currentAction);
  actions[id] = newAction;
}

function newId() {
  return userId + actionIndex;
}

document.addEventListener("keydown", (e) => {
  let code = e.code;
  let metaKey = e.ctrlKey || e.metaKey;
  let altKey = e.altKey;
  if (code == "KeyC" && metaKey && altKey) {
    // Clear
    clear();
    socket.emit("clear");
  }
  if (code == "KeyZ" && metaKey && !mouseDown) {
    // Undo
    let undoAction = clientActionList.pop();
    if (undoAction != null) {
      undo(undoAction);
      socket.emit("undo", undoAction);
    }
  }
});

socket.on("clear", clear);
socket.on("undo", undo);

function undo(actionId) {
  delete actions[actionId];
  drawAllActions();
}

function clear() {
  actions = {};
  clientActionList = [];
  clearCanvas();
}

document.addEventListener("mousemove", (e) => {
  if (!mouseDown) return;
  let p = [e.offsetX, e.offsetY];

  let actionData = { id: currentAction, pos: p, actionType: currentType };
  updateAction(actionData);
  socket.emit("updateAction", actionData);
  drawActionOrClear(actionData);
});

document.addEventListener("mouseup", (e) => {
  if (!mouseDown) return;
  socket.emit("finishAction", actions[currentAction]);
  mouseDown = false;
  currentAction = null;
});

socket.on("newAction", (data) => {
  actions[data.id] = data;
  drawLine(data);
});

socket.on("updateAction", (data) => {
  // Sometimes server is late and sends updateAction before startup
  if (Object.keys(actions).length == 0) return;

  // Update actions and draw the new one
  updateAction(data);
  // For shapes, you will need to clear the canvas
  drawActionOrClear(data);
});

function drawActionOrClear(data) {
  if (["rect", "ellipse", "line"].includes(data.actionType)) {
    drawAllActions();
  } else {
    drawAction(actions[data.id]);
  }
}

function updateAction(data) {
  switch (data.actionType) {
    case "pencil":
      actions[data.id].points.push(data.pos);
      break;
    case "rect":
    case "ellipse":
    case "line":
      // Changes first point in both rect, line, and ellipse
      actions[data.id].points[1] = data.pos;
      break;
    default:
      console.error("Update Action: Invalid action!");
  }
}

socket.on("startup", (data) => {
  userId = socket.id;
  canvasStyle = data.style;
  canvas.style.backgroundColor = data.style.backgroundColor;
  // Populate actions and draw them in one loop
  for (let action of data.actions) {
    actions[action.id] = action;
    drawAction(action);
  }
});
