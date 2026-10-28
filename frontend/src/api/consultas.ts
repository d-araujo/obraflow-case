import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { requisitar } from './cliente';
import type {
  Faixa,
  FiltroPedidos,
  Fornecedor,
  NovoPedido,
  Obra,
  PedidoDetalhe,
  PedidoResumo,
  PreviaCadeia,
  SalvarFaixa,
  Usuario,
} from './tipos';

export const chaves = {
  obras: ['obras'] as const,
  usuarios: ['usuarios'] as const,
  fornecedores: ['fornecedores'] as const,
  faixas: (obraId: number) => ['faixas', obraId] as const,
  previa: (obraId: number, total: string) => ['previa', obraId, total] as const,
  pedidos: ['pedidos'] as const,
  listaPedidos: (filtro: FiltroPedidos) =>
    ['pedidos', 'lista', filtro] as const,
  pedido: (id: number) => ['pedidos', 'detalhe', id] as const,
};

export function useObras() {
  return useQuery({
    queryKey: chaves.obras,
    queryFn: () => requisitar<Obra[]>('/obras'),
  });
}

export function useUsuarios() {
  return useQuery({
    queryKey: chaves.usuarios,
    queryFn: () => requisitar<Usuario[]>('/usuarios'),
  });
}

export function useFornecedores() {
  return useQuery({
    queryKey: chaves.fornecedores,
    queryFn: () => requisitar<Fornecedor[]>('/fornecedores'),
  });
}

export function useFaixas(obraId: number | null) {
  return useQuery({
    queryKey: chaves.faixas(obraId ?? 0),
    queryFn: () => requisitar<Faixa[]>(`/obras/${obraId}/faixas`),
    enabled: obraId !== null,
  });
}

export function usePreviaCadeia(obraId: number | null, total: string | null) {
  return useQuery({
    queryKey: chaves.previa(obraId ?? 0, total ?? ''),
    queryFn: () =>
      requisitar<PreviaCadeia>(`/obras/${obraId}/cadeia?total=${total}`),
    enabled: obraId !== null && total !== null,
    placeholderData: keepPreviousData,
  });
}

export function usePedidos(filtro: FiltroPedidos) {
  const parametros = new URLSearchParams();
  if (filtro.status) parametros.set('status', filtro.status);
  if (filtro.aprovadorId)
    parametros.set('aprovadorId', String(filtro.aprovadorId));
  return useQuery({
    queryKey: chaves.listaPedidos(filtro),
    queryFn: () => requisitar<PedidoResumo[]>(`/pedidos?${parametros}`),
    placeholderData: keepPreviousData,
  });
}

export function usePedido(id: number | null) {
  return useQuery({
    queryKey: chaves.pedido(id ?? 0),
    queryFn: () => requisitar<PedidoDetalhe>(`/pedidos/${id}`),
    enabled: id !== null,
  });
}

export function useCriarObra() {
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: (nome: string) =>
      requisitar<Obra>('/obras', { metodo: 'POST', corpo: { nome } }),
    onSuccess: () => cliente.invalidateQueries({ queryKey: chaves.obras }),
  });
}

export function useCriarPedido() {
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: (pedido: NovoPedido) =>
      requisitar<PedidoDetalhe>('/pedidos', { metodo: 'POST', corpo: pedido }),
    onSuccess: () => cliente.invalidateQueries({ queryKey: chaves.pedidos }),
  });
}

type Decisao =
  | { tipo: 'aprovar'; pedidoId: number; usuarioId: number }
  | { tipo: 'rejeitar'; pedidoId: number; usuarioId: number; motivo: string };

export function useDecidirPedido() {
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: (decisao: Decisao) =>
      requisitar<PedidoDetalhe>(
        `/pedidos/${decisao.pedidoId}/${decisao.tipo}`,
        {
          metodo: 'POST',
          usuarioId: decisao.usuarioId,
          corpo:
            decisao.tipo === 'rejeitar'
              ? { motivo: decisao.motivo }
              : undefined,
        },
      ),
    // Também em caso de erro: um 409 significa que alguém decidiu antes e a tela está desatualizada.
    onSettled: () => cliente.invalidateQueries({ queryKey: chaves.pedidos }),
  });
}

export function useSalvarFaixa(obraId: number) {
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...faixa }: SalvarFaixa & { id?: number }) =>
      id
        ? requisitar<Faixa>(`/faixas/${id}`, { metodo: 'PUT', corpo: faixa })
        : requisitar<Faixa>(`/obras/${obraId}/faixas`, {
            metodo: 'POST',
            corpo: faixa,
          }),
    onSuccess: () => invalidarRegras(cliente, obraId),
  });
}

export function useRemoverFaixa(obraId: number) {
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      requisitar<void>(`/faixas/${id}`, { metodo: 'DELETE' }),
    onSuccess: () => invalidarRegras(cliente, obraId),
  });
}

function invalidarRegras(
  cliente: ReturnType<typeof useQueryClient>,
  obraId: number,
) {
  return Promise.all([
    cliente.invalidateQueries({ queryKey: chaves.faixas(obraId) }),
    cliente.invalidateQueries({ queryKey: ['previa', obraId] }),
    cliente.invalidateQueries({ queryKey: chaves.obras }),
  ]);
}
