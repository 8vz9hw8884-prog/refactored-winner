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
  const tree = data.tree ?? [];
  const files = tree.filter(item => item.type === "blob");
  const codeFiles = files.filter(item => shouldScan(item.path));
  const largeFileCount = codeFiles.filter(item => (item.size ?? 0) > 50_000).length;
  const totalBytes = codeFiles.reduce((sum, item) => sum + (item.size ?? 0), 0);

  const sizePenalty = Math.min(35, largeFileCount * 5);
  const breadthPenalty = codeFiles.length === 0 ? 40 : 0;
  const score = Math.max(0, Math.min(100, 100 - sizePenalty - breadthPenalty));

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
