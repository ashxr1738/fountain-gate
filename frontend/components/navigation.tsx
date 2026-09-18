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
      <header className="border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link href="/" className="text-lg font-bold tracking-tight text-foreground">
            Church Equipment
          </Link>
          <form action={signOut}>
            <button title="Sign out" className="rounded-lg p-2 text-muted-foreground transition hover:bg-accent hover:text-foreground">
              <LogOut size={20} />
            </button>
          </form>
        </div>
      </header>

      <nav className="sticky bottom-0 z-10 border-t border-border bg-card/95 md:sticky md:top-0 md:bottom-auto">
        <div className="mx-auto flex max-w-5xl overflow-x-auto px-2">
          {links.map(([label, href]) => (
            <Link
              className="whitespace-nowrap px-3 py-3 text-sm font-medium text-muted-foreground transition hover:text-foreground"
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
