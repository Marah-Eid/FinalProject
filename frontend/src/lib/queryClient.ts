import { QueryClient } from '@tanstack/react-query'
import axios from 'axios'

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Skip retries on client errors — they won't get better on retry.
        retry: (count, error) => {
          if (axios.isAxiosError(error)) {
            const status = error.response?.status ?? 0
            if (status >= 400 && status < 500) return false
          }
          return count < 2
        },
        staleTime: 30_000,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: false,
      },
    },
  })
}
