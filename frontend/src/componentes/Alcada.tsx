import { Badge, Group, Text, Tooltip } from '@mantine/core';
import {
  IconCheck,
  IconChevronRight,
  IconClockHour4,
  IconX,
} from '@tabler/icons-react';
import { Fragment } from 'react';
import type { Etapa } from '../api/tipos';
import { STATUS_ETAPA } from '../comum/rotulos';

interface Props {
  etapas: Etapa[];
  etapaAtual: number | null;
}

// Concluídos com check, o da vez em destaque, próximos apagados, cancelados riscados.
export function Alcada({ etapas, etapaAtual }: Props) {
  return (
    <Group gap={4} wrap="wrap">
      {etapas.map((etapa, i) => (
        <Fragment key={etapa.ordem}>
          {i > 0 && (
            <IconChevronRight
              size={12}
              color="var(--mantine-color-gray-5)"
              aria-hidden
            />
          )}
          <PassoAlcada etapa={etapa} daVez={etapa.ordem === etapaAtual} />
        </Fragment>
      ))}
    </Group>
  );
}

function PassoAlcada({ etapa, daVez }: { etapa: Etapa; daVez: boolean }) {
  const nome = primeiroNome(etapa.aprovador.nome);
  const descricao = daVez
    ? `${etapa.aprovador.nome}: aguardando decisão`
    : `${etapa.aprovador.nome}: ${STATUS_ETAPA[etapa.status].toLowerCase()}`;

  if (etapa.status === 'APROVADA') {
    return (
      <Tooltip label={descricao}>
        <Badge
          color="teal"
          variant="light"
          radius="sm"
          tt="none"
          leftSection={<IconCheck size={12} />}
        >
          {nome}
        </Badge>
      </Tooltip>
    );
  }
  if (etapa.status === 'REJEITADA') {
    return (
      <Tooltip label={descricao}>
        <Badge
          color="red"
          variant="light"
          radius="sm"
          tt="none"
          leftSection={<IconX size={12} />}
        >
          {nome}
        </Badge>
      </Tooltip>
    );
  }
  if (daVez) {
    return (
      <Tooltip label={descricao}>
        <Badge
          color="yellow"
          variant="filled"
          radius="sm"
          tt="none"
          c="dark"
          leftSection={<IconClockHour4 size={12} />}
        >
          {nome}
        </Badge>
      </Tooltip>
    );
  }
  return (
    <Tooltip label={descricao}>
      <Text
        size="xs"
        c="dimmed"
        td={etapa.status === 'CANCELADA' ? 'line-through' : undefined}
        px={4}
      >
        {nome}
      </Text>
    </Tooltip>
  );
}

function primeiroNome(nome: string): string {
  return nome.split(' ')[0];
}
