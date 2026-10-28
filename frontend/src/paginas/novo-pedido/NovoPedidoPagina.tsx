import {
  Alert,
  Anchor,
  Button,
  EmptyState,
  Grid,
  Paper,
  Select,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  Textarea,
  Title,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { useDebouncedValue } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
  IconAlertCircle,
  IconBuildingSkyscraper,
  IconCalendar,
} from '@tabler/icons-react';
import dayjs from 'dayjs';
import { Link, useNavigate } from 'react-router';
import { ErroApi } from '../../api/cliente';
import {
  useCriarPedido,
  useFornecedores,
  useObras,
  usePreviaCadeia,
} from '../../api/consultas';
import { CabecalhoPagina } from '../../componentes/CabecalhoPagina';
import { CadeiaPrevista } from '../../componentes/CadeiaPrevista';
import { EstadoErro } from '../../componentes/EstadoErro';
import { formatarReais } from '../../comum/dinheiro';
import {
  paraNovoPedido,
  resumirPendencias,
  totalDoPedido,
  validarPedido,
  valoresIniciais,
  type ValoresPedido,
} from './formulario';
import { ItensDoPedido } from './ItensDoPedido';

export function NovoPedidoPagina() {
  const obras = useObras();
  const fornecedores = useFornecedores();

  return (
    <>
      <CabecalhoPagina
        titulo="Novo pedido de compra"
        descricao="Informe a obra, o fornecedor e os itens. O total define quem precisa aprovar, e a cadeia de aprovação aparece antes do envio."
      />
      {obras.isPending || fornecedores.isPending ? (
        <Stack>
          <Skeleton h={180} />
          <Skeleton h={220} />
        </Stack>
      ) : obras.isError || fornecedores.isError ? (
        <Paper>
          <EstadoErro
            erro={obras.error ?? fornecedores.error}
            carregando={obras.isFetching || fornecedores.isFetching}
            aoTentarNovamente={() => {
              void obras.refetch();
              void fornecedores.refetch();
            }}
          />
        </Paper>
      ) : obras.data.length === 0 ? (
        <Paper py="xl">
          <EmptyState
            icon={<IconBuildingSkyscraper size={28} />}
            withIndicatorBackground
            title="Nenhuma obra cadastrada"
            description="Pedidos de compra pertencem a uma obra. Cadastre a primeira obra e as regras de alçada dela para começar."
          >
            <EmptyState.Actions>
              <Button component={Link} to="/regras">
                Cadastrar obra
              </Button>
            </EmptyState.Actions>
          </EmptyState>
        </Paper>
      ) : (
        <FormularioPedido obras={obras.data} fornecedores={fornecedores.data} />
      )}
    </>
  );
}

interface FormularioProps {
  obras: { id: number; nome: string; quantidadeFaixas: number }[];
  fornecedores: { id: number; nome: string }[];
}

function FormularioPedido({ obras, fornecedores }: FormularioProps) {
  const navegar = useNavigate();
  const criar = useCriarPedido();
  const form = useForm<ValoresPedido>({
    mode: 'controlled',
    initialValues: valoresIniciais(dayjs().format('YYYY-MM-DD')),
    validate: validarPedido,
    validateInputOnBlur: true,
  });

  const erros = validarPedido(form.values);
  const pendencias = resumirPendencias(erros);
  const total = totalDoPedido(form.values.itens);
  const [totalEstavel] = useDebouncedValue(total.toFixed(2), 350);
  const { obraId } = form.values;
  const previa = usePreviaCadeia(obraId, obraId ? totalEstavel : null);
  const semFaixa = previa.data?.aplicavel === false;
  const obraSemRegras =
    obras.find((o) => o.id === obraId)?.quantidadeFaixas === 0;

  const enviar = form.onSubmit((valores) => {
    criar.mutate(paraNovoPedido(valores), {
      onSuccess: (pedido) => {
        const primeiro = pedido.etapas[0]?.aprovador.nome;
        notifications.show({
          color: 'teal',
          title: `Pedido #${pedido.id} cadastrado`,
          message: primeiro ? `Aguardando a aprovação de ${primeiro}.` : '',
        });
        form.reset();
        navegar(`/aprovacoes?pedido=${pedido.id}`);
      },
      onError: (erro) => {
        if (erro instanceof ErroApi && erro.detalhes.length > 0) {
          form.setErrors(
            Object.fromEntries(erro.detalhes.map((d) => [d.campo, d.mensagem])),
          );
        }
      },
    });
  });

  return (
    <form onSubmit={enviar} noValidate>
      <Stack gap="lg">
        <Paper p="lg">
          <Title order={4} mb="md">
            Dados gerais
          </Title>
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
            <Select<number>
              label="Obra"
              placeholder="Selecione a obra"
              withAsterisk
              searchable
              data={obras.map((o) => ({ value: o.id, label: o.nome }))}
              nothingFoundMessage="Nenhuma obra encontrada"
              description={
                obraSemRegras ? (
                  <>
                    Obra sem regras de alçada.{' '}
                    <Anchor
                      component={Link}
                      to={`/regras?obra=${obraId}`}
                      size="xs"
                    >
                      Configurar regras
                    </Anchor>
                  </>
                ) : undefined
              }
              {...form.getInputProps('obraId')}
            />
            <Select<number>
              label="Fornecedor"
              placeholder={
                fornecedores.length
                  ? 'Selecione o fornecedor'
                  : 'Nenhum fornecedor cadastrado'
              }
              withAsterisk
              searchable
              data={fornecedores.map((f) => ({
                value: f.id,
                label: f.nome,
              }))}
              nothingFoundMessage="Nenhum fornecedor encontrado"
              {...form.getInputProps('fornecedorId')}
            />
            <DatePickerInput
              label="Data do pedido"
              withAsterisk
              valueFormat="DD/MM/YYYY"
              leftSection={<IconCalendar size={16} />}
              {...form.getInputProps('dataPedido')}
            />
          </SimpleGrid>
          <Textarea
            mt="md"
            label="Observações internas"
            description="Opcional. Justificativa ou complemento para quem vai aprovar."
            autosize
            minRows={2}
            maxRows={6}
            maxLength={1000}
            {...form.getInputProps('observacoes')}
          />
        </Paper>

        <Paper p="lg">
          <Title order={4} mb="md">
            Itens
          </Title>
          <ItensDoPedido form={form} />
        </Paper>

        <Paper p="lg">
          <Grid gap="xl" align="flex-start">
            <Grid.Col span={{ base: 12, md: 3 }}>
              <Text size="sm" c="dimmed">
                Total do pedido
              </Text>
              <Text fz={32} fw={700} lh={1.2}>
                {formatarReais(total)}
              </Text>
              <Text size="xs" c="dimmed">
                Soma de {form.values.itens.length}{' '}
                {form.values.itens.length === 1 ? 'item' : 'itens'}
              </Text>
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 5 }}>
              <Text size="sm" fw={600} mb={6}>
                Cadeia de aprovação
              </Text>
              <CadeiaPrevista
                consulta={previa}
                semConsulta="Selecione a obra para ver quem vai aprovar."
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 4 }}>
              {criar.isError && (
                <Alert
                  color="red"
                  variant="light"
                  icon={<IconAlertCircle size={18} />}
                  mb="md"
                  title="Pedido não cadastrado"
                >
                  {criar.error.message}
                </Alert>
              )}
              <Button
                type="submit"
                fullWidth
                size="md"
                loading={criar.isPending}
                disabled={pendencias.length > 0 || semFaixa}
              >
                Cadastrar pedido
              </Button>
              {pendencias.length > 0 && (
                <Text size="xs" c="dimmed" mt="xs">
                  Para cadastrar: {juntar(pendencias)}.
                </Text>
              )}
              {pendencias.length === 0 && semFaixa && (
                <Text size="xs" c="dimmed" mt="xs">
                  Nenhuma faixa de alçada cobre este total.
                </Text>
              )}
            </Grid.Col>
          </Grid>
        </Paper>
      </Stack>
    </form>
  );
}

function juntar(partes: string[]): string {
  if (partes.length === 1) return partes[0];
  return `${partes.slice(0, -1).join(', ')} e ${partes.at(-1)}`;
}
