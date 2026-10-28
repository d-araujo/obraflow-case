import { createTheme, type MantineColorsTuple } from '@mantine/core';

const carmim: MantineColorsTuple = [
  '#ffe9ef',
  '#ffd1dc',
  '#fba0b5',
  '#f86b8b',
  '#f54068',
  '#f42552',
  '#e3194a',
  '#ca0d3e',
  '#b40036',
  '#9e002d',
];

const grafite: MantineColorsTuple = [
  '#f5f4f7',
  '#e7e5ec',
  '#cbc7d4',
  '#aea8bc',
  '#958da7',
  '#857c9a',
  '#7d7394',
  '#6a6181',
  '#3a3542',
  '#1d1b22',
];

export const tema = createTheme({
  primaryColor: 'carmim',
  primaryShade: 6,
  colors: { carmim, grafite },
  defaultRadius: 'md',
  fontFamily:
    'Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  headings: { fontWeight: '700' },
  components: {
    Paper: { defaultProps: { withBorder: true, radius: 'md' } },
    Tooltip: { defaultProps: { withArrow: true, multiline: true, maw: 260 } },
  },
});
