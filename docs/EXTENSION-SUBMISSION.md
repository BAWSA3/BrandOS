# BrandOS for Chrome — Web Store submission

The extension scores a draft inside X's composer against the member's own brand
and history (same engine as "Score this draft" on the dashboard). Built in
`chrome-extension/`; this is everything needed to put it on the Chrome Web Store.

**Aim to submit by Sun 1 Nov.** Review usually takes a few days, and longer for
a first submission or for host permissions on a big site like x.com. Until it's
approved, members score drafts on the dashboard (idea board + copywriter).

> The extension only works against **prod** (`https://mybrandos.app`). The
> endpoints it calls (`/api/extension/token`, `/api/extension/score`,
> `/extension-auth`) ship with PRs #238 and this one; promote them before
> anyone installs it.

---

## 1. One-time setup (Bawsa)

1. Go to https://chrome.google.com/webstore/devconsole and sign in with the
   Google account that should own BrandOS's listing.
2. Pay the one-time **$5** developer registration fee and verify the email.
3. (Recommended) Set the publisher name to **BrandOS** and verify
   `mybrandos.app` (Account → Verified domains) so the listing shows it.

## 2. Build the zip

```bash
npm run ext:zip
```

Output: `extension-build/brandos-chrome-2.0.0.zip` (test fixtures left out).

## 3. New item → upload the zip, then fill in

**Store listing**

- **Name:** BrandOS: score your post before you send it
- **Summary (≤132 chars):** Scores your draft in X's composer against your own brand and history, with the fixes that would make it land.
- **Category:** Social & Communication
- **Language:** English
- **Description:**

  > Write on X, get your BrandOS score before you post.
  >
  > A small chip sits next to X's Post button. Pause while writing and BrandOS
  > reads the draft against your brand and your own last 40 posts:
  >
  > • a score out of 100 and a verdict: ready to post, close, or needs work
  > • the likely reach, as a multiple of your usual views
  > • the 2–3 fixes that would make it land, measured from your own numbers
  >   where it can ("your posts with media engage 1.9× your text-only posts",
  >   "your audience engages most around 9pm")
  >
  > It suggests; it never rewrites your post, and it never posts for you.
  >
  > Needs a BrandOS account (mybrandos.app). Draft scoring is part of BrandOS Pro.
  >
  > Privacy: only the draft's text (and whether media is attached) is sent, and
  > only when you pause or click. Never your feed, messages or other sites.

- **Icon:** `chrome-extension/icons/icon128.png`
- **Screenshots (640×400):** `docs/extension-store/screenshot-1-chip.png`,
  `docs/extension-store/screenshot-2-fixes.png`
- **Small promo tile (440×280):** `docs/extension-store/promo-small-440x280.png`
- **Website:** https://mybrandos.app

**Privacy practices tab**

- **Single purpose:** Score the post the user is writing on X against their
  BrandOS brand, before they post it.
- **Permission justifications:**
  - `storage`: keeps the user's BrandOS sign-in token (scoped to draft
    scoring, 30-day expiry), their X handle and the "score as I type" setting.
  - Host `https://x.com/*`: shows the BrandOS chip inside X's post composer and
    reads the draft text there.
  - Host `https://mybrandos.app/*`: sends the draft to BrandOS for scoring and
    receives the sign-in token from mybrandos.app/extension-auth.
- **Remote code:** No, I am not using remote code.
- **Data usage:** tick **Website content** (the draft text) and
  **Authentication information** (the sign-in token). Certify: not sold, not
  used for unrelated purposes, not used for creditworthiness.
- **Privacy policy URL:** https://mybrandos.app/privacy#chrome

**Distribution:** Public, all regions (or Unlisted for the tester week, then
Public on Nov 2).

Submit for review.

## 4. After approval (connect the published id)

The Web Store gives the item a fixed id (32 letters). Then:

1. Vercel → **brandos** (prod) → Environment Variables:
   - `NEXT_PUBLIC_EXTENSION_ID` = the id (the connect page sends the token
     straight to the extension)
   - `BRANDOS_CHROME_EXTENSION_ID` = the same id (the API only answers this
     extension's origin)
   - optional `EXTENSION_TOKEN_SECRET` = 32+ random characters (otherwise
     derived from `SUPABASE_SECRET_KEY`; rotating it signs every extension out)
2. Redeploy.
3. Install from the store, click the B → **Connect BrandOS** → sign in →
   "Connected." → write a draft on x.com → the chip scores it.

## Updating later

Bump `version` in `chrome-extension/manifest.json`, `npm run ext:zip`, upload
in the dev console (Package → Upload new package), submit.

## Notes

- **Unpacked (development):** chrome://extensions → Developer mode → Load
  unpacked → `chrome-extension/`. Without `NEXT_PUBLIC_EXTENSION_ID` the
  connect page hands the token over through the page (connector script).
- **X's markup changes:** the chip finds X's composer by `data-testid`
  (`tweetTextarea_N`, `toolBar`, `tweetButtonInline` / `tweetButton`,
  `attachments`). If X renames them, update `chrome-extension/content/core.js`
  and the fixture (`chrome-extension/test/fixture.html?test`).
