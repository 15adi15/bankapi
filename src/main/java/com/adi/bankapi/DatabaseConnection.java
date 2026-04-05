package com.adi.bankapi;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

public class DatabaseConnection {
    // The connection path to local PostgreSQL server and bank_db
    private static final String URL = "jdbc:postgresql://localhost:5432/bank_db";

    // Mac username that owns the database
    private static final String USER = "adityasanjaybhore";

    // Homebrew default has no password
    private static final String PASSWORD = "";

    // This method attempts to open a connection and return it
    public static Connection getConnection() {
        Connection conn = null;
        try {
            conn = DriverManager.getConnection(URL, USER, PASSWORD);
            System.out.println("Database Connection Successful!");
        } catch (SQLException e) {
            System.out.println("Database Connection Failed!");
            e.printStackTrace();
        }
        return conn;
    }

    // A main method just to test the connection
    public static void main(String[] args) {
        getConnection();
    }
}