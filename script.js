let localStream;
let remoteStream;
let peerConnection;
let ws;
let isCaller = false;

const config = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
};

function startChat() {
  document.getElementById("landing").classList.add("hidden");
  document.getElementById("chat-interface").classList.remove("hidden");

  navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {
    localStream = stream;
    document.getElementById("localVideo").srcObject = stream;

    ws = new WebSocket("ws://localhost:3000");

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: "join" }));
    };

    ws.onmessage = async (msg) => {
      const data = JSON.parse(msg.data);

      switch (data.type) {
        case "match":
          setupWebRTC(true);
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
  });
}

async function setupWebRTC(initiator) {
  isCaller = initiator;
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
