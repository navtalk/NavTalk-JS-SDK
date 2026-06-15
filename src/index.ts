import { AudioManager } from "./SingleClass/AudioManager";
import { NavTalkManager, NavTalkStatus } from "./SingleClass/NavTalkManager";
import { NotificationManager } from "./SingleClass/NotificationManager";
import { WebRTCManager } from "./SingleClass/WebRTCManager";
import { WebSocketManager } from "./SingleClass/WebSocketManager";

import navtalk_off from "./assets/navtalk_off.png"
import navtalk_on from "./assets/navtalk_on.png"
import navtalk_connecting from "./assets/navtalk_connecting.png"
import navtalkStyles from "./Style/style.css?raw"
import default_avatar from "./assets/default_background.png"

// ==========================
// STEP 1: 封装为 Web Component
// ==========================
class MyNavTalk extends HTMLElement {

  //通话按钮的三种状态下显示的图标
  private playOffIcon = navtalk_off;
  private playConnectingIcon = navtalk_connecting;
  private playOnIcon = navtalk_on;
  //通话按钮的三种状态下显示的文本
  private playOffText = "Call";
  private playConnectingText = "Connecting...";
  private playOnText = "Hang Up";

  constructor() {
    super()
    //创建 Shadow DOM，避免样式污染
    this.attachShadow({ mode: "open" })
  }
  connectedCallback() {
    //获取默认头像(获取真实头像之前加载的本地默认图片)
    const customDefaultAvatar = this.getAttribute("default-avatar-background") || default_avatar;
    //获取PlayButton在三个状态下的图标文件
    this.playOffIcon =  this.getAttribute("custom-play-off-icon") || navtalk_off;
    this.playConnectingIcon =  this.getAttribute("custom-play-connecting-icon") || navtalk_connecting;
    this.playOnIcon =  this.getAttribute("custom-play-on-icon") || navtalk_on;
    //获取PlayButton在三个状态下的文本显示
    this.playOffText =  this.getAttribute("custom-play-off-text") || "Call";
    this.playConnectingText =  this.getAttribute("custom-play-connecting-text") || "Connecting...";
    this.playOnText =  this.getAttribute("custom-play-on-text") || "Hang Up";
    //初始化UI 容器
    this.shadowRoot!.innerHTML = `
    <style>${navtalkStyles}</style>
    <div id="navatalkCardContainer">
      <img id="avatarImage" src="${customDefaultAvatar}"/>
      <video id="character-video" class="character-video" autoplay playsinline style="opacity:0"></video>
      <button id="playButton" class="playButton">
        <img id="playButtonIcon" class="playButtonIcon" src="${this.playOffIcon}"/>
        <span id="playButtonText" class="playButtonText">Call</span>
      </button>
    </div>
    `
    //处理用户传入的参数：
    this.handleUserParameters();
  }

  //处理用户传入的参数：
  private handleUserParameters(){
    //1.必传参数--项目配置相关
    //1.1.必传参数：license
    const license = this.getAttribute("license");
    if (!license){
        //alert("License is required. Please provide a valid license as an attribute.");
        console.error("License is required. Please provide a valid license as an attribute.");
        return;
    }
    NavTalkManager.getInstance().license = license;
    //1.2.必传参数-选择1：characterName
    const characterName = this.getAttribute("character-name");
    if (characterName){
        NavTalkManager.getInstance().characterName = characterName;
    }
   //1.3.必传参数-选择2：characterId（如果同时提供了characterName和characterId，以characterId为准）
    const characterId = this.getAttribute("character-id");
    if (characterId){
        NavTalkManager.getInstance().characterId = characterId;
    }
    if (!characterName && !characterId){
        console.error("Character Name or Character ID is required. Please provide a valid character name or ID as an attribute.");
        return;
    }
    //2.可选参数--项目配置相关
    //2.1.可选参数：websocketUrl
    const current_websocketUrl = this.getAttribute("websocketUrl");
    if (current_websocketUrl && current_websocketUrl.length>0){
       WebSocketManager.getInstance().websocketUrl = current_websocketUrl;
    }
    //2.2.可选参数：获取角色详情的链接域名
    //可选参数：getInfoUrlByCharacterName
    const getInfoUrlByCharacterName = this.getAttribute("getInfoUrlByCharacterName");
    if (getInfoUrlByCharacterName && getInfoUrlByCharacterName.length>0){
       NavTalkManager.getInstance().getInfoUrlByCharacterName = getInfoUrlByCharacterName;
    }
    //2.3.可选参数：getInfoUrlByCharacterId
    const getInfoUrlByCharacterId = this.getAttribute("getInfoUrlByCharacterId");
    if (getInfoUrlByCharacterId && getInfoUrlByCharacterId.length>0){
       NavTalkManager.getInstance().getInfoUrlByCharacterId = getInfoUrlByCharacterId;
    }
    //2.4.可选参数：isRememberPreviousConversation(默认为true)
    const isRememberPreviousConversation = this.getAttribute("isRememberPreviousConversation");
    if (isRememberPreviousConversation === "false") {
        WebSocketManager.getInstance().isRememberPreviousConversation = false;
    }
  
    //3.可选参数--UI相关
    //3.1.可选参数：position相关参数，目前开发：style
    const cardContainer = this.shadowRoot!.getElementById("navatalkCardContainer") as HTMLDivElement;
    const current_cardContainer_style = this.getAttribute("style") || null;
    if (current_cardContainer_style != null){
       //覆盖掉原来的navatalkCardContainer的布局
       //cardContainer.style.cssText = current_cardContainer_style;
       //在原来的navatalkCardContainer的布局上添加布局语句
       cardContainer.style.cssText += current_cardContainer_style;
    }
    //3.2.可选参数：从外部传入加载的默认图片 -- 要在最顶部写
    //const customDefaultAvatar = this.getAttribute("default-avatar-background") || default_avatar;
    
    //3.3.修改按钮相关: 整个按钮 + 按钮内部的icon + 按钮内部的text
    //(1).修改整个按钮的位置和大小
    const playButton = this.shadowRoot!.getElementById("playButton") as HTMLDivElement;
    const current_playButton_style = this.getAttribute("playButton_style") || null;
    if (current_playButton_style != null){
       playButton.style.cssText += current_playButton_style;
    }
    //(2).修改按钮内部的iCon
    //位置大小:
    const playButton_Icon = this.shadowRoot!.getElementById("playButtonIcon") as HTMLDivElement;
    const current_playButton_Icon_style = this.getAttribute("playButton_icon_style") || null;
    if (current_playButton_Icon_style != null){
       playButton_Icon.style.cssText += current_playButton_Icon_style;
    }
    //三个状态下的显示图标:  -- 要在最顶部写
    //(3).修改按钮内部的text
    //位置大小:
    const playButton_Text = this.shadowRoot!.getElementById("playButtonText") as HTMLDivElement;
    const current_playButton_Text_style = this.getAttribute("playButton_text_style") || null;
    if (current_playButton_Text_style!= null){
       playButton_Text.style.cssText += current_playButton_Text_style;
    }
    //三个状态下的显示文本: -- 要在最顶部写

    //4.可选参数：Fuction Call
    const function_calls = this.getAttribute("function-calls");
    if (function_calls) {
        try {
            const functionsArray = JSON.parse(function_calls);
            WebSocketManager.getInstance().funcationCallArray = functionsArray;
            //console.log("解析函数列表成功:", functionsArray);
        } catch (e) {
            console.error("解析 functions 属性失败:", e);
        }
    }
    
    //所有业务逻辑
    this.allBusinessLogic();
  }

  //所有业务逻辑
  private async allBusinessLogic(){
    //1.UI
    this.setUpUI()
    //2.调用接口：
    // 根据角色名称，获取该角色背景图片和Provider
    // 修改默认背景图片为指定角色的人物画像
    await this.setCharacterImage();
    //3.添加所有通知
    this.addAllEventListener()
  }
  private setUpUI(){
    const playButton = this.shadowRoot!.getElementById('playButton');
    playButton?.addEventListener('click',()=>{
        this.clickPlayOrStopButton();
    });
    const remoteVideo = this.shadowRoot!.getElementById("character-video") as HTMLVideoElement;
    WebRTCManager.getInstance().remoteVideo = remoteVideo;
  }
  private async setCharacterImage(){
    const license = NavTalkManager.getInstance().license;
    const characterName = NavTalkManager.getInstance().characterName;
    const characterId = NavTalkManager.getInstance().characterId;
    console.log("Current character name is:",characterName);
    var urlString = "";
    if (NavTalkManager.getInstance().characterId.length > 0){
        urlString = `${NavTalkManager.getInstance().getInfoUrlByCharacterId}?license=${license}&avatarId=${characterId}`;
    }else{
        urlString = `${NavTalkManager.getInstance().getInfoUrlByCharacterName}?license=${license}&name=${characterName}`;
    }
    const response = await fetch(urlString,{
        method: "GET"
    });
    //console.log("Fetch Avatar Detail Info:",response);
    if (!response.ok){
         console.error("Request failed:", response.status);
         return;
    }
    const result_json = await response.json();
    console.log("result_json:",result_json);
    const result_object = result_json.data;
    const result_avatar_url = result_object.thumbnailUrl;
    const result_avatar_provider = result_object.providerName;
     //获取图片元素
    const avatarImage = this.shadowRoot!.getElementById('avatarImage') as HTMLImageElement;
    if (result_avatar_url && result_avatar_url.length > 0 && avatarImage && result_avatar_provider && result_avatar_provider.length > 0){
        //加载背景图片
        avatarImage.src = result_avatar_url;
        //保存值
        NavTalkManager.getInstance().avatar_image_url = result_avatar_url
        NavTalkManager.getInstance().avatar_provider_name = result_avatar_provider
    }
  }
  public clickPlayOrStopButton(){
    if (NavTalkManager.getInstance().navtalk_status == NavTalkStatus.Disconnected){
        NavTalkManager.getInstance().navtalk_status = NavTalkStatus.Connecting;
        this.updateNavtalkPlayStatuseUI();

        NavTalkManager.getInstance().navtalk_isCheckNavTalkStatus = true;
        WebSocketManager.getInstance().startToConnectWebSocket();
    }else if (NavTalkManager.getInstance().navtalk_status == NavTalkStatus.Connected){
        NavTalkManager.getInstance().navtalk_status = NavTalkStatus.Disconnected;
        this.updateNavtalkPlayStatuseUI();
        
        NavTalkManager.getInstance().navtalk_isCheckNavTalkStatus = false;
        //(1).暂停采集音频数据
        AudioManager.getInstance().stopRecording();
        //(2).关闭WebSocket
        WebSocketManager.getInstance().goToDisconnectWebSocktet();
        //(3).关闭WebRTC
        WebRTCManager.getInstance().peerConnection?.close();
    }
  }
  //根据WebSocket和WebRTC的状态来更新UI
  //添加所有通知
  private addAllEventListener(){
    NotificationManager.getInstance().addObserver("webSocketConnectStatusChanged", this.webSocketConnectStatusChanged.bind(this));
    NotificationManager.getInstance().addObserver("webRTCConnectStatusChanged", this.webRTCConnectStatusChanged.bind(this));
    NotificationManager.getInstance().addObserver("functionCallReceived", this.functionCallReceived.bind(this));
  }
  //(1).WebSocket链接状态发生改变
  private webSocketConnectStatusChanged(event: Event){
    console.log("WebSocket链接状态发生改变：", WebSocketManager.getInstance().ws?.readyState);
    this.udpateNavtalkStatus();
    this.updateNavtalkPlayStatuseUI()
  }
  //(2).WebRTC的链接状态发生改变
  private webRTCConnectStatusChanged(event: Event){
    console.log("WebRTC的链接状态发生改变：",WebRTCManager.getInstance().peerConnection?.iceConnectionState);
    this.udpateNavtalkStatus();
    this.updateNavtalkPlayStatuseUI()
  }
  //(3).切换对话状态
  private udpateNavtalkStatus(){
    if (NavTalkManager.getInstance().navtalk_isCheckNavTalkStatus == false){
        return;
    }
    const webSocket_status =  WebSocketManager.getInstance().ws?.readyState;
    const webRTC_status =  WebRTCManager.getInstance().peerConnection?.iceConnectionState;
    if (webSocket_status === WebSocket.OPEN && webRTC_status == "connected"){
        NavTalkManager.getInstance().navtalk_status = NavTalkStatus.Connected;
    }else if (webSocket_status === WebSocket.CLOSED){
        NavTalkManager.getInstance().navtalk_status = NavTalkStatus.Disconnected;
     }else{
        NavTalkManager.getInstance().navtalk_status = NavTalkStatus.Connecting;
    }
    console.log("===>",NavTalkManager.getInstance().navtalk_status);
  }
  //移除所有通知
  /*
  private removeAllEventListener(){
    NotificationManager.getInstance().removeObserver("webSocketConnectStatusChanged", this.webSocketConnectStatusChanged.bind(this));
    NotificationManager.getInstance().removeObserver("webRTCConnectStatusChanged", this.webRTCConnectStatusChanged.bind(this));
    NotificationManager.getInstance().removeObserver("functionCallReceived", this.functionCallReceived.bind(this));
  }
    */
  //根据WebSocket和WebRTC的状态来更新UI
  private updateNavtalkPlayStatuseUI(){
    const button = this.shadowRoot!.getElementById("playButton") as HTMLButtonElement;
    const playIcon = this.shadowRoot!.getElementById("playButtonIcon") as HTMLImageElement;
    const playText = this.shadowRoot!.getElementById("playButtonText") as HTMLSpanElement;
    if (!button || !playIcon || !playText) return;

    if (NavTalkManager.getInstance().navtalk_status == NavTalkStatus.Disconnected){
        button.disabled = false;
        playIcon.src = this.playOffIcon;
        playText.textContent = this.playOffText;
        const remoteVideo = this.shadowRoot!.getElementById("character-video") as HTMLVideoElement;
        remoteVideo.style.opacity = "0";
    }else if (NavTalkManager.getInstance().navtalk_status == NavTalkStatus.Connecting){
        button.disabled = true;
        playIcon.src = this.playConnectingIcon;
        playText.textContent = this.playConnectingText;
        const remoteVideo = this.shadowRoot!.getElementById("character-video") as HTMLVideoElement;
        remoteVideo.style.opacity = "0";
    }else{
        button.disabled = false;
        playIcon.src = this.playOnIcon;
        playText.textContent = this.playOnText;
        const remoteVideo = this.shadowRoot!.getElementById("character-video") as HTMLVideoElement;
        remoteVideo.style.opacity = "1";
    }
  }
  //处理Function Call的通知
  private functionCallReceived(message: any){
    /*
         ["data": {
             arguments =     {
                 userInput = "\U5173\U95ed\U5bf9\U8bdd";
             };
             "call_id" = "call_JZ0DWumfrsN5Kxgm";
             "function_name" = "function_call_close_talk";
         }, "raw_data": {
             arguments = "{  \n  \"userInput\": \"\U5173\U95ed\U5bf9\U8bdd\"\n}";
             "call_id" = "call_JZ0DWumfrsN5Kxgm";
             "event_id" = "event_DIVB1JW5bGHAYIDBeVdoo";
             "item_id" = "item_DIVB0UxgBhrlBwcyFyrbB";
             name = "function_call_close_talk";
             "output_index" = 0;
             "response_id" = "resp_DIVB0YYUxlS7kL93EncQZ";
             type = "response.function_call_arguments.done";
         }, "type": realtime.response.function_call_arguments.done]
    */
    console.log("Handle Function Call-1:", message);
    console.log("Handle Function Call-2:", message.detail.raw_data.name);
    // 1.创建 CustomEvent
    const event = new CustomEvent('sdkFuncationCall',{
      detail: message.detail, // 这里把消息传给外部
      bubbles: true,          // 是否允许事件冒泡
      composed: true          // 允许跨 Shadow DOM
    });
    // 2.派发事件
    this.dispatchEvent(event);
  }
}

// ==========================
// STEP 2: 注册 Web Component
// ==========================
//这里的 "my-navtalk-component" 就决定了 npm 包被引入后在 HTML 中使用的标签名称。
//(1).注册一个 Web Component, 防止重复注册
//(2).定义 HTML 标签名
if (!customElements.get("my-navtalk-component")) {
    customElements.define("my-navtalk-component", MyNavTalk)
}


