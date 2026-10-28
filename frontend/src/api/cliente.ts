const URL_API = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export interface DetalheErro {
  campo: string;
  mensagem: string;
}

export class ErroApi extends Error {
  readonly status: number;
  readonly codigo: string;
  readonly detalhes: DetalheErro[];

  constructor(
    status: number,
    codigo: string,
    mensagem: string,
    detalhes: DetalheErro[] = [],
  ) {
    super(mensagem);
    this.status = status;
    this.codigo = codigo;
    this.detalhes = detalhes;
  }
}

interface Opcoes {
  metodo?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  corpo?: unknown;
  usuarioId?: number | null;
}

export async function requisitar<T>(
  caminho: string,
  { metodo = 'GET', corpo, usuarioId }: Opcoes = {},
): Promise<T> {
  const headers: Record<string, string> = {};
  if (corpo !== undefined) headers['Content-Type'] = 'application/json';
  if (usuarioId) headers['X-Usuario-Id'] = String(usuarioId);

  let resposta: Response;
  try {
    resposta = await fetch(`${URL_API}${caminho}`, {
      method: metodo,
      headers,
      body: corpo === undefined ? undefined : JSON.stringify(corpo),
    });
  } catch {
    throw new ErroApi(
      0,
      'SEM_CONEXAO',
      'Não foi possível falar com o servidor. Verifique se a API está no ar.',
    );
  }

  if (resposta.status === 204) return undefined as T;
  const dados = await resposta.json().catch(() => null);
  if (!resposta.ok) {
    throw new ErroApi(
      resposta.status,
      dados?.codigo ?? 'ERRO_DESCONHECIDO',
      dados?.mensagem ?? 'O servidor respondeu com um erro inesperado.',
      dados?.detalhes ?? [],
    );
  }
  return dados as T;
}
