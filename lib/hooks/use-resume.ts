'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useResumes() {
  return useQuery({
    queryKey: ['resumes'],
    queryFn: async () => {
      const res = await fetch('/api/resume');
      if (!res.ok) throw new Error('Failed to fetch resumes');
      return res.json();
    },
  });
}

export function useUploadResume() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch('/api/resume/parse', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('Failed to upload resume');
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['resumes'] }),
  });
}
