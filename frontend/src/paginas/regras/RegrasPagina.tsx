import {
  ActionIcon,
  Badge,
  Button,
  EmptyState,
  Grid,
  Group,
  Modal,
  NumberInput,
  Paper,
  Select,
  Skeleton,
  Stack,
  Table,
  Text,
  Title,
  Tooltip,
} from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
  IconArrowRight,
  IconBuildingSkyscraper,
  IconHierarchy3,
  IconPencil,
  IconPlus,
  IconTrash,
} from '@tabler/icons-react';
import { Fragment, useState } from 'react';
import { useSearchParams } from 'react-router';
import {
  useFaixas,
  useObras,
  usePreviaCadeia,
  useRemoverFaixa,
  useUsuarios,
} from '../../api/consultas';
import type { Faixa } from '../../api/tipos';
import { CabecalhoPagina } from '../../componentes/CabecalhoPagina';
import { CadeiaPrevista } from '../../componentes/CadeiaPrevista';
import { EstadoErro } from '../../componentes/EstadoErro';
import { paraDecimal, type ValorDigitado } from '../../comum/dinheiro';
import { rotuloDaFaixa } from '../../comum/faixas';
import { ModalFaixa } from './ModalFaixa';
import { ModalNovaObra } from './ModalNovaObra';

export function RegrasPagina() {
  const obras = useObras();
  const [parametros, definirParametros] = useSearchParams();
  const [criandoObra, definirCriandoObra] = useState(false);

  const obraId = Number(parametros.get('obra')) || obras.data?.[0]?.id || null;
  const selecionarObra = (id: number | null) =>
    definirParametros(id ? { obra: String(id) } : {}, { replace: true });

  return (
    <>
      <CabecalhoPagina
        titulo="Regras de alçada"
        descricao="Cada obra tem faixas de valor. Um pedido passa pelos aprovadores de todas as faixas até a do seu total, da menor para a maior; quem aparece em mais de uma faixa aprova uma vez só."
        acoes={
          <Button
            variant="default"
            leftSection={<IconBuildingSkyscraper size={18} />}
            onClick={() => definirCriandoObra(true)}
          >
            Nova obra
          </Button>
        }
      />

      {obras.isPending ? (
        <Skeleton h={260} />
      ) : obras.isError ? (
        <Paper>
          <EstadoErro
            erro={obras.error}
            carregando={obras.isFetching}
            aoTentarNovamente={() => void obras.refetch()}
          />
        </Paper>
      ) : obras.data.length === 0 ? (
        <Paper py="xl">
          <EmptyState
            icon={<IconBuildingSkyscraper size={28} />}
            withIndicatorBackground
            title="Nenhuma obra cadastrada"
            description="As regras de alçada são definidas por obra. Cadastre a primeira para configurar quem aprova cada faixa de valor."
          >
            <EmptyState.Actions>
              <Button onClick={() => definirCriandoObra(true)}>
                Cadastrar obra
              </Button>
            </EmptyState.Actions>
          </EmptyState>
        </Paper>
      ) : (
        <Stack gap="lg">
          <Select<number>
            label="Obra"
            data={obras.data.map((o) => ({ value: o.id, label: o.nome }))}
            value={obraId}
            onChange={selecionarObra}
            allowDeselect={false}
            searchable
            maw={420}
          />
          {obraId !== null && <RegrasDaObra key={obraId} obraId={obraId} />}
        </Stack>
      )}

      <ModalNovaObra
        aberto={criandoObra}
        aoFechar={() => definirCriandoObra(false)}
        aoCriar={(obra) => {
          definirCriandoObra(false);
          selecionarObra(obra.id);
          notifications.show({
            color: 'teal',
            title: 'Obra cadastrada',
            message: `Agora configure as faixas de "${obra.nome}".`,
          });
        }}
      />
    </>
  );
}

function RegrasDaObra({ obraId }: { obraId: number }) {
  const faixas = useFaixas(obraId);
  const usuarios = useUsuarios();
  const remover = useRemoverFaixa(obraId);
  const [editando, definirEditando] = useState<Faixa | 'nova' | null>(null);
  const [removendo, definirRemovendo] = useState<Faixa | null>(null);

  const faixaEditada = editando === 'nova' ? null : editando;
  const outraSemTeto = (faixas.data ?? []).some(
    (f) => f.limiteMaximo === null && f.id !== faixaEditada?.id,
  );

  return (
    <Grid gap="lg">
      <Grid.Col span={{ base: 12, md: 8 }}>
        <Paper p="lg">
          <Group justify="space-between" mb="md">
            <Title order={4}>Faixas de valor</Title>
            <Button
              leftSection={<IconPlus size={16} />}
              onClick={() => definirEditando('nova')}
              disabled={!usuarios.data}
            >
              Nova faixa
            </Button>
          </Group>

          {faixas.isPending ? (
            <Stack gap="sm">
              <Skeleton h={40} />
              <Skeleton h={40} />
              <Skeleton h={40} />
            </Stack>
          ) : faixas.isError ? (
            <EstadoErro
              erro={faixas.error}
              carregando={faixas.isFetching}
              aoTentarNovamente={() => void faixas.refetch()}
            />
          ) : faixas.data.length === 0 ? (
            <EmptyState
              py="lg"
              icon={<IconHierarchy3 size={28} />}
              withIndicatorBackground
              title="Esta obra ainda não tem regras"
              description="Sem faixas, nenhum pedido pode ser criado nesta obra. Comece pela faixa de menor valor."
            />
          ) : (
            <Table.ScrollContainer minWidth={560}>
              <Table verticalSpacing="sm">
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Faixa de valor</Table.Th>
                    <Table.Th>Aprovadores, na ordem do fluxo</Table.Th>
                    <Table.Th w={100} ta="right">
                      Ações
                    </Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {faixas.data.map((faixa, i) => (
                    <Table.Tr key={faixa.id}>
                      <Table.Td fw={600} style={{ whiteSpace: 'nowrap' }}>
                        {rotuloDaFaixa(faixas.data, i)}
                      </Table.Td>
                      <Table.Td>
                        <Group gap={6}>
                          {faixa.aprovadores.map((a, j) => (
                            <Fragment key={a.usuario.id}>
                              {j > 0 && (
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
                                tt="none"
                                fw={500}
                              >
                                {a.usuario.nome}
                              </Badge>
                            </Fragment>
                          ))}
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <Group gap={4} justify="flex-end" wrap="nowrap">
                          <Tooltip label="Editar faixa">
                            <ActionIcon
                              variant="subtle"
                              color="gray"
                              aria-label="Editar faixa"
                              onClick={() => definirEditando(faixa)}
                              disabled={!usuarios.data}
                            >
                              <IconPencil size={18} />
                            </ActionIcon>
                          </Tooltip>
                          <Tooltip label="Remover faixa">
                            <ActionIcon
                              variant="subtle"
                              color="red"
                              aria-label="Remover faixa"
                              onClick={() => {
                                remover.reset();
                                definirRemovendo(faixa);
                              }}
                            >
                              <IconTrash size={18} />
                            </ActionIcon>
                          </Tooltip>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>
          )}
        </Paper>
      </Grid.Col>

      <Grid.Col span={{ base: 12, md: 4 }}>
        <Simulador obraId={obraId} />
      </Grid.Col>

      {usuarios.data && (
        <ModalFaixa
          aberto={editando !== null}
          obraId={obraId}
          faixa={faixaEditada}
          outraSemTeto={outraSemTeto}
          usuarios={usuarios.data}
          aoFechar={() => definirEditando(null)}
        />
      )}

      <Modal
        opened={removendo !== null}
        onClose={() => definirRemovendo(null)}
        title={<Text fw={700}>Remover faixa?</Text>}
        centered
      >
        <Stack>
          <Text size="sm">
            Pedidos já cadastrados mantêm a cadeia com que foram criados. Novos
            pedidos passam a seguir as faixas restantes.
          </Text>
          {remover.isError && (
            <Text size="sm" c="red">
              {remover.error.message}
            </Text>
          )}
          <Group justify="flex-end">
            <Button variant="default" onClick={() => definirRemovendo(null)}>
              Cancelar
            </Button>
            <Button
              color="red"
              loading={remover.isPending}
              onClick={() =>
                removendo &&
                remover.mutate(removendo.id, {
                  onSuccess: () => definirRemovendo(null),
                })
              }
            >
              Remover
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Grid>
  );
}

function Simulador({ obraId }: { obraId: number }) {
  const [valor, definirValor] = useState<ValorDigitado>('');
  const [valorEstavel] = useDebouncedValue(valor, 350);
  const decimal = paraDecimal(valorEstavel);
  const previa = usePreviaCadeia(obraId, decimal ? decimal.toFixed(2) : null);

  return (
    <Paper p="lg">
      <Title order={4} mb={4}>
        Simular um pedido
      </Title>
      <Text size="sm" c="dimmed" mb="md">
        Confira quem aprovaria um pedido deste valor nesta obra.
      </Text>
      <NumberInput
        label="Total do pedido"
        placeholder="R$ 0,00"
        prefix="R$ "
        decimalSeparator=","
        thousandSeparator="."
        decimalScale={2}
        allowNegative={false}
        hideControls
        value={valor}
        onChange={definirValor}
        mb="md"
      />
      <CadeiaPrevista
        consulta={previa}
        semConsulta="Digite um valor para ver a cadeia."
      />
    </Paper>
  );
}
