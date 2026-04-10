package com.adi.bankapi;

//THE ACCOUNT DAO CLASS TALKS TO THE DATABASE.
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
    public Accounts getAccountByEmail(String email) {
        String sql = "SELECT * FROM accounts WHERE email = ?";
        Accounts fetchedAccount = null;

        try (Connection conn = DatabaseConnection.getConnection();
                PreparedStatement pstmt = conn.prepareStatement(sql)) {

            pstmt.setString(1, email);

            try (ResultSet rs = pstmt.executeQuery()) {
                if (rs.next()) {
                    int dbAccNum = rs.getInt("acc_num");
                    String dbUsername = rs.getString("username");
                    String dbHashedPin = rs.getString("hashed_pin");
                    double dbBalance = rs.getDouble("balance");
                    String type = rs.getString("account_type");
                    int dbLimit = rs.getInt("transaction_limit");
                    double dbInterestRate = rs.getDouble("interest_rate");

                    if ("SAVINGS".equals(type)) {
                        fetchedAccount = new Saving_acc(dbLimit, dbUsername, dbHashedPin, dbBalance, dbInterestRate,
                                email);
                    } else if ("CREDIT".equals(type)) {
                        fetchedAccount = new Credit_acc(dbAccNum, dbUsername, dbHashedPin, dbBalance, dbInterestRate,
                                dbLimit, email);
                    }
                }
            }
        } catch (SQLException e) {
            System.err.println("Database error: " + e.getMessage());
        }
        return fetchedAccount;
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
