import {
  Alert,
  Anchor,
  Badge,
  Group,
  Skeleton,
  Stack,
  Text,
} from '@mantine/core';
import {
  IconAlertTriangle,
  IconArrowRight,
  IconCloudOff,
} from '@tabler/icons-react';
import type { UseQueryResult } from '@tanstack/react-query';
import { Fragment } from 'react';
import type { PreviaCadeia } from '../api/tipos';

interface Props {
  consulta: UseQueryResult<PreviaCadeia>;
  semConsulta: string;
}

export function CadeiaPrevista({ consulta, semConsulta }: Props) {
  if (consulta.fetchStatus === 'idle' && consulta.isPending) {
    return (
      <Text size="sm" c="dimmed">
        {semConsulta}
      </Text>
    );
  }
  if (consulta.isPending) {
    return (
      <Stack gap={6}>
        <Skeleton h={12} w="40%" />
        <Skeleton h={22} w="80%" />
      </Stack>
    );
  }
  if (consulta.isError) {
    return (
      <Alert color="red" variant="light" icon={<IconCloudOff size={18} />}>
        Não foi possível calcular a cadeia.{' '}
        <Anchor component="button" size="sm" onClick={() => consulta.refetch()}>
          Tentar novamente
        </Anchor>
      </Alert>
    );
  }

  const previa = consulta.data;
  if (!previa.aplicavel) {
    return (
      <Alert
        color="orange"
        variant="light"
        title="Sem faixa aplicável"
        icon={<IconAlertTriangle size={18} />}
      >
        {previa.mensagem}
      </Alert>
    );
  }
  return (
    <Stack gap={6} style={{ opacity: consulta.isPlaceholderData ? 0.6 : 1 }}>
      <Text size="sm" c="dimmed">
        Vai passar por {previa.etapas.length}{' '}
        {previa.etapas.length === 1 ? 'aprovador' : 'aprovadores'}, nesta ordem:
      </Text>
      <Group gap={6}>
        {previa.etapas.map((etapa, i) => (
          <Fragment key={etapa.ordem}>
            {i > 0 && (
              <IconArrowRight
                size={14}
                color="var(--mantine-color-gray-6)"
                aria-hidden
              />
            )}
            <Badge
              variant="light"
              color="grafite"
              radius="sm"
              size="lg"
              tt="none"
              fw={500}
              leftSection={
                <Text span size="xs" fw={700} c="carmim.7">
                  {etapa.ordem}
                </Text>
              }
            >
              {etapa.aprovador.nome}
            </Badge>
          </Fragment>
        ))}
      </Group>
    </Stack>
  );
}
