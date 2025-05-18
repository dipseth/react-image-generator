'use client';

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
  Center
} from '@mantine/core';
import useStore from '../../store';
import type { ImageSlice } from '../../store/slices/imageSlice';

export function ImageGallery() {
  // Use selectors to prevent unnecessary re-renders
  const images = useStore((state: ImageSlice) => state.images);
  const isHydrating = useStore((state: ImageSlice) => state.operationState.isHydrating);

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
    <SimpleGrid
      cols={{ base: 1, sm: 2, lg: 3 }}
      spacing="md"
      verticalSpacing="md"
    >
      {images.map((image) => (
        <Card key={image.id} shadow="sm" padding="md" radius="md" withBorder>
          <Card.Section>
            <Image
              src={image.url}
              alt={image.prompt}
              height={300}
              fit="cover"
              fallbackSrc="/placeholder-image.svg"
              loading="lazy"
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
  );
}