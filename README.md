## 2slides MCP Server

Expose 2slides.com tools for MCP clients (e.g., Claude Desktop).

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
- `slides_generate` (POST /api/v1/slides/generate)
  - Args: `themeId` (string), `userInput` (string), `responseLanguage` (string)
  - Example:
    ```json
    {
      "themeId": "st-1756528793701-fcg5fblt2",
      "userInput": "generate sample content",
      "responseLanguage": "English"
    }
    ```

- `jobs_get` (GET /api/v1/jobs/{jobId})
  - Args: `jobId` (string)
  - Example:
    ```json
    { "jobId": "D8h9VYDGdTlZ6wWSEoctF" }
    ```

- `themes_search` (GET /api/v1/themes/search)
  - Args: `query` (string), `limit` (number, optional, max 100)
  - Example:
    ```json
    { "query": "8 stages", "limit": 10 }
    ```

- `templates_browse_url` (No API call)
  - Returns the templates page URL: `https://www.2slides.com/templates`

All tools return the 2slides API JSON as formatted text. Use `jobs_get` with the `jobId` from `slides_generate` to poll status or get the `downloadUrl` when available.

### Troubleshooting (Claude Desktop)
- If tools don’t appear in Claude, verify the config path is absolute and restart the app.
- Check Claude MCP logs:
```bash
tail -n 50 -f ~/Library/Logs/Claude/mcp*.log
```
- For stdio MCP servers, avoid logging to stdout; this server only logs errors to stderr. See the official guidance below.

### References
- Build an MCP server (official docs): https://modelcontextprotocol.io/docs/develop/build-server
- 2slides: https://www.2slides.com
- 2slides Templates: https://www.2slides.com/templates

