# CompStudy

This is a Next.js project for CompStudy, a competitive studying platform.

## Setup

1.  **Install Dependencies:**
    `ash
    npm install
    ``n
2.  **Environment Variables:**
    Create a \.env.local\ file in the root directory and add your Appwrite credentials:
    `env
    NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
    NEXT_PUBLIC_APPWRITE_PROJECT_ID=your_project_id
    ``n
3.  **Run Development Server:**
    `ash
    npm run dev
    ``n
## Cloudflare Durable Objects (Real-time)

The real-time functionality is powered by Cloudflare Durable Objects. The worker code is located in the \worker\ directory.

1.  **Setup Worker:**
    `ash
    cd worker
    npm install
    ``n
2.  **Run Worker Locally:**
    `ash
    cd worker
    npx wrangler dev
    ``n
3.  **Deploy Worker:**
    `ash
    cd worker
    npx wrangler deploy
    ``n
## Project Structure

-   \src/app\: Next.js App Router pages and layout.
-   \src/lib/appwrite.ts\: Appwrite client configuration.
-   \worker\: Cloudflare Worker project for Durable Objects.
