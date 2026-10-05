import { createTask } from "./actions";
import { prisma } from "@/lib/prisma";

const DEMO_EMAIL = "demo@refactoredwinner.local";

export default async function TasksPage() {
  const user = await prisma.user.findUnique({ where: { email: DEMO_EMAIL } });
  const projects = user ? await prisma.project.findMany({ where: { ownerId: user.id }, orderBy: { createdAt: "desc" } }) : [];
  const tasks = user ? await prisma.task.findMany({ where: { project: { ownerId: user.id } }, include: { project: true }, orderBy: { createdAt: "desc" } }) : [];

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <p className="text-sm text-zinc-500">Workspace</p>
      <h1 className="mt-1 text-3xl font-semibold">Tasks</h1>
      {projects.length > 0 ? (
        <form action={createTask} className="mt-8 max-w-2xl space-y-4 rounded-xl border border-zinc-800 p-6">
          <div><label htmlFor="title" className="text-sm font-medium">Task</label><input id="title" name="title" required placeholder="Add authentication" className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 outline-none focus:border-zinc-400" /></div>
          <div><label htmlFor="projectId" className="text-sm font-medium">Project</label><select id="projectId" name="projectId" required className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2"><option value="">Select a project</option>{projects.map((project)=><option key={project.id} value={project.id}>{project.name}</option>)}</select></div>
          <button className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black">Create task</button>
        </form>
      ) : <div className="mt-8 rounded-xl border border-dashed border-zinc-700 p-8 text-sm text-zinc-500">Create a project before adding tasks.</div>}

      <section className="mt-10 space-y-3">
        {tasks.map((task)=><article key={task.id} className="flex items-center justify-between rounded-xl border border-zinc-800 p-4"><div><p className="font-medium">{task.title}</p><p className="mt-1 text-xs text-zinc-500">{task.project.name}</p></div><span className="text-xs text-zinc-500">{task.completed ? "Done" : "Open"}</span></article>)}
        {tasks.length === 0 && <p className="text-sm text-zinc-500">No tasks yet.</p>}
      </section>
    </main>
  );
}
