import { Provider } from 'react-redux';
import { QueryClientProvider } from '@tanstack/react-query';
import { store } from './store.js';
import { queryClient } from './queryClient.js';
import { AttendanceProvider } from '../context/AttendanceContext.jsx';

export function AppProviders({ children }) {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <AttendanceProvider>{children}</AttendanceProvider>
      </QueryClientProvider>
    </Provider>
  );
}


