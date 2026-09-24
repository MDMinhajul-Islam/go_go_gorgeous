# Free Cloudflare Pages deployment

The GitHub Actions workflow runs tests, verifies model assets, builds the production site, and builds a Docker image on pushes and pull requests. A successful push to `main` deploys the site to Cloudflare Pages. No custom domain is required: Cloudflare provides the free `go-go-gorgeous.pages.dev` address.

This setup uses Cloudflare Pages and its Pages Function only. It does not create an R2 bucket, enable a paid plan, or require a billing method. The large face-parsing ONNX model is kept in this public GitHub repository and served at the app's same-origin `/models/face-parsing-resnet18.onnx` endpoint by a narrowly scoped Pages Function proxy. The build removes the model from `dist` so it does not exceed Pages' per-file asset limit. Only the model file is fetched by the proxy; camera frames and user photos are processed in the browser and are not sent to GitHub by this function.

## One-time setup

1. In Cloudflare, create an API token for this account with **Cloudflare Pages: Edit** permission only. Do not select R2 permissions or activate any paid subscription.
2. In the GitHub repository settings, open **Secrets and variables → Actions** and add this repository secret:
   - `CLOUDFLARE_API_TOKEN`: the Pages-only API token.
3. Add this repository Actions variable:
   - `CLOUDFLARE_ACCOUNT_ID`: the account ID shown in Cloudflare's Workers & Pages overview.
4. Push to `main`. If either setting is missing, CI succeeds and the deploy job reports a notice and skips deployment. Once both are configured, the next successful push to `main` deploys the project; Wrangler creates the Pages project on first deployment. The production site is available at `https://go-go-gorgeous.pages.dev`.

Pull requests and other branches run CI and the Docker image build but do not deploy. The model proxy points to this repository's `main` branch; its browser cache lifetime is one hour. For local Docker, run `docker compose up --build` and open `http://localhost:8080`.

The try-on model and camera flow are client-side. Use HTTPS (the Pages URL does) and make sure the browser grants camera permission. The face-parsing model is served from this repository, so that public GitHub source must remain available for the endpoint to work.
