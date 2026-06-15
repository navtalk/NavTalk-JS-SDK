import { AudioManager } from "./AudioManager";
import { NavTalkManager } from "./NavTalkManager";
import { NotificationManager } from "./NotificationManager";
import { WebRTCManager } from "./WebRTCManager";

export class WebSocketManager{

    //1.构造单例对象
    private static instance: WebSocketManager 
    private constructor() {}
    public static getInstance(): WebSocketManager {
      if (!WebSocketManager.instance) {
        WebSocketManager.instance = new WebSocketManager()
      }
      return WebSocketManager.instance
    }

    //2.单例的参数
    public ws?: WebSocket;
    public websocketUrl: string = "wss://transfer.navtalk.ai/wss/v2/realtime-chat"
    private allUserMessages: any[] = [];
    public funcationCallArray: any[] = [];
    public isRememberPreviousConversation: boolean = true;

    //3.初始化并尝试连接WebSocket
    public startToConnectWebSocket(){
      console.warn('Attempting to connect to the WebSocket.');
      if (NavTalkManager.getInstance().avatar_provider_name.length <= 0){
        console.warn('Role details have not been retrieved yet.');
          return
      }
      if (this.ws && this.ws.readyState == WebSocket.OPEN){
          console.warn('WebSocket is already connected.');
          return;
      }
      //3.1.Create WebSocket connection
      var websocketUrlWithParams = "";
      if (NavTalkManager.getInstance().characterId.length > 0){
        websocketUrlWithParams = `${this.websocketUrl}?license=${encodeURIComponent(NavTalkManager.getInstance().license)}&avatarId=${encodeURIComponent(NavTalkManager.getInstance().characterId)}`;
      }else{
        websocketUrlWithParams = `${this.websocketUrl}?license=${encodeURIComponent(NavTalkManager.getInstance().license)}&name=${encodeURIComponent(NavTalkManager.getInstance().characterName)}`;
      }
      console.log("Try to connect websocket:",websocketUrlWithParams);
      const socket = new WebSocket(websocketUrlWithParams);
      this.ws = socket;
      socket.binaryType = 'arraybuffer';
      //Connection event handlers
      //3.2.Opened
      socket.onopen = () => {
        console.log('WebSocket connection established');
        // Connection is ready, wait for session.session_id and session.created events
        NotificationManager.getInstance().post("webSocketConnectStatusChanged");
        //上传Function Call
        this.uploadFunctionCall();
      };
      //3.3.Error
      socket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
      //3.4.Closed
      socket.onclose = (event) => {
        console.log('WebSocket connection closed', event.code, event.reason);
        NotificationManager.getInstance().post("webSocketConnectStatusChanged");
      };
      //3.5.WebSocket收到消息
      socket.onmessage = (event) => {
        // Handle both string (JSON) and binary messages
        if (typeof event.data === 'string'){
          try{
            const data = JSON.parse(event.data);
            this.handleReceivedMessage(data);
          }catch(e){
            console.error('Failed to parse JSON message:', e);
          }
        }
      };
    }

    //4.上传Function Call
    private uploadFunctionCall(){
      /*
      const functions = [
        {
          type: 'function',
          name: 'function_call_close_talk',
          description: 'Please trigger this method when you receive a message or when the conversation is closed.',
          parameters: {
            type: 'object',
            properties: {
              userInput: {
                type: 'string',
                description: 'Raw user request content to be processed'
              }
            },
            required: ['userInput']
          }
        }
      ];
     const functionJson = JSON.stringify(functions);
     const message = {
       type: "realtime.input_function_call",
       data: {
        content: functionJson
       }
     };
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify(message));
        console.log("===========================");
        console.log("上传Function Call数据:", JSON.stringify(message));
      } 
      */
      //外部传入的数据：
      /*
      const out_functions: any[] = [
        {
          function_call_name: 'function_call_close_talk',
          function_call_description: 'Please trigger this method when you receive a message or when the conversation is closed.',
          function_call_parameters: {}
        },
        {
          function_call_name: 'function_call_close_talk',
          function_call_description: 'Please trigger this method when you receive a message or when the conversation is closed.',
          function_call_parameters: {
            properties:{
              number1: {
                type: 'string',
                description: 'This is the first number to be added. This data must be obtained. If this parameter is missing, please ask me: What is the first number'
              },
              number2: {
                type: 'string',
                description: 'This is the second number to be added. This data must be obtained. If this parameter is missing, please ask me: What is the second number?'
              }
            },
            required: ['number1', 'number2']
          },
        }
      ]
      */
     
      if (this.funcationCallArray.length <= 0){return;}
      const functions: any[] = [];
      this.funcationCallArray.forEach((item) => {
        const function_data: any = {};
        function_data.type = "function";
        function_data.name = item.function_call_name;
        function_data.description = item.function_call_description;
        function_data.parameters = {
          type: "object",
          properties: item.function_call_parameters.properties || [],
          required: item.function_call_parameters.required || []
        };
        functions.push(function_data);
      });
      const functionJson = JSON.stringify(functions);
      const message = {
       type: "realtime.input_function_call",
       data: {
        content: functionJson
       }
     };
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify(message));
        console.log("===========================");
        console.log("上传Function Call数据:", JSON.stringify(message));
      } 
      
    }

    //5.Handle Function Call
    private handleFunctionCall(message: any) {
      NotificationManager.getInstance().post("functionCallReceived", message);
    }

    //6.处理收到的消息
    private handleReceivedMessage(data: any): void{
      console.log("handleReceivedMessage: ",data);
      const nav_data = data.data;
      const nav_type = data.type;
      switch (nav_type){
        //6.1.链接websocket成功
        case "conversation.connected.success":
          if (nav_data.sessionId){
            NavTalkManager.getInstance().targetSessionId = nav_data.sessionId;
            //console.log("iceServers:",NavTalkManager.getInstance().iceServers);
          }
          if (nav_data.iceServers){
            NavTalkManager.getInstance().iceServers = nav_data.iceServers;
            //console.log("targetSessionId:",NavTalkManager.getInstance().targetSessionId);
          }
        break;

        //6.2.链接websocket失败
        case "conversation.connected.fail":
          const errorMessage = data.message || 'Unknown error';
          console.error('Connection failed:', errorMessage);
          alert("Connect websocket failed: " + errorMessage);
        break;

        //6.3.会话已经创建
        case "realtime.session.created":
          //发送历史记录
          this.sendHistoryToCurrentChat();
        break;

        //6.4.会话配置信息已经更新
        case "realtime.session.updated":
          //开始录制本地音频信息并上传
          AudioManager.getInstance().startRecording();
        break;

        //6.5.收集到用户的语音转录文本
        case "realtime.conversation.item.input_audio_transcription.completed":
          //保存用户的问题数据
          let userMessage = {
            "text": data.data.content
          };
          this.allUserMessages.push(userMessage);
        break;

        //6.6.AI回答的语音转录文本
        case "realtime.response.audio_transcript.done":
        break;

        //6.7.Function Call相关消息
        case "realtime.response.function_call_arguments.done":
          this.handleFunctionCall(data);
        break;

        //6.8.WebRTC相关--Offer
        case "webrtc.signaling.offer":
          console.log("WebSocket收到Offer消息");
          WebRTCManager.getInstance().handleOffer(nav_data);
        break;

        //6.9.WebRTC相关--Answer
        case "webrtc.signaling.answer":
          console.log("1.5.WebSocket收到Answer消息");
          //WebRTCManager.getInstance().handleAnswer(nav_data);
        break;

        //6.10.WebRTC相关--iceCandidate
        case "webrtc.signaling.iceCandidate":
          console.log("WebSocket收到iceCandidate消息");
          //WebRTCManager.getInstance().handleIceCandidate(nav_data);
        break;
      }
    }
    //7.发送历史记录
    private sendHistoryToCurrentChat(){
      if (!this.isRememberPreviousConversation){return;}
      this.allUserMessages.forEach((message) => {
        const historyMessage = {
          type: "conversation.item.create",
          item: {
            type: "message",
            role: "user",
            content:[
              {
                type: "input_text",
                text: message.text
              }
            ]
          }
        };
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify(historyMessage));
          console.log("===========================");
          console.log("发送历史记录数据:", JSON.stringify(historyMessage));
        } 
      });
    }
    //8.主动断开WebSocket链接
    public goToDisconnectWebSocktet(){
      if (this.ws && this.ws.readyState === WebSocket.OPEN){
        this.ws.close();
      }
    }
}