const ws = new WebSocket("ws://localhost:8000/ws/chat");

ws.onmessage = function(event) {
    const chatBox = document.getElementById("chatBox");
    chatBox.textContent += event.data + "\n";
};

function sendMessage() {
    const input = document.getElementById("messageInput");
    ws.send(input.value);
    input.value = '';
}
