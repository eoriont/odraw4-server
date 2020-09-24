const express = require("express");
const app = express();
const server = app.listen(3000);

const mongoose = require("mongoose");
const mongoUrl = "mongodb://localhost:27017/odraw";

app.use(express.static("public"));
app.set("views", "./views");
app.set("view engine", "pug");

app.get("/", (req, res) => {
  res.render("landing_page");
});

app.get("/canvas/:id", (req, res) => {
  res.render("canvas");
});

const socket = require("socket.io");
const io = socket(server);

mongoose.connect(mongoUrl, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
  useCreateIndex: true,
});

io.of("/canvas").on("connection", async (socket) => {
  // console.log("New client " + socket.id);
  let roomId = socket.handshake.query.roomId;
  socket.join(roomId);

  let canvas = await Canvas.findOne({ code: roomId });
  let lines = await Line.find({
    id: {
      $in: canvas.moves,
    },
  });
  socket.emit("startup", lines);

  socket.on("newMove", (data) => {
    socket.broadcast.emit("newMove", data);
  });

  socket.on("addPos", async (data) => {
    socket.broadcast.emit("addPos", data);
  });

  socket.on("clear", async () => {
    socket.broadcast.emit("clear");
    Line.deleteMany({ id: { $in: canvas.moves } });
    canvas.moves = [];
    canvas.save();
  });

  socket.on("undo", async (id) => {
    socket.broadcast.emit("undo", id);
    Line.deleteOne({ id });
    canvas.moves.splice(canvas.moves.indexOf(id), 1);
    canvas.save();
  });

  socket.on("finishMove", async (data) => {
    let l = new Line(data);
    l.save();
    canvas.moves.push(data.id);
    canvas.save();
  });
});

io.of("/").on("connection", async (socket) => {
  socket.on("newCanvas", () => {
    let code = makeid(6);
    let c = new Canvas({ code });
    c.save();
    socket.emit("redirect", code);
  });

  socket.on("connectToCanvas", async (code) => {
    try {
      await Canvas.find({ code });
      socket.emit("redirect", code);
    } catch (err) {
      console.error(err);
      socket.emit("invalidCode");
    }
  });
});

function makeid(length) {
  var result = "";
  var characters = "abcdefghijklmnopqrstuvwxyz0123456789";
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

const Schema = mongoose.Schema;
const ObjectId = mongoose.Types.ObjectId;

const LineSchema = new Schema({
  points: Array,
  style: Object,
  id: String,
});

const CanvasSchema = new Schema({
  moves: { default: [], type: Array },
  code: String,
});

const Line = mongoose.model("lines", LineSchema);
const Canvas = mongoose.model("canvases", CanvasSchema);
