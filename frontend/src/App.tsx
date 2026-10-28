import { Button, EmptyState, Paper } from '@mantine/core';
import { IconMapOff } from '@tabler/icons-react';
import {
  createBrowserRouter,
  Link,
  Navigate,
  RouterProvider,
} from 'react-router';
import { Layout } from './componentes/Layout';
import { AprovacoesPagina } from './paginas/aprovacoes/AprovacoesPagina';
import { NovoPedidoPagina } from './paginas/novo-pedido/NovoPedidoPagina';
import { RegrasPagina } from './paginas/regras/RegrasPagina';

const rotas = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { index: true, element: <Navigate to="/aprovacoes" replace /> },
      { path: 'pedidos/novo', element: <NovoPedidoPagina /> },
      { path: 'aprovacoes', element: <AprovacoesPagina /> },
      { path: 'regras', element: <RegrasPagina /> },
      { path: '*', element: <PaginaNaoEncontrada /> },
    ],
  },
]);

export function App() {
  return <RouterProvider router={rotas} />;
}

function PaginaNaoEncontrada() {
  return (
    <Paper py="xl">
      <EmptyState
        icon={<IconMapOff size={28} />}
        withIndicatorBackground
        title="Página não encontrada"
        description="O endereço acessado não existe nesta aplicação."
      >
        <EmptyState.Actions>
          <Button component={Link} to="/aprovacoes">
            Ir para aprovações
          </Button>
        </EmptyState.Actions>
      </EmptyState>
    </Paper>
  );
}
