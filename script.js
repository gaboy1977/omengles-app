let localStream;
let remoteStream;
let peerConnection;

const config = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

function startApp() {
  document.getElementById("login-container").style.display = "none";
  document.getElementById("video-chat-container").style.display = "block";
  startVideo();
}

async function startVideo() {
  try {
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    document.getElementById("localVideo").srcObject = localStream;

    // Simulated peer connection (loopback demo)
    peerConnection = new RTCPeerConnection(config);
    remoteStream = new MediaStream();
    document.getElementById("remoteVideo").srcObject = remoteStream;

    localStream.getTracks().forEach(track => {
      peerConnection.addTrack(track, localStream);
    });

    peerConnection.ontrack = event => {
      event.streams[0].getTracks().forEach(track => {
        remoteStream.addTrack(track);
      });
    };

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    const answer = await peerConnection.createAnswer();
    await peerConnection.setRemoteDescription(offer);
    await peerConnection.setLocalDescription(answer);
    await peerConnection.setRemoteDescription(answer);

  } catch (err) {
    alert("Error accessing camera or mic: " + err.message);
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
