import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function SettingsPage() {
  const session = await auth();
  if (!session) redirect("/login");
  return <main className="mx-auto max-w-3xl px-6 py-12"><p className="text-sm text-zinc-500">Account</p><h1 className="mt-1 text-3xl font-semibold">Settings</h1><div className="mt-8 rounded-xl border border-zinc-800 p-6"><h2 className="font-medium">Account</h2><p className="mt-2 text-sm text-zinc-500">{session.user?.email}</p><p className="mt-1 text-sm text-zinc-500">Authentication is enabled for this account.</p></div></main>;
}