# VVV Admin

## 项目说明
VVV Admin 是一个现代化的管理后台应用，基于 Vue 3 构建，使用 TypeScript 作为开发语言。项目采用 Vite 作为构建工具，Vuetify 3 作为 UI 框架，Vue Router 管理页面路由，Pinia 进行状态管理，并使用 Inversify 作为 IoC 容器。单元测试采用 Vitest 框架。

该项目提供了一个响应式、功能丰富的用户界面，适用于各类管理系统的快速开发。

## ❗️ Important Links

### 核心依赖库
- 🖼️ [Vue 3](https://v3.vuejs.org/) - 渐进式 JavaScript 框架
- 🎨 [Vuetify 3](https://vuetifyjs.com/) - Material Design 组件库
- 🗃️ [Pinia](https://pinia.vuejs.org/) - Vue 状态管理库
- 🚦 [Vue Router](https://router.vuejs.org/) - Vue 官方路由管理器
- ⚡ [Vite](https://vitejs.dev/) - 下一代前端构建工具
- 📝 [TypeScript](https://www.typescriptlang.org/) - JavaScript 的超集
- 🧪 [Vitest](https://vitest.dev/) - Vite 原生测试框架
- 🔄 [Inversify](https://inversify.io/) - 强大的 IoC 容器

## 💿 安装

使用您喜欢的包管理器设置项目。使用相应的命令安装依赖项：

| 包管理器                                                      | 命令           |
|---------------------------------------------------------------|----------------|
| [yarn](https://yarnpkg.com/getting-started)                   | `yarn install` |
| [npm](https://docs.npmjs.com/cli/v7/commands/npm-install)     | `npm install`  |
| [pnpm](https://pnpm.io/installation)                          | `pnpm install` |
| [bun](https://bun.sh/#getting-started)                        | `bun install`  |

完成安装后，您的环境已准备好进行开发。

## 研发说明

VVV Admin 采用灵活的服务架构设计，支持多种后端服务模式。目前，系统的所有业务服务（如登录认证）均支持以下两种模式：

1. **Mock 服务**: 提供预定义数据的简单实现，适用于开发和测试环境，无需外部依赖。
2. **Supabase 服务**: 与 Supabase 后端服务集成，提供真实的数据存储和处理能力。

这种设计使得系统可以在不同环境中灵活切换，开发者可以在本地使用 Mock 服务快速开发，而在生产环境中使用 Supabase 服务。未来所有新增的业务服务也将遵循这一模式，提供 Mock 和 Supabase 两种实现方式。

### 服务使用配置

登录服务类型通过环境变量配置。复制 `.env.example` 文件到 `.env` 并设置以下变量：

```bash
# Login service configuration
# Options: mock, supabase
VITE_SERVICE_TYPE=mock

# Supabase configuration (only needed if VITE_SERVICE_TYPE=supabase)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_KEY=your-supabase-anon-key
```

#### Mock 登录服务

Mock 登录服务包含以下预定义用户：

| Username | Email             | Password  |
|----------|-------------------|-----------|
| admin    | admin@example.com | admin123  |
| user     | user@example.com  | user123   |
| test     | test@example.com  | test123   |

#### Supabase 登录服务

要使用 Supabase 登录服务：

1. 在 [https://supabase.com](https://supabase.com) 创建 Supabase 项目
2. 设置电子邮件/密码认证
4. 使用你的 Supabase URL 和匿名密钥更新 `.env` 文件
5. 设置 `VITE_SERVICE_TYPE=supabase`

## 🚀 使用 GitHub Actions 进行 CI/CD

本项目包含一个 GitHub Actions 工作流，用于持续集成和部署。该工作流会构建应用程序，创建 Docker 镜像，并使用 Docker Compose 将其部署到服务器上。

### 设置 GitHub Secrets

为了保护敏感信息（如 Supabase 凭证），工作流使用 GitHub secrets。您需要在 GitHub 仓库中设置以下 secrets：

1. **Docker Hub 凭证**：
   - `DOCKERHUB_USERNAME`：您的 Docker Hub 用户名
   - `DOCKERHUB_TOKEN`：您的 Docker Hub 访问令牌

2. **服务器部署凭证**：
   - `SERVER_ADDRESS`：您的部署服务器地址
   - `SERVER_USER`：用于 SSH 访问服务器的用户名
   - `SSH_PEM_KEY`：服务器访问的 SSH 私钥

3. **服务配置**：
   - `VITE_SERVICE_TYPE`：登录服务类型（例如，"supabase"）
   - `VITE_SUPABASE_URL`：您的 Supabase 项目 URL
   - `VITE_SUPABASE_KEY`：您的 Supabase 匿名密钥

要将这些 secrets 添加到您的 GitHub 仓库：
1. 在 GitHub 上访问您的仓库
2. 点击 "Settings" > "Secrets and variables" > "Actions"
3. 点击 "New repository secret"
4. 添加每个 secret 及其名称和值

工作流将在构建过程中自动使用这些 secrets 创建 `.env` 文件，确保您的 Supabase 凭证不会在仓库中暴露。


## 📑 License
[MIT](http://opensource.org/licenses/MIT)
