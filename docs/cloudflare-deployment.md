# Cloudflare deployment setup

The GitHub Actions workflow runs tests, checks model assets, builds the site, and builds the Docker image on every push and pull request. A push to `main` deploys to Cloudflare Pages once the account settings below are present.

## One-time Cloudflare setup

1. Create a Cloudflare Pages project for this repository named `go-go-gorgeous` (or choose another name and use that exact name as the GitHub variable below). Set its production branch to `main`. The GitHub Actions workflow performs deployments, so do not enable a second competing build pipeline for the same project.
2. Create an R2 bucket for the face model. Enable public reads using an R2 custom domain, for example `assets.example.com`. Use a domain in your Cloudflare account; do not use the rate-limited `r2.dev` development URL for production.
3. In the R2 bucket CORS settings, allow `GET` and `HEAD` from the Pages production URL and your site's custom domain. Allow the `Range` request header so the model can be fetched efficiently.
4. Create a Cloudflare API token scoped to this account with Pages edit and R2 object read/write permissions. Store it only as a GitHub Actions secret; do not commit it or put it in a Vite variable.

## GitHub repository settings

Add this Actions secret:

- `CLOUDFLARE_API_TOKEN`: the scoped token above.

Add these Actions variables:

- `CLOUDFLARE_ACCOUNT_ID`: the Cloudflare account ID.
- `CLOUDFLARE_PAGES_PROJECT`: Pages project name.
- `CLOUDFLARE_R2_BUCKET`: R2 bucket name.
- `FACE_PARSER_PUBLIC_URL`: the HTTPS origin mapped to the R2 bucket, with no trailing slash (for example `https://assets.example.com`).

After those are saved, each successful push to `main` uploads the versioned model to R2 and deploys the rest of the site to Pages. Pull requests and other branches run CI and Docker builds only. For local Docker, run `docker compose up --build` and open `http://localhost:8080`.
