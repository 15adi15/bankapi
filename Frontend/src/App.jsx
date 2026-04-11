import { useState, useEffect } from 'react';
import { logInWithGoogle, logOut } from './firebase';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('signin'); // 'signin' or 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState('accounts');

  // --- ACCOUNTS DATA STATE ---
  const [unlockedAccounts, setUnlockedAccounts] = useState([]); // array of unlocked account ids
  const [pinModalOpenFor, setPinModalOpenFor] = useState(null); // account id or null
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [error, setError] = useState('');
  const [accountData, setAccountData] = useState([]);

  // --- NEW ACCOUNT CREATION STATE ---
  const [openAccountModal, setOpenAccountModal] = useState(false);
  const [newAccType, setNewAccType] = useState('SAVINGS');
  const [newAccUsername, setNewAccUsername] = useState('');
  const [newAccPin, setNewAccPin] = useState('');
  const [newAccDeposit, setNewAccDeposit] = useState('');
  const [createAccMessage, setCreateAccMessage] = useState('');

  // --- TRANSACT & TRANSFER STATE ---
  const [txType, setTxType] = useState('DEPOSIT'); // DEPOSIT, WITHDRAW, TRANSFER
  const [txSourceAcc, setTxSourceAcc] = useState(null);
  const [txDestAcc, setTxDestAcc] = useState('');
  const [txAmount, setTxAmount] = useState('');
  const [txPin, setTxPin] = useState('');
  const [txStatus, setTxStatus] = useState(null); // null, 'processing', 'success', 'error'
  const [txMessage, setTxMessage] = useState('');

  // --- THE AUTH SYNC HANDSHAKE ---
  const handleLogin = async () => {
    setError('');

    try {
      // 1. Talk to Google
      const result = await logInWithGoogle();
      const userEmail = result.user.email;
      setEmail(userEmail); // Preserve the email in state for future account creation!
      console.log("Firebase authenticated email:", userEmail);

      // 2. Talk to Spring Boot
      const response = await fetch('http://localhost:8080/api/accounts/auth/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: userEmail })
      });

      // 3. Parse the data safely
      const rawText = await response.text();
      let data;
      try {
        data = JSON.parse(rawText);
      } catch (e) {
        data = rawText;
      }

      console.log("SPRING BOOT RETURNED:", data);

      // 4. Check for our explicit error messages
      if (data === "NO_ACCOUNT_FOUND" || data.status === "NO_ACCOUNT_FOUND") {
        setError(`No bank account found for ${userEmail}. Please open an account first.`);
        return; // STOP here. Do not let them into the dashboard!
      }

      // 5. SUCCESS! Route the data to the dashboard
      // If Java returned a List[], save it directly. If it returned one account {}, wrap it in an array [].
      if (Array.isArray(data)) {
        if (data.length === 0) {
          setError(`No bank accounts linked to ${userEmail}.`);
          return;
        }
        setAccountData(data);
      } else {
        setAccountData([data]);
      }

      // 6. Open the gates
      setActiveTab('accounts');
      setIsLoggedIn(true);
      setShowAuthModal(false);

    } catch (err) {
      console.error(err);
      setError("Authentication failed. Ensure your Spring Boot server is running.");
    }
  };

  // Use mock data instead of fetch calls
  const mockAccounts = [
    {
      id: 'acc1',
      name: 'Aditya Bhore',
      type: 'SAVINGS',
      number: '402931000420',
      maskedNumber: '•••• 0420',
      balance: 1250000.00,
      pin: '1234', // simulated correct PIN
      transactions: [
        { id: 't1', date: '2026-04-09', desc: 'Wire Transfer - Global Tech Infr.', amount: -45000 },
        { id: 't2', date: '2026-04-08', desc: 'Direct Deposit - CORE WEALTH', amount: 320000 },
        { id: 't3', date: '2026-04-05', desc: 'ATM Withdrawal', amount: -10000 }
      ]
    },
    {
      id: 'acc2',
      name: 'Aditya Bhore',
      type: 'CHECKING',
      number: '402931009988',
      maskedNumber: '•••• 9988',
      balance: 45000.50,
      pin: '1234',
      transactions: [
        { id: 't4', date: '2026-04-10', desc: 'Coffee Shop - Onyx', amount: -450 },
        { id: 't5', date: '2026-04-02', desc: 'Online Shopping', amount: -12500 }
      ]
    }
  ];

  const handleUnlockSubmit = async (e) => {
    e.preventDefault();
    setPinError('');

    try {
      const response = await fetch('http://localhost:8080/api/accounts/auth/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accNum: pinModalOpenFor, pin: parseInt(pinInput) })
      });
      
      const isUnlocked = await response.json();

      if (isUnlocked) {
        setUnlockedAccounts([...unlockedAccounts, pinModalOpenFor]);
        setPinModalOpenFor(null);
        setPinInput('');
      } else {
        setPinError('Access Denied: Invalid Security PIN.');
      }
    } catch (err) {
      setPinError('Server error. Could not verify PIN.');
    }
  };

  const handleLockAccount = (accountId) => {
    setUnlockedAccounts(unlockedAccounts.filter(id => id !== accountId));
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    // Bypass Firebase and use the manually typed email to hit Spring Boot directly
    setError('');
    
    try {
      const response = await fetch('http://localhost:8080/api/accounts/auth/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email })
      });

      const rawText = await response.text();
      let data;
      try { data = JSON.parse(rawText); } catch (e) { data = rawText; }

      if (data === "NO_ACCOUNT_FOUND" || data.status === "NO_ACCOUNT_FOUND") {
        // Allow them inside but with empty array so they can create an account
        setAccountData([]);
      } else if (Array.isArray(data)) {
        setAccountData(data);
      } else {
        setAccountData([data]);
      }

      setShowAuthModal(false);
      setIsLoggedIn(true);
      setActiveTab('accounts');
    } catch (err) {
      console.error(err);
      setError("Server connection failed.");
    }
  };

  const handleOpenAccountSubmit = async (e) => {
    e.preventDefault();
    setCreateAccMessage('');
    try {
      const payload = {
        username: newAccUsername,
        pin: parseInt(newAccPin),
        balance: parseFloat(newAccDeposit),
        accountType: newAccType,
        email: email // From Firebase
      };
      
      const response = await fetch('http://localhost:8080/api/accounts/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const text = await response.text();
      setCreateAccMessage(text);
      
      if (text.includes("Success!")) {
        // Clear form
        setNewAccUsername('');
        setNewAccPin('');
        setNewAccDeposit('');
      }
    } catch (err) {
      setCreateAccMessage('Server error while connecting to Spring Boot.');
    }
  };

  const handleExecuteTransaction = async (e) => {
    e.preventDefault();
    if (!txSourceAcc) {
      setTxStatus('error');
      setTxMessage('Please select an originating account.');
      return;
    }
    setTxStatus('processing');
    setTxMessage('');

    try {
      if (txType === 'TRANSFER') {
        const payload = {
          senderAccNum: txSourceAcc,
          receiverAccNum: parseInt(txDestAcc),
          amount: parseFloat(txAmount),
          pin: parseInt(txPin)
        };
        const response = await fetch('http://localhost:8080/api/accounts/transfer', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const text = await response.text();
        if (text.includes("Success")) {
          setTxStatus('success');
          setTxMessage(text);
        } else {
          setTxStatus('error');
          setTxMessage(text);
        }
      } else {
        // DEPOSIT or WITHDRAW
        const payload = {
          amount: parseFloat(txAmount),
          action: txType,
          pin: parseInt(txPin)
        };
        const response = await fetch(`http://localhost:8080/api/accounts/${txSourceAcc}/transaction`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const text = await response.text();
        if (text.includes("Success")) {
          setTxStatus('success');
          setTxMessage(text);
        } else {
          setTxStatus('error');
          setTxMessage(text);
        }
      }
    } catch (err) {
      setTxStatus('error');
      setTxMessage('Network error. Transaction aborted.');
    }
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

              {error && <div style={{ color: '#D32F2F', fontSize: '14px', marginBottom: '20px', textAlign: 'center', backgroundColor: '#FFEBEE', padding: '10px', borderRadius: '4px', border: '1px solid #FFCDD2' }}>{error}</div>}

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
                onClick={handleLogin}
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
      {/* PIN Unlock Modal */}
      {pinModalOpenFor && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(43, 27, 23, 0.85)', zIndex: 2000, display: 'flex', justifyContent: 'center', alignItems: 'center', animation: 'fadeIn 0.2s' }}>
          <div style={{ backgroundColor: theme.cardWhite, padding: '40px', borderRadius: '12px', width: '100%', maxWidth: '350px', boxShadow: '0 20px 40px rgba(0,0,0,0.3)', position: 'relative' }}>
            <button
              onClick={() => { setPinModalOpenFor(null); setPinInput(''); setPinError(''); }}
              style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: theme.textLight, transition: '0.2s' }}
              onMouseOver={(e) => e.target.style.color = theme.darkBrown}
              onMouseOut={(e) => e.target.style.color = theme.textLight}
            >
              ✕
            </button>
            <h3 style={{ textAlign: 'center', color: theme.darkBrown, marginTop: 0, marginBottom: '10px', fontSize: '22px', fontWeight: '500' }}>Unlock Account</h3>
            <p style={{ textAlign: 'center', color: theme.textLight, fontSize: '14px', marginBottom: '30px' }}>Enter your 4-digit PIN to securely view balances and history.</p>

            <form onSubmit={handleUnlockSubmit}>
              {pinError && <div style={{ color: '#D32F2F', fontSize: '13px', marginBottom: '15px', textAlign: 'center' }}>{pinError}</div>}
              <input
                type="password"
                maxLength="4"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                required
                style={{ width: '100%', padding: '16px', boxSizing: 'border-box', border: `1px solid ${theme.borderLight}`, borderRadius: '6px', fontSize: '24px', letterSpacing: '10px', textAlign: 'center', outline: 'none', marginBottom: '20px' }}
                onFocus={(e) => e.target.style.borderColor = theme.darkBrown}
                onBlur={(e) => e.target.style.borderColor = theme.borderLight}
                placeholder="••••"
              />
              <button
                type="submit"
                style={{ width: '100%', padding: '15px', backgroundColor: theme.darkBrown, color: 'white', border: 'none', borderRadius: '6px', fontSize: '16px', fontWeight: '600', cursor: 'pointer', transition: 'background-color 0.2s', letterSpacing: '0.5px' }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#1A100E'}
                onMouseOut={(e) => e.target.style.backgroundColor = theme.darkBrown}
              >
                Authenticate
              </button>
            </form>
          </div>
        </div>
      )}

      {/* OPEN ACCOUNT MODAL */}
      {openAccountModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(43, 27, 23, 0.85)', zIndex: 2000, display: 'flex', justifyContent: 'center', alignItems: 'center', animation: 'fadeIn 0.2s' }}>
          <div style={{ backgroundColor: theme.cardWhite, padding: '40px', borderRadius: '12px', width: '100%', maxWidth: '400px', boxShadow: '0 20px 40px rgba(0,0,0,0.3)', position: 'relative' }}>
            <button
               onClick={() => { setOpenAccountModal(false); setCreateAccMessage(''); }}
               style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: theme.textLight }}
            >✕</button>
            <h3 style={{ textAlign: 'center', color: theme.darkBrown, marginTop: 0, marginBottom: '10px', fontSize: '22px', fontWeight: '500' }}>Open Wealth Account</h3>
            
            <form onSubmit={handleOpenAccountSubmit}>
              {createAccMessage && <div style={{ color: createAccMessage.includes("Success!") ? theme.forestGreen : '#D32F2F', fontSize: '14px', marginBottom: '15px', textAlign: 'center', fontWeight: 'bold' }}>{createAccMessage}</div>}
              
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: theme.textLight, marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '1px' }}>Account Type</label>
                <select value={newAccType} onChange={(e) => setNewAccType(e.target.value)} style={{ width: '100%', padding: '12px', border: `1px solid ${theme.borderLight}`, borderRadius: '6px', fontSize: '15px', outline: 'none' }}>
                  <option value="SAVINGS">Savings Account (4.5% APY)</option>
                  <option value="CREDIT">Credit Line (Max Swipe 100k)</option>
                </select>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: theme.textLight, marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '1px' }}>Account Holder Name</label>
                <input type="text" value={newAccUsername} onChange={(e) => setNewAccUsername(e.target.value)} required style={{ width: '100%', padding: '12px', border: `1px solid ${theme.borderLight}`, borderRadius: '6px', fontSize: '15px' }} placeholder="Your Name" />
              </div>
              
              <div style={{ marginBottom: '15px', display: 'flex', gap: '15px' }}>
                 <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '12px', color: theme.textLight, marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '1px' }}>Initial Deposit (₹)</label>
                    <input type="number" min="0" step="0.01" value={newAccDeposit} onChange={(e) => setNewAccDeposit(e.target.value)} required style={{ width: '100%', padding: '12px', border: `1px solid ${theme.borderLight}`, borderRadius: '6px', fontSize: '15px' }} placeholder="50000" />
                 </div>
                 <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '12px', color: theme.textLight, marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '1px' }}>Secure PIN</label>
                    <input type="password" maxLength="4" value={newAccPin} onChange={(e) => setNewAccPin(e.target.value.replace(/\D/g, ''))} required style={{ width: '100%', padding: '12px', border: `1px solid ${theme.borderLight}`, borderRadius: '6px', fontSize: '15px', letterSpacing: '4px' }} placeholder="••••" />
                 </div>
              </div>

              <button type="submit" style={{ width: '100%', padding: '15px', backgroundColor: theme.darkBrown, color: 'white', border: 'none', borderRadius: '6px', fontSize: '16px', fontWeight: '600', cursor: 'pointer', transition: '0.2s', marginTop: '10px' }}>
                 Instantiate Portfolio
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Define inline keyframes */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* 1. TOP NAVIGATION BAR */}
      <nav style={{ backgroundColor: theme.darkBrown, padding: '20px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        <h1
          style={{ margin: 0, fontSize: '24px', letterSpacing: '1px', fontWeight: '300', cursor: 'pointer' }}
          onClick={() => { setIsLoggedIn(false); setActiveTab('accounts'); setUnlockedAccounts([]); }}
        >
          <strong style={{ fontWeight: '700' }}>CORE</strong> WEALTH
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ fontSize: '14px', color: theme.bronze }}>Secure Banking Portal</div>
          <button
            onClick={() => { setIsLoggedIn(false); setActiveTab('accounts'); setUnlockedAccounts([]); }}
            style={{ background: 'transparent', border: `1px solid ${theme.bronze}`, color: theme.bronze, padding: '6px 16px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', transition: '0.2s', textTransform: 'uppercase', letterSpacing: '0.5px' }}
            onMouseOver={(e) => { e.target.style.backgroundColor = theme.bronze; e.target.style.color = 'white'; }}
            onMouseOut={(e) => { e.target.style.backgroundColor = 'transparent'; e.target.style.color = theme.bronze; }}
          >
            Sign Out
          </button>
        </div>
      </nav>

      {/* 2. AXIS-STYLE SUB-MENU (The Tab Switcher) */}
      <div style={{ backgroundColor: theme.cardWhite, borderBottom: '1px solid #E0E0E0', display: 'flex', justifyContent: 'center', gap: '40px', padding: '15px 0', position: 'sticky', top: 0, zIndex: 100 }}>
        {['accounts', 'transact & transfer', 'loans'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              background: 'none', border: 'none', fontSize: '15px', fontWeight: activeTab === tab ? '600' : '400',
              color: activeTab === tab ? theme.darkBrown : theme.textLight, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '1px',
              borderBottom: activeTab === tab ? `3px solid ${theme.darkBrown}` : '3px solid transparent', paddingBottom: '8px', transition: 'all 0.2s'
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* 3. MAIN CONTENT AREA */}
      <main style={{ maxWidth: '1150px', margin: '50px auto', padding: '0 20px' }}>

        {/* --- TAB: ACCOUNTS --- */}
        {activeTab === 'accounts' && (
          <div style={{ animation: 'fadeIn 0.5s', display: 'flex', gap: '40px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
            
            {/* LEFT COLUMN (PORTFOLIO LIST) */}
            <div style={{ flex: '1 1 650px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '30px' }}>
                <h2 style={{ color: theme.darkBrown, fontWeight: '300', margin: 0, fontSize: '32px' }}>Your Portfolio</h2>
                <span style={{ color: theme.textLight, fontSize: '14px' }}>{accountData ? accountData.length : 0} Accounts Found</span>
              </div>

              <div style={{ display: 'grid', gap: '24px' }}>
              {accountData && accountData.map((account, index) => {
                const isUnlocked = unlockedAccounts.includes(account.accnum);

                return (
                  <div key={account.accnum} style={{ backgroundColor: theme.cardWhite, border: `1px solid ${theme.borderLight}`, borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', overflow: 'hidden', transition: 'all 0.3s' }}>
                    {/* Header (Public) */}
                    <div style={{ padding: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: isUnlocked ? `1px solid ${theme.borderLight}` : 'none' }}>
                      <div>
                        <div style={{ fontSize: '12px', color: theme.textLight, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '8px', fontWeight: 'bold' }}>{account.account_type || "ACCOUNT"}</div>
                        <h3 style={{ margin: '0 0 5px 0', color: theme.darkBrown, fontSize: '24px', fontWeight: '500' }}>{account.username}</h3>
                        <div style={{ color: '#666', fontFamily: 'monospace', fontSize: '16px', letterSpacing: '1px' }}>•••• {String(account.accnum).slice(-4)}</div>
                      </div>

                      {!isUnlocked ? (
                        <button
                          onClick={() => setPinModalOpenFor(account.accnum)}
                          style={{ backgroundColor: 'transparent', border: `1px solid ${theme.bronze}`, color: theme.darkBrown, padding: '12px 24px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', fontWeight: '600', transition: 'all 0.2s' }}
                          onMouseOver={(e) => { e.currentTarget.style.backgroundColor = theme.bronze; e.currentTarget.style.color = 'white'; }}
                          onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = theme.darkBrown; }}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6zm9 14H6V10h12v10zm-6-3c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z" /></svg>
                          View Balance & History
                        </button>
                      ) : (
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ color: theme.textLight, margin: '0 0 5px 0', fontSize: '14px' }}>Available Balance</p>
                          <h2 style={{ margin: 0, color: theme.forestGreen, fontSize: '36px', fontWeight: '300' }}>₹{account.balance ? account.balance.toLocaleString() : 0}</h2>
                          <button
                            onClick={() => handleLockAccount(account.accnum)}
                            style={{ background: 'none', border: 'none', color: theme.textLight, fontSize: '12px', cursor: 'pointer', textDecoration: 'underline', marginTop: '10px', padding: 0 }}
                          >
                            Lock Account
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Expanded History View (Private) */}
                    {isUnlocked && (
                      <div style={{ backgroundColor: '#FAFAFA', padding: '30px', animation: 'fadeIn 0.4s' }}>
                        <h4 style={{ color: theme.darkBrown, marginTop: 0, marginBottom: '20px', fontSize: '16px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>Recent Transactions</h4>

                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                          <tbody>
                            {account.transactions && account.transactions.length > 0 ? account.transactions.map((tx, idx) => (
                              <tr key={tx.id || idx} style={{ borderBottom: idx !== account.transactions.length - 1 ? `1px solid ${theme.borderLight}` : 'none' }}>
                                <td style={{ padding: '16px 0', color: theme.textLight, width: '120px' }}>{tx.date || "N/A"}</td>
                                <td style={{ padding: '16px 0', color: theme.darkBrown, fontWeight: '500' }}>{tx.desc || "Transaction"}</td>
                                <td style={{ padding: '16px 0', textAlign: 'right', color: tx.amount > 0 ? theme.forestGreen : theme.darkBrown, fontWeight: '600' }}>
                                  {tx.amount > 0 ? '+' : ''}{tx.amount ? tx.amount.toLocaleString() : "0"}
                                </td>
                              </tr>
                            )) : (
                              <tr>
                                <td colSpan="3" style={{ padding: '16px 0', color: theme.textLight, textAlign: 'center' }}>No recent transaction history recorded.</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT COLUMN (SIDEBAR) */}
          <div style={{ flex: '0 1 350px', display: 'flex', flexDirection: 'column', gap: '30px' }}>
              
            {/* WIDGET 1: Wealth Concierge */}
            <div style={{ backgroundColor: theme.cardWhite, padding: '24px', borderRadius: '8px', border: `1px solid ${theme.borderLight}`, boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
              <h4 style={{ color: theme.darkBrown, margin: '0 0 20px 0', fontSize: '16px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>Wealth Concierge</h4>
              
              <button onClick={() => setOpenAccountModal(true)} style={{ width: '100%', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: 'transparent', border: `1px solid ${theme.borderLight}`, borderRadius: '6px', color: theme.darkBrown, fontSize: '14px', fontWeight: '500', cursor: 'pointer', transition: 'all 0.2s', marginBottom: '10px' }} onMouseOver={(e) => { e.currentTarget.style.backgroundColor = theme.bgWhite; e.currentTarget.style.borderColor = theme.bronze; }} onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.borderColor = theme.borderLight; }}>
                <span style={{color: theme.bronze, fontSize: '18px'}}>✛</span> Open New Account
              </button>
              
              <button style={{ width: '100%', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: 'transparent', border: `1px solid ${theme.borderLight}`, borderRadius: '6px', color: theme.darkBrown, fontSize: '14px', fontWeight: '500', cursor: 'pointer', transition: 'all 0.2s', marginBottom: '10px' }} onMouseOver={(e) => { e.currentTarget.style.backgroundColor = theme.bgWhite; e.currentTarget.style.borderColor = theme.bronze; }} onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.borderColor = theme.borderLight; }}>
                <span style={{color: theme.bronze, fontSize: '18px'}}>⎘</span> Link External Vault
              </button>
              
              <button style={{ width: '100%', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: 'transparent', border: `1px solid ${theme.borderLight}`, borderRadius: '6px', color: theme.darkBrown, fontSize: '14px', fontWeight: '500', cursor: 'pointer', transition: 'all 0.2s', marginBottom: '10px' }} onMouseOver={(e) => { e.currentTarget.style.backgroundColor = theme.bgWhite; e.currentTarget.style.borderColor = theme.bronze; }} onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.borderColor = theme.borderLight; }}>
                <span style={{color: theme.bronze, fontSize: '18px'}}>✈</span> Request Wire Transfer
              </button>
              
              <button style={{ width: '100%', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: theme.darkBrown, border: `1px solid ${theme.darkBrown}`, borderRadius: '6px', color: 'white', fontSize: '14px', fontWeight: '500', cursor: 'pointer', transition: 'all 0.2s' }} onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#1A100E'; }} onMouseOut={(e) => { e.currentTarget.style.backgroundColor = theme.darkBrown; }}>
                <span style={{color: theme.bronze, fontSize: '18px'}}>💬</span> Contact Advisor
              </button>
            </div>

            {/* WIDGET 2: Locked Allocation Chart */}
            <div style={{ backgroundColor: theme.cardWhite, padding: '24px', borderRadius: '8px', border: `1px solid ${theme.borderLight}`, boxShadow: '0 4px 15px rgba(0,0,0,0.02)', position: 'relative' }}>
              <h4 style={{ color: theme.darkBrown, margin: '0 0 10px 0', fontSize: '16px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>Asset Allocation</h4>
              <p style={{ color: theme.textLight, fontSize: '13px', margin: '0 0 20px 0' }}>Overall Portfolio Distribution</p>
              
              <div style={{ position: 'relative', width: '180px', height: '180px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {/* CSS Conic Gradient to mock a Donut Chart perfectly */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: '50%', background: `conic-gradient(${theme.forestGreen} 0% 35%, ${theme.bronze} 35% 60%, ${theme.darkBrown} 60% 100%)`, filter: 'blur(5px)', opacity: 0.8, WebkitMaskImage: 'radial-gradient(circle, transparent 55%, black 56%)', maskImage: 'radial-gradient(circle, transparent 55%, black 56%)' }}></div>
                
                {/* Secure Lock Overlay Overlay */}
                <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ backgroundColor: 'rgba(255,255,255,0.95)', padding: '12px', borderRadius: '50%', marginBottom: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill={theme.darkBrown}><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6zm9 14H6V10h12v10zm-6-3c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z"/></svg>
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: 'bold', color: theme.darkBrown, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Unlock Accounts</span>
                </div>
              </div>
            </div>

            {/* WIDGET 3: Market Intelligence */}
            <div style={{ backgroundColor: theme.bgWhite, padding: '24px', borderRadius: '8px', border: `1px solid ${theme.borderLight}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h4 style={{ color: theme.darkBrown, margin: 0, fontSize: '16px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>Global Insights</h4>
                <div style={{ width: '8px', height: '8px', backgroundColor: theme.forestGreen, borderRadius: '50%', boxShadow: `0 0 8px ${theme.forestGreen}` }}></div>
              </div>
              
              <div style={{ borderBottom: `1px solid ${theme.borderLight}`, paddingBottom: '16px', marginBottom: '16px', cursor: 'pointer' }} onMouseOver={(e) => e.currentTarget.querySelector('h5').style.color = theme.bronze} onMouseOut={(e) => e.currentTarget.querySelector('h5').style.color = theme.darkBrown}>
                <span style={{ fontSize: '11px', color: theme.textLight, textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>Equities • 2H Ago</span>
                <h5 style={{ margin: '6px 0', fontSize: '14px', color: theme.darkBrown, transition: 'color 0.2s' }}>Algorithmic Trading Strategies for Q3 Tech Rallies</h5>
              </div>

              <div style={{ cursor: 'pointer' }} onMouseOver={(e) => e.currentTarget.querySelector('h5').style.color = theme.bronze} onMouseOut={(e) => e.currentTarget.querySelector('h5').style.color = theme.darkBrown}>
                <span style={{ fontSize: '11px', color: theme.textLight, textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>Macro • Today</span>
                <h5 style={{ margin: '6px 0', fontSize: '14px', color: theme.darkBrown, transition: 'color 0.2s' }}>Federal Reserve Outlines Potential 2026 Rate Cuts</h5>
              </div>
            </div>

          </div>
        </div>
        )}

        {/* --- TAB: TRANSACT & TRANSFER --- */}
        {activeTab === 'transact & transfer' && (
          <div style={{ animation: 'fadeIn 0.5s' }}>
            <h2 style={{ color: theme.darkBrown, fontWeight: '300', marginBottom: '30px', fontSize: '32px' }}>Move Capital</h2>
            
            {txStatus === 'success' ? (
              <div style={{ backgroundColor: theme.cardWhite, padding: '60px 40px', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', borderTop: `4px solid ${theme.forestGreen}`, textAlign: 'center', animation: 'fadeIn 0.5s' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#E8F5E9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto' }}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill={theme.forestGreen}><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                </div>
                <h3 style={{ color: theme.darkBrown, fontSize: '28px', marginBottom: '10px' }}>Transaction Executed</h3>
                <p style={{ color: theme.textLight, fontSize: '16px', marginBottom: '40px' }}>{txMessage}</p>
                <button onClick={() => { setTxStatus(null); setTxAmount(''); setTxPin(''); setTxDestAcc(''); }} style={{ backgroundColor: 'transparent', border: `1px solid ${theme.bronze}`, color: theme.darkBrown, padding: '12px 30px', borderRadius: '4px', cursor: 'pointer', fontWeight: '600', fontSize: '15px', transition: 'all 0.2s' }} onMouseOver={(e) => { e.currentTarget.style.backgroundColor = theme.bronze; e.currentTarget.style.color = 'white'; }} onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = theme.darkBrown; }}>
                  Execute Another Protocol
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '40px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                
                {/* LEFT: EXECUTION TERMINAL */}
                <div style={{ flex: '1 1 600px', backgroundColor: theme.cardWhite, padding: '40px', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', border: `1px solid ${theme.borderLight}` }}>
                  
                  {/* Action Selection Segmented Control */}
                  <div style={{ display: 'flex', backgroundColor: theme.bgWhite, borderRadius: '8px', padding: '6px', marginBottom: '40px', border: `1px solid ${theme.borderLight}` }}>
                    {['DEPOSIT', 'WITHDRAW', 'TRANSFER'].map(type => (
                      <button key={type} type="button" onClick={() => setTxType(type)} style={{ flex: 1, padding: '14px', borderRadius: '6px', border: 'none', backgroundColor: txType === type ? 'white' : 'transparent', color: txType === type ? theme.darkBrown : theme.textLight, fontWeight: txType === type ? 'bold' : '500', fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s', boxShadow: txType === type ? '0 2px 8px rgba(0,0,0,0.05)' : 'none', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        {type}
                      </button>
                    ))}
                  </div>

                  <form onSubmit={handleExecuteTransaction}>
                    {/* Source Account Selection */}
                    <div style={{ marginBottom: '40px' }}>
                      <label style={{ display: 'block', fontSize: '12px', color: theme.textLight, marginBottom: '15px', textTransform: 'uppercase', letterSpacing: '1px' }}>Originating Account</label>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                        {accountData && accountData.map(acc => (
                          <div key={acc.accnum} onClick={() => setTxSourceAcc(acc.accnum)} style={{ padding: '20px', border: `2px solid ${txSourceAcc === acc.accnum ? theme.bronze : theme.borderLight}`, borderRadius: '8px', cursor: 'pointer', backgroundColor: txSourceAcc === acc.accnum ? '#FAFAFA' : 'white', transition: 'all 0.2s' }}>
                            <div style={{ fontSize: '11px', color: theme.textLight, fontWeight: 'bold', marginBottom: '5px' }}>{acc.account_type || "ACCOUNT"}</div>
                            <div style={{ fontSize: '18px', color: theme.darkBrown, fontFamily: 'monospace' }}>•••• {String(acc.accnum).slice(-4)}</div>
                            <div style={{ fontSize: '13px', color: theme.forestGreen, marginTop: '8px', fontWeight: '500' }}>₹{acc.balance ? acc.balance.toLocaleString() : 0}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Destination Account (Only for TRANSFER) */}
                    {txType === 'TRANSFER' && (
                      <div style={{ marginBottom: '40px', animation: 'fadeIn 0.3s' }}>
                        <label style={{ display: 'block', fontSize: '12px', color: theme.textLight, marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>Destination Routing / Account (A/C)</label>
                        <input type="number" value={txDestAcc} onChange={(e) => setTxDestAcc(e.target.value.replace(/\D/g, ''))} required placeholder="e.g. 402931009988" style={{ width: '100%', padding: '16px', boxSizing: 'border-box', border: `1px solid ${theme.borderLight}`, borderRadius: '6px', fontSize: '18px', fontFamily: 'monospace', outline: 'none' }} onFocus={(e) => e.target.style.borderColor = theme.darkBrown} onBlur={(e) => e.target.style.borderColor = theme.borderLight} />
                      </div>
                    )}

                    {/* The Hero Amount Input */}
                    <div style={{ marginBottom: '40px', textAlign: 'center' }}>
                      <label style={{ display: 'block', fontSize: '12px', color: theme.textLight, marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '1px' }}>Execution Amount (₹)</label>
                      <input type="number" min="1" step="1" value={txAmount} onChange={(e) => setTxAmount(e.target.value)} required placeholder="0" style={{ width: '100%', boxSizing: 'border-box', textAlign: 'center', border: 'none', borderBottom: `2px solid ${theme.borderLight}`, fontSize: '56px', fontWeight: '300', color: theme.darkBrown, paddingBottom: '10px', outline: 'none', background: 'transparent' }} onFocus={(e) => e.target.style.borderColor = theme.bronze} onBlur={(e) => e.target.style.borderColor = theme.borderLight} />
                    </div>

                    {/* Authorization Gate */}
                    <div style={{ borderTop: `1px solid ${theme.borderLight}`, paddingTop: '30px', marginTop: '20px' }}>
                      <label style={{ display: 'block', fontSize: '12px', color: theme.textLight, marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '1px', textAlign: 'center' }}>Authorization PIN required</label>
                      <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', alignItems: 'center' }}>
                        <input type="password" maxLength="4" required value={txPin} onChange={(e) => setTxPin(e.target.value.replace(/\D/g, ''))} placeholder="••••" style={{ width: '120px', padding: '15px', textAlign: 'center', border: `1px solid ${theme.borderLight}`, borderRadius: '6px', fontSize: '20px', letterSpacing: '8px', outline: 'none' }} onFocus={(e) => e.target.style.borderColor = theme.darkBrown} onBlur={(e) => e.target.style.borderColor = theme.borderLight} />
                        <button type="submit" disabled={txStatus === 'processing'} style={{ padding: '16px 40px', backgroundColor: txStatus === 'processing' ? '#ccc' : theme.darkBrown, color: 'white', border: 'none', borderRadius: '6px', fontSize: '16px', fontWeight: '600', cursor: txStatus === 'processing' ? 'not-allowed' : 'pointer', transition: '0.2s', letterSpacing: '1px' }}>
                          Authorize
                        </button>
                      </div>
                      {txStatus === 'error' && <p style={{ color: '#D32F2F', textAlign: 'center', fontSize: '13px', marginTop: '15px', fontWeight: 'bold' }}>{txMessage}</p>}
                    </div>
                  </form>
                </div>

                {/* RIGHT: PROTOCOL SIDEBAR */}
                <div style={{ flex: '0 1 350px' }}>
                  <div style={{ backgroundColor: theme.bgWhite, padding: '30px', borderRadius: '8px', border: `1px solid ${theme.borderLight}` }}>
                    <h4 style={{ color: theme.darkBrown, margin: '0 0 20px 0', fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: `1px solid ${theme.borderLight}`, paddingBottom: '10px' }}>Security Protocol</h4>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
                      <div style={{ width: '30px', height: '30px', borderRadius: '50%', backgroundColor: theme.cardWhite, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${theme.bronze}`, fontSize: '14px', color: theme.bronze }}>✓</div>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 'bold', color: theme.darkBrown }}>AES-256 Encrypted</div>
                        <div style={{ fontSize: '11px', color: theme.textLight }}>Bank-grade secure tunnel</div>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
                      <div style={{ width: '30px', height: '30px', borderRadius: '50%', backgroundColor: theme.cardWhite, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${theme.bronze}`, fontSize: '14px', color: theme.bronze }}>✓</div>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 'bold', color: theme.darkBrown }}>Zero Latency Network</div>
                        <div style={{ fontSize: '11px', color: theme.textLight }}>Real-time PostgreSQL sync</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px' }}>
                      <div style={{ width: '30px', height: '30px', borderRadius: '50%', backgroundColor: theme.cardWhite, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${theme.bronze}`, fontSize: '14px', color: theme.bronze }}>✓</div>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 'bold', color: theme.darkBrown }}>Authenticated Origin</div>
                        <div style={{ fontSize: '11px', color: theme.textLight }}>{email || "Verified Member"}</div>
                      </div>
                    </div>

                    <div style={{ backgroundColor: theme.cardWhite, padding: '20px', borderRadius: '6px', border: `1px dashed ${theme.borderLight}` }}>
                      <div style={{ fontSize: '10px', color: theme.textLight, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>Transaction Profile</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                         <span style={{ fontSize: '13px', color: theme.textLight }}>Action</span>
                         <span style={{ fontSize: '13px', fontWeight: 'bold', color: theme.darkBrown }}>{txType}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                         <span style={{ fontSize: '13px', color: theme.textLight }}>Principal Amount</span>
                         <span style={{ fontSize: '13px', fontWeight: 'bold', color: theme.forestGreen }}>{txAmount ? `₹${parseFloat(txAmount).toLocaleString()}` : '--'}</span>
                      </div>
                      {txType === 'TRANSFER' && (
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                           <span style={{ fontSize: '13px', color: theme.textLight }}>Target Node</span>
                           <span style={{ fontSize: '13px', fontWeight: 'bold', color: theme.darkBrown, fontFamily: 'monospace' }}>{txDestAcc ? `...${txDestAcc.slice(-4)}` : '--'}</span>
                        </div>
                      )}
                    </div>

                  </div>
                </div>

              </div>
            )}
          </div>
        )}

        {/* --- TAB: LOANS --- */}
        {activeTab === 'loans' && (
          <div style={{ animation: 'fadeIn 0.5s' }}>
            <h2 style={{ color: theme.darkBrown, fontWeight: '300', marginBottom: '30px', fontSize: '32px' }}>Credit & Lending</h2>
            <div style={{ backgroundColor: theme.cardWhite, padding: '40px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderTop: `4px solid ${theme.darkBrown}` }}>
              <p style={{ color: theme.textLight, margin: 0 }}>UI for loan applications and active credit lines will go here.</p>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

export default App;