-- CreateTable
CREATE TABLE "Content" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL DEFAULT '',
    "tag" TEXT NOT NULL DEFAULT '',
    "readTime" INTEGER NOT NULL DEFAULT 5,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "sourceName" TEXT NOT NULL DEFAULT '',
    "sourceUrl" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SiteSettings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'main',
    "siteName" TEXT NOT NULL,
    "tagline" TEXT NOT NULL,
    "heroTitle" TEXT NOT NULL,
    "heroDescription" TEXT NOT NULL,
    "heroEyebrow" TEXT NOT NULL DEFAULT 'A LITTLE KNOWLEDGE. A HEALTHIER YOU.',
    "heroImageUrl" TEXT NOT NULL DEFAULT '/images/hero-care.jpg',
    "heroImageCaption" TEXT NOT NULL DEFAULT 'Good health starts with understanding.',
    "topicsTitle" TEXT NOT NULL DEFAULT 'What would you like to explore?',
    "topicsDescription" TEXT NOT NULL DEFAULT 'Clear answers, wherever you are on your health journey.',
    "featuredTitle" TEXT NOT NULL DEFAULT 'A little more understanding.',
    "featuredDescription" TEXT NOT NULL DEFAULT 'Helpful reads for everyday health and a better-informed you.',
    "indexTitle" TEXT NOT NULL DEFAULT 'Find it. Understand it.',
    "indexDescription" TEXT NOT NULL DEFAULT 'Browse our growing health library, one letter at a time.',
    "missionTitle" TEXT NOT NULL DEFAULT 'Health information should be for everyone.',
    "missionDescription" TEXT NOT NULL DEFAULT 'We make medical knowledge easier to understand, so you can have more confident conversations about your health.',
    "aboutText" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "footerText" TEXT NOT NULL DEFAULT 'A healthier world begins with a better-informed you.',
    "disclaimer" TEXT NOT NULL DEFAULT 'For education only. This information does not replace medical advice, diagnosis, or treatment. Always speak with a qualified healthcare professional about your health.',
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Admin" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "displayName" TEXT NOT NULL DEFAULT 'Administrator',
    "passwordHash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "AdminSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tokenHash" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AdminSession_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LoginAttempt" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "windowStart" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "Content_slug_key" ON "Content"("slug");

-- CreateIndex
CREATE INDEX "Content_status_category_idx" ON "Content"("status", "category");

-- CreateIndex
CREATE UNIQUE INDEX "Admin_email_key" ON "Admin"("email");

-- CreateIndex
CREATE UNIQUE INDEX "AdminSession_tokenHash_key" ON "AdminSession"("tokenHash");

-- CreateIndex
CREATE INDEX "AdminSession_expiresAt_idx" ON "AdminSession"("expiresAt");
