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
};
var currentType = "pencil";

document.addEventListener("DOMContentLoaded", () => {
  canvas = document.getElementById("canvas");
  ctx = canvas.getContext("2d");
  windowSize = [window.innerWidth, window.innerHeight];
  sizeCanvas();
});

function sizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

window.addEventListener("resize", (e) => {
  windowSize = [window.innerWidth, window.innerHeight];
  sizeCanvas();
  drawAllActions();
});

document.addEventListener("contextmenu", (event) => event.preventDefault());

document.addEventListener("mousedown", (e) => {
  if (e.target.id != "canvas") return;
  if (e.button != 0) return; //left click only
  mouseDown = true;
  newAction([[e.offsetX, e.offsetY]]);
});

function newAction(points) {
  actionIndex++;

  let id = newId();
  let newAction = {
    points,
    style: currentStyle,
    id,
    actionType: "pencil",
  };

  socket.emit("newAction", newAction);
  currentAction = id;
  clientActionList.push(currentAction);
  actions[id] = newAction;
  drawAction(newAction);
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

function drawAllActions() {
  clearCanvas();
  for (let action of Object.values(actions)) {
    drawAction(action);
  }
}

function clear() {
  actions = {};
  clientActionList = [];
  clearCanvas();
}

function clearCanvas() {
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, windowSize[0], windowSize[1]);
}

document.addEventListener("mousemove", (e) => {
  if (!mouseDown) return;
  let p = [e.offsetX, e.offsetY];
  actions[currentAction].points.push(p);

  // There needs to be some temporary ID
  socket.emit("addPos", { id: currentAction, pos: p });

  drawLine(actions[currentAction]);
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

socket.on("addPos", (data) => {
  // Sometimes server is late and sends addPos before startup
  if (Object.keys(actions).length == 0) return;
  actions[data.id].points.push(data.pos);
  drawAction(actions[data.id]);
});

socket.on("startup", (data) => {
  userId = socket.id;
  for (let action of data) {
    actions[action.id] = action;
    drawAction(action);
  }
});

function drawAction(action) {
  setStyle(action.style);
  if (action.actionType == "pencil") {
    drawLine(action);
  }
}

function drawLine(line) {
  ctx.beginPath();
  ctx.moveTo(line.points[0][0], line.points[0][1]);
  for (let p of line.points) {
    ctx.lineTo(p[0], p[1]);
  }
  ctx.stroke();
}

function setStyle(style) {
  ctx.strokeStyle = style.color;
  ctx.lineWidth = style.brushSize;
  ctx.lineCap = "round";
}
