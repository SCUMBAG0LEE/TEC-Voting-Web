import { useState, FormEvent, useEffect } from 'react';
import { Box, Flex, Heading, Text, Input, Button } from '@chakra-ui/react';
import { useSetAtom } from 'jotai';
import { useNavigate } from '@tanstack/react-router';
import { setTokenAtom, userAtom, setAdminTokenAtom, adminUserAtom } from '../store';
import { api } from '../api';
import Footer from '../components/Footer';

type CaptchaProvider = 'recaptcha' | 'hcaptcha' | 'turnstile';

export default function LoginPage() {
  const [isAdminMode, setIsAdminMode] = useState(false);
  
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
      const timer = setTimeout(() => setVoterError(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [voterError]);

  useEffect(() => {
    if (adminError) {
      const timer = setTimeout(() => setAdminError(''), 3000);
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

    const errObj = error?.value || data;

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

    const errObj = error?.value || data;

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
      {/* Background Wrapper */}
      <Box 
        position="absolute" inset={0} zIndex={1}
        bg={`url('/assets/login_bg.jpg') center/cover no-repeat, linear-gradient(135deg, #0f172a 0%, #020617 100%)`}
        _after={{
          content: '""', position: 'absolute', top: 0, left: 0, w: '100%', h: '100%',
          bg: `url('/assets/login_bg.jpg') center/cover no-repeat, linear-gradient(135deg, #4c0519 0%, #2e020f 100%)`,
          opacity: isAdminMode ? 1 : 0,
          transition: 'opacity 1.2s ease-in-out'
        }}
      />

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
          h={{ base: "480px", md: "550px" }} 
          mt="-5vh"
          bg={{ base: "transparent", md: "rgba(26, 32, 44, 0.85)" }} 
          backdropFilter={{ base: "none", md: "blur(10px)" }}
          borderRadius="24px" 
          overflow={{ base: "visible", md: "hidden" }}
          boxShadow={{ base: "none", md: "0 20px 40px rgba(0, 0, 0, 0.5)" }} 
          position="relative"
          display="flex"
          flexDir="column"
        >
          {/* Mobile Background Panel */}
          <Box display={{ base: "block", md: "none" }} position="absolute" inset={0} bg="#1a202c" borderRadius="24px" boxShadow="0 20px 40px rgba(0, 0, 0, 0.5)" zIndex={0} />

          {/* Mobile Tabs */}
          <Flex 
            display={{ base: "flex", md: "none" }} 
            position="absolute" top="20px" left="50%" transform="translateX(-50%)" 
            bg="#2d3748" p="4px" borderRadius="12px" zIndex={30} w="90%" maxW="320px"
          >
            <Box 
              position="absolute" top="4px" left="4px" w="calc(50% - 4px)" h="calc(100% - 8px)" 
              bg="#4a5568" borderRadius="8px" zIndex={1}
              transform={isAdminMode ? 'translateX(100%)' : 'translateX(0)'}
              style={{ transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}
            />
            <Button flex={1} variant="ghost" zIndex={2} color={!isAdminMode ? '#39C5BB' : 'gray.400'} onClick={() => setIsAdminMode(false)} _hover={{ bg: 'transparent' }} _active={{ bg: 'transparent' }}>Voter</Button>
            <Button flex={1} variant="ghost" zIndex={2} color={isAdminMode ? '#F32C9E' : 'gray.400'} onClick={() => setIsAdminMode(true)} _hover={{ bg: 'transparent' }} _active={{ bg: 'transparent' }}>Admin</Button>
          </Flex>

          {/* Mobile Title (Crossfading) */}
          <Box position="absolute" top="75px" left={0} right={0} zIndex={20} display={{ base: "block", md: "none" }} h="30px">
            <Heading position="absolute" w="full" textAlign="center" fontSize="24px" color="white" fontWeight="bold" opacity={isAdminMode ? 0 : 1} transition="opacity 0.3s ease-in-out">
              Voter Login
            </Heading>
            <Heading position="absolute" w="full" textAlign="center" fontSize="24px" color="white" fontWeight="bold" opacity={isAdminMode ? 1 : 0} transition="opacity 0.3s ease-in-out">
              Admin Login
            </Heading>
          </Box>

          {/* Voter Form (.form.sign-in) */}
          <Box 
            as="form" onSubmit={handleVoterLogin}
            position="absolute" left={0} top={0} 
            w={{ base: "100%", md: "640px" }} 
            h="100%" zIndex={10}
            px={{ base: "20px", md: "30px" }} 
            pt={{ base: "120px", md: "50px" }}
            pb={{ base: "80px", md: "40px" }}
            display="flex" flexDir="column" justifyContent={{ base: "space-evenly", md: "space-between" }} alignItems="center"
            transform={{ base: 'none', md: isAdminMode ? 'translate3d(640px, 0, 0)' : 'translate3d(0, 0, 0)' }}
            opacity={{ base: isAdminMode ? 0 : 1, md: 1 }}
            pointerEvents={{ base: isAdminMode ? 'none' : 'auto', md: 'auto' }}
            style={{ transition: 'transform 1.2s ease-in-out, opacity 0.35s ease-in-out' }}
          >
            <Heading display={{ base: "none", md: "block" }} w="100%" fontSize="26px" textAlign="center" fontWeight="bold" color="white">Voter Login</Heading>
            
            <Box as="label" display="block" w="260px" mx="auto" textAlign="center">
              <Text as="span" fontSize="12px" color="gray.400" textTransform="uppercase">NIM (STUDENT ID)</Text>
              <Input 
                display="block" w="100%" mt="10px" p="12px 15px" fontSize="15px"
                border="2px solid #4a5568" borderRadius="12px" textAlign="center" bg="#2d3748" color="white"
                transition="all 0.3s ease" _focus={{ borderColor: '#39C5BB', boxShadow: '0 0 0 3px rgba(57, 197, 187, 0.2)', bg: '#1a202c', outline: 'none' }}
                value={nim}
                onChange={(e) => setNim(e.target.value)}
            inputMode="numeric"
            maxLength={9}
                autoComplete="off"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleVoterLogin();
                }}
                disabled={loadingVoter}
                h="auto"
              />
            </Box>
            {renderCaptchaWidget(showVoterCaptcha)}

            {/* Desktop Button */}
            <Button 
              type="submit" disabled={loadingVoter}
              display={{ base: "none", md: "block" }} mx="auto" w="260px" h="36px" borderRadius="30px" color="#fff" fontSize="15px" cursor="pointer"
              m="0" bg="linear-gradient(135deg, #39C5BB 0%, #0d9488 100%)" textTransform="uppercase" fontWeight="bold"
              transition="transform 0.2s, box-shadow 0.2s"
              _hover={{ transform: 'translateY(-2px)', boxShadow: '0 10px 20px rgba(57, 197, 187, 0.3)' }}
              _disabled={{ opacity: 0.7, cursor: 'not-allowed', transform: 'none', boxShadow: 'none' }}
            >
              {loadingVoter ? 'LOGGING IN...' : 'LOG IN'}
            </Button>
          </Box>

          {/* Sliding Panel Overlay (.sub-cont) */}
          <Box 
            position="absolute" 
            top={{ base: "60px", md: 0 }} 
            left={{ base: 0, md: "640px" }} 
            w={{ base: "100%", md: "900px" }} 
            h={{ base: "calc(100% - 60px)", md: "100%" }} 
            bg={{ base: "transparent", md: "#1a202c" }} 
            pl={{ base: 0, md: "260px" }} 
            overflow={{ base: "visible", md: "hidden" }}
            transform={{ base: 'none', md: isAdminMode ? 'translate3d(-640px, 0, 0)' : 'translate3d(0, 0, 0)' }}
            pointerEvents={{ base: isAdminMode ? 'auto' : 'none', md: 'auto' }}
            zIndex={{ base: 15, md: 10 }}
            style={{ transition: 'transform 1.2s ease-in-out' }}
          >
            {/* The Image Overlay Mask (.img) - Desktop Only */}
            <Box display={{ base: "none", md: "block" }} position="absolute" top={0} left={0} w="260px" h="100%" pt="360px" zIndex={2} overflow="hidden">
              <Box 
                position="absolute" top={0} right={0} w="900px" h="100%" m="auto"
                bg={`url('/assets/login_panel_bg.jpg') center/cover no-repeat, linear-gradient(135deg, #39C5BB 0%, #0d9488 100%)`}
                transform={isAdminMode ? 'translate3d(640px, 0, 0)' : 'translate3d(0, 0, 0)'}
                style={{ transition: 'transform 1.2s ease-in-out' }}
                _after={{ content: '""', position: 'absolute', left: 0, top: 0, w: '100%', h: '100%', bg: 'rgba(0, 0, 0, 0.7)' }}
              />
              <Box 
                position="absolute" top={0} right={0} w="900px" h="100%" m="auto"
                bg={`url('/assets/login_panel_bg.jpg') center/cover no-repeat, linear-gradient(135deg, #F32C9E 0%, #7B1FA2 100%)`}
                opacity={isAdminMode ? 1 : 0}
                transform={isAdminMode ? 'translate3d(640px, 0, 0)' : 'translate3d(0, 0, 0)'}
                style={{ transition: 'transform 1.2s ease-in-out, opacity 1.2s ease-in-out' }}
              />

              <Box position="absolute" left={0} top="50px" w="100%" px="20px" textAlign="center" color="#fff" zIndex={2}
                   transform={isAdminMode ? 'translateX(520px)' : 'translateX(0)'} style={{ transition: 'transform 1.2s ease-in-out' }}>
                <Heading fontSize="26px" fontWeight="normal" mb="10px">Admin Area</Heading>
                <Text fontSize="14px" lineHeight="1.5" color="gray.300">Switch to administrator login</Text>
              </Box>
              <Box position="absolute" left={0} top="50px" w="100%" px="20px" textAlign="center" color="#fff" zIndex={2}
                   transform={isAdminMode ? 'translateX(0)' : 'translateX(-520px)'} style={{ transition: 'transform 1.2s ease-in-out' }}>
                <Heading fontSize="26px" fontWeight="normal" mb="10px">Voter Area</Heading>
                <Text fontSize="14px" lineHeight="1.5" color="gray.300">Switch to voter login</Text>
              </Box>

              <Box position="relative" w="100px" h="36px" mx="auto" bg="transparent" color="#fff" textTransform="uppercase" fontSize="15px" cursor="pointer" zIndex={2} overflow="hidden" onClick={() => setIsAdminMode(!isAdminMode)}
                   _after={{ content: '""', zIndex: 2, position: 'absolute', left: 0, top: 0, w: '100%', h: '100%', border: '2px solid #fff', borderRadius: '30px' }}>
                <Box position="absolute" left={0} top={0} w="100%" h="100%" display="flex" justifyContent="center" alignItems="center"
                     transform={isAdminMode ? 'translateY(72px)' : 'translateY(0)'} style={{ transition: 'transform 1.2s ease-in-out' }}>
                  Admin
                </Box>
                <Box position="absolute" left={0} top={0} w="100%" h="100%" display="flex" justifyContent="center" alignItems="center"
                     transform={isAdminMode ? 'translateY(0)' : 'translateY(-72px)'} style={{ transition: 'transform 1.2s ease-in-out' }}>
                  Voter
                </Box>
              </Box>
            </Box>

            {/* Admin Form (.form.sign-up) */}
            <Box 
              as="form" onSubmit={handleAdminLogin}
              position="relative" w={{ base: "100%", md: "640px" }} h="100%"
              px={{ base: "20px", md: "30px" }} 
              pt={{ base: "60px", md: "50px" }}
              pb={{ base: "80px", md: "40px" }}
              display="flex" flexDir="column" justifyContent={{ base: "space-evenly", md: "space-between" }} alignItems="center"
              transform={{ base: 'none', md: isAdminMode ? 'translate3d(0, 0, 0)' : 'translate3d(-900px, 0, 0)' }}
              opacity={{ base: isAdminMode ? 1 : 0, md: 1 }}
              pointerEvents={{ base: isAdminMode ? 'auto' : 'none', md: 'auto' }}
              style={{ transition: 'transform 1.2s ease-in-out, opacity 0.35s ease-in-out' }}
            >
              <Heading display={{ base: "none", md: "block" }} w="100%" fontSize="26px" textAlign="center" fontWeight="bold" color="white">Admin Login</Heading>
              
              <Box as="label" display="block" w="260px" mx="auto" textAlign="center">
                <Text as="span" fontSize="12px" color="gray.400" textTransform="uppercase">EMAIL</Text>
                <Input 
                  type="email" display="block" w="100%" mt="10px" p="12px 15px" fontSize="15px" h="auto"
                  border="2px solid #4a5568" borderRadius="12px" textAlign="center" bg="#2d3748" color="white"
                  transition="all 0.3s ease" _focus={{ borderColor: '#F32C9E', boxShadow: '0 0 0 3px rgba(243, 44, 158, 0.2)', bg: '#1a202c', outline: 'none' }}
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  disabled={loadingAdmin}
                />
              </Box>

              <Box as="label" display="block" w="260px" mx="auto" textAlign="center">
                <Text as="span" fontSize="12px" color="gray.400" textTransform="uppercase">PASSWORD</Text>
                <Input 
                  type="password" display="block" w="100%" mt="10px" p="12px 15px" fontSize="15px" h="auto"
                  border="2px solid #4a5568" borderRadius="12px" textAlign="center" bg="#2d3748" color="white"
                  transition="all 0.3s ease" _focus={{ borderColor: '#F32C9E', boxShadow: '0 0 0 3px rgba(243, 44, 158, 0.2)', bg: '#1a202c', outline: 'none' }}
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  disabled={loadingAdmin}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAdminLogin();
                  }}
                />
              </Box>
              {renderCaptchaWidget(showAdminCaptcha)}

              {/* Desktop Button */}
              <Button 
                type="submit" disabled={loadingAdmin}
                display={{ base: "none", md: "block" }} mx="auto" w="260px" h="36px" borderRadius="30px" color="#fff" fontSize="15px" cursor="pointer"
                m="0" bg="linear-gradient(135deg, #F32C9E 0%, #7B1FA2 100%)" textTransform="uppercase" fontWeight="bold"
                transition="transform 0.2s, box-shadow 0.2s"
                _hover={{ transform: 'translateY(-2px)', boxShadow: '0 10px 20px rgba(243, 44, 158, 0.3)' }}
                _disabled={{ opacity: 0.7, cursor: 'not-allowed', transform: 'none', boxShadow: 'none' }}
              >
                {loadingAdmin ? 'LOGGING IN...' : 'LOG IN'}
              </Button>
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
              <Box position="absolute" inset={0} bg="linear-gradient(135deg, #39C5BB 0%, #0d9488 100%)" zIndex={0} />
              <Box position="absolute" inset={0} bg="linear-gradient(135deg, #F32C9E 0%, #7B1FA2 100%)" zIndex={1} opacity={isAdminMode ? 1 : 0} transition="opacity 0.5s ease-in-out" />
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
