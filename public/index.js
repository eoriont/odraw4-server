const socket = io.connect("/");

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("newCanvBtn").addEventListener("click", () => {
    let clr = document.getElementById("colorInput").value;
    socket.emit("newCanvas", clr);
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
