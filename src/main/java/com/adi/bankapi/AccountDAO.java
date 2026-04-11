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
                        accountList.add(new Saving_acc(dbAccNum, dbUsername, dbHashedPin, dbBalance, dbInterestRate,
                                email));

                    } else if ("CREDIT".equals(type)) {
                        double dbInterestRate = rs.getDouble("interest_rate");
                        int dbLimit = rs.getInt("transaction_limit");
                        accountList.add(new Credit_acc(dbAccNum, dbUsername, dbHashedPin, dbBalance, dbInterestRate,
                                dbLimit, email));
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
                    // NOTE: If your hashPin method is inside the Accounts class,
                    // you might need to call Accounts.hashPin(String.valueOf(pin)) depending on
                    // your setup.
                    // For now, if you are testing with dummy data, you can temporarily hardcode the
                    // check:

                    String inputHashed = String.valueOf(pin);

                    // IF YOU HAVE A HASH METHOD, use this instead:
                    // String inputHashed = hashPin(String.valueOf(pin));

                    // 3. Compare them!
                    // (Change this to dbHashedPin.equals(inputHashed) when your real hashing is
                    // wired up)
                    if (dbHashedPin.equals("dummy_hashed_pin_123") || dbHashedPin.equals(inputHashed)) {
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
}
