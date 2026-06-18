import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Box, 
  VStack, 
  HStack, 
  Heading, 
  Text, 
  Button, 
  Input, 
  Textarea, 
  Card, 
  Table,
  Badge,
  IconButton,
  Spinner,
  Group
} from '@chakra-ui/react';
import { Icon } from '@iconify/react';
import { api } from '../../api';

interface Voter {
  no: number;
  nim: string;
  vote: boolean;
}

export function VoterManagementTab({ token }: { token: string | null }) {
  const [votersText, setVotersText] = useState('');
  const [isManualLoading, setIsManualLoading] = useState(false);
  const [isCsvLoading, setIsCsvLoading] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);

  // Voter list state
  const [voters, setVoters] = useState<Voter[]>([]);
  const [totalVoters, setTotalVoters] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy] = useState('no');
  const [sortOrder, setSortOrder] = useState('asc');
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [totalPages, setTotalPages] = useState(1);

  const fetchVoters = useCallback(async () => {
    setIsLoadingList(true);
    try {
      const queryObj: Record<string, string> = { 
        page: page.toString(), 
        limit: '10', 
        sortBy, 
        sortOrder 
      };
      if (debouncedSearch) queryObj.search = debouncedSearch;

      const res = await api.admin.voters.get({
        $headers: { Authorization: `Bearer ${token}` },
        $query: queryObj
      });
      if (res.data?.success) {
        setVoters(res.data.data.voters);
        setTotalVoters(res.data.data.pagination.total);
        setTotalPages(res.data.data.pagination.totalPages);
      }
    } catch (e) {
      console.error(e);
    }
    setIsLoadingList(false);
  }, [page, debouncedSearch, sortBy, sortOrder, token]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchVoters();
  }, [fetchVoters]);

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
    setPage(1);
  };

  const handleManualImport = async () => {
    if (!votersText.trim()) return;
    setIsManualLoading(true);
    const nims = votersText.split(/[\n,]/).map(s => s.trim()).filter(s => s.length > 0);
    
    try {
      const res = await api.admin.voters.bulk.post({ 
        nims, 
        $headers: { Authorization: `Bearer ${token}` } 
      });
      if (res.data?.success) {
        alert(res.data.message);
        setVotersText('');
        fetchVoters();
      } else {
        alert('Error: ' + res.error?.value);
      }
    } catch {
      alert('Network error');
    }
    setIsManualLoading(false);
  };

  const handleCsvImport = async () => {
    if (!csvFile) return;
    setIsCsvLoading(true);
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      const nims = text.split('\n')
        .map(row => row.split(',')[0]?.trim().replace(/['"]/g, ''))
        .filter(nim => nim && nim.length === 9 && !isNaN(Number(nim)));
        
      if (nims.length === 0) {
        alert("No valid 9-digit NIMs found in CSV.");
        setIsCsvLoading(false);
        return;
      }

      try {
        const res = await api.admin.voters.bulk.post({ 
          nims, 
          $headers: { Authorization: `Bearer ${token}` } 
        });
        if (res.data?.success) {
          alert(`CSV Import: ${res.data.message}`);
          setCsvFile(null);
          fetchVoters();
        } else {
          alert('Error: ' + res.error?.value);
        }
      } catch {
        alert('Network error during CSV upload');
      }
      setIsCsvLoading(false);
    };
    reader.readAsText(csvFile);
  };

  const handleDelete = async (nim: string) => {
    if (!confirm(`Are you sure you want to delete voter ${nim}?`)) return;
    try {
      const res = await api.admin.voters[nim].delete({
        $headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data?.success) {
        fetchVoters();
      } else {
        alert('Error deleting voter');
      }
    } catch {
      alert('Network error');
    }
  };

  const handleAddSingle = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const nim = new FormData(e.currentTarget).get('singleNim') as string;
    if (!nim || nim.length !== 9) return alert('NIM must be exactly 9 digits');
    
    try {
      const res = await api.admin.voters.post({
        nim,
        $headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data?.success) {
        (e.target as HTMLFormElement).reset();
        fetchVoters();
      } else {
        alert('Failed: ' + res.error?.value);
      }
    } catch {
      alert('Network error');
    }
  };

  const animRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (animRef.current) {
      import('animejs').then((animeModule) => {
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
  }, []);

  return (
    <VStack ref={animRef} align="stretch" gap={8}>
      
      {/* Voter List Table */}
      <Card.Root bg="gray.800" borderColor="gray.700" opacity={0}>
        <Card.Body>
          <HStack justify="space-between" mb={6} flexDir={{ base: 'column', md: 'row' }} align={{ base: 'start', md: 'center' }} gap={4}>
            <Heading size="md" color="white">Voters List ({totalVoters})</Heading>
            <HStack w={{ base: 'full', md: 'auto' }}>
              <form onSubmit={handleAddSingle} style={{ display: 'flex', gap: '8px', width: '100%', flexWrap: 'wrap' }}>
                <Input name="singleNim" placeholder="Add Single NIM" bg="gray.900" color="white" borderColor="gray.600" w={{ base: 'full', sm: '150px' }} />
                <Button type="submit" colorPalette="teal" size="sm" mt={{ base: 0, sm: 1 }} w={{ base: 'full', sm: 'auto' }}>Add</Button>
              </form>
            </HStack>
          </HStack>

          <Input 
            placeholder="Search by NIM..." 
            mb={4} 
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            bg="gray.900" 
            color="white" 
            borderColor="gray.600" 
            w={{ base: 'full', md: '300px' }}
          />

          <Box overflowX="auto" borderRadius="md" borderWidth="1px" borderColor="gray.700">
            <Table.Root size="sm" variant="outline" color="white">
              <Table.Header bg="gray.900">
                <Table.Row>
                  <Table.ColumnHeader color="gray.400" cursor="pointer" onClick={() => handleSort('no')}>
                    <HStack gap={1}><Text>#</Text>{sortBy === 'no' && <Icon icon={sortOrder === 'asc' ? "ph:caret-up-bold" : "ph:caret-down-bold"} />}</HStack>
                  </Table.ColumnHeader>
                  <Table.ColumnHeader color="gray.400" cursor="pointer" onClick={() => handleSort('nim')}>
                    <HStack gap={1}><Text>NIM</Text>{sortBy === 'nim' && <Icon icon={sortOrder === 'asc' ? "ph:caret-up-bold" : "ph:caret-down-bold"} />}</HStack>
                  </Table.ColumnHeader>
                  <Table.ColumnHeader color="gray.400" cursor="pointer" onClick={() => handleSort('vote')}>
                    <HStack gap={1}><Text>Status</Text>{sortBy === 'vote' && <Icon icon={sortOrder === 'asc' ? "ph:caret-up-bold" : "ph:caret-down-bold"} />}</HStack>
                  </Table.ColumnHeader>
                  <Table.ColumnHeader color="gray.400" textAlign="right">Actions</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {isLoadingList ? (
                  <Table.Row>
                    <Table.Cell colSpan={4} textAlign="center" py={8}>
                      <Spinner color="teal.500" />
                    </Table.Cell>
                  </Table.Row>
                ) : voters.length === 0 ? (
                  <Table.Row>
                    <Table.Cell colSpan={4} textAlign="center" py={8} color="gray.500">
                      No voters found
                    </Table.Cell>
                  </Table.Row>
                ) : (
                  voters.map((voter) => (
                    <Table.Row key={voter.no} _hover={{ bg: 'gray.700' }}>
                      <Table.Cell color="gray.300">{voter.no}</Table.Cell>
                      <Table.Cell color="white" fontWeight="bold">{voter.nim}</Table.Cell>
                      <Table.Cell>
                        <Badge colorPalette={voter.vote ? 'teal' : 'gray'}>
                          {voter.vote ? 'Voted' : 'Not Voted'}
                        </Badge>
                      </Table.Cell>
                      <Table.Cell textAlign="right">
                        <IconButton 
                          aria-label="Delete voter" 
                          variant="ghost" 
                          color="red.400" 
                          size="sm"
                          onClick={() => handleDelete(voter.nim)}
                        >
                          <Icon icon="ph:trash-bold" />
                        </IconButton>
                      </Table.Cell>
                    </Table.Row>
                  ))
                )}
              </Table.Body>
            </Table.Root>
          </Box>

          <HStack justify="space-between" mt={4} flexDir={{ base: 'column', sm: 'row' }} gap={4}>
            <Text fontSize="sm" color="gray.400">Page {page} of {totalPages || 1}</Text>
            <Group attached>
              <Button size="sm" variant="outline" color="teal.300" borderColor="gray.600" _hover={{ bg: "gray.700" }} disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
              <Button size="sm" variant="outline" color="teal.300" borderColor="gray.600" _hover={{ bg: "gray.700" }} disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
            </Group>
          </HStack>
        </Card.Body>
      </Card.Root>

      <HStack gap={8} align="start" flexDir={{ base: 'column', md: 'row' }}>
        <Card.Root bg="gray.800" borderColor="gray.700" opacity={0} flex={1} w="full">
          <Card.Body>
            <Heading size="md" mb={4} color="teal.300">Manual Bulk Import</Heading>
            <Text fontSize="sm" color="teal.100" mb={4}>Paste a list of 9-digit NIMs separated by commas or newlines.</Text>
            <Textarea 
              value={votersText}
              onChange={(e) => setVotersText(e.target.value)}
              placeholder="112350255, 115160106&#10;115160130"
              rows={6}
              mb={4}
              color="white"
              bg="gray.900"
              borderColor="teal.700"
              _focus={{ borderColor: 'teal.400' }}
            />
            <Button colorPalette="teal" onClick={handleManualImport} loading={isManualLoading} disabled={!votersText.trim() || isCsvLoading}>
              Import Voters
            </Button>
          </Card.Body>
        </Card.Root>

        <Card.Root bg="gray.800" borderColor="gray.700" opacity={0} flex={1} w="full">
          <Card.Body>
            <Heading size="md" mb={4} color="cyan.300">CSV Bulk Import</Heading>
            <Text fontSize="sm" color="cyan.100" mb={4}>Upload a .csv file. The parser will extract 9-digit numbers from the first column.</Text>
            <Input 
              type="file" 
              accept=".csv" 
              onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
              mb={4}
              p={1}
              color="white"
              borderColor="cyan.700"
            />
            <Button colorPalette="cyan" onClick={handleCsvImport} loading={isCsvLoading} disabled={!csvFile || isManualLoading} w="full">
              Process CSV File
            </Button>
          </Card.Body>
        </Card.Root>
      </HStack>
    </VStack>
  );
}
