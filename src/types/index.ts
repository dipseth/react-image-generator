export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  revised_prompt?: string;
  createdAt: Date;
}

export interface GenerateImageOptions {
  prompt: string;
  size?: '256x256' | '512x512' | '1024x1024';
  n?: number;
}

export interface ImageGenerationProvider {
  generateImage(options: GenerateImageOptions): Promise<GeneratedImage>;
  getSupportedSizes(): string[];
  getSupportedFormats(): string[];
  getMaxImagesPerRequest(): number;
}