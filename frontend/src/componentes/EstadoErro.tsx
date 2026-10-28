import { Button, EmptyState } from '@mantine/core';
import { IconCloudOff, IconRefresh } from '@tabler/icons-react';
import { ErroApi } from '../api/cliente';

interface Props {
  erro: unknown;
  aoTentarNovamente: () => void;
  carregando?: boolean;
  titulo?: string;
}

export function EstadoErro({
  erro,
  aoTentarNovamente,
  carregando,
  titulo = 'Não foi possível carregar os dados',
}: Props) {
  const mensagem =
    erro instanceof ErroApi
      ? erro.message
      : 'Ocorreu um erro inesperado. Tente novamente em instantes.';
  return (
    <EmptyState
      py="xl"
      variant="light"
      color="red"
      icon={<IconCloudOff size={28} />}
      title={titulo}
      description={mensagem}
    >
      <EmptyState.Actions>
        <Button
          variant="light"
          leftSection={<IconRefresh size={16} />}
          onClick={aoTentarNovamente}
          loading={carregando}
        >
          Tentar novamente
        </Button>
      </EmptyState.Actions>
    </EmptyState>
  );
}
