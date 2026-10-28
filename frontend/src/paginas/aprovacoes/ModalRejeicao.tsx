import { Button, Group, Modal, Stack, Text, Textarea } from '@mantine/core';
import { useForm } from '@mantine/form';

interface Props {
  pedidoId: number | null;
  enviando: boolean;
  aoFechar: () => void;
  aoConfirmar: (motivo: string) => void;
}

export function ModalRejeicao({ pedidoId, ...props }: Props) {
  return (
    <Modal
      opened={pedidoId !== null}
      onClose={props.aoFechar}
      title={<Text fw={700}>Rejeitar pedido #{pedidoId}</Text>}
      centered
    >
      <FormularioRejeicao {...props} />
    </Modal>
  );
}

// Fica dentro do Modal, que desmonta o conteúdo ao fechar: cada abertura começa com o motivo vazio.
function FormularioRejeicao({
  enviando,
  aoFechar,
  aoConfirmar,
}: Omit<Props, 'pedidoId'>) {
  const form = useForm({
    mode: 'controlled',
    initialValues: { motivo: '' },
    validate: {
      motivo: (valor) =>
        valor.trim() ? null : 'Informe o motivo da rejeição.',
    },
  });

  return (
    <form
      onSubmit={form.onSubmit(({ motivo }) => aoConfirmar(motivo.trim()))}
      noValidate
    >
      <Stack>
        <Text size="sm" c="dimmed">
          A rejeição encerra o fluxo: as etapas seguintes são canceladas e o
          motivo fica registrado no histórico do pedido.
        </Text>
        <Textarea
          label="Motivo da rejeição"
          placeholder="Ex.: preço acima da cotação aprovada"
          withAsterisk
          autosize
          minRows={3}
          maxLength={500}
          data-autofocus
          {...form.getInputProps('motivo')}
        />
        <Group justify="flex-end">
          <Button variant="default" onClick={aoFechar}>
            Cancelar
          </Button>
          <Button type="submit" color="red" loading={enviando}>
            Rejeitar pedido
          </Button>
        </Group>
      </Stack>
    </form>
  );
}
