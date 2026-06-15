export class NavTalkManager{

    //1.构造单例对象
    //1.1.单例引用
    private static instance: NavTalkManager  
    //1.2.构造函数（constructor）私有化
    //外部模块或其他代码 不能用 new AppConfig() 创建新的实例，保证整个应用中 只能有一个实例
    //也就是说：const a = new AppConfig()  // ❌ 会报错，无法直接实例化
    //想获取实例，只能通过唯一途径：const instance = AppConfig.getInstance()  
    private constructor() {}
    //1.3.获取单例
    public static getInstance(): NavTalkManager {
      if (!NavTalkManager.instance) {
        NavTalkManager.instance = new NavTalkManager()
      }
      return NavTalkManager.instance
    }

    //2.单例对象的属性
    // 公共属性，可直接访问和修改
    public license: string = ""
    public characterName: string = "" 
    public characterId = ""
    public getInfoUrlByCharacterName = "https://api.navtalk.ai/api/open/v1/avatar/getByName"
    public getInfoUrlByCharacterId = "https://api.navtalk.ai/api/open/v1/avatar/detail"
     /*
     The WebSocket connection URL requires one mandatory parameter and supports two query methods:
     license: Your API key (required)
     name: The name of the digital human character (query method 1)
     avatarId: Direct avatar ID for precise lookup (query method 2, higher priority)
     Query Priority: If both avatarId and name are provided, avatarId takes precedence.
     Multiple Avatars Warning: If using name query and multiple avatars share the same name, the system will:
       Automatically select the most recently updated avatar
       Send a conversation.connected.warning event with the selected avatarId immediately after the connection success event
     */

    public avatar_provider_name: string = ""
    public avatar_image_url: string = ""
   
    public targetSessionId: string = ""
    public iceServers: Array<Record<string, any>> = []

    public navtalk_status: NavTalkStatus = NavTalkStatus.Disconnected;
    public navtalk_isCheckNavTalkStatus: boolean = true;

    //3.访问和修改单例对象
    /*
    import { NavTalkManager } from './NavTalkManager'
    const config = NavTalkManager.getInstance()
    config.appKey = '123456'  // 设置
    console.log(config.appKey) // 读取
    */

   
      
}

export const NavTalkStatus = {
    Connecting: "Connecting",
    Connected: "Connected",
    Disconnected: "Disconnected",
} as const;
// 获取类型
export type NavTalkStatus = (typeof NavTalkStatus)[keyof typeof NavTalkStatus];