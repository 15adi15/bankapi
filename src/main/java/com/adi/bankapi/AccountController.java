package com.adi.bankapi;

//THE ACCOUNT CONTROLLER CLASS IS THE ENTRY POINT FOR ANY HTTP REQUEST.
import org.springframework.web.bind.annotation.*;

@RestController
@CrossOrigin(origins = "http://localhost:5173")
@RequestMapping("/api/accounts")
public class AccountController {

    private AccountDAO accountDAO = new AccountDAO();

    @GetMapping("/{acc_num}")
    public Accounts getAccountInfo(@PathVariable int acc_num) {
        return accountDAO.getAccountByAccnum(acc_num);
    }

    // we need to create an Data Transfer object to handle the abstract Account
    // class issue.
    public static class AccountRequestDTO {
        public String username;
        public int pin;
        public double balance;
        public String accountType;// Savings or Credit
        public String email;
    }

    // The POST method
    @PostMapping("/create")
    public String createNewAccount(@RequestBody AccountRequestDTO requestData) {
        // the first step will be to create an account , then pass that account to
        // respective constructor after checking the fields.
        Accounts newAccount = null;
        // check the fields
        if ("SAVINGS".equalsIgnoreCase(requestData.accountType)) {
            // pass to saving acc constructor
            newAccount = new Saving_acc(requestData.username, requestData.pin, requestData.balance, 4.5,
                    requestData.email);
        } else if ("CREDIT".equalsIgnoreCase(requestData.accountType)) {
            newAccount = new Credit_acc(requestData.username, requestData.pin, requestData.balance, 18.5, 100000,
                    requestData.email);
        } else {
            return "Error: Invalid Account Type. Must be SAVINGS or CREDIT";
        }

        accountDAO.saveAccount(newAccount);
        return "Success! New Account created for " + requestData.username + " with account number "
                + newAccount.getaccnum();
    }

    // ------The Transaction end point-------
    public static class TransactionDTO {
        public double amount;
        public String action; // "DEPOSIT" or "WITHDRAW"
        public int pin;
    }

    @PutMapping("/{accNum}/transaction")
    public String processTransaction(@PathVariable int accNum, @RequestBody TransactionDTO transactiondata) {
        // step 1: fecth the account
        Accounts currentAccount = accountDAO.getAccountByAccnum(accNum);
        if (currentAccount == null) {
            return "Error: Account not found for number: " + accNum;
        }
        // check if deposit or withdrawal
        try {
            if ("DEPOSIT".equalsIgnoreCase(transactiondata.action)) {
                currentAccount.Deposit(transactiondata.amount);
            } else if ("WITHDRAW".equalsIgnoreCase(transactiondata.action)) {
                currentAccount.withdraw((int) transactiondata.amount, transactiondata.pin);
            }
        } catch (Exception e) {
            return "Transaction Failed " + e.getMessage();
        }
        accountDAO.updateAccountBalance(accNum, currentAccount.getBalance());
        return "Transaction Successfull " + transactiondata.action + "New Balance: ₹" + currentAccount.getBalance();
    }

    // -------The Transfer Money End Point--------
    public static class TransferDTO {
        public int fromAccNum;
        public int toAccNum;
        public int amount;
        public int pin;
    }

    @PostMapping("/transfer")
    public String transfer(@RequestBody TransferDTO data) {
        // there will be two parties involved:sender and reciever
        Accounts sender = accountDAO.getAccountByAccnum(data.fromAccNum);
        Accounts receiver = accountDAO.getAccountByAccnum(data.toAccNum);

        if (sender == null || receiver == null) {
            return "Invalid accounts.";
        }

        try {
            // step 1 : secure withdraw
            sender.withdraw(data.amount, data.pin);
            // step 2: secure deposit
            receiver.Deposit(data.amount);
            // step 3: database sync
            accountDAO.updateAccountBalance(sender.getaccnum(), sender.getBalance());
            accountDAO.updateAccountBalance(receiver.getaccnum(), receiver.getBalance());

            return "Transaction Successfull! Sent ₹" + data.amount + " to " + receiver.username;
        } catch (Exception e) {
            return "Transaction Failed! " + e.getMessage();
        }

    }

    // The Login DTO
    public static class LoginDTO {
        public String email;
    }

    // The AUTH SYNC endpoint.
    @PostMapping("/auth/sync")
    public Object syncUser(@RequestBody LoginDTO loginData) {
        // Search the database for the Firebase email
        Accounts existingAccount = accountDAO.getAccountByEmail(loginData.email);

        if (existingAccount != null) {
            // User exists! Send their entire dashboard data back to React.
            return existingAccount;
        } else {
            // User logged in with Google, but hasn't opened a bank account yet.
            // Return an error so React knows to redirect them to the "Open Account" screen.
            return "NO_ACCOUNT_FOUND";
        }
    }
}