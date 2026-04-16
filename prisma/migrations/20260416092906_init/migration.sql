-- CreateEnum
CREATE TYPE "ApplicationType" AS ENUM ('WALLET_BANK_AGENT', 'AGENT');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Application" (
    "id" TEXT NOT NULL,
    "type" "ApplicationType" NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "userId" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "address" TEXT,
    "country" TEXT,
    "whatsappNumber" TEXT,
    "mobileNumber" TEXT,
    "telegramId" TEXT,
    "documentUrl" TEXT,
    "profilePicUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BankDetails" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "accountNumber" TEXT,
    "ifscCode" TEXT,
    "bankName" TEXT,
    "holderName" TEXT,
    "branchName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BankDetails_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WalletDetails" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "provider" TEXT,
    "walletId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WalletDetails_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformDetails" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "platformName" TEXT,
    "platformLink" TEXT,
    "usersRange" TEXT,
    "turnoverRange" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformDetails_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrandRelation" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "usernameInPlatform" TEXT,
    "hadPreviousTransaction" BOOLEAN,
    "transactionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BrandRelation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_mobile_key" ON "User"("mobile");

-- CreateIndex
CREATE UNIQUE INDEX "BankDetails_applicationId_key" ON "BankDetails"("applicationId");

-- CreateIndex
CREATE UNIQUE INDEX "WalletDetails_applicationId_key" ON "WalletDetails"("applicationId");

-- CreateIndex
CREATE UNIQUE INDEX "PlatformDetails_applicationId_key" ON "PlatformDetails"("applicationId");

-- CreateIndex
CREATE UNIQUE INDEX "BrandRelation_applicationId_key" ON "BrandRelation"("applicationId");

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankDetails" ADD CONSTRAINT "BankDetails_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletDetails" ADD CONSTRAINT "WalletDetails_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlatformDetails" ADD CONSTRAINT "PlatformDetails_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrandRelation" ADD CONSTRAINT "BrandRelation_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;
