import { createContext, use } from 'react';

export interface UsuarioAtual {
  usuarioId: number | null;
  definirUsuario: (id: number | null) => void;
}

export const ContextoUsuarioAtual = createContext<UsuarioAtual | null>(null);

export function useUsuarioAtual(): UsuarioAtual {
  const contexto = use(ContextoUsuarioAtual);
  if (!contexto) {
    throw new Error('useUsuarioAtual precisa do UsuarioAtualProvider.');
  }
  return contexto;
}
