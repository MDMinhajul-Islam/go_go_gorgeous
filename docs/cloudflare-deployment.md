# Cloudflare deployment setup

The GitHub Actions workflow runs tests, model-asset checks, the production build, and a Docker image build on pushes and pull requests. A successful push to `main` uploads the face-parsing model to a private R2 bucket and deploys the site plus its R2-backed Pages Function. The model stays at the app's same-origin `/models/face-parsing-resnet18.onnx` URL; the bucket itself is not public.

## One-time Cloudflare setup

1. Create a Cloudflare Pages project named `go-go-gorgeous` in your account. Set its production branch to `main`. GitHub Actions performs deployments, so do not enable a second competing build pipeline for this project.
2. Create a private R2 bucket named `go-go-gorgeous-models`. Do not enable public bucket access or an `r2.dev` URL. The Pages Function reads the model through the private R2 binding in `wrangler.jsonc` and supports byte-range requests.
3. Create a Cloudflare API token scoped to this account with Cloudflare Pages edit and R2 object read/write permissions. Store it only as a GitHub Actions secret; do not commit it or put it in a Vite variable.

## GitHub repository settings

Add this Actions secret:

- `CLOUDFLARE_API_TOKEN`: the scoped token above.

Add this Actions variable:

- `CLOUDFLARE_ACCOUNT_ID`: the account ID shown in Cloudflare's Workers & Pages overview.

After the two Cloudflare resources and GitHub settings are in place, each successful push to `main` uploads the model and deploys the site. Pull requests and other branches run CI and Docker builds only. For local Docker, run `docker compose up --build` and open `http://localhost:8080`.
