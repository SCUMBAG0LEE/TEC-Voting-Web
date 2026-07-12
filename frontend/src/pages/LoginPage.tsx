import { useState, useEffect, useRef, useCallback, type FormEvent } from 'react';
import { Box, Flex, Heading, Text, Input, Button } from '@chakra-ui/react';
import { useSetAtom } from 'jotai';
import { useNavigate } from '@tanstack/react-router';
import { setTokenAtom, userAtom, setAdminTokenAtom, adminUserAtom } from '../store';
import { api } from '../api';
import Footer from '../components/Footer';

type CaptchaProvider = 'recaptcha' | 'hcaptcha' | 'turnstile';

export default function LoginPage() {
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [desktopTransition, setDesktopTransition] = useState(false);
  const transitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toggleMode = useCallback(() => {
    setDesktopTransition(true);
    setIsAdminMode(prev => !prev);
    
    if (transitionTimerRef.current) {
      clearTimeout(transitionTimerRef.current);
    }
    // Disable transition after animation completes so resizing won't trigger it
    transitionTimerRef.current = setTimeout(() => {
      setDesktopTransition(false);
    }, 1300);
  }, []);

  useEffect(() => {
    return () => {
      if (transitionTimerRef.current) {
        clearTimeout(transitionTimerRef.current);
      }
    };
  }, []);
  
  // Captcha Fallback State
  const [captchaProvider, setCaptchaProvider] = useState<CaptchaProvider>('recaptcha');
  const [showVoterCaptcha, setShowVoterCaptcha] = useState(false);
  const [showAdminCaptcha, setShowAdminCaptcha] = useState(false);

  // Voter State
  const [nim, setNim] = useState('');
  const [loadingVoter, setLoadingVoter] = useState(false);
  const [voterError, setVoterError] = useState('');
  const setVoterToken = useSetAtom(setTokenAtom);
  const setVoterUser = useSetAtom(userAtom);

  // Admin State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loadingAdmin, setLoadingAdmin] = useState(false);
  const [adminError, setAdminError] = useState('');
  const setAdminToken = useSetAtom(setAdminTokenAtom);
  const setAdminUser = useSetAtom(adminUserAtom);

  const navigate = useNavigate();

  // Load Captcha Scripts with Fallback Chain
  useEffect(() => {
    if (!showVoterCaptcha && !showAdminCaptcha) return;

    const loadCaptchaScript = (provider: CaptchaProvider) => {
      if (document.getElementById(`${provider}-script`)) return;

      const script = document.createElement('script');
      script.id = `${provider}-script`;
      script.async = true;
      script.defer = true;

      if (provider === 'recaptcha') {
        script.src = 'https://www.google.com/recaptcha/api.js';
        script.onerror = () => {
          console.warn('Google reCAPTCHA failed to load (e.g. adblocker). Falling back to hCaptcha.');
          setCaptchaProvider('hcaptcha');
          loadCaptchaScript('hcaptcha');
        };
      } else if (provider === 'hcaptcha') {
        script.src = 'https://js.hcaptcha.com/1/api.js';
        script.onerror = () => {
          console.warn('hCaptcha failed to load. Falling back to Cloudflare Turnstile.');
          setCaptchaProvider('turnstile');
          loadCaptchaScript('turnstile');
        };
      } else if (provider === 'turnstile') {
        script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
        script.onerror = () => {
          console.error('All captcha providers failed to load. Please disable your adblocker.');
        };
      }

      document.head.appendChild(script);
    };

    loadCaptchaScript(captchaProvider);
  }, [captchaProvider, showVoterCaptcha, showAdminCaptcha]);

  const getCaptchaToken = (provider: CaptchaProvider) => {
    try {
      const win = window as Window & {
        grecaptcha?: { getResponse: () => string };
        hcaptcha?: { getResponse: () => string };
        turnstile?: { getResponse: () => string };
      };
      if (provider === 'recaptcha' && win.grecaptcha) return win.grecaptcha.getResponse();
      if (provider === 'hcaptcha' && win.hcaptcha) return win.hcaptcha.getResponse();
      if (provider === 'turnstile' && win.turnstile) return win.turnstile.getResponse();
    } catch (e) {
      console.error('Failed to get captcha token', e);
    }
    return '';
  };

  useEffect(() => {
    if (voterError) {
      const timer = setTimeout(() => setVoterError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [voterError]);

  useEffect(() => {
    if (adminError) {
      const timer = setTimeout(() => setAdminError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [adminError]);

  const handleVoterLogin = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (loadingVoter) return;
    setLoadingVoter(true);
    setVoterError('');

    if (!/^\d{9}$/.test(nim)) {
      setVoterError('NIM must be exactly 9 digits.');
      setLoadingVoter(false);
      return;
    }

    let captchaToken = undefined;
    if (showVoterCaptcha) {
      captchaToken = getCaptchaToken(captchaProvider);
      if (!captchaToken) {
        setVoterError('Please complete the Captcha');
        setLoadingVoter(false);
        return;
      }
    }

    const { data, error } = await api.voter.login.post({ 
      nim,
      ...(captchaToken ? { captchaToken, captchaProvider } : {})
    });

    const errObj = (error?.value || data) as Record<string, string> | undefined;

    if (errObj?.error === 'REQUIRE_CAPTCHA') {
      setShowVoterCaptcha(true);
      setVoterError(errObj.message || 'Too many failed attempts. Please complete the captcha.');
      setLoadingVoter(false);
      return;
    }

    if (error || !data?.success) {
      setVoterError(errObj?.error || errObj?.message || 'NIM not registered');
      setLoadingVoter(false);
      return;
    }

    if (data?.success && data?.data) {
      setVoterToken(data.data.token);
      setVoterUser({ nim, type: 'voter' });
      navigate({ to: '/dashboard' });
    }
  };

  const handleAdminLogin = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (loadingAdmin) return;
    setLoadingAdmin(true);
    setAdminError('');

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setAdminError('Please enter a valid email address.');
      setLoadingAdmin(false);
      return;
    }
    
    if (password.trim() === '') {
      setAdminError('Password cannot be empty.');
      setLoadingAdmin(false);
      return;
    }

    let captchaToken = undefined;
    if (showAdminCaptcha) {
      captchaToken = getCaptchaToken(captchaProvider);
      if (!captchaToken) {
        setAdminError('Please complete the Captcha');
        setLoadingAdmin(false);
        return;
      }
    }

    const { data, error } = await api.admin.login.post({ 
      email, 
      password,
      ...(captchaToken ? { captchaToken, captchaProvider } : {})
    });

    const errObj = (error?.value || data) as Record<string, string> | undefined;

    if (errObj?.error === 'REQUIRE_CAPTCHA') {
      setShowAdminCaptcha(true);
      setAdminError(errObj.message || 'Too many failed attempts. Please complete the captcha.');
      setLoadingAdmin(false);
      return;
    }

    if (error || !data?.success) {
      setAdminError(errObj?.error || errObj?.message || 'Invalid email or password');
      setLoadingAdmin(false);
      return;
    }

    if (data?.success && data?.data) {
      setAdminToken(data.data.token);
      setAdminUser(data.data.admin);
      navigate({ to: '/admin/dashboard' });
    }
  };

  const renderCaptchaWidget = (isVisible: boolean) => {
    const recaptchaKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY || '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI';
    const hcaptchaKey = import.meta.env.VITE_HCAPTCHA_SITE_KEY || '10000000-ffff-ffff-ffff-000000000001';
    const turnstileKey = import.meta.env.VITE_TURNSTILE_SITE_KEY || '1x00000000000000000000AA';

    return (
      <Flex mx="auto" justify="center" minH="78px" align="center" style={{ visibility: isVisible ? 'visible' : 'hidden' }}>
        {isVisible && captchaProvider === 'recaptcha' && (
          <div className="g-recaptcha" data-sitekey={recaptchaKey} data-theme="dark"></div>
        )}
        {isVisible && captchaProvider === 'hcaptcha' && (
          <div className="h-captcha" data-sitekey={hcaptchaKey} data-theme="dark"></div>
        )}
        {isVisible && captchaProvider === 'turnstile' && (
          <div className="cf-turnstile" data-sitekey={turnstileKey} data-theme="dark"></div>
        )}
      </Flex>
    );
  };

  return (
    <Box minH="100vh" w="full" position="relative" display="flex" flexDir="column" overflowX="hidden" overflowY="auto" fontFamily="'Open Sans', Helvetica, Arial, sans-serif">
      {/* Background Handled Globally by .miku-aura-bg */}

      {/* Fake Toasts at top right */}
      <Box position="fixed" top={4} right={4} zIndex={9999} display="flex" flexDir="column" gap={3}>
        {voterError && (
          <Flex bg="#f56565" color="white" p={4} borderRadius="md" shadow="lg" align="center" gap={3} w="300px">
             <Text fontWeight="bold" fontSize="lg">✕</Text>
             <Text fontWeight="medium">{voterError}</Text>
          </Flex>
        )}
        {adminError && (
          <Flex bg="#f56565" color="white" p={4} borderRadius="md" shadow="lg" align="center" gap={3} w="300px">
             <Text fontWeight="bold" fontSize="lg">✕</Text>
             <Text fontWeight="medium">{adminError}</Text>
          </Flex>
        )}
      </Box>

      <Flex flex={1} align="center" justify="center" zIndex={5} position="relative" p={{ base: 4, md: 0 }}>
          {/* Main .cont Container */}
        <Box 
          w={{ base: "100%", md: "900px" }} 
          maxW={{ base: "400px", md: "100%" }} 
          minH={{ base: "480px", md: "550px" }} 
          bg={{ base: "rgba(10, 10, 10, 0.6)", md: "rgba(18, 18, 18, 0.55)" }} 
          backdropFilter={{ base: "blur(20px)", md: "blur(25px)" }}
          border="1px solid rgba(255,255,255,0.05)"
          borderRadius={{ base: "16px", md: "24px" }} 
          overflow="hidden"
          boxShadow={{ base: "0 20px 40px rgba(0, 0, 0, 0.7)", md: "0 30px 60px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255,255,255,0.1)" }} 
          position="relative"
          display="flex"
          flexDir="column"
        >
          {/* Mobile Background */}
          <Box position="absolute" inset={0} zIndex={-1} borderRadius="24px" overflow="hidden" display={{ base: "block", md: "none" }}>
             <Box position="absolute" inset={0} bg={!isAdminMode ? "rgba(243, 44, 158, 0.15)" : "rgba(57, 197, 187, 0.15)"} transition="all 0.5s ease" />
          </Box> 

          {/* Mobile Tabs */}
          <Flex 
            display={{ base: "flex", md: "none" }} 
            position="absolute" top="20px" left="50%" transform="translateX(-50%)" 
            bg="rgba(0,0,0,0.6)" p="4px" borderRadius="12px" zIndex={30} w="90%" maxW="320px" h="48px"
            border="1px solid rgba(255,255,255,0.08)"
            cursor="pointer" onClick={toggleMode}
            align="center"
            style={{ pointerEvents: 'auto' }}
          >
            <Box 
              position="absolute" top="4px" left="4px" w="calc(50% - 4px)" h="calc(100% - 8px)" 
              bg="rgba(255,255,255,0.12)" borderRadius="8px" zIndex={1}
              transform={isAdminMode ? 'translateX(100%)' : 'translateX(0)'}
              style={{ 
                transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                pointerEvents: 'none'
              }}
            />
            <Box 
              flex={1} zIndex={2} display="flex" alignItems="center" justifyContent="center" height="100%"
              color={!isAdminMode ? '#F32C9E' : 'gray.400'} fontWeight="bold" fontSize="15px"
              style={{ pointerEvents: 'none', userSelect: 'none' }}
            >
              Voter
            </Box>
            <Box 
              flex={1} zIndex={2} display="flex" alignItems="center" justifyContent="center" height="100%"
              color={isAdminMode ? '#39C5BB' : 'gray.400'} fontWeight="bold" fontSize="15px"
              style={{ pointerEvents: 'none', userSelect: 'none' }}
            >
              Admin
            </Box>
          </Flex>

          {/* Desktop & Mobile Forms */}
            {/* Voter Form */}
            <Box 
              as="form" onSubmit={handleVoterLogin}
              position="absolute" left={0} top={0} 
              w={{ base: "100%", md: "640px" }} 
              h="100%" zIndex={10}
              px={{ base: "20px", md: "30px" }} 
              pt={{ base: "100px", md: "50px" }}
              pb={{ base: "80px", md: "40px" }}
              display="flex" flexDir="column" justifyContent="space-between" alignItems="center"
              transform={{ base: 'none', md: isAdminMode ? 'translate3d(640px, 0, 0)' : 'translate3d(0, 0, 0)' }}
              opacity={isAdminMode ? 0 : 1}
              pointerEvents={isAdminMode ? 'none' : 'auto'}
              style={{
                transition: desktopTransition ? 'transform 1.2s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.35s ease-in-out' : 'opacity 0.35s ease-in-out, transform 0s'
              }}
            >
              <Heading w="100%" fontSize={{ base: "22px", md: "26px" }} textAlign="center" fontWeight="bold" color="white">Voter Login</Heading>
              
              <Box as="label" display="block" w="260px" mx="auto" textAlign="center">
                <Text as="span" fontSize="12px" color="gray.400" textTransform="uppercase" fontWeight="bold">NIM (STUDENT ID)</Text>
                <Input 
                  display="block" w="100%" mt="10px" p="12px 15px" fontSize="15px"
                  border="2px solid rgba(255,255,255,0.1)" borderRadius="12px" textAlign="center" bg="rgba(0,0,0,0.3)" color="white"
                  transition="all 0.3s ease" _focus={{ borderColor: '#39C5BB', boxShadow: '0 0 0 3px rgba(57, 197, 187, 0.25)', bg: 'rgba(0,0,0,0.5)', outline: 'none' }}
                  value={nim}
                  onChange={(e) => setNim(e.target.value)}
                  inputMode="numeric"
                  maxLength={9}
                  autoComplete="username"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleVoterLogin();
                  }}
                  disabled={loadingVoter}
                  h="auto"
                />
              </Box>
              {renderCaptchaWidget(showVoterCaptcha)}

              <Button 
                type="submit" disabled={loadingVoter}
                display={{ base: "none", md: "block" }} mx="auto" w="260px" h="36px" borderRadius="30px" color="#fff" fontSize="15px" cursor="pointer"
                m="0" bg="linear-gradient(135deg, #F32C9E 0%, #7B1FA2 100%)" textTransform="uppercase" fontWeight="bold"
                transition="transform 0.2s, box-shadow 0.2s"
                _hover={{ transform: 'translateY(-2px)', boxShadow: '0 10px 25px rgba(243, 44, 158, 0.4)' }}
                _disabled={{ opacity: 0.7, cursor: 'not-allowed', transform: 'none', boxShadow: 'none' }}
              >
                {loadingVoter ? 'LOGGING IN...' : 'LOG IN'}
              </Button>
            </Box>

            {/* Admin Form */}
            <Box 
              as="form" onSubmit={handleAdminLogin}
              position="absolute" left={0} top={0} 
              w={{ base: "100%", md: "640px" }} 
              h="100%" zIndex={10}
              px={{ base: "20px", md: "30px" }} 
              pt={{ base: "100px", md: "50px" }}
              pb={{ base: "80px", md: "40px" }}
              display="flex" flexDir="column" justifyContent="space-between" alignItems="center"
              transform={{ base: 'none', md: isAdminMode ? 'translate3d(260px, 0, 0)' : 'translate3d(-640px, 0, 0)' }}
              opacity={isAdminMode ? 1 : 0}
              pointerEvents={isAdminMode ? 'auto' : 'none'}
              style={{
                transition: desktopTransition ? 'transform 1.2s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.35s ease-in-out' : 'opacity 0.35s ease-in-out, transform 0s'
              }}
            >
              <Heading w="100%" fontSize={{ base: "22px", md: "26px" }} textAlign="center" fontWeight="bold" color="white">Admin Login</Heading>
              
              <Box as="label" display="block" w="260px" mx="auto" textAlign="center">
                <Text as="span" fontSize="12px" color="gray.400" textTransform="uppercase" fontWeight="bold">EMAIL</Text>
                <Input 
                  type="email" display="block" w="100%" mt="10px" p="12px 15px" fontSize="15px" h="auto"
                  border="1px solid rgba(255,255,255,0.2)" borderRadius="12px" textAlign="center" bg="rgba(0,0,0,0.6)" color="white"
                  transition="all 0.3s ease" _focus={{ borderColor: '#F32C9E', boxShadow: '0 0 0 3px rgba(243, 44, 158, 0.25)', bg: 'rgba(0,0,0,0.8)', outline: 'none' }}
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  disabled={loadingAdmin}
                />
              </Box>

              <Box as="label" display="block" w="260px" mx="auto" textAlign="center">
                <Text as="span" fontSize="12px" color="gray.400" textTransform="uppercase" fontWeight="bold">PASSWORD</Text>
                <Input 
                  type="password" display="block" w="100%" mt="10px" p="12px 15px" fontSize="15px" h="auto"
                  border="1px solid rgba(255,255,255,0.2)" borderRadius="12px" textAlign="center" bg="rgba(0,0,0,0.6)" color="white"
                  transition="all 0.3s ease" _focus={{ borderColor: '#F32C9E', boxShadow: '0 0 0 3px rgba(243, 44, 158, 0.25)', bg: 'rgba(0,0,0,0.8)', outline: 'none' }}
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  disabled={loadingAdmin}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAdminLogin();
                  }}
                />
              </Box>
              {renderCaptchaWidget(showAdminCaptcha)}

              <Button 
                type="submit" disabled={loadingAdmin}
                display={{ base: "none", md: "block" }} mx="auto" w="260px" h="36px" borderRadius="30px" color="#fff" fontSize="15px" cursor="pointer"
                m="0" bg="linear-gradient(135deg, #39C5BB 0%, #0d9488 100%)" textTransform="uppercase" fontWeight="bold"
                transition="transform 0.2s, box-shadow 0.2s"
                _hover={{ transform: 'translateY(-2px)', boxShadow: '0 10px 25px rgba(57, 197, 187, 0.4)' }}
                _disabled={{ opacity: 0.7, cursor: 'not-allowed', transform: 'none', boxShadow: 'none' }}
              >
                {loadingAdmin ? 'LOGGING IN...' : 'LOG IN'}
              </Button>
            </Box>

          {/* Sliding Panel Overlay (.sub-cont) */}
          <Box 
            position="absolute" 
            top={{ base: "60px", md: 0 }} 
            left={{ base: 0, md: "640px" }} 
            w={{ base: "100%", md: "260px" }} 
            h={{ base: "calc(100% - 60px)", md: "100%" }} 
            bg={{ base: "transparent", md: "transparent" }} 
            pl={{ base: 0, md: 0 }} 
            overflow={{ base: "visible", md: "visible" }}
            transform={{ base: 'none', md: isAdminMode ? 'translate3d(-640px, 0, 0)' : 'translate3d(0, 0, 0)' }}
            pointerEvents={{ base: 'none', md: 'auto' }}
            zIndex={{ base: 15, md: 10 }}
            style={{
              transition: desktopTransition ? 'transform 1.2s cubic-bezier(0.4, 0, 0.2, 1)' : 'transform 0s'
            }}
          >
            {/* The Image Overlay Mask (.img) - Desktop Only */}
            <Box display={{ base: "none", md: "block" }} position="absolute" top={0} left={0} w="260px" h="100%" pt="360px" zIndex={2} overflow="hidden">
              <Box 
                position="absolute" top={0} right={0} w="900px" h="100%" m="auto"
                bg={`linear-gradient(135deg, rgba(57, 197, 187, 0.15) 0%, rgba(0, 128, 128, 0.15) 100%)`}
                backdropFilter="blur(10px)"
                transform={isAdminMode ? 'translate3d(640px, 0, 0)' : 'translate3d(0, 0, 0)'}
                style={{
                  transition: desktopTransition ? 'transform 1.2s cubic-bezier(0.4, 0, 0.2, 1)' : 'transform 0s'
                }}
                _after={{ content: '""', position: 'absolute', left: 0, top: 0, w: '100%', h: '100%', bg: 'rgba(10, 10, 10, 0.6)' }}
              />
              <Box 
                position="absolute" top={0} right={0} w="900px" h="100%" m="auto"
                bg={`linear-gradient(135deg, rgba(243, 44, 158, 0.15) 0%, rgba(123, 31, 162, 0.15) 100%)`}
                backdropFilter="blur(10px)"
                opacity={isAdminMode ? 1 : 0}
                transform={isAdminMode ? 'translate3d(640px, 0, 0)' : 'translate3d(0, 0, 0)'}
                style={{
                  transition: desktopTransition ? 'transform 1.2s cubic-bezier(0.4, 0, 0.2, 1), opacity 1.2s ease-in-out' : 'opacity 1.2s ease-in-out, transform 0s'
                }}
              />

              <Box position="absolute" left={0} top="50px" w="100%" px="20px" textAlign="center" color="#fff" zIndex={2}
                   transform={isAdminMode ? 'translateX(520px)' : 'translateX(0)'}
                   style={{
                     transition: desktopTransition ? 'transform 1.2s cubic-bezier(0.4, 0, 0.2, 1)' : 'transform 0s'
                   }}
              >
                <Heading fontSize="26px" fontWeight="normal" mb="10px" style={{ textShadow: '0 2px 12px rgba(0,0,0,0.95), 0 0 30px rgba(0,0,0,0.85), 1px 1px 0 rgba(0,0,0,0.9)' }}>Admin Area</Heading>
                <Text fontSize="14px" lineHeight="1.5" color="#e2e8f0" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.95), 0 0 20px rgba(0,0,0,0.9)' }}>Switch to administrator login</Text>
              </Box>
              <Box position="absolute" left={0} top="50px" w="100%" px="20px" textAlign="center" color="#fff" zIndex={2}
                   transform={isAdminMode ? 'translateX(0)' : 'translateX(-520px)'}
                   style={{
                     transition: desktopTransition ? 'transform 1.2s cubic-bezier(0.4, 0, 0.2, 1)' : 'transform 0s'
                   }}
              >
                <Heading fontSize="26px" fontWeight="normal" mb="10px" style={{ textShadow: '0 2px 12px rgba(0,0,0,0.95), 0 0 30px rgba(0,0,0,0.85), 1px 1px 0 rgba(0,0,0,0.9)' }}>Voter Area</Heading>
                <Text fontSize="14px" lineHeight="1.5" color="#e2e8f0" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.95), 0 0 20px rgba(0,0,0,0.9)' }}>Switch to voter login</Text>
              </Box>

              <Box position="relative" w="100px" h="36px" mx="auto" bg="rgba(0,0,0,0.4)" textTransform="uppercase" fontSize="15px" cursor="pointer" zIndex={2} overflow="hidden" onClick={toggleMode}
                   borderRadius="30px"
                   boxShadow="0 4px 15px rgba(0,0,0,0.8), inset 0 2px 4px rgba(255,255,255,0.05)"
                   _after={{ 
                     content: '""', 
                     zIndex: 2, 
                     position: 'absolute', 
                     left: 0, 
                     top: 0, 
                     w: '100%', 
                     h: '100%', 
                     border: '2px solid', 
                     borderColor: isAdminMode ? '#F32C9E' : '#39C5BB', 
                     borderRadius: '30px', 
                     transition: desktopTransition ? 'border-color 1.2s ease-in-out' : 'none', 
                     boxShadow: isAdminMode ? '0 0 10px rgba(243,44,158,0.5)' : '0 0 10px rgba(57,197,187,0.5)' 
                   }}
              >
                <Box position="absolute" left={0} top={0} w="100%" h="100%" display="flex" justifyContent="center" alignItems="center"
                     color="#39C5BB" style={{ textShadow: '0 2px 12px rgba(0,0,0,0.95), 0 0 30px rgba(0,0,0,0.85), 1px 1px 0 rgba(0,0,0,0.9)', transition: desktopTransition ? 'transform 1.2s cubic-bezier(0.4, 0, 0.2, 1)' : 'transform 0s' }}
                     transform={isAdminMode ? 'translateY(72px)' : 'translateY(0)'}>
                  Admin
                </Box>
                <Box position="absolute" left={0} top={0} w="100%" h="100%" display="flex" justifyContent="center" alignItems="center"
                     color="#F32C9E" style={{ textShadow: '0 2px 12px rgba(0,0,0,0.95), 0 0 30px rgba(0,0,0,0.85), 1px 1px 0 rgba(0,0,0,0.9)', transition: desktopTransition ? 'transform 1.2s cubic-bezier(0.4, 0, 0.2, 1)' : 'transform 0s' }}
                     transform={isAdminMode ? 'translateY(0)' : 'translateY(-72px)'}>
                  Voter
                </Box>
              </Box>
            </Box>
          </Box>

          {/* Shared Mobile Login Button (.mobile-login-footer) */}
          <Flex 
            display={{ base: "flex", md: "none" }} 
            position="absolute" bottom="20px" left={0} right={0} 
            px="20px" zIndex={20} justify="center"
          >
            <Button 
              type="button" 
              onClick={() => isAdminMode ? handleAdminLogin() : handleVoterLogin()}
              disabled={isAdminMode ? loadingAdmin : loadingVoter}
              w="260px" h="44px" borderRadius="30px" cursor="pointer"
              position="relative" overflow="hidden"
              p={0} border="none"
              transition="all 0.3s ease"
              _active={{ transform: 'scale(0.98)' }}
              _hover={{ shadow: 'xl' }}
            >
              <Box position="absolute" inset={0} bg="linear-gradient(135deg, #F32C9E 0%, #7B1FA2 100%)" zIndex={0} />
              <Box position="absolute" inset={0} bg="linear-gradient(135deg, #39C5BB 0%, #0d9488 100%)" zIndex={1} opacity={isAdminMode ? 1 : 0} transition="opacity 0.5s ease-in-out" />
              <Flex position="relative" zIndex={2} w="100%" h="100%" align="center" justify="center" color="#fff" fontSize="15px" textTransform="uppercase" fontWeight="bold">
                <Box position="absolute" opacity={isAdminMode ? 0 : 1} transition="opacity 0.3s ease-in-out">
                  {loadingVoter ? 'LOGGING IN...' : 'LOG IN'}
                </Box>
                <Box position="absolute" opacity={isAdminMode ? 1 : 0} transition="opacity 0.3s ease-in-out">
                  {loadingAdmin ? 'LOGGING IN...' : 'LOG IN'}
                </Box>
              </Flex>
            </Button>
          </Flex>

        </Box>
      </Flex>

      {/* Shared Footer */}
      <Box zIndex={10} position="relative">
        <Footer />
      </Box>
    </Box>
  );
}
