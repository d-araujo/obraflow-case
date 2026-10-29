export const PARAMETRO_OBRA = 'obra';

export function linkDasRegras(obraId: number): string {
  return `/regras?${PARAMETRO_OBRA}=${obraId}`;
}

// Id ausente, malformado ou de obra que não existe cai na primeira obra, em vez de abrir uma tela de erro.
export function resolverObra(
  parametro: string | null,
  obras: { id: number }[],
): number | null {
  const pedida = Number(parametro);
  return obras.some((obra) => obra.id === pedida)
    ? pedida
    : (obras[0]?.id ?? null);
}
