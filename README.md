# Stole Studio

A Next.js JavaScript project for custom graduation stoles. Guests design without an account, add text, symbols or a logo, preview the result, and send a request. Authorized team members review the design in an admin workspace and update the order status. The request flow does not charge the customer; your team confirms the quote, production and delivery directly.

## What is included

- Editorial landing page with an interactive, rotatable Three.js stole presentation.
- Responsive editor with a real-time 3D inspection view and a flat placement view. Both reflect fabric/trim colors, the three finishes, text, symbols and uploaded logos. The flat view supports drag positioning and the design is saved locally as a draft.
- Guest request form with one required contact method (email or phone), quantity, date, notes, and preview image.
- Supabase `orders` table for contact details, design JSON, preview URL and status. Public access is disabled by RLS; server routes use the service role.
- Sanity image assets for customer logos and submitted design previews.
- Admin login using Supabase Auth email/password, restricted further by `ADMIN_EMAILS` on every admin API request.
- Optional Gmail SMTP notification after an order is stored. Failed mail is recorded as `notification_status = failed`; the order stays available to the admin.

## Setup

1. Run `npm install` and copy `.env.example` to `.env.local`.
2. Create a Supabase project. Run `supabase/schema.sql` in its SQL Editor. Copy the project URL, anon/publishable key, and service role key into `.env.local`. Keep the service role key secret.
3. In Supabase Authentication, create team users with email and password. Set `ADMIN_EMAILS` to the exact comma-separated emails that may use the admin area. Do not put this setting or the service role key in a `NEXT_PUBLIC_` variable. Disable public signups in Supabase Auth if your project is used only for team accounts.
4. Create a Sanity project and dataset (for example, `production`). Create a token with permission to create image assets and set `SANITY_PROJECT_ID`, `SANITY_DATASET`, and `SANITY_API_TOKEN`. Sanity hosts the images, while Supabase stores URLs and design data.
5. For mail notifications, set `GMAIL_USER`, `GMAIL_APP_PASSWORD` and `ORDER_NOTIFICATION_EMAIL`. The Gmail account must have 2-Step Verification enabled and an App Password available. Use a dedicated mailbox. If Google does not offer an App Password for your account, use a transactional mail provider by replacing the transporter in `app/api/orders/route.js`. Do not use your normal Google password.
6. Run `npm run dev`, then open `http://localhost:3000`. The editor is at `/design`; the team workspace is at `/admin`.
7. Deploy on a Node.js capable Next.js host with all server environment variables. Serve over HTTPS. Set the same values in the host's environment dashboard, then run `npm run build`.

## Order lifecycle

`new → reviewing → quoted → in production → ready → delivered` (or `cancelled`). These values and any team notes can be edited in the admin drawer. Customer contact details appear only on admin endpoints after token verification and allowlist checks.

## Production considerations

- No live Supabase, Sanity or Gmail credentials are included. A real order can only be sent once these services are configured.
- Public guest image uploads are limited to PNG/JPEG under 2 MB, but a public endpoint needs stronger abuse protection before a large campaign. Add an edge rate limit and CAPTCHA verification (for example, Turnstile) to `/api/assets` and `/api/orders` for production traffic.
- Image uploads happen before order submission. An abandoned design may leave an unused Sanity asset. Add periodic asset cleanup if volume becomes high.
- This editor provides a front view and a design request, not embroidery production files, checkout, payment, price calculation, or courier booking. Staff must verify artwork permissions, feasibility, quantities, price and delivery dates with the customer.
- The browser can create a preview PNG with `html-to-image`. Check preview capture in the browsers you support, especially when using uploaded logos. The design JSON remains editable data in Supabase.
- Three.js, React Three Fiber and Drei render a procedural draped stole with canvas textures. This is a visual preview, not an embroidery or fabric engineering simulation. The order PNG is captured from the flat view for a reliable, legible reference. Devices without WebGL can use the flat view.

## Commands

`npm run dev` · `npm run build` · `npm run start` · `npm run lint`
