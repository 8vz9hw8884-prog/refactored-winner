ALTER TABLE "GitHubRepository"
ADD COLUMN "analysisScore" INTEGER,
ADD COLUMN "analyzedAt" TIMESTAMP(3),
ADD COLUMN "fileCount" INTEGER,
ADD COLUMN "codeFileCount" INTEGER,
ADD COLUMN "totalBytes" INTEGER,
ADD COLUMN "largeFileCount" INTEGER;