import { useLocalStorage } from '@mantine/hooks';
import type { ReactNode } from 'react';
import { ContextoUsuarioAtual } from './usuario-atual';

// Substitui o login neste projeto: quem age é escolhido no topo e vai no header X-Usuario-Id.
export function UsuarioAtualProvider({ children }: { children: ReactNode }) {
  const [usuarioId, definirUsuario] = useLocalStorage<number | null>({
    key: 'obraflow:usuario-atual',
    defaultValue: null,
  });
  return (
    <ContextoUsuarioAtual value={{ usuarioId, definirUsuario }}>
      {children}
    </ContextoUsuarioAtual>
  );
}
