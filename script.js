let localStream;
let remoteStream;
let peerConnection;
let ws;
let isCaller = false;

const config = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
};

function startApp() {
  const username = document.getElementById('username').value;
  if (!username) return alert("Enter a name");

  document.getElementById("login-container").style.display = "none";
  document.getElementById("video-chat-container").style.display = "block";

  ws = new WebSocket("ws://localhost:3000");

  ws.onopen = () => {
    ws.send(JSON.stringify({ type: "login", name: username }));
  };

  ws.onmessage = async (message) => {
    const data = JSON.parse(message.data);

    switch (data.type) {
      case "match":
        setupWebRTC();
        break;
      case "offer":
        await setupWebRTC(false);
        await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        ws.send(JSON.stringify({ type: "answer", answer }));
        break;
      case "answer":
        await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
        break;
      case "candidate":
        if (peerConnection) {
          peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
        }
        break;
      case "leave":
        endCall();
        break;
    }
  };
}

async function setupWebRTC(initiator = true) {
  isCaller = initiator;
  localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  document.getElementById("localVideo").srcObject = localStream;

  remoteStream = new MediaStream();
  document.getElementById("remoteVideo").srcObject = remoteStream;

  peerConnection = new RTCPeerConnection(config);

  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      ws.send(JSON.stringify({ type: "candidate", candidate: event.candidate }));
    }
  };

  peerConnection.ontrack = (event) => {
    event.streams[0].getTracks().forEach((track) => {
      remoteStream.addTrack(track);
    });
  };

  localStream.getTracks().forEach((track) => {
    peerConnection.addTrack(track, localStream);
  });

  if (initiator) {
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    ws.send(JSON.stringify({ type: "offer", offer }));
  }
}

function sendMessage() {
  const input = document.getElementById("chatInput");
  const message = input.value;
  if (message.trim() !== "") {
    const chatBox = document.getElementById("chatBox");
    const msgElement = document.createElement("div");
    msgElement.textContent = `You: ${message}`;
    chatBox.appendChild(msgElement);
    input.value = "";
    chatBox.scrollTop = chatBox.scrollHeight;
  }
}

function endCall() {
  if (peerConnection) {
    peerConnection.close();
    peerConnection = null;
  }
  if (remoteStream) {
    remoteStream.getTracks().forEach(track => track.stop());
  }
  document.getElementById("remoteVideo").srcObject = null;
  alert("Partner has left the chat.");
}
