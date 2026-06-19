import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { applicationsApi } from '../applicationsApi.js';

export function useApplications() {
  return useQuery({ queryKey: ['applications'], queryFn: applicationsApi.list });
}

export function useCreateApplication() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: applicationsApi.create, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['applications'] }) });
}
