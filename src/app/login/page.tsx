import Link from "next/link";
import { login } from "../auth/actions";

export default function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  return <main className="mx-auto max-w-md px-6 py-16"><h1 className="text-3xl font-semibold">Sign in</h1><p className="mt-2 text-sm text-zinc-500">Access your Refactored Winner workspace.</p><form action={login} className="mt-8 space-y-4 rounded-xl border border-zinc-800 p-6"><div><label htmlFor="email" className="text-sm">Email</label><input id="email" name="email" type="email" required className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2"/></div><div><label htmlFor="password" className="text-sm">Password</label><input id="password" name="password" type="password" required className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2"/></div><button className="w-full rounded-lg bg-white px-4 py-2 font-medium text-black">Sign in</button></form><p className="mt-6 text-center text-sm text-zinc-500">New here? <Link href="/register" className="text-white underline">Create an account</Link></p></main>;
}
