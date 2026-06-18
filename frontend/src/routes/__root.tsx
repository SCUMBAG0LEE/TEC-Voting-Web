import { createRootRoute, Outlet } from '@tanstack/react-router';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';

export const Route = createRootRoute({
  component: () => (
    <ChakraProvider value={defaultSystem}>
      <Outlet />
    </ChakraProvider>
  ),
});
