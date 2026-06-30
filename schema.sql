CREATE TABLE IF NOT EXISTS accounts (
    acc_num INTEGER PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    hashed_pin VARCHAR(255) NOT NULL,
    balance DOUBLE PRECISION NOT NULL,
    account_type VARCHAR(50) NOT NULL,
    interest_rate DOUBLE PRECISION NOT NULL,
    transaction_limit INTEGER,
    email VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS transactions (
    transaction_id SERIAL PRIMARY KEY,
    acc_num INTEGER REFERENCES accounts(acc_num),
    transaction_type VARCHAR(50) NOT NULL,
    amount DOUBLE PRECISION NOT NULL,
    balance_after DOUBLE PRECISION NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS loans (
    loan_id SERIAL PRIMARY KEY,
    acc_num INTEGER REFERENCES accounts(acc_num),
    loan_type VARCHAR(50) NOT NULL,
    principle_amount DOUBLE PRECISION NOT NULL,
    interest_rate DOUBLE PRECISION NOT NULL,
    tenure_months INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
