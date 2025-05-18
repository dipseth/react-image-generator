import type { AppConfig } from '../types/config';

export const config: AppConfig = {
  imageProvider: 'openai',
  openai: {
    apiKey: import.meta.env.VITE_OPENAI_API_KEY || ''
  }
};

export function useAppConfig() {
  return config;
}