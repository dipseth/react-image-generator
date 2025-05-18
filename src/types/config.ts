export type ImageProviderType = 'openai' | 'stabilityai';

/**
 * Default image generation settings
 */
export interface ImageGenerationDefaults {
  model: 'gpt-image-1' | 'dall-e-3';
  quality?: 'standard' | 'hd';
  format?: 'url' | 'png' | 'jpeg' | 'webp';
  size?: '256x256' | '512x512' | '1024x1024' | '1792x1024' | '1024x1792';
  transparency?: boolean;
}

/**
 * Application configuration
 */
export interface AppConfig {
  imageProvider: ImageProviderType;
  openai: {
    apiKey: string;
    defaults?: ImageGenerationDefaults;
  };
  stabilityai?: {
    apiKey: string;
    defaults?: ImageGenerationDefaults;
  };
}