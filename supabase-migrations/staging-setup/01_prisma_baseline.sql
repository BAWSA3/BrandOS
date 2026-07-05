-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "SubscriptionTier" AS ENUM ('FREE', 'CREATOR', 'PRO', 'AGENCY', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'PAST_DUE', 'CANCELED', 'TRIALING', 'INCOMPLETE');

-- CreateEnum
CREATE TYPE "PlanTier" AS ENUM ('FREE', 'PRO', 'MAX', 'TEAM', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "WorkspaceType" AS ENUM ('personal', 'team');

-- CreateEnum
CREATE TYPE "WorkspaceRole" AS ENUM ('owner', 'admin', 'member');

-- CreateEnum
CREATE TYPE "ConnectedAccountStatus" AS ENUM ('active', 'dormant');

-- CreateEnum
CREATE TYPE "ScanVisibility" AS ENUM ('private', 'card_public');

-- CreateEnum
CREATE TYPE "ScanStatus" AS ENUM ('active', 'dormant', 'archived');

-- CreateEnum
CREATE TYPE "AuditEventCategory" AS ENUM ('auth', 'scan', 'payment', 'security', 'account');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('user', 'admin');

-- CreateEnum
CREATE TYPE "AccountMigrationStatus" AS ENUM ('legacy', 'in_progress', 'completed');

-- CreateEnum
CREATE TYPE "ApiKeyTier" AS ENUM ('FREE', 'STARTER', 'GROWTH', 'ENTERPRISE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "supabaseId" TEXT NOT NULL,
    "email" TEXT,
    "xUsername" TEXT,
    "xId" TEXT,
    "name" TEXT,
    "avatar" TEXT,
    "isInnerCircle" BOOLEAN NOT NULL DEFAULT false,
    "invitedBy" TEXT,
    "walletAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "subscriptionTier" "SubscriptionTier" NOT NULL DEFAULT 'FREE',
    "subscriptionStatus" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "billingInterval" TEXT,
    "currentPeriodEnd" TIMESTAMP(3),
    "checksUsedThisMonth" INTEGER NOT NULL DEFAULT 0,
    "generationsUsedThisMonth" INTEGER NOT NULL DEFAULT 0,
    "usageResetDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "role" "UserRole" NOT NULL DEFAULT 'user',
    "account_migration_status" "AccountMigrationStatus" NOT NULL DEFAULT 'legacy',

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Brand" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "colors" TEXT NOT NULL,
    "tone" TEXT NOT NULL,
    "keywords" TEXT NOT NULL,
    "doPatterns" TEXT NOT NULL,
    "dontPatterns" TEXT NOT NULL,
    "voiceSamples" TEXT NOT NULL,
    "voiceFingerprint" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "shareToken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "teamId" TEXT,

    CONSTRAINT "Brand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamMember" (
    "id" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,

    CONSTRAINT "TeamMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SharedBrand" (
    "id" TEXT NOT NULL,
    "permission" TEXT NOT NULL DEFAULT 'view',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,

    CONSTRAINT "SharedBrand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrandHealthSnapshot" (
    "id" TEXT NOT NULL,
    "overallScore" INTEGER NOT NULL,
    "completeness" INTEGER NOT NULL,
    "consistency" INTEGER NOT NULL,
    "voiceMatch" INTEGER NOT NULL,
    "engagement" INTEGER NOT NULL,
    "activity" INTEGER NOT NULL,
    "trendDirection" TEXT NOT NULL,
    "trendDelta" INTEGER NOT NULL,
    "computationData" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "brandId" TEXT NOT NULL,

    CONSTRAINT "BrandHealthSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrandTweet" (
    "id" TEXT NOT NULL,
    "tweetId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "postedAt" TIMESTAMP(3) NOT NULL,
    "metrics" TEXT NOT NULL,
    "entities" TEXT,
    "alignmentScore" INTEGER,
    "engagementRate" DOUBLE PRECISION,
    "brandId" TEXT NOT NULL,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BrandTweet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrandContent" (
    "id" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "textContent" TEXT,
    "transcript" TEXT,
    "mediaUrls" TEXT,
    "metrics" TEXT NOT NULL,
    "hashtags" TEXT,
    "mentions" TEXT,
    "url" TEXT,
    "authorUsername" TEXT,
    "alignmentScore" INTEGER,
    "voiceScore" INTEGER,
    "visualScore" INTEGER,
    "rawData" TEXT,
    "postedAt" TIMESTAMP(3) NOT NULL,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "brandId" TEXT NOT NULL,

    CONSTRAINT "BrandContent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformConnection" (
    "id" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "platformUserId" TEXT NOT NULL,
    "platformUsername" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "tokenExpiresAt" TIMESTAMP(3),
    "scopes" TEXT NOT NULL,
    "profileData" TEXT,
    "lastSyncAt" TIMESTAMP(3),
    "connectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "workspace_id" UUID,
    "status" "ConnectedAccountStatus" NOT NULL DEFAULT 'active',
    "key_id" TEXT NOT NULL DEFAULT 'v1',
    "access_token_ciphertext" TEXT,
    "refresh_token_ciphertext" TEXT,
    "disconnected_at" TIMESTAMPTZ,
    "last_verified_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlatformConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrandVisualDNA" (
    "id" TEXT NOT NULL,
    "logoUsageRules" TEXT NOT NULL,
    "colorPalette" TEXT NOT NULL,
    "typography" TEXT NOT NULL,
    "imageStyle" TEXT NOT NULL,
    "filterPreset" TEXT,
    "moodKeywords" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "brandId" TEXT NOT NULL,

    CONSTRAINT "BrandVisualDNA_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApprovalRequest" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "contentType" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "brandCheckScore" INTEGER,
    "feedback" TEXT,
    "submittedById" TEXT NOT NULL,
    "reviewedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "brandId" TEXT NOT NULL,

    CONSTRAINT "ApprovalRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HistoryEntry" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "input" TEXT NOT NULL,
    "output" TEXT NOT NULL,
    "contentType" TEXT,
    "score" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "brandId" TEXT NOT NULL,

    CONSTRAINT "HistoryEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailSignup" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "xUsername" TEXT,
    "source" TEXT NOT NULL DEFAULT 'landing',
    "unsubscribed" BOOLEAN DEFAULT false,
    "unsubscribedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailSignup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrandScans" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "username" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "archetype" TEXT,
    "enhanced" BOOLEAN,
    "userId" TEXT,
    "phase_scores" TEXT,
    "insights" TEXT,
    "strengths" TEXT,
    "improvements" TEXT,
    "summary" TEXT,
    "influence_tier" TEXT,
    "next_moves" TEXT,
    "content_pillars" TEXT,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BrandScans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InviteCode" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "maxUses" INTEGER NOT NULL DEFAULT 3,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "usedBy" TEXT NOT NULL DEFAULT '[]',
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "InviteCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Purchase" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "stripePaymentId" TEXT NOT NULL,
    "stripeSessionId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Purchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResearchRun" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "verticals" TEXT NOT NULL,
    "sources" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "topicsFound" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "userId" TEXT NOT NULL,
    "brandId" TEXT,

    CONSTRAINT "ResearchRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResearchTopic" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "vertical" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "relevanceScore" INTEGER NOT NULL DEFAULT 50,
    "sentimentScore" INTEGER,
    "engagementLevel" TEXT,
    "sources" TEXT NOT NULL,
    "keywords" TEXT NOT NULL,
    "hashtags" TEXT,
    "mentions" TEXT,
    "trendingPeriod" TEXT,
    "firstSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "researchRunId" TEXT NOT NULL,

    CONSTRAINT "ResearchTopic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TopicSelection" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'selected',
    "selectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "contentTypes" TEXT,
    "generatedCount" INTEGER NOT NULL DEFAULT 0,
    "topicId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "brandId" TEXT,

    CONSTRAINT "TopicSelection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResearchSourceConfig" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "apiStatus" TEXT NOT NULL DEFAULT 'unknown',
    "lastChecked" TIMESTAMP(3),
    "config" TEXT,

    CONSTRAINT "ResearchSourceConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentDraft" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "contentType" TEXT NOT NULL DEFAULT 'tweet',
    "tone" TEXT NOT NULL DEFAULT 'casual',
    "status" TEXT NOT NULL DEFAULT 'idea',
    "scheduledFor" TIMESTAMP(3),
    "sourceType" TEXT,
    "sourceId" TEXT,
    "authenticity" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "brandId" TEXT NOT NULL,
    "parentId" TEXT,

    CONSTRAINT "ContentDraft_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Feedback" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "type" TEXT NOT NULL,
    "category" TEXT,
    "message" TEXT NOT NULL,
    "rating" INTEGER,
    "url" TEXT,
    "metadata" TEXT,
    "status" TEXT NOT NULL DEFAULT 'new',
    "priority" TEXT,
    "adminNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DriftAlert" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "previousScore" INTEGER NOT NULL,
    "currentScore" INTEGER NOT NULL,
    "delta" INTEGER NOT NULL,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'new',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "brandId" TEXT NOT NULL,

    CONSTRAINT "DriftAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentNiche" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "keywords" TEXT NOT NULL,
    "hashtags" TEXT NOT NULL,
    "referenceAccounts" TEXT NOT NULL,
    "platform" TEXT NOT NULL DEFAULT 'x',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "brandId" TEXT NOT NULL,

    CONSTRAINT "ContentNiche_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ViralBenchmark" (
    "id" TEXT NOT NULL,
    "platform" TEXT NOT NULL DEFAULT 'x',
    "externalId" TEXT NOT NULL,
    "authorUsername" TEXT,
    "content" TEXT NOT NULL,
    "metrics" TEXT NOT NULL,
    "viralScore" INTEGER NOT NULL,
    "patterns" TEXT NOT NULL,
    "niche" TEXT NOT NULL,
    "scannedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "brandId" TEXT NOT NULL,

    CONSTRAINT "ViralBenchmark_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PerformanceSnapshot" (
    "id" TEXT NOT NULL,
    "windowDays" INTEGER NOT NULL,
    "totalPosts" INTEGER NOT NULL,
    "totalImpressions" INTEGER NOT NULL,
    "totalLikes" INTEGER NOT NULL,
    "totalRetweets" INTEGER NOT NULL,
    "totalReplies" INTEGER NOT NULL,
    "avgEngagementRate" DOUBLE PRECISION NOT NULL,
    "avgImpressions" DOUBLE PRECISION NOT NULL,
    "bestPostingHour" INTEGER,
    "bestPostingDay" TEXT,
    "bestContentType" TEXT,
    "avgPostLength" INTEGER,
    "topTweetId" TEXT,
    "bottomTweetId" TEXT,
    "postingPattern" TEXT,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "brandId" TEXT NOT NULL,

    CONSTRAINT "PerformanceSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GapAnalysis" (
    "id" TEXT NOT NULL,
    "overallGapScore" INTEGER NOT NULL,
    "hookStrength" INTEGER NOT NULL,
    "formatMatch" INTEGER NOT NULL,
    "toneAlignment" INTEGER NOT NULL,
    "ctaEffectiveness" INTEGER NOT NULL,
    "engagementVelocity" INTEGER NOT NULL,
    "postingConsistency" INTEGER NOT NULL,
    "strengths" TEXT NOT NULL,
    "gaps" TEXT NOT NULL,
    "actionItems" TEXT NOT NULL,
    "rawAnalysis" TEXT,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "brandId" TEXT NOT NULL,

    CONSTRAINT "GapAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "feature" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "durationMs" INTEGER,

    CONSTRAINT "UserSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "XProfileCache" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "profileData" TEXT NOT NULL,
    "followersCount" INTEGER NOT NULL DEFAULT 0,
    "tweetCount" INTEGER NOT NULL DEFAULT 0,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "XProfileCache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OnchainAttestation" (
    "id" TEXT NOT NULL,
    "uid" TEXT NOT NULL,
    "txHash" TEXT NOT NULL,
    "chain" TEXT NOT NULL,
    "attestationType" TEXT NOT NULL,
    "schemaUid" TEXT NOT NULL,
    "attester" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "dataHash" TEXT NOT NULL,
    "metadata" TEXT,
    "explorerUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "brandId" TEXT,
    "userId" TEXT,

    CONSTRAINT "OnchainAttestation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiKey" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ownerEmail" TEXT NOT NULL,
    "tier" "ApiKeyTier" NOT NULL DEFAULT 'FREE',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "dailyLimit" INTEGER,
    "minuteLimit" INTEGER,
    "requestsToday" INTEGER NOT NULL DEFAULT 0,
    "requestsTotal" INTEGER NOT NULL DEFAULT 0,
    "lastUsedAt" TIMESTAMP(3),
    "lastResetAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiUsageLog" (
    "id" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "statusCode" INTEGER NOT NULL,
    "latencyMs" INTEGER NOT NULL,
    "username" TEXT,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "apiKeyId" TEXT NOT NULL,

    CONSTRAINT "ApiUsageLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Deal" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "brand" TEXT,
    "status" TEXT NOT NULL DEFAULT 'lead',
    "amount" INTEGER,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "notes" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Deal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "client" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "dueDate" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "txId" TEXT,
    "txChain" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "dealId" TEXT,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "description" TEXT,
    "txId" TEXT,
    "txChain" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Workspace" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "type" "WorkspaceType" NOT NULL,
    "owner_user_id" TEXT NOT NULL,
    "plan" "PlanTier" NOT NULL DEFAULT 'FREE',
    "seat_count" INTEGER NOT NULL DEFAULT 1,
    "stripe_customer_id" TEXT,
    "stripe_subscription_id" TEXT,
    "trial_ends_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "active_world_id" TEXT,
    "custom_world_id" UUID,

    CONSTRAINT "Workspace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomWorld" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "workspace_id" UUID NOT NULL,
    "base_world_id" TEXT NOT NULL,
    "manifest" JSONB NOT NULL DEFAULT '{}',
    "name" TEXT NOT NULL DEFAULT 'My World',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "CustomWorld_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkspaceMember" (
    "workspace_id" UUID NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" "WorkspaceRole" NOT NULL DEFAULT 'member',
    "invited_by_user_id" TEXT,
    "joined_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkspaceMember_pkey" PRIMARY KEY ("workspace_id","user_id")
);

-- CreateTable
CREATE TABLE "PlanLimit" (
    "plan" "PlanTier" NOT NULL,
    "scans_per_day" INTEGER NOT NULL,
    "x_accounts_per_seat" INTEGER NOT NULL,
    "multi_platform_enabled" BOOLEAN NOT NULL DEFAULT false,
    "competitor_watchlist_enabled" BOOLEAN NOT NULL DEFAULT false,
    "scheduled_rescans_enabled" BOOLEAN NOT NULL DEFAULT false,
    "priority_queue_enabled" BOOLEAN NOT NULL DEFAULT false,
    "max_flagged_tweets" INTEGER NOT NULL DEFAULT 3,
    "audit_summary_max_chars" INTEGER NOT NULL DEFAULT 800,
    "max_strengths" INTEGER NOT NULL DEFAULT 3,
    "max_improvements" INTEGER NOT NULL DEFAULT 3,
    "custom_world_builder_enabled" BOOLEAN NOT NULL DEFAULT false,
    "premium_worlds_enabled" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "PlanLimit_pkey" PRIMARY KEY ("plan")
);

-- CreateTable
CREATE TABLE "BrandScan" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" TEXT NOT NULL,
    "workspace_id" UUID NOT NULL,
    "platform_connection_id" TEXT NOT NULL,
    "x_username" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "archetype" TEXT NOT NULL,
    "phase_scores" JSONB NOT NULL,
    "strengths" JSONB NOT NULL,
    "improvements" JSONB NOT NULL,
    "insights" JSONB,
    "summary" TEXT,
    "influence_tier" TEXT,
    "next_moves" JSONB,
    "content_pillars" JSONB,
    "visibility" "ScanVisibility" NOT NULL DEFAULT 'card_public',
    "status" "ScanStatus" NOT NULL DEFAULT 'active',
    "scanned_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BrandScan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditReportShare" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "brand_scan_id" UUID,
    "workspace_id" UUID NOT NULL,
    "created_by_user_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "revoked_at" TIMESTAMPTZ,
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "unique_viewer_count" INTEGER NOT NULL DEFAULT 0,
    "world_id_at_share" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditReportShare_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecurityAuditLog" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "category" "AuditEventCategory" NOT NULL,
    "event_type" TEXT NOT NULL,
    "user_id" TEXT,
    "workspace_id" UUID,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "ip_hash" TEXT,
    "user_agent_family" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SecurityAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_supabaseId_key" ON "User"("supabaseId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_xId_key" ON "User"("xId");

-- CreateIndex
CREATE UNIQUE INDEX "User_walletAddress_key" ON "User"("walletAddress");

-- CreateIndex
CREATE UNIQUE INDEX "User_stripeCustomerId_key" ON "User"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "User_stripeSubscriptionId_key" ON "User"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "User_xUsername_idx" ON "User"("xUsername");

-- CreateIndex
CREATE INDEX "User_stripeCustomerId_idx" ON "User"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "Brand_shareToken_key" ON "Brand"("shareToken");

-- CreateIndex
CREATE INDEX "Brand_userId_idx" ON "Brand"("userId");

-- CreateIndex
CREATE INDEX "Brand_teamId_idx" ON "Brand"("teamId");

-- CreateIndex
CREATE INDEX "Brand_shareToken_idx" ON "Brand"("shareToken");

-- CreateIndex
CREATE INDEX "TeamMember_teamId_idx" ON "TeamMember"("teamId");

-- CreateIndex
CREATE UNIQUE INDEX "TeamMember_userId_teamId_key" ON "TeamMember"("userId", "teamId");

-- CreateIndex
CREATE INDEX "SharedBrand_brandId_idx" ON "SharedBrand"("brandId");

-- CreateIndex
CREATE UNIQUE INDEX "SharedBrand_userId_brandId_key" ON "SharedBrand"("userId", "brandId");

-- CreateIndex
CREATE INDEX "BrandHealthSnapshot_brandId_idx" ON "BrandHealthSnapshot"("brandId");

-- CreateIndex
CREATE INDEX "BrandHealthSnapshot_createdAt_idx" ON "BrandHealthSnapshot"("createdAt");

-- CreateIndex
CREATE INDEX "BrandHealthSnapshot_brandId_createdAt_idx" ON "BrandHealthSnapshot"("brandId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "BrandTweet_tweetId_key" ON "BrandTweet"("tweetId");

-- CreateIndex
CREATE INDEX "BrandTweet_brandId_postedAt_idx" ON "BrandTweet"("brandId", "postedAt" DESC);

-- CreateIndex
CREATE INDEX "BrandContent_brandId_platform_idx" ON "BrandContent"("brandId", "platform");

-- CreateIndex
CREATE INDEX "BrandContent_brandId_postedAt_idx" ON "BrandContent"("brandId", "postedAt" DESC);

-- CreateIndex
CREATE INDEX "BrandContent_platform_idx" ON "BrandContent"("platform");

-- CreateIndex
CREATE UNIQUE INDEX "BrandContent_platform_externalId_key" ON "BrandContent"("platform", "externalId");

-- CreateIndex
CREATE INDEX "PlatformConnection_userId_idx" ON "PlatformConnection"("userId");

-- CreateIndex
CREATE INDEX "PlatformConnection_platform_idx" ON "PlatformConnection"("platform");

-- CreateIndex
CREATE UNIQUE INDEX "PlatformConnection_userId_platform_key" ON "PlatformConnection"("userId", "platform");

-- CreateIndex
CREATE UNIQUE INDEX "BrandVisualDNA_brandId_key" ON "BrandVisualDNA"("brandId");

-- CreateIndex
CREATE INDEX "ApprovalRequest_brandId_status_idx" ON "ApprovalRequest"("brandId", "status");

-- CreateIndex
CREATE INDEX "ApprovalRequest_submittedById_idx" ON "ApprovalRequest"("submittedById");

-- CreateIndex
CREATE INDEX "HistoryEntry_brandId_idx" ON "HistoryEntry"("brandId");

-- CreateIndex
CREATE INDEX "HistoryEntry_createdAt_idx" ON "HistoryEntry"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "EmailSignup_email_key" ON "EmailSignup"("email");

-- CreateIndex
CREATE INDEX "EmailSignup_createdAt_idx" ON "EmailSignup"("createdAt");

-- CreateIndex
CREATE INDEX "EmailSignup_xUsername_idx" ON "EmailSignup"("xUsername");

-- CreateIndex
CREATE INDEX "BrandScans_username_idx" ON "BrandScans"("username");

-- CreateIndex
CREATE INDEX "BrandScans_created_at_idx" ON "BrandScans"("created_at" DESC);

-- CreateIndex
CREATE INDEX "BrandScans_userId_idx" ON "BrandScans"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "InviteCode_code_key" ON "InviteCode"("code");

-- CreateIndex
CREATE INDEX "InviteCode_code_idx" ON "InviteCode"("code");

-- CreateIndex
CREATE INDEX "InviteCode_createdBy_idx" ON "InviteCode"("createdBy");

-- CreateIndex
CREATE UNIQUE INDEX "Purchase_stripePaymentId_key" ON "Purchase"("stripePaymentId");

-- CreateIndex
CREATE INDEX "Purchase_userId_idx" ON "Purchase"("userId");

-- CreateIndex
CREATE INDEX "Purchase_type_idx" ON "Purchase"("type");

-- CreateIndex
CREATE INDEX "Purchase_createdAt_idx" ON "Purchase"("createdAt");

-- CreateIndex
CREATE INDEX "ResearchRun_userId_idx" ON "ResearchRun"("userId");

-- CreateIndex
CREATE INDEX "ResearchRun_brandId_idx" ON "ResearchRun"("brandId");

-- CreateIndex
CREATE INDEX "ResearchRun_startedAt_idx" ON "ResearchRun"("startedAt");

-- CreateIndex
CREATE INDEX "ResearchTopic_vertical_idx" ON "ResearchTopic"("vertical");

-- CreateIndex
CREATE INDEX "ResearchTopic_category_idx" ON "ResearchTopic"("category");

-- CreateIndex
CREATE INDEX "ResearchTopic_relevanceScore_idx" ON "ResearchTopic"("relevanceScore");

-- CreateIndex
CREATE INDEX "ResearchTopic_firstSeen_idx" ON "ResearchTopic"("firstSeen");

-- CreateIndex
CREATE INDEX "TopicSelection_userId_idx" ON "TopicSelection"("userId");

-- CreateIndex
CREATE INDEX "TopicSelection_status_idx" ON "TopicSelection"("status");

-- CreateIndex
CREATE UNIQUE INDEX "TopicSelection_topicId_userId_key" ON "TopicSelection"("topicId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "ResearchSourceConfig_name_key" ON "ResearchSourceConfig"("name");

-- CreateIndex
CREATE INDEX "ResearchSourceConfig_enabled_idx" ON "ResearchSourceConfig"("enabled");

-- CreateIndex
CREATE INDEX "ContentDraft_brandId_idx" ON "ContentDraft"("brandId");

-- CreateIndex
CREATE INDEX "ContentDraft_brandId_status_idx" ON "ContentDraft"("brandId", "status");

-- CreateIndex
CREATE INDEX "ContentDraft_brandId_scheduledFor_idx" ON "ContentDraft"("brandId", "scheduledFor");

-- CreateIndex
CREATE INDEX "ContentDraft_parentId_idx" ON "ContentDraft"("parentId");

-- CreateIndex
CREATE INDEX "Feedback_type_idx" ON "Feedback"("type");

-- CreateIndex
CREATE INDEX "Feedback_status_idx" ON "Feedback"("status");

-- CreateIndex
CREATE INDEX "Feedback_createdAt_idx" ON "Feedback"("createdAt");

-- CreateIndex
CREATE INDEX "Feedback_userId_idx" ON "Feedback"("userId");

-- CreateIndex
CREATE INDEX "DriftAlert_brandId_idx" ON "DriftAlert"("brandId");

-- CreateIndex
CREATE INDEX "DriftAlert_brandId_status_idx" ON "DriftAlert"("brandId", "status");

-- CreateIndex
CREATE INDEX "DriftAlert_createdAt_idx" ON "DriftAlert"("createdAt");

-- CreateIndex
CREATE INDEX "ContentNiche_brandId_idx" ON "ContentNiche"("brandId");

-- CreateIndex
CREATE INDEX "ContentNiche_isActive_idx" ON "ContentNiche"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "ContentNiche_brandId_name_key" ON "ContentNiche"("brandId", "name");

-- CreateIndex
CREATE INDEX "ViralBenchmark_brandId_idx" ON "ViralBenchmark"("brandId");

-- CreateIndex
CREATE INDEX "ViralBenchmark_brandId_niche_idx" ON "ViralBenchmark"("brandId", "niche");

-- CreateIndex
CREATE INDEX "ViralBenchmark_viralScore_idx" ON "ViralBenchmark"("viralScore");

-- CreateIndex
CREATE INDEX "ViralBenchmark_scannedAt_idx" ON "ViralBenchmark"("scannedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ViralBenchmark_platform_externalId_key" ON "ViralBenchmark"("platform", "externalId");

-- CreateIndex
CREATE INDEX "PerformanceSnapshot_brandId_idx" ON "PerformanceSnapshot"("brandId");

-- CreateIndex
CREATE INDEX "PerformanceSnapshot_computedAt_idx" ON "PerformanceSnapshot"("computedAt");

-- CreateIndex
CREATE UNIQUE INDEX "PerformanceSnapshot_brandId_windowDays_key" ON "PerformanceSnapshot"("brandId", "windowDays");

-- CreateIndex
CREATE INDEX "GapAnalysis_brandId_idx" ON "GapAnalysis"("brandId");

-- CreateIndex
CREATE INDEX "GapAnalysis_computedAt_idx" ON "GapAnalysis"("computedAt");

-- CreateIndex
CREATE INDEX "UserSession_userId_idx" ON "UserSession"("userId");

-- CreateIndex
CREATE INDEX "UserSession_feature_idx" ON "UserSession"("feature");

-- CreateIndex
CREATE UNIQUE INDEX "XProfileCache_username_key" ON "XProfileCache"("username");

-- CreateIndex
CREATE INDEX "XProfileCache_username_idx" ON "XProfileCache"("username");

-- CreateIndex
CREATE INDEX "XProfileCache_fetchedAt_idx" ON "XProfileCache"("fetchedAt");

-- CreateIndex
CREATE UNIQUE INDEX "OnchainAttestation_uid_key" ON "OnchainAttestation"("uid");

-- CreateIndex
CREATE INDEX "OnchainAttestation_attestationType_idx" ON "OnchainAttestation"("attestationType");

-- CreateIndex
CREATE INDEX "OnchainAttestation_brandId_idx" ON "OnchainAttestation"("brandId");

-- CreateIndex
CREATE INDEX "OnchainAttestation_userId_idx" ON "OnchainAttestation"("userId");

-- CreateIndex
CREATE INDEX "OnchainAttestation_uid_idx" ON "OnchainAttestation"("uid");

-- CreateIndex
CREATE INDEX "OnchainAttestation_chain_attestationType_idx" ON "OnchainAttestation"("chain", "attestationType");

-- CreateIndex
CREATE UNIQUE INDEX "ApiKey_key_key" ON "ApiKey"("key");

-- CreateIndex
CREATE INDEX "ApiKey_prefix_idx" ON "ApiKey"("prefix");

-- CreateIndex
CREATE INDEX "ApiKey_ownerEmail_idx" ON "ApiKey"("ownerEmail");

-- CreateIndex
CREATE INDEX "ApiKey_isActive_idx" ON "ApiKey"("isActive");

-- CreateIndex
CREATE INDEX "ApiUsageLog_apiKeyId_idx" ON "ApiUsageLog"("apiKeyId");

-- CreateIndex
CREATE INDEX "ApiUsageLog_apiKeyId_createdAt_idx" ON "ApiUsageLog"("apiKeyId", "createdAt");

-- CreateIndex
CREATE INDEX "ApiUsageLog_createdAt_idx" ON "ApiUsageLog"("createdAt");

-- CreateIndex
CREATE INDEX "ApiUsageLog_endpoint_idx" ON "ApiUsageLog"("endpoint");

-- CreateIndex
CREATE INDEX "Deal_userId_idx" ON "Deal"("userId");

-- CreateIndex
CREATE INDEX "Deal_userId_status_idx" ON "Deal"("userId", "status");

-- CreateIndex
CREATE INDEX "Invoice_userId_idx" ON "Invoice"("userId");

-- CreateIndex
CREATE INDEX "Invoice_userId_status_idx" ON "Invoice"("userId", "status");

-- CreateIndex
CREATE INDEX "Invoice_dealId_idx" ON "Invoice"("dealId");

-- CreateIndex
CREATE INDEX "Transaction_userId_idx" ON "Transaction"("userId");

-- CreateIndex
CREATE INDEX "Transaction_userId_occurredAt_idx" ON "Transaction"("userId", "occurredAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "Workspace_stripe_customer_id_key" ON "Workspace"("stripe_customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "Workspace_stripe_subscription_id_key" ON "Workspace"("stripe_subscription_id");

-- CreateIndex
CREATE UNIQUE INDEX "Workspace_custom_world_id_key" ON "Workspace"("custom_world_id");

-- CreateIndex
CREATE INDEX "Workspace_owner_user_id_idx" ON "Workspace"("owner_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "CustomWorld_workspace_id_key" ON "CustomWorld"("workspace_id");

-- CreateIndex
CREATE INDEX "CustomWorld_workspace_id_idx" ON "CustomWorld"("workspace_id");

-- CreateIndex
CREATE INDEX "WorkspaceMember_user_id_idx" ON "WorkspaceMember"("user_id");

-- CreateIndex
CREATE INDEX "BrandScan_user_id_idx" ON "BrandScan"("user_id");

-- CreateIndex
CREATE INDEX "BrandScan_workspace_id_idx" ON "BrandScan"("workspace_id");

-- CreateIndex
CREATE INDEX "BrandScan_platform_connection_id_idx" ON "BrandScan"("platform_connection_id");

-- CreateIndex
CREATE UNIQUE INDEX "AuditReportShare_token_key" ON "AuditReportShare"("token");

-- CreateIndex
CREATE INDEX "AuditReportShare_token_idx" ON "AuditReportShare"("token");

-- CreateIndex
CREATE INDEX "AuditReportShare_workspace_id_idx" ON "AuditReportShare"("workspace_id");

-- CreateIndex
CREATE INDEX "SecurityAuditLog_user_id_created_at_idx" ON "SecurityAuditLog"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "SecurityAuditLog_workspace_id_created_at_idx" ON "SecurityAuditLog"("workspace_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "SecurityAuditLog_category_created_at_idx" ON "SecurityAuditLog"("category", "created_at" DESC);

-- CreateIndex
CREATE INDEX "SecurityAuditLog_created_at_idx" ON "SecurityAuditLog"("created_at");

-- AddForeignKey
ALTER TABLE "Brand" ADD CONSTRAINT "Brand_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Brand" ADD CONSTRAINT "Brand_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SharedBrand" ADD CONSTRAINT "SharedBrand_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SharedBrand" ADD CONSTRAINT "SharedBrand_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrandHealthSnapshot" ADD CONSTRAINT "BrandHealthSnapshot_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrandTweet" ADD CONSTRAINT "BrandTweet_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrandContent" ADD CONSTRAINT "BrandContent_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlatformConnection" ADD CONSTRAINT "PlatformConnection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlatformConnection" ADD CONSTRAINT "PlatformConnection_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrandVisualDNA" ADD CONSTRAINT "BrandVisualDNA_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalRequest" ADD CONSTRAINT "ApprovalRequest_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalRequest" ADD CONSTRAINT "ApprovalRequest_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalRequest" ADD CONSTRAINT "ApprovalRequest_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistoryEntry" ADD CONSTRAINT "HistoryEntry_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResearchTopic" ADD CONSTRAINT "ResearchTopic_researchRunId_fkey" FOREIGN KEY ("researchRunId") REFERENCES "ResearchRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TopicSelection" ADD CONSTRAINT "TopicSelection_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "ResearchTopic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentDraft" ADD CONSTRAINT "ContentDraft_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentDraft" ADD CONSTRAINT "ContentDraft_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ContentDraft"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriftAlert" ADD CONSTRAINT "DriftAlert_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentNiche" ADD CONSTRAINT "ContentNiche_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ViralBenchmark" ADD CONSTRAINT "ViralBenchmark_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerformanceSnapshot" ADD CONSTRAINT "PerformanceSnapshot_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GapAnalysis" ADD CONSTRAINT "GapAnalysis_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSession" ADD CONSTRAINT "UserSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiUsageLog" ADD CONSTRAINT "ApiUsageLog_apiKeyId_fkey" FOREIGN KEY ("apiKeyId") REFERENCES "ApiKey"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Workspace" ADD CONSTRAINT "Workspace_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Workspace" ADD CONSTRAINT "Workspace_custom_world_id_fkey" FOREIGN KEY ("custom_world_id") REFERENCES "CustomWorld"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceMember" ADD CONSTRAINT "WorkspaceMember_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceMember" ADD CONSTRAINT "WorkspaceMember_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrandScan" ADD CONSTRAINT "BrandScan_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrandScan" ADD CONSTRAINT "BrandScan_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrandScan" ADD CONSTRAINT "BrandScan_platform_connection_id_fkey" FOREIGN KEY ("platform_connection_id") REFERENCES "PlatformConnection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditReportShare" ADD CONSTRAINT "AuditReportShare_brand_scan_id_fkey" FOREIGN KEY ("brand_scan_id") REFERENCES "BrandScan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditReportShare" ADD CONSTRAINT "AuditReportShare_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditReportShare" ADD CONSTRAINT "AuditReportShare_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecurityAuditLog" ADD CONSTRAINT "SecurityAuditLog_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecurityAuditLog" ADD CONSTRAINT "SecurityAuditLog_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "Workspace"("id") ON DELETE SET NULL ON UPDATE CASCADE;

