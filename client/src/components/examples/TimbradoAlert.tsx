import { TimbradoAlert } from '../TimbradoAlert';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

export default function TimbradoAlertExample() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="p-4">
        <TimbradoAlert />
      </div>
    </QueryClientProvider>
  );
}