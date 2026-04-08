import { useState, useEffect } from 'react';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('signin'); // 'signin' or 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');

  // --- DASHBOARD STATE ---
  // In a real app, this would come from a Context Provider or Auth hook
  const [accountNumber, setAccountNumber] = useState('100001'); // Using a dummy initial value for simulation
  const [accountData, setAccountData] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // --- API LOGIC (Fetch) ---
  const fetchAccount = async (accNum) => {
    setIsLoading(true);
    setError('');
    
    // Simulate slight network delay to show off the skeleton loader nicely
    await new Promise(resolve => setTimeout(resolve, 800));

    try {
      const response = await fetch(`http://localhost:8080/api/accounts/${accNum}`);
      if (!response.ok) throw new Error("Account not found");
      const data = await response.json();
      setAccountData(data);
    } catch (err) {
      setError("Error: Could not fetch account details. Make sure the backend is running and the account exists.");
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-fetch data when logged in and landing on the dashboard
  useEffect(() => {
    if (isLoggedIn && activeTab === 'dashboard' && !accountData && !isLoading) {
      // In a real scenario, you would fetch based on the logged in user's token or session metadata
      // Since it's hardcoded and we haven't touched the backend, we try to fetch 'accountNumber'
      fetchAccount(accountNumber);
    }
  }, [isLoggedIn, activeTab]);

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    // // Firebase auth logic goes here
    setShowAuthModal(false);
    setIsLoggedIn(true);
    setActiveTab('dashboard');
  };

  // --- PREMIUM UI THEME ---
  const theme = {
    darkBrown: '#2B1B17',
    bronze: '#8D6E63',
    bgWhite: '#F9F8F6',
    cardWhite: '#FFFFFF',
    textLight: '#795548',
    forestGreen: '#2E8B57',
    borderLight: '#E0E0E0'
  };



  // ==========================================
  // LANDING PAGE VIEW (Public Route)
  // ==========================================
  if (!isLoggedIn) {
    return (
      <div style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif', backgroundColor: theme.bgWhite, minHeight: '100vh', margin: 0, padding: 0 }}>
        {/* Render Auth Modal inline to prevent re-renders when state changes */}
        {showAuthModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(43, 27, 23, 0.85)', zIndex: 2000, display: 'flex', justifyContent: 'center', alignItems: 'center', animation: 'fadeIn 0.2s' }}>
            <div style={{ backgroundColor: theme.cardWhite, padding: '40px', borderRadius: '12px', width: '100%', maxWidth: '400px', boxShadow: '0 20px 40px rgba(0,0,0,0.3)', position: 'relative' }}>
              <button 
                onClick={() => setShowAuthModal(false)}
                style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: theme.textLight, transition: '0.2s' }}
                onMouseOver={(e) => e.target.style.color = theme.darkBrown}
                onMouseOut={(e) => e.target.style.color = theme.textLight}
              >
                ✕
              </button>
              
              <h2 style={{ textAlign: 'center', color: theme.darkBrown, marginTop: 0, marginBottom: '30px', fontWeight: '300' }}>
                <strong style={{ fontWeight: '700' }}>CORE</strong> WEALTH
              </h2>

              <div style={{ display: 'flex', marginBottom: '30px', borderBottom: `2px solid ${theme.borderLight}` }}>
                <button 
                  onClick={() => setAuthMode('signin')}
                  style={{ flex: 1, padding: '10px', background: 'none', border: 'none', borderBottom: authMode === 'signin' ? `3px solid ${theme.darkBrown}` : '3px solid transparent', color: authMode === 'signin' ? theme.darkBrown : theme.textLight, fontWeight: authMode === 'signin' ? 'bold' : 'normal', cursor: 'pointer', transition: 'all 0.2s', marginBottom: '-2px', fontSize: '15px' }}
                >
                  Sign In
                </button>
                <button 
                  onClick={() => setAuthMode('signup')}
                  style={{ flex: 1, padding: '10px', background: 'none', border: 'none', borderBottom: authMode === 'signup' ? `3px solid ${theme.darkBrown}` : '3px solid transparent', color: authMode === 'signup' ? theme.darkBrown : theme.textLight, fontWeight: authMode === 'signup' ? 'bold' : 'normal', cursor: 'pointer', transition: 'all 0.2s', marginBottom: '-2px', fontSize: '15px' }}
                >
                  Create Account
                </button>
              </div>

              <form onSubmit={handleLoginSubmit}>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', color: theme.textLight, fontSize: '14px', marginBottom: '8px', fontWeight: '500' }}>Email Address</label>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={{ width: '100%', padding: '14px', boxSizing: 'border-box', border: `1px solid ${theme.borderLight}`, borderRadius: '6px', fontSize: '16px', outline: 'none' }}
                    onFocus={(e) => e.target.style.borderColor = theme.darkBrown}
                    onBlur={(e) => e.target.style.borderColor = theme.borderLight}
                    placeholder="executive@corewealth.com"
                  />
                </div>
                
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', color: theme.textLight, fontSize: '14px', marginBottom: '8px', fontWeight: '500' }}>Password</label>
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={{ width: '100%', padding: '14px', boxSizing: 'border-box', border: `1px solid ${theme.borderLight}`, borderRadius: '6px', fontSize: '16px', outline: 'none' }}
                    onFocus={(e) => e.target.style.borderColor = theme.darkBrown}
                    onBlur={(e) => e.target.style.borderColor = theme.borderLight}
                    placeholder="••••••••"
                  />
                </div>

                {authMode === 'signin' && (
                  <div style={{ textAlign: 'right', marginBottom: '24px' }}>
                    <a href="#" style={{ color: theme.bronze, fontSize: '14px', textDecoration: 'none', fontWeight: '500' }}>Forgot Password?</a>
                  </div>
                )}

                <button 
                  type="submit"
                  style={{ width: '100%', padding: '15px', backgroundColor: theme.darkBrown, color: 'white', border: 'none', borderRadius: '6px', fontSize: '16px', fontWeight: '600', cursor: 'pointer', marginBottom: '24px', transition: 'background-color 0.2s', letterSpacing: '0.5px' }}
                  onMouseOver={(e) => e.target.style.backgroundColor = '#1A100E'}
                  onMouseOut={(e) => e.target.style.backgroundColor = theme.darkBrown}
                >
                  {authMode === 'signin' ? 'Secure Login' : 'Open Account'}
                </button>
              </form>

              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
                <div style={{ flex: 1, height: '1px', backgroundColor: theme.borderLight }}></div>
                <span style={{ padding: '0 15px', color: theme.textLight, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px' }}>or</span>
                <div style={{ flex: 1, height: '1px', backgroundColor: theme.borderLight }}></div>
              </div>

              <button 
                type="button"
                onClick={() => {
                  // // Firebase Google Auth logic goes here
                  handleLoginSubmit({preventDefault: () => {}});
                }}
                style={{ width: '100%', padding: '14px', backgroundColor: 'white', color: '#444', border: `1px solid ${theme.borderLight}`, borderRadius: '6px', fontSize: '15px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', transition: 'background-color 0.2s' }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#F5F5F5'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
              >
                <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
                Continue with Google
              </button>
            </div>
          </div>
        )}

        {/* TOP NAVIGATION BAR */}
        <nav style={{ backgroundColor: theme.cardWhite, padding: '20px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', position: 'sticky', top: 0, zIndex: 1000 }}>
          <h1 style={{ margin: 0, fontSize: '24px', letterSpacing: '1px', color: theme.darkBrown, fontWeight: '300' }}>
            <strong style={{ fontWeight: '700' }}>CORE</strong> WEALTH
          </h1>
          <div>
            <button 
              onClick={() => { setAuthMode('signin'); setShowAuthModal(true); }} 
              style={{ background: 'transparent', border: `1px solid ${theme.darkBrown}`, color: theme.darkBrown, padding: '10px 24px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', letterSpacing: '0.5px', transition: 'all 0.2s', textTransform: 'uppercase' }}
              onMouseOver={(e) => { e.target.style.backgroundColor = theme.darkBrown; e.target.style.color = 'white'; }}
              onMouseOut={(e) => { e.target.style.backgroundColor = 'transparent'; e.target.style.color = theme.darkBrown; }}
            >
              Login / Sign Up
            </button>
          </div>
        </nav>

        {/* HERO SECTION */}
        <header style={{ backgroundColor: theme.darkBrown, color: theme.bgWhite, padding: '120px 20px', textAlign: 'center', borderBottom: `4px solid ${theme.bronze}` }}>
          <h2 style={{ fontSize: '56px', fontWeight: '300', margin: '0 0 24px 0', letterSpacing: '1px' }}>Empower Your Financial Future</h2>
          <p style={{ fontSize: '20px', maxWidth: '700px', margin: '0 auto 48px auto', color: '#D7CCC8', lineHeight: '1.6', fontWeight: '300' }}>
            Experience secure, intelligent wealth management with CORE WEALTH. Bank with confidence using our state-of-the-art encrypted platform designed for the modern elite.
          </p>
          <button 
            onClick={() => { setAuthMode('signup'); setShowAuthModal(true); }} 
            style={{ backgroundColor: theme.bronze, color: 'white', border: 'none', padding: '18px 48px', fontSize: '18px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 15px rgba(141, 110, 99, 0.3)', letterSpacing: '1px', transition: 'transform 0.2s, backgroundColor 0.2s' }}
            onMouseOver={(e) => { e.target.style.transform = 'scale(1.05)'; }}
            onMouseOut={(e) => { e.target.style.transform = 'scale(1)'; }}
          >
            Open an Account
          </button>
        </header>

        {/* FEATURES SECTION (3-column) */}
        <section style={{ maxWidth: '1200px', margin: '80px auto', padding: '0 20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '40px' }}>
          
          {/* Feature 1: Secure Vault */}
          <div style={{ backgroundColor: theme.cardWhite, padding: '50px 30px', borderRadius: '8px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', borderTop: `4px solid ${theme.forestGreen}`, textAlign: 'center', transition: 'transform 0.3s' }} onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-10px)'} onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
             <div style={{ fontSize: '48px', marginBottom: '24px' }}>🛡️</div>
             <h3 style={{ color: theme.darkBrown, fontSize: '24px', marginBottom: '16px', fontWeight: '600' }}>Secure Vault</h3>
             <p style={{ color: theme.textLight, lineHeight: '1.6', fontSize: '16px' }}>Your assets are guarded by military-grade encryption and multi-factor authentication, ensuring absolute peace of mind.</p>
          </div>

          {/* Feature 2: Instant Transfers */}
          <div style={{ backgroundColor: theme.cardWhite, padding: '50px 30px', borderRadius: '8px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', borderTop: `4px solid ${theme.bronze}`, textAlign: 'center', transition: 'transform 0.3s' }} onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-10px)'} onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
             <div style={{ fontSize: '48px', marginBottom: '24px' }}>⚡</div>
             <h3 style={{ color: theme.darkBrown, fontSize: '24px', marginBottom: '16px', fontWeight: '600' }}>Instant Transfers</h3>
             <p style={{ color: theme.textLight, lineHeight: '1.6', fontSize: '16px' }}>Move your money dynamically across borders and accounts with zero latency. Precision meets velocity.</p>
          </div>

          {/* Feature 3: Premium Support */}
          <div style={{ backgroundColor: theme.cardWhite, padding: '50px 30px', borderRadius: '8px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', borderTop: `4px solid ${theme.darkBrown}`, textAlign: 'center', transition: 'transform 0.3s' }} onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-10px)'} onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
             <div style={{ fontSize: '48px', marginBottom: '24px' }}>🛎️</div>
             <h3 style={{ color: theme.darkBrown, fontSize: '24px', marginBottom: '16px', fontWeight: '600' }}>Premium Support</h3>
             <p style={{ color: theme.textLight, lineHeight: '1.6', fontSize: '16px' }}>Priority access to our dedicated wealth concierges, available 24/7 to assist with your most critical inquiries.</p>
          </div>
          
        </section>

        {/* SECTION 1: Strategic Growth (Modified Marketing Section) */}
        <section style={{ backgroundColor: '#F0EBE1', padding: '100px 40px', borderTop: '1px solid #E5E0D8' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            
            {/* Top Row */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '40px', marginBottom: '80px', alignItems: 'flex-start' }}>
              <h2 style={{ flex: '1 1 500px', fontSize: '56px', fontFamily: 'Georgia, serif', fontWeight: '400', margin: 0, color: theme.darkBrown, lineHeight: '1.1', letterSpacing: '-0.5px' }}>
                Elevating global financial strategy
              </h2>
              <p style={{ flex: '1 1 400px', fontSize: '22px', color: '#1A1A1A', lineHeight: '1.5', margin: 0, fontWeight: '400', paddingTop: '10px' }}>
                We apply decades of institutional intelligence to help our clients and partners secure their financial legacy.
              </p>
            </div>

            {/* Bottom Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '80px' }}>
              <div style={{ borderLeft: `1px solid ${theme.darkBrown}`, paddingLeft: '40px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <h3 style={{ fontSize: '32px', color: theme.darkBrown, margin: 0, fontWeight: '600', letterSpacing: '-0.5px' }}>Strategic Growth</h3>
                <p style={{ fontSize: '18px', color: '#333', lineHeight: '1.6', margin: 0 }}>
                  Driving sustainable wealth expansion through precision capital allocation and algorithmic macroeconomic forecasting.
                </p>
                <a href="#" style={{ color: '#9A5B3E', textDecoration: 'none', fontWeight: '600', fontSize: '18px', marginTop: '10px', display: 'inline-block', transition: 'opacity 0.2s' }} onMouseOver={(e) => e.target.style.opacity = '0.8'} onMouseOut={(e) => e.target.style.opacity = '1'}>
                  Drive your growth &rarr;
                </a>
              </div>
              <div style={{ borderLeft: `1px solid ${theme.darkBrown}`, paddingLeft: '40px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <h3 style={{ fontSize: '32px', color: theme.darkBrown, margin: 0, fontWeight: '600', letterSpacing: '-0.5px' }}>Global Intelligence</h3>
                <p style={{ fontSize: '18px', color: '#333', lineHeight: '1.6', margin: 0 }}>
                  Operating at the intersection of data-driven insights and macroeconomic expertise to protect assets across borders.
                </p>
                <a href="#" style={{ color: '#9A5B3E', textDecoration: 'none', fontWeight: '600', fontSize: '18px', marginTop: '10px', display: 'inline-block', transition: 'opacity 0.2s' }} onMouseOver={(e) => e.target.style.opacity = '0.8'} onMouseOut={(e) => e.target.style.opacity = '1'}>
                  Explore intelligence &rarr;
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: Split Image Section */}
        <section style={{ backgroundColor: theme.cardWhite, padding: '100px 40px' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: '60px', alignItems: 'center' }}>
            <div style={{ flex: '1 1 400px', paddingRight: '40px' }}>
              <h2 style={{ fontSize: '56px', fontFamily: 'Georgia, serif', fontWeight: '400', margin: '0 0 30px 0', color: theme.darkBrown, lineHeight: '1.1', letterSpacing: '-0.5px' }}>
                Cultivating elite talent
              </h2>
              <p style={{ fontSize: '20px', color: '#1A1A1A', lineHeight: '1.6', margin: '0 0 40px 0', fontWeight: '400' }}>
                At Core Wealth, our greatest asset is human capital. We foster an environment where world-class financial minds converge to deliver exceptional value.
              </p>
              <button style={{ backgroundColor: 'transparent', border: `1px solid ${theme.darkBrown}`, padding: '12px 30px', borderRadius: '30px', fontSize: '16px', fontWeight: '600', color: theme.darkBrown, cursor: 'pointer', transition: '0.2s' }} onMouseOver={(e) => { e.target.style.backgroundColor = theme.darkBrown; e.target.style.color = 'white'; }} onMouseOut={(e) => { e.target.style.backgroundColor = 'transparent'; e.target.style.color = theme.darkBrown; }}>
                Explore careers &rarr;
              </button>
            </div>
            <div style={{ flex: '1 1 500px' }}>
               <img src="/wealth.png" alt="Corporate professional" style={{ width: '100%', borderRadius: '4px', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }} />
            </div>
          </div>
        </section>

        {/* SECTION 3: Dark Annual Report Banner */}
        <section style={{ backgroundColor: '#1E1E1E', padding: '60px 40px' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '40px' }}>
            <h2 style={{ fontSize: '48px', fontFamily: 'Georgia, serif', fontWeight: '400', color: 'white', margin: 0, flex: '1 1 500px', lineHeight: '1.1', letterSpacing: '-0.5px' }}>
              The 2026 Core Wealth<br />Intelligence Report
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', flex: '1 1 300px' }}>
               <p style={{ color: '#D0D0D0', fontSize: '18px', margin: '0 0 20px 0' }}>Our comprehensive market analysis and shareholder forecast, released April 2026.</p>
               <button style={{ backgroundColor: '#A2C5E5', border: 'none', padding: '14px 34px', borderRadius: '30px', fontSize: '16px', fontWeight: '600', color: '#111', cursor: 'pointer', transition: '0.2s' }} onMouseOver={(e) => { e.target.style.backgroundColor = '#89B3D8'; }} onMouseOut={(e) => { e.target.style.backgroundColor = '#A2C5E5'; }}>
                 Read the prospectus &rarr;
               </button>
            </div>
          </div>
        </section>

        {/* SECTION 4: In The News Grid */}
        <section style={{ backgroundColor: theme.cardWhite, padding: '100px 40px' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ borderBottom: `1px solid ${theme.borderLight}`, paddingBottom: '30px', marginBottom: '60px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <h2 style={{ fontSize: '56px', fontFamily: 'Georgia, serif', fontWeight: '400', margin: 0, color: theme.darkBrown, letterSpacing: '-0.5px' }}>
                In the intelligence
              </h2>
              <button style={{ backgroundColor: 'transparent', border: `1px solid ${theme.darkBrown}`, padding: '10px 24px', borderRadius: '30px', fontSize: '14px', fontWeight: '600', color: theme.darkBrown, cursor: 'pointer', transition: '0.2s' }} onMouseOver={(e) => { e.target.style.backgroundColor = theme.darkBrown; e.target.style.color = 'white'; }} onMouseOut={(e) => { e.target.style.backgroundColor = 'transparent'; e.target.style.color = theme.darkBrown; }}>
                View all &rarr;
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '40px' }}>
               <div style={{ borderLeft: '1px solid #E0E0E0', paddingLeft: '30px' }}>
                 <h3 style={{ fontSize: '26px', color: theme.darkBrown, margin: '0 0 20px 0', fontWeight: '600', letterSpacing: '-0.5px', lineHeight: '1.3' }}>Core Wealth acquires next-gen fintech infrastructure</h3>
                 <p style={{ fontSize: '16px', color: '#555', margin: '0 0 20px 0', lineHeight: '1.5' }}>Expanding our technological capabilities to offer latency-free global transactions.</p>
                 <a href="#" style={{ color: '#9A5B3E', textDecoration: 'none', fontWeight: '600', fontSize: '15px' }}>Learn more &rarr;</a>
               </div>
               
               <div style={{ borderLeft: '1px solid #E0E0E0', paddingLeft: '30px' }}>
                 <h3 style={{ fontSize: '26px', color: theme.darkBrown, margin: '0 0 20px 0', fontWeight: '600', letterSpacing: '-0.5px', lineHeight: '1.3' }}>Global markets outlook: Embracing algorithmic liquidity</h3>
                 <p style={{ fontSize: '16px', color: '#555', margin: '0 0 20px 0', lineHeight: '1.5' }}>Our quantitative division publishes findings on macroeconomic shifts in the digital asset space.</p>
                 <a href="#" style={{ color: '#9A5B3E', textDecoration: 'none', fontWeight: '600', fontSize: '15px' }}>Learn more &rarr;</a>
               </div>
               
               <div style={{ borderLeft: '1px solid #E0E0E0', paddingLeft: '30px' }}>
                 <h3 style={{ fontSize: '26px', color: theme.darkBrown, margin: '0 0 20px 0', fontWeight: '600', letterSpacing: '-0.5px', lineHeight: '1.3' }}>Strategic philanthropic initiative launches in tech hubs</h3>
                 <p style={{ fontSize: '16px', color: '#555', margin: '0 0 20px 0', lineHeight: '1.5' }}>Committing capital to foster education and innovation in emerging global technology centers.</p>
                 <a href="#" style={{ color: '#9A5B3E', textDecoration: 'none', fontWeight: '600', fontSize: '15px' }}>Learn more &rarr;</a>
               </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  // ==========================================
  // PORTAL VIEW (Private Route / Logged In)
  // ==========================================
  return (
    <div style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif', backgroundColor: theme.bgWhite, minHeight: '100vh', margin: 0, padding: 0 }}>
      {/* Define inline keyframes for the pulse animation used in skeleton loader */}
      <style>{`
        @keyframes pulse {
          0% { opacity: 0.5; }
          50% { opacity: 0.2; }
          100% { opacity: 0.5; }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
      
      {/* 1. TOP NAVIGATION BAR */}
      <nav style={{ backgroundColor: theme.darkBrown, padding: '20px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        <h1 
          style={{ margin: 0, fontSize: '24px', letterSpacing: '1px', fontWeight: '300', cursor: 'pointer' }}
          onClick={() => { setIsLoggedIn(false); setActiveTab('dashboard'); }}
        >
          <strong style={{ fontWeight: '700' }}>CORE</strong> WEALTH
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ fontSize: '14px', color: theme.bronze }}>Secure Banking Portal</div>
          <button 
            onClick={() => { setIsLoggedIn(false); setActiveTab('dashboard'); setAccountData(null); }}
            style={{ background: 'transparent', border: `1px solid ${theme.bronze}`, color: theme.bronze, padding: '6px 16px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', transition: '0.2s', textTransform: 'uppercase', letterSpacing: '0.5px' }}
            onMouseOver={(e) => { e.target.style.backgroundColor = theme.bronze; e.target.style.color = 'white'; }}
            onMouseOut={(e) => { e.target.style.backgroundColor = 'transparent'; e.target.style.color = theme.bronze; }}
          >
            Sign Out
          </button>
        </div>
      </nav>

      {/* 2. AXIS-STYLE SUB-MENU (The Tab Switcher) */}
      <div style={{ backgroundColor: theme.cardWhite, borderBottom: '1px solid #E0E0E0', display: 'flex', justifyContent: 'center', gap: '30px', padding: '15px 0', position: 'sticky', top: 0, zIndex: 100 }}>
        {['dashboard', 'transact', 'transfer', 'open account'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              background: 'none', border: 'none', fontSize: '16px', fontWeight: activeTab === tab ? 'bold' : 'normal',
              color: activeTab === tab ? theme.darkBrown : theme.textLight, cursor: 'pointer', textTransform: 'capitalize',
              borderBottom: activeTab === tab ? `3px solid ${theme.darkBrown}` : '3px solid transparent', paddingBottom: '5px', transition: 'all 0.2s'
            }}
          >
            {tab === 'dashboard' ? 'Overview' : tab}
          </button>
        ))}
      </div>

      {/* 3. MAIN CONTENT AREA */}
      <main style={{ maxWidth: '800px', margin: '40px auto', padding: '0 20px' }}>

        {/* --- TAB: DASHBOARD (Read) --- */}
        {activeTab === 'dashboard' && (
          <div style={{ animation: 'fadeIn 0.5s' }}>
            <h2 style={{ color: theme.darkBrown, fontWeight: '300', marginBottom: '30px' }}>Account Overview</h2>

            {/* Error Handling */}
            {error && <div style={{ padding: '15px', backgroundColor: '#ffebee', color: '#c62828', borderRadius: '4px', marginBottom: '20px', borderLeft: '4px solid #c62828' }}>{error}</div>}

            {/* LOADING STATE - SKELETON LOADER */}
            {isLoading && !error && (
              <div style={{ backgroundColor: theme.cardWhite, padding: '40px', borderRadius: '8px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', borderTop: `4px solid ${theme.bronze}`, animation: 'pulse 1.5s infinite ease-in-out' }}>
                <div style={{ height: '12px', width: '90px', backgroundColor: theme.borderLight, borderRadius: '4px', marginBottom: '10px' }}></div>
                <div style={{ height: '32px', width: '220px', backgroundColor: theme.borderLight, borderRadius: '4px', marginBottom: '30px' }}></div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px solid #f0f0f0', paddingBottom: '20px' }}>
                  <div>
                    <div style={{ height: '14px', width: '110px', backgroundColor: theme.borderLight, borderRadius: '4px', marginBottom: '8px' }}></div>
                    <div style={{ height: '42px', width: '160px', backgroundColor: theme.borderLight, borderRadius: '4px' }}></div>
                  </div>
                  <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                    <div style={{ height: '14px', width: '130px', backgroundColor: theme.borderLight, borderRadius: '4px', marginBottom: '10px' }}></div>
                    <div style={{ height: '14px', width: '90px', backgroundColor: theme.borderLight, borderRadius: '4px' }}></div>
                  </div>
                </div>
              </div>
            )}

            {/* FETCHED DATA VIEW */}
            {!isLoading && accountData && (
              <div style={{ backgroundColor: theme.cardWhite, padding: '40px', borderRadius: '8px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', borderTop: `4px solid ${theme.bronze}`, animation: 'fadeIn 0.5s' }}>
                <p style={{ color: theme.textLight, textTransform: 'uppercase', letterSpacing: '1px', fontSize: '12px', margin: 0 }}>Welcome back</p>
                <h1 style={{ color: theme.darkBrown, margin: '5px 0 20px 0', fontSize: '32px' }}>{accountData.username}</h1>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px solid #eee', paddingBottom: '20px' }}>
                  <div>
                    <p style={{ color: theme.textLight, margin: 0, fontSize: '14px' }}>Available Balance</p>
                    <h2 style={{ margin: 0, color: theme.forestGreen, fontSize: '42px', fontWeight: '300' }}>₹{accountData.balance.toLocaleString()}</h2>
                  </div>
                  <div style={{ textAlign: 'right', color: theme.textLight, fontSize: '14px' }}>
                    <p style={{ margin: '0 0 5px 0' }}>Type: <strong>{accountData.account_type || "SAVINGS"}</strong></p>
                    <p style={{ margin: 0 }}>Interest: <strong>{accountData.interestRate}%</strong></p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- TAB: TRANSACT (Update) --- */}
        {activeTab === 'transact' && (
          <div>
            <h2 style={{ color: theme.darkBrown, fontWeight: '300' }}>Deposit & Withdrawal</h2>
            <div style={{ backgroundColor: theme.cardWhite, padding: '40px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
              <p style={{ color: theme.textLight }}>UI for PUT /transaction endpoint will go here.</p>
            </div>
          </div>
        )}

        {/* --- TAB: TRANSFER (Post) --- */}
        {activeTab === 'transfer' && (
          <div>
            <h2 style={{ color: theme.darkBrown, fontWeight: '300' }}>Wire Transfer</h2>
            <div style={{ backgroundColor: theme.cardWhite, padding: '40px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
              <p style={{ color: theme.textLight }}>UI for POST /transfer endpoint will go here.</p>
            </div>
          </div>
        )}

        {/* --- TAB: OPEN ACCOUNT (Create) --- */}
        {activeTab === 'open account' && (
          <div>
            <h2 style={{ color: theme.darkBrown, fontWeight: '300' }}>Open New Account</h2>
            <div style={{ backgroundColor: theme.cardWhite, padding: '40px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
              <p style={{ color: theme.textLight }}>UI for POST /create endpoint will go here.</p>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

export default App;