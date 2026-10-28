import { Select } from '@mantine/core';
import { IconUserCircle } from '@tabler/icons-react';
import { useEffect } from 'react';
import { useUsuarios } from '../api/consultas';
import { useUsuarioAtual } from '../contexto/usuario-atual';

export function SeletorUsuario({ escuro = false }: { escuro?: boolean }) {
  const { usuarioId, definirUsuario } = useUsuarioAtual();
  const usuarios = useUsuarios();

  // Depois de um novo seed o id guardado pode não existir mais.
  useEffect(() => {
    if (
      usuarioId !== null &&
      usuarios.data &&
      !usuarios.data.some((u) => u.id === usuarioId)
    ) {
      definirUsuario(null);
    }
  }, [usuarios.data, usuarioId, definirUsuario]);

  return (
    <Select<number>
      label="Agindo como"
      placeholder={
        usuarios.isError
          ? 'Usuários indisponíveis'
          : usuarios.isPending
            ? 'Carregando...'
            : 'Escolha um usuário'
      }
      data={(usuarios.data ?? []).map((u) => ({ value: u.id, label: u.nome }))}
      value={usuarioId}
      onChange={definirUsuario}
      disabled={!usuarios.data}
      leftSection={<IconUserCircle size={18} />}
      size="xs"
      w={{ base: '100%', sm: 220 }}
      comboboxProps={{ withinPortal: true }}
      styles={
        escuro
          ? { label: { color: 'var(--mantine-color-grafite-2)' } }
          : undefined
      }
    />
  );
}
