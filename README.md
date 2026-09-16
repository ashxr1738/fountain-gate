# Church Equipment

A deliberately small Next.js + Supabase app for one workflow: add equipment, request it, approve/check it out, then return it.

## Start locally

1. Create a Supabase project, then run [`supabase/migrations/202609160001_initial.sql`](supabase/migrations/202609160001_initial.sql) in its SQL Editor (or `supabase db push`).
2. In Supabase Authentication, enable email/password sign-in.
3. Copy `.env.example` to `.env.local` and add the project's URL and anon key.
4. Install and start: `npm install`, then `npm run dev`.
5. Create an account. Promote the first church administrator in the SQL Editor:

   ```sql
   update public.users set role = 'ADMIN' where email = 'admin@yourchurch.org';
   ```

Only the `ADMIN` and `DEVELOPER` roles can manage assets or decide requests. The database functions perform the request, approval, checkout, and return transitions atomically; UI role checks are not relied on for security.

QR codes encode the application's asset-code URL (for example `/assets/code/KEY-001`), so a phone camera opens that asset page directly.
