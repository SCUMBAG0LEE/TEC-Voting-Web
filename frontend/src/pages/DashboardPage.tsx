import { useEffect, useState, useRef, useCallback } from 'react';
import { Box, SimpleGrid, Heading, Text, VStack, HStack, Image, Button, Spinner, Badge, Progress, Card } from '@chakra-ui/react';
import { useAtomValue, useSetAtom } from 'jotai';
import { animate, stagger } from 'animejs';
import { useNavigate } from '@tanstack/react-router';
import { Icon } from '@iconify/react';
import { tokenAtom, setTokenAtom } from '../store';
import { api } from '../api';
import { generateDeviceFingerprint, getFullDeviceData } from '../utils/fingerprint';
import Footer from '../components/Footer';

interface DashboardCandidate {
  id: number;
  name: string;
  photo: string | null;
  major: string;
  batch: number;
  vision: string;
  mission: string;
}

interface VoterVotingStatus {
  isActive: boolean;
  hasEnded: boolean;
  is_live_score_enabled: boolean | undefined;
  title: string;
  startDate: string;
  endDate: string;
}

interface ResultCandidate {
  id: number;
  name: string;
  votes: number;
}

export default function DashboardPage() {
  const token = useAtomValue(tokenAtom);
  const setToken = useSetAtom(setTokenAtom);
  const navigate = useNavigate();
  const [view, setView] = useState<'home' | 'vote' | 'success'>('home');
  const [candidates, setCandidates] = useState<DashboardCandidate[]>([]);
  const [votingStatus, setVotingStatus] = useState<VoterVotingStatus | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [voterNim, setVoterNim] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState<number | null>(null);
  const [votedCandidate, setVotedCandidate] = useState('');
  const [results, setResults] = useState<ResultCandidate[] | null>(null);
  const [totalVotes, setTotalVotes] = useState(0);
  const gridRef = useRef<HTMLDivElement>(null);

  const fetchHomeData = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const meRes = await api.voter.me.get({ $headers: { Authorization: `Bearer ${token}` } });
      if (meRes.data?.success && meRes.data.data) {
        setHasVoted(meRes.data.data.hasVoted);
        setVoterNim(meRes.data.data.nim);
        setVotingStatus(meRes.data.data.votingStatus as VoterVotingStatus);

        if (meRes.data.data.hasVoted && (meRes.data.data.votingStatus?.hasEnded || meRes.data.data.votingStatus?.is_live_score_enabled)) {
          const resultsRes = await api.voter.results.get({ $headers: { Authorization: `Bearer ${token}` } });
          if (resultsRes.data?.success && resultsRes.data.data) {
            setResults(resultsRes.data.data.candidates);
            setTotalVotes(resultsRes.data.data.totalVotes);
          }
        }
      } else if (meRes.error?.status === 401) {
        setToken(null);
        navigate({ to: '/login' });
        return;
      }
    } catch (e) {
      console.error("Dashboard fetch error:", e);
    }
    setIsLoading(false);
  }, [token, navigate, setToken]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchHomeData();
  }, [fetchHomeData]);

  useEffect(() => {
    if (view === 'vote' && candidates.length > 0 && gridRef.current) {
      animate(Array.from(gridRef.current.children), {
        y: { from: 50, to: 0 },
        opacity: { from: 0, to: 1 },
        duration: 800,
        delay: stagger(150),
        ease: 'outElastic(1, .8)'
      });
    }
  }, [view, candidates]);

  // Silent Polling for Live Score (Every 5 seconds)
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    // Only poll if they've voted, the election is running, and the admin allowed it
    if (hasVoted && votingStatus?.isActive && votingStatus?.is_live_score_enabled) {
      interval = setInterval(async () => {
        try {
          const resultsRes = await api.voter.results.get({ $headers: { Authorization: `Bearer ${token}` } });
          if (resultsRes.data?.success && resultsRes.data.data) {
            setResults(resultsRes.data.data.candidates);
            setTotalVotes(resultsRes.data.data.totalVotes);
          }
        } catch {
          // Silently fail on background poll
        }
      }, 20000); // 20 seconds prevents draining Cloudflare Free Tier limits
    }
    return () => clearInterval(interval);
  }, [hasVoted, votingStatus, token]);

  const handleEnterVotingBooth = async () => {
    setIsLoading(true);
    try {
      // 1. Double-Layer Protection: Check device fingerprint before allowing entry
      const fingerprint = await generateDeviceFingerprint();
      const verifyRes = await api.voter['verify-device'].post({
        fingerprint,
        $headers: { Authorization: `Bearer ${token}` }
      });

      if (!verifyRes.data?.success) {
        alert((verifyRes.error?.value as unknown as Record<string, string>)?.error || (verifyRes.error?.value as unknown as Record<string, string>)?.message || 'This device has already been used to vote.');
        setIsLoading(false);
        return;
      }

      // 2. Fetch Candidates if device is clean
      const candRes = await api.voter.candidates.get({ $headers: { Authorization: `Bearer ${token}` } });
      if (candRes.data?.success) {
        setCandidates(((candRes.data.data as Record<string, unknown>).candidates || candRes.data.data) as DashboardCandidate[]);
        setView('vote');
      } else {
        alert((candRes.error?.value as unknown as Record<string, string>)?.error || (candRes.error?.value as unknown as Record<string, string>)?.message || 'Could not load candidates.');
      }
    } catch {
      alert('Network error while entering voting booth.');
    }
    setIsLoading(false);
  };

  const handleVote = async (candidateId: number, candidateName: string) => {
    if (!confirm(`Are you sure you want to cast your final vote for ${candidateName}? This action cannot be undone.`)) return;
    
    setIsSubmitting(candidateId);

    try {
      const fingerprint = await generateDeviceFingerprint();
      const deviceInfo = await getFullDeviceData();

      const res = await api.voter.vote.post({ 
        candidateId,
        fingerprint,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        deviceInfo: deviceInfo as any,
        $headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data?.success) {
        setVotedCandidate(candidateName);
        setHasVoted(true);
        setView('success');

        // Refresh status in background
        api.voter.status.get().then(s => {
          if (s.data?.success && s.data.data.hasEnded) {
            api.voter.results.get({ $headers: { Authorization: `Bearer ${token}` } }).then(r => {
              if (r.data?.success && r.data.data) {
                setResults(r.data.data.candidates);
                setTotalVotes(r.data.data.totalVotes);
              }
            });
          }
        });
      } else {
        alert((res.error?.value as unknown as Record<string, string>)?.error || (res.error?.value as unknown as Record<string, string>)?.message || res.data?.error || 'Failed to vote. Please try again.');
        setIsSubmitting(null);
      }
    } catch (err) {
      console.error(err);
      alert('Network error occurred.');
      setIsSubmitting(null);
    }
  };

  if (isLoading) {
    return (
      <Box minH="100vh" bg="gray.900" display="flex" alignItems="center" justifyContent="center">
        <VStack gap={4}>
          <Spinner color="teal.400" size="xl" />
          <Text color="teal.200">Verifying secure session...</Text>
        </VStack>
      </Box>
    );
  }

  if (view === 'success') {
    return (
      <Box minH="100vh" bg="gray.900" color="white" display="flex" flexDir="column">
        <Box flex="1" display="flex" alignItems="center" justifyContent="center" p={4}>
        <VStack 
          gap={6} 
          bg="gray.800" 
          p={12} 
          borderRadius="2xl" 
          boxShadow="0 20px 40px rgba(0,0,0,0.5)"
          border="1px solid"
          borderColor="teal.800"
          textAlign="center"
          maxW="md"
        >
          <Icon icon="ph:check-circle-fill" fontSize="80px" color="#39C5BB" />
          <Heading size="xl" color="white">Vote Recorded!</Heading>
          <Text color="gray.400" fontSize="lg">
            Your vote for {votedCandidate} has been securely encrypted and cast. Thank you for participating.
          </Text>
          
          <Box bg="teal.900" borderColor="teal.700" borderWidth="1px" borderRadius="md" p={4} w="full" mt={2} textAlign="left">
            <HStack>
              <Icon icon="ph:lock-key-bold" color="#39C5BB" />
              <Text color="teal.100" fontWeight="bold">Anonymity Guaranteed</Text>
            </HStack>
            <Text color="teal.200" fontSize="sm" mt={1}>Your ballot has been stored immutably without tying it to your identity.</Text>
          </Box>

          <HStack w="full" mt={4} gap={4}>
            <Button colorPalette="gray" flex={1} onClick={() => setView('home')}>
              <Icon icon="ph:house-bold" /> Home
            </Button>
            <Button colorPalette="red" flex={1} onClick={() => { setToken(null); navigate({ to: '/login' }); }}>
              <Icon icon="ph:sign-out-bold" /> Logout
            </Button>
          </HStack>
        </VStack>
        </Box>
        <Footer />
      </Box>
    );
  }

  if (view === 'vote') {
    return (
      <Box minH="100vh" bg="gray.900" color="white" display="flex" flexDir="column">
        <Box flex="1" p={{ base: 4, md: 8 }}>
        <VStack gap={8} maxW="6xl" mx="auto">
          <Box w="full" bg="gray.800" p={6} borderRadius="xl" border="1px solid" borderColor="teal.800" boxShadow="lg">
            <HStack w="full" justify="space-between" flexDir={{ base: 'column', md: 'row' }} align={{ base: 'start', md: 'center' }}>
              <VStack align="start" gap={1}>
                <HStack>
                  <Icon icon="ph:voting-booth-bold" fontSize="36px" color="#22D3EE" />
                  <Heading size="xl" color="cyan.400">{votingStatus?.title || 'Voting Booth'}</Heading>
                </HStack>
                <Text color="gray.400" ml={1}>Secure Voting Session</Text>
              </VStack>
              <HStack>
                <Button variant="outline" onClick={() => setView('home')} color="gray.300" borderColor="gray.600" _hover={{ bg: 'gray.700' }}>
                  <Icon icon="ph:arrow-left-bold" /> Back to Home
                </Button>
              </HStack>
            </HStack>
          </Box>

          <SimpleGrid ref={gridRef} columns={{ base: 1, md: 2, lg: 3 }} gap={8} w="full">
            {candidates.map(candidate => (
              <Box 
                key={candidate.id}
                bg="gray.800"
                p={6}
                borderRadius="2xl"
                boxShadow="xl"
                opacity={0} // for animejs
                transition="transform 0.2s"
                _hover={{ transform: 'translateY(-5px)', shadow: '2xl' }}
                border="1px solid transparent"
                display="flex"
                flexDirection="column"
              >
                <Box position="relative">
                  <Image 
                    src={candidate.photo ? `${import.meta.env.VITE_API_URL}/static/${candidate.photo}` : `/default-avatar.svg`} 
                    onError={(e) => {
                      e.currentTarget.src = `/default-avatar.svg`;
                    }}
                    alt={candidate.name}
                    borderRadius="xl"
                    mb={4}
                    h="280px"
                    w="full"
                    objectFit="cover"
                    opacity={isSubmitting === candidate.id ? 0.5 : 1}
                  />
                </Box>
                <VStack align="start" gap={1} mb={4}>
                  <Heading size="lg" color="white">{candidate.name}</Heading>
                  <Text color="teal.300" fontWeight="bold">{candidate.major} <Text as="span" color="gray.400" fontWeight="normal">| Batch {candidate.batch}</Text></Text>
                </VStack>
                
                <Box flex="1">
                  <Box mb={4} textAlign="left" bg="gray.900" p={4} borderRadius="md" w="full" borderLeft="3px solid" borderColor="teal.400">
                    <Text fontSize="xs" fontWeight="bold" color="teal.300" textTransform="uppercase" mb={2}>Vision</Text>
                    <Text fontSize="sm" color="gray.300" whiteSpace="pre-wrap">{candidate.vision || 'No vision provided.'}</Text>
                  </Box>
                  
                  <Box textAlign="left" bg="gray.900" p={4} borderRadius="md" w="full" borderLeft="3px solid" borderColor="cyan.400">
                    <Text fontSize="xs" fontWeight="bold" color="cyan.300" textTransform="uppercase" mb={2}>Mission</Text>
                    <Text fontSize="sm" color="gray.300" whiteSpace="pre-wrap">{candidate.mission || 'No mission provided.'}</Text>
                  </Box>
                </Box>

                <Button
                  mt={6}
                  w="full"
                  colorPalette="teal"
                  size="lg"
                  loading={isSubmitting === candidate.id}
                  disabled={isSubmitting !== null}
                  onClick={() => handleVote(candidate.id, candidate.name)}
                  _hover={{ transform: 'scale(1.02)' }}
                  transition="transform 0.2s"
                >
                  <Icon icon="ph:check-circle-bold" />
                  {isSubmitting === candidate.id ? 'Casting Vote...' : 'Vote for ' + candidate.name.split(' ')[0]}
                </Button>
              </Box>
            ))}
          </SimpleGrid>
        </VStack>
        </Box>
        <Footer />
      </Box>
    );
  }

  // Home View
  const showResults = Boolean((votingStatus?.hasEnded || (hasVoted && votingStatus?.is_live_score_enabled)) && results && results.length > 0);

  return (
    <Box minH="100vh" bg="gray.900" color="white" display="flex" flexDir="column">
      <Box flex="1" p={{ base: 4, md: 8 }}>
      <VStack gap={8} maxW={showResults ? "6xl" : "4xl"} mx="auto" align="stretch" transition="max-width 0.3s ease">
        
        {/* Header Header */}
        <HStack w="full" justify="space-between" bg="gray.800" p={6} borderRadius="xl" border="1px solid" borderColor="teal.800" flexDir={{ base: 'column', sm: 'row' }} gap={4}>
          <VStack align="start" gap={1}>
            <HStack>
              <Icon icon="ph:house-bold" fontSize="32px" color="#4FD1C5" />
              <Heading size="lg" color="teal.300">Voter Homepage</Heading>
            </HStack>
            <Text color="gray.400" ml={1}>Welcome, NIM: <Text as="span" fontWeight="bold" color="white">{voterNim}</Text></Text>
          </VStack>
          <Button variant="outline" onClick={() => { setToken(null); navigate({ to: '/login' }); }} color="red.400" borderColor="red.800" _hover={{ bg: 'red.950' }}>
            <Icon icon="ph:sign-out-bold" /> Logout
          </Button>
        </HStack>

        <SimpleGrid columns={{ base: 1, lg: showResults ? 2 : 1 }} gap={8} alignItems="start" w="full">
          <VStack gap={8} align="stretch" w="full">
            {/* Election Status Card */}
            <Card.Root bg="gray.800" borderColor="gray.700" borderWidth="1px">
              <Card.Body>
                <VStack align="center" textAlign="center" gap={4}>
                  {votingStatus?.isActive ? (
                    <Icon icon="ph:broadcast-bold" fontSize="64px" color="#39C5BB" />
                  ) : votingStatus?.hasEnded ? (
                    <Icon icon="ph:flag-checkered-bold" fontSize="64px" color="#F6AD55" />
                  ) : (
                    <Icon icon="ph:hourglass-bold" fontSize="64px" color="#60A5FA" />
                  )}
                  
                  <Heading size="xl" color="white">{votingStatus?.title || 'TEC Election'}</Heading>
                  
                  <Badge colorPalette={votingStatus?.isActive ? 'teal' : votingStatus?.hasEnded ? 'orange' : 'blue'} size="lg" px={3} py={1} borderRadius="md">
                    {votingStatus?.isActive ? 'VOTING IS OPEN' : votingStatus?.hasEnded ? 'VOTING CONCLUDED' : 'UPCOMING ELECTION'}
                  </Badge>

                  <HStack gap={8} mt={2} color="gray.400" flexDir={{ base: 'column', md: 'row' }}>
                    <VStack gap={0}>
                      <Text fontSize="xs" textTransform="uppercase" fontWeight="bold">Starts</Text>
                      <Text color="white">{votingStatus?.startDate ? new Date(votingStatus.startDate).toLocaleString() : 'N/A'}</Text>
                    </VStack>
                    <Box w="1px" h="40px" bg="gray.600" display={{ base: 'none', md: 'block' }} />
                    <VStack gap={0}>
                      <Text fontSize="xs" textTransform="uppercase" fontWeight="bold">Ends</Text>
                      <Text color="white">{votingStatus?.endDate ? new Date(votingStatus.endDate).toLocaleString() : 'N/A'}</Text>
                    </VStack>
                  </HStack>
                </VStack>
              </Card.Body>
            </Card.Root>

            {/* Action / Status Card */}
            {votingStatus?.isActive && !hasVoted && (
              <Card.Root bg="teal.900" borderColor="teal.600" borderWidth="1px" animation="pulse 2s infinite">
                <Card.Body textAlign="center" py={8}>
                  <Heading size="md" color="white" mb={4}>You are eligible to vote!</Heading>
                  <Button colorPalette="teal" size="lg" px={8} py={6} fontSize="xl" onClick={handleEnterVotingBooth}>
                    <Icon icon="ph:door-open-bold" /> Enter Voting Booth
                  </Button>
                </Card.Body>
              </Card.Root>
            )}

            {hasVoted && (
              <Card.Root bg="gray.800" borderColor="blue.600" borderWidth="1px">
                <Card.Body textAlign="center" py={8}>
                  <Icon icon="ph:check-circle-fill" fontSize="64px" color="#60A5FA" style={{ margin: '0 auto 16px' }} />
                  <Heading size="md" color="white" mb={2}>You Have Voted</Heading>
                  <Text color="blue.200">Thank you for participating in this election.</Text>
                </Card.Body>
              </Card.Root>
            )}
          </VStack>

          {/* Results Section (Only if ended and results available) */}
          {showResults && (
            <Card.Root bg="gray.800" borderColor="gray.700" borderWidth="1px" h="full">
              <Card.Body>
                <Heading size="md" color="white" mb={6} textAlign="center">{votingStatus?.hasEnded ? '🏆 Final Election Results' : '📊 Live Election Tally'}</Heading>
                <VStack align="stretch" gap={4}>
                  {results?.map((candidate, index) => {
                    const percentage = totalVotes > 0 ? ((candidate.votes / totalVotes) * 100).toFixed(1) : 0;
                    const isWinner = index === 0;
                    return (
                      <Box key={candidate.id} p={4} bg="gray.900" borderRadius="md" borderLeftWidth="4px" borderLeftColor={isWinner ? "yellow.400" : "gray.600"}>
                        <HStack justify="space-between" mb={2}>
                          <HStack>
                            <Text fontWeight="bold" fontSize="lg" color={isWinner ? "yellow.400" : "gray.400"} w="24px">{index + 1}</Text>
                            <Text fontWeight="bold" fontSize="lg" color="white">{candidate.name}</Text>
                          </HStack>
                          <VStack align="flex-end" gap={0}>
                            <Text fontWeight="bold" color="white" fontSize="lg">{percentage}%</Text>
                            <Text fontSize="sm" color="gray.400">{candidate.votes} votes</Text>
                          </VStack>
                        </HStack>
                        <Progress.Root value={Number(percentage)} w="full" size="md" colorPalette={isWinner ? "yellow" : "blue"}>
                          <Progress.Track bg="gray.700">
                            <Progress.Range bg={isWinner ? "yellow.400" : "blue.400"} />
                          </Progress.Track>
                        </Progress.Root>
                      </Box>
                    );
                  })}
                </VStack>
                <Text textAlign="center" fontSize="sm" color="gray.500" mt={6}>Total Valid Votes: {totalVotes}</Text>
              </Card.Body>
            </Card.Root>
          )}
        </SimpleGrid>

      </VStack>
      </Box>
      <Footer />
    </Box>
  );
}
