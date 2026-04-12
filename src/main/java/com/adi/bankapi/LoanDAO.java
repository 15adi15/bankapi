package com.adi.bankapi;

import org.springframework.stereotype.Repository;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

@Repository
public class LoanDAO {

    // --- SECURE INSERT METHOD ---
    public void saveLoan(int accNum, Loan loan) {
        String sql = "INSERT INTO loans (acc_num, loan_type, principle_amount, interest_rate, tenure_months) VALUES (?, ?, ?, ?, ?)";
        
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            
            // 1. Map to relational PostgreSQL variables
            pstmt.setInt(1, accNum);
            pstmt.setString(2, loan.getLoanType().toUpperCase()); 
            pstmt.setDouble(3, loan.getPrincipleAmount());
            pstmt.setDouble(4, loan.getInterestRate());
            pstmt.setInt(5, loan.getTenure());
            
            // 2. Transact!
            pstmt.executeUpdate();
            System.out.println("CORE WEALTH: " + loan.getLoanType() + " successfully executed and pledged to Database ledger.");
            
        } catch (SQLException e) {
            System.err.println("CRITICAL: Database error saving the loan matrix: " + e.getMessage());
        }
    }

    // --- SECURE FETCH METHOD (DATABASE -> JAVA CLASS MAPPING) ---
    public List<Loan> getLoansByAccNum(int accNum) {
        List<Loan> accountLoans = new ArrayList<>();
        String sql = "SELECT * FROM loans WHERE acc_num = ? ORDER BY created_at DESC";
        
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            
            pstmt.setInt(1, accNum);
            
            try (ResultSet rs = pstmt.executeQuery()) {
                while (rs.next()) {
                    String type = rs.getString("loan_type");
                    double principle = rs.getDouble("principle_amount");
                    int tenure = rs.getInt("tenure_months");
                    double storedInterest = rs.getDouble("interest_rate");
                    
                    Loan fetchedLoan = null;
                    
                    // 1. Safely reconstruct the distinct classes 
                    if ("HOME_LOAN".equals(type)) {
                        fetchedLoan = new Home_Loan("Account Holder", principle, tenure);
                    } else if ("PERSONAL_LOAN".equals(type)) {
                        fetchedLoan = new Personal_Loan("Account Holder", principle, tenure);
                    } else if ("EDUCATION_LOAN".equals(type)) {
                        fetchedLoan = new Education_Loan("Account Holder", principle, tenure);
                    }
                    
                    // 2. Package and inject to the array list
                    if (fetchedLoan != null) {
                        // Normally the constructor overrides the interest rate with the live algorithm. 
                        // If we wanted to lock in the historically stored interest, we would manually inject `storedInterest` right here!
                        accountLoans.add(fetchedLoan);
                    }
                }
            }
        } catch (SQLException e) {
            System.err.println("CRITICAL: Database error fetching associated loans: " + e.getMessage());
        }
        
        return accountLoans;
    }
}
