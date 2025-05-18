import '@mantine/core/styles.css';
import { MantineProvider, Container, Stack } from '@mantine/core';
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

const theme = {
  primaryColor: 'blue',
  defaultRadius: 'md',
  fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
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

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <MantineProvider theme={theme}>
        <Container size="lg" py="xl">
          <Stack gap="xl">
            <ImageGenerator />
            <ImageGallery />
          </Stack>
        </Container>
      </MantineProvider>
    </QueryClientProvider>
  );
}

export default App;
