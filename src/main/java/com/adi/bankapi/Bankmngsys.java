package com.adi.bankapi;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

import com.fasterxml.jackson.annotation.JsonIgnore;

//-------------------MAIN CLASS----------------------
public class Bankmngsys {

}

// -------------------BANK CLASS----------------------
class Bank {
    private String Bank_name;
    private String Bank_headquaters;
    private String Bank_owner;

    // Constructor
    public Bank(String Bank_name, String Bank_headquaters, String Bank_owner) {
        this.Bank_headquaters = Bank_headquaters;
        this.Bank_name = Bank_name;
        this.Bank_owner = Bank_owner;
    }

    // Encapsulation(Getter)
    public String getBankdetails() {
        return "Bank Details: " + Bank_name + "," + Bank_headquaters + " |" + Bank_owner;
    }
}

// -------------------BRANCH CLASS-----------------------
class Branch {
    private String Branch_address;
    private int Branch_code;

    // Constructor
    public Branch(String Branch_address, int Branch_code) {
        this.Branch_address = Branch_address;
        this.Branch_code = Branch_code;
    }

    // Getter
    public String getBranchaddress() {
        return Branch_address;
    }

    public int getBranchcode() {
        return Branch_code;
    }
}

// --------------------ACCOUNT CLASS------------------------
abstract class Accounts {
    protected String username;
    private final int acc_num;
    protected double balance;// Protected so that it can be accessed by subclasses only.
    protected String email;
    protected String account_type;
    @JsonIgnore
    private String hashed_pin;
    // A hash set to ensure uniqueness accross all the instances of account number.
    private static Set<Integer> existingAccountNumbers = new HashSet<>();

    // Dynamic list for transaction
    protected List<Transaction> transactions = new ArrayList<>();

    // Non breakable abstract method to set limit for indivisual account types.
    protected abstract boolean checkTransactionLimit(int amount);

    // Constructor to create an Account.
    public Accounts(String username, int acc_pin, double balance, String email) {
        this.username = username;
        this.hashed_pin = hashPin(String.valueOf(acc_pin));
        this.balance = balance;
        this.acc_num = generateUniqueAccountNumber();
        this.email = email;
    }

    // DataBase Constructor
    protected Accounts(int acc_num, String username, String hashed_pin, double balance, String email) {
        this.acc_num = acc_num;
        this.username = username;
        this.hashed_pin = hashed_pin;
        this.balance = balance;
        this.email = email;
    }

    public int getAccnum() {
        return this.acc_num;
    }

    public String getHashedPin() {
        return this.hashed_pin;
    }

    public String getUsername() {
        return this.username;
    }

    public double getBalance() {
        return this.balance;
    }

    public String getEmail() {
        return this.email;
    }

    public String getAccount_type() {
        return this.account_type;
    }

    public List<Transaction> getTransactions() {
        return this.transactions;
    }

    // Dynamic list for loans
    protected List<Loan> active_loans = new ArrayList<>();
    public List<Loan> getActiveLoans() { 
        return this.active_loans; 
    }

    // System will generate new account numbers each time
    private int generateUniqueAccountNumber() {
        Random num = new Random();// built in function to generate random numbers
        int newAccNum;
        do {
            newAccNum = 100000 + num.nextInt(900000);// account number will be generated from 100000 to 999999
        } while (existingAccountNumbers.contains(newAccNum));
        existingAccountNumbers.add(newAccNum);
        return newAccNum;
    }

    // SHA-256 Hashing implementation
    public static String hashPin(String pin) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] encodedhash = digest.digest(pin.getBytes());
            StringBuilder hexString = new StringBuilder(2 * encodedhash.length);
            for (byte b : encodedhash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) {
                    hexString.append('0');
                }
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("Error initializing hashing algorithm", e);
        }
    }

    // WITRHDRAW and DEPOSIT class that include the throwing exception logic.
    // Withdraw Method.
    public void withdraw(int amount, int enteredPin) {
        // hashing the entered pin and compared to stored hash.
        if (!this.hashed_pin.equals(hashPin(String.valueOf(enteredPin)))) {
            throw new SecurityException("Authentication failed: Incorrect Pin.");

        }
        if (amount < 0) {
            throw new IllegalArgumentException("Withdrawal Amount can not be negative.");
        }
        if (balance < amount) {
            throw new IllegalStateException("Insufficient Balance");
        }
        if (!checkTransactionLimit(amount)) {
            throw new IllegalStateException("Transaction Limit exceeded for this account type");
        }
        balance -= amount;
        transactions.add(new Transaction("Withdraw", amount, balance));
    }

    // Deposit Method.
    public void Deposit(double amount) {
        if (amount < 0) {
            throw new IllegalArgumentException("Deposit amount can not be negative.");
        }
        balance += amount;
        transactions.add(new Transaction("Deposit", amount, balance));
    }

    // 5. Filter Transactions by Days Ago (e.g., pass 7 for last week, 30 for last
    // month)
    public List<Transaction> getTransactionsSince(int daysAgo) {
        LocalDateTime thresholdDate = LocalDateTime.now().minus(daysAgo, ChronoUnit.DAYS);

        // Using Java Streams to filter the list based on the date
        return transactions.stream()
                .filter(t -> t.getTimestamp().isAfter(thresholdDate))
                .collect(Collectors.toList());
    }

    public void updatePin(int oldPin, int newPin) {
        // 1. Verify the old pin (using our hash function)
        if (!this.hashed_pin.equals(hashPin(String.valueOf(oldPin)))) {
            throw new SecurityException("Update failed: Incorrect old PIN.");
        }

        // 2. If it matches, hash and save the new pin
        this.hashed_pin = hashPin(String.valueOf(newPin));
        System.out.println("Account PIN Updated Successfully!");
    }
}

// --------------------ACCOUNT TYPES-----------------------

// --------------------SAVING ACCOUNT-----------------------
class Saving_acc extends Accounts {
    private double interestRate;
    private final int DAILY_WITHDRAWAL_LIMIT = 50000;

    // Constructor that is invoked when a new account of saving type is created.
    public Saving_acc(String username, int pin, double balance, double interestRate, String email) {
        super(username, pin, balance, email);
        this.interestRate = interestRate;
    }

    // DataBase Constructor that is invoked when details of existing account is
    // fecthed.
    public Saving_acc(int acc_num, String username, String hashed_pin, double balance, double interestRate,
            String email) {
        super(acc_num, username, hashed_pin, balance, email); // Calls the parent DB constructor
        this.interestRate = interestRate;
        this.account_type = "SAVINGS";
    }

    public double getInterestRate() {
        return interestRate;
    }

    public int getDailyWithdrawalLimit() {
        return DAILY_WITHDRAWAL_LIMIT;
    }

    @Override
    protected boolean checkTransactionLimit(int amount) {
        return amount <= DAILY_WITHDRAWAL_LIMIT;
    }
}

// --------------------CREDIT ACCOUNT-----------------------
class Credit_acc extends Accounts {
    private double interestRate;
    private final int MAX_SWIPE_LIMIT; // Specific constraint for credit accounts

    // Constructor
    public Credit_acc(String username, int pin, double balance, double interestRate, int maxSwipeLimit, String email) {
        // 1. super() calls the constructor of the parent 'Accounts' class
        super(username, pin, balance, email);
        this.interestRate = interestRate;
        this.MAX_SWIPE_LIMIT = maxSwipeLimit;
        this.account_type = "CREDIT";

        System.out.println("Credit Account created successfully!");
        System.out.println("Account Holder: " + this.username);
    }

    // DATABASE CONSTRUCTOR for Savings
    public Credit_acc(int acc_num, String username, String hashed_pin, double balance, double interestRate,
            int MAX_SWIPE_LIMIT, String email) {
        super(acc_num, username, hashed_pin, balance, email); // Calls the parent DB constructor
        this.interestRate = interestRate;
        this.MAX_SWIPE_LIMIT = MAX_SWIPE_LIMIT;
    }

    public double getInterestRate() {
        return interestRate;
    }

    public int getMaxSwipeLimit() {
        return MAX_SWIPE_LIMIT;
    }

    // 2. Overriding the abstract method
    @Override
    protected boolean checkTransactionLimit(int amount) {
        // A credit account might restrict how much you can spend in a single swipe
        if (amount > MAX_SWIPE_LIMIT) {
            System.out.println("Alert: Transaction exceeds maximum single-swipe limit.");
            return false;
        }
        return true;
    }
}

class Transaction {
    private int id; // Added transaction ID
    private String type;
    private double amount;
    private double balance_after;
    private LocalDateTime timestamp;

    public Transaction(String type, double amount, double balance_after) {
        this.type = type;
        this.amount = amount;
        this.balance_after = balance_after;
        this.timestamp = LocalDateTime.now();
    }

    // OVERLOADED CONSTRUCTOR for DB retrieval
    public Transaction(int id, String type, double amount, double balance_after, LocalDateTime timestamp) {
        this.id = id;
        this.type = type;
        this.amount = amount;
        this.balance_after = balance_after;
        this.timestamp = timestamp;
    }

    // --- JACKSON GETTERS ---
    public int getId() {
        return id;
    }

    public String getType() {
        return type;
    }

    public double getAmount() {
        return amount;
    }

    public double getBalance_after() {
        return balance_after;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    // Additional Date String specifically for React UI
    public String getDate() {
        return timestamp.toLocalDate().toString();
    }

    @Override
    public String toString() {
        return timestamp + " | " + type + ": ₹" + amount + " | Balance: ₹" + balance_after;
    }
}

// ------------------------LOAN CLASS--------------------------
abstract class Loan {
    protected String borrower_name;// Usable for subclasses.
    protected double interest_rate;
    protected double principle_amount;
    protected int tenure;// in monthes or years.
    public String Loan_type;

    // Constructor for creating a Loan Object.
    public Loan(String borrower_name, double interest_rate, double principle_amount, int tenure, String Loan_type) {
        this.borrower_name = borrower_name;
        this.interest_rate = interest_rate;
        this.principle_amount = principle_amount;
        this.tenure = tenure;
        this.Loan_type = Loan_type;
    }

    // --- JACKSON GETTERS ---
    public String getBorrowerName() { return borrower_name; }
    public double getInterestRate() { return interest_rate; }
    public double getPrincipleAmount() { return principle_amount; }
    public int getTenure() { return tenure; }
    public String getLoanType() { return Loan_type; }

    public abstract double interestrate();// Abstract Method to calculate interest rate for a specific Loan.

}

// --------------------HOME LOAN-----------------------
class Home_Loan extends Loan {
    public Home_Loan(String borrower_name, double principle_amount, int tenure) {
        super(borrower_name, 0.0, principle_amount, tenure, "HOME_LOAN");
        this.interest_rate = interestrate();
    }

    @Override
    public double interestrate() {
        // Base rate ~ 7.10% linked to current 2026 RBI Repo
        double baseRate = 7.10;
        
        // High principle premium (over ₹50 Lakhs)
        if (this.principle_amount > 5000000) {
            baseRate += 0.50; 
        }
        // Long tenure premium (over 15 years = 180 months)
        if (this.tenure > 180) {
            baseRate += 0.25;
        }
        return baseRate;
    }
}

// --------------------PERSONAL LOAN-----------------------
class Personal_Loan extends Loan {
    public Personal_Loan(String borrower_name, double principle_amount, int tenure) {
        super(borrower_name, 0.0, principle_amount, tenure, "PERSONAL_LOAN");
        this.interest_rate = interestrate();
    }

    @Override
    public double interestrate() {
        // Base unsecured rate ~ 10.50%
        double baseRate = 10.50;
        
        // Unsecured long tenure risk (over 3 years = 36 months)
        if (this.tenure > 36) {
            baseRate += 1.50;
        }
        // Large unsecured sum risk (over ₹10 Lakhs)
        if (this.principle_amount > 1000000) {
            baseRate += 1.00;
        }
        return baseRate;
    }
}

// --------------------EDUCATION LOAN-----------------------
class Education_Loan extends Loan {
    public Education_Loan(String borrower_name, double principle_amount, int tenure) {
        super(borrower_name, 0.0, principle_amount, tenure, "EDUCATION_LOAN");
        this.interest_rate = interestrate();
    }

    @Override
    public double interestrate() {
        // RBI student baseline ~ 8.50%
        double baseRate = 8.50;
        
        // Over ₹7.5L typically requires collateral risk adjustment
        if (this.principle_amount > 750000) {
            baseRate += 1.50;
        }
        // Longer repayment window (over 10 years = 120 months)
        if (this.tenure > 120) {
            baseRate += 0.50;
        }
        return baseRate;
    }
}
