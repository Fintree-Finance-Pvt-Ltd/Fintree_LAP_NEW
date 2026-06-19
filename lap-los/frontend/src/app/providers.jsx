import { Provider } from 'react-redux';
import { QueryClientProvider } from '@tanstack/react-query';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { store } from './store.js';
import { queryClient } from './queryClient.js';
import { theme } from '../theme/theme.js';

export function AppProviders({ children }) {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          {children}
        </ThemeProvider>
      </QueryClientProvider>
    </Provider>
  );
}
