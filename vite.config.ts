import { defineConfig } from "vite";
export default defineConfig({
    server:{
     allowedHosts:[
        'superboldly-impostrous-jill.ngrok-free.dev'
     ]
    },
    build: {
        lib: {
            entry: "src/index.ts",          // SDK入口文件
            name: "NavTalkSDK",           // 全局变量名：决定全局访问名称
            formats: ["umd"],
            fileName: () => "navtalk-web-sdk.umd.js"//这里注意必须和package-lock.json中的main和name中文件名称一致
        },
        rollupOptions: {
            external: [],                   // 外部依赖（可选）
            output: {
              globals: {}
            }
        }
    }
});