import type { AppConfig, ImageGenerationDefaults } from '../types/config';

/**
 * Default settings for GPT Image model
 */
const gptImageDefaults: ImageGenerationDefaults = {
  model: 'gpt-image-1',
  quality: 'standard',
  format: 'url',
  size: '1024x1024',
  transparency: false
};

/**
 * Application configuration
 */
export const config: AppConfig = {
  imageProvider: 'openai',
  openai: {
    apiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
    defaults: gptImageDefaults
  }
};

/**
 * Hook to access the application configuration
 * @returns The application configuration
 */
export function useAppConfig() {
  return config;
}