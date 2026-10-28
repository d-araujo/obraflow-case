import {
  Blockquote,
  Divider,
  Group,
  Paper,
  SimpleGrid,
  Skeleton,
  Stack,
  Table,
  Text,
  Timeline,
  Title,
} from '@mantine/core';
import {
  IconBan,
  IconCheck,
  IconCircleDashed,
  IconClockHour4,
  IconFilePlus,
  IconFlag,
  IconX,
} from '@tabler/icons-react';
import type { ReactNode } from 'react';
import { usePedido } from '../../api/consultas';
import type { Etapa, PedidoDetalhe } from '../../api/tipos';
import { BadgeStatus } from '../../componentes/BadgeStatus';
import { EstadoErro } from '../../componentes/EstadoErro';
import { formatarQuantidade, formatarReais } from '../../comum/dinheiro';
import {
  formatarData,
  formatarDataHora,
  rotuloUnidade,
} from '../../comum/rotulos';

interface Props {
  pedidoId: number;
  acoes: (pedido: PedidoDetalhe) => ReactNode;
}

export function DetalhePedido({ pedidoId, acoes }: Props) {
  const consulta = usePedido(pedidoId);

  if (consulta.isPending) {
    return (
      <Stack>
        <Skeleton h={28} w="50%" />
        <Skeleton h={90} />
        <Skeleton h={160} />
        <Skeleton h={200} />
      </Stack>
    );
  }
  if (consulta.isError) {
    return (
      <EstadoErro
        erro={consulta.error}
        carregando={consulta.isFetching}
        aoTentarNovamente={() => void consulta.refetch()}
        titulo="Não foi possível abrir o pedido"
      />
    );
  }

  const pedido = consulta.data;
  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <Title order={3}>Pedido #{pedido.id}</Title>
        <BadgeStatus status={pedido.status} />
      </Group>

      <SimpleGrid cols={2} spacing="md" verticalSpacing="sm">
        <Info rotulo="Obra">{pedido.obra.nome}</Info>
        <Info rotulo="Fornecedor">{pedido.fornecedor.nome}</Info>
        <Info rotulo="Data do pedido">{formatarData(pedido.dataPedido)}</Info>
        <Info rotulo="Cadastrado em">{formatarDataHora(pedido.criadoEm)}</Info>
      </SimpleGrid>
      {pedido.observacoes && (
        <Info rotulo="Observações internas">{pedido.observacoes}</Info>
      )}

      <Paper p="sm">{acoes(pedido)}</Paper>

      <div>
        <Title order={5} mb="xs">
          Itens
        </Title>
        <Table.ScrollContainer minWidth={520}>
          <Table verticalSpacing={6} fz="sm">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Descrição</Table.Th>
                <Table.Th ta="right">Qtd.</Table.Th>
                <Table.Th>Unid.</Table.Th>
                <Table.Th ta="right">Preço unit.</Table.Th>
                <Table.Th ta="right">Total</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {pedido.itens.map((item) => (
                <Table.Tr key={item.id}>
                  <Table.Td>{item.descricao}</Table.Td>
                  <Table.Td ta="right">
                    {formatarQuantidade(item.quantidade)}
                  </Table.Td>
                  <Table.Td>{rotuloUnidade(item.unidade)}</Table.Td>
                  <Table.Td ta="right">
                    {formatarReais(item.precoUnitario)}
                  </Table.Td>
                  <Table.Td ta="right" fw={600}>
                    {formatarReais(item.total)}
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
            <Table.Tfoot>
              <Table.Tr>
                <Table.Th colSpan={4} ta="right">
                  Total do pedido
                </Table.Th>
                <Table.Th ta="right" fz="md">
                  {formatarReais(pedido.total)}
                </Table.Th>
              </Table.Tr>
            </Table.Tfoot>
          </Table>
        </Table.ScrollContainer>
      </div>

      <div>
        <Title order={5} mb="sm">
          Histórico da aprovação
        </Title>
        <Historico pedido={pedido} />
      </div>
    </Stack>
  );
}

function Info({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <div>
      <Text size="xs" c="dimmed">
        {rotulo}
      </Text>
      <Text size="sm" fw={500} style={{ whiteSpace: 'pre-wrap' }}>
        {children}
      </Text>
    </div>
  );
}

function Historico({ pedido }: { pedido: PedidoDetalhe }) {
  const decididas = pedido.etapas.filter((e) => e.decididaEm !== null).length;
  const concluido = pedido.status !== 'PENDENTE';

  return (
    <Timeline
      active={decididas + (concluido ? 1 : 0)}
      bulletSize={26}
      lineWidth={2}
    >
      <Timeline.Item
        bullet={<IconFilePlus size={14} />}
        title="Pedido cadastrado"
      >
        <Text size="xs" c="dimmed">
          {formatarDataHora(pedido.criadoEm)} · cadeia de {pedido.etapas.length}{' '}
          {pedido.etapas.length === 1 ? 'etapa' : 'etapas'} definida pelo total
          de {formatarReais(pedido.total)}
        </Text>
      </Timeline.Item>
      {pedido.etapas.map((etapa) => (
        <Timeline.Item
          key={etapa.ordem}
          {...visualDaEtapa(etapa, etapa.ordem === pedido.etapaAtual)}
        />
      ))}
      {concluido && (
        <Timeline.Item
          bullet={<IconFlag size={14} />}
          color={pedido.status === 'APROVADO' ? 'teal' : 'red'}
          title={
            pedido.status === 'APROVADO'
              ? 'Pedido aprovado'
              : 'Pedido rejeitado'
          }
        >
          <Text size="xs" c="dimmed">
            Fluxo concluído.
          </Text>
        </Timeline.Item>
      )}
    </Timeline>
  );
}

function visualDaEtapa(etapa: Etapa, daVez: boolean) {
  const titulo = `${etapa.ordem}. ${etapa.aprovador.nome}`;
  const quando = etapa.decididaEm ? formatarDataHora(etapa.decididaEm) : '';

  switch (etapa.status) {
    case 'APROVADA':
      return {
        bullet: <IconCheck size={14} />,
        color: 'teal',
        title: titulo,
        children: <Legenda>Aprovou em {quando}</Legenda>,
      };
    case 'REJEITADA':
      return {
        bullet: <IconX size={14} />,
        color: 'red',
        title: titulo,
        children: (
          <>
            <Legenda>Rejeitou em {quando}</Legenda>
            <Blockquote color="red" p="xs" mt={6} fz="sm" iconSize={0}>
              {etapa.motivo}
            </Blockquote>
          </>
        ),
      };
    case 'CANCELADA':
      return {
        bullet: <IconBan size={14} />,
        color: 'gray',
        title: <Text c="dimmed">{titulo}</Text>,
        children: <Legenda>Cancelada: o fluxo foi interrompido antes.</Legenda>,
      };
    default:
      return daVez
        ? {
            bullet: <IconClockHour4 size={14} />,
            color: 'yellow',
            title: titulo,
            children: (
              <>
                <Divider my={4} variant="dashed" />
                <Legenda>Aguardando a decisão desta pessoa.</Legenda>
              </>
            ),
          }
        : {
            bullet: <IconCircleDashed size={14} />,
            color: 'gray',
            title: <Text c="dimmed">{titulo}</Text>,
            children: <Legenda>Próxima etapa.</Legenda>,
          };
  }
}

function Legenda({ children }: { children: ReactNode }) {
  return (
    <Text size="xs" c="dimmed">
      {children}
    </Text>
  );
}
