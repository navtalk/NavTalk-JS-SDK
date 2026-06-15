export class NotificationManager{

    private static instance: NotificationManager
    public static getInstance(): NotificationManager {
      if (!NotificationManager.instance) {
        NotificationManager.instance = new NotificationManager()
      }
      return NotificationManager.instance
    }

    private notificationCenter: EventTarget;
    private constructor() {
        this.notificationCenter = new EventTarget();
    }
    
    // 添加监听
    public addObserver(eventName: string, callback: EventListenerOrEventListenerObject) {
        this.notificationCenter.addEventListener(eventName, callback);
    }
    // 移除监听
    public removeObserver(eventName: string, callback: EventListenerOrEventListenerObject) {
        this.notificationCenter.removeEventListener(eventName, callback);
    }
    // 发送通知
    public post(eventName: string, detail: any = {}) {
        this.notificationCenter.dispatchEvent(new MyEvent(eventName, detail));
    }
    /*
    使用示例:
    import { MyEvent, NotificationManager } from "./SingleClass/NotificationManager";
    const nc = NotificationManager.getInstance();
    // 添加监听
    function onLogin(event: Event) {
      const e = event as MyEvent;
      console.log("用户登录：", e.detail.name);
    }
    nc.addObserver("login", onLogin);
    // 发送通知
    nc.post("login", { name: "张叶" });
    // 移除监听
    nc.removeObserver("login", onLogin)
    */
}

//默认的Event类，本身不支持 detail，就需要自定义 Event 类
export class MyEvent extends Event {
  detail: any;
  constructor(type: string, detail: any) {
    super(type);
    this.detail = detail;
  }
}