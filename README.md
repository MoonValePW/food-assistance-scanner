# Standalone scanner page

A live QR viewfinder for the Food Assistance Dashboard.

## Why this exists

Apps Script renders a web app's HTML inside a **cross-origin iframe that Google
controls**. That iframe is not granted camera permission, so `getUserMedia()`
fails with `NotAllowedError` — confirmed on iOS Safari by the app's own camera
check:

```
Secure context        yes
Running inside a frame yes
Scanner library       loaded
Camera access         DENIED - NotAllowedError
```

Permission belongs to the parent frame. **No code inside an Apps Script project
can change it.**

This page is served from ordinary static hosting, so it is the top-level
document and grants its own camera permission. It scans continuously, then hands
the token to the Apps Script app, which does the actual check-in.

## What it does and does not do

**Does:** open the camera, decode a card, navigate to the check-in URL.

**Does not:** authenticate, look up families, or record anything. All of that
still happens in Apps Script, behind the same sign-in and the same
duplicate-pickup protection.

That is deliberate. This file has **no secrets** and needs no sign-in, so it is
safe on public hosting. The scanned token only ever travels in a client-side
navigation to Google — the static host never sees it.

## Setup

**1. Set your check-in URL.** In `index.html`, near the top of the script:

```js
var CHECKIN_URL = 'https://script.google.com/macros/s/YOUR_ID/exec';
```

**2. Host the folder.** Both files must sit together, and it **must be HTTPS** —
browsers refuse camera access otherwise.

GitHub Pages, free, no server:

```bash
gh auth login
gh repo create food-assistance-scanner --public --source=scanner --remote=origin --push
gh api -X POST repos/:owner/food-assistance-scanner/pages -f source[branch]=main -f source[path]=/
```

Your page appears at `https://<user>.github.io/food-assistance-scanner/` within a
minute or two. Netlify, Cloudflare Pages and Vercel all work the same way — drop
the folder in.

The repo must be **public** for GitHub Pages on a free account. That is fine:
this page contains no secrets and no family data.

**3. Point the app at it.** In `apps-script/Config.gs`:

```js
EXTERNAL_SCANNER_URL: 'https://<user>.github.io/food-assistance-scanner/',
```

then `cd apps-script && ./deploy.sh "enable external scanner"`.

That closes the loop. "Scan next family" on the confirmation screen returns
here, so staff bounce between a live viewfinder and the confirm screen without
ever touching the blocked camera.

## The flow

```
scanner page          camera live, decodes card
      |
      |  navigates to /exec?t=<token>
      v
Apps Script app       signs staff in, shows FAMILY FOUND, records the pickup
      |
      |  "Scan next family"
      v
scanner page          camera live again
```

## Features

Hardware decoding where the phone offers it, 1920×1080 with continuous focus, a
90% scan box, a torch toggle for evening distributions, and a camera picker —
multi-lens phones often default to an ultra-wide, which physically cannot focus
on a card held close and looks exactly like a broken scanner.

Accepts both card formats: a full check-in URL carrying `?t=`, and a bare token.
Both have been printed at different times and both must keep working.

## If the camera still fails here

Then it is the device or the browser, not the iframe, and the page says so.
Check `Settings → Safari → Camera`, and make sure the page is opened in Safari
itself rather than an in-app browser — in-app browsers frequently refuse camera
access regardless of site permissions.

Failing that, the app's own **"Use phone camera instead"** button takes a single
photo through the system camera app and works everywhere.
