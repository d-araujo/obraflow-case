import {
  AppShell,
  Box,
  Burger,
  Divider,
  Group,
  NavLink,
  Stack,
  Text,
  ThemeIcon,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconBuildingSkyscraper,
  IconChecklist,
  IconFilePlus,
  IconHierarchy3,
} from '@tabler/icons-react';
import { Link, Outlet, useLocation } from 'react-router';
import { SeletorUsuario } from './SeletorUsuario';

const NAVEGACAO = [
  { caminho: '/pedidos/novo', rotulo: 'Novo pedido', icone: IconFilePlus },
  { caminho: '/aprovacoes', rotulo: 'Aprovações', icone: IconChecklist },
  { caminho: '/regras', rotulo: 'Regras de alçada', icone: IconHierarchy3 },
];

export function Layout() {
  const [menuAberto, { toggle, close }] = useDisclosure();
  const { pathname } = useLocation();

  return (
    <AppShell
      header={{ height: 64 }}
      navbar={{
        width: 240,
        breakpoint: 'sm',
        collapsed: { mobile: !menuAberto },
      }}
      padding={{ base: 'md', md: 'xl' }}
    >
      <AppShell.Header bg="grafite.9" bd={0}>
        <Group h="100%" px="md" justify="space-between" wrap="nowrap">
          <Group gap="sm" wrap="nowrap">
            <Burger
              opened={menuAberto}
              onClick={toggle}
              hiddenFrom="sm"
              size="sm"
              color="white"
              aria-label="Abrir menu"
            />
            <Marca />
          </Group>
          <Box visibleFrom="sm">
            <SeletorUsuario escuro />
          </Box>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="sm">
        <Stack gap={4}>
          {NAVEGACAO.map(({ caminho, rotulo, icone: Icone }) => (
            <NavLink
              key={caminho}
              component={Link}
              to={caminho}
              label={rotulo}
              leftSection={<Icone size={18} stroke={1.6} />}
              active={pathname.startsWith(caminho)}
              onClick={close}
              fw={500}
              style={{ borderRadius: 'var(--mantine-radius-md)' }}
            />
          ))}
        </Stack>
        <Box hiddenFrom="sm" mt="md">
          <Divider mb="md" />
          <SeletorUsuario />
        </Box>
      </AppShell.Navbar>

      <AppShell.Main bg="gray.0">
        <Box maw={1280} mx="auto">
          <Outlet />
        </Box>
      </AppShell.Main>
    </AppShell>
  );
}

function Marca() {
  return (
    <Group gap={10} wrap="nowrap">
      <ThemeIcon size={34} radius="md" color="carmim">
        <IconBuildingSkyscraper size={20} />
      </ThemeIcon>
      <Box>
        <Text c="white" fw={700} lh={1.1}>
          ObraFlow
        </Text>
        <Text c="grafite.2" size="xs" lh={1.1}>
          Pedidos de compra
        </Text>
      </Box>
    </Group>
  );
}
