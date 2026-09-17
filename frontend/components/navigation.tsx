import Link from "next/link";
import { LogOut } from "lucide-react";
import { isAdmin } from "@/lib/auth";
import type { Profile } from "@/lib/types";
import { signOut } from "@/app/actions";

export function Navigation({ profile }: { profile: Profile }) {
  const links = isAdmin(profile) ? [["Home", "/"], ["Assets", "/assets"], ["Requests", "/requests"], ["Manage Assets", "/assets/new"]] : [["Home", "/"], ["Assets", "/assets"], ["My Requests", "/my-requests"], ["My Equipment", "/my-equipment"]];
  return <><header className="border-b bg-white"><div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3"><Link href="/" className="font-bold text-church-700">Church Equipment</Link><form action={signOut}><button title="Sign out" className="p-2 text-slate-600"><LogOut size={20}/></button></form></div></header><nav className="sticky bottom-0 z-10 border-t bg-white md:sticky md:top-0 md:bottom-auto"><div className="mx-auto flex max-w-5xl overflow-x-auto px-2">{links.map(([label, href]) => <Link className="whitespace-nowrap px-3 py-3 text-sm font-medium text-slate-600 hover:text-church-700" href={href} key={href}>{label}</Link>)}</div></nav></>;
}
