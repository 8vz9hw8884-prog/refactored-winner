"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

const DEMO_EMAIL = "demo@refactoredwinner.local";

async function demoUser() {
  return prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: {},
    create: { email: DEMO_EMAIL, name: "Demo Workspace" }
  });
}

export async function createProject(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (!name) return;

  const user = await demoUser();
  await prisma.project.create({
    data: { name, description: description || null, ownerId: user.id }
  });

  revalidatePath("/projects");
  revalidatePath("/dashboard");
}
