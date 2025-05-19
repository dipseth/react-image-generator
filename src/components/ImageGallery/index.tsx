'use client';

import { useState } from 'react';
import {
  SimpleGrid,
  Card,
  Image,
  Text,
  Group,
  Paper,
  Title,
  Stack,
  Loader,
  Center,
  ActionIcon,
  Modal,
  Box,
  Tooltip
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconDeviceTv, IconMaximize, IconX } from '@tabler/icons-react';
import useStore from '../../store';
import type { ImageSlice } from '../../store/slices/imageSlice';
import type { GeneratedImage } from '../../types';
import { notifyTV } from '../../utils/tvIntegration';
import { config } from '../../config';
import { DownloadIcon } from '../DownloadIcon';

// Diagnostic log: Check if ImageGallery is being rendered as a standalone page or within another component
console.log('[ImageGallery] Rendered. Location:', window?.location?.pathname);
export function ImageGallery() {
  // State for fullscreen modal
  const [fullscreenImage, setFullscreenImage] = useState<GeneratedImage | null>(null);
  const [isPostingToTV, setIsPostingToTV] = useState(false);
  const [tvPostStatus, setTvPostStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [tvError, setTvError] = useState<string | null>(null);
  
  // Use selectors to prevent unnecessary re-renders
  const images = useStore((state: ImageSlice) => state.images);
  const isHydrating = useStore((state: ImageSlice) => state.operationState.isHydrating);
  
  // Handle opening fullscreen modal
  const openFullscreen = (image: GeneratedImage) => {
    setFullscreenImage(image);
  };
  
  // Handle closing fullscreen modal
  const closeFullscreen = () => {
    setFullscreenImage(null);
  };

  // Show loading state during hydration
  if (isHydrating) {
    return (
      <Center py="xl">
        <Stack align="center" gap="md">
          <Loader size="md" />
          <Text c="dimmed">Loading your images...</Text>
        </Stack>
      </Center>
    );
  }

  if (images.length === 0) {
    return (
      <Paper p="xl" radius="md" withBorder>
        <Stack align="center" gap="md">
          <Title order={3} c="dimmed">No Images Yet</Title>
          <Text c="dimmed">Generated images will appear here</Text>
        </Stack>
      </Paper>
    );
  }

  return (
    <>
      <SimpleGrid
        cols={{ base: 1, sm: 2, lg: 3 }}
        spacing="md"
        verticalSpacing="md"
      >
        {images.map((image) => (
          <Card key={image.id} shadow="sm" padding="md" radius="md" withBorder>
            <Card.Section style={{ position: 'relative' }}>
              <Image
                src={image.url}
                alt={image.prompt}
                height={300}
                fit="cover"
                fallbackSrc="/placeholder-image.svg"
                loading="lazy"
              />
              
              {/* Semi-transparent action icons */}
              <Box
                style={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  display: 'flex',
                  gap: '8px',
                  background: 'rgba(0, 0, 0, 0.2)',
                  borderRadius: '4px',
                  padding: '4px'
                }}
              >
                <Tooltip label="View fullscreen" position="top" withArrow>
                  <ActionIcon
                    variant="transparent"
                    color="white"
                    onClick={() => openFullscreen(image)}
                    aria-label="View fullscreen"
                  >
                    <IconMaximize size={18} />
                  </ActionIcon>
                </Tooltip>
              </Box>
              
              {/* Download icon - positioned separately for better UX */}
              <DownloadIcon
                imageUrl={image.url}
                prompt={image.prompt}
                position="bottom-right"
              />
            </Card.Section>

            <Stack mt="md" gap={4}>
              <Text fw={500} size="sm" lineClamp={2}>
                {image.prompt}
              </Text>
              {image.revised_prompt && image.revised_prompt !== image.prompt && (
                <Text size="xs" c="dimmed" lineClamp={2}>
                  Revised: {image.revised_prompt}
                </Text>
              )}
              <Group mt={4}>
                <Text size="xs" c="dimmed">
                  {new Date(image.createdAt).toLocaleDateString()}
                </Text>
              </Group>
            </Stack>
          </Card>
        ))}
      </SimpleGrid>

      {/* Fullscreen Modal */}
      {fullscreenImage && (
        <>
          {/* Diagnostic log: TV integration config and fullscreen modal state */}
          {console.log('[ImageGallery] Fullscreen modal opened. TV config:', config.tv, 'VITE_TV_ENABLED:', import.meta.env.VITE_TV_ENABLED)}
          <Modal
            opened={!!fullscreenImage}
            onClose={() => {
              setTvPostStatus('idle');
              setTvError(null);
              closeFullscreen();
            }}
            size="100%"
            fullScreen
            transitionProps={{ transition: 'fade', duration: 200 }}
            withCloseButton={false}
            styles={{
              root: {
                zIndex: 2000 // Higher than the ImageGenerator component
              },
              body: {
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100vh',
                padding: 0,
                position: 'relative'
              }
            }}
          >
            {/* X icon for closing is already present */}
            <ActionIcon
              variant="filled"
              color="dark"
              radius="xl"
              size="lg"
              style={{
                position: 'absolute',
                top: 16,
                right: 16,
                zIndex: 1000,
                opacity: 0.7
              }}
              onClick={() => {
                setTvPostStatus('idle');
                setTvError(null);
                closeFullscreen();
              }}
              aria-label="Close fullscreen view"
            >
              <IconX size={18} />
            </ActionIcon>

            {/* TV icon, only if enabled and server URL is set */}
            {(config.tv?.enabled && config.tv?.serverUrl) && (
              <Tooltip label="Send to TV" position="top" withArrow>
                <ActionIcon
                  variant="filled"
                  color="blue"
                  radius="xl"
                  size="lg"
                  style={{
                    position: 'absolute',
                    top: 16,
                    right: 60,
                    zIndex: 1000,
                    opacity: 0.85
                  }}
                  onClick={async () => {
                    if (!fullscreenImage) return;
                    setIsPostingToTV(true);
                    setTvPostStatus('idle');
                    setTvError(null);
                    try {
                      await notifyTV(fullscreenImage);
                      setTvPostStatus('success');
                    } catch (err) {
                      setTvPostStatus('error');
                      setTvError(err instanceof Error ? err.message : 'Unknown error');
                    } finally {
                      setIsPostingToTV(false);
                    }
                  }}
                  aria-label="Send image to TV"
                  disabled={isPostingToTV}
                >
                  {isPostingToTV ? <Loader size={18} color="white" /> : <IconDeviceTv size={18} />}
                </ActionIcon>
              </Tooltip>
            )}

            <Box style={{ position: 'relative' }}>
              <Image
                src={fullscreenImage.url}
                alt={fullscreenImage.prompt}
                fit="contain"
                style={{ maxHeight: '90vh', maxWidth: '90vw' }}
              />
              
              {/* Download icon for fullscreen view */}
              <DownloadIcon
                imageUrl={fullscreenImage.url}
                prompt={fullscreenImage.prompt}
                position="bottom-right"
                size={24}
              />
            </Box>

            {/* TV integration feedback */}
            {tvPostStatus === 'success' && (
              <Text
                size="sm"
                style={{
                  position: 'absolute',
                  top: 60,
                  right: 16,
                  background: 'rgba(0, 128, 0, 0.8)',
                  color: 'white',
                  borderRadius: 4,
                  padding: '6px 12px',
                  zIndex: 1100
                }}
              >
                Sent to TV!
              </Text>
            )}
            {tvPostStatus === 'error' && (
              <Text
                size="sm"
                style={{
                  position: 'absolute',
                  top: 60,
                  right: 16,
                  background: 'rgba(200, 0, 0, 0.85)',
                  color: 'white',
                  borderRadius: 4,
                  padding: '6px 12px',
                  zIndex: 1100
                }}
              >
                TV Error: {tvError}
              </Text>
            )}

            <Text
              size="sm"
              style={{
                position: 'absolute',
                bottom: 16,
                left: 0,
                right: 0,
                textAlign: 'center',
                background: 'rgba(0, 0, 0, 0.5)',
                color: 'white',
                padding: '8px'
              }}
            >
              {fullscreenImage.prompt}
            </Text>
          </Modal>
        </>
      )}
    </>
  );
}