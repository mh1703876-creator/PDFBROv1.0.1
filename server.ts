/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json({ limit: '10mb' }));

// All tools available in the PDFBRO application
const CATALOG_TOOLS = [
  {
    id: 'image-compressor',
    title: 'Compress Image',
    description: 'Compress JPG, PNG, and WebP images with custom quality and resolution scale.',
    route: 'E',
    subPage: 'image-compressor',
    badge: 'Compress',
    fileTypes: ['image'],
  },
  {
    id: 'color-to-bw',
    title: 'Color to B&W',
    description: 'Convert color PDF pages to monochrome black and white or grayscale.',
    route: 'E',
    subPage: 'color-to-bw',
    badge: 'Monochrome',
    fileTypes: ['pdf'],
  },
  {
    id: 'image-to-pdf',
    title: 'Image to PDF',
    description: 'Convert JPG, PNG, and WebP pictures into a paginated PDF document.',
    route: 'E',
    subPage: 'image-to-pdf',
    badge: 'Convert',
    fileTypes: ['image'],
  },
  {
    id: 'pdf-to-images',
    title: 'PDF to Images',
    description: 'Extract all pages into high-resolution JPG or PNG image files.',
    route: 'E',
    subPage: 'pdf-to-images',
    badge: 'Extract',
    fileTypes: ['pdf'],
  },
  {
    id: 'image-grayscale',
    title: 'Grayscale Image',
    description: 'Convert color pictures to grayscale, black and white, or vintage sepia.',
    route: 'E',
    subPage: 'image-grayscale',
    badge: 'Filter',
    fileTypes: ['image'],
  },
  {
    id: 'image-resize',
    title: 'Resize Image',
    description: 'Resize image dimensions by pixels or percentage with aspect ratio lock.',
    route: 'E',
    subPage: 'image-resize',
    badge: 'Resize',
    fileTypes: ['image'],
  },
  {
    id: 'split-pdf',
    title: 'Split PDF',
    description: 'Split PDF into individual pages or extract custom page ranges.',
    route: 'E',
    subPage: 'split-pdf',
    badge: 'Split',
    fileTypes: ['pdf'],
  },
  {
    id: 'merge-pdf',
    title: 'Merge PDF',
    description: 'Combine multiple PDF files into one organized document.',
    route: 'E',
    subPage: 'merge-pdf',
    badge: 'Merge',
    fileTypes: ['pdf'],
  },
  {
    id: 'rotate-pdf',
    title: 'Rotate PDF',
    description: 'Permanently rotate PDF pages by 90, 180, or 270 degrees.',
    route: 'E',
    subPage: 'rotate-pdf',
    badge: 'Rotate',
    fileTypes: ['pdf'],
  },
  {
    id: 'delete-pages',
    title: 'Delete Pages',
    description: 'Selectively remove unwanted or blank pages from your PDF.',
    route: 'E',
    subPage: 'delete-pages',
    badge: 'Delete',
    fileTypes: ['pdf'],
  },
  {
    id: 'reorder-pages',
    title: 'Reorder Pages',
    description: 'Rearrange and re-sequence PDF pages with interactive drag and drop.',
    route: 'E',
    subPage: 'reorder-pages',
    badge: 'Reorder',
    fileTypes: ['pdf'],
  },
  {
    id: 'extract-pages',
    title: 'Extract Pages',
    description: 'Extract designated page numbers into a fresh PDF file.',
    route: 'E',
    subPage: 'extract-pages',
    badge: 'Extract',
    fileTypes: ['pdf'],
  },
  {
    id: 'add-watermark',
    title: 'Add Watermark',
    description: 'Add diagonal or horizontal text watermarks to all PDF pages.',
    route: 'E',
    subPage: 'add-watermark',
    badge: 'Watermark',
    fileTypes: ['pdf'],
  },
  {
    id: 'remove-metadata',
    title: 'Remove Metadata',
    description: 'Strip author, title, producer, and hidden tracking metadata.',
    route: 'E',
    subPage: 'remove-metadata',
    badge: 'Privacy',
    fileTypes: ['pdf'],
  },
  {
    id: 'docx-to-pdf',
    title: 'DOCX to PDF',
    description: 'Convert Microsoft Word (.docx) documents into clean PDF files.',
    route: 'E',
    subPage: 'docx-to-pdf',
    badge: 'Convert',
    fileTypes: ['docx'],
  },
  {
    id: 'ppt-to-pdf',
    title: 'PowerPoint to PDF',
    description: 'Convert PowerPoint (.pptx, .ppt) presentations into PDF slides.',
    route: 'E',
    subPage: 'ppt-to-pdf',
    badge: 'Convert',
    fileTypes: ['pptx'],
  },
  {
    id: 'pdf-editor',
    title: 'PDF Editor',
    description: 'Compile vector multi-column styled PDF documents with Bangla & Google fonts.',
    route: 'A',
    badge: 'Editor',
    fileTypes: ['txt'],
  },
  {
    id: 'txt-editor',
    title: 'TXT Editor',
    description: 'Format, clean, and edit raw text documents directly in your browser.',
    route: 'B',
    badge: 'Editor',
    fileTypes: ['txt'],
  },
  {
    id: 'vocab-analyzer',
    title: 'Vocab Analyzer',
    description: 'Count vocabulary frequency, repetitive word usage, and optimize writing style.',
    route: 'D',
    badge: 'Analyzer',
    fileTypes: ['txt'],
  },
  {
    id: 'tools-hub',
    title: 'Tools Hub',
    description: 'Browse the full suite of 16 document, PDF, and image utilities.',
    route: 'E',
    subPage: 'hub',
    badge: 'Hub',
    fileTypes: [],
  },
];

// Fallback intelligent heuristic matching
function getFallbackRecommendation(query: string, fileTypes: string[] = []) {
  const q = (query || '').toLowerCase().trim();
  const matchedTools: typeof CATALOG_TOOLS = [];
  const explanations: Record<string, string> = {};

  // Check if query is asking about the platform, tools list, or creator (Abdul Aref)
  const isPlatformQuestion =
    q.includes('what kind of tool') ||
    q.includes('what tools') ||
    q.includes('kind of tools') ||
    q.includes('what can you do') ||
    q.includes('what can this') ||
    q.includes('plarfome') ||
    q.includes('platform') ||
    q.includes('abdul') ||
    q.includes('aref') ||
    q.includes('arf') ||
    q.includes('creator') ||
    q.includes('who made') ||
    q.includes('version') ||
    q.includes('features') ||
    q.includes('help');

  if (isPlatformQuestion) {
    const hub = CATALOG_TOOLS.find((t) => t.id === 'tools-hub');
    const pdfEd = CATALOG_TOOLS.find((t) => t.id === 'pdf-editor');
    const imgPdf = CATALOG_TOOLS.find((t) => t.id === 'image-to-pdf');
    const merge = CATALOG_TOOLS.find((t) => t.id === 'merge-pdf');
    const list = [hub, pdfEd, imgPdf, merge].filter(Boolean) as typeof CATALOG_TOOLS;

    return {
      assistantMessage:
        'PDFBRO (created by Abdul Aref and team) is an all-in-one document and PDF platform featuring 16+ professional utilities: PDF Editor (vector layouts with Bangla & English fonts), TXT Editor, Vocab Analyzer, plus tools to Merge, Split, Rotate, Delete Pages, Convert Images to PDF, Compress Photos, Convert PDF to Images, and change Color to B&W.',
      hasTools: true,
      recommendedTools: list.map((t) => ({
        ...t,
        matchReason: t.id === 'tools-hub' ? 'Explore all 16 PDF and image utilities in one place.' : t.description,
      })),
    };
  }

  // Check if query is about unsupported tasks (e.g. video, audio, 3D, code)
  const unsupportedKeywords = [
    'video', 'audio', 'mp3', 'mp4', 'movie', 'sound', 'music', 'game',
    '3d model', 'blender', 'photoshop', 'illustrator', 'transcribe voice',
  ];
  const isExplicitlyUnsupported = unsupportedKeywords.some((kw) => q.includes(kw));

  if (isExplicitlyUnsupported && !q.includes('pdf') && !q.includes('image')) {
    return {
      assistantMessage: `No tools for this task. PDFBRO specializes in document management, PDF vector creation, image-to-PDF conversions, photo compression, and vocabulary analysis. We do not currently support multimedia or video tasks.`,
      hasTools: false,
      recommendedTools: [],
    };
  }

  // Specific "image to pdf" intent - MUST prioritize image-to-pdf ONLY!
  if (
    q.includes('image to pdf') ||
    q.includes('images to pdf') ||
    q.includes('photo to pdf') ||
    q.includes('picture to pdf') ||
    q.includes('jpg to pdf') ||
    q.includes('png to pdf') ||
    (q.includes('image') && q.includes('to pdf'))
  ) {
    const tool = CATALOG_TOOLS.find((t) => t.id === 'image-to-pdf');
    if (tool) {
      return {
        assistantMessage: 'Use our Image to PDF tool to easily convert your pictures (JPG, PNG, WebP) into a clean, paginated PDF document.',
        hasTools: true,
        recommendedTools: [
          {
            ...tool,
            matchReason: 'Convert and organize your images into a single PDF document.',
          },
        ],
      };
    }
  }

  // Specific "pdf to image" intent
  if (
    q.includes('pdf to image') ||
    q.includes('pdf to images') ||
    q.includes('pdf to jpg') ||
    q.includes('pdf to png') ||
    q.includes('extract images from pdf')
  ) {
    const tool = CATALOG_TOOLS.find((t) => t.id === 'pdf-to-images');
    if (tool) {
      return {
        assistantMessage: 'Extract high-resolution JPG or PNG pictures from any or all pages of your PDF document.',
        hasTools: true,
        recommendedTools: [
          {
            ...tool,
            matchReason: 'Export all PDF pages as separate high-quality image files.',
          },
        ],
      };
    }
  }

  // Specific "compress" intent
  if (q.includes('compress') || q.includes('reduce image size') || q.includes('shrink image') || q.includes('reduce size')) {
    const tool = CATALOG_TOOLS.find((t) => t.id === 'image-compressor');
    if (tool) {
      return {
        assistantMessage: 'Compress your JPG, PNG, and WebP images with custom quality settings to dramatically shrink file size.',
        hasTools: true,
        recommendedTools: [
          {
            ...tool,
            matchReason: 'Compress image file size while preserving high visual quality.',
          },
        ],
      };
    }
  }

  // Specific "resize" intent
  if (q.includes('resize') || q.includes('scale image') || q.includes('image dimension') || q.includes('width and height')) {
    const tool = CATALOG_TOOLS.find((t) => t.id === 'image-resize');
    if (tool) {
      return {
        assistantMessage: 'Resize your images by pixel dimensions or percentage scale while keeping aspect ratio locked.',
        hasTools: true,
        recommendedTools: [
          {
            ...tool,
            matchReason: 'Adjust pixel width and height or scale percentage.',
          },
        ],
      };
    }
  }

  // PDF Black & White intent
  if (q.includes('black and white') || q.includes('grayscale') || q.includes('monochrome') || q.includes('b&w') || q.includes('bw')) {
    const bwTool = CATALOG_TOOLS.find((t) => t.id === 'color-to-bw');
    const imgBwTool = CATALOG_TOOLS.find((t) => t.id === 'image-grayscale');
    const list = [bwTool, imgBwTool].filter(Boolean) as typeof CATALOG_TOOLS;
    return {
      assistantMessage: `To make documents or pictures black and white, you can use our Color to B&W tool for PDF files or Grayscale tool for images.`,
      hasTools: true,
      recommendedTools: list.map((tool) => ({
        ...tool,
        matchReason: tool.id === 'color-to-bw'
          ? 'Convert colorful PDF pages into pure black & white or grayscale.'
          : 'Apply monochrome black & white filter to photos.',
      })),
    };
  }

  // Generic Image editing intent (only when user specifically says "edit image" without a specific action)
  if (
    q.includes('edit image') ||
    q.includes('edit my image') ||
    q.includes('image editing') ||
    (fileTypes.includes('image') && !q)
  ) {
    const imageTools = ['image-compressor', 'image-to-pdf', 'image-resize', 'image-grayscale'];
    imageTools.forEach((id) => {
      const tool = CATALOG_TOOLS.find((t) => t.id === id);
      if (tool) {
        matchedTools.push(tool);
        if (id === 'image-compressor') explanations[id] = 'Shrink image file size for fast sharing and storage.';
        if (id === 'image-to-pdf') explanations[id] = 'Turn your pictures into an organized PDF document.';
        if (id === 'image-resize') explanations[id] = 'Scale dimensions to custom pixel width/height.';
        if (id === 'image-grayscale') explanations[id] = 'Convert colors to monochrome B&W or grayscale tone.';
      }
    });

    return {
      assistantMessage: `Here are the tools you can use to process and edit your images: you can compress file sizes, resize dimensions, convert to monochrome/grayscale, or package pictures into a PDF.`,
      hasTools: true,
      recommendedTools: matchedTools.map((tool) => ({
        ...tool,
        matchReason: explanations[tool.id] || tool.description,
      })),
    };
  }

  // PDF manipulation intent
  if (q.includes('split') || q.includes('merge') || q.includes('combine') || q.includes('rotate') || q.includes('delete') || q.includes('watermark') || q.includes('pdf')) {
    const list = CATALOG_TOOLS.filter((t) => {
      if (q.includes('split') && t.id === 'split-pdf') return true;
      if (q.includes('merge') && t.id === 'merge-pdf') return true;
      if (q.includes('rotate') && t.id === 'rotate-pdf') return true;
      if (q.includes('delete') && t.id === 'delete-pages') return true;
      if (q.includes('watermark') && t.id === 'add-watermark') return true;
      if (q.includes('extract') && (t.id === 'extract-pages' || t.id === 'pdf-to-images')) return true;
      if (t.fileTypes.includes('pdf')) return true;
      return false;
    }).slice(0, 3);

    return {
      assistantMessage: `Here are the PDF tools suited for your request. You can organize, extract, rotate, or modify your PDF pages.`,
      hasTools: list.length > 0,
      recommendedTools: list.map((tool) => ({
        ...tool,
        matchReason: tool.description,
      })),
    };
  }

  // Text & Vocab intent
  if (q.includes('vocab') || q.includes('word') || q.includes('repeat') || q.includes('repetitive') || q.includes('essay') || q.includes('analysis')) {
    const vocabTool = CATALOG_TOOLS.find((t) => t.id === 'vocab-analyzer')!;
    const txtTool = CATALOG_TOOLS.find((t) => t.id === 'txt-editor')!;
    return {
      assistantMessage: `To evaluate vocabulary variety and eliminate repeated words in your essays or writing, use our Vocab Analyzer tool.`,
      hasTools: true,
      recommendedTools: [
        {
          ...vocabTool,
          matchReason: 'Analyze word frequency and highlight repetitive terms to enrich your vocabulary.',
        },
        {
          ...txtTool,
          matchReason: 'Format and revise your text draft cleanly.',
        },
      ],
    };
  }

  // If no match found
  return {
    assistantMessage: `No tools for this task. We could not find a tool matching "${query}". PDFBRO specializes in PDF creation & editing, image utilities, and vocabulary analysis.`,
    hasTools: false,
    recommendedTools: [],
  };
}

// POST /api/assistant endpoint
app.post('/api/assistant', async (req: Request, res: Response) => {
  try {
    const { query = '', fileNames = [], fileTypes = [] } = req.body;

    const trimmedQuery = typeof query === 'string' ? query.trim() : '';

    // If query is completely empty and no files are attached
    if (!trimmedQuery && (!fileNames || fileNames.length === 0)) {
      return res.json({
        assistantMessage: 'Welcome to PDFBRO AI Assistant! Tell me what you would like to do, or select a tool below.',
        hasTools: true,
        recommendedTools: CATALOG_TOOLS.slice(0, 4).map((t) => ({
          ...t,
          matchReason: t.description,
        })),
      });
    }

    // Call Gemini API if GEMINI_API_KEY is available
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      try {
        const ai = new GoogleGenAI({
          apiKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            },
          },
        });

        const prompt = `You are the expert, conversational AI Assistant for PDFBRO.
PDFBRO was created by Abdul Aref and the PDFBRO engineering team.
You know everything about PDFBRO, all its tools, features, version, and capabilities.

User Request: "${trimmedQuery}"
Attached Files: ${JSON.stringify(fileNames)} (File Types: ${JSON.stringify(fileTypes)})

Available PDFBRO tools in catalog:
${JSON.stringify(
  CATALOG_TOOLS.map((t) => ({
    id: t.id,
    title: t.title,
    description: t.description,
    supportedTypes: t.fileTypes,
  })),
  null,
  2
)}

Core Guidelines:
1. SPECIFIC TOOL MATCHES (Crucial accuracy rule):
   - When the user asks for a specific function (e.g. "image to pdf", "compress photo", "split pdf", "rotate pdf", "make pdf black and white"):
     Identify and return ONLY the most relevant tool(s).
     DO NOT dump unrelated tools! For instance, if user asks "image to pdf", the ONLY or top recommendation must be "image-to-pdf". Do NOT suggest "image-compressor" as top tool!
2. GENERAL QUESTIONS ABOUT PDFBRO, PLATFORM, CREATOR (Abdul Aref), OR TOOLS:
   - If the user asks general questions like "what kind of tools we have", "what can this platform do", "tell me about this app", or questions about Abdul Aref / team:
     Provide a friendly, articulate overview of PDFBRO and its tool categories (PDF Editor, TXT Editor, Vocab Analyzer, Organize PDF, Convert to/from PDF, and Image utilities).
     Set hasTools: true and recommend "tools-hub" (Browse all 16 tools) and key studios.
3. UNSUPPORTED TASKS:
   - If the user asks for something outside PDFBRO (e.g. video editing, audio, 3D modeling, cryptocurrency):
     You MUST state "No tools for this task."
     Explain politely what PDFBRO specializes in and why we don't support the requested task.
     Return empty recommendedTools and hasTools: false.

Return valid JSON with:
{
  "hasTools": boolean,
  "assistantMessage": string,
  "recommendedTools": [
    {
      "id": string (must match an id from catalog),
      "matchReason": string (concise 1-sentence action reason for user request)
    }
  ]
}`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                hasTools: { type: Type.BOOLEAN },
                assistantMessage: { type: Type.STRING },
                recommendedTools: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      matchReason: { type: Type.STRING },
                    },
                    required: ['id', 'matchReason'],
                  },
                },
              },
              required: ['hasTools', 'assistantMessage', 'recommendedTools'],
            },
          },
        });

        const text = response.text;
        if (text) {
          const parsed = JSON.parse(text);
          const enrichedTools = (parsed.recommendedTools || [])
            .map((rec: { id: string; matchReason: string }) => {
              const catalogTool = CATALOG_TOOLS.find((t) => t.id === rec.id);
              if (!catalogTool) return null;
              return {
                ...catalogTool,
                matchReason: rec.matchReason || catalogTool.description,
              };
            })
            .filter(Boolean);

          return res.json({
            assistantMessage: parsed.assistantMessage,
            hasTools: parsed.hasTools && enrichedTools.length > 0,
            recommendedTools: enrichedTools,
          });
        }
      } catch (geminiError) {
        console.warn('Gemini API call failed, falling back to heuristic engine:', geminiError);
      }
    }

    // Fallback heuristic recommendations
    const fallback = getFallbackRecommendation(trimmedQuery, fileTypes);
    return res.json(fallback);
  } catch (err: any) {
    console.error('Error in /api/assistant:', err);
    return res.status(500).json({
      error: 'Failed to process assistant request',
      message: err.message,
    });
  }
});

// Setup Vite in development or static serving in production
async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`PDFBRO Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
