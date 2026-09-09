const http = require("http");
const fs = require("fs");
const path = require("path");
const WebSocket = require("ws");

const PORT = process.env.PORT || 8080;

const server = http.createServer((req, res) => {
  let file = req.url === "/" ? "/index.html" : req.url;
  file = path.normalize(file).replace(/^(\.\.[\/\\])+/, "");
  const filePath = path.join(__dirname, "public", file);

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      return res.end("Not found");
    }

    const ext = path.extname(filePath);
    const types = {
      ".html": "text/html; charset=utf-8",
      ".css": "text/css; charset=utf-8",
      ".js": "application/javascript; charset=utf-8"
    };

    res.writeHead(200, {
      "Content-Type": types[ext] || "application/octet-stream"
    });
    res.end(data);
  });
});

const wss = new WebSocket.Server({ server });
const clients = new Set();

function broadcast(data) {
  const message = JSON.stringify(data);

  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }
}

function sendUserCount() {
  broadcast({
    type: "userCount",
    count: clients.size
  });
}

wss.on("connection", (socket) => {
  clients.add(socket);
  sendUserCount();

  socket.on("message", (raw) => {
    try {
      const data = JSON.parse(raw.toString());

      if (data.type !== "message") return;

      const username = String(data.username || "Anonymous")
        .trim()
        .slice(0, 24);

      const message = String(data.message || "")
        .trim()
        .slice(0, 500);

      if (!message) return;

      broadcast({
        type: "message",
        username: username || "Anonymous",
        message,
        time: new Date().toLocaleTimeString([], {
          hour: "numeric",
          minute: "2-digit"
        })
      });
    } catch {
      // Ignore invalid messages.
    }
  });

  socket.on("close", () => {
    clients.delete(socket);
    sendUserCount();
  });

  socket.on("error", () => {
    clients.delete(socket);
    sendUserCount();
  });
});

server.listen(PORT, () => {
  console.log(`Chatroom running at http://localhost:${PORT}`);
});