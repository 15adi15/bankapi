package com.adi.bankapi;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class DebugController {
    @GetMapping("/debugapi")
    public String debugEnv() {
        try {
            String url = System.getenv("DB_URL");
            String user = System.getenv("DB_USER");
            String pass = System.getenv("DB_PASSWORD");
            java.sql.Connection conn = java.sql.DriverManager.getConnection(url, user, pass);
            return "SUCCESS! URL=" + url + " | USER=" + user + " | PASS_LEN=" + (pass != null ? pass.length() : "null");
        } catch (Exception e) {
            return "FAILED! MSG: " + e.getMessage() + " | URL=" + System.getenv("DB_URL") + " | USER=" + System.getenv("DB_USER") + " | PASS_LEN=" + (System.getenv("DB_PASSWORD") != null ? System.getenv("DB_PASSWORD").length() : "null");
        }
    }
}
