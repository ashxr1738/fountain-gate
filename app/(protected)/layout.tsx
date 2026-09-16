import { Navigation } from "@/components/navigation";
import { requireProfile } from "@/lib/auth";
export default async function ProtectedLayout({ children }: { children: React.ReactNode }) { const profile = await requireProfile(); return <><Navigation profile={profile}/><main className="mx-auto max-w-5xl p-4 pb-24 md:pb-8">{children}</main></>; }
