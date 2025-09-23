2slides MCP Server (Node.js)

Setup
- Copy .env.example to .env and set API_KEY
- Install deps: npm install
- Dev run (stdio): npm run dev
- Build: npm run build
- Start: npm start

Claude Desktop config example
{
  "mcpServers": {
    "2slides": {
      "command": "node",
      "args": [
        "/Users/julian/Workspace/you_are_funny/2slides-mcp/node_modules/.bin/tsx",
        "/Users/julian/Workspace/you_are_funny/2slides-mcp/src/server.ts"
      ],
      "env": {
        "API_KEY": "YOUR_API_KEY"
      }
    }
  }
}

Tools
- slides_generate: POST /api/v1/slides/generate
- jobs_get: GET /api/v1/jobs/{jobId}

References
- https://modelcontextprotocol.io/docs/develop/build-server
- https://www.2slides.com


