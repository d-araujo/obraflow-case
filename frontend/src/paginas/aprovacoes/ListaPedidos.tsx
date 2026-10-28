import {
  Group,
  Paper,
  Stack,
  Table,
  Text,
  UnstyledButton,
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import type { PedidoResumo } from '../../api/tipos';
import { Alcada } from '../../componentes/Alcada';
import { BadgeStatus } from '../../componentes/BadgeStatus';
import { formatarReais } from '../../comum/dinheiro';
import { formatarData } from '../../comum/rotulos';
import { AcoesDecisao } from './AcoesDecisao';

interface Props {
  pedidos: PedidoResumo[];
  usuarioId: number | null;
  decidindoId: number | null;
  aoAbrir: (id: number) => void;
  aoAprovar: (pedido: PedidoResumo) => void;
  aoRejeitar: (pedido: PedidoResumo) => void;
}

export function ListaPedidos(props: Props) {
  const telaLarga = useMediaQuery('(min-width: 75em)', true);
  return telaLarga ? <Tabela {...props} /> : <Cartoes {...props} />;
}

function Tabela({
  pedidos,
  usuarioId,
  decidindoId,
  aoAbrir,
  aoAprovar,
  aoRejeitar,
}: Props) {
  return (
    <Table highlightOnHover verticalSpacing="sm">
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Pedido</Table.Th>
          <Table.Th>Obra e fornecedor</Table.Th>
          <Table.Th>Data</Table.Th>
          <Table.Th ta="right">Itens</Table.Th>
          <Table.Th ta="right">Total</Table.Th>
          <Table.Th>Situação</Table.Th>
          <Table.Th>Alçada</Table.Th>
          <Table.Th>Ações</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {pedidos.map((pedido) => (
          <Table.Tr
            key={pedido.id}
            onClick={() => aoAbrir(pedido.id)}
            style={{ cursor: 'pointer' }}
          >
            <Table.Td>
              <UnstyledButton
                fw={700}
                onClick={() => aoAbrir(pedido.id)}
                aria-label={`Ver detalhes do pedido ${pedido.id}`}
              >
                #{pedido.id}
              </UnstyledButton>
            </Table.Td>
            <Table.Td>
              <Text size="sm" fw={500}>
                {pedido.obra.nome}
              </Text>
              <Text size="xs" c="dimmed">
                {pedido.fornecedor.nome}
              </Text>
            </Table.Td>
            <Table.Td>
              <Text size="sm">{formatarData(pedido.dataPedido)}</Text>
            </Table.Td>
            <Table.Td ta="right">{pedido.quantidadeItens}</Table.Td>
            <Table.Td ta="right">
              <Text size="sm" fw={600} style={{ whiteSpace: 'nowrap' }}>
                {formatarReais(pedido.total)}
              </Text>
            </Table.Td>
            <Table.Td>
              <BadgeStatus status={pedido.status} />
            </Table.Td>
            <Table.Td maw={260}>
              <Alcada etapas={pedido.etapas} etapaAtual={pedido.etapaAtual} />
            </Table.Td>
            <Table.Td>
              <AcoesDecisao
                pedido={pedido}
                usuarioId={usuarioId}
                decidindo={decidindoId === pedido.id}
                aoAprovar={() => aoAprovar(pedido)}
                aoRejeitar={() => aoRejeitar(pedido)}
              />
            </Table.Td>
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  );
}

function Cartoes({
  pedidos,
  usuarioId,
  decidindoId,
  aoAbrir,
  aoAprovar,
  aoRejeitar,
}: Props) {
  return (
    <Stack gap="sm" p="sm">
      {pedidos.map((pedido) => (
        <Paper
          key={pedido.id}
          p="md"
          onClick={() => aoAbrir(pedido.id)}
          style={{ cursor: 'pointer' }}
        >
          <Group justify="space-between" wrap="nowrap" mb={4}>
            <Text fw={700}>
              #{pedido.id} · {pedido.obra.nome}
            </Text>
            <BadgeStatus status={pedido.status} />
          </Group>
          <Text size="sm" c="dimmed">
            {pedido.fornecedor.nome}
          </Text>
          <Group justify="space-between" mt="xs" mb="sm">
            <Text size="sm" c="dimmed">
              {formatarData(pedido.dataPedido)} · {pedido.quantidadeItens}{' '}
              {pedido.quantidadeItens === 1 ? 'item' : 'itens'}
            </Text>
            <Text fw={700}>{formatarReais(pedido.total)}</Text>
          </Group>
          <Alcada etapas={pedido.etapas} etapaAtual={pedido.etapaAtual} />
          <Group mt="sm">
            <AcoesDecisao
              pedido={pedido}
              usuarioId={usuarioId}
              decidindo={decidindoId === pedido.id}
              aoAprovar={() => aoAprovar(pedido)}
              aoRejeitar={() => aoRejeitar(pedido)}
            />
          </Group>
        </Paper>
      ))}
    </Stack>
  );
}
