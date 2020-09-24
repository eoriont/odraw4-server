var roomId = location.href
  .split("/")
  .filter((x) => x !== "")
  .pop();

const socket = io.connect("/canvas", {
  query: "roomId=" + roomId,
});
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
  newMove([[e.offsetX, e.offsetY]]);
});

function newMove(points) {
  moveIndex++;

  let id = newId();
  let newMove = {
    points,
    style: {},
    id,
  };

  socket.emit("newMove", newMove);
  currentMove = id;
  clientMoveList.push(currentMove);
  moves[id] = newMove;
  drawLine(newMove);
}

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
  if (code == "KeyZ" && metaKey && !mouseDown) {
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
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, windowSize[0], windowSize[1]);
}

document.addEventListener("mousemove", (e) => {
  if (!mouseDown) return;
  let p = [e.offsetX, e.offsetY];
  getCurrentMove().points.push(p);

  // There needs to be some temporary ID
  socket.emit("addPos", { id: currentMove, pos: p });

  drawLine(getCurrentMove());
});

document.addEventListener("mouseup", (e) => {
  if (!mouseDown) return;
  socket.emit("finishMove", moves[currentMove]);
  mouseDown = false;
  currentMove = null;
});

socket.on("newMove", (data) => {
  moves[data.id] = data;
  drawLine(data);
});

socket.on("addPos", (data) => {
  // Sometimes server is late and sends addPos before startup
  if (Object.keys(moves).length == 0) return;
  moves[data.id].points.push(data.pos);
  drawLine(moves[data.id]);
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
    moves[move.id] = move;
    drawLine(move);
  }
});

function drawLine(line) {
  ctx.beginPath();
  ctx.strokeStyle = "yellow";
  ctx.lineWidth = 5;
  ctx.lineCap = "round";
  ctx.moveTo(line.points[0][0], line.points[0][1]);
  for (let p of line.points) {
    ctx.lineTo(p[0], p[1]);
  }
  ctx.stroke();
}
