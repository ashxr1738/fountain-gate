import { AssetForm } from "@/components/asset-form";
import { isAdmin, requireProfile } from "@/lib/auth";
import { redirect } from "next/navigation";
export default async function NewAssetPage() { if (!isAdmin(await requireProfile())) redirect("/"); return <div><h1 className="mb-1 text-3xl font-bold">Add Asset</h1><p className="mb-5 text-slate-600">A QR code is created from its asset code.</p><AssetForm/></div>; }
