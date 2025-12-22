## Analytics + Auth Notes (Magic Worlds Dashboard)

This document explains:

1. How the **Social Media Growth KPI** is calculated (math).
2. How to obtain a **Meta long-lived token** via token exchange, and how the app derives a **Page access token** for Facebook/Instagram API calls.
3. Other useful documentation (endpoints + env vars).

---

## 1) Social Media Growth KPI (mathematics)

### Where it is used

- The KPI displayed on `/december` in the hero (“Monthly Growth”) and the Executive Highlights “Social Media Growth” card.

### Inputs

- **Baseline (November)**: `src/utils/nov-report-data.json` → `social_media_performance.platforms[]`
- **Current (December)**: live response from `GET /api/report/december-social` (see `src/pages/api/report/december-social.ts`)

### Per-platform KPI mapping

We must compare like-for-like. Each platform contributes one primary KPI:

- **Facebook**: `views`
- **Instagram**: `reach`
- **YouTube**: `views`
- **X (Twitter)**: `followers`

### Per-platform growth %

For each platform \(i\):

- Baseline KPI: \(B_i\)
- Current KPI: \(C_i\)

\[
g_i = \max\left(0,\ \frac{C_i - B_i}{B_i} \times 100\right)
\]

Notes:

- If \(B_i \le 0\), the platform is skipped (cannot compute a meaningful percent change).
- Negative growth is clamped to 0 for the December report.

### Overall “Social Media Growth” KPI (equal-weight average)

Let \(S\) be the set of platforms that have valid \(B_i>0\).

\[
G = \frac{1}{|S|}\sum\_{i \in S} g_i
\]

**Display rounding**:

- The dashboard displays the nearest whole number:

\[
G\_{display} = \mathrm{round}(G)
\]

---

## 2) Meta long-lived token via token exchange (and Page token derivation)

Meta has different token types and lifetimes. The key idea is:

- Start with a **short-lived User Access Token**
- Exchange it for a **long-lived User Access Token**
- Use the long-lived User token to fetch **Page Access Tokens** via `/me/accounts`
- Use the Page token for Facebook Page + Instagram Business APIs

### 2.1 Token types (practical)

- **User access token**: represents a Meta user (admin). Needed to call `/me/accounts`.
- **Long-lived user token**: lasts longer than short-lived. Still expires, but reduces how often you need to re-auth.
- **Page access token**: represents a specific Facebook Page; used for Page metrics + Insights and to reach the linked Instagram Business Account.

### 2.2 Exchange short-lived → long-lived user token

Use the OAuth token exchange endpoint:

- **Endpoint**: `GET https://graph.facebook.com/v20.0/oauth/access_token`
- **Params**:
  - `grant_type=fb_exchange_token`
  - `client_id=<APP_ID>`
  - `client_secret=<APP_SECRET>`
  - `fb_exchange_token=<SHORT_LIVED_USER_TOKEN>`

The response returns a **long-lived user access token**.

### 2.3 Derive Page access token from user token

Once you have a valid **user token**:

- **Endpoint**: `GET https://graph.facebook.com/v20.0/me/accounts?access_token=<USER_TOKEN>`
- Find the Page matching your `FACEBOOK_PAGE_ID`
- Use its `access_token` as the **Page access token**.

This repo implements this in:

- `src/utils/facebookPageToken.ts` (`getFacebookPageAccessToken`) which calls `/me/accounts` and caches briefly in-memory.

### 2.4 How Instagram auth works here

Instagram Business data is accessed through the Facebook Page:

1. Get Page token (above)
2. Resolve the IG business account id from the Page:
   - `GET /{FACEBOOK_PAGE_ID}?fields=instagram_business_account&access_token=<PAGE_TOKEN>`
3. Use the IG user id for IG profile/insights endpoints (still authenticated with the Page token).

Implemented in:

- `src/pages/api/instagram/profile.ts`
- `src/pages/api/instagram/insights.ts`

---

## 3) Other useful documentation

### 3.1 “No storage” policy

- The dashboard computes December growth **at request time** using:
  - live API reads (Facebook/Instagram/YouTube/X)
  - November baseline JSON
- No DB/KV is used for historical snapshots.

### 3.2 Key API routes

#### December report aggregation

- `GET /api/report/december-social`
  - returns `{ window, generatedAt, platforms[] }`
  - `platforms[]` are shaped to match the UI’s expected platform objects.

#### Facebook

- `GET /api/facebook/page` (public page details + follower count)
- `GET /api/facebook/insights` (insights; currently configured server-side)

#### Instagram

- `GET /api/instagram/profile` (derive IG id from Page + return IG profile)
- `GET /api/instagram/insights` (IG insights)

#### YouTube

- `GET /api/youtube/channel?handle=MagicworldsTV` (channel snippet + stats)

#### X (Twitter)

- `GET /api/x/users/me` (OAuth 1.0a user-context; returns `public_metrics`)

### 3.3 Environment variables (high level)

- **Meta**:
  - `FACEBOOK_PAGE_ID`
  - `FACEBOOK_USER_ACCESS_TOKEN` (recommended: long-lived user token)
  - `FACEBOOK_PAGE_ACCESS_TOKEN` (optional; if set, used as a fallback)
  - `FACEBOOK_APP_SECRET` (app secret; not a token)
- **YouTube**:
  - `YOUTUBE_API_KEY`
- **X**:
  - `X_API_KEY`
  - `X_API_KEY_SECRET`
  - `X_ACCESS_TOKEN`
  - `X_ACCESS_TOKEN_SECRET`
