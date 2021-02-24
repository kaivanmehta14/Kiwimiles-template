-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'NONBINARY', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "NotificationEmail" AS ENUM ('ACCOUNT', 'UPDATES', 'PROMOTIONS');

-- CreateEnum
CREATE TYPE "PrefersColorScheme" AS ENUM ('NO_PREFERENCE', 'LIGHT', 'DARK');

-- CreateEnum
CREATE TYPE "PrefersReducedMotion" AS ENUM ('NO_PREFERENCE', 'REDUCE');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUDO', 'USER');

-- CreateEnum
CREATE TYPE "MfaMethod" AS ENUM ('NONE', 'SMS', 'TOTP', 'EMAIL');

-- CreateEnum
CREATE TYPE "MembershipRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER');

-- CreateEnum
CREATE TYPE "IdentityType" AS ENUM ('GOOGLE', 'APPLE', 'SLACK');

-- CreateTable
CREATE TABLE "User" (
    "checkLocationOnLogin" BOOLEAN NOT NULL DEFAULT true,
    "countryCode" TEXT NOT NULL DEFAULT E'nz',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "gender" "Gender" NOT NULL DEFAULT E'UNKNOWN',
    "id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "notificationEmail" "NotificationEmail" NOT NULL DEFAULT E'ACCOUNT',
    "password" TEXT,
    "prefersLanguage" TEXT NOT NULL DEFAULT E'en-us',
    "prefersColorScheme" "PrefersColorScheme" NOT NULL DEFAULT E'NO_PREFERENCE',
    "prefersReducedMotion" "PrefersReducedMotion" NOT NULL DEFAULT E'NO_PREFERENCE',
    "prefersEmailId" INTEGER,
    "profilePictureUrl" TEXT NOT NULL DEFAULT E'https://unavatar.now.sh/fallback.png',
    "role" "UserRole" NOT NULL DEFAULT E'USER',
    "timezone" TEXT NOT NULL DEFAULT E'Pacific/Auckland',
    "twoFactorMethod" "MfaMethod" NOT NULL DEFAULT E'NONE',
    "twoFactorPhone" TEXT,
    "twoFactorSecret" TEXT,
    "attributes" JSONB,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Group" (
    "autoJoinDomain" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "forceTwoFactor" BOOLEAN NOT NULL DEFAULT false,
    "id" INTEGER NOT NULL,
    "ipRestrictions" TEXT,
    "name" TEXT NOT NULL,
    "onlyAllowDomain" BOOLEAN NOT NULL DEFAULT false,
    "profilePictureUrl" TEXT NOT NULL DEFAULT E'https://unavatar.now.sh/fallback.png',
    "attributes" JSONB,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "parentId" INTEGER,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Email" (
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "email" TEXT NOT NULL,
    "emailSafe" TEXT NOT NULL,
    "id" SERIAL NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiKey" (
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "description" TEXT,
    "id" SERIAL NOT NULL,
    "ipRestrictions" JSONB,
    "apiKey" TEXT NOT NULL,
    "name" TEXT,
    "groupId" INTEGER,
    "referrerRestrictions" JSONB,
    "scopes" JSONB,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApprovedSubnet" (
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id" SERIAL NOT NULL,
    "subnet" TEXT NOT NULL,
    "city" TEXT,
    "region" TEXT,
    "timezone" TEXT,
    "countryCode" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BackupCode" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "userId" INTEGER NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CouponCode" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "maxUses" INTEGER NOT NULL DEFAULT 1000,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "teamRestrictions" TEXT,
    "amount" DECIMAL(65,30) NOT NULL DEFAULT 0.00,
    "currency" TEXT NOT NULL,
    "description" TEXT,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Domain" (
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "domain" TEXT NOT NULL,
    "id" SERIAL NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "groupId" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "verificationCode" TEXT NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Identity" (
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id" SERIAL NOT NULL,
    "loginName" TEXT NOT NULL,
    "type" "IdentityType" NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Membership" (
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id" SERIAL NOT NULL,
    "groupId" INTEGER NOT NULL,
    "role" "MembershipRole" NOT NULL DEFAULT E'MEMBER',
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id" SERIAL NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userAgent" TEXT,
    "city" TEXT,
    "region" TEXT,
    "timezone" TEXT,
    "countryCode" TEXT,
    "browser" TEXT,
    "operatingSystem" TEXT,
    "userId" INTEGER NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Webhook" (
    "contentType" TEXT NOT NULL DEFAULT E'application/json',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "event" TEXT NOT NULL,
    "id" SERIAL NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "lastFiredAt" TIMESTAMP(3),
    "groupId" INTEGER NOT NULL,
    "secret" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "url" TEXT NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "event" TEXT NOT NULL,
    "rawEvent" TEXT NOT NULL,
    "id" SERIAL NOT NULL,
    "groupId" INTEGER,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER,
    "apiKeyId" INTEGER,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "city" TEXT,
    "region" TEXT,
    "timezone" TEXT,
    "countryCode" TEXT,
    "browser" TEXT,
    "operatingSystem" TEXT,

    PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "prefersEmailId" ON "User"("prefersEmailId");

-- CreateIndex
CREATE INDEX "parentId" ON "Group"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "Email.email_unique" ON "Email"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Email.emailSafe_unique" ON "Email"("emailSafe");

-- CreateIndex
CREATE INDEX "userId" ON "Email"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ApiKey.apiKey_unique" ON "ApiKey"("apiKey");

-- CreateIndex
CREATE INDEX "apiKeyId" ON "AuditLog"("apiKeyId");

-- AddForeignKey
ALTER TABLE "User" ADD FOREIGN KEY ("prefersEmailId") REFERENCES "Email"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Group" ADD FOREIGN KEY ("parentId") REFERENCES "Group"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Email" ADD FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiKey" ADD FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiKey" ADD FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovedSubnet" ADD FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BackupCode" ADD FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Domain" ADD FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Identity" ADD FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Webhook" ADD FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD FOREIGN KEY ("apiKeyId") REFERENCES "ApiKey"("id") ON DELETE SET NULL ON UPDATE CASCADE;
