import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { addGitHubRepository, analyzeGitHubRepository, refreshGitHubRepository } from "./actions";

function health(repo: { openIssues: number; pushedAt: Date | null; stars: number; forks: number }) {
  let score = 100;
  if (!repo.pushedAt) score -= 30;
  else {
    const age = (Date.now() - repo.pushedAt.getTime()) / 86400000;
    if (age > 180) score -= 35;
    else if (age > 90) score -= 20;
    else if (age > 30) score -= 10;
  }
  if (repo.openIssues > 100) score -= 20;
  else if (repo.openIssues > 25) score -= 10;
  if (repo.stars === 0 && repo.forks === 0) score -= 5;
  return Math.max(0, Math.min(100, score));
}

function healthLabel(score: number) {
  if (score >= 80) return "Healthy";
  if (score >= 60) return "Needs attention";
  return "At risk";
}

export default async function GitHubPage() {
  const session = await auth();
  if (!session?.user?.email) return null;
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  const repositories = user ? await prisma.gitHubRepository.findMany({ where: { ownerId: user.id }, orderBy: { updatedAt: "desc" } }) : [];

  return <main className="mx-auto max-w-6xl px-6 py-12">
    <p className="text-sm text-zinc-500">Integration</p>
    <h1 className="mt-1 text-3xl font-semibold">GitHub repositories</h1>
    <p className="mt-2 max-w-2xl text-sm text-zinc-500">Connect a public repository and get an initial health snapshot.</p>
    <form action={addGitHubRepository} className="mt-8 flex max-w-2xl gap-3">
      <input name="url" required type="url" placeholder="https://github.com/owner/repository" className="min-w-0 flex-1 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2" />
      <button className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black">Connect</button>
    </form>
    <section className="mt-10 grid gap-4 md:grid-cols-2">
      {repositories.map(repo => { const score = health(repo); return <article key={repo.id} className="rounded-xl border border-zinc-800 p-5">
        <div className="flex items-start justify-between gap-4">
          <div><a href={repo.htmlUrl} target="_blank" rel="noreferrer" className="font-medium hover:underline">{repo.fullName}</a><p className="mt-2 text-sm text-zinc-500">{repo.description || "No description."}</p></div>
          <span className="rounded-full border border-zinc-700 px-2 py-1 text-xs">{healthLabel(score)} · {score}</span>
        </div>
        <div className="mt-5 grid grid-cols-4 gap-3 text-sm">
          <div><p className="text-xs text-zinc-500">Stars</p><p className="mt-1 font-medium">{repo.stars}</p></div>
          <div><p className="text-xs text-zinc-500">Forks</p><p className="mt-1 font-medium">{repo.forks}</p></div>
          <div><p className="text-xs text-zinc-500">Issues</p><p className="mt-1 font-medium">{repo.openIssues}</p></div>
          <div><p className="text-xs text-zinc-500">Language</p><p className="mt-1 font-medium">{repo.language || "Unknown"}</p></div>
        </div>
        <div className="mt-5 flex items-center justify-between border-t border-zinc-800 pt-4">
          <p className="text-xs text-zinc-500">Last push: {repo.pushedAt ? repo.pushedAt.toLocaleDateString() : "Unknown"}</p>
          <form action={refreshGitHubRepository}><input type="hidden" name="repositoryId" value={repo.id} /><button className="text-xs text-zinc-300 hover:text-white">Refresh</button></form>
        </div>
      </article>})}
      {repositories.length === 0 && <div className="rounded-xl border border-dashed border-zinc-700 p-8 text-sm text-zinc-500">No repositories connected yet.</div>}
    </section>
    <Link href="/dashboard" className="mt-8 inline-block text-sm text-zinc-400 hover:text-white">← Back to dashboard</Link>
  </main>;
}