import { NextRequest, NextResponse } from 'next/server';
// @ts-ignore
import mammoth from 'mammoth';

const PROMPT = `
You are an expert recruiter AI for RIE-AGL Careers. Extract the job specification details from the provided document.
Output the data in JSON format matching the schema requested.

Extraction instructions:
1. "title": The job title of the position.
2. "summary": A brief, one-sentence description summarizing the role (maximum 200 characters).
3. "description": A full, detailed job description. Use HTML tags for rich formatting (like <p>, <ul>, <li>, <strong>). Ensure it is styled nicely, uses clear paragraph breaks, and doesn't contain markdown formatting.
4. "requirements": A plain text string containing essential requirements, each on a new line (use standard bullet points starting with a bullet character "• " or similar).
5. "division": Must map to one of: "Port", "Rail", or "Logistics". If not specified, infer based on context.
6. "region": Must map to one of: "West Africa", "East Africa", "Southern Africa", "Central Africa", "North Africa".
7. "location": The city where the job is located.
8. "country": The country where the job is located.
9. "employmentType": Must map to one of: "full_time" (Full Time), "contract" (Contract), "internship" (Internship).
10. "experienceLevel": Must map to one of: "Entry", "Mid", "Senior", "Executive".

Be extremely consistent with the enums. If the document does not specify a field, use your best judgment to infer it or use standard industry conventions.
`;

const SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    summary: { type: 'string' },
    description: { type: 'string' },
    requirements: { type: 'string' },
    division: {
      type: 'string',
      enum: ['Port', 'Rail', 'Logistics'],
    },
    region: {
      type: 'string',
      enum: ['West Africa', 'East Africa', 'Southern Africa', 'Central Africa', 'North Africa'],
    },
    location: { type: 'string' },
    country: { type: 'string' },
    employmentType: {
      type: 'string',
      enum: ['full_time', 'contract', 'internship'],
    },
    experienceLevel: {
      type: 'string',
      enum: ['Entry', 'Mid', 'Senior', 'Executive'],
    },
  },
  required: [
    'title',
    'summary',
    'description',
    'requirements',
    'division',
    'region',
    'location',
    'country',
    'employmentType',
    'experienceLevel',
  ],
};

async function callGeminiWithPdf(base64Data: string, apiKey: string) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              inlineData: {
                mimeType: 'application/pdf',
                data: base64Data,
              },
            },
            {
              text: PROMPT,
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.1,
        responseSchema: SCHEMA,
      },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Gemini API returned status ${response.status}: ${text}`);
  }

  const result = await response.json();
  const jsonText = result.candidates[0].content.parts[0].text;
  return JSON.parse(jsonText);
}

async function callGeminiWithText(text: string, apiKey: string) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: `${PROMPT}\n\nHere is the job specification text:\n\n${text}`,
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.1,
        responseSchema: SCHEMA,
      },
    }),
  });

  if (!response.ok) {
    const responseText = await response.text();
    throw new Error(`Gemini API returned status ${response.status}: ${responseText}`);
  }

  const result = await response.json();
  const jsonText = result.candidates[0].content.parts[0].text;
  return JSON.parse(jsonText);
}

export async function POST(req: NextRequest) {
  try {
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      return NextResponse.json(
        { success: false, error: 'GEMINI_API_KEY is not configured on the server.' },
        { status: 500 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file uploaded.' },
        { status: 400 }
      );
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const fileName = file.name.toLowerCase();

    let geminiResponse;

    if (fileName.endsWith('.pdf')) {
      const base64Data = fileBuffer.toString('base64');
      geminiResponse = await callGeminiWithPdf(base64Data, geminiApiKey);
    } else if (fileName.endsWith('.docx')) {
      const extractResult = await mammoth.extractRawText({ buffer: fileBuffer });
      const docxText = extractResult.value;
      if (!docxText || !docxText.trim()) {
        throw new Error('Word document contains no extractable text.');
      }
      geminiResponse = await callGeminiWithText(docxText, geminiApiKey);
    } else {
      return NextResponse.json(
        { success: false, error: 'Unsupported file format. Please upload a PDF or DOCX file.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: geminiResponse,
    });

  } catch (error) {
    console.error('[POST /api/jobs/parse-spec] Error parsing job spec:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
