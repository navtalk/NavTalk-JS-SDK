import { WebSocketManager } from "./WebSocketManager";

export class AudioManager{
    
    private static instance: AudioManager 
    private constructor() {}
    public static getInstance(): AudioManager {
      if (!AudioManager.instance) {
        AudioManager.instance = new AudioManager()
      }
      return AudioManager.instance
    }

    //2.音频相关对象
    private audioContext: AudioContext | null = null;
    private audioProcessor: ScriptProcessorNode | null = null;
    private audioStream: MediaStream | null = null;

    //3.函数
    public startRecording(){
        navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
            this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
              sampleRate: 24000
            });
            this.audioStream = stream;
            const source = this.audioContext.createMediaStreamSource(stream);
            this.audioProcessor = this.audioContext.createScriptProcessor(8192, 1, 1);
            this.audioProcessor.onaudioprocess = (event) => {
              if (WebSocketManager.getInstance().ws && WebSocketManager.getInstance().ws?.readyState === WebSocket.OPEN) {
                const inputBuffer = event.inputBuffer.getChannelData(0);
                // Float32 → PCM16
                const pcmData = this.floatTo16BitPCM(inputBuffer);
                // base64
                const base64PCM = this.base64EncodeAudio(new Uint8Array(pcmData));
                const chunkSize = 4096;
                for (let i = 0; i < base64PCM.length; i += chunkSize) {
                  const chunk = base64PCM.slice(i, i + chunkSize);
                  WebSocketManager.getInstance().ws?.send(JSON.stringify({
                    type: "realtime.input_audio_buffer.append",
                    data: { audio: chunk }
                  }));
                }
              }
            };
            source.connect(this.audioProcessor);
            this.audioProcessor.connect(this.audioContext.destination);
            console.log("Recording started");
           })
       .catch(error => {
         console.error("Unable to access microphone:", error);
       });
    }

    // ============================
  // 停止录音
  // ============================
  public stopRecording() {
    if (this.audioProcessor) {
      this.audioProcessor.disconnect();
      this.audioProcessor = null;
    }
    if (this.audioStream) {
      this.audioStream.getTracks().forEach(track => track.stop());
      this.audioStream = null;
    }
    if (WebSocketManager.getInstance().ws) {
      WebSocketManager.getInstance().ws!.close();
    }
    console.log("Recording stopped");
  }

  // ============================
  // Float32 → PCM16
  // ============================
  private floatTo16BitPCM(float32Array: Float32Array) {
    const buffer = new ArrayBuffer(float32Array.length * 2);
    const view = new DataView(buffer);
    let offset = 0;
    for (let i = 0; i < float32Array.length; i++, offset += 2) {
      let s = Math.max(-1, Math.min(1, float32Array[i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }
    return buffer;
  }

  // ============================
  // Base64 编码
  // ============================
  private base64EncodeAudio(uint8Array: Uint8Array) {
    let binary = "";
    const chunkSize = 0x8000;
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.subarray(i, i + chunkSize);
      binary += String.fromCharCode.apply(null, chunk as any);
    }
    return btoa(binary);
  }

   
      
}
