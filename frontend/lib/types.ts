export type Role = "ADMIN" | "USER" | "DEVELOPER";
export type AssetStatus = "AVAILABLE" | "REQUESTED" | "CHECKED_OUT";
export type RequestStatus = "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED";
export type Profile = { id: string; name: string; email: string; role: Role };
export type Asset = { id: string; name: string; asset_code: string; category: string | null; description: string | null; status: AssetStatus; created_at: string };
export type EquipmentRequest = { id: string; asset_id: string; user_id: string; purpose: string; requested_from: string; requested_until: string; status: RequestStatus; created_at: string; approved_at: string | null; approved_by: string | null; pickup_verified_at: string | null; rejection_reason: string | null; asset?: Asset; requester?: Pick<Profile, "name" | "email"> };
