'use client';

import { useState } from 'react';
import {
  TextInput,
  Button,
  Stack,
  Group,
  Card,
  Title,
  Alert,
  Select,
  LoadingOverlay,
  Divider,
  Box,
  Tooltip
} from '@mantine/core';
/* If @tabler/icons-react is not installed, use emoji in labels as fallback for icons */
import { useGenerateImage } from '../../hooks/queries/useGenerateImage';
import useStore from '../../store';
import type { ImageSlice } from '../../store/slices/imageSlice';

const SIZE_OPTIONS = [
  { value: '256x256', label: '256x256' },
  { value: '512x512', label: '512x512' },
  { value: '1024x1024', label: '1024x1024' },
  { value: '1792x1024', label: '1792x1024' },
  { value: '1024x1792', label: '1024x1792' }
];

const MODEL_OPTIONS = [
  { value: 'gpt-image-1', label: 'GPT Image' },
  { value: 'dall-e-3', label: 'DALL-E 3' }
];

// Define quality options for each model
const GPT_IMAGE_QUALITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'auto', label: 'Auto' }
];

const DALLE_QUALITY_OPTIONS = [
  { value: 'standard', label: 'Standard' },
  { value: 'hd', label: 'HD' }
];

const FORMAT_OPTIONS = [
  { value: 'url', label: 'URL' },
  { value: 'png', label: 'PNG' },
  { value: 'jpeg', label: 'JPEG' },
  { value: 'webp', label: 'WEBP' }
];

export function ImageGenerator() {
  const [prompt, setPrompt] = useState('');
  const [size, setSize] = useState<string>('1024x1024');
  const [model, setModel] = useState<string>('gpt-image-1');
  const [quality, setQuality] = useState<string>('auto'); // Default to 'auto' for gpt-image-1
  const [format, setFormat] = useState<string>('url');
  const [transparency, setTransparency] = useState<boolean>(false);

  const { mutate, isPending } = useGenerateImage();
  
  // Use separate selectors to minimize re-renders
  const isGenerating = useStore((state: ImageSlice) => state.operationState.isGenerating);
  const error = useStore((state: ImageSlice) => state.operationState.error);
  const setError = useStore((state: ImageSlice) => state.setError);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      mutate({
        prompt,
        size: size as any,
        model: model as any,
        quality: quality as any,
        format: format as any,
        transparency
      });
    }
  };

  return (
    <Card shadow="md" radius="lg" p="xl" withBorder style={{ maxWidth: 520, margin: '0 auto' }}>
      <Group mb="md" align="center" gap="xs">
        <span style={{ fontSize: 28 }} role="img" aria-label="photo">🖼️</span>
        <Title order={2} style={{ flex: 1 }}>Generate Image</Title>
        <Tooltip label="Image generation settings">
          <span style={{ fontSize: 22 }} role="img" aria-label="settings">⚙️</span>
        </Tooltip>
      </Group>
      <Divider mb="md" />
      <form onSubmit={handleSubmit}>
        <Stack gap="sm">
          {error && (
            <Alert
              color="red"
              title="Error"
              withCloseButton
              closeButtonLabel="Dismiss"
              onClose={() => setError(null)}
              mb="sm"
            >
              {error}
            </Alert>
          )}

          <Box mb="xs">
            <TextInput
              label="🪄 Image Description"
              description="Describe the image you want to generate"
              placeholder="A cyberpunk city with neon lights and flying cars"
              value={prompt}
              onChange={(e) => setPrompt(e.currentTarget.value)}
              disabled={isGenerating}
              required
              radius="md"
              size="md"
              autoFocus
            />
          </Box>

          <Group grow gap="xs" mb="xs">
            <Select
              label="🎨 Size"
              value={size}
              onChange={(value) => setSize(value || '1024x1024')}
              data={SIZE_OPTIONS}
              disabled={isGenerating}
              radius="md"
              size="sm"
            />
            <Select
              label="🤖 Model"
              value={model}
              onChange={(value) => {
                const newModel = value || 'gpt-image-1';
                setModel(newModel);
                // Update quality to appropriate default when model changes
                setQuality(newModel === 'gpt-image-1' ? 'auto' : 'standard');
              }}
              data={MODEL_OPTIONS}
              disabled={isGenerating}
              radius="md"
              size="sm"
            />
          </Group>

          <Group grow gap="xs" mb="xs">
            <Select
              label="✨ Quality"
              value={quality}
              onChange={(value) => setQuality(value || (model === 'gpt-image-1' ? 'auto' : 'standard'))}
              data={model === 'gpt-image-1' ? GPT_IMAGE_QUALITY_OPTIONS : DALLE_QUALITY_OPTIONS}
              disabled={isGenerating}
              radius="md"
              size="sm"
            />
            <Select
              label="🖼️ Format"
              value={format}
              onChange={(value) => setFormat(value || 'url')}
              data={FORMAT_OPTIONS}
              disabled={isGenerating}
              radius="md"
              size="sm"
            />
          </Group>

          <Group mb="xs">
            <label style={{ display: 'flex', alignItems: 'center', fontWeight: 500 }}>
              <input
                type="checkbox"
                checked={transparency}
                onChange={(e) => setTransparency(e.target.checked)}
                disabled={isGenerating}
                style={{ marginRight: 8 }}
              />
              Transparent background
            </label>
          </Group>

          <Divider my="xs" />

          <Group justify="flex-end">
            <Button
              type="submit"
              loading={isGenerating}
              disabled={!prompt.trim() || isGenerating}
              size="md"
              radius="md"
              style={{ minWidth: 120 }}
            >
              🪄 Generate
            </Button>
          </Group>
        </Stack>
      </form>
      <div style={{ position: 'relative', minHeight: '200px', marginTop: '1rem' }}>
        <LoadingOverlay visible={isPending || isGenerating} />
      </div>
    </Card>
  );
}