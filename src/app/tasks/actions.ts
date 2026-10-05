"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

async function currentUser() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) redirect("/login");
  return user;
}

export async function createTask(formData: FormData) {
  const user = await currentUser();
  const title = String(formData.get("title") ?? "").trim();
  const projectId = String(formData.get("projectId") ?? "").trim();
  if (!title || !projectId) return;
  const project = await prisma.project.findFirst({ where: { id: projectId, ownerId: user.id } });
  if (!project) return;
  await prisma.task.create({ data: { title, projectId } });
  revalidatePath("/tasks"); revalidatePath("/dashboard"); revalidatePath("/projects");
}

export async function toggleTask(formData: FormData) {
  const user = await currentUser();
  const taskId = String(formData.get("taskId") ?? "");
  const task = await prisma.task.findFirst({ where: { id: taskId, project: { ownerId: user.id } } });
  if (!task) return;
  await prisma.task.update({ where: { id: task.id }, data: { completed: !task.completed } });
  revalidatePath("/tasks"); revalidatePath("/dashboard");
}

export async function deleteTask(formData: FormData) {
  const user = await currentUser();
  const taskId = String(formData.get("taskId") ?? "");
  const task = await prisma.task.findFirst({ where: { id: taskId, project: { ownerId: user.id } } });
  if (!task) return;
  await prisma.task.delete({ where: { id: task.id } });
  revalidatePath("/tasks"); revalidatePath("/dashboard"); revalidatePath("/projects");
}
