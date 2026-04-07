import { useState } from 'react';

function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState('dashboard');

  // --- DASHBOARD STATE (From our previous step) ---
  const [accountNumber, setAccountNumber] = useState('');
  const [accountData, setAccountData] = useState(null);
  const [error, setError] = useState('');

  // --- API LOGIC (Fetch) ---
  const fetchAccount = async () => {
    setError('');
    setAccountData(null);
    try {
      const response = await fetch(`http://localhost:8080/api/accounts/${accountNumber}`);
      if (!response.ok) throw new Error("Account not found");
      const data = await response.json();
      setAccountData(data);
    } catch (err) {
      setError("Error: Could not find that account number.");
    }
  };

  // --- PREMIUM UI THEME ---
  const theme = {
    darkBrown: '#2B1B17',
    bronze: '#8D6E63',
    bgWhite: '#F9F8F6',
    cardWhite: '#FFFFFF',
    textLight: '#795548'
  };

  return (
    <div style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif', backgroundColor: theme.bgWhite, minHeight: '100vh', margin: 0, padding: 0 }}>

      {/* 1. TOP NAVIGATION BAR */}
      <nav style={{ backgroundColor: theme.darkBrown, padding: '20px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        <h1 style={{ margin: 0, fontSize: '24px', letterSpacing: '1px', fontWeight: '300' }}>
          <strong style={{ fontWeight: '700' }}>CORE</strong> WEALTH
        </h1>
        <div style={{ fontSize: '14px', color: theme.bronze }}>Secure Banking Portal</div>
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

            <div style={{ display: 'flex', gap: '15px', marginBottom: '30px' }}>
              <input
                type="number"
                placeholder="Enter Account Number"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                style={{ flex: 1, padding: '15px', fontSize: '16px', border: '1px solid #ccc', borderRadius: '4px' }}
              />
              <button onClick={fetchAccount} style={{ padding: '15px 30px', backgroundColor: theme.darkBrown, color: 'white', border: 'none', borderRadius: '4px', fontSize: '16px', cursor: 'pointer' }}>
                Access Vault
              </button>
            </div>

            {error && <div style={{ padding: '15px', backgroundColor: '#ffebee', color: '#c62828', borderRadius: '4px', marginBottom: '20px' }}>{error}</div>}

            {accountData && (
              <div style={{ backgroundColor: theme.cardWhite, padding: '40px', borderRadius: '8px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', borderTop: `4px solid ${theme.bronze}` }}>
                <p style={{ color: theme.textLight, textTransform: 'uppercase', letterSpacing: '1px', fontSize: '12px', margin: 0 }}>Welcome back</p>
                <h1 style={{ color: theme.darkBrown, margin: '5px 0 20px 0', fontSize: '32px' }}>{accountData.username}</h1>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px solid #eee', paddingBottom: '20px' }}>
                  <div>
                    <p style={{ color: theme.textLight, margin: 0, fontSize: '14px' }}>Available Balance</p>
                    <h2 style={{ margin: 0, color: '#2E7D32', fontSize: '42px', fontWeight: '300' }}>₹{accountData.balance.toLocaleString()}</h2>
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