import { useEffect, useState, useRef, useCallback } from 'react';
import { Box, SimpleGrid, Heading, Text, VStack, Button, HStack, Badge, Card, Progress, Tabs, Input, Image } from '@chakra-ui/react';
import { useAtomValue, useSetAtom } from 'jotai';
import { animate, stagger } from 'animejs';
import { adminTokenAtom, setAdminTokenAtom } from '../../store';
import { useNavigate } from '@tanstack/react-router';
import { Icon } from '@iconify/react';
import { api } from '../../api';
import Footer from '../../components/Footer';
import { CandidateManagementTab } from '../../components/admin/CandidateManagementTab';
import { VoterManagementTab } from '../../components/admin/VoterManagementTab';
import { ElectionHistoryTab } from '../../components/admin/ElectionHistoryTab';

interface VotingConfig {
  voting_title: string;
  vot_start_date: string;
  vot_end_date: string;
  is_live_score_enabled: boolean;
}

interface AdminVotingStatus {
  isActive: boolean;
  config: VotingConfig;
}

interface TallyCandidate {
  id: number;
  no: number;
  name: string;
  photo: string | null;
  votes: number;
}

interface DashboardStats {
  totalVoters: number;
  votersVoted: number;
  totalCandidates: number;
  participationRate: number;
}

interface AdminDashboardData {
  stats: DashboardStats;
  votingStatus: AdminVotingStatus;
  tally: TallyCandidate[];
}

export default function AdminDashboardPage() {
  const token = useAtomValue(adminTokenAtom);
  const setToken = useSetAtom(setAdminTokenAtom);
  const navigate = useNavigate();
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState<boolean>(false);
  const gridRef = useRef<HTMLDivElement>(null);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const [dashRes, meRes] = await Promise.all([
        api.admin.dashboard.get({ $headers: { Authorization: `Bearer ${token}` } }),
        api.admin.me.get({ $headers: { Authorization: `Bearer ${token}` } })
      ]);
      if (dashRes.data?.success && dashRes.data.data) {
        setData(dashRes.data.data as unknown as AdminDashboardData);
      } else if (dashRes.error?.status === 401) {
        setToken(null);
      }
      if (meRes.data?.success && meRes.data.data) {
        setIsOwner(meRes.data.data.role === 'owner');
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, [token, setToken]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchDashboard();
  }, [fetchDashboard]);

  // Silent polling for Live Admin Tally
  useEffect(() => {
    const interval = setInterval(async () => {
      if (!token || document.visibilityState !== 'visible') return;
      try {
        const dashRes = await api.admin.dashboard.get({ $headers: { Authorization: `Bearer ${token}` } });
        if (dashRes.data?.success && 'data' in dashRes.data) {
          const freshData = dashRes.data.data;
          setData((prev) => prev ? { ...prev, ...(freshData as unknown as AdminDashboardData) } : (freshData as unknown as AdminDashboardData));
        }
      } catch {
        // Silent fail
      }
    }, 20000); // 20 seconds prevents draining Cloudflare Free Tier limits
    return () => clearInterval(interval);
  }, [token]);

  useEffect(() => {
    if (!loading && data && gridRef.current) {
      animate(Array.from(gridRef.current.children), {
        y: { from: 50, to: 0 },
        opacity: { from: 0, to: 1 },
        duration: 800,
        delay: stagger(100),
        ease: 'outElastic(1, .8)'
      });
    }
  }, [loading, data]);

  if (loading && !data) {
    return <Box h="100vh" display="flex" alignItems="center" justifyContent="center" bg="gray.900" color="white">Loading admin portal...</Box>;
  }

  const { stats, votingStatus, tally } = data || {};
  const totalVotes = tally?.reduce((sum: number, c: TallyCandidate) => sum + c.votes, 0) || 0;

  return (
    <Box minH="100vh" bg="gray.900" color="white" display="flex" flexDir="column">
      <Box flex="1" p={{ base: 4, md: 8 }}>
      <HStack justify="space-between" mb={8} borderBottom="1px" borderColor="teal.800" pb={4} flexDir={{ base: 'column', sm: 'row' }} align={{ base: 'start', sm: 'center' }} gap={4}>
        <VStack align="start" gap={0}>
          <HStack>
            <Icon icon="ph:shield-star-bold" fontSize="24px" color="#4FD1C5" />
            <Heading size="lg" color="teal.300">TEC Admin Portal</Heading>
          </HStack>
          <Text color="teal.100">Live Election Dashboard</Text>
        </VStack>
        <Button colorPalette="red" variant="outline" onClick={() => { setToken(null); navigate({ to: '/login' }); }} color="red.400" borderColor="red.800" _hover={{ bg: 'red.900' }} w={{ base: 'full', sm: 'auto' }}>
          <Icon icon="ph:sign-out-bold" />
          Logout
        </Button>
      </HStack>

      <Tabs.Root defaultValue="dashboard" variant="enclosed">
        <Tabs.List mb={6} bg="gray.800" borderRadius="md" p={2} flexWrap="wrap" gap={2} w="full" justifyContent={{ base: 'center', md: 'flex-start' }} borderBottom="none">
          <Tabs.Trigger value="dashboard" color="gray.300" _selected={{ bg: '#39C5BB', color: 'gray.900', fontWeight: 'bold' }} flex={{ base: '1 1 45%', md: '0 1 auto' }} justifyContent="center">
            <HStack gap={2}><Icon icon="ph:chart-line-up-bold" /> Live Dashboard</HStack>
          </Tabs.Trigger>
          <Tabs.Trigger value="candidates" color="gray.300" _selected={{ bg: '#39C5BB', color: 'gray.900', fontWeight: 'bold' }} flex={{ base: '1 1 45%', md: '0 1 auto' }} justifyContent="center">
            <HStack gap={2}><Icon icon="ph:users-three-bold" /> Candidates</HStack>
          </Tabs.Trigger>
          <Tabs.Trigger value="voters" color="gray.300" _selected={{ bg: '#39C5BB', color: 'gray.900', fontWeight: 'bold' }} flex={{ base: '1 1 45%', md: '0 1 auto' }} justifyContent="center">
            <HStack gap={2}><Icon icon="ph:address-book-bold" /> Voter Management</HStack>
          </Tabs.Trigger>
          <Tabs.Trigger value="history" color="gray.300" _selected={{ bg: '#39C5BB', color: 'gray.900', fontWeight: 'bold' }} flex={{ base: '1 1 45%', md: '0 1 auto' }} justifyContent="center">
            <HStack gap={2}><Icon icon="ph:clock-counter-clockwise-bold" /> History</HStack>
          </Tabs.Trigger>
          <Tabs.Trigger value="settings" color="gray.300" _selected={{ bg: '#39C5BB', color: 'gray.900', fontWeight: 'bold' }} flex={{ base: '1 1 45%', md: '0 1 auto' }} justifyContent="center">
            <HStack gap={2}><Icon icon="ph:gear-six-bold" /> Settings</HStack>
          </Tabs.Trigger>
          <Tabs.Trigger value="danger" color="red.300" _selected={{ bg: '#F32C9E', color: 'white', fontWeight: 'bold' }} flex={{ base: '1 1 45%', md: '0 1 auto' }} justifyContent="center">
            <HStack gap={2}><Icon icon="ph:warning-circle-bold" /> Danger Zone</HStack>
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="dashboard">
          <SimpleGrid columns={{ base: 1, md: 3 }} gap={6} mb={8}>
            <Card.Root bg="gray.800" borderColor="gray.700">
              <Card.Body>
                <VStack align="start">
                  <Text color="teal.100" fontSize="sm">Total Voters</Text>
                  <Heading size="2xl" color="white">{stats?.totalVoters || 0}</Heading>
                  <Progress.Root value={((stats?.votersVoted || 0) / (stats?.totalVoters || 1)) * 100} w="full" size="sm" colorPalette="teal">
                    <Progress.Track bg="gray.700">
                      <Progress.Range bg="teal.400" />
                    </Progress.Track>
                  </Progress.Root>
                  <Text fontSize="xs" color="teal.200">{stats?.votersVoted} have voted</Text>
                </VStack>
              </Card.Body>
            </Card.Root>

            <Card.Root bg="gray.800" borderColor="gray.700">
              <Card.Body>
                <VStack align="start">
                  <Text color="teal.100" fontSize="sm">Election Status</Text>
                  <Badge colorPalette={votingStatus?.isActive ? 'cyan' : 'red'} size="lg" variant="solid">
                    {votingStatus?.isActive ? 'ACTIVE' : 'INACTIVE'}
                  </Badge>
                  <Text fontSize="xs" color="teal.200" mt={2}>
                    Start: {votingStatus?.config?.vot_start_date ? new Date(votingStatus.config.vot_start_date).toLocaleString() : 'N/A'}
                  </Text>
                  <Text fontSize="xs" color="teal.200">
                    End: {votingStatus?.config?.vot_end_date ? new Date(votingStatus.config.vot_end_date).toLocaleString() : 'N/A'}
                  </Text>
                </VStack>
              </Card.Body>
            </Card.Root>
          </SimpleGrid>

          <Heading size="md" mb={4} color="white">Live Vote Tally</Heading>
          
          <SimpleGrid ref={gridRef} columns={{ base: 1, md: 2, lg: (tally?.length ?? 0) > 2 ? 3 : 2 }} gap={6}>
            {tally?.map((candidate) => {
              const percentage = totalVotes === 0 ? 0 : ((candidate.votes / totalVotes) * 100).toFixed(1);
              return (
                <Card.Root key={candidate.id} bg="gray.800" borderColor="gray.700" overflow="hidden" opacity={0}>
                  <Card.Body>
                    <VStack align="stretch" gap={4}>
                      <HStack justify="space-between">
                        <HStack align="center" gap={3}>
                          <Image 
                            src={candidate.photo ? `${import.meta.env.VITE_API_URL}/static/${candidate.photo}` : `/default-avatar.svg`} 
                            onError={(e) => { e.currentTarget.src = `/default-avatar.svg`; }}
                            w="48px" h="48px" borderRadius="xl" objectFit="cover"
                          />
                          <VStack align="start" gap={0}>
                            <Heading size="md" color="white">Candidate {candidate.no}</Heading>
                            <Text color="cyan.200" fontSize="sm">{candidate.name}</Text>
                          </VStack>
                        </HStack>
                        <Badge colorPalette="cyan" variant="solid" fontSize="xl" px={3} py={1} borderRadius="lg">
                          {percentage}%
                        </Badge>
                      </HStack>
                      
                      <Box>
                        <HStack justify="space-between" mb={1}>
                          <Text fontSize="sm" color="teal.100">Votes</Text>
                          <Text fontWeight="bold" color="white">{candidate.votes}</Text>
                        </HStack>
                        <Progress.Root value={Number(percentage)} w="full" size="md" colorPalette="cyan">
                          <Progress.Track bg="gray.700">
                            <Progress.Range bg="cyan.400" />
                          </Progress.Track>
                        </Progress.Root>
                      </Box>
                    </VStack>
                  </Card.Body>
                </Card.Root>
              );
            })}
          </SimpleGrid>
        </Tabs.Content>

        <Tabs.Content value="candidates">
          <CandidateManagementTab token={token} />
        </Tabs.Content>

        <Tabs.Content value="voters">
          <VoterManagementTab token={token} />
        </Tabs.Content>

        <Tabs.Content value="history">
          <ElectionHistoryTab token={token} />
        </Tabs.Content>

        <Tabs.Content value="settings">
          <SettingsTab token={token} votingConfig={votingStatus?.config} onUpdate={fetchDashboard} />
        </Tabs.Content>

        <Tabs.Content value="danger">
          <DangerZoneTab token={token} onUpdate={fetchDashboard} isOwner={isOwner} />
        </Tabs.Content>
      </Tabs.Root>
      </Box>
      <Footer />
    </Box>
  );
}

// ==========================================
// SUB-COMPONENTS
// ==========================================

// VoterManagementTab moved to its own component file

function SettingsTab({ token, votingConfig, onUpdate }: { token: string | null, votingConfig: VotingConfig | undefined, onUpdate: () => void }) {
  const [title, setTitle] = useState(votingConfig?.voting_title || '');
  const [startDate, setStartDate] = useState(votingConfig?.vot_start_date ? new Date(votingConfig.vot_start_date).toISOString().slice(0, 16) : '');
  const [endDate, setEndDate] = useState(votingConfig?.vot_end_date ? new Date(votingConfig.vot_end_date).toISOString().slice(0, 16) : '');
  const [liveScore, setLiveScore] = useState(votingConfig?.is_live_score_enabled || false);
  const [loading, setLoading] = useState(false);

  const animRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (animRef.current) {
      animate(animRef.current, {
        y: { from: 20, to: 0 },
        opacity: { from: 0, to: 1 },
        duration: 600,
        ease: 'outQuad'
      });
    }
  }, []);

  const handleUpdate = async () => {
    setLoading(true);
    try {
      const promises = [];

      if (title !== votingConfig?.voting_title) {
        promises.push(api.admin.voting.title.put({ 
          voting_title: title,
          $headers: { Authorization: `Bearer ${token}` } 
        }));
      }
      
      if (liveScore !== (votingConfig?.is_live_score_enabled || false)) {
        promises.push(api.admin.voting['live-score'].put({ 
          is_live_score_enabled: liveScore,
          $headers: { Authorization: `Bearer ${token}` } 
        }));
      }

      const scheduleChanged = (new Date(startDate).toISOString() !== new Date(votingConfig?.vot_start_date || '').toISOString()) || 
                              (new Date(endDate).toISOString() !== new Date(votingConfig?.vot_end_date || '').toISOString());

      if (scheduleChanged && startDate && endDate) {
        promises.push(api.admin.voting.schedule.put({ 
          vot_start_date: new Date(startDate).toISOString(), 
          vot_end_date: new Date(endDate).toISOString(),
          $headers: { Authorization: `Bearer ${token}` } 
        }));
      }

      if (promises.length === 0) {
        alert("No changes to save.");
        setLoading(false);
        return;
      }

      const results = await Promise.all(promises);
      const errors = results.filter(res => !res.data?.success);

      if (errors.length > 0) {
        const errorMessages = errors.map(e => e.error?.value?.message || 'An unknown error occurred.').join('\n');
        throw new Error(errorMessages);
      }
      
      alert('Election settings have been saved successfully.');
      onUpdate();

    } catch (e: unknown) {
      alert(`Update Failed: ${e instanceof Error ? e.message : String(e)}`);
    }
    setLoading(false);
  };

  return (
    <Card.Root ref={animRef} bg="gray.800" borderColor="gray.700" opacity={0}>
      <Card.Body>
        <Heading size="md" mb={4} color="white">Election Settings</Heading>
        <VStack align="stretch" gap={4}>
          <Box>
            <Text fontSize="sm" color="gray.400" mb={1}>Election Title</Text>
            <Input value={title} onChange={e => setTitle(e.target.value)} bg="gray.900" color="white" borderColor="gray.600" />
          </Box>
          <HStack flexDir={{ base: 'column', sm: 'row' }} gap={4}>
            <Box flex={1} w="full">
              <Text fontSize="sm" color="gray.400" mb={1}>Start Date</Text>
              <Input type="datetime-local" value={startDate} onChange={e => setStartDate(e.target.value)} bg="gray.900" color="white" borderColor="gray.600" />
            </Box>
            <Box flex={1} w="full">
              <Text fontSize="sm" color="gray.400" mb={1}>End Date</Text>
              <Input type="datetime-local" value={endDate} onChange={e => setEndDate(e.target.value)} bg="gray.900" color="white" borderColor="gray.600" />
            </Box>
          </HStack>
          <Box mt={2} p={4} bg="gray.900" borderRadius="md" borderColor="gray.600" borderWidth="1px">
            <HStack justify="space-between">
              <VStack align="start" gap={0}>
                <Text color="white" fontWeight="bold">Enable Live Score</Text>
                <Text fontSize="sm" color="gray.400">Allow voters to see the current tally after they cast their ballot.</Text>
              </VStack>
              <Box as="label" display="flex" alignItems="center" cursor="pointer">
                <input type="checkbox" checked={liveScore} onChange={(e) => setLiveScore(e.target.checked)} style={{ width: '20px', height: '20px', cursor: 'pointer' }} />
              </Box>
            </HStack>
          </Box>
          <Button colorPalette="teal" mt={4} onClick={handleUpdate} loading={loading}>Save Changes</Button>
        </VStack>
      </Card.Body>
    </Card.Root>
  );
}

function DangerZoneTab({ token, onUpdate, isOwner }: { token: string | null, onUpdate: () => void, isOwner: boolean }) {
  const [jsonFile, setJsonFile] = useState<File | null>(null);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [backupLoading, setBackupLoading] = useState(false);
  const [resetVotersLoading, setResetVotersLoading] = useState(false);
  const [resetTallyLoading, setResetTallyLoading] = useState(false);
  const [factoryResetLoading, setFactoryResetLoading] = useState(false);
  const [factoryResetConfirm, setFactoryResetConfirm] = useState('');
  const [deleteVoters, setDeleteVoters] = useState(true);
  const [deleteCandidates, setDeleteCandidates] = useState(true);

  const handleRestore = async () => {
    if (!jsonFile) return;
    if (!confirm('Are you absolutely sure? This will OVERWRITE the entire database with the backup file!')) return;
    
    setRestoreLoading(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const payload = JSON.parse(e.target?.result as string);
        const res = await api.admin.system.restore.post({
          ...payload,
          $headers: { Authorization: `Bearer ${token}` }
        });
        
        if (res.data?.success) {
          alert('The system has been successfully restored from the backup file.');
          onUpdate();
        } else {
          throw new Error(String((res.error?.value as unknown as Record<string, string>)?.message || 'Restore failed.'));
        }
      } catch (err: unknown) {
        alert(`Restore Error: ${err instanceof Error ? err.message : 'Failed to parse JSON file or network error.'}`);
      }
      setRestoreLoading(false);
    };
    reader.readAsText(jsonFile);
  };

  const handleDownloadBackup = async (saveToR2: boolean) => {
    setBackupLoading(true);
    try {
      const res = await api.admin.system.backup.post({ 
        saveToR2,
        $headers: { Authorization: `Bearer ${token}` }
      });

      if (saveToR2) {
        if ((res.data as Record<string, unknown>)?.success) {
          alert((res.data as unknown as Record<string, string>).message);
        } else {
          throw new Error(String(res.error?.value || 'Failed to save backup to R2'));
        }
      } else {
        const blob = await (res as unknown as { raw: Response }).raw.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        const disposition = (res as unknown as { raw: Response }).raw.headers.get('content-disposition');
        let filename = `tec-voting-backup-${Date.now()}.json`;
        if (disposition && disposition.includes('attachment')) {
            const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
            const matches = filenameRegex.exec(disposition);
            if (matches?.[1]) filename = matches[1].replace(/['"]/g, '');
        }
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (e: unknown) {
      alert(`Backup failed: ${e instanceof Error ? e.message : String(e)}`);
    }
    setBackupLoading(false);
  };

  const handleResetVoters = async () => {
    if (!confirm('Are you sure you want to reset all voter statuses? This will clear their vote records and device fingerprints.')) return;
    setResetVotersLoading(true);
    try {
      const res = await api.admin.reset.voters.post({ $headers: { Authorization: `Bearer ${token}` }});
      if (res.data?.success) {
        alert(`Voters Reset: ${res.data.message}`);
        onUpdate();
      } else {
        throw new Error(String((res.error?.value as unknown as Record<string, string>)?.message || 'Failed to reset voters.'));
      }
    } catch (e: unknown) {
      alert(`Error: ${e instanceof Error ? e.message : String(e)}`);
    }
    setResetVotersLoading(false);
  };

  const handleResetTally = async () => {
    if (!confirm('Are you sure you want to reset all candidate votes to zero?')) return;
    setResetTallyLoading(true);
    try {
      const res = await api.admin.reset.votes.post({ $headers: { Authorization: `Bearer ${token}` }});
      if (res.data?.success) {
        alert(`Tally Reset: ${res.data.message}`);
        onUpdate();
      } else {
        throw new Error(String((res.error?.value as unknown as Record<string, string>)?.message || 'Failed to reset tally.'));
      }
    } catch (e: unknown) {
      alert(`Error: ${e instanceof Error ? e.message : String(e)}`);
    }
    setResetTallyLoading(false);
  };

  const handleFactoryReset = async () => {
    setFactoryResetLoading(true);
    try {
      const res = await api.admin.reset.post({ 
        saveHistory: true, 
        deleteVoters,
        deleteCandidates,
        $headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data?.success) {
        alert(`Archive & Reset Complete: ${res.data.message}`);
        onUpdate();
        setFactoryResetConfirm('');
      } else {
        throw new Error(res.error?.value?.message || 'Archive & Reset failed.');
      }
    } catch (e: unknown) {
      alert(`Error: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setFactoryResetLoading(false);
    }
  };

  const animRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (animRef.current) {
      animate(animRef.current, {
        y: { from: 20, to: 0 },
        opacity: { from: 0, to: 1 },
        duration: 600,
        ease: 'outQuad'
      });
    }
  }, []);

  return (
    <VStack ref={animRef} align="stretch" gap={8} opacity={0}>
      <Card.Root bg="gray.800" borderColor="gray.700">
        <Card.Body>
          <Heading size="md" mb={4} color="white">System Backup</Heading>
          <Text fontSize="sm" color="gray.300" mb={4}>
            Generate a full JSON backup of the entire database (voters, candidates, history, etc.). You can save it to your Cloudflare R2 storage bucket{isOwner ? ' or download it directly' : ''}.
          </Text>
          <HStack flexDir={{ base: 'column', sm: 'row' }} gap={4} w="full">
              {isOwner && (
                <Button colorPalette="blue" onClick={() => handleDownloadBackup(false)} loading={backupLoading} w={{ base: 'full', sm: 'auto' }}>
                    Download Backup File
                </Button>
              )}
              <Button colorPalette="blue" variant="outline" onClick={() => handleDownloadBackup(true)} loading={backupLoading} w={{ base: 'full', sm: 'auto' }}>
                  Save Backup to R2
              </Button>
          </HStack>
        </Card.Body>
      </Card.Root>

      <Card.Root bg="red.900" borderColor="red.700">
        <Card.Body>
          <Heading size="md" mb={4} color="white">Restore from JSON Backup</Heading>
          <Text fontSize="sm" color="gray.300" mb={4}>
            Upload a legacy JSON backup file to completely restore candidates, voters, and voting configuration. {(!isOwner) && "(Owners only)"}
          </Text>
          <Input 
            type="file" 
            accept=".json" 
            onChange={(e) => setJsonFile(e.target.files?.[0] || null)}
            mb={4}
            p={1}
            color="white"
            disabled={!isOwner}
          />
          <Button colorPalette="red" onClick={handleRestore} loading={restoreLoading} disabled={!jsonFile || !isOwner} w="full">
            Restore System
          </Button>
        </Card.Body>
      </Card.Root>

      <Card.Root bg="red.900" borderColor="red.700">
        <Card.Body>
          <Heading size="md" mb={4} color="white">System Reset Operations</Heading>
          <Text fontSize="sm" color="gray.300" mb={6}>
            Warning: These operations cannot be undone. Ensure you have backed up the system before proceeding.
          </Text>
          <VStack align="stretch" gap={4}>
            <Text fontSize="xs" color="gray.400" mb="-2">Keeps voters but clears their vote status and device history so they can vote again.</Text>
            <Button colorPalette="orange" onClick={handleResetVoters} loading={resetVotersLoading}>
              Reset All Voter Status
            </Button>
            
            <Text fontSize="xs" color="gray.400" mb="-2" mt="2">Keeps candidates but resets all their vote counts to zero.</Text>
            <Button colorPalette="orange" onClick={handleResetTally} loading={resetTallyLoading}>
              Reset Candidate Tally to Zero
            </Button>

            <VStack align="stretch" gap={2} p={4} bg="red.800" borderRadius="md" mt={4}>
              <Text color="white" fontWeight="bold">ARCHIVE & RESET: Archives the results to history, then performs the selected reset operations below.</Text>
              
              <Box display="flex" flexDir="column" gap={2} mb={2} p={3} bg="red.900" borderRadius="md">
                <label style={{ color: 'white', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={deleteVoters} onChange={(e) => setDeleteVoters(e.target.checked)} style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
                  Permanently delete all Voters (uncheck to simply reset their voting status)
                </label>
                <label style={{ color: 'white', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={deleteCandidates} onChange={(e) => setDeleteCandidates(e.target.checked)} style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
                  Permanently delete all Candidates (uncheck to simply reset their vote counts)
                </label>
              </Box>

            <Text color="white" fontWeight="bold" mt={2}>To confirm, type "archive and reset" below:</Text>
              <Input 
              placeholder="archive and reset"
                value={factoryResetConfirm}
                onChange={(e) => setFactoryResetConfirm(e.target.value)}
                bg="gray.900"
                color="white"
              />
              <Button 
                colorPalette="red" 
                variant="solid" 
                onClick={handleFactoryReset}
                loading={factoryResetLoading}
              disabled={factoryResetConfirm !== 'archive and reset'}
              >
              Archive & Reset System
              </Button>
            </VStack>
          </VStack>
        </Card.Body>
      </Card.Root>
    </VStack>
  );
}
