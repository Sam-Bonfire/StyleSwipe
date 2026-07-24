# Setting Up Preview Environments in GitHub Actions

Because you maintain separate `staging` and `prod` environments, you want to ensure your Pull Request preview environments are completely isolated. The `pr-preview.yml` workflow creates ephemeral databases in Convex and ephemeral URLs in Cloudflare Pages.

To make this work securely, you must configure the following Secrets in your GitHub repository settings (`Settings` -> `Secrets and variables` -> `Actions`).

## 1. Convex Deploy Key (`CONVEX_DEPLOY_KEY`)
You need a deploy key so the GitHub Action can provision the ephemeral preview environment.

1. Go to the [Convex Dashboard](https://dashboard.convex.dev/).
2. Select your project.
3. Navigate to **Settings** -> **API Keys**.
4. Generate a new Deploy Key.
   *(Note: Ensure it is a Deploy Key. Convex uses Deploy Keys to create preview deployments dynamically when `--preview-create` or `--url-only` flags are used in CI).*
5. In GitHub, add a Repository Secret named `CONVEX_DEPLOY_KEY` and paste the value.

## 2. Better Auth Configuration (`BETTER_AUTH_SECRET`)
Better Auth requires a secret string to sign session tokens securely.

1. Generate a strong random string (e.g., `openssl rand -base64 32`).
2. In GitHub, add a Repository Secret named `BETTER_AUTH_SECRET` and paste the value.
   *(The workflow will automatically inject this into the ephemeral Convex environment alongside the dynamic `BETTER_AUTH_URL`).*

## 3. Cloudflare Pages Configuration
To deploy the web build to Cloudflare Pages as a preview branch, you need API credentials.

1. **CLOUDFLARE_ACCOUNT_ID**:
   - Go to your Cloudflare Dashboard.
   - Look at the URL: `https://dash.cloudflare.com/<your-account-id>`.
   - In GitHub, add a Repository Secret named `CLOUDFLARE_ACCOUNT_ID` and paste the value.
2. **CLOUDFLARE_API_TOKEN**:
   - Go to Cloudflare Profile -> API Tokens.
   - Create a Custom Token with the permissions: `Account: Cloudflare Pages: Edit`.
   - In GitHub, add a Repository Secret named `CLOUDFLARE_API_TOKEN` and paste the value.

## Environment Separation (Staging vs. Prod)
Because the `pr-preview.yml` triggers on `pull_request` events, it uses the secrets defined at the **Repository** level.

If you use GitHub Environments (e.g., a "Staging" environment and a "Production" environment) for your `main` or `dev` branch deployments, ensure that:
1. `CONVEX_DEPLOY_KEY` for Production is strictly saved inside the **Production Environment Secrets**.
2. `CONVEX_DEPLOY_KEY` for Staging is saved inside the **Staging Environment Secrets**.
3. The keys for Preview Deployments (described above) are saved as **Repository Secrets**.

This guarantees that a PR workflow can never accidentally overwrite your Staging or Production databases.