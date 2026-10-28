import {
  Button,
  Drawer,
  EmptyState,
  Group,
  Paper,
  SegmentedControl,
  Skeleton,
  Stack,
  Switch,
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconFilePlus, IconInbox } from '@tabler/icons-react';
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { useDecidirPedido, usePedidos } from '../../api/consultas';
import type {
  PedidoDetalhe,
  PedidoResumo,
  StatusPedido,
} from '../../api/tipos';
import { CabecalhoPagina } from '../../componentes/CabecalhoPagina';
import { EstadoErro } from '../../componentes/EstadoErro';
import { etapaDaVez } from '../../comum/decisao';
import { useUsuarioAtual } from '../../contexto/usuario-atual';
import { AcoesDecisao } from './AcoesDecisao';
import { DetalhePedido } from './DetalhePedido';
import { ListaPedidos } from './ListaPedidos';
import { ModalRejeicao } from './ModalRejeicao';

const FILTROS: { label: string; value: StatusPedido | 'TODOS' }[] = [
  { label: 'Todos', value: 'TODOS' },
  { label: 'Pendentes', value: 'PENDENTE' },
  { label: 'Aprovados', value: 'APROVADO' },
  { label: 'Rejeitados', value: 'REJEITADO' },
];

export function AprovacoesPagina() {
  const { usuarioId } = useUsuarioAtual();
  const [parametros, definirParametros] = useSearchParams();
  const [rejeitando, definirRejeitando] = useState<number | null>(null);
  const telaPequena = useMediaQuery('(max-width: 48em)');

  const status = (parametros.get('status') ?? 'TODOS') as
    StatusPedido | 'TODOS';
  const minhaVez = parametros.get('minhaVez') === '1' && usuarioId !== null;
  const pedidoAberto = Number(parametros.get('pedido')) || null;

  const pedidos = usePedidos({
    status: status === 'TODOS' ? undefined : status,
    aprovadorId: minhaVez ? (usuarioId ?? undefined) : undefined,
  });
  const decidir = useDecidirPedido();
  const decidindoId = decidir.isPending ? decidir.variables.pedidoId : null;

  function alterarParametro(nome: string, valor: string | null) {
    definirParametros(
      (atuais) => {
        if (valor === null) atuais.delete(nome);
        else atuais.set(nome, valor);
        return atuais;
      },
      { replace: nome !== 'pedido' },
    );
  }

  function aprovar(pedido: PedidoResumo) {
    if (usuarioId === null) return;
    decidir.mutate(
      { tipo: 'aprovar', pedidoId: pedido.id, usuarioId },
      {
        onSuccess: (atualizado) => {
          const proxima = etapaDaVez(atualizado);
          notifications.show({
            color: 'teal',
            title: `Pedido #${pedido.id} aprovado`,
            message: proxima
              ? `Agora aguarda ${proxima.aprovador.nome}.`
              : 'Fluxo concluído: o pedido está aprovado.',
          });
        },
        onError: avisarErro,
      },
    );
  }

  function rejeitar(motivo: string) {
    if (usuarioId === null || rejeitando === null) return;
    const pedidoId = rejeitando;
    decidir.mutate(
      { tipo: 'rejeitar', pedidoId, usuarioId, motivo },
      {
        onSuccess: () => {
          definirRejeitando(null);
          notifications.show({
            color: 'red',
            title: `Pedido #${pedidoId} rejeitado`,
            message: 'O motivo foi registrado no histórico.',
          });
        },
        onError: (erro) => {
          definirRejeitando(null);
          avisarErro(erro);
        },
      },
    );
  }

  const acoesDoDetalhe = (pedido: PedidoDetalhe) => (
    <AcoesDecisao
      pedido={pedido}
      usuarioId={usuarioId}
      decidindo={decidindoId === pedido.id}
      aoAprovar={() => aprovar(pedido)}
      aoRejeitar={() => definirRejeitando(pedido.id)}
      tamanho="sm"
    />
  );

  return (
    <>
      <CabecalhoPagina
        titulo="Aprovações"
        descricao="Pedidos e o andamento da alçada de cada um. Só o aprovador da etapa atual pode decidir; escolha quem está agindo no topo da tela."
        acoes={
          <Button
            component={Link}
            to="/pedidos/novo"
            leftSection={<IconFilePlus size={18} />}
          >
            Novo pedido
          </Button>
        }
      />

      <Group justify="space-between" mb="md" gap="sm">
        <SegmentedControl
          data={FILTROS}
          value={status}
          onChange={(valor) =>
            alterarParametro('status', valor === 'TODOS' ? null : valor)
          }
          fullWidth={telaPequena}
          w={telaPequena ? '100%' : undefined}
        />
        <Switch
          label="Só os que aguardam minha decisão"
          checked={minhaVez}
          disabled={usuarioId === null}
          onChange={(evento) =>
            alterarParametro(
              'minhaVez',
              evento.currentTarget.checked ? '1' : null,
            )
          }
        />
      </Group>

      <Paper p={0} style={{ overflow: 'hidden' }}>
        {pedidos.isPending ? (
          <Stack p="md" gap="sm">
            {Array.from({ length: 5 }, (_, i) => (
              <Skeleton key={i} h={44} />
            ))}
          </Stack>
        ) : pedidos.isError ? (
          <EstadoErro
            erro={pedidos.error}
            carregando={pedidos.isFetching}
            aoTentarNovamente={() => void pedidos.refetch()}
          />
        ) : pedidos.data.length === 0 ? (
          <EmptyState
            py={48}
            icon={<IconInbox size={28} />}
            withIndicatorBackground
            title={
              minhaVez
                ? 'Nada aguardando a sua decisão'
                : 'Nenhum pedido encontrado'
            }
            description={
              minhaVez
                ? 'Quando um pedido chegar à sua etapa, ele aparece aqui.'
                : 'Ajuste o filtro ou cadastre um novo pedido de compra.'
            }
          >
            <EmptyState.Actions>
              <Button component={Link} to="/pedidos/novo" variant="light">
                Cadastrar pedido
              </Button>
            </EmptyState.Actions>
          </EmptyState>
        ) : (
          <ListaPedidos
            pedidos={pedidos.data}
            usuarioId={usuarioId}
            decidindoId={decidindoId}
            aoAbrir={(id) => alterarParametro('pedido', String(id))}
            aoAprovar={aprovar}
            aoRejeitar={(pedido) => definirRejeitando(pedido.id)}
          />
        )}
      </Paper>

      <Drawer
        opened={pedidoAberto !== null}
        onClose={() => alterarParametro('pedido', null)}
        position="right"
        size={telaPequena ? '100%' : 'xl'}
        title="Detalhes do pedido"
      >
        {pedidoAberto !== null && (
          <DetalhePedido pedidoId={pedidoAberto} acoes={acoesDoDetalhe} />
        )}
      </Drawer>

      <ModalRejeicao
        pedidoId={rejeitando}
        enviando={decidir.isPending}
        aoFechar={() => definirRejeitando(null)}
        aoConfirmar={rejeitar}
      />
    </>
  );
}

function avisarErro(erro: Error) {
  notifications.show({
    color: 'red',
    title: 'Decisão não registrada',
    message: erro.message,
  });
}
