import { NavTalkManager } from "./NavTalkManager";
import { NotificationManager } from "./NotificationManager";
import { WebSocketManager } from "./WebSocketManager";

export class WebRTCManager {

  private static instance: WebRTCManager;
  private constructor() {}
  public remoteVideo?: HTMLVideoElement;

  public static getInstance(): WebRTCManager {
    if (!WebRTCManager.instance) {
      WebRTCManager.instance = new WebRTCManager();
    }
    return WebRTCManager.instance;
  }

  // ===============================
  // 1.WebRTC 对象
  // ===============================
  public peerConnection: RTCPeerConnection | null = null;
  private configuration: RTCConfiguration = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" }
    ]
  };
  // ===============================
  // 2.处理服务器 Offer
  // ===============================
  public handleOffer(message: any) {
    const offer = new RTCSessionDescription(message.sdp);
    console.log("Received offer SDP:", offer);
    //1.1.设置ICE
    if (Array.isArray(NavTalkManager.getInstance().iceServers) && NavTalkManager.getInstance().iceServers.length > 0) {
      const local_iceServers = this.parseIceServers(NavTalkManager.getInstance().iceServers as RTCIceServer[]);
      this.configuration.iceServers = local_iceServers;
      console.log("1.1.设置ICE: ", local_iceServers);
    }
    //1.2.创建PeerConnection
    this.peerConnection = new RTCPeerConnection(this.configuration);
    console.log("1.2.创建PeerConnection");
    //1.3.设置远端 SDP
    this.peerConnection.setRemoteDescription(offer)
    .then(() => this.peerConnection!.createAnswer())
    .then(answer => this.peerConnection!.setLocalDescription(answer))
    .then(() => {
      console.log("1.3.设置远端 SDP");
      //1.4.发送Answer
      this.sendAnswerMessage(this.peerConnection!.localDescription);
    })
    .catch(err => {
        console.error("Error handling offer:", err);
    });

    //接收远端音视频
    this.peerConnection.ontrack = (event) => {
      console.log("接收到远端音视频:", event);
      if (this.remoteVideo && event.streams && event.streams[0]) {
        if (this.remoteVideo.srcObject !== event.streams[0]) {
          this.remoteVideo.srcObject = event.streams[0];
          this.remoteVideo.play()
          .then(() => {
            console.log("Video playback started");
          })
          .catch(e => {
             console.error("Video play failed:", e);
          });
        }
      }
    };
    //ICE Candidate
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendIceMessage(event.candidate);
      }
    };
    //ICE 状态监听
    this.peerConnection.oniceconnectionstatechange = () => {
      //console.log("ICE状态发生变化:",this.peerConnection?.iceConnectionState);
      if (this.peerConnection?.iceConnectionState === "connected") {
        console.log("WebRTC connection fully established!");
      } else if (this.peerConnection?.iceConnectionState === "failed") {
        console.log("ICE connection failed");
      } else if (this.peerConnection?.iceConnectionState === "disconnected") {
        console.log("ICE connection disconnected");
      }
      NotificationManager.getInstance().post("webRTCConnectStatusChanged");
    };
  }
  //发送 Answer
  private sendAnswerMessage(answer: RTCSessionDescription | null) {
    if (!answer) return;
    const ws = WebSocketManager.getInstance().ws;
    if (ws && ws.readyState === WebSocket.OPEN) {
      const messag_json = JSON.stringify({
        type: "webrtc.signaling.answer",
        data:{
          sdp:{
            type: answer.type,
            sdp: answer.sdp
          }
        }
      });
      ws.send(messag_json);
      console.log("1.4.发送 Answer:", messag_json);
    }
  }
 //发送 ICE Candidate
  private sendIceMessage(candidate: RTCIceCandidate) {
    const ws = WebSocketManager.getInstance().ws;
    if (ws && ws.readyState === WebSocket.OPEN) {
      const messag_json = JSON.stringify({
        type: "webrtc.signaling.iceCandidate",
        data: {
          candidate:{
            candidate: candidate.candidate,
            sdpMLineIndex: candidate.sdpMLineIndex,
            sdpMid: candidate.sdpMid
          }
        }
      });
      ws.send(messag_json);
      console.log("发送 ICE Candidate:", messag_json);
    }
  }
  // ===============================
  // 3.处理Answer
  // ===============================
  public handleAnswer(message: any) {
    //从 message 中提取 SDP
    const sdpDict = message.sdp;
    if (!sdpDict || !sdpDict.sdp) return;
    const sdpString = sdpDict.sdp;
    // 创建 RTCSessionDescription 对象
    const answer = new RTCSessionDescription({
      type: "answer",
      sdp: sdpString
    });
    // 设置远端描述
    if (this.peerConnection) {
      this.peerConnection.setRemoteDescription(answer)
        .then(() => console.log("Remote description set successfully"))
        .catch(err => console.error("Failed to set remote description:", err));
    }
  }

  // ===============================
  // 4.处理ICE候选人
  // ===============================
  public handleIceCandidate(message: any) {
    const candidate = new RTCIceCandidate(message.candidate);
    if (this.peerConnection) {
      this.peerConnection.addIceCandidate(candidate)
        .then(() => console.log('ICE candidate added successfully'))
        .catch(err => console.error('Error adding ICE candidate:', err));
    }
  }

  // ===============================
  // 4. Handle Local IceServers
  // ===============================
  private parseIceServers(rawServers: Array<Record<string, any>>): RTCIceServer[] {
    const iceServers: RTCIceServer[] = [];

    for (const server of rawServers) {
        // 确保 urls 是字符串数组
        const urls = server.urls;
        if (!urls) continue;

        const urlsArray: string[] = Array.isArray(urls) ? urls : [urls];

        const username = server.username;
        const credential = server.credential;

        if (username && credential) {
            iceServers.push({
                urls: urlsArray,
                username,
                credential
            });
        } else {
            iceServers.push({
                urls: urlsArray
            });
        }
    }

    return iceServers;
}
}