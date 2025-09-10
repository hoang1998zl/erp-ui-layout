
// src/integrations/ocr/types.ts
export type Provider = 'google_vision'|'aws_textract'|'azure_cognitive'|'tesseract'|'fpt_ai'|'mock';

export type OCRConfig = {
  provider: Provider;
  defaultLanguage: 'vi'|'en';
  // generic
  apiKey?: string;
  endpoint?: string;
  region?: string;
  // aws
  accessKeyId?: string;
  secretAccessKey?: string;
};

export type OcrOptions = {
  language?: 'vi'|'en';
  docType?: 'invoice'|'receipt'|'id'|'generic';
  normalize?: boolean;
};

export type Field = { key: string; label?: string; value: string; confidence: number; bbox?: [number,number,number,number]; page?: number };

export type OCRResult = {
  provider: Provider;
  model?: string;
  durationMs: number;
  pages: number;
  text: string;
  fields: Field[];
  warnings?: string[];
};
