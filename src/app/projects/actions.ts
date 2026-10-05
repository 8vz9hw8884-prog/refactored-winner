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

export async function createProject(formData: FormData) {
  const user = await currentUser();
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  if (!name) return;
  await prisma.project.create({ data: { name, description: description || null, ownerId: user.id } });
  revalidatePath("/projects"); revalidatePath("/dashboard"); revalidatePath("/tasks");
}

export async function deleteProject(formData: FormData) {
  const user = await currentUser();
  const projectId = String(formData.get("projectId") ?? "");
  const project = await prisma.project.findFirst({ where: { id: projectId, ownerId: user.id } });
  if (!project) return;
  await prisma.project.delete({ where: { id: project.id } });
  revalidatePath("/projects"); revalidatePath("/dashboard"); revalidatePath("/tasks");
}
