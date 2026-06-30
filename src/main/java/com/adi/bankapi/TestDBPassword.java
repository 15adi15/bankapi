
package com.adi.bankapi;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

public class TestDBPassword {
    public static void main(String[] args) {
        String url = "jdbc:postgresql://aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres?sslmode=require";
        String user = "postgres.dtfwclidjnkmadacwhek";
        String password = "9f.Rq7iXG#7xjyK";

        System.out.println("Connecting to: " + url);
        try {
            Connection conn = DriverManager.getConnection(url, user, password);
            System.out.println("Connection Successful!");
        } catch (SQLException e) {
            System.out.println("Connection Failed!");
            e.printStackTrace();
        }
    }
}
