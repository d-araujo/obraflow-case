import {
  ActionIcon,
  Alert,
  Badge,
  Button,
  Checkbox,
  Group,
  Input,
  Modal,
  NumberInput,
  Paper,
  Select,
  Stack,
  Text,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import {
  IconAlertCircle,
  IconArrowDown,
  IconArrowUp,
  IconTrash,
} from '@tabler/icons-react';
import { ErroApi } from '../../api/cliente';
import { useSalvarFaixa } from '../../api/consultas';
import type { Faixa, Usuario } from '../../api/tipos';
import {
  paraSalvarFaixa,
  validarFaixa,
  valoresDaFaixa,
  type ValoresFaixa,
} from './formulario-faixa';

interface Props {
  aberto: boolean;
  obraId: number;
  faixa: Faixa | null;
  outraSemTeto: boolean;
  usuarios: Usuario[];
  aoFechar: () => void;
}

export function ModalFaixa({ aberto, faixa, aoFechar, ...props }: Props) {
  return (
    <Modal
      opened={aberto}
      onClose={aoFechar}
      title={<Text fw={700}>{faixa ? 'Editar faixa' : 'Nova faixa'}</Text>}
      size="lg"
      centered
    >
      <FormularioFaixa faixa={faixa} aoFechar={aoFechar} {...props} />
    </Modal>
  );
}

function FormularioFaixa({
  obraId,
  faixa,
  outraSemTeto,
  usuarios,
  aoFechar,
}: Omit<Props, 'aberto'>) {
  const salvar = useSalvarFaixa(obraId);
  const form = useForm<ValoresFaixa>({
    mode: 'controlled',
    initialValues: valoresDaFaixa(faixa),
    validate: validarFaixa,
    // Depois da primeira tentativa de salvar, os erros acompanham cada mudança. Precisa ser o
    // formulário inteiro: marcar "sem teto" é o que resolve o erro do limite.
    onValuesChange: (valores) => {
      if (Object.keys(form.errors).length > 0) {
        form.setErrors(validarFaixa(valores));
      }
    },
  });
  const { aprovadorIds, semTeto } = form.values;
  const nomePorId = new Map(usuarios.map((u) => [u.id, u.nome]));
  const disponiveis = usuarios.filter((u) => !aprovadorIds.includes(u.id));

  // setFieldValue (e não os helpers de lista) para disparar o onValuesChange acima.
  const definirAprovadores = (ids: number[]) =>
    form.setFieldValue('aprovadorIds', ids);
  const mover = (de: number, para: number) => {
    const ids = [...aprovadorIds];
    [ids[de], ids[para]] = [ids[para], ids[de]];
    definirAprovadores(ids);
  };

  const enviar = form.onSubmit((valores) => {
    salvar.mutate(
      { id: faixa?.id, ...paraSalvarFaixa(valores) },
      {
        onSuccess: aoFechar,
        onError: (erro) => {
          if (erro instanceof ErroApi) {
            form.setErrors(
              Object.fromEntries(
                erro.detalhes.map((d) => [
                  d.campo === 'limiteMaximo' ? 'limite' : d.campo,
                  d.mensagem,
                ]),
              ),
            );
          }
        },
      },
    );
  });

  return (
    <form onSubmit={enviar} noValidate>
      <Stack gap="lg">
        <Stack gap="xs">
          <NumberInput
            label="Limite da faixa"
            description='Inclusivo: "até R$ 10.000,00" cobre pedidos de exatamente R$ 10.000,00.'
            placeholder="R$ 0,00"
            prefix="R$ "
            decimalSeparator=","
            thousandSeparator="."
            decimalScale={2}
            allowNegative={false}
            hideControls
            disabled={semTeto}
            withAsterisk={!semTeto}
            {...form.getInputProps('limite')}
          />
          <Checkbox
            label="Sem teto: cobre qualquer valor acima das outras faixas"
            description={
              outraSemTeto ? 'Esta obra já tem uma faixa sem teto.' : undefined
            }
            disabled={outraSemTeto}
            {...form.getInputProps('semTeto', { type: 'checkbox' })}
          />
        </Stack>

        <Input.Wrapper
          label="Aprovadores, na ordem do fluxo"
          withAsterisk
          error={form.errors.aprovadorIds}
        >
          <Stack gap={6} mt={6}>
            {aprovadorIds.map((id, i) => (
              <Paper key={id} px="sm" py={6} bg="gray.0">
                <Group justify="space-between" wrap="nowrap">
                  <Group gap="sm" wrap="nowrap">
                    <Badge variant="filled" color="grafite.8" circle>
                      {i + 1}
                    </Badge>
                    <Text size="sm">
                      {nomePorId.get(id) ?? `Usuário ${id}`}
                    </Text>
                  </Group>
                  <Group gap={2} wrap="nowrap">
                    <ActionIcon
                      variant="subtle"
                      color="gray"
                      aria-label="Mover para cima"
                      disabled={i === 0}
                      onClick={() => mover(i, i - 1)}
                    >
                      <IconArrowUp size={16} />
                    </ActionIcon>
                    <ActionIcon
                      variant="subtle"
                      color="gray"
                      aria-label="Mover para baixo"
                      disabled={i === aprovadorIds.length - 1}
                      onClick={() => mover(i, i + 1)}
                    >
                      <IconArrowDown size={16} />
                    </ActionIcon>
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      aria-label="Remover aprovador"
                      onClick={() =>
                        definirAprovadores(
                          aprovadorIds.filter((_, j) => j !== i),
                        )
                      }
                    >
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Group>
                </Group>
              </Paper>
            ))}
            <Select<number>
              placeholder={
                disponiveis.length
                  ? 'Adicionar aprovador...'
                  : 'Todos os usuários já estão na faixa'
              }
              aria-label="Adicionar aprovador"
              data={disponiveis.map((u) => ({ value: u.id, label: u.nome }))}
              value={null}
              onChange={(id) => id && definirAprovadores([...aprovadorIds, id])}
              disabled={disponiveis.length === 0}
              searchable
            />
          </Stack>
        </Input.Wrapper>

        {salvar.isError && (
          <Alert
            color="red"
            variant="light"
            icon={<IconAlertCircle size={18} />}
          >
            {salvar.error.message}
          </Alert>
        )}

        <Group justify="flex-end">
          <Button variant="default" onClick={aoFechar}>
            Cancelar
          </Button>
          <Button type="submit" loading={salvar.isPending}>
            Salvar faixa
          </Button>
        </Group>
      </Stack>
    </form>
  );
}
