import Link from "next/link";
import { signIn, signUp } from "./actions";
import { Button } from "@/components/ui/button";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; message?: string }> }) {
  const { error, message } = await searchParams;
  return <main className="mx-auto flex min-h-screen max-w-md items-center p-5"><div className="w-full space-y-6">
    <div><p className="text-sm font-semibold text-church-600">CHURCH EQUIPMENT</p><h1 className="mt-1 text-3xl font-bold">Sign in</h1><p className="mt-2 text-slate-600">Request and return church equipment.</p></div>
    {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}{message && <p className="rounded-lg bg-green-50 p-3 text-sm text-green-700">{message}</p>}
    <form action={signIn} className="space-y-3 rounded-xl border bg-white p-5 shadow-sm"><input required name="email" type="email" placeholder="Email" className="w-full rounded-lg border p-3"/><input required name="password" type="password" placeholder="Password" className="w-full rounded-lg border p-3"/><Button className="w-full">Sign in</Button></form>
    <details className="rounded-xl border bg-white p-5"><summary className="cursor-pointer font-semibold">New here? Create an account</summary><form action={signUp} className="mt-4 space-y-3"><input required name="name" placeholder="Your name" className="w-full rounded-lg border p-3"/><input required name="email" type="email" placeholder="Email" className="w-full rounded-lg border p-3"/><input required minLength={6} name="password" type="password" placeholder="Password (6+ characters)" className="w-full rounded-lg border p-3"/><Button className="w-full">Create account</Button></form></details>
    <Link className="block text-center text-sm text-church-600 underline" href="/">Back to equipment</Link>
  </div></main>;
}
