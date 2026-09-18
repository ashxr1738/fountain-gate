import Link from "next/link";
import { LogOut } from "lucide-react";
import { isAdmin } from "@/lib/auth";
import type { Profile } from "@/lib/types";
import { signOut } from "@/app/actions";

export function Navigation({ profile }: { profile: Profile }) {
  const links = isAdmin(profile)
    ? [["Home", "/"], ["Assets", "/assets"], ["Requests", "/requests"], ["Manage Assets", "/assets/new"]]
    : [["Home", "/"], ["Assets", "/assets"], ["My Requests", "/my-requests"], ["My Equipment", "/my-equipment"]];

  return (
    <>
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link href="/" className="text-lg font-bold tracking-tight text-slate-900">
            Church Equipment
          </Link>
          <form action={signOut}>
            <button
              title="Sign out"
              className="rounded-xl border border-slate-200 bg-slate-50 p-2 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            >
              <LogOut size={18} />
            </button>
          </form>
        </div>
      </header>

      <nav className="sticky bottom-0 z-10 border-t border-slate-200 bg-white/90 md:sticky md:top-0 md:bottom-auto">
        <div className="mx-auto flex max-w-5xl items-center gap-2 overflow-x-auto px-2 py-2">
          {links.map(([label, href]) => (
            <Link
              className="whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
              href={href}
              key={href}
            >
              {label}
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
