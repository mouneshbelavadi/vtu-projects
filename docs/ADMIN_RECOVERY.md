# Admin Multi-Factor Authentication Recovery Guide

This document explains how to recover or reset administrator multi-factor authentication (TOTP) in VTU Adda Project Hub.

## 1. Preventive Measure: Store the Setup Secret

When enrolling your TOTP authenticator at `/admin/mfa`:
1. The screen displays both a QR code and a base32 text setup key (secret).
2. Copy this text key and save it as a secure note in your password manager (for example 1Password, Bitwarden, or KeePass).
3. If you lose your phone or switch devices, you can enter this secret key into any authenticator app to restore your code generator immediately without dashboard access.

## 2. Emergency Reset via Supabase Dashboard

If your authenticator device is lost and you do not have the backup secret key:

1. Open your browser and sign in to the Supabase Dashboard:
   `https://supabase.com/dashboard`
2. Select your project (`vtuadda-projects-dev` or production).
3. In the left navigation menu, navigate to **Authentication**, then select **Users**.
4. Locate the administrator email address in the user list and click to open user details.
5. In the user summary panel, scroll down to the **Multi-Factor Authentication** or **Factors** section.
6. Locate the enrolled TOTP factor and click **Delete factor** (or **Unlink**).
7. Confirm the deletion.
8. The next time you sign in with your email at `projects.vtuadda.com/login` and visit `/admin`, the application will redirect you to `/admin/mfa` to enrol a fresh TOTP authenticator factor.

## 3. Emergency Promotion via SQL Editor

If an administrator account is locked out and another administrator needs to be designated:

1. In Supabase Dashboard, open the **SQL Editor**.
2. Run the following statement, replacing the example email with the verified user email:

```sql
insert into public.user_roles (user_id, role)
select id, 'admin' from auth.users where email = 'admin@example.com'
on conflict (user_id, role) do nothing;
```

3. The newly promoted user must complete email sign-in and enrol a TOTP factor at `/admin/mfa`.
