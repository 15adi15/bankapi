import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

public class TestDB {
    public static void main(String[] args) {
        String url = "jdbc:postgresql://db.dtfwclidjnkmadacwhek.supabase.co:5432/postgres";
        String user = "postgres";
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
