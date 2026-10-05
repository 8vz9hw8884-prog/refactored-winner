"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

function parseGitHubUrl(value: string) {
  try {
    const url = new URL(value.trim());
    if (url.hostname !== "github.com") return null;
    const parts = url.pathname.split("/").filter(Boolean);
    if (parts.length < 2) return null;
    const [owner, name] = parts;
    if (!/^[A-Za-z0-9_.-]+$/.test(owner) || !/^[A-Za-z0-9_.-]+$/.test(name)) return null;
    return { owner, name };
  } catch { return null; }
}

export async function addGitHubRepository(formData: FormData) {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) redirect("/login");

  const parsed = parseGitHubUrl(String(formData.get("url") ?? ""));
  if (!parsed) return;

  const response = await fetch(
    `https://api.github.com/repos/${encodeURIComponent(parsed.owner)}/${encodeURIComponent(parsed.name)}`,
    { headers: { Accept: "application/vnd.github+json", "User-Agent": "refactored-winner" }, cache: "no-store" }
  );
  if (!response.ok) return;

  const data = await response.json() as {
    full_name: string; html_url: string; description: string | null;
    default_branch: string; language: string | null; stargazers_count: number;
    forks_count: number; open_issues_count: number; pushed_at: string | null;
  };

  await prisma.gitHubRepository.upsert({
    where: { ownerId_fullName: { ownerId: user.id, fullName: data.full_name } },
    create: {
      owner: parsed.owner, name: parsed.name, fullName: data.full_name, htmlUrl: data.html_url,
      description: data.description, defaultBranch: data.default_branch, language: data.language,
      stars: data.stargazers_count, forks: data.forks_count, openIssues: data.open_issues_count,
      pushedAt: data.pushed_at ? new Date(data.pushed_at) : null, ownerId: user.id
    },
    update: {
      description: data.description, defaultBranch: data.default_branch, language: data.language,
      stars: data.stargazers_count, forks: data.forks_count, openIssues: data.open_issues_count,
      pushedAt: data.pushed_at ? new Date(data.pushed_at) : null, htmlUrl: data.html_url
    }
  });
  revalidatePath("/github");
}

const SOURCE_EXTENSIONS = new Set([".ts",".tsx",".js",".jsx",".mjs",".cjs",".py",".go",".rs",".java",".kt",".kts",".rb",".php",".cs",".cpp",".c",".h",".hpp",".swift",".vue",".svelte"]);
const IGNORED_PARTS = new Set(["node_modules",".git",".next","dist","build","coverage","vendor"]);

function shouldScan(path: string) {
  const parts = path.split("/");
  if (parts.some(part => IGNORED_PARTS.has(part))) return false;
  const lower = path.toLowerCase();
  if (lower.endsWith(".lock") || lower.endsWith(".map")) return false;
  return SOURCE_EXTENSIONS.has(lower.slice(lower.lastIndexOf(".")));
}

export async function analyzeGitHubRepository(formData: FormData) {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) redirect("/login");

  const repositoryId = String(formData.get("repositoryId") ?? "");
  const repository = await prisma.gitHubRepository.findFirst({ where: { id: repositoryId, ownerId: user.id } });
  if (!repository) return;

  const branch = repository.defaultBranch || "main";
  const response = await fetch(
    `https://api.github.com/repos/${encodeURIComponent(repository.owner)}/${encodeURIComponent(repository.name)}/git/trees/${encodeURIComponent(branch)}?recursive=1`,
    { headers: { Accept: "application/vnd.github+json", "User-Agent": "refactored-winner" }, cache: "no-store" }
  );
  if (!response.ok) return;

  const data = await response.json() as { tree?: Array<{ path: string; type: string; size?: number }> };
  const files = (data.tree ?? []).filter(item => item.type === "blob");
  const codeFiles = files.filter(item => shouldScan(item.path));
  const largeFileCount = codeFiles.filter(item => (item.size ?? 0) > 50_000).length;
  const totalBytes = codeFiles.reduce((sum, item) => sum + (item.size ?? 0), 0);
  const candidates = codeFiles.filter(item => (item.size ?? 0) <= 250_000).slice(0, 20);

  const findings: Array<{ kind: string; severity: string; path: string; line?: number; message: string }> = [];
  for (const file of candidates) {
    if ((file.size ?? 0) > 50_000) findings.push({ kind: "large-file", severity: "MEDIUM", path: file.path, message: "Source file is larger than 50 KB; consider splitting it into smaller modules." });
    const rawUrl = `https://raw.githubusercontent.com/${encodeURIComponent(repository.owner)}/${encodeURIComponent(repository.name)}/${file.path.split("/").map(encodeURIComponent).join("/")}`;
    const raw = await fetch(rawUrl, { headers: { "User-Agent": "refactored-winner" }, cache: "no-store" });
    if (!raw.ok) continue;
    const lines = (await raw.text()).split(/\r?\n/);
    lines.forEach((line, index) => {
      const lineNumber = index + 1;
      if (/\b(TODO|FIXME)\b/i.test(line)) findings.push({ kind: "todo", severity: "LOW", path: file.path, line: lineNumber, message: "TODO/FIXME comment indicates unfinished or deferred work." });
      if (/\bconsole\.(log|debug|info)\s*\(/.test(line) && /\.(js|jsx|ts|tsx|mjs|cjs)$/.test(file.path)) findings.push({ kind: "debug-output", severity: "LOW", path: file.path, line: lineNumber, message: "Console debug output is present; remove it or replace it with structured logging." });
      if (line.length > 160) findings.push({ kind: "long-line", severity: "INFO", path: file.path, line: lineNumber, message: "Line exceeds 160 characters and may be harder to review or maintain." });
    });
  }

  const findingPenalty = findings.reduce((sum, finding) => sum + (finding.severity === "MEDIUM" ? 5 : finding.severity === "LOW" ? 2 : 0), 0);
  const score = Math.max(0, Math.min(100, 100 - Math.min(35, largeFileCount * 5) - Math.min(30, findingPenalty) - (codeFiles.length === 0 ? 40 : 0)));

  await prisma.codeFinding.deleteMany({ where: { repositoryId: repository.id } });
  if (findings.length) {
    await prisma.codeFinding.createMany({ data: findings.map(finding => ({ ...finding, repositoryId: repository.id })) });
  }
  await prisma.gitHubRepository.update({
    where: { id: repository.id },
    data: { analysisScore: score, analyzedAt: new Date(), fileCount: files.length, codeFileCount: codeFiles.length, totalBytes, largeFileCount }
  });
  revalidatePath("/github");
}

export async function refreshGitHubRepository(formData: FormData) {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) redirect("/login");

  const repositoryId = String(formData.get("repositoryId") ?? "");
  const repository = await prisma.gitHubRepository.findFirst({ where: { id: repositoryId, ownerId: user.id } });
  if (!repository) return;

  const response = await fetch(
    `https://api.github.com/repos/${encodeURIComponent(repository.owner)}/${encodeURIComponent(repository.name)}`,
    { headers: { Accept: "application/vnd.github+json", "User-Agent": "refactored-winner" }, cache: "no-store" }
  );
  if (!response.ok) return;

  const data = await response.json() as {
    full_name: string; html_url: string; description: string | null;
    default_branch: string; language: string | null; stargazers_count: number;
    forks_count: number; open_issues_count: number; pushed_at: string | null;
  };

  await prisma.gitHubRepository.update({
    where: { id: repository.id },
    data: {
      fullName: data.full_name, htmlUrl: data.html_url, description: data.description,
      defaultBranch: data.default_branch, language: data.language,
      stars: data.stargazers_count, forks: data.forks_count,
      openIssues: data.open_issues_count,
      pushedAt: data.pushed_at ? new Date(data.pushed_at) : null
    }
  });
  revalidatePath("/github");
}
