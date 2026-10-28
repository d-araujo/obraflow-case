import { Button, Group, Stack, Text } from '@mantine/core';
import { IconCheck, IconX } from '@tabler/icons-react';
import type { PedidoResumo } from '../../api/tipos';
import { motivoDeBloqueio } from '../../comum/decisao';

interface Props {
  pedido: PedidoResumo;
  usuarioId: number | null;
  decidindo: boolean;
  aoAprovar: () => void;
  aoRejeitar: () => void;
  tamanho?: 'xs' | 'sm';
}

export function AcoesDecisao({
  pedido,
  usuarioId,
  decidindo,
  aoAprovar,
  aoRejeitar,
  tamanho = 'xs',
}: Props) {
  const bloqueio = motivoDeBloqueio(pedido, usuarioId);
  return (
    <Stack gap={4} onClick={(evento) => evento.stopPropagation()}>
      <Group gap={6} wrap="nowrap">
        <Button
          size={tamanho}
          color="teal"
          leftSection={<IconCheck size={14} />}
          disabled={bloqueio !== null}
          loading={decidindo}
          onClick={aoAprovar}
        >
          Aprovar
        </Button>
        <Button
          size={tamanho}
          color="red"
          variant="light"
          leftSection={<IconX size={14} />}
          disabled={bloqueio !== null || decidindo}
          onClick={aoRejeitar}
        >
          Rejeitar
        </Button>
      </Group>
      {bloqueio && (
        <Text size="xs" c="dimmed" maw={240}>
          {bloqueio}
        </Text>
      )}
    </Stack>
  );
}
