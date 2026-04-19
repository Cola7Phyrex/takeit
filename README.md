# TakeIt

TakeIt 是一个轻量级的个人打卡工具，围绕 `习惯`、`任务` 和 `统计` 三个页签展开，适合放在手机主屏上快速记录日常推进。

项目定位：

- 习惯：适合每天 0/1 次完成的长期坚持项
- 任务：适合有总目标次数的累计型事项
- 统计：负责数据导入导出、成就解锁和关键纪录展示

## 功能概览

### 习惯

- 新增、修改、删除习惯
- 今日打卡，再点一次可取消
- 最近七日补卡
- 查看本周、本月、今年、累计完成次数

### 任务

- 新增、修改、删除任务
- 每次点击打卡增加 1 次完成
- 发光三角形进度条
- 点击进度条可直接修改已完成次数

### 统计

- 本地数据导出为 JSON
- 从 JSON 导入并恢复数据
- 成就系统
- 展示最长累计打卡次数及对应习惯

## 技术特性

- 纯静态前端，无后端
- 本地数据存储于 `localStorage`
- 支持 GitHub Pages 部署
- 资源路径采用相对路径，适配仓库子路径
- 支持 PWA 基础能力
- 安卓可安装，iPhone 可添加到主屏幕

## 文件结构

按需求约束，所有文件都放在项目根目录，不创建子文件夹。

```text
TakeIt/
├── index.html
├── styles.css
├── app.js
├── manifest.webmanifest
├── sw.js
├── TakeIt-prd.md
└── README.md
```

## 本地预览

直接打开 `index.html` 就可以查看页面。

如果你要测试 PWA 或 Service Worker，建议使用本地静态服务，例如：

```bash
python3 -m http.server 8000
```

然后访问：

```text
http://localhost:8000/
```

## 部署到 GitHub Pages

### 方式一：仓库 Pages

1. 把整个项目推到 GitHub 仓库根目录
2. 进入仓库 `Settings`
3. 打开 `Pages`
4. 在 `Build and deployment` 中选择：
   - `Source`: `Deploy from a branch`
   - `Branch`: 选择你的主分支，例如 `main`
   - `Folder`: `/ (root)`
5. 保存后等待 GitHub 发布

发布地址通常为：

```text
https://你的用户名.github.io/仓库名/
```

### 方式二：用户主页仓库

如果仓库名是 `你的用户名.github.io`，则地址通常为：

```text
https://你的用户名.github.io/
```

## PWA 说明

项目已包含：

- `manifest.webmanifest`
- `sw.js`
- `theme-color`
- Apple Web App 相关 meta

安装体验说明：

- 安卓浏览器中可触发“安装 App”
- iPhone Safari 中可通过“添加到主屏幕”安装

如果没有 `icon.png`，应用仍可运行，但主屏图标和安装图标不会完整生效。

## 数据说明

所有数据默认保存在浏览器本地的 `localStorage` 中。

主要能力：

- 自动本地保存
- 手动导出 JSON 备份
- 手动导入 JSON 恢复

注意：

- 清除浏览器站点数据后，本地记录会消失
- 更换设备前建议先导出 JSON

## 设计风格

- 浅色背景
- 红色强调色
- iOS 原生感卡片和圆角
- 偏运动、冲刺、激情的视觉表达

## 已知注意事项

- `icon.png` 需要你手动放到项目根目录
- iPhone 对 PWA 的支持和安卓不完全一致，安装入口也不同
- Service Worker 更新后，浏览器可能需要一次刷新才能看到最新缓存资源

## License

如需开源发布，可以按你的需要补充许可证，例如 MIT。
