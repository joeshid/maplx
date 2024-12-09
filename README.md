# maplx

一个基于微信小程序的地图导览应用，具有以下特点：

## 功能特性

- 景点导航与展示
- AI 智能解说生成
- 语音合成（基于阿里云服务）
- 多语言支持（中文/英文）
- 解说词本地缓存

## 技术栈

- 框架：uni-app
- UI：微信小程序原生组件
- 地图：腾讯地图 SDK
- AI：DashScope API
- 语音：阿里云语音合成服务

## 开发环境配置

1. 安装依赖：
```bash
npm install
```

2. 运行开发服务：
```bash
npm run dev:mp-weixin
```

## 配置说明

需要在 `api/auth.js` 中配置相关的 API Key：
- DashScope API Key
- 腾讯地图 Key
