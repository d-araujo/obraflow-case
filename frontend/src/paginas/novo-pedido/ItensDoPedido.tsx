import {
  ActionIcon,
  Button,
  Group,
  NumberInput,
  Paper,
  Select,
  SimpleGrid,
  Stack,
  Table,
  Text,
  TextInput,
  Tooltip,
} from '@mantine/core';
import type { UseFormReturnType } from '@mantine/form';
import { useMediaQuery } from '@mantine/hooks';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import type { Unidade } from '../../api/tipos';
import { calcularTotalItem, formatarReais } from '../../comum/dinheiro';
import { UNIDADES } from '../../comum/rotulos';
import { itemVazio, type ValoresPedido } from './formulario';

type Formulario = UseFormReturnType<ValoresPedido>;

export function ItensDoPedido({ form }: { form: Formulario }) {
  const telaLarga = useMediaQuery('(min-width: 62em)', true);
  const itens = form.values.itens;

  return (
    <Stack gap="md">
      {itens.length === 0 ? (
        <Text size="sm" c="red.7" ta="center" py="lg">
          O pedido precisa de pelo menos um item. Adicione um abaixo.
        </Text>
      ) : telaLarga ? (
        <TabelaItens form={form} />
      ) : (
        <Stack gap="sm">
          {itens.map((item, i) => (
            <CartaoItem key={item.chave} form={form} indice={i} />
          ))}
        </Stack>
      )}
      <Group>
        <Button
          variant="light"
          leftSection={<IconPlus size={16} />}
          onClick={() => form.insertListItem('itens', itemVazio())}
        >
          Adicionar item
        </Button>
      </Group>
    </Stack>
  );
}

function TabelaItens({ form }: { form: Formulario }) {
  return (
    <Table verticalSpacing="xs" horizontalSpacing="xs" layout="fixed">
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Descrição</Table.Th>
          <Table.Th w={120}>Quantidade</Table.Th>
          <Table.Th w={92}>Unidade</Table.Th>
          <Table.Th w={150}>Preço unitário</Table.Th>
          <Table.Th w={130} ta="right">
            Total
          </Table.Th>
          <Table.Th w={44} />
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {form.values.itens.map((item, i) => (
          <Table.Tr key={item.chave} style={{ verticalAlign: 'top' }}>
            <Table.Td>
              <CampoDescricao form={form} indice={i} />
            </Table.Td>
            <Table.Td>
              <CampoQuantidade form={form} indice={i} />
            </Table.Td>
            <Table.Td>
              <CampoUnidade form={form} indice={i} />
            </Table.Td>
            <Table.Td>
              <CampoPreco form={form} indice={i} />
            </Table.Td>
            <Table.Td ta="right" pt={14}>
              <TotalItem form={form} indice={i} />
            </Table.Td>
            <Table.Td pt={8}>
              <BotaoRemover form={form} indice={i} />
            </Table.Td>
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  );
}

function CartaoItem({ form, indice }: { form: Formulario; indice: number }) {
  return (
    <Paper p="sm" bg="gray.0">
      <Group justify="space-between" mb="xs">
        <Text size="sm" fw={600}>
          Item {indice + 1}
        </Text>
        <BotaoRemover form={form} indice={indice} />
      </Group>
      <Stack gap="xs">
        <CampoDescricao form={form} indice={indice} comRotulo />
        <SimpleGrid cols={2} spacing="xs">
          <CampoQuantidade form={form} indice={indice} comRotulo />
          <CampoUnidade form={form} indice={indice} comRotulo />
        </SimpleGrid>
        <CampoPreco form={form} indice={indice} comRotulo />
        <Group justify="space-between">
          <Text size="sm" c="dimmed">
            Total do item
          </Text>
          <TotalItem form={form} indice={indice} />
        </Group>
      </Stack>
    </Paper>
  );
}

interface CampoProps {
  form: Formulario;
  indice: number;
  comRotulo?: boolean;
}

function CampoDescricao({ form, indice, comRotulo }: CampoProps) {
  return (
    <TextInput
      label={comRotulo ? 'Descrição' : undefined}
      aria-label={`Descrição do item ${indice + 1}`}
      placeholder="Ex.: Cimento CP-II 50 kg"
      maxLength={200}
      {...form.getInputProps(`itens.${indice}.descricao`)}
    />
  );
}

function CampoQuantidade({ form, indice, comRotulo }: CampoProps) {
  return (
    <NumberInput
      label={comRotulo ? 'Quantidade' : undefined}
      aria-label={`Quantidade do item ${indice + 1}`}
      placeholder="0"
      decimalSeparator=","
      thousandSeparator="."
      decimalScale={3}
      allowNegative={false}
      hideControls
      {...form.getInputProps(`itens.${indice}.quantidade`)}
    />
  );
}

function CampoUnidade({ form, indice, comRotulo }: CampoProps) {
  return (
    <Select<Unidade>
      label={comRotulo ? 'Unidade' : undefined}
      aria-label={`Unidade do item ${indice + 1}`}
      data={UNIDADES}
      allowDeselect={false}
      {...form.getInputProps(`itens.${indice}.unidade`)}
    />
  );
}

function CampoPreco({ form, indice, comRotulo }: CampoProps) {
  return (
    <NumberInput
      label={comRotulo ? 'Preço unitário' : undefined}
      aria-label={`Preço unitário do item ${indice + 1}`}
      placeholder="R$ 0,00"
      prefix="R$ "
      decimalSeparator=","
      thousandSeparator="."
      decimalScale={2}
      allowNegative={false}
      hideControls
      {...form.getInputProps(`itens.${indice}.precoUnitario`)}
    />
  );
}

function TotalItem({ form, indice }: { form: Formulario; indice: number }) {
  const item = form.values.itens[indice];
  const total = calcularTotalItem(item.quantidade, item.precoUnitario);
  return (
    <Text size="sm" fw={600} c={total ? undefined : 'dimmed'}>
      {total ? formatarReais(total) : '—'}
    </Text>
  );
}

function BotaoRemover({ form, indice }: { form: Formulario; indice: number }) {
  return (
    <Tooltip label="Remover item">
      <ActionIcon
        variant="subtle"
        color="red"
        aria-label={`Remover item ${indice + 1}`}
        onClick={() => form.removeListItem('itens', indice)}
      >
        <IconTrash size={18} />
      </ActionIcon>
    </Tooltip>
  );
}
