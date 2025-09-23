import 'dotenv/config';
import { z } from 'zod';
import fetch from 'node-fetch';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

// Constants
const API_BASE_URL = 'https://www.2slides.com';
const API_KEY = process.env.API_KEY ?? '';

if (!API_KEY) {
  // eslint-disable-next-line no-console
  console.error('Missing API_KEY in environment. Create .env and set API_KEY=...');
}

// Initialize MCP server
const mcp = new McpServer({ name: '2slides-mcp', version: '0.1.0' });

// Tool: slides_generate -> POST /api/v1/slides/generate
const GenerateArgs = {
  themeId: z.string().min(1),
  userInput: z.string().min(1),
  responseLanguage: z.string().min(1),
};

mcp.tool('slides_generate', 'Generate slides with 2slides. Returns job info including jobId and downloadUrl when ready.', GenerateArgs, async (args, _extra) => {
    const { themeId, userInput, responseLanguage } = args as z.infer<z.ZodObject<typeof GenerateArgs>>;
    const url = `${API_BASE_URL}/api/v1/slides/generate`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ themeId, userInput, responseLanguage }),
    });

    const data = await res.json();
    if (!res.ok) {
      return {
        content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
        isError: true,
      };
    }
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
});

// Tool: jobs_get -> GET /api/v1/jobs/{job-id}
const JobArgs = { jobId: z.string().min(1) };

mcp.tool('jobs_get', 'Get job status/result by jobId from 2slides.', JobArgs, async (args, _extra) => {
    const { jobId } = args as z.infer<z.ZodObject<typeof JobArgs>>;
    const url = `${API_BASE_URL}/api/v1/jobs/${encodeURIComponent(jobId)}`;
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
    });
    const data = await res.json();
    if (!res.ok) {
      return {
        content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
        isError: true,
      };
    }
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
});

// Start server over stdio
const transport = new StdioServerTransport();
mcp.connect(transport).catch((err: unknown) => {
  // eslint-disable-next-line no-console
  console.error('MCP server error', err);
  process.exit(1);
});


