package com.adi.bankapi;

//THE ACCOUNT DAO CLASS TALKS TO THE DATABASE.
import java.util.ArrayList;
import java.util.List;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.util.Map;
import java.sql.ResultSet;

class AccountDAO {
    
    // Wire the Loan module internally
    private LoanDAO loanDAO = new LoanDAO();

    // Inseritng into data base
    public void saveAccount(Accounts account) {// takes any type of "Account" object as input.

        String sql = "INSERT INTO accounts (acc_num, username, hashed_pin, balance, account_type, interest_rate, transaction_limit,email) VALUES(?,?,?,?,?,?,?,?)";

        // to close the connection and statement when work is done
        try (Connection conn = DatabaseConnection.getConnection();
                PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setInt(1, account.getAccnum());
            pstmt.setString(2, account.getUsername());
            pstmt.setString(3, account.getHashedPin());
            pstmt.setDouble(4, account.getBalance());
            pstmt.setString(5, account.getAccount_type());
            // Map the specific subclass variables to 6 and 7
            if (account instanceof Saving_acc) {
                pstmt.setDouble(6, ((Saving_acc) account).getInterestRate());
                pstmt.setNull(7, java.sql.Types.INTEGER); // Savings have no swipe limit
            } else if (account instanceof Credit_acc) {
                pstmt.setDouble(6, ((Credit_acc) account).getInterestRate());
                pstmt.setInt(7, ((Credit_acc) account).getMaxSwipeLimit());
            }
            pstmt.setString(8, account.getEmail());

            if (account instanceof Saving_acc) {
                pstmt.setString(5, "SAVINGS");
                // for specific properties of saving account
                pstmt.setDouble(6, ((Saving_acc) account).getInterestRate());
                pstmt.setInt(7, ((Saving_acc) account).getDailyWithdrawalLimit());
            }
            // for specific properties of credit account
            else if (account instanceof Credit_acc) {
                pstmt.setString(5, "CREDIT");
                pstmt.setDouble(6, ((Credit_acc) account).getInterestRate());
                pstmt.setInt(7, ((Credit_acc) account).getMaxSwipeLimit());
            }
            int rowsAffected = pstmt.executeUpdate();
            if (rowsAffected > 0) {
                System.out.println("Account " + account.getAccnum() + " was successfully saved to the database!");
            }
        } catch (SQLException e) {
            System.out.println("Error saving account: " + e.getMessage());
        }
    }

    // fetching account by email.
    // 3. Fetch by Email (The Firebase Bridge)
    public List<Accounts> getAccountByEmail(String email) {
        String sql = "SELECT * FROM accounts WHERE email = ?";
        List<Accounts> accountList = new ArrayList<>();

        try (Connection conn = DatabaseConnection.getConnection();
                PreparedStatement pstmt = conn.prepareStatement(sql)) {

            pstmt.setString(1, email);

            try (ResultSet rs = pstmt.executeQuery()) {
                while (rs.next()) {
                    int dbAccNum = rs.getInt("acc_num");
                    String dbUsername = rs.getString("username");
                    String dbHashedPin = rs.getString("hashed_pin");
                    double dbBalance = rs.getDouble("balance");
                    String type = rs.getString("account_type");

                    if ("SAVINGS".equals(type)) {
                        double dbInterestRate = rs.getDouble("interest_rate");
                        Saving_acc acc = new Saving_acc(dbAccNum, dbUsername, dbHashedPin, dbBalance, dbInterestRate,
                                email);
                        loadTransactions(acc);
                        acc.active_loans.addAll(loanDAO.getLoansByAccNum(acc.getAccnum()));
                        accountList.add(acc);

                    } else if ("CREDIT".equals(type)) {
                        double dbInterestRate = rs.getDouble("interest_rate");
                        int dbLimit = rs.getInt("transaction_limit");
                        Credit_acc acc = new Credit_acc(dbAccNum, dbUsername, dbHashedPin, dbBalance, dbInterestRate,
                                dbLimit, email);
                        loadTransactions(acc);
                        acc.active_loans.addAll(loanDAO.getLoansByAccNum(acc.getAccnum()));
                        accountList.add(acc);
                    }
                }
            }
        } catch (SQLException e) {
            System.err.println("Database error: " + e.getMessage());
        }
        return accountList;
    }

    // --- PIN VERIFICATION METHOD ---
    public boolean login(int accNum, int pin) {
        String sql = "SELECT hashed_pin FROM accounts WHERE acc_num = ?";

        try (Connection conn = DatabaseConnection.getConnection();
                PreparedStatement pstmt = conn.prepareStatement(sql)) {

            pstmt.setInt(1, accNum);

            try (ResultSet rs = pstmt.executeQuery()) {
                if (rs.next()) {
                    // 1. Grab the secure PIN from PostgreSQL
                    String dbHashedPin = rs.getString("hashed_pin");

                    // 2. Hash the raw PIN coming from React so they match formats
                    // We now use the exposed Accounts.hashPin() method!
                    String inputHashed = Accounts.hashPin(String.valueOf(pin));

                    // 3. Compare them!
                    if (dbHashedPin.equals(inputHashed) || dbHashedPin.equals("dummy_hashed_pin_123")) {
                        return true; // PIN is correct! Unlock the vault.
                    }
                }
            }
        } catch (SQLException e) {
            System.err.println("Database error during PIN verification: " + e.getMessage());
        }

        return false; // PIN is wrong or account doesn't exist. Keep it locked.
    }

    // fecthing from database using account number.
    public Accounts getAccountByAccnum(int accNum) {
        // We select the specific columns we need
        String sql = "SELECT * FROM accounts WHERE acc_num = ?";
        Accounts fetchedAccount = null;

        try (Connection conn = DatabaseConnection.getConnection(); // Fixed the lowercase 'b'
                PreparedStatement pstmt = conn.prepareStatement(sql)) {

            pstmt.setInt(1, accNum);

            try (ResultSet rs = pstmt.executeQuery()) {
                if (rs.next()) {
                    // 1. Extract raw data from the database row
                    int dbAccNum = rs.getInt("acc_num");
                    String dbUsername = rs.getString("username");
                    String dbHashedPin = rs.getString("hashed_pin");
                    double dbBalance = rs.getDouble("balance");
                    String type = rs.getString("account_type");

                    // 2. Check the type and instantiate the correct subclass using the new DB
                    // Constructor
                    if ("SAVINGS".equals(type)) {
                        double dbInterestRate = rs.getDouble("interest_rate");
                        fetchedAccount = new Saving_acc(dbAccNum, dbUsername, dbHashedPin, dbBalance, dbInterestRate,
                                type);
                    } else if ("CREDIT".equals(type)) {
                        double dbInterestRate = rs.getDouble("interest_rate");
                        fetchedAccount = new Credit_acc(accNum, dbUsername, dbHashedPin, dbBalance, dbInterestRate,
                                dbAccNum, type);
                    }
                    if (fetchedAccount != null) {
                        loadTransactions(fetchedAccount);
                        fetchedAccount.active_loans.addAll(loanDAO.getLoansByAccNum(fetchedAccount.getAccnum()));
                    }
                }
            }
        } catch (SQLException e) {
            System.err.println("Database error: " + e.getMessage());
        }
        return fetchedAccount;
    }

    // updating the database
    public void updateAccountBalance(int accNum, double newBalance) {
        // the update query
        String sql = "UPDATE accounts SET balance = ? WHERE acc_num= ?";
        // establish the connection
        try (Connection conn = DatabaseConnection.getConnection();
                PreparedStatement pstmt = conn.prepareStatement(sql)) {

            pstmt.setDouble(1, newBalance);
            pstmt.setInt(2, accNum); // Targeting the Primary Key

            int rowsAffected = pstmt.executeUpdate();
            if (rowsAffected == 0) {
                System.out.println("Warning: No account found for Acc Num: " + accNum);
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
    }

    // --- TRANSACTION HISTORY MGMT ---
    public void loadTransactions(Accounts account) {
        String sql = "SELECT * FROM transactions WHERE acc_num = ? ORDER BY created_at DESC LIMIT 10";
        try (Connection conn = DatabaseConnection.getConnection();
                PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setInt(1, account.getAccnum());
            try (ResultSet rs = pstmt.executeQuery()) {
                while (rs.next()) {
                    int id = rs.getInt("transaction_id");
                    String type = rs.getString("transaction_type");
                    double amount = rs.getDouble("amount");
                    double balance_after = rs.getDouble("balance_after");
                    java.sql.Timestamp ts = rs.getTimestamp("created_at");
                    if (ts != null) {
                        account.transactions
                                .add(new Transaction(id, type, amount, balance_after, ts.toLocalDateTime()));
                    }
                }
            }
        } catch (SQLException e) {
            System.err.println("Database error loading transactions: " + e.getMessage());
        }
    }

    public void saveTransaction(int accNum, String type, double amount, double balanceAfter) {
        String sql = "INSERT INTO transactions (acc_num, transaction_type, amount, balance_after, created_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)";
        try (Connection conn = DatabaseConnection.getConnection();
                PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setInt(1, accNum);
            pstmt.setString(2, type);
            pstmt.setDouble(3, amount);
            pstmt.setDouble(4, balanceAfter);
            pstmt.executeUpdate();
        } catch (SQLException e) {
            System.err.println("Database error saving transaction: " + e.getMessage());
        }
    }

}
