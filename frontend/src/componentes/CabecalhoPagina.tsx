import { Group, Stack, Text, Title } from '@mantine/core';
import type { ReactNode } from 'react';

interface Props {
  titulo: string;
  descricao: string;
  acoes?: ReactNode;
}

export function CabecalhoPagina({ titulo, descricao, acoes }: Props) {
  return (
    <Group justify="space-between" align="flex-end" mb="lg" gap="md">
      <Stack gap={4}>
        <Title order={2}>{titulo}</Title>
        <Text c="dimmed" size="sm" maw={640}>
          {descricao}
        </Text>
      </Stack>
      {acoes}
    </Group>
  );
}
