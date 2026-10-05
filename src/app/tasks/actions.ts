"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function createTask(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const projectId = String(formData.get("projectId") ?? "").trim();
  if (!title || !projectId) return;

  await prisma.task.create({ data: { title, projectId } });
  revalidatePath("/tasks");
  revalidatePath("/dashboard");
}
