# DeVoice Vercel 与云服务商部署文档

## 推荐架构

- Web/API：Vercel 部署 Next.js。
- Worker：Railway、Render、Fly.io、Cloud Run、ECS 或任意支持常驻进程的平台。
- 数据库：TiDB/MySQL。
- Redis：Upstash Redis TCP 用于 BullMQ，REST API 用于轻量缓存。
- 存储：Cloudflare R2。
- 支付：Stripe。

## Vercel 环境变量

```bash
NEXT_PUBLIC_SITE_URL="https://your-devoice-domain.example"
NEXTAUTH_URL="https://your-devoice-domain.example"
NEXTAUTH_SECRET=""
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
DATABASE_URL=""
RESEND_API_KEY=""
EMAIL_FROM="DeVoice <noreply@devoice.io>"
PASSWORD_RESET_TOKEN_TTL_MINUTES="30"
UPSTASH_REDIS_REST_URL=""
UPSTASH_REDIS_REST_TOKEN=""
R2_ENDPOINT=""
R2_ACCESS_KEY_ID=""
R2_SECRET_ACCESS_KEY=""
R2_BUCKET=""
R2_PUBLIC_BASE_URL=""
STRIPE_SECRET_KEY=""
STRIPE_WEBHOOK_SECRET=""
STRIPE_ENTRY_PRICE_ID=""
STRIPE_STANDARD_PRICE_ID=""
STRIPE_COMPREHENSIVE_PRICE_ID=""
STRIPE_ELITE_CREDITS_PRICE_ID=""
STRIPE_BASIC_PRICE_ID=""
STRIPE_PRO_PRICE_ID=""
STRIPE_ELITE_SUBSCRIPTION_PRICE_ID=""
STRIPE_CREDIT_PACKAGE_PRICE_ID=""
```

## Worker 环境变量

```bash
DATABASE_URL=""
REDIS_URL=""
DEVOICE_QUEUE_NAME="devoice-media-jobs"
DEEPGRAM_API_KEY=""
ASSEMBLYAI_API_KEY=""
GROQ_API_KEY=""
DEEPSEEK_API_KEY=""
GEMINI_API_KEY=""
DEEPL_API_KEY=""
```

## 构建命令

```bash
pnpm build
```

## 输出方式

Next.js 由 Vercel 适配器处理输出，不需要静态导出。

## Google OAuth

授权 JavaScript 来源：

```text
https://your-devoice-domain.example
```

授权回调地址：

```text
https://your-devoice-domain.example/api/auth/callback/google
```

## Stripe

Webhook 端点：

```text
https://your-devoice-domain.example/api/billing/webhook
```

事件：

- `checkout.session.completed`
- `customer.subscription.deleted`

## 冒烟测试

部署后执行：

```bash
curl -I https://your-devoice-domain.example/en
curl -I https://your-devoice-domain.example/en/pricing
curl -I https://your-devoice-domain.example/en/blog
curl -I https://your-devoice-domain.example/sitemap.xml
```

随后在浏览器中验证：

- 首页上传面板
- 降噪四步操作面板
- 文本转语音的语言和声音选择器
- 定价页积分包
- 登录弹窗
- 登录后的“我的资源”页面
