import 'dotenv/config';

// Os testes e2e usam um banco próprio para não apagar os dados de demonstração.
export function urlDoBancoDeTeste(): string {
  if (!process.env.DATABASE_URL) {
    throw new Error('Defina DATABASE_URL no backend/.env');
  }
  const url = new URL(process.env.DATABASE_URL);
  url.pathname = '/obraflow_test';
  return url.toString();
}
