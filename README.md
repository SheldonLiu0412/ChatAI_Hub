# ChatAI Hub

[中文](README.md) | [English](README_EN.md)

## 总览

![Notepad4e Last Update](https://img.shields.io/eclipse-marketplace/last-update/notepad4e)
![GitHub License](https://img.shields.io/github/license/SheldonLiu0412/ChatAI_Hub)

![GitHub Stats](https://github-readme-stats.vercel.app/api?username=SheldonLiu0412&hide_title=true)

ChatAI Hub是一个集成了各种聊天AI工具的平台，旨在为用户提供一个简单易用的Web界面，以便快速访问和使用不同的聊天AI服务。（Actually, actually, it's just a toy.）

## 项目简介

该平台聚合了四个国内大模型的官方网站，用户可以通过简洁的界面切换访问并使用这些工具。我们的目标是通过提供便捷的访问方式，让用户在一个平台上体验多种聊天AI的能力。

## 主要功能

- **聚合官网访问**：整合四个国内大模型的官方网站，用户可以轻松在不同AI工具之间切换。
- **简单易用的Web界面**：通过人性化的设计，用户可以快速上手并使用平台的所有功能。
- **左侧栏功能**：支持用户添加和编辑功能滑块，包括：
  - 网页浏览时间统计
  - 时钟
  - 提示词存储器

## 技术栈
- **HTML**：用于构建平台的基本结构和布局。
- **CSS**：负责样式设计，确保界面美观且响应式。
- **JavaScript**：实现客户端交互逻辑和动态功能。
- **localStorage API**：用于本地数据存储，如用户偏好设置和文本项。
- **iframe**：集成多个AI聊天工具的官方网站。
- **DOM操作**：实现动态更新页面内容和用户界面。
- **事件监听器**：处理用户交互和触发相应功能。
- **模态框**：用于编辑滑块和确认操作。
- **拖拽排序**：实现滑块的自定义排序功能。

## 如何使用

极简操作：下载名为“Web聚合”的文件夹，然后直接打开其中的Html文件即可

## 许可证

该项目采用 [MIT 许可证](LICENSE)，您可以自由使用或修改代码，但请注意相关要求和条件。

---

我们欢迎任何形式的贡献，包括报告bug、建议新功能或提交代码改进。如有任何问题或建议，请随时提交issue或发起pull request。（都是官方措辞，它只是个玩具，不过大道至简，欢迎一起Play）

## 更新日志
V0.0.5.11:
- 优化滑块编辑功能UI
- 修复了页面加载后首次点击更新日志无效的bug
- 修复了滑块编辑中点击选项区域无法切换选项状态的bug
- 优化网页流畅度