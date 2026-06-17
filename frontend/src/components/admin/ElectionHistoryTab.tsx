import { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  VStack, 
  HStack, 
  Heading, 
  Text, 
  Button, 
  Card, 
  Badge,
  IconButton,
  Spinner,
  Image,
  SimpleGrid
} from '@chakra-ui/react';
import { Icon } from '@iconify/react';
import { api } from '../../api';

export function ElectionHistoryTab({ token }: { token: string | null }) {
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const animRef = useRef<HTMLDivElement>(null);

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const res = await api.admin.history.get({
        $headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data?.success) {
        setHistory(res.data.data);
      }
    } catch (e) {
      console.error('Failed to fetch history', e);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchHistory();
  }, [token]);

  useEffect(() => {
    if (!isLoading && animRef.current) {
      import('animejs').then((animeModule: any) => {
        if (!animRef.current) return;
        const { animate, stagger } = animeModule;
        if (typeof animate === 'function') {
          animate(Array.from(animRef.current.children), {
            y: [20, 0],
            opacity: [0, 1],
            duration: 600,
            delay: typeof stagger === 'function' ? stagger(100) : 0,
            ease: 'outExpo'
          });
        }
      }).catch(console.error);
    }
  }, [isLoading]);

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to permanently delete this history record?')) return;
    try {
      const res = await api.admin.history[id.toString()].delete({
        $headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data?.success) {
        fetchHistory();
      } else {
        alert('Failed to delete history');
      }
    } catch (e) {
      alert('Network error');
    }
  };

  return (
    <VStack ref={animRef} align="stretch" gap={8}>
      <Card.Root bg="gray.800" borderColor="gray.700" opacity={0}>
        <Card.Body>
          <HStack justify="space-between" mb={6}>
            <Box>
              <Heading size="md" color="white">Election History</Heading>
              <Text fontSize="sm" color="gray.400">Past election results and winners are automatically saved during an Archive & Reset operation.</Text>
            </Box>
          </HStack>

          {isLoading ? (
            <Box textAlign="center" py={12}>
              <Spinner color="teal.500" size="xl" />
            </Box>
          ) : history.length === 0 ? (
            <Box textAlign="center" py={12} bg="gray.900" borderRadius="md" borderWidth="1px" borderColor="gray.700">
              <Icon icon="ph:clock-counter-clockwise-bold" fontSize="48px" color="#4A5568" style={{ margin: '0 auto 16px' }} />
              <Text color="gray.400">No election history records found.</Text>
            </Box>
          ) : (
            <SimpleGrid columns={{ base: 1, lg: 2 }} gap={6}>
              {history.map((record) => (
                <Card.Root key={record.id} bg="gray.900" borderColor="gray.700" borderWidth="1px">
                  <Card.Body>
                    <HStack justify="space-between" mb={4} borderBottom="1px" borderColor="gray.700" pb={4} align="start">
                      <VStack align="start" gap={1}>
                        <Heading size="sm" color="teal.300">{record.election_title || 'Untitled Election'}</Heading>
                        <Text fontSize="xs" color="gray.500">
                          {new Date(record.start_date).toLocaleDateString()} - {new Date(record.end_date).toLocaleDateString()}
                        </Text>
                      </VStack>
                      <IconButton 
                        aria-label="Delete record" 
                        variant="ghost" 
                        color="red.400" 
                        size="sm"
                        onClick={() => handleDelete(record.id)}
                      >
                        <Icon icon="ph:trash-bold" />
                      </IconButton>
                    </HStack>

                    <HStack gap={6} align={{ base: "center", sm: "start" }} flexDir={{ base: 'column', sm: 'row' }}>
                      <Image 
                        src={!record.winner_name.startsWith('Tie') && record.winner_photo ? `${import.meta.env.VITE_API_URL}/static/${record.winner_photo}` : '/default-avatar.svg'}
                        onError={(e) => { e.currentTarget.src = '/default-avatar.svg'; }}
                        w="100px" 
                        h="100px" 
                        objectFit="cover" 
                        borderRadius="xl" 
                        fallback={<Box w="100px" h="100px" bg="gray.800" borderRadius="xl" />}
                      />
                      <VStack align="start" gap={1} flex={1}>
                        <Badge colorPalette={record.winner_name.startsWith('Tie') ? 'gray' : 'yellow'} variant="solid" mb={1}>
                          {record.winner_name.startsWith('Tie') ? 'TIE' : 'WINNER'}
                        </Badge>
                        <Heading size="md" color="white">{record.winner_name}</Heading>
                        <Text fontSize="sm" color="gray.400">
                          {record.winner_name.startsWith('Tie') ? `NIMs: ${record.winner_nim}` : `${record.winner_major} (Batch ${record.winner_batch})`}
                        </Text>
                        
                        <HStack mt={3} justify="space-between" w="full" bg="gray.800" p={2} borderRadius="md">
                          <VStack align="center" gap={0}>
                            <Text fontSize="xs" color="gray.500">Winning Votes</Text>
                            <Text fontWeight="bold" color="cyan.300">{record.winner_votes}</Text>
                          </VStack>
                          <VStack align="center" gap={0}>
                            <Text fontSize="xs" color="gray.500">Turnout</Text>
                            <Text fontWeight="bold" color="teal.300">
                              {record.total_voters > 0 ? Math.round((record.voters_participated / record.total_voters) * 100) : 0}%
                            </Text>
                          </VStack>
                        </HStack>
                      </VStack>
                    </HStack>
                  </Card.Body>
                </Card.Root>
              ))}
            </SimpleGrid>
          )}
        </Card.Body>
      </Card.Root>
    </VStack>
  );
}
