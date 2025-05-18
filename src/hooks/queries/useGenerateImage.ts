import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo, useCallback } from 'react';
import { useAppConfig } from '../../config';
import { getImageProvider } from '../../services/imageGeneration';
import useStore from '../../store';
import type { GenerateImageOptions } from '../../types';

export function useGenerateImage() {
  const queryClient = useQueryClient();
  const config = useAppConfig();
  const provider = useMemo(() => getImageProvider(config), [config]);
  
  // Get store actions with useCallback to prevent unnecessary re-renders
  const addImage = useCallback(useStore.getState().addImage, []);
  const setGenerating = useCallback(useStore.getState().setGenerating, []);
  const setError = useCallback(useStore.getState().setError, []);

  return useMutation({
    mutationKey: ['generateImage'],
    mutationFn: async (options: GenerateImageOptions) => {
      try {
        return await provider.generateImage(options);
      } catch (error) {
        if (error instanceof Error) {
          throw error;
        }
        throw new Error('Failed to generate image');
      }
    },
    onMutate: () => {
      setGenerating(true);
      setError(null);
    },
    onSuccess: (data) => {
      addImage(data);
      queryClient.invalidateQueries({ queryKey: ['images'] });
    },
    onError: (error: Error) => {
      setError(error.message);
    },
    onSettled: () => {
      setGenerating(false);
    },
    retry: 1,
    retryDelay: 1000,
  });
}