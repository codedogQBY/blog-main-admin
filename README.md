# 博客管理系统

这是一个基于 Vue 3 + Element Plus 的博客管理后台系统。

## 功能特性

- 🔐 用户认证（登录/登出）
- 👥 用户管理（增删改查、角色分配）
- 🛡️ 角色管理（创建角色、权限分配）
- 🔑 权限管理（权限同步、权限编辑）
- 📊 响应式布局，支持移动端
- 🎨 现代化 UI 设计

## 技术栈

- **前端框架**: Vue 3 + TypeScript
- **UI 组件库**: Element Plus
- **状态管理**: Pinia
- **路由管理**: Vue Router
- **HTTP 客户端**: Axios
- **构建工具**: Vite

## 开发环境设置

1. 安装依赖
\`\`\`bash
npm install
# 或
pnpm install
\`\`\`

2. 配置环境变量
创建 `.env.development` 文件：
\`\`\`
VITE_API_BASE_URL=http://localhost:3000
\`\`\`

3. 启动开发服务器
\`\`\`bash
npm run dev
\`\`\`

## 系统架构

### API 接口
- `POST /auth/login` - 用户登录
- `GET /auth/profile` - 获取用户信息
- `GET /users` - 用户列表（分页、搜索）
- `POST /users` - 创建用户
- `PUT /users/:id` - 更新用户
- `DELETE /users/:id` - 删除用户
- `POST /users/:id/role` - 分配角色
- `GET /roles` - 角色列表
- `POST /roles` - 创建角色
- `PUT /roles/:id` - 更新角色
- `DELETE /roles/:id` - 删除角色
- `POST /roles/:id/permissions` - 设置角色权限
- `GET /permissions` - 权限列表
- `POST /permissions` - 创建权限
- `PUT /permissions/:id` - 更新权限
- `DELETE /permissions/:id` - 删除权限
- `POST /permissions/sync` - 同步权限

### 权限系统
系统使用基于角色的访问控制（RBAC）：
- 用户可以分配角色
- 角色可以分配多个权限
- 超级管理员拥有所有权限
- 权限格式: `模块.操作`（如：`user.read`、`role.create`）

### 页面结构
- `/login` - 登录页面
- `/users` - 用户管理
- `/roles` - 角色管理
- `/permissions` - 权限管理

## 使用说明

1. **登录系统**
   - 使用管理员邮箱和密码登录
   - 系统会自动获取用户权限

2. **用户管理**
   - 查看所有用户列表
   - 搜索用户（支持姓名和邮箱）
   - 创建新用户并分配角色
   - 编辑用户信息
   - 删除用户
   - 设置超级管理员

3. **角色管理**
   - 创建和管理角色
   - 为角色分配权限
   - 查看角色关联的权限

4. **权限管理**
   - 查看所有系统权限
   - 手动创建权限
   - 从代码自动同步权限
   - 编辑权限信息

## 部署

1. 构建生产版本
\`\`\`bash
npm run build
\`\`\`

2. 部署到服务器
将 `dist` 目录下的文件部署到 Web 服务器

3. 配置生产环境变量
\`\`\`
VITE_API_BASE_URL=https://your-api-domain.com
\`\`\`

## 注意事项

- 确保后端服务已启动并运行在正确的端口
- 首次使用需要创建超级管理员账户
- 权限同步功能需要后端支持自动扫描注解
- 建议定期备份用户和权限数据
