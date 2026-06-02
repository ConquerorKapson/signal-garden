# ngrok Setup Guide

ngrok exposes your local dev server to the internet via a secure tunnel. This is essential for:
- Clerk webhooks (Clerk needs to POST to your server)
- Testing OAuth callbacks
- Sharing your local app with others temporarily

## Installation

### Windows (via Chocolatey)
```powershell
choco install ngrok
```

### Or download directly
1. Go to https://ngrok.com/download
2. Download and unzip
3. Add to PATH

## Setup

1. Create free account at https://ngrok.com
2. Get your auth token from dashboard
3. Configure:

```bash
ngrok config add-authtoken YOUR_TOKEN
```

## Usage

### Expose your local Next.js app
```bash
# Start your app first
npm run dev

# In another terminal
ngrok http 3000
```

ngrok gives you a URL like: `https://abc123.ngrok-free.app`

## Connecting to Clerk Webhooks

1. Start ngrok: `ngrok http 3000`
2. Copy the HTTPS URL
3. Go to Clerk Dashboard → Webhooks → Add Endpoint
4. URL: `https://abc123.ngrok-free.app/api/webhooks/clerk`
5. Select events: `user.created`, `user.updated`, `user.deleted`
6. Copy the signing secret → put in `.env.local` as `CLERK_WEBHOOK_SECRET`

## Testing the Webhook

1. In Clerk Dashboard → Webhooks → your endpoint → Testing
2. Send a test event
3. Check your terminal for the log output
4. Verify in ngrok web interface: http://localhost:4040

## Important Notes

- ngrok URL changes every time you restart (free tier)
- Update Clerk webhook URL each time you restart ngrok
- ngrok is for **development only** — never use in production
- The free tier has rate limits; sufficient for dev testing

## Debugging

ngrok has a built-in web inspector at http://localhost:4040
- See all requests/responses
- Replay failed requests
- Inspect headers and body
