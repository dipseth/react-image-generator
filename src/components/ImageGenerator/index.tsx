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
  Tooltip,
  Collapse,
  ActionIcon,
  Paper
} from '@mantine/core';
/* If @tabler/icons-react is not installed, use emoji in labels as fallback for icons */
import { useLocalStorage } from '@mantine/hooks';
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
  
  // State for collapsible advanced parameters
  const [showAdvanced, setShowAdvanced] = useLocalStorage({
    key: 'image-generator-show-advanced',
    defaultValue: false,
  });

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
    <Paper
      shadow="md"
      radius="lg"
      withBorder
      style={{
        position: 'fixed',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: '800px',
        zIndex: 1000,
        padding: '12px 16px',
        backdropFilter: 'blur(10px)',
        backgroundColor: 'var(--mantine-color-body)',
        border: '1px solid var(--mantine-color-gray-3)',
        borderBottom: 'none',
        borderRadius: '16px 16px 0 0',
        boxShadow: '0 -4px 12px rgba(0, 0, 0, 0.1)',
        transition: 'all 0.3s ease'
      }}
    >
      <form onSubmit={handleSubmit}>
        {error && (
          <Alert
            color="red"
            title="Error"
            withCloseButton
            closeButtonLabel="Dismiss"
            onClose={() => setError(null)}
            mb="sm"
            style={{
              position: 'absolute',
              bottom: '100%',
              left: 0,
              right: 0,
              zIndex: 1001,
              maxWidth: '800px',
              margin: '0 auto'
            }}
          >
            {error}
          </Alert>
        )}

        <Group align="flex-start" gap="md" wrap="nowrap">
          {/* Main prompt input and generate button */}
          <Box style={{ flex: 1 }}>
            <TextInput
              placeholder="Describe the image you want to generate..."
              value={prompt}
              onChange={(e) => setPrompt(e.currentTarget.value)}
              disabled={isGenerating}
              required
              radius="md"
              size="md"
              autoFocus
              rightSection={
                <Tooltip
                  label={showAdvanced ? "Hide advanced options" : "Show advanced options"}
                  position="top"
                  withArrow
                  arrowPosition="center"
                  offset={12}
                  zIndex={1002}
                >
                  <ActionIcon
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    variant="subtle"
                    color="gray"
                    aria-label="Toggle advanced options"
                  >
                    <span style={{ fontSize: 18 }} role="img" aria-label="settings">
                      {showAdvanced ? '🔼' : '⚙️'}
                    </span>
                  </ActionIcon>
                </Tooltip>
              }
            />
          </Box>

          <Button
            type="submit"
            loading={isGenerating}
            disabled={!prompt.trim() || isGenerating}
            size="md"
            radius="md"
          >
            🪄 Generate
          </Button>
        </Group>

        <Collapse in={showAdvanced}>
          <Box 
            mt="md"
            style={{
              position: 'relative',
              zIndex: 1500
            }}
          >
            <Group grow gap="xs" mb="xs">
              <Select
                label="🎨 Size"
                value={size}
                onChange={(value) => setSize(value || '1024x1024')}
                data={SIZE_OPTIONS}
                disabled={isGenerating}
                radius="md"
                size="sm"
                styles={{
                  dropdown: {
                    zIndex: 2000
                  }
                }}
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
                styles={{
                  dropdown: {
                    zIndex: 2000
                  }
                }}
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
                styles={{
                  dropdown: {
                    zIndex: 2000
                  }
                }}
              />
              <Select
                label="🖼️ Format"
                value={format}
                onChange={(value) => setFormat(value || 'url')}
                data={FORMAT_OPTIONS}
                disabled={isGenerating}
                radius="md"
                size="sm"
                styles={{
                  dropdown: {
                    zIndex: 2000
                  }
                }}
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
          </Box>
        </Collapse>
      </form>
      
      {(isPending || isGenerating) && (
        <LoadingOverlay
          visible={true}
          style={{
            position: 'absolute',
            top: '-50px',
            left: 0,
            right: 0,
            height: '50px',
            borderRadius: '16px 16px 0 0',
            zIndex: 1001,
            maxWidth: '800px',
            margin: '0 auto'
          }}
        />
      )}
    </Paper>
  );
}