const express = require("express");
const app = express();
const server = app.listen(3000);

const mongoose = require("mongoose");
const mongoUrl = "mongodb://localhost:27017/odraw";

app.use(express.static("public"));

const socket = require("socket.io");
const io = socket(server);

mongoose.connect(mongoUrl, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
  useCreateIndex: true,
});

io.sockets.on("connection", async (socket) => {
  console.log("New client " + socket.id);
  let roomId = socket.handshake.query.roomId;
  socket.join(roomId);

  let canvas = await Canvas.findById(roomId);
  let lines = await Line.find({
    _id: {
      $in: canvas.moves.map(ObjectId),
    },
  });
  socket.emit("startup", lines);

  socket.on("newMove", (data) => {
    let _id = ObjectId();
    socket.broadcast.emit("newMove", { ...data, _id });
    socket.emit("newMoveId", _id);
    let l = new Line(data);
    l._id = _id;
    l.save();
    canvas.moves.push(_id);
    canvas.save();
  });

  socket.on("addPos", async (data) => {
    socket.broadcast.emit("addPos", data);
    let l = await Line.findById(data._id);
    l.points.push(data.pos);
    l.save();
  });

  socket.on("clear", async () => {
    socket.broadcast.emit("clear");
    Line.deleteMany({ _id: { $in: canvas.moves.map(ObjectId) } });
    canvas.moves = [];
    canvas.save();
  });

  socket.on("undo", async (_id) => {
    socket.broadcast.emit("undo", _id);
    Line.deleteOne({ _id });
    canvas.moves.splice(canvas.moves.indexOf(_id), 1);
    canvas.save();
  });
});

const Schema = mongoose.Schema;
const ObjectId = mongoose.Types.ObjectId;

const LineSchema = new Schema({
  points: Array,
  style: Object,
});

const CanvasSchema = new Schema({
  name: String,
  moves: Array,
});

const Line = mongoose.model("lines", LineSchema);
const Canvas = mongoose.model("canvases", CanvasSchema);
