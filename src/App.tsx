import '@mantine/core/styles.css';
// Add tabler icons for dark mode toggle
import { MantineProvider, Container, Stack, ActionIcon, Group } from '@mantine/core';
// If @tabler/icons-react is not installed, use emoji fallback for icons
let IconSun: React.FC<{ size?: number }> = () => <span role="img" aria-label="sun">🌞</span>;
let IconMoon: React.FC<{ size?: number }> = () => <span role="img" aria-label="moon">🌙</span>;
try {
  // @ts-ignore
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const icons = require('@tabler/icons-react');
  IconSun = icons.IconSun;
  IconMoon = icons.IconMoon;
} catch {}
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ImageGenerator } from './components/ImageGenerator';
import { ImageGallery } from './components/ImageGallery';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1
    }
  }
});

import type { MantineThemeOverride } from '@mantine/core';

const theme: MantineThemeOverride = {
  primaryColor: 'blue',
  defaultRadius: 'md',
  fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
  colors: {
    dark: [
      '#C1C2C5',
      '#A6A7AB',
      '#909296',
      '#5C5F66',
      '#373A40',
      '#2C2E33',
      '#25262B',
      '#1A1B1E',
      '#141517',
      '#101113',
    ],
    light: [
      '#F8F9FA',
      '#F1F3F5',
      '#E9ECEF',
      '#DEE2E6',
      '#CED4DA',
      '#ADB5BD',
      '#868E96',
      '#495057',
      '#343A40',
      '#212529',
    ],
  },
  components: {
    Paper: {
      styles: {
        root: {
          backgroundColor: 'var(--mantine-color-body)'
        }
      }
    }
  }
};

import { useState, useEffect } from 'react';

function App() {
  const [colorScheme, setColorScheme] = useState<'light' | 'dark'>('light');
  const toggleColorScheme = () =>
    setColorScheme((prev: 'light' | 'dark') => (prev === 'dark' ? 'light' : 'dark'));

  // Set the color scheme globally on the body for Mantine v6+
  useEffect(() => {
    document.body.setAttribute('data-mantine-color-scheme', colorScheme);
    document.body.style.backgroundColor = colorScheme === 'dark'
      ? 'var(--mantine-color-dark-7)'
      : 'var(--mantine-color-gray-0)';
  }, [colorScheme]);

  return (
    <QueryClientProvider client={queryClient}>
      <MantineProvider
        theme={theme}
        forceColorScheme={colorScheme}
      >
        {/* Set color scheme globally on body */}
        {(() => {
          // This IIFE is a hack to allow hooks at the top level
          // We'll use useEffect below for the real implementation
          return null;
        })()}
        <Container size="lg" py="xl" style={{ paddingBottom: 'calc(80px + var(--mantine-spacing-xl))' }}>
          <Stack gap="xl">
            <Group justify="flex-end">
              <ActionIcon
                variant="outline"
                color={colorScheme === 'dark' ? 'yellow' : 'blue'}
                onClick={toggleColorScheme}
                title="Toggle color scheme"
                size="lg"
                aria-label="Toggle dark mode"
              >
                {colorScheme === 'dark' ? <IconSun size={20} /> : <IconMoon size={20} />}
              </ActionIcon>
            </Group>
            <ImageGallery />
          </Stack>
        </Container>
        <ImageGenerator />
      </MantineProvider>
    </QueryClientProvider>
  );
}

export default App;
