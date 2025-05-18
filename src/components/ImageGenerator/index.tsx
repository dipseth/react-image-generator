'use client';

import { useState } from 'react';
import {
  TextInput,
  Button,
  Stack,
  Group,
  Paper,
  Title,
  Alert,
  Select,
  LoadingOverlay
} from '@mantine/core';
import { useGenerateImage } from '../../hooks/queries/useGenerateImage';
import useStore from '../../store';
import type { ImageSlice } from '../../store/slices/imageSlice';

const SIZE_OPTIONS = [
  { value: '256x256', label: '256x256' },
  { value: '512x512', label: '512x512' },
  { value: '1024x1024', label: '1024x1024' }
];

export function ImageGenerator() {
  const [prompt, setPrompt] = useState('');
  const [size, setSize] = useState<string>('1024x1024');
  const { mutate, isPending } = useGenerateImage();
  
  // Use separate selectors to minimize re-renders
  const isGenerating = useStore((state: ImageSlice) => state.isGenerating);
  const error = useStore((state: ImageSlice) => state.error);
  const setError = useStore((state: ImageSlice) => state.setError);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      mutate({ prompt, size: size as '256x256' | '512x512' | '1024x1024' });
    }
  };

  return (
    <Paper p="md" radius="md" withBorder>
      <Title order={2} mb="md">Generate Image</Title>
      
      <form onSubmit={handleSubmit}>
        <Stack>
          {error && (
            <Alert
              color="red"
              title="Error"
              withCloseButton
              closeButtonLabel="Dismiss"
              onClose={() => setError(null)}
            >
              {error}
            </Alert>
          )}
          
          <TextInput
            label="Image Description"
            description="Describe the image you want to generate"
            placeholder="A cyberpunk city with neon lights and flying cars"
            value={prompt}
            onChange={(e) => setPrompt(e.currentTarget.value)}
            disabled={isGenerating}
            required
          />

          <Select
            label="Image Size"
            value={size}
            onChange={(value) => setSize(value || '1024x1024')}
            data={SIZE_OPTIONS}
            disabled={isGenerating}
          />
          
          <Group justify="flex-end">
            <Button
              type="submit"
              loading={isGenerating}
              disabled={!prompt.trim() || isGenerating}
            >
              Generate
            </Button>
          </Group>
        </Stack>
      </form>
      
      <div style={{ position: 'relative', minHeight: '200px', marginTop: '1rem' }}>
        <LoadingOverlay visible={isPending || isGenerating} />
      </div>
    </Paper>
  );
}