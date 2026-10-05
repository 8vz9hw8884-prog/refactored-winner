import { createProject } from "./actions";
import { prisma } from "@/lib/prisma";

const DEMO_EMAIL = "demo@refactoredwinner.local";

export default async function ProjectsPage() {
  const user = await prisma.user.findUnique({ where: { email: DEMO_EMAIL } });
  const projects = user
    ? await prisma.project.findMany({ where: { ownerId: user.id }, include: { _count: { select: { tasks: true } } }, orderBy: { createdAt: "desc" } })
    : [];

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <div className="max-w-2xl">
        <p className="text-sm text-zinc-500">Workspace</p>
        <h1 className="mt-1 text-3xl font-semibold">Projects</h1>
        <form action={createProject} className="mt-8 space-y-4 rounded-xl border border-zinc-800 p-6">
          <div><label htmlFor="name" className="text-sm font-medium">Project name</label><input id="name" name="name" required placeholder="Website redesign" className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 outline-none focus:border-zinc-400" /></div>
          <div><label htmlFor="description" className="text-sm font-medium">Description <span className="text-zinc-500">(optional)</span></label><textarea id="description" name="description" rows={3} placeholder="What are you building?" className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 outline-none focus:border-zinc-400" /></div>
          <button className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black">Create project</button>
        </form>
      </div>

      <section className="mt-10 grid gap-4 md:grid-cols-2">
        {projects.map((project) => (
          <article key={project.id} className="rounded-xl border border-zinc-800 p-5">
            <h2 className="font-medium">{project.name}</h2>
            <p className="mt-2 text-sm text-zinc-500">{project.description || "No description yet."}</p>
            <p className="mt-4 text-xs text-zinc-500">{project._count.tasks} {project._count.tasks === 1 ? "task" : "tasks"}</p>
          </article>
        ))}
        {projects.length === 0 && <div className="rounded-xl border border-dashed border-zinc-700 p-8 text-sm text-zinc-500">Create your first project above.</div>}
      </section>
    </main>
  );
}
