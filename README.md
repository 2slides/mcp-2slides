## 2slides MCP Server

![2slides](https://2slides.com/images/og_2slides.webp)

Expose [2slides.com](https://2slides.com) tools for MCP clients (e.g., Claude Desktop).

### Get Your API Key
Before using this MCP server, you need to obtain an API key from [2slides.com/api](https://2slides.com/api).

### Configure in Claude Desktop
Edit `~/Library/Application Support/Claude/claude_desktop_config.json` and add:
```json
{
  "mcpServers": {
    "2slides": {
      "command": "npx",
      "args": ["2slides-mcp"],
      "env": {
        "API_KEY": "YOUR_2SLIDES_API_KEY"
      }
    }
  }
}
```
Then fully restart Claude Desktop. In a chat, open the tools panel and you should see the tools below.

### Available Tools

---

#### `slides_generate` (POST /api/v1/slides/generate)
Generate a PowerPoint presentation using a pre-built theme (Fast PPT). Use `themes_search` first to find a `themeId`.

- **Args:**
  - `userInput` (string, required) — presentation content
  - `themeId` (string, required) — theme ID from `themes_search`
  - `responseLanguage` (string, optional, default: `Auto`) — output language; supported values: `Auto`, `English`, `Spanish`, `Arabic`, `Portuguese`, `Indonesian`, `Japanese`, `Russian`, `Hindi`, `French`, `German`, `Greek`, `Vietnamese`, `Turkish`, `Thai`, `Polish`, `Italian`, `Korean`, `Simplified Chinese`, `Traditional Chinese`
  - `mode` (optional, default: `sync`) — `sync` returns `downloadUrl` immediately; `async` returns a `jobId` to poll with `jobs_get`
- **Credits:** 1 per page
- **Example:**
  ```json
  {
    "themeId": "st-1756528793701-fcg5fblt2",
    "userInput": "Generate a 5-slide intro to machine learning",
    "responseLanguage": "English",
    "mode": "sync"
  }
  ```

---

#### `themes_search` (GET /api/v1/themes/search)
Search pre-built themes to use with `slides_generate`.

- **Args:**
  - `query` (string, required) — search keyword (e.g. `business`, `minimal`, `dark`)
  - `limit` (number, optional, default: `10`, range: `1–100`)
- **Returns:** array of themes with `id`, `name`, `description`, `previewUrl`, `tags`
- **Credits:** free
- **Example:**
  ```json
  { "query": "business", "limit": 5 }
  ```

---

#### `jobs_get` (GET /api/v1/jobs/{jobId})
Poll a job's status and retrieve the result when ready.

- **Args:**
  - `jobId` (string, required)
- **Returns:** `jobId`, `status` (`pending` / `processing` / `success` / `failed`), `message`, `downloadUrl` (when success), `slidePageCount`, `createdAt`, `updatedAt`, `duration` (ms), `jobUrl` (Nano Banana jobs only)
- **Credits:** free
- **Note:** Poll every 20 seconds until `status` is `success` or `failed`.
- **Example:**
  ```json
  { "jobId": "D8h9VYDGdTlZ6wWSEoctF" }
  ```

---

#### `slides_create_like_this` (POST /api/v1/slides/create-like-this)
Generate slides (Nano Banana) that match the style of a reference image.

- **Args:**
  - `userInput` (string, required) — presentation content
  - `referenceImageUrl` (string, required) — URL of the style reference image
  - `responseLanguage` (string, optional, default: `Auto`)
  - `aspectRatio` (string, optional, default: `16:9`) — valid values: `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9`
  - `resolution` (string, optional, default: `2K`) — `1K`, `2K`, `4K`
  - `page` (number, optional, default: `0`) — `0` = auto-detect, `1–100` = exact page count
  - `contentDetail` (string, optional, default: `standard`) — `concise` or `standard`
  - `mode` (string, optional, default: `async`) — `async` returns `jobId`; `sync` returns `downloadUrl` immediately
- **Credits:** 100 per page (1K/2K) or 200 per page (4K)
- **Example:**
  ```json
  {
    "userInput": "Create a presentation about AI trends",
    "referenceImageUrl": "https://example.com/style-reference.jpg",
    "aspectRatio": "16:9",
    "resolution": "2K",
    "page": 5,
    "contentDetail": "standard",
    "mode": "async"
  }
  ```

---

#### `slides_create_pdf_slides` (POST /api/v1/slides/create-pdf-slides)
Generate custom-designed slides (Nano Banana) from text content without a reference image.

- **Args:**
  - `userInput` (string, required) — presentation content
  - `designStyle` (string, optional) — free-text description of the visual style; leave empty for default styling
  - `responseLanguage` (string, optional, default: `Auto`)
  - `aspectRatio` (string, optional, default: `16:9`) — valid values: `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9`
  - `resolution` (string, optional, default: `2K`) — `1K`, `2K`, `4K`
  - `page` (number, optional, default: `0`) — `0` = auto-detect, `1–100` = exact page count
  - `contentDetail` (string, optional, default: `standard`) — `concise` or `standard`
  - `mode` (string, optional, default: `async`) — `async` returns `jobId`; `sync` returns `downloadUrl` immediately
- **Credits:** 100 per page (1K/2K) or 200 per page (4K)
- **Example:**
  ```json
  {
    "userInput": "Quarterly business review for Q3 2025",
    "designStyle": "modern, dark background, bold typography",
    "aspectRatio": "16:9",
    "resolution": "2K",
    "page": 8,
    "mode": "async"
  }
  ```

---

#### `slides_generate_narration` (POST /api/v1/slides/generate-narration)
Add AI voice narration to a completed Nano Banana job (`slides_create_like_this` or `slides_create_pdf_slides` only; Fast PPT not supported). Always async — poll result with `jobs_get`.

- **Args (single speaker, `mode: "single"` default):**
  - `jobId` (string, required) — UUID of a completed Nano Banana job
  - `mode` (string, optional, default: `single`) — `single` or `multi`
  - `speakerName` (string, optional) — narrator name
  - `voice` (string, optional) — one of 30 voices (see list below)
  - `contentMode` (string, optional, default: `standard`) — `concise` or `standard`
  - `includeIntro` (boolean, optional, default: `true`)

- **Args (two speakers, `mode: "multi"`):**
  - `jobId` (string, required)
  - `mode` (string, required) — `multi`
  - `speaker1Name` (string, required)
  - `speaker2Name` (string, required)
  - `speaker1Voice` (string, optional) — voice for speaker 1
  - `speaker2Voice` (string, optional) — voice for speaker 2
  - `contentMode` (string, optional, default: `standard`) — `concise` or `standard`

- **Supported voices (30):** `Puck`, `Aoede`, `Charon`, `Kore`, `Fenrir`, `Zephyr`, `Leda`, `Orus`, `Callirrhoe`, `Autonoe`, `Enceladus`, `Iapetus`, `Umbriel`, `Algieba`, `Despina`, `Erinome`, `Algenib`, `Rasalgethi`, `Laomedeia`, `Achernar`, `Alnilam`, `Schedar`, `Gacrux`, `Pulcherrima`, `Achird`, `Zubenelgenubi`, `Vindemiatrix`, `Sadachbia`, `Sadaltager`, `Sulafat`
- **Credits:** 210 per page (10 text + 200 audio)
- **Example:**
  ```json
  {
    "jobId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "mode": "multi",
    "speaker1Name": "Alice",
    "speaker2Name": "Bob",
    "speaker1Voice": "Aoede",
    "speaker2Voice": "Puck",
    "contentMode": "standard"
  }
  ```

---

#### `slides_download_pages_voices` (POST /api/v1/slides/download-slides-pages-voices)
Export slide pages and audio narration as a ZIP file. The job must be completed and have narration generated.

- **Args:**
  - `jobId` (string, required) — UUID of a job with completed narration
- **Returns:** `downloadUrl` (expires in 1 hour), `fileName`, `expiresIn` (3600 seconds)
- **ZIP contents:**
  ```
  pages/
    page_01.png, page_02.png, …
  voices/
    page_01.wav, page_02.wav, …
  transcript.txt
  ```
- **Credits:** free
- **Example:**
  ```json
  { "jobId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890" }
  ```

---

### Typical Workflows

**Fast PPT (theme-based PowerPoint):**
1. `themes_search` → get a `themeId`
2. `slides_generate` (sync) → get `downloadUrl` directly

**Nano Banana (custom-designed slides):**
1. `slides_create_like_this` or `slides_create_pdf_slides` (async) → get `jobId`
2. `jobs_get` (poll every 20s) → get `downloadUrl` when `status: "success"`

**Nano Banana with narration:**
1. `slides_create_like_this` or `slides_create_pdf_slides` → get `jobId`
2. `jobs_get` → wait for slides to complete
3. `slides_generate_narration` → get narration `jobId`
4. `jobs_get` → wait for narration to complete
5. `slides_download_pages_voices` → get ZIP download link

---

### Troubleshooting (Claude Desktop)
- If tools don't appear in Claude, verify the config path is absolute and restart the app.
- Check Claude MCP logs:
```bash
tail -n 50 -f ~/Library/Logs/Claude/mcp*.log
```
- For stdio MCP servers, avoid logging to stdout; this server only logs errors to stderr.

### References
- Build an MCP server (official docs): https://modelcontextprotocol.io/docs/develop/build-server
- 2slides API docs: https://2slides.com/api
- 2slides: https://2slides.com
- 2slides Templates: https://2slides.com/templates
