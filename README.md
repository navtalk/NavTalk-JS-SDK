# 🚀 navtalk-js-sdk

`navtalk-js-sdk` is a JavaScript SDK for integrating NavTalk into web pages. It registers a Web Component that enables developers to quickly add AI chat, voice interaction, and digital human conversation capabilities to their applications. 
The SDK provides the following features:  
- Real-time AI conversation  
- Voice interaction  
- Chat functionality  
- Easy-to-use API for fast integration  

## Get Project License and Custom Avatar
> **Note:** Before using the SDK, you need to obtain a project license and configure a custom avatar.  
> 
> Please apply for them here: [NavTalk Console](https://console.navtalk.ai/#/)

## Installation
Load the SDK in your HTML page:
```html
  <script src="https://sdk.navtalk.ai/0.0.13/navtalk-web-sdk.umd.js"></script>
```

## Quick Start
```html
<body>
  <script src="https://sdk.navtalk.ai/0.0.13/navtalk-web-sdk.umd.js"></script>
  <my-navtalk-component
    id="navtalk"
    license="******"
    character-id="******"
    style="width:320px;height:600px;left:100px;top:100px;position:fixed;"
  ></my-navtalk-component>
</body>
```

## Component Attributes
### Required Parameters — Project Configuration
1. license: NavTalk License (required)
```html
  <my-navtalk-component 
    license="******" 
  />
```

2. character-name or character-id : NavTalk Avatar Name Or Id  (required)
```html
  <my-navtalk-component 
    character-name="******"
    character-id="******"
  />
```
- Note: When the system role provider is 11Labs, function call and image recognition are not supported.
- Note: Custom roles support function call and image recognition only when OpenAIRealtime is selected.
- Note: name: The name of the digital human character (query method 1)
- Note: avatarId: Direct avatar ID for precise lookup (query method 2, higher priority)
- Note: Query Priority: If both avatarId and name are provided, avatarId takes precedence.

### Optional Parameters — Project Configuration
1. websocketUrl: 
- This is the domain used to connect to your WebSocket. 
- If you are a self-hosted user, you can replace it with your own domain.
```html
  <my-navtalk-component 
    websocketUrl="wss://********" 
  />
```

2. getInfoUrlByCharacterName: 
- API endpoint for fetching avatar info by character name
```html
  <my-navtalk-component 
    getInfoUrlByCharacterName = "https://********"
  />
```

3. getInfoUrlByCharacterId: 
- API endpoint for fetching avatar info by character ID
```html
  <my-navtalk-component 
    getInfoUrlByCharacterId = "https://********"
  />
```

4. isRememberPreviousConversation: 
- Whether to upload the previous conversation (default: true)
```html
  <my-navtalk-component 
    isRememberPreviousConversation="true"
  />
```

### Optional Parameters — UI Configuration
1. style: 
- Customize the position, size, and appearance of your NavTalk component
```html
  <my-navtalk-component 
    style="
      width: 320px;
      height: 600px;
      left: 100px;
      top: 100px;
      position: fixed;
      border-radius: 20px;
      box-shadow: none;"
    />
```

2. default-avatar-background:
- Default avatar image before API response loads
```html
  <my-navtalk-component 
    default-avatar-background="********.png" 
  />
```

3. playButton_style:
- Customize the entire button container (position, size, layout, background, etc.)
```html
  <my-navtalk-component 
    playButton_style="
      left: 150px;
      top: 200px;
      width: 200px;
      height: 200px;
      background-color: gray;"
    />
```

4. playButton_icon_style:
- Customize the button icon style (size, margin, position, etc.)
```html
  <my-navtalk-component 
    playButton_icon_style="
      margin-top: 20px;
      width: 70px;
      height: 70px;
      background-color: green;"
  />
```

5. Play Button Icons (3 states):
- Off state (Disconnected)
- Connecting state
- On state (Connected)
```html
  <my-navtalk-component 
    custom-play-off-icon="********.png"
    custom-play-connecting-icon="********.png"
    custom-play-on-icon=".********.png"
  "/>
```

6. playButton_text_style:
- Customize the button text style (font size, color, weight, spacing, etc.)   
```html
  <my-navtalk-component 
    playButton_text_style="
      margin-top: 30px;
      width: 180px;
      height: 50px;
      color: black;
      font-size: 22px;
      background-color: yellow;"
  />
```

7. Play Button Text (3 states):
```html
  <my-navtalk-component 
    custom-play-off-text="Play"
    custom-play-connecting-text="Playing"
    custom-play-on-text="Close"
  "/>
```

### Optional Parameters — Function Call

- Example 1: A function that closes the NavTalk conversation.  
- Example 2: A function that calculates the sum of two numbers.

1. Add Function Call
```html
  <my-navtalk-component 
    function-calls='[
    {
      "function_call_name": "function_call_close_talk",
      "function_call_description": "Please trigger this method when you receive a message or when the conversation is closed.",
      "function_call_parameters": {
          "properties":{
            "userInput": {"type": "string", "description": "Raw user request content to be processed"}
          },
          "required":["userInput"]
      }
    },
    {
      "function_call_name": "function_call_add_numbers",
      "function_call_description": "Please perform addition. Both parameter numbers must be obtained. Once both numbers are retrieved, please directly return their sum.",
      "function_call_parameters": {
        "properties":{
          "number1": {"type": "string", "description": "This is the first number to be added. If missing, ask: What is the first number?"},
          "number2": {"type": "string", "description": "This is the second number to be added. If missing, ask: What is the second number?"}
        },
        "required": ["number1","number2"]
      }
    }
    ]'
  />
```
2. Trigger Function Call
```html
<body>
<script>
  const navtalkElement = document.querySelector("#navtalk");
  navtalkElement.addEventListener("sdkFuncationCall", function (event) {
    const detail = event.detail;
    const functionName = detail.raw_data.name;
    const args = detail.data.arguments;
    console.log("Function Name:", functionName);
    console.log("Params:", args);
    if (functionName === "function_call_close_talk") {
      navtalkElement.clickPlayOrStopButton();
    }
  });
</script>
</body>
```


## Related Projects

If you want to learn more about AI or chat-related projects, check out:

[NavTalk Samples](https://github.com/navtalk/Samples)

## Author
navtalk, frankfu@navtalk.ai
