import { useEffect, useState, useRef, useReducer } from 'react';
import {
  Box, SimpleGrid, Heading, Text, VStack, Button, HStack, Card, Input, Textarea, Image
} from '@chakra-ui/react';
import { api, API_URL } from '../../api';

interface Candidate {
  id: number;
  name: string;
  nim: string;
  major: string;
  batch: number;
  vision: string;
  mission: string;
  photo: string | null;
  votes?: number;
}

type FormState = Omit<Candidate, 'id' | 'votes'>;

const initialFormState: FormState = {
  name: '',
  nim: '',
  major: '',
  batch: new Date().getFullYear(),
  vision: '',
  mission: '',
  photo: null,
};

function formReducer(state: FormState, action: { type: string; payload: any }): FormState {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.payload.field]: action.payload.value };
    case 'SET_FROM_CANDIDATE':
      return {
        name: action.payload.name || '',
        nim: action.payload.nim || '',
        major: action.payload.major || '',
        batch: action.payload.batch || new Date().getFullYear(),
        vision: action.payload.vision || '',
        mission: action.payload.mission || '',
        photo: action.payload.photo || null,
      };
    case 'RESET':
      return initialFormState;
    default:
      return state;
  }
}

export function CandidateManagementTab({ token }: { token: string | null }) {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState<Candidate | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const [formState, dispatch] = useReducer(formReducer, initialFormState);

  const fetchCandidates = async () => {
    const { data } = await api.candidates.admin.all.get({
      $headers: { Authorization: `Bearer ${token}` }
    });
    if (data?.success) setCandidates(data.data);
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  const animRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (candidates.length > 0 && animRef.current) {
      import('animejs').then((animeModule: any) => {
        if (!animRef.current) return;
        const { animate, stagger } = animeModule;
        if (typeof animate === 'function') {
          animate(Array.from(animRef.current.children), {
            y: [20, 0],
            opacity: [0, 1],
            duration: 500,
            delay: typeof stagger === 'function' ? stagger(100) : 0,
            ease: 'outExpo'
          });
        }
      }).catch(console.error);
    }
  }, [candidates]);

  const handleSave = async () => {
    if (!formState.name || !formState.nim) {
      alert("Validation Error: Name and NIM are required.");
      return;
    }

    if (isEditing) {
      const noChanges = 
        formState.name === (isEditing.name || '') &&
        formState.nim === (isEditing.nim || '') &&
        formState.major === (isEditing.major || '') &&
        formState.batch === isEditing.batch &&
        formState.vision === (isEditing.vision || '') &&
        formState.mission === (isEditing.mission || '') &&
        !photo;

      if (noChanges) {
        setIsCreating(false);
        setIsEditing(null);
        dispatch({ type: 'RESET', payload: null });
        return;
      }
    }

    setLoading(true);
    
    try {
      let uploadedPhotoName = isEditing?.photo || formState.photo;
      
      if (photo) {
        const formData = new FormData();
        formData.append('file', photo);
        formData.append('nim', formState.nim);

        const uploadRes = await fetch(`${API_URL}/upload/candidate-photo`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData
        }).then(r => r.json());
        
        if (uploadRes?.success) {
          uploadedPhotoName = uploadRes.data.filename;
        } else {
          alert("Photo upload failed: " + (uploadRes.error || "Could not upload photo. Proceeding without it."));
        }
      }

      const payload = {
        name: formState.name || '',
        nim: formState.nim || '',
        major: formState.major || '',
        batch: Number(formState.batch),
        vision: formState.vision || '',
        mission: formState.mission || '',
        ...(uploadedPhotoName ? { photo: uploadedPhotoName } : {})
      };

      if (isEditing) {
        const res = await api.candidates[isEditing.id].put({
          ...payload,
          $headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data?.success) {
          alert("Candidate Updated");
        } else {
          throw new Error(res.data?.error || 'Failed to update candidate');
        }
      } else {
        const res = await api.candidates.post({
          ...payload,
          $headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data?.success) {
          alert("Candidate Created");
        } else {
          throw new Error(res.data?.error || 'Failed to create candidate');
        }
      }
      
      setIsCreating(false);
      setIsEditing(null);
      dispatch({ type: 'RESET', payload: null });
      fetchCandidates();
    } catch (err) {
      alert("An error occurred: " + (err.message || "Please try again."));
    }
    setLoading(false);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this candidate? This cannot be undone.")) return;
    try {
      const res = await api.candidates[id].delete({
        $headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data?.success) {
        alert("Candidate Deleted");
        fetchCandidates();
      }
    } catch(err: any) {
      alert("Deletion failed: " + err.message);
    }
  };

  const openEdit = (c: Candidate) => {
    setIsEditing(c);
    setIsCreating(true);
    dispatch({ type: 'SET_FROM_CANDIDATE', payload: c });
    setPhoto(null);
  };

  return (
    <Box>
      <HStack justify="space-between" mb={6} flexDir={{ base: 'column', sm: 'row' }} align={{ base: 'start', sm: 'center' }} gap={4}>
        <Heading size="md" color="#39C5BB" style={{ textShadow: '0 0 10px rgba(57, 197, 187, 0.4)' }}>Candidates</Heading>
        <Button bg="#39C5BB" color="gray.900" _hover={{ bg: "#2ea39a", transform: "scale(1.05)" }} transition="all 0.2s" onClick={() => { dispatch({ type: 'RESET', payload: null }); setIsEditing(null); setIsCreating(true); }} w={{ base: 'full', sm: 'auto' }}>
          + Add Candidate
        </Button>
      </HStack>

      {isCreating ? (
        <Card.Root bg="rgba(18, 25, 33, 0.7)" backdropFilter="blur(10px)" borderColor="#39C5BB" borderWidth="1px" mb={8} boxShadow="0 0 15px rgba(57, 197, 187, 0.15)">
          <Card.Body>
            <Heading size="sm" mb={4} color="white">{isEditing ? 'Edit Candidate' : 'New Candidate'}</Heading>
            <VStack align="stretch" gap={4}>
              <HStack flexDir={{ base: 'column', sm: 'row' }} gap={4}>
                <Box flex={1} w="full">
                  <Text fontSize="sm" color="gray.400" mb={1}>Name</Text>
                  <Input value={formState.name} onChange={e => dispatch({ type: 'SET_FIELD', payload: { field: 'name', value: e.target.value } })} bg="gray.900" color="white" borderColor="gray.600" />
                </Box>
                <Box flex={1} w="full">
                  <Text fontSize="sm" color="gray.400" mb={1}>NIM</Text>
                  <Input value={formState.nim} onChange={e => dispatch({ type: 'SET_FIELD', payload: { field: 'nim', value: e.target.value } })} bg="gray.900" color="white" borderColor="gray.600" />
                </Box>
              </HStack>
              <HStack flexDir={{ base: 'column', sm: 'row' }} gap={4}>
                <Box flex={1} w="full">
                  <Text fontSize="sm" color="gray.400" mb={1}>Major</Text>
                  <Input value={formState.major} onChange={e => dispatch({ type: 'SET_FIELD', payload: { field: 'major', value: e.target.value } })} bg="gray.900" color="white" borderColor="gray.600" />
                </Box>
                <Box flex={1} w="full">
                  <Text fontSize="sm" color="gray.400" mb={1}>Batch (Year)</Text>
                  <Input type="number" value={formState.batch} onChange={e => dispatch({ type: 'SET_FIELD', payload: { field: 'batch', value: Number(e.target.value) } })} bg="gray.900" color="white" borderColor="gray.600" />
                </Box>
              </HStack>
              <Box>
                <Text fontSize="sm" color="gray.400" mb={1}>Vision</Text>
                <Textarea value={formState.vision} onChange={e => dispatch({ type: 'SET_FIELD', payload: { field: 'vision', value: e.target.value } })} bg="gray.900" color="white" borderColor="gray.600" rows={3} />
              </Box>
              <Box>
                <Text fontSize="sm" color="gray.400" mb={1}>Mission</Text>
                <Textarea value={formState.mission} onChange={e => dispatch({ type: 'SET_FIELD', payload: { field: 'mission', value: e.target.value } })} bg="gray.900" color="white" borderColor="gray.600" rows={5} />
              </Box>
              <Box>
                <Text fontSize="sm" color="gray.400" mb={1}>Photo</Text>
                <Input type="file" accept="image/*" onChange={e => setPhoto(e.target.files?.[0] || null)} color="white" p={1} />
              </Box>
              <HStack mt={4} flexDir={{ base: 'column', sm: 'row' }} gap={3}>
                <Button bg="#39C5BB" color="gray.900" _hover={{ bg: "#2ea39a" }} onClick={handleSave} loading={loading} w={{ base: 'full', sm: 'auto' }}>Save</Button>
                <Button variant="ghost" onClick={() => { setIsCreating(false); setIsEditing(null); dispatch({ type: 'RESET', payload: null }); }} color="gray.400" _hover={{ color: "#F32C9E" }} w={{ base: 'full', sm: 'auto' }}>Cancel</Button>
              </HStack>
            </VStack>
          </Card.Body>
        </Card.Root>
      ) : null}

      <SimpleGrid ref={animRef} columns={{ base: 1, md: 2, lg: 3 }} gap={6} style={{ willChange: 'transform, opacity' }}>
        {candidates.map(c => (
          <Card.Root key={c.id} bg="rgba(18, 25, 33, 0.7)" backdropFilter="blur(8px)" borderColor="rgba(57, 197, 187, 0.3)" borderWidth="1px" opacity={0} transition="border-color 0.3s ease" _hover={{ borderColor: "#39C5BB", boxShadow: "0 4px 20px rgba(57, 197, 187, 0.2)" }}>
            <Card.Body>
              <HStack gap={4} align="start" mb={4}>
                <Image 
                  src={c.photo ? `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/static/${c.photo}` : `/default-avatar.svg`} 
                  onError={(e) => {
                    e.currentTarget.src = `/default-avatar.svg`;
                  }}
                  loading="lazy"
                  decoding="async"
                  w="80px" h="80px" objectFit="cover" borderRadius="md" 
                  boxShadow="0 0 10px rgba(57, 197, 187, 0.3)"
                />
                <Box>
                  <Heading size="md" color="white" mb={1}>{c.name}</Heading>
                  <Text fontSize="xs" color="gray.400">Votes: {c.votes || 0}</Text>
                </Box>
              </HStack>
              <Text fontSize="sm" color="gray.300" noOfLines={2} mb={2}><b>Vision:</b> {c.vision}</Text>
              
              <HStack mt={4} justify={{ base: "space-between", sm: "flex-end" }} flexWrap="wrap">
                <Button size="sm" color="#39C5BB" borderColor="#39C5BB" variant="outline" _hover={{ bg: "rgba(57, 197, 187, 0.1)" }} onClick={() => openEdit(c)}>Edit</Button>
                <Button size="sm" color="#F32C9E" borderColor="#F32C9E" variant="outline" _hover={{ bg: "rgba(243, 44, 158, 0.1)" }} onClick={() => handleDelete(c.id)}>Delete</Button>
              </HStack>
            </Card.Body>
          </Card.Root>
        ))}
      </SimpleGrid>

    </Box>
  );
}
