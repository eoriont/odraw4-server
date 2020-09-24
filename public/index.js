const socket = io.connect("/");

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("newCanvBtn").addEventListener("click", () => {
    socket.emit("newCanvas");
  });

  document.getElementById("connectBtn").addEventListener("click", () => {
    let code = document.getElementById("codeInput").value;
    socket.emit("connectToCanvas", code);
  });
});

socket.on("redirect", (code) => {
  location.href = "/canvas/" + code;
});

socket.on("invalidCode", () => {
  console.log("invalid code!");
});
