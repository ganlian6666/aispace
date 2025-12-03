# Cloudflare 后端部署指南

代码已经全部准备好了！因为你已经连接了 GitHub 和 Cloudflare Pages，当你把这些代码推送到 GitHub 后，Cloudflare 会自动部署前端页面和后端 Functions。

但是，因为我们引入了数据库 (D1)，你需要在 Cloudflare 的网页后台进行一些简单的配置才能让它跑起来。

## 第一步：创建数据库

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)。
2. 进入 **Workers & Pages** -> **D1**。
3. 点击 **Create database**。
4. 名字输入 `freespace-db` (或者其他你喜欢的，但要记住)。
5. 点击 **Create**。

## 第二步：初始化数据库表

我们需要把 `schema.sql` 里的表结构导入到数据库中。

1. 在刚刚创建好的数据库页面，点击 **Console** 标签页。
2. 打开你本地项目里的 `schema.sql` 文件，复制里面的所有内容。
3. 粘贴到 Cloudflare Console 的输入框中，点击 **Execute**。
   - 你应该能看到 "Success" 的提示，这说明表已经创建好了。

## 第三步：绑定数据库到 Pages 项目

这是最关键的一步，把你的网页项目和数据库连接起来。

1. 进入你的 **Pages** 项目页面 (就是你部署这个网站的项目)。
2. 点击 **Settings** -> **Functions**。
3. 找到 **D1 Database Bindings** 部分，点击 **Add binding**。
4. 设置如下：
   - **Variable name**: `DB`  <-- **必须完全一致，大写**，因为代码里用的是 `env.DB`。
   - **D1 database**: 选择你第一步创建的 `freespace-db`。
5. 点击 **Save**。

## 第四步：重新部署

为了让绑定生效，你需要重新部署一次。

1. 你可以直接在 Pages 页面点击 **Manage Deployment** -> **Create deployment** -> **Retry** (重试最近一次构建)。
2. 或者，你随便修改一点代码（比如在 README 里加个空格），推送到 GitHub，触发自动构建。

---

## 本地开发 (可选)

如果你想在本地测试：

1. 确保安装了 Node.js。
2. 运行 `npx wrangler pages dev . --d1 DB=freespace-db` (需要先登录 wrangler)。

## 常见问题

*   **提交失败？** 检查 Settings -> Functions 里的 Variable name 是不是填的 `DB`。
*   **点赞没反应？** 可能是数据库表没创建成功，请重复第二步。
