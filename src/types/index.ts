export type ImageQuality = 'standard' | 'hd' | 'low' | 'medium' | 'high' | 'auto';
export type ImageFormat = 'url' | 'png' | 'jpeg' | 'webp';
export type ImageSize = '256x256' | '512x512' | '1024x1024' | '1792x1024' | '1024x1792';
export type ImageModel = 'gpt-image-1' | 'dall-e-3';

export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  revised_prompt?: string;
  createdAt: Date;
  quality?: ImageQuality;
  format?: ImageFormat;
  transparency?: boolean;
  model: ImageModel;
}

export interface GenerateImageOptions {
  prompt: string;
  size?: ImageSize;
  n?: number;
  quality?: ImageQuality;
  format?: ImageFormat;
  transparency?: boolean;
  model?: ImageModel;
}

export interface EditImageOptions {
  image: string; // Base64 encoded image or URL
  prompt: string;
  mask?: string; // Optional base64 encoded mask
  size?: ImageSize;
  quality?: ImageQuality;
  format?: ImageFormat;
  transparency?: boolean;
  model?: ImageModel;
}

export interface CreateVariationOptions {
  image: string; // Base64 encoded image or URL
  n?: number;
  size?: ImageSize;
  quality?: ImageQuality;
  format?: ImageFormat;
  transparency?: boolean;
  model?: ImageModel;
}

export interface ImageGenerationProvider {
  generateImage(options: GenerateImageOptions): Promise<GeneratedImage>;
  editImage(options: EditImageOptions): Promise<GeneratedImage>;
  createVariation(options: CreateVariationOptions): Promise<GeneratedImage>;
  getSupportedSizes(): ImageSize[];
  getSupportedFormats(): ImageFormat[];
  getSupportedQualities(): ImageQuality[];
  getMaxImagesPerRequest(): number;
}