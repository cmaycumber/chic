# Better Auth Polar Plugin Implementation Plan

## Goal
Implement the Better Auth Polar plugin using Convex local install to enable payments and checkouts.

## Steps

1.  **Install Dependencies**:
    *   Add `@polar-sh/better-auth` and `@polar-sh/sdk` to `apps/backend`.

2.  **Configure Backend Auth**:
    *   Update `apps/backend/convex/auth.ts` to import and use the `polar` plugin.
    *   Configure Polar client with access token and server (sandbox/production).
    *   Configure Polar plugin options:
        *   `client`: Polar SDK instance.
        *   `createCustomerOnSignUp`: true.
        *   `use`: [checkout, portal, usage, webhooks].
        *   Configure `checkout` with products/success URL.
        *   Configure `webhooks` with secret.

3.  **Schema Update**:
    *   The Polar plugin likely adds tables/fields. Since we are using Convex local install for Better Auth, we need to ensure the schema is updated.
    *   We will rely on `better-auth` schema generation or manual updates if required.

4.  **Frontend Integration**:
    *   Update `apps/web` to use the Polar plugin in `authClient`.
    *   Create a pricing page in `apps/web` that lists products and initiates checkout.

5.  **Products**:
    *   Define products in Polar (or mock them if using sandbox).
    *   Use "meter credits" type for pre-purchase credits.

## Environment Variables
Required env vars:
*   `POLAR_ACCESS_TOKEN`
*   `POLAR_WEBHOOK_SECRET`

