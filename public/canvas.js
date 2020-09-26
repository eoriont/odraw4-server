function drawAction(action) {
  setStyle(action.style);
  switch (action.actionType) {
    case "eraser":
      ctx.strokeStyle = canvasStyle.backgroundColor;
    case "pencil":
      drawLine(action);
      break;
    case "rect":
      if (action.points.length != 2) break;
      drawRect(action);
      break;
    case "ellipse":
      if (action.points.length != 2) break;
      drawEllipse(action);
      break;
    case "line":
      if (action.points.length != 2) break;
      drawStraightLine(action);
      break;
    default:
      console.error("Draw Action: Invalid ActionType!");
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

function drawStraightLine(line) {
  ctx.beginPath();
  ctx.moveTo(line.points[0][0], line.points[0][1]);
  ctx.lineTo(line.points[1][0], line.points[1][1]);
  ctx.stroke();
}

function drawRect(rect) {
  let [x, y, w, h] = getXYWH(rect.points);
  // values in the style are converted to strings in the db
  if (rect.style.fillShape == true) {
    ctx.fillRect(x, y, w, h);
  } else {
    ctx.strokeRect(x, y, w, h);
  }
}

function drawEllipse(ellipse) {
  let [x, y, w, h] = getXYWH(ellipse.points);
  var kappa = 0.5522848,
    ox = (w / 2) * kappa, // control point offset horizontal
    oy = (h / 2) * kappa, // control point offset vertical
    xe = x + w, // x-end
    ye = y + h, // y-end
    xm = x + w / 2, // x-middle
    ym = y + h / 2; // y-middle

  // ctx.save();
  ctx.beginPath();
  ctx.moveTo(x, ym);
  ctx.bezierCurveTo(x, ym - oy, xm - ox, y, xm, y);
  ctx.bezierCurveTo(xm + ox, y, xe, ym - oy, xe, ym);
  ctx.bezierCurveTo(xe, ym + oy, xm + ox, ye, xm, ye);
  ctx.bezierCurveTo(xm - ox, ye, x, ym + oy, x, ym);
  if (ellipse.style.fillShape) {
    ctx.fill();
  } else {
    ctx.stroke();
  }
  // ctx.restore();
}

function getXYWH(points) {
  let [x, y] = points[0];
  let w = points[1][0] - x;
  let h = points[1][1] - y;
  return [x, y, w, h];
}

function setStyle(style) {
  ctx.strokeStyle = style.color;
  ctx.fillStyle = style.color;
  ctx.lineWidth = style.brushSize;
  ctx.lineCap = "round";
}

function clearCanvas() {
  ctx.fillStyle = canvasStyle.backgroundColor;
  ctx.fillRect(0, 0, windowSize[0], windowSize[1]);
}

function drawAllActions() {
  clearCanvas();
  for (let action of Object.values(actions)) {
    drawAction(action);
  }
}

function sizeCanvas(canvas, size) {
  canvas.width = size[0];
  canvas.height = size[1];
}
