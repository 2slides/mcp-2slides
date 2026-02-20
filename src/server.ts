import dotenv from 'dotenv';
import { z } from 'zod';
import fetch from 'node-fetch';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

// Constants
const API_BASE_URL = 'https://2slides.com';
dotenv.config();
const API_KEY = process.env.API_KEY ?? '';

if (!API_KEY) {
  // eslint-disable-next-line no-console
  console.error('Missing API_KEY in environment. Create .env and set API_KEY=...');
}

// Initialize MCP server
const mcp = new McpServer({ name: '2slides-mcp', version: '0.2.4' });

// Shared valid values
const ASPECT_RATIOS = ['1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '21:9'] as const;
const RESOLUTIONS = ['1K', '2K', '4K'] as const;
// All 30 supported voices
const VOICES = [
  'Puck', 'Aoede', 'Charon', 'Kore', 'Fenrir', 'Zephyr', 'Leda', 'Orus',
  'Callirrhoe', 'Autonoe', 'Enceladus', 'Iapetus', 'Umbriel', 'Algieba',
  'Despina', 'Erinome', 'Algenib', 'Rasalgethi', 'Laomedeia', 'Achernar',
  'Alnilam', 'Schedar', 'Gacrux', 'Pulcherrima', 'Achird', 'Zubenelgenubi',
  'Vindemiatrix', 'Sadachbia', 'Sadaltager', 'Sulafat',
] as const;

// Tool: slides_generate -> POST /api/v1/slides/generate
const GenerateArgs = {
  userInput: z.string().min(1),
  themeId: z.string().min(1),
  // responseLanguage is optional; default is "Auto"
  responseLanguage: z.string().optional(),
  // mode: 'sync' (default) | 'async'
  mode: z.enum(['sync', 'async']).optional(),
};

mcp.tool(
  'slides_generate',
  "Generate a PowerPoint presentation using pre-built themes (Fast PPT). Use themes_search first to get a themeId. mode='sync' (default) returns downloadUrl immediately; mode='async' returns a jobId to poll with jobs_get. responseLanguage defaults to 'Auto' (auto-detect); supported values: Auto, English, Spanish, Arabic, Portuguese, Indonesian, Japanese, Russian, Hindi, French, German, Greek, Vietnamese, Turkish, Thai, Polish, Italian, Korean, Simplified Chinese, Traditional Chinese. Credits: 1 per page.",
  GenerateArgs,
  async (args: any, _extra: any) => {
    const { themeId, userInput, responseLanguage, mode = 'sync' } = args as z.infer<z.ZodObject<typeof GenerateArgs>>;
    const url = `${API_BASE_URL}/api/v1/slides/generate`;
    const body: Record<string, any> = { themeId, userInput, mode };
    if (responseLanguage) body.responseLanguage = responseLanguage;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (!res.ok) {
      return {
        content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
        isError: true,
      };
    }
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
  }
);

// Tool: jobs_get -> GET /api/v1/jobs/{job-id}
const JobArgs = { jobId: z.string().min(1) };

mcp.tool(
  'jobs_get',
  "Get job status and result by jobId. Poll every 20 seconds until status is 'success' or 'failed'. Response fields: jobId, status (pending/processing/success/failed), message, downloadUrl (when success), slidePageCount, createdAt, updatedAt, duration (ms), jobUrl (Nano Banana jobs only). Free — no credits charged.",
  JobArgs,
  async (args: any, _extra: any) => {
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
  }
);

// Tool: themes_search -> GET /api/v1/themes/search
const ThemesSearchArgs = {
  query: z.string().min(1),
  // limit: default 10, range 1-100
  limit: z.number().int().min(1).max(100).optional(),
};

mcp.tool(
  'themes_search',
  "Search pre-built themes for slides_generate (Fast PPT). Returns theme objects with id, name, description, previewUrl, and tags. Use the returned id as themeId in slides_generate. limit defaults to 10, max 100. Free — no credits charged.",
  ThemesSearchArgs,
  async (args: any, _extra: any) => {
    const { query, limit } = args as z.infer<z.ZodObject<typeof ThemesSearchArgs>>;
    const search = new URLSearchParams({ query });
    if (typeof limit === 'number') search.set('limit', String(limit));
    const url = `${API_BASE_URL}/api/v1/themes/search?${search.toString()}`;
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
  }
);

// Tool: slides_create_like_this -> POST /api/v1/slides/create-like-this
const CreateLikeThisArgs = {
  userInput: z.string().min(1),
  referenceImageUrl: z.string().min(1),
  responseLanguage: z.string().optional(),
  aspectRatio: z.enum(ASPECT_RATIOS).optional(),
  resolution: z.enum(RESOLUTIONS).optional(),
  // page: 0 = auto-detect, 1-100 = exact count; default 0
  page: z.number().int().min(0).max(100).optional(),
  // contentDetail: default 'standard'
  contentDetail: z.enum(['concise', 'standard']).optional(),
  // mode: default 'async'
  mode: z.enum(['sync', 'async']).optional(),
};

mcp.tool(
  'slides_create_like_this',
  "Generate slides (Nano Banana) that match the style of a reference image. mode defaults to 'async' — returns jobId to poll with jobs_get; 'sync' returns downloadUrl immediately. aspectRatio valid values: 1:1, 2:3, 3:2, 3:4, 4:3, 4:5, 5:4, 9:16, 16:9 (default), 21:9. resolution: '1K', '2K' (default), '4K'. page: 0=auto-detect (default), 1-100=exact count. contentDetail: 'concise' or 'standard' (default). responseLanguage defaults to 'Auto'. Credits: 100 per page (1K/2K) or 200 per page (4K).",
  CreateLikeThisArgs,
  async (args: any, _extra: any) => {
    const {
      userInput,
      referenceImageUrl,
      responseLanguage,
      aspectRatio,
      resolution,
      page,
      contentDetail,
      mode,
    } = args as z.infer<z.ZodObject<typeof CreateLikeThisArgs>>;
    const url = `${API_BASE_URL}/api/v1/slides/create-like-this`;
    const body: Record<string, any> = { userInput, referenceImageUrl };
    if (responseLanguage) body.responseLanguage = responseLanguage;
    if (aspectRatio) body.aspectRatio = aspectRatio;
    if (resolution) body.resolution = resolution;
    if (typeof page === 'number') body.page = page;
    if (contentDetail) body.contentDetail = contentDetail;
    if (mode) body.mode = mode;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (!res.ok) {
      return {
        content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
        isError: true,
      };
    }
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
  }
);

// Tool: slides_create_pdf_slides -> POST /api/v1/slides/create-pdf-slides
const CreatePdfSlidesArgs = {
  userInput: z.string().min(1),
  designStyle: z.string().optional(),
  responseLanguage: z.string().optional(),
  aspectRatio: z.enum(ASPECT_RATIOS).optional(),
  resolution: z.enum(RESOLUTIONS).optional(),
  // page: 0 = auto-detect, 1-100 = exact count; default 0
  page: z.number().int().min(0).max(100).optional(),
  // contentDetail: default 'standard'
  contentDetail: z.enum(['concise', 'standard']).optional(),
  // mode: default 'async'
  mode: z.enum(['sync', 'async']).optional(),
};

mcp.tool(
  'slides_create_pdf_slides',
  "Generate custom-designed slides (Nano Banana) from text content without a reference image. mode defaults to 'async' — returns jobId to poll with jobs_get; 'sync' returns downloadUrl immediately. designStyle is optional free-text describing the visual style (leave empty for default styling). aspectRatio valid values: 1:1, 2:3, 3:2, 3:4, 4:3, 4:5, 5:4, 9:16, 16:9 (default), 21:9. resolution: '1K', '2K' (default), '4K'. page: 0=auto-detect (default), 1-100=exact count. contentDetail: 'concise' or 'standard' (default). responseLanguage defaults to 'Auto'. Credits: 100 per page (1K/2K) or 200 per page (4K).",
  CreatePdfSlidesArgs,
  async (args: any, _extra: any) => {
    const {
      userInput,
      designStyle,
      responseLanguage,
      aspectRatio,
      resolution,
      page,
      contentDetail,
      mode,
    } = args as z.infer<z.ZodObject<typeof CreatePdfSlidesArgs>>;
    const url = `${API_BASE_URL}/api/v1/slides/create-pdf-slides`;
    const body: Record<string, any> = { userInput };
    if (designStyle) body.designStyle = designStyle;
    if (responseLanguage) body.responseLanguage = responseLanguage;
    if (aspectRatio) body.aspectRatio = aspectRatio;
    if (resolution) body.resolution = resolution;
    if (typeof page === 'number') body.page = page;
    if (contentDetail) body.contentDetail = contentDetail;
    if (mode) body.mode = mode;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) {
      return {
        content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
        isError: true,
      };
    }
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
  }
);

// Tool: slides_generate_narration -> POST /api/v1/slides/generate-narration
const GenerateNarrationArgs = {
  jobId: z.string().min(1),
  // mode: 'single' (default) | 'multi'
  mode: z.enum(['single', 'multi']).optional(),
  // Single-speaker fields (mode='single')
  speakerName: z.string().optional(),
  voice: z.enum(VOICES).optional(),
  contentMode: z.enum(['concise', 'standard']).optional(),
  includeIntro: z.boolean().optional(),
  // Multi-speaker fields (mode='multi'); speaker1Name and speaker2Name are required when mode='multi'
  speaker1Name: z.string().optional(),
  speaker2Name: z.string().optional(),
  speaker1Voice: z.enum(VOICES).optional(),
  speaker2Voice: z.enum(VOICES).optional(),
};

mcp.tool(
  'slides_generate_narration',
  "Add AI voice narration to a completed Nano Banana job (slides_create_like_this or slides_create_pdf_slides only; Fast PPT not supported). Async only — poll result with jobs_get. mode='single' (default): one narrator (speakerName, voice, contentMode, includeIntro). mode='multi': two narrators (speaker1Name and speaker2Name are required; speaker1Voice, speaker2Voice, contentMode optional). contentMode: 'concise' or 'standard' (default). includeIntro: true (default) or false. All 30 supported voices: Puck, Aoede, Charon, Kore, Fenrir, Zephyr, Leda, Orus, Callirrhoe, Autonoe, Enceladus, Iapetus, Umbriel, Algieba, Despina, Erinome, Algenib, Rasalgethi, Laomedeia, Achernar, Alnilam, Schedar, Gacrux, Pulcherrima, Achird, Zubenelgenubi, Vindemiatrix, Sadachbia, Sadaltager, Sulafat. Credits: 210 per page (10 text + 200 audio).",
  GenerateNarrationArgs,
  async (args: any, _extra: any) => {
    const {
      jobId,
      mode = 'single',
      speakerName,
      voice,
      contentMode,
      includeIntro,
      speaker1Name,
      speaker2Name,
      speaker1Voice,
      speaker2Voice,
    } = args as z.infer<z.ZodObject<typeof GenerateNarrationArgs>>;
    const url = `${API_BASE_URL}/api/v1/slides/generate-narration`;
    const body: Record<string, any> = { jobId, mode };
    if (mode === 'multi') {
      if (speaker1Name) body.speaker1Name = speaker1Name;
      if (speaker2Name) body.speaker2Name = speaker2Name;
      if (speaker1Voice) body.speaker1Voice = speaker1Voice;
      if (speaker2Voice) body.speaker2Voice = speaker2Voice;
      if (contentMode) body.contentMode = contentMode;
    } else {
      if (speakerName) body.speakerName = speakerName;
      if (voice) body.voice = voice;
      if (contentMode) body.contentMode = contentMode;
      if (typeof includeIntro === 'boolean') body.includeIntro = includeIntro;
    }
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) {
      return {
        content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
        isError: true,
      };
    }
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
  }
);

// Tool: slides_download_pages_voices -> POST /api/v1/slides/download-slides-pages-voices
const DownloadPagesVoicesArgs = {
  jobId: z.string().min(1),
};

mcp.tool(
  'slides_download_pages_voices',
  "Export slide pages and audio narration as a ZIP file. The job must be completed and have narration generated (slides_generate_narration). ZIP contains: pages/ (page_01.png, page_02.png, …), voices/ (page_01.wav, page_02.wav, …), transcript.txt. Returns downloadUrl (expires in 1 hour), fileName, and expiresIn (3600 seconds). Free — no credits charged.",
  DownloadPagesVoicesArgs,
  async (args: any, _extra: any) => {
    const { jobId } = args as z.infer<z.ZodObject<typeof DownloadPagesVoicesArgs>>;
    const url = `${API_BASE_URL}/api/v1/slides/download-slides-pages-voices`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ jobId }),
    });
    const data = await res.json();
    if (!res.ok) {
      return {
        content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
        isError: true,
      };
    }
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
  }
);

// Start server over stdio
const transport = new StdioServerTransport();
mcp.connect(transport).catch((err: unknown) => {
  // eslint-disable-next-line no-console
  console.error('MCP server error', err);
  process.exit(1);
});
