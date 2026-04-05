package com.adi.bankapi;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.sql.ResultSet;

class AccountDAO {
    // Inseritng into data base
    public void saveAccount(Accounts account) {// takes any type of "Account" object as input.

        String sql = "INSERT INTO accounts (acc_num, username, hashed_pin, balance, account_type, interest_rate, transaction_limit) VALUES(?,?,?,?,?,?,?)";

        // to close the connection and statement when work is done
        try (Connection conn = DatabaseConnection.getConnection();
                PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setInt(1, account.getaccnum());
            pstmt.setString(2, account.getUsername());
            pstmt.setString(3, account.getHashedPin());
            pstmt.setDouble(4, account.getBalance());

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
                System.out.println("Account " + account.getaccnum() + " was successfully saved to the database!");
            }
        } catch (SQLException e) {
            System.out.println("Error saving account: " + e.getMessage());
        }
    }

    // fecthing from database
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
                        fetchedAccount = new Saving_acc(dbAccNum, dbUsername, dbHashedPin, dbBalance, dbInterestRate);
                    } else if ("CREDIT".equals(type)) {
                        double dbInterestRate = rs.getDouble("interest_rate");
                        fetchedAccount = new Credit_acc(dbUsername, dbAccNum, dbBalance, dbInterestRate, dbAccNum);
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
