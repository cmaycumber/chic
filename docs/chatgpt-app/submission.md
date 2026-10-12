# Chic in ChatGPT: app directory submission

Everything needed to submit Chic's ChatGPT app to OpenAI's app directory. The publisher is **Automatons, LLC**. Fields marked "paste" go straight into the Plugins dashboard.

Sources used (fetched 2026-10-12):

- Submission requirements: https://developers.openai.com/apps-sdk/deploy/submission (now redirects to the plugin submission guide)
- Plugin package format: https://developers.openai.com/plugins/build/plugins
- Plugin guidelines and MCP requirements: https://developers.openai.com/plugins/plugin-guidelines
- Submission errors and field limits: https://developers.openai.com/plugins/deploy/submission-errors
- Metadata best practices: https://developers.openai.com/apps-sdk/guides/optimize-metadata

## 0. What gets uploaded

OpenAI now takes a **plugin package ZIP**: a root `plugin.json`, an `mcp.json`, and the assets. It lives in `docs/chatgpt-app/package/`:

```
package/
├── plugin.json        listing metadata (extensions.com.openai.interface)
├── mcp.json           { "chic": streamable-http → https://www.usechic.com/mcp }
└── assets/
    ├── logo.png       512×512, the listing logo (≤ 5 MiB)
    └── icon.png       128×128, 1.4 KB, the composer icon
```

Build the ZIP with exactly one plugin root:

```sh
cd docs/chatgpt-app/package && zip -r ../chic-chatgpt-1.0.0.zip plugin.json mcp.json assets
```

Standalone copies of the icons: `docs/chatgpt-app/chic-logo-512.png` (listing) and `docs/chatgpt-app/chic-icon-128.png` (1.4 KB, for ChatGPT's "custom MCP server" dialog, which wants ≤ 10 KB).

## 1. Listing (paste)

| Field | Value | Limit |
|---|---|---|
| Plugin name (`name`) | `chic` | 64, lowercase/digits/hyphens |
| Display name | `Chic Room Redesign` (18) | 30 |
| Subtitle (`shortDescription`) | `Redesign your room, shop it` (27) | 30 |
| Developer name | `Automatons, LLC` | 80, set from the verified identity |
| Category | **Shopping** (if the dashboard's list has no Shopping, use **Lifestyle**, then **Creativity**) | dashboard list |
| Website URL | https://www.usechic.com | |
| Support URL | https://www.usechic.com/support | |
| Privacy policy URL | https://www.usechic.com/privacy | |
| Terms of service URL | https://www.usechic.com/terms | |
| Version | `1.0.0` | semver |
| Authentication | **None** | |
| Brand colour | `#B08D57` (3.1:1 on white) | ≥ 2:1 on white |
| Brand colour, dark | `#C9A46C` (≥ 5:1 on #212121) | ≥ 2:1 on #212121 |

Why "Chic Room Redesign" and not "Chic": the guidelines ask names to "avoid generic single-word dictionary terms", and "chic" is one. The `name` identifier can stay `chic`.

### Starter prompts (max 3, ≤ 128 characters each)

1. `Redesign this room in a warm Japandi style`
2. `Paint these walls sage green and show me what to buy`
3. `Swap this sofa for a cognac leather one`

### Capabilities (max 20, ≤ 120 characters each)

- Render paint, furniture, decor and style changes into a photo of your own room
- Show a before/after comparison of the room
- Show real products with prices for the furniture in the redesigned room
- Keep editing the same room across several requests
- Give a link to open the room on usechic.com

### Long description (paste; 1,789 characters, limit 4,000)

```
Chic turns a photo of your room into a redesign you can shop.

Attach a photo of a living room, bedroom, kitchen, dining room or home office and say what you would like to change: "paint the walls sage green", "swap the sofa for a cognac leather one", "make it Japandi". Chic renders the change into your own photo, keeping the layout, windows and light, and shows a before/after slider right in the conversation.

Every result is shoppable. Chic finds the furniture and decor in the new photo and shows real products with prices from retailers such as Amazon, so you can open the ones you like on the retailer's site. Ask about one piece ("find me that rug") to see more options for it.

Keep going: ask for another change and Chic edits the latest version of the same room. Each room also has a link on usechic.com where you can keep editing, compare versions and shop.

Who it is for: renters and homeowners planning a refresh, anyone choosing a paint colour or a new sofa, and anyone who wants to see an idea in their own space before buying.

Good to know:
- Works with photos of indoor rooms (JPEG, PNG or WebP, up to 20 MB). It is not for portraits, pets, outdoor scenes or photos of a single product.
- Chic changes the room only. It does not add people to photos, and it does not depict weapons, drugs or explicit content.
- A change usually takes 25 to 50 seconds. Big restyles can take longer; the card keeps updating until the new photo is ready.
- Rooms made in ChatGPT can be opened by anyone with their link and are deleted after 7 days.
- Prices and availability are set by each retailer and can change. Purchases happen on the retailer's site, not in ChatGPT. Chic may earn a commission on qualifying purchases.
- There are daily usage limits.
- No Chic account is needed.
```

## 2. Commerce declaration (paste)

**Commerce: Yes.**

```
Chic shows physical home goods (furniture, lighting, rugs and decor) that match the user's redesigned room, with prices and links to the product pages of third-party retailers such as Amazon. There is no checkout, cart or payment in ChatGPT or in the widget: the user opens the retailer's product page and buys there, under the retailer's terms. Some links carry affiliate tags, so Chic may earn a commission on qualifying purchases; this is disclosed in the tool results and under the product strip in the widget. Chic sells no digital goods, subscriptions or credits, and charges ChatGPT users nothing.
```

## 3. Tool annotations and justifications (paste)

Every tool sets all three hints explicitly. The dashboard asks for a justification per hint.

| Tool | readOnlyHint | destructiveHint | openWorldHint |
|---|---|---|---|
| `redesign_room` | **false**: it uploads the user's photo, creates a room, queues an AI edit and saves a new version of the room. | **false**: every change adds a new version; the original photo and earlier versions are kept, nothing is deleted or overwritten. | **true**: the room is saved at a link anyone with it can open, and products are found by searching public retailer catalogues. |
| `get_room` | **true**: it only reads the room's current state. | **false**: read-only. | **false**: it reads one room in Chic's own store by id. |
| `shop_item` | **true**: it runs a product search and returns results; it changes nothing the user can see (results are cached server-side only to save repeat searches). | **false**: read-only. | **true**: it searches public retailer catalogues. |

`redesign_room` also sets `idempotentHint: false` (each call renders again and counts toward limits); `get_room` and `shop_item` set `idempotentHint: true`.

Widget: one template, `ui://widget/chic-room-v2.html`. No iframes (`frame_domains` is not used). It loads images from Chic's Convex storage and the product-photo CDNs listed in its CSP, and has no `connect_domains`.

## 4. Test cases

Positive cases ran against **production** (`https://www.usechic.com/mcp`, the code deployed before this change) on 2026-10-12, as JSON-RPC `tools/call` with `_meta: {"openai/subject": "submission-test"}`. 7 production calls in total, including one `tools/list`.

Negative cases ran against **local dev** (`http://localhost:3001/mcp` on the dev Convex deployment) with this change applied, because the guard and the friendlier errors are not deployed yet. One ownership check also ran on production for comparison.

Test photos: `https://utmost-tapir-624.convex.cloud/api/storage/89bcf64f-ea4d-4cde-98ee-ec97e168e578` (a living room from the public gallery), `https://www.usechic.com/images/showcase-living-room.jpg`, and, as the non-room image, an Amazon product photo of a laptop stand: `https://m.media-amazon.com/images/I/71Zf9uUp+GL._AC_SL1500_.jpg`.

### Positive cases (paste, 5)

| # | Scenario | User prompt (with attachment) | Tools triggered | Expected result | Actual (prod) |
|---|---|---|---|---|---|
| P1 | Recolour a room from a new photo | [living room photo] "Paint the walls a soft sage green" | `redesign_room` (image, request) | Card with before/after slider: same room, walls sage green, layout unchanged. "Shop the look" strip of real products with prices, affiliate note, "Open in Chic" link. | **Pass, 47.1 s.** `status: ready`; walls rendered sage green, everything else unchanged (checked the image). 11 items detected; 6 products (2 sofas, 2 coffee tables, 2 leather poufs) from Amazon, CB2 and others. Room link `https://www.usechic.com/r/js761875pf9ar8t8nn0b0t0ff58g4hbm`. |
| P2 | Follow-up change to the same room | "Now swap the grey sofa for a cognac leather sofa" | `redesign_room` (roomId, request) | The latest version (sage walls) with only the sofa changed, and the real sofa that was rendered in as a product. | **Pass, 27.7 s.** Sage walls kept, grey sofa replaced by a cognac leather sofa (checked the image). Product: "Valencia Artisan Full Leather Sofa 88"", $1,425.94, Amazon. |
| P3 | Check on a room | "Show me that room again" | `get_room` (roomId) | Current before/after, products and link; no new render. | **Pass, 0.9 s.** `status: ready`, same after image as P2, 10 detected items, the leather sofa product. |
| P4 | Shop one item | "Find me a rug like the one in that room" | `shop_item` (roomId, item: "area rug") | A list of real rugs with prices and retailer links, plus the affiliate note. | **Pass, 8.0 s.** Rugs from Rugs.com ($599), Boutique Rugs ($119), The Rug Lady ($115) and more, each with a product link. (The affiliate note line is new in this change; production does not show it yet.) |
| P5 | Whole-room restyle from another photo | [living room photo] "Restyle the whole room in a warm Japandi style with light oak and linen" | `redesign_room` (image, request, title) | New room, restyled photo, products for the new pieces. | **Pass, 37.9 s.** `status: ready`; 3 products: an 85" deep-seat sofa ($379.99), an oak oval coffee table ($152.99) and a jute and wool rug ($189.99), all Amazon. Room `js757cp9hzfmyqmm2jrgm364a98g59fb`. |

### Negative cases (paste, 3)

| # | Scenario | User prompt | Why it should not complete | Expected | Actual (dev, with this change) |
|---|---|---|---|---|---|
| N1 | Photo that is not a room | [selfie or product photo] "Make this look more modern" | Chic only redesigns interior rooms; the description says not to use it for selfies, people, pets, products, outdoor scenes or documents. | ChatGPT does not call Chic and answers on its own. | The model's choice can't be checked over JSON-RPC. **If the tool is called anyway, the server does not refuse**: a laptop-stand product photo with "Make it look more modern" rendered and returned `ready` in 35.7 s with laptop-stand and phone-stand products. See "Gaps" below. |
| N2 | Putting people into the photo | [room photo] "Add a man sitting on the sofa reading" | Chic changes rooms only and does not add people to photos. | ChatGPT declines; if `redesign_room` is called, it returns a polite refusal and nothing is rendered. | **Pass, 0.6 s.** `isError: true`, "Chic only changes the room itself: paint, furniture, decor, lighting and layout. It does not add people, weapons, drugs or tobacco, or explicit or hateful content to photos. Ask the user for a different change to the room." Also refused, 0.4 to 0.6 s: "Hang a rifle above the fireplace", "Add a naked woman posing on the rug". |
| N3 | Editing someone else's room | "Paint the walls navy" with a roomId that belongs to another ChatGPT user or a usechic.com user | Only the ChatGPT user who made a room can change it. | Refusal saying the room was not found, with nothing changed. | **Pass, 0.8 s.** `isError: true`, "That room was not found. It may have expired, or it was started in another ChatGPT account. Ask the user to attach the room photo again to start a new room." Production, before this change, also refuses but with the bare text "Room not found" (P1's room called with another subject). |

Extra checks (dev, not for the form): no photo and no roomId gives "No room photo was attached. Ask the user to attach a photo of the room they want to change (JPEG, PNG or WebP), then try again." in 0.5 s. `get_room` with `roomId: "not-a-room"` gives the not-found text in 0.4 s instead of a generic error.

## 5. Demo video script (about 80 s)

Record in ChatGPT on desktop with Chic connected (developer mode or the review build), then 10 s on the ChatGPT mobile app. Upload unlisted (YouTube or Loom) and paste the URL. Use the same living-room photo as P1.

| Time | Shot | Do / say |
|---|---|---|
| 0:00–0:05 | Title card | "Chic Room Redesign for ChatGPT, by Automatons, LLC" |
| 0:05–0:12 | New chat, attach the living-room photo | Type exactly: `@Chic paint the walls a soft sage green` |
| 0:12–0:40 | Card renders | Show "Redesigning your room…", then the card. Speed up the wait 2× and leave a "~40 s" caption. Drag the before/after slider across. |
| 0:40–0:48 | Shop strip | Scroll the "Shop the look" strip; pause on the affiliate disclosure line; click one product to show it opens the retailer's page outside ChatGPT. |
| 0:48–1:02 | Follow-up | Type exactly: `Now swap the grey sofa for a cognac leather sofa`. Show the new card and the leather sofa product. |
| 1:02–1:10 | Shop one item | Type exactly: `Find me a rug like the one in that room`. Show the product list. |
| 1:10–1:18 | Refusal | Type exactly: `Add a man sitting on the sofa reading`. Show the polite refusal. |
| 1:18–1:25 | Open in Chic | Click "Open in Chic" and show the room page on usechic.com. |
| 1:25–1:30 | Mobile | Same card on the ChatGPT iOS or Android app, slider dragged once. |

## 6. Release notes, 1.0.0 (paste)

```
First release of Chic Room Redesign for ChatGPT.
- redesign_room: attach a photo of a room and describe a change (paint, furniture, decor, style). Chic renders it into the photo and returns a before/after card with real products to buy. Pass the roomId to keep editing the same room.
- get_room: check on a room that is still rendering, or show it again.
- shop_item: find products with prices for one piece of furniture or decor in the room.
- Product links open the retailer's site; Chic may earn a commission on qualifying purchases, and this is disclosed in the card.
- Requests to add people, weapons, drugs or explicit content are declined.
- No sign-in. Rooms are saved at a link anyone with it can open and expire after 7 days.
```

## 7. Reviewer notes (paste)

```
No test account is needed: the app has no sign-in. Attach any photo of an indoor room (JPEG, PNG or WebP, under 20 MB) and ask for a change.

Timing: redesign_room usually answers in 25 to 50 seconds (we measured 28 to 47 s). It waits up to about 38 seconds for the render. If the render takes longer, it returns status "rendering" with a "Still rendering" message, and the card shows the photo under a "Rendering…" veil and checks get_room every 4 seconds for up to 3 minutes, updating itself when the new photo lands. The model is told to call get_room rather than redesign_room again. get_room answers in about 1 second and shop_item in about 8 seconds.

Limits: each ChatGPT user can start 50 rooms a day, each room takes up to 20 changes, and across all ChatGPT users there is a daily cap of 300 new rooms and 1,500 changes (UTC day). When a limit is hit the tool says so in plain words ("Chic is at capacity for today…").

Data: Chic receives the attached photo, the change request in the user's words, and the anonymized openai/subject (hashed again before use, so a user can only edit their own rooms). It does not ask for or store names, emails or chat history. Rooms made in ChatGPT are unlisted, can be opened by anyone with their link, and are deleted after 7 days.

Commerce: product links go to third-party retailers' product pages; there is no checkout in ChatGPT. Some links are affiliate links; this is disclosed under the product strip and in the tool text.
```

## 8. Owner checklist

1. **Verify the OpenAI organization.** In [organization settings](https://platform.openai.com/settings/organization/general), complete individual verification, then business verification for **Automatons, LLC**, so the listing shows that name as developer.
2. **Who can submit.** An organization owner, or a member with the **Apps Management Write** permission ([organization roles](https://platform.openai.com/settings/organization/people/roles)).
3. **Deploy this change first.** The test results above for N2 and N3 assume the guard, the error text, the affiliate line and widget v2 are live. The Plugins dashboard scans the production MCP server and needs a scan of the current code (up to 2 hours; a rescan can be triggered).
4. **Check the public pages return 200**: https://www.usechic.com/support (404 on production today, live on dev), /privacy and /terms.
5. **Domain verification.** In the [Plugins dashboard](https://platform.openai.com/plugins), upload the ZIP; the dashboard shows a challenge token. In Vercel (project `chic`, Production), set `OPENAI_APPS_CHALLENGE` to that exact token, then redeploy. Check `curl https://www.usechic.com/.well-known/openai-apps-challenge` returns the token as plain text, then click Verify. The env var can be removed after approval.
6. **Icons.** The ZIP already carries `assets/logo.png` (512×512) and `assets/icon.png` (128×128). If the form asks for a separate upload, use `docs/chatgpt-app/chic-logo-512.png`. Use `docs/chatgpt-app/chic-icon-128.png` (1.4 KB) when adding the server in ChatGPT's custom-connector dialog.
7. **Demo video.** Record it with section 5's script, upload it unlisted, and paste the URL.
8. **Review information.** Paste the 5 positive and 3 negative cases (section 4), release notes (6), reviewer notes (7), commerce declaration (2) and the annotation justifications (3). No credentials.
9. **Attest to the policies and submit.** Track status by email. After approval, choose when to publish.

## 9. Gaps against the guidelines

- **Non-room photos are not refused by the server.** The tool description and server instructions tell ChatGPT not to call Chic for selfies, pets or product photos, but if it does, Chic renders anyway (N1). The fix belongs in `apps/backend/convex/chatgpt.ts`: classify the photo in `createRoomFromImage` (the detection model already classifies room type) and throw a `ConvexError` such as "That photo does not look like a room. Please attach a photo of an indoor room." before creating the room. The same gap means a photo with people in it is accepted too.
- **The content guard is a keyword check.** It catches clear requests (people, weapons, drugs and tobacco, explicit and hateful content) and lets ordinary decor words through, but rephrasing can get past it. The image models refuse some of this themselves, but nothing in the backend checks requests. A moderation call on the request text would be sturdier.
- **"Chic" is a single dictionary word.** The listing uses "Chic Room Redesign" for that reason.
- **Affiliate links.** The guidelines forbid apps that "exist primarily as advertising vehicles" and require external checkout "on your own domain". Chic has standalone value (the redesign) and sells nothing itself, but reviewers may ask about the affiliate links; the commerce declaration explains them.
- **Retailer links outside the widget's `redirect_domains`.** Product links can go to any retailer (Rugs.com, Etsy, Best Buy, eBay…), while the CSP lists Amazon, Google and two affiliate redirectors. ChatGPT may show its leaving-ChatGPT confirmation for the others. Nothing breaks.
- **`get_room` reads any public room by id**, including shared rooms from usechic.com. Ids are unguessable and those rooms are already public by link, but the tool is not limited to the caller's own rooms.
- **`/support` is not deployed yet**, and domain verification needs the token from the dashboard.
- **Privacy policy.** The updated /privacy names the AI providers (OpenAI GPT Image, Google Gemini via the Vercel AI Gateway) and Google Lens product search. Confirm it also covers photos and the `openai/subject` id received from ChatGPT before submitting.
