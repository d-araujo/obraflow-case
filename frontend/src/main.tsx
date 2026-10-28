import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/notifications/styles.css';
import 'dayjs/locale/pt-br';

import { MantineProvider } from '@mantine/core';
import { DatesProvider } from '@mantine/dates';
import { Notifications } from '@mantine/notifications';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ErroApi } from './api/cliente';
import { App } from './App';
import { UsuarioAtualProvider } from './contexto/UsuarioAtualProvider';
import { tema } from './tema';

const clienteQuery = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10_000,
      // Erro 4xx não melhora repetindo; falha de rede ou 5xx ganha mais uma tentativa.
      retry: (falhas, erro) =>
        !(erro instanceof ErroApi && erro.status >= 400 && erro.status < 500) &&
        falhas < 1,
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MantineProvider theme={tema}>
      <DatesProvider settings={{ locale: 'pt-br' }}>
        <Notifications position="top-right" />
        <QueryClientProvider client={clienteQuery}>
          <UsuarioAtualProvider>
            <App />
          </UsuarioAtualProvider>
        </QueryClientProvider>
      </DatesProvider>
    </MantineProvider>
  </StrictMode>,
);
