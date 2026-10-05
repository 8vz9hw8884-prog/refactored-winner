import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createTask, deleteTask, toggleTask } from "./actions";

export default async function TasksPage() {
  const session = await auth();
  if (!session?.user?.email) return null;
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  const projects = user ? await prisma.project.findMany({ where: { ownerId: user.id }, orderBy: { createdAt: "desc" } }) : [];
  const tasks = user ? await prisma.task.findMany({ where: { project: { ownerId: user.id } }, include: { project: true }, orderBy: { createdAt: "desc" } }) : [];

  return <main className="mx-auto max-w-6xl px-6 py-12">
    <p className="text-sm text-zinc-500">Workspace</p>
    <h1 className="mt-1 text-3xl font-semibold">Tasks</h1>
    {projects.length ? <form action={createTask} className="mt-8 max-w-2xl space-y-4 rounded-xl border border-zinc-800 p-6">
      <div><label htmlFor="title" className="text-sm">Task</label><input id="title" name="title" required placeholder="Add authentication" className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2" /></div>
      <div><label htmlFor="projectId" className="text-sm">Project</label><select id="projectId" name="projectId" required className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2"><option value="">Select a project</option>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
      <button className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black">Create task</button>
    </form> : <div className="mt-8 rounded-xl border border-dashed border-zinc-700 p-8 text-sm text-zinc-500">Create a project before adding tasks.</div>}
    <section className="mt-10 space-y-3">
      {tasks.map(task => <article key={task.id} className="flex items-center justify-between gap-4 rounded-xl border border-zinc-800 p-4">
        <div><p className={task.completed ? "font-medium line-through text-zinc-500" : "font-medium"}>{task.title}</p><p className="mt-1 text-xs text-zinc-500">{task.project.name}</p></div>
        <div className="flex gap-2">
          <form action={toggleTask}><input type="hidden" name="taskId" value={task.id} /><button className="rounded-md border border-zinc-700 px-3 py-1.5 text-xs">{task.completed ? "Reopen" : "Complete"}</button></form>
          <form action={deleteTask}><input type="hidden" name="taskId" value={task.id} /><button className="rounded-md border border-red-900 px-3 py-1.5 text-xs text-red-400">Delete</button></form>
        </div>
      </article>)}
      {tasks.length === 0 && <p className="text-sm text-zinc-500">No tasks yet.</p>}
    </section>
  </main>;
}