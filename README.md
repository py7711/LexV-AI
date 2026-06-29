# DeVoice AI 音视频工具站

这是一个基于 Next.js App Router 的 DeVoice 风格 AI 音视频工具站。项目覆盖公开工具页、登录态资源页、积分定价、媒体任务 API、R2 上传、BullMQ 队列 Worker、多服务商降级和 Stripe 计费入口。

## 项目结构

```text
app/              Next.js 页面路由与 API 路由
components/       复用 UI 组件和工具页配置
lib/              业务逻辑、服务商封装、队列、积分、鉴权和存储
workers/          BullMQ 媒体处理 Worker
types/            跨模块共享类型
prisma/           Prisma 数据模型
public/           页面运行时使用的图片和静态资源
docs/             中文产品、部署和服务商接入文档
```

## 主要功能

- 公开工具页：首页、音频转文字、视频转文字、AI 语音转文字、降噪、文本转语音、AI 语音生成、声音克隆、YouTube 转写、YouTube 字幕下载和 YouTube 摘要。
- 内容页：博客、隐私政策、退款政策和使用条款。
- 登录态页面：控制台、我的资源、任务结果页和支付结果页。
- 后端能力：任务创建/查询/删除/导出、R2 签名上传、API Key、健康检查、审计日志、积分扣减和支付回调。
- 处理能力：Deepgram、AssemblyAI、Groq、DeepSeek、Gemini、DeepL、OpenAI TTS、ElevenLabs 等服务商按场景降级。

## 快速启动

```bash
pnpm install
cp .env.example .env
pnpm prisma:generate
pnpm prisma:push
pnpm dev
```

如果需要单独启动媒体处理 Worker：

```bash
pnpm worker
```

构建校验：

```bash
pnpm build
```

## 环境变量

最小本地浏览只需要：

```bash
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET=""
DATABASE_URL=""
```

完整能力还需要配置：

- Redis：`REDIS_URL` 用于 BullMQ，`UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` 用于轻量缓存。
- 存储：`R2_ENDPOINT`、`R2_ACCESS_KEY_ID`、`R2_SECRET_ACCESS_KEY`、`R2_BUCKET`、`R2_PUBLIC_BASE_URL`。
- AI 服务商：`DEEPGRAM_API_KEY`、`ASSEMBLYAI_API_KEY`、`GROQ_API_KEY`、`DEEPSEEK_API_KEY`、`GEMINI_API_KEY`、`DEEPL_API_KEY`、`OPENAI_API_KEY`、`ELEVENLABS_API_KEY`。
- 支付：`STRIPE_SECRET_KEY`、`STRIPE_WEBHOOK_SECRET` 和各套餐 Price ID。

完整示例见 [.env.example](/Users/gxx/idea/LexV-AI/.env.example)。

## 关键文件

- [components/devoice-shell.tsx](/Users/gxx/idea/LexV-AI/components/devoice-shell.tsx)：全站外壳、侧边栏、登录弹窗、积分入口和促销条。
- [components/devoice-tool-page.tsx](/Users/gxx/idea/LexV-AI/components/devoice-tool-page.tsx)：工具页配置和主要展示区。
- [components/devoice-static-page.tsx](/Users/gxx/idea/LexV-AI/components/devoice-static-page.tsx)：博客与政策页面内容。
- [app/api/jobs/route.ts](/Users/gxx/idea/LexV-AI/app/api/jobs/route.ts)：Web 端媒体任务创建与列表查询。
- [app/api/v1/jobs/route.ts](/Users/gxx/idea/LexV-AI/app/api/v1/jobs/route.ts)：开发者 API 任务创建。
- [workers/media-worker.ts](/Users/gxx/idea/LexV-AI/workers/media-worker.ts)：异步媒体处理 Worker。
- [lib/provider-fallback.ts](/Users/gxx/idea/LexV-AI/lib/provider-fallback.ts)：多服务商降级执行器。
- [lib/queue.ts](/Users/gxx/idea/LexV-AI/lib/queue.ts)：BullMQ 队列连接、熔断和入队逻辑。

## 运行边界

- 未配置数据库时，部分登录和任务流程会进入本地 Cookie 兜底，便于本地演示，但不适合生产持久化。
- 未配置 Redis 或队列不可用时，部分任务会同步生成演示结果，真实长媒体处理需要 Worker 和 Redis TCP 连接。
- 未配置 R2 时，上传和持久化音频产物不可完整使用。
- 未配置 AI 服务商时，系统会尽量使用演示结果，无法完成真实转写、摘要、翻译或语音生成。

## 更多文档

- [产品说明](/Users/gxx/idea/LexV-AI/docs/产品说明.md)
- [部署说明](/Users/gxx/idea/LexV-AI/docs/部署说明.md)
- [Vercel 与云服务商部署文档](/Users/gxx/idea/LexV-AI/docs/Vercel与云服务商部署文档.md)
- [服务商接入与降级策略](/Users/gxx/idea/LexV-AI/docs/服务商接入与降级策略.md)
