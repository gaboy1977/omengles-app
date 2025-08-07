const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");
const chatBox = document.getElementById("chatBox");
const chatInput = document.getElementById("chatInput");
const sendBtn = document.getElementById("sendBtn");
const nextBtn = document.getElementById("nextBtn");
const stopBtn = document.getElementById("stopBtn");

let localStream;
let peerConnection;
let socket;
let roomId;

const servers = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" }
  ]
};

function log(msg) {
  chatBox.innerHTML += `<div>${msg}</div>`;
  chatBox.scrollTop = chatBox.scrollHeight;
}

function startConnection() {
  socket = new WebSocket("ws://localhost:3000");

  socket.onopen = () => {
    socket.send(JSON.stringify({ type: "join" }));
  };

  socket.onmessage = async (message) => {
    const data = JSON.parse(message.data);

    switch (data.type) {
      case "offer":
        await createPeer(false);
        await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        socket.send(JSON.stringify({ type: "answer", answer }));
        break;
      case "answer":
        await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
        break;
      case "candidate":
        if (peerConnection) {
          peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
        }
        break;
    }
  };
}

async function createPeer(isCaller) {
  peerConnection = new RTCPeerConnection(servers);

  peerConnection.ontrack = (event) => {
    remoteVideo.srcObject = event.streams[0];
  };

  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      socket.send(JSON.stringify({ type: "candidate", candidate: event.candidate }));
    }
  };

  localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  localVideo.srcObject = localStream;

  localStream.getTracks().forEach(track => {
    peerConnection.addTrack(track, localStream);
  });

  if (isCaller) {
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    socket.send(JSON.stringify({ type: "offer", offer }));
  }
}

sendBtn.onclick = () => {
  const msg = chatInput.value.trim();
  if (msg !== "") {
    log(`<strong>You:</strong> ${msg}`);
    socket.send(JSON.stringify({ type: "chat", message: msg }));
    chatInput.value = "";
  }
};

nextBtn.onclick = () => {
  location.reload(); // quick and dirty way to restart the connection
};

stopBtn.onclick = () => {
  if (peerConnection) peerConnection.close();
  if (socket) socket.close();
  log("Chat ended.");
};

startConnection();
