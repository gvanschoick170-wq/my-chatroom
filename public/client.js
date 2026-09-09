let username = "";

const messages = document.getElementById("messages");
const input = document.getElementById("messageInput");
const form = document.getElementById("messageForm");
const button = document.getElementById("sendButton");
const status = document.getElementById("status");
const userCount = document.getElementById("userCount");

function askForUsername() {
  let name = prompt("Choose a username:");

  while (!name || !name.trim()) {
    name = prompt("Please enter a username:");
  }

  username = name.trim().slice(0, 24);
}

askForUsername();

const protocol = location.protocol === "https:" ? "wss:" : "ws:";
const socket = new WebSocket(`${protocol}//${location.host}`);

socket.addEventListener("open", () => {
  status.textContent = "Connected";
  input.disabled = false;
  button.disabled = false;
  input.focus();
});

socket.addEventListener("close", () => {
  status.textContent = "Disconnected";
  input.disabled = true;
  button.disabled = true;
  addSystemMessage("You were disconnected from the server.");
});

socket.addEventListener("error", () => {
  status.textContent = "Connection error";
});

socket.addEventListener("message", (event) => {
  const data = JSON.parse(event.data);

  if (data.type === "message") {
    addMessage(data);
  }

  if (data.type === "userCount") {
    userCount.textContent = data.count;
  }
});

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const message = input.value.trim();

  if (!message || socket.readyState !== WebSocket.OPEN) {
    return;
  }

  socket.send(JSON.stringify({
    type: "message",
    username,
    message
  }));

  input.value = "";
  input.focus();
});

function addMessage(data) {
  const wrapper = document.createElement("article");
  wrapper.className = "message";

  const top = document.createElement("div");
  top.className = "top";

  const name = document.createElement("span");
  name.className = "username";
  name.textContent = data.username;

  const time = document.createElement("span");
  time.className = "time";
  time.textContent = data.time;

  const text = document.createElement("div");
  text.className = "text";
  text.textContent = data.message;

  top.append(name, time);
  wrapper.append(top, text);
  messages.appendChild(wrapper);

  messages.scrollTop = messages.scrollHeight;
}

function addSystemMessage(text) {
  const message = document.createElement("div");
  message.className = "system";
  message.textContent = text;
  messages.appendChild(message);
}
