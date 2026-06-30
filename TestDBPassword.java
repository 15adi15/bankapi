import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

public class TestDBPassword {
    public static void main(String[] args) {
        String urlWithHash = "jdbc:postgresql://db.dtfwclidjnkmadacwhek.supabase.co:5432/postgres?user=postgres&password=9f.Rq7iXG#7xjyK";
        String explicitUser = "postgres";
        String explicitPassword = "9f.Rq7iXG#7xjyK";
        
        System.out.println("Connecting to: " + urlWithHash);
        try {
            Connection conn = DriverManager.getConnection(urlWithHash, explicitUser, explicitPassword);
            System.out.println("Connection Successful!");
        } catch (SQLException e) {
            System.out.println("Connection Failed!");
            e.printStackTrace();
        }
    }
}
