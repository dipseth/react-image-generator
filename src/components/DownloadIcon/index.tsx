'use client';

import { useState } from 'react';
import { ActionIcon, Tooltip, Loader } from '@mantine/core';
import { IconDownload } from '@tabler/icons-react';
import { downloadImageFromUrl, generateFilenameFromPrompt } from '../../utils/imageDownload';

interface DownloadIconProps {
  imageUrl: string;
  prompt: string;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  size?: number;
  tooltipLabel?: string;
}

export function DownloadIcon({
  imageUrl,
  prompt,
  position = 'top-right',
  size = 18,
  tooltipLabel = 'Download image'
}: DownloadIconProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  // Calculate position styles based on the position prop
  const getPositionStyles = () => {
    switch (position) {
      case 'top-left':
        return { top: 8, left: 8 };
      case 'bottom-right':
        return { bottom: 8, right: 8 };
      case 'bottom-left':
        return { bottom: 8, left: 8 };
      case 'top-right':
      default:
        return { top: 8, right: 8 };
    }
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event bubbling to parent elements
    
    if (isDownloading) return;
    
    try {
      setIsDownloading(true);
      const filename = generateFilenameFromPrompt(prompt);
      await downloadImageFromUrl(imageUrl, filename);
    } catch (error) {
      console.error('Failed to download image:', error);
      // Could add notification here for error feedback
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Tooltip label={tooltipLabel} position="top" withArrow>
      <ActionIcon
        variant="transparent"
        color="white"
        onClick={handleDownload}
        aria-label="Download image"
        style={{
          position: 'absolute',
          ...getPositionStyles(),
          backgroundColor: 'rgba(0, 0, 0, 0.2)',
          borderRadius: '4px',
          transition: 'all 0.2s ease',
          opacity: 0.8,
          '&:hover': {
            opacity: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            transform: 'scale(1.05)'
          }
        }}
        disabled={isDownloading}
      >
        {isDownloading ? <Loader size={size} color="white" /> : <IconDownload size={size} />}
      </ActionIcon>
    </Tooltip>
  );
}