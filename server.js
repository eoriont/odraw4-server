require("dotenv").config();

const express = require("express");
const app = express();
const server = app.listen(process.env.PORT || 3000, () => {
  console.log("Started server!");
});

const mongoose = require("mongoose");
const mongoUrl = process.env.mongoUrl;

const validateColor = require("validate-color").default;

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
  let actions = await Action.find({
    id: {
      $in: canvas.actions,
    },
  });
  socket.emit("startup", { actions, style: canvas.style });

  socket.on("newAction", (data) => {
    socket.broadcast.emit("newAction", data);
  });

  socket.on("updateAction", (data) => {
    socket.broadcast.emit("updateAction", data);
  });

  socket.on("clear", () => {
    socket.broadcast.emit("clear");
    Action.deleteMany({ id: { $in: canvas.actions } }).exec();
    canvas.actions = [];
    canvas.save();
  });

  socket.on("undo", (id) => {
    socket.broadcast.emit("undo", id);
    Action.deleteOne({ id });
    canvas.actions.splice(canvas.actions.indexOf(id), 1);
    canvas.save();
  });

  socket.on("finishAction", (data) => {
    let a = new Action(data);
    a.save();
    canvas.actions.push(data.id);
    canvas.save();
  });
});

io.of("/").on("connection", async (socket) => {
  socket.on("newCanvas", (bkgclr) => {
    let code = makeid(6);
    let backgroundColor = validateColor(bkgclr) ? bkgclr : "#000";
    let style = {
      backgroundColor,
    };
    let c = new Canvas({ code, style });
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

const ActionSchema = new Schema({
  actionType: String,
  points: Array,
  style: {
    fillShape: Boolean,
    brushSize: Number,
    color: String,
  },
  id: String,
});
const Action = mongoose.model("actions", ActionSchema);

const CanvasSchema = new Schema({
  actions: { default: [], type: [String] },
  code: String,
  style: {
    backgroundColor: String,
  },
});
const Canvas = mongoose.model("canvases", CanvasSchema);
