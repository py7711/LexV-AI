-- ============================================================
-- LexV-AI 数据库 DDL
-- 数据库引擎: MySQL 8.0 / TiDB (兼容 MySQL 协议)
-- 字符集: utf8mb4  排序规则: utf8mb4_unicode_ci
-- 生成时间: 2026-06-26
-- ============================================================

CREATE DATABASE IF NOT EXISTS `lexvoice`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `lexvoice`;

-- ------------------------------------------------------------
-- 用户表
-- ------------------------------------------------------------
CREATE TABLE `User` (
  `id`               VARCHAR(30)   NOT NULL COMMENT '用户ID (cuid)',
  `name`             VARCHAR(100)  DEFAULT NULL COMMENT '用户昵称',
  `email`            VARCHAR(255)  DEFAULT NULL COMMENT '邮箱地址',
  `email_verified_at` DATETIME(3)  DEFAULT NULL COMMENT '邮箱验证时间',
  `password_hash`    VARCHAR(255)  DEFAULT NULL COMMENT '密码哈希值 (scrypt)',
  `image`            VARCHAR(500)  DEFAULT NULL COMMENT '头像 URL',
  `locale`           VARCHAR(10)   NOT NULL DEFAULT 'en' COMMENT '语言/地区设置',
  `role`             VARCHAR(20)   NOT NULL DEFAULT 'USER' COMMENT '系统角色 (USER/ADMIN)',
  `createdAt`        DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间',
  `updatedAt`        DATETIME(3)   NOT NULL COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `User_email_key` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户主表';

-- 默认用户
-- 登录邮箱: admin@lexvoice.local
-- 登录密码: aa123456
-- password_hash 使用项目 lib/password.ts 的 scrypt:salt:key 格式。
INSERT INTO `User` (
  `id`,
  `name`,
  `email`,
  `email_verified_at`,
  `password_hash`,
  `image`,
  `locale`,
  `role`,
  `createdAt`,
  `updatedAt`
) VALUES (
  'cmseeduseraa123456000000001',
  'admin',
  'admin@lexvoice.local',
  CURRENT_TIMESTAMP(3),
  'scrypt:aa123456seed0001:56ae6ed8f3cb12fdd0137b0fe2bcadc2eb3802a8a55c4fb93196cc0ecde0fc58033f6843602d79e7fc380746982eb7aae59c6f45a142455ff0881e9a6aa4e125',
  NULL,
  'en',
  'ADMIN',
  CURRENT_TIMESTAMP(3),
  CURRENT_TIMESTAMP(3)
) ON DUPLICATE KEY UPDATE
  `name` = VALUES(`name`),
  `email_verified_at` = VALUES(`email_verified_at`),
  `password_hash` = VALUES(`password_hash`),
  `locale` = VALUES(`locale`),
  `role` = VALUES(`role`),
  `updatedAt` = CURRENT_TIMESTAMP(3);

-- ------------------------------------------------------------
-- 第三方登录账号表 (NextAuth Account)
-- ------------------------------------------------------------
CREATE TABLE `Account` (
  `id`                VARCHAR(30)   NOT NULL COMMENT '账号ID (cuid)',
  `userId`            VARCHAR(30)   NOT NULL COMMENT '关联用户ID',
  `type`              VARCHAR(30)   NOT NULL COMMENT '账号类型 (oauth/credentials 等)',
  `provider`          VARCHAR(50)   NOT NULL COMMENT '登录提供商 (github/google 等)',
  `providerAccountId` VARCHAR(255)  NOT NULL COMMENT '提供商侧的账号ID',
  `refresh_token`     TEXT          DEFAULT NULL COMMENT 'OAuth Refresh Token',
  `access_token`      TEXT          DEFAULT NULL COMMENT 'OAuth Access Token',
  `expires_at`        INT           DEFAULT NULL COMMENT 'Access Token 过期时间戳 (秒)',
  `token_type`        VARCHAR(50)   DEFAULT NULL COMMENT 'Token 类型 (Bearer 等)',
  `scope`             VARCHAR(500)  DEFAULT NULL COMMENT 'OAuth 授权范围',
  `id_token`          TEXT          DEFAULT NULL COMMENT 'OIDC ID Token',
  `session_state`     VARCHAR(255)  DEFAULT NULL COMMENT 'Session 状态',
  PRIMARY KEY (`id`),
  UNIQUE KEY `Account_provider_providerAccountId_key` (`provider`, `providerAccountId`),
  KEY `Account_userId_idx` (`userId`),
  CONSTRAINT `Account_userId_fk` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='第三方登录账号表';

-- ------------------------------------------------------------
-- 登录会话表 (NextAuth Session)
-- ------------------------------------------------------------
CREATE TABLE `Session` (
  `id`           VARCHAR(30)  NOT NULL COMMENT '会话ID (cuid)',
  `sessionToken` VARCHAR(255) NOT NULL COMMENT '会话令牌 (唯一)',
  `userId`       VARCHAR(30)  NOT NULL COMMENT '关联用户ID',
  `expires`      DATETIME(3)  NOT NULL COMMENT '会话过期时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `Session_sessionToken_key` (`sessionToken`),
  KEY `Session_userId_idx` (`userId`),
  CONSTRAINT `Session_userId_fk` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='登录会话表';

-- ------------------------------------------------------------
-- 邮箱验证令牌表 (NextAuth VerificationToken)
-- ------------------------------------------------------------
CREATE TABLE `VerificationToken` (
  `identifier` VARCHAR(255) NOT NULL COMMENT '标识符 (通常为邮箱)',
  `token`      VARCHAR(255) NOT NULL COMMENT '验证令牌',
  `expires`    DATETIME(3)  NOT NULL COMMENT '令牌过期时间',
  UNIQUE KEY `VerificationToken_token_key` (`token`),
  UNIQUE KEY `VerificationToken_identifier_token_key` (`identifier`, `token`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='邮箱验证令牌表';

-- ------------------------------------------------------------
-- 团队工作空间表
-- ------------------------------------------------------------
CREATE TABLE `Workspace` (
  `id`                   VARCHAR(30)   NOT NULL COMMENT '工作空间ID (cuid)',
  `name`                 VARCHAR(100)  NOT NULL COMMENT '工作空间名称',
  `slug`                 VARCHAR(100)  NOT NULL COMMENT 'URL 别名 (唯一)',
  `plan`                 VARCHAR(30)   NOT NULL DEFAULT 'business' COMMENT '套餐计划 (free/business/enterprise)',
  `billingEmail`         VARCHAR(255)  DEFAULT NULL COMMENT '账单邮箱',
  `monthlyQuotaMinutes`  INT           NOT NULL DEFAULT 12000 COMMENT '每月转录配额 (分钟)',
  `usedMinutes`          INT           NOT NULL DEFAULT 0 COMMENT '本周期已使用分钟数',
  `stripeCustomerId`     VARCHAR(100)  DEFAULT NULL COMMENT 'Stripe 客户ID',
  `subscriptionStatus`   VARCHAR(30)   NOT NULL DEFAULT 'trialing' COMMENT '订阅状态 (trialing/active/canceled 等)',
  `createdAt`            DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间',
  `updatedAt`            DATETIME(3)   NOT NULL COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `Workspace_slug_key` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='团队工作空间表';

-- ------------------------------------------------------------
-- 工作空间成员关系表
-- ------------------------------------------------------------
CREATE TABLE `Membership` (
  `id`          VARCHAR(30)  NOT NULL COMMENT '成员关系ID (cuid)',
  `userId`      VARCHAR(30)  NOT NULL COMMENT '用户ID',
  `workspaceId` VARCHAR(30)  NOT NULL COMMENT '工作空间ID',
  `role`        VARCHAR(20)  NOT NULL DEFAULT 'member' COMMENT '角色 (owner/admin/member)',
  `createdAt`   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '加入时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `Membership_userId_workspaceId_key` (`userId`, `workspaceId`),
  KEY `Membership_workspaceId_idx` (`workspaceId`),
  CONSTRAINT `Membership_userId_fk` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE,
  CONSTRAINT `Membership_workspaceId_fk` FOREIGN KEY (`workspaceId`) REFERENCES `Workspace` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='工作空间成员关系表';

-- ------------------------------------------------------------
-- 媒体转录任务表
-- ------------------------------------------------------------
CREATE TABLE `MediaJob` (
  `id`             VARCHAR(30)   NOT NULL COMMENT '任务ID (cuid)',
  `userId`         VARCHAR(30)   DEFAULT NULL COMMENT '创建用户ID',
  `workspaceId`    VARCHAR(30)   DEFAULT NULL COMMENT '所属工作空间ID',
  `sourceType`     VARCHAR(30)   NOT NULL COMMENT '来源类型 (youtube/upload/url 等)',
  `sourceUrl`      TEXT          DEFAULT NULL COMMENT '媒体来源 URL',
  `storageKey`     VARCHAR(500)  DEFAULT NULL COMMENT '对象存储路径/Key',
  `fileName`       VARCHAR(255)  DEFAULT NULL COMMENT '原始文件名',
  `language`       VARCHAR(20)   DEFAULT NULL COMMENT '源语言 (BCP-47 代码, 如 zh/en)',
  `targetLanguage` VARCHAR(20)   DEFAULT NULL COMMENT '翻译目标语言',
  `status`         VARCHAR(20)   NOT NULL DEFAULT 'queued' COMMENT '任务状态 (queued/processing/done/failed)',
  `provider`       VARCHAR(50)   DEFAULT NULL COMMENT '当前使用的 AI 服务商',
  `fallbackTrail`  JSON          DEFAULT NULL COMMENT '降级路径记录 (JSON 数组)',
  `errorMessage`   TEXT          DEFAULT NULL COMMENT '错误信息',
  `transcript`     LONGTEXT      DEFAULT NULL COMMENT '转录原文',
  `subtitles`      LONGTEXT      DEFAULT NULL COMMENT '字幕内容 (SRT/VTT 格式)',
  `summary`        LONGTEXT      DEFAULT NULL COMMENT 'AI 摘要',
  `translation`    LONGTEXT      DEFAULT NULL COMMENT '翻译结果',
  `durationSec`    INT           DEFAULT NULL COMMENT '媒体时长 (秒)',
  `costCents`      INT           NOT NULL DEFAULT 0 COMMENT '本次任务费用 (分)',
  `createdAt`      DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间',
  `updatedAt`      DATETIME(3)   NOT NULL COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `MediaJob_userId_idx` (`userId`),
  KEY `MediaJob_workspaceId_idx` (`workspaceId`),
  KEY `MediaJob_status_idx` (`status`),
  KEY `MediaJob_createdAt_idx` (`createdAt`),
  CONSTRAINT `MediaJob_userId_fk` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE SET NULL,
  CONSTRAINT `MediaJob_workspaceId_fk` FOREIGN KEY (`workspaceId`) REFERENCES `Workspace` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='媒体转录任务表';

-- ------------------------------------------------------------
-- 音频资产表：完整音频、视频抽取音频、链接音频和生成音频
-- ------------------------------------------------------------
CREATE TABLE `AudioAsset` (
  `id`          VARCHAR(30)   NOT NULL COMMENT '音频资产ID (cuid)',
  `mediaJobId`  VARCHAR(30)   NOT NULL COMMENT '关联媒体任务ID',
  `userId`      VARCHAR(30)   DEFAULT NULL COMMENT '创建用户ID',
  `workspaceId` VARCHAR(30)   DEFAULT NULL COMMENT '所属工作空间ID',
  `role`        VARCHAR(32)   NOT NULL COMMENT '资产角色 (source_audio/extracted_audio/generated_audio 等)',
  `sourceKind`  VARCHAR(32)   NOT NULL COMMENT '来源类型 (upload/url/generated)',
  `status`      VARCHAR(20)   NOT NULL DEFAULT 'pending' COMMENT '资产状态',
  `provider`    VARCHAR(80)   DEFAULT NULL COMMENT '处理服务商',
  `sourceUrl`   TEXT          DEFAULT NULL COMMENT '来源 URL',
  `storageKey`  VARCHAR(500)  DEFAULT NULL COMMENT 'R2 对象 Key',
  `publicUrl`   TEXT          DEFAULT NULL COMMENT '公开或签名链接',
  `fileName`    VARCHAR(255)  DEFAULT NULL COMMENT '文件名',
  `contentType` VARCHAR(120)  DEFAULT NULL COMMENT 'MIME 类型',
  `byteSize`    INT           DEFAULT NULL COMMENT '字节数',
  `durationSec` INT           DEFAULT NULL COMMENT '音频时长',
  `metadata`    JSON          DEFAULT NULL COMMENT '预处理元数据',
  `createdAt`   DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间',
  `updatedAt`   DATETIME(3)   NOT NULL COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `AudioAsset_mediaJobId_idx` (`mediaJobId`),
  KEY `AudioAsset_workspaceId_idx` (`workspaceId`),
  KEY `AudioAsset_userId_idx` (`userId`),
  KEY `AudioAsset_role_idx` (`role`),
  KEY `AudioAsset_status_idx` (`status`),
  KEY `AudioAsset_createdAt_idx` (`createdAt`),
  CONSTRAINT `AudioAsset_mediaJobId_fk` FOREIGN KEY (`mediaJobId`) REFERENCES `MediaJob` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='音频资产表';

-- ------------------------------------------------------------
-- 音频切片表：智能切片分段音频及 R2 链接
-- ------------------------------------------------------------
CREATE TABLE `AudioSegment` (
  `id`           VARCHAR(30)  NOT NULL COMMENT '音频切片ID (cuid)',
  `mediaJobId`   VARCHAR(30)  NOT NULL COMMENT '关联媒体任务ID',
  `audioAssetId` VARCHAR(30)  NOT NULL COMMENT '关联音频资产ID',
  `index`        INT          NOT NULL COMMENT '切片序号',
  `startSec`     INT          NOT NULL COMMENT '开始秒数',
  `endSec`       INT          DEFAULT NULL COMMENT '结束秒数',
  `durationSec`  INT          DEFAULT NULL COMMENT '切片时长',
  `storageKey`   VARCHAR(500) DEFAULT NULL COMMENT 'R2 对象 Key',
  `publicUrl`    TEXT         DEFAULT NULL COMMENT '公开或签名链接',
  `contentType`  VARCHAR(120) DEFAULT NULL COMMENT 'MIME 类型',
  `byteSize`     INT          DEFAULT NULL COMMENT '字节数',
  `status`       VARCHAR(20)  NOT NULL DEFAULT 'ready' COMMENT '切片状态',
  `metadata`     JSON         DEFAULT NULL COMMENT '切片策略元数据',
  `createdAt`    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `AudioSegment_audioAssetId_index_key` (`audioAssetId`, `index`),
  KEY `AudioSegment_mediaJobId_idx` (`mediaJobId`),
  KEY `AudioSegment_audioAssetId_idx` (`audioAssetId`),
  KEY `AudioSegment_status_idx` (`status`),
  CONSTRAINT `AudioSegment_mediaJobId_fk` FOREIGN KEY (`mediaJobId`) REFERENCES `MediaJob` (`id`) ON DELETE CASCADE,
  CONSTRAINT `AudioSegment_audioAssetId_fk` FOREIGN KEY (`audioAssetId`) REFERENCES `AudioAsset` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='音频切片表';

-- ------------------------------------------------------------
-- API 密钥表
-- ------------------------------------------------------------
CREATE TABLE `ApiKey` (
  `id`          VARCHAR(30)   NOT NULL COMMENT 'API Key ID (cuid)',
  `workspaceId` VARCHAR(30)   NOT NULL COMMENT '所属工作空间ID',
  `name`        VARCHAR(100)  NOT NULL COMMENT 'API Key 名称/备注',
  `keyHash`     VARCHAR(255)  NOT NULL COMMENT 'API Key 哈希值 (SHA-256)',
  `lastUsedAt`  DATETIME(3)   DEFAULT NULL COMMENT '最后使用时间',
  `createdAt`   DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `ApiKey_keyHash_key` (`keyHash`),
  KEY `ApiKey_workspaceId_idx` (`workspaceId`),
  CONSTRAINT `ApiKey_workspaceId_fk` FOREIGN KEY (`workspaceId`) REFERENCES `Workspace` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='工作空间 API 密钥表';

-- ------------------------------------------------------------
-- 用量事件表
-- ------------------------------------------------------------
CREATE TABLE `UsageEvent` (
  `id`          VARCHAR(30)  NOT NULL COMMENT '用量事件ID (cuid)',
  `workspaceId` VARCHAR(30)  NOT NULL COMMENT '所属工作空间ID',
  `mediaJobId`  VARCHAR(30)  DEFAULT NULL COMMENT '关联媒体任务ID',
  `eventType`   VARCHAR(50)  NOT NULL COMMENT '事件类型 (transcribe/translate/summarize 等)',
  `quantity`    INT          NOT NULL COMMENT '用量数值',
  `unit`        VARCHAR(20)  NOT NULL COMMENT '用量单位 (minutes/tokens 等)',
  `costCents`   INT          NOT NULL DEFAULT 0 COMMENT '费用 (分)',
  `provider`    VARCHAR(50)  DEFAULT NULL COMMENT '服务提供商',
  `createdAt`   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '事件时间',
  PRIMARY KEY (`id`),
  KEY `UsageEvent_workspaceId_idx` (`workspaceId`),
  KEY `UsageEvent_mediaJobId_idx` (`mediaJobId`),
  KEY `UsageEvent_createdAt_idx` (`createdAt`),
  CONSTRAINT `UsageEvent_workspaceId_fk` FOREIGN KEY (`workspaceId`) REFERENCES `Workspace` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用量事件流水表';

-- ------------------------------------------------------------
-- 审计日志表
-- ------------------------------------------------------------
CREATE TABLE `AuditLog` (
  `id`          VARCHAR(30)   NOT NULL COMMENT '审计日志ID (cuid)',
  `workspaceId` VARCHAR(30)   DEFAULT NULL COMMENT '所属工作空间ID',
  `actorUserId` VARCHAR(30)   DEFAULT NULL COMMENT '操作者用户ID',
  `actorType`   VARCHAR(20)   NOT NULL DEFAULT 'user' COMMENT '操作者类型 (user/system/apikey)',
  `action`      VARCHAR(100)  NOT NULL COMMENT '操作动作 (如 job.create / member.invite)',
  `targetType`  VARCHAR(50)   DEFAULT NULL COMMENT '操作目标类型 (job/workspace/member 等)',
  `targetId`    VARCHAR(30)   DEFAULT NULL COMMENT '操作目标ID',
  `ipAddress`   VARCHAR(45)   DEFAULT NULL COMMENT '客户端 IP 地址 (IPv4/IPv6)',
  `userAgent`   TEXT          DEFAULT NULL COMMENT '客户端 User-Agent',
  `metadata`    JSON          DEFAULT NULL COMMENT '附加元数据 (JSON)',
  `createdAt`   DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '记录时间',
  PRIMARY KEY (`id`),
  KEY `AuditLog_workspaceId_idx` (`workspaceId`),
  KEY `AuditLog_actorUserId_idx` (`actorUserId`),
  KEY `AuditLog_action_idx` (`action`),
  KEY `AuditLog_createdAt_idx` (`createdAt`),
  CONSTRAINT `AuditLog_workspaceId_fk` FOREIGN KEY (`workspaceId`) REFERENCES `Workspace` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='操作审计日志表';
