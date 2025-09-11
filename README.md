# Apple 隐私清单生成器

一个基于 Vue 3 + TypeScript 的现代化工具，帮助 iOS 开发者轻松生成符合 Apple 要求的 PrivacyInfo.xcprivacy 隐私清单文件。

## ✨ 功能特性

- **🔒 隐私跟踪配置** - 一键设置应用是否包含隐私跟踪功能
- **🌐 跟踪域名管理** - 直观添加和管理第三方跟踪域名
- **🔧 API 使用声明** - 详细配置应用使用的敏感 API 及使用原因
- **📊 数据收集类型** - 清晰声明应用收集的用户数据类型和使用目的
- **👀 实时预览** - 实时生成和预览 XML 格式的隐私清单
- **📁 文件操作** - 支持导入现有隐私清单文件和导出生成的文件
- **🎨 现代化界面** - 响应式设计，支持多种设备访问

## 🚀 快速开始

### 环境要求

- Node.js: `^20.19.0` 或 `>=22.12.0`
- npm 包管理器

### 安装依赖

```bash
npm install
```

### 开发环境

```bash
# 启动开发服务器
npm run dev
```

访问 `http://localhost:5173` 开始使用

### 生产构建

```bash
# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

## 📖 使用指南

### 1. 隐私跟踪配置
- 根据您的应用是否包含用户跟踪功能，选择相应选项
- 如果启用跟踪，需要添加相关的跟踪域名

### 2. 跟踪域名管理
- 添加您的应用中使用的第三方跟踪域名
- 支持批量添加和删除操作

### 3. API 使用声明
- 选择您的应用使用的敏感 API 类别
- 为每个 API 类别选择合适的使用原因代码
- 系统会自动验证配置的完整性

### 4. 数据收集类型
- 声明您的应用收集的用户数据类型
- 配置数据是否与用户身份关联
- 设置数据是否用于跟踪目的
- 选择数据收集的具体用途

### 5. 预览和导出
- 实时查看生成的 XML 格式隐私清单
- 一键下载生成的 `PrivacyInfo.xcprivacy` 文件
- 将文件添加到您的 Xcode 项目中

## 🛠️ 技术栈

- **前端框架**: Vue 3 (Composition API)
- **开发语言**: TypeScript
- **构建工具**: Vite
- **状态管理**: Pinia (已配置)
- **路由管理**: Vue Router (已配置)
- **代码规范**: ESLint + Vue ESLint Config

## 📁 项目结构

```
privacy-manifest-generator/
├── src/
│   ├── components/          # Vue 组件
│   │   ├── AppHeader.vue           # 应用头部
│   │   ├── PrivacyTrackingCard.vue # 隐私跟踪配置
│   │   ├── TrackingDomainsCard.vue # 跟踪域名管理
│   │   ├── ApiUsageCard.vue        # API 使用声明
│   │   ├── DataTypesCard.vue       # 数据收集类型
│   │   ├── PreviewPanel.vue        # 预览面板
│   │   └── ImportDialog.vue        # 导入对话框
│   ├── assets/              # 静态资源
│   │   └── styles/          # 样式文件
│   ├── App.vue              # 主应用组件
│   └── main.ts              # 应用入口
├── public/                  # 公共资源
├── sample-privacy.xcprivacy # 示例隐私清单文件
├── package.json             # 项目配置
└── vite.config.ts           # Vite 配置
```

## 🔧 可用命令

```bash
# 开发
npm run dev          # 启动开发服务器
npm run build        # 构建生产版本
npm run preview      # 预览构建结果

# 代码质量
npm run lint         # 代码规范检查和修复
npm run type-check   # TypeScript 类型检查
```

## 📋 Apple 隐私清单要求

根据 Apple 的最新政策，从 2024 年开始，包含特定第三方 SDK 或使用某些敏感 API 的应用需要包含隐私清单文件。此工具帮助您：

1. **合规性**: 确保生成的文件符合 Apple 的格式要求
2. **完整性**: 覆盖所有必需的隐私声明项目
3. **准确性**: 提供详细的 API 使用原因代码参考
4. **便捷性**: 简化复杂的 XML 配置过程

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request 来改进这个项目。

### 开发规范
- 遵循 Vue 3 + TypeScript 最佳实践
- 使用 ESLint 进行代码规范检查
- 确保代码具有良好的类型安全性

## 📄 许可证

本项目采用 MIT 许可证，详情请查看 [LICENSE](LICENSE) 文件。

## 🔗 相关链接

- [Apple 隐私清单官方文档](https://developer.apple.com/documentation/bundleresources/privacy_manifest_files)
- [Vue 3 官方文档](https://vuejs.org/)
- [TypeScript 官方文档](https://www.typescriptlang.org/)
- [Vite 官方文档](https://vitejs.dev/)

---

如果这个工具对您有帮助，请给个 ⭐️ Star 支持一下！