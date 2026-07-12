import { createRootRoute, Outlet } from '@tanstack/react-router';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { Theme } from '@chakra-ui/react';
import AuraBackground from '../components/AuraBackground';
import { ErrorBoundary } from '../components/ErrorBoundary';

export const Route = createRootRoute({
  component: () => (
    <ErrorBoundary>
      <AuraBackground />
      <ChakraProvider value={defaultSystem}>
        <Theme appearance="dark">
          <Outlet />
        </Theme>
      </ChakraProvider>
    </ErrorBoundary>
  ),
});
