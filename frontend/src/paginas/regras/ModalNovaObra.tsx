import {
  Alert,
  Button,
  Group,
  Modal,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useCriarObra } from '../../api/consultas';
import type { Obra } from '../../api/tipos';

interface Props {
  aberto: boolean;
  aoFechar: () => void;
  aoCriar: (obra: Obra) => void;
}

export function ModalNovaObra({ aberto, aoFechar, aoCriar }: Props) {
  return (
    <Modal
      opened={aberto}
      onClose={aoFechar}
      title={<Text fw={700}>Nova obra</Text>}
      centered
    >
      <FormularioObra aoFechar={aoFechar} aoCriar={aoCriar} />
    </Modal>
  );
}

function FormularioObra({ aoFechar, aoCriar }: Omit<Props, 'aberto'>) {
  const criar = useCriarObra();
  const form = useForm({
    mode: 'controlled',
    initialValues: { nome: '' },
    validate: {
      nome: (nome) => (nome.trim() ? null : 'Informe o nome da obra.'),
    },
  });

  return (
    <form
      onSubmit={form.onSubmit(({ nome }) =>
        criar.mutate(nome.trim(), { onSuccess: aoCriar }),
      )}
      noValidate
    >
      <Stack>
        <TextInput
          label="Nome da obra"
          placeholder="Ex.: Residencial Jardim Aurora"
          withAsterisk
          maxLength={120}
          data-autofocus
          {...form.getInputProps('nome')}
        />
        {criar.isError && (
          <Alert color="red" variant="light">
            {criar.error.message}
          </Alert>
        )}
        <Group justify="flex-end">
          <Button variant="default" onClick={aoFechar}>
            Cancelar
          </Button>
          <Button type="submit" loading={criar.isPending}>
            Cadastrar obra
          </Button>
        </Group>
      </Stack>
    </form>
  );
}
