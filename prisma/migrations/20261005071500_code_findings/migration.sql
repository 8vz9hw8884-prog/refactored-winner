CREATE TABLE "CodeFinding" (
    "id" TEXT NOT NULL,
    "repositoryId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "line" INTEGER,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CodeFinding_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "CodeFinding_repositoryId_idx" ON "CodeFinding"("repositoryId");
CREATE INDEX "CodeFinding_repositoryId_severity_idx" ON "CodeFinding"("repositoryId", "severity");
ALTER TABLE "CodeFinding" ADD CONSTRAINT "CodeFinding_repositoryId_fkey"
FOREIGN KEY ("repositoryId") REFERENCES "GitHubRepository"("id") ON DELETE CASCADE ON UPDATE CASCADE;