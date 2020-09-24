var roomId = new URLSearchParams(window.location.search).get("id");

const socket = io(window.location.origin, { query: "roomId=" + roomId });
var userId;
var canvas, ctx;
var moves = {};
var mouseDown = false;
var unidentifiedMove = {};
var currentMove = null;
var windowSize = [];
var clientMoveList = [];
var moveIndex = 0;

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
  drawAllMoves();
});

document.addEventListener("mousedown", (e) => {
  mouseDown = true;
  moveIndex++;

  let newMove = {
    points: [[e.offsetX, e.offsetY]],
    style: {},
    id: newId(),
  };

  socket.emit("newMove", newMove);
  currentMove = moveIndex;
  clientMoveList.push(currentMove);
  drawLine(newMove);
});

function newId() {
  return userId + moveIndex;
}

document.addEventListener("keydown", (e) => {
  let code = e.code;
  let metaKey = e.ctrlKey || e.metaKey;
  let altKey = e.altKey;
  if (code == "KeyC" && metaKey && altKey) {
    // Clear
    clearScreen();
    socket.emit("clear");
  }
  if (code == "KeyZ" && metaKey) {
    // Undo
    // Possible bug of undoing before newMoveId
    let undoMove = clientMoveList.pop();
    if (undoMove != null) {
      undo(undoMove);
      socket.emit("undo", undoMove);
    }
  }
});

socket.on("undo", undo);

function undo(moveId) {
  delete moves[moveId];
  drawAllMoves();
}

function drawAllMoves() {
  ctx.clearRect(0, 0, windowSize[0], windowSize[1]);
  for (let move of Object.values(moves)) {
    drawLine(move);
  }
}

function clearScreen() {
  moves = {};
  clientMoveList = [];
  ctx.clearRect(0, 0, windowSize[0], windowSize[1]);
}

document.addEventListener("mousemove", (e) => {
  if (!mouseDown) return;
  let p = [e.offsetX, e.offsetY];
  getCurrentMove().points.push(p);

  // There needs to be some temporary ID
  socket.emit("addPos", { _id: currentMove, pos: p });

  drawLine(getCurrentMove());
});

document.addEventListener("mouseup", (e) => {
  mouseDown = false;
  currentMove = null;
});

socket.on("newMoveId", (id) => {
  moves[id] = moves[currentMove];
  delete moves[currentMove];
  currentMove = id;
  clientMoveList.pop(); // This returns the fake id
  clientMoveList.push(id);
});

socket.on("newMove", (data) => {
  moves[data._id] = data;
  drawLine(data);
});

socket.on("addPos", (data) => {
  // Sometimes server is late and sends addPos before startup
  if (Object.keys(moves).length == 0) return;
  moves[data._id].points.push(data.pos);
  drawLine(moves[data._id]);
});

socket.on("clear", () => {
  clearScreen();
});

function getCurrentMove() {
  return moves[currentMove];
}

socket.on("startup", (data) => {
  userId = socket.id;
  for (let move of data) {
    moves[move._id] = move;
    drawLine(move);
  }
});

function drawLine(line) {
  ctx.beginPath();
  ctx.strokeStyle = "green";
  ctx.lineWidth = 5;
  ctx.lineCap = "round";
  ctx.moveTo(line.points[0][0], line.points[0][1]);
  for (let p of line.points) {
    ctx.lineTo(p[0], p[1]);
  }
  ctx.stroke();
}
