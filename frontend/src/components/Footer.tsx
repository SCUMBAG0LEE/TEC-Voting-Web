import { Box, Text, Link } from '@chakra-ui/react';

export default function Footer({ position = "static" }: { position?: any }) {
  return (
    <Box position={position} bottom={0} left={0} w="full" p={6} textAlign="center" color="whiteAlpha.800" fontSize="sm" zIndex={10}>
      <Text>
        &copy; {new Date().getFullYear()}{' '}
        <Link 
          href="/" 
          color="white" 
          fontWeight="bold"
          display="inline-block"
          transition="all 0.3s"
          _hover={{ color: '#39C5BB', transform: 'scale(1.02)', textShadow: '0 0 10px rgba(57, 197, 187, 0.6)' }}
        >
          Tarumanagara English Club (TEC)
        </Link>. All rights reserved.
      </Text>
      <Text mt={2}>
        Developed by{' '}
        <Link 
          href="https://github.com/scumbag0lee" 
          color="#667eea" 
          fontWeight="bold"
          display="inline-block"
          transition="all 0.3s"
          _hover={{ color: '#93c5fd', transform: 'scale(1.05)', textShadow: '0 0 12px rgba(147, 197, 253, 0.8)' }}
        >
          SCUMBAG0LEE
        </Link>.
      </Text>
    </Box>
  );
}
