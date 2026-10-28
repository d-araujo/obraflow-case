import { Badge } from '@mantine/core';
import type { StatusPedido } from '../api/tipos';
import { STATUS_PEDIDO } from '../comum/rotulos';

export function BadgeStatus({ status }: { status: StatusPedido }) {
  const { rotulo, cor } = STATUS_PEDIDO[status];
  return (
    <Badge color={cor} variant="light" radius="sm" style={{ flexShrink: 0 }}>
      {rotulo}
    </Badge>
  );
}
