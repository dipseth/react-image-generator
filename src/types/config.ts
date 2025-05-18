export type ImageProviderType = 'openai' | 'stabilityai';

export interface AppConfig {
  imageProvider: ImageProviderType;
  openai: {
    apiKey: string;
  };
  stabilityai?: {
    apiKey: string;
  };
}