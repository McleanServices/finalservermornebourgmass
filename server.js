import express from "express";
import mysql from "mysql2/promise"; // Use promise-based MySQL client
import jwt from "jsonwebtoken"; // Import jsonwebtoken
import cors from "cors"; // Import cors

const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

app.use(cors({
  origin: '*',
}));

// Create a MySQL connection pool
const pool = mysql.createPool({
  host: '148.113.192.196',
  user: 'joan', 
  password: 'Joanubuntu24mysql@',
  database: 'mornebourgmass',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Endpoint to get a user by ID
app.get("/api/user/:id", async (req, res) => {
  const userId = req.params.id;

  try {
    // Query to get the user by ID
    const [rows] = await pool.query("SELECT * FROM users WHERE id = ?", [userId]);

    // Check if user was found
    if (rows.length > 0) {
      return res.status(200).json({
        message: "User found",
        user: rows[0], // Assuming the first row is the user you want
      });
    } else {
      return res.status(404).json({
        message: "User not found",
      });
    }
  } catch (error) {
    console.error("Database query error:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
});

const SECRET_KEY = "0192837465123456789";

// Endpoint to login a user
app.post('/api/user/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const query = 'SELECT * FROM users WHERE username = ?';
    const [result] = await pool.query(query, [username]);

    if (result.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = result[0];

    if (user.password !== password) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, SECRET_KEY, { expiresIn: '1h' }); // Include role in token
    return res.json({ token, userId: user.id, userRole: user.role }); // Include role in response
  } catch (err) {
    console.error("Database query error:", err);
    return res.status(500).json({ message: 'Database error' });
  }
});
// API to get home screen data
app.get('/api/homescreen', async (req, res) => {
  try {
    const query = 'SELECT * FROM homeScreen';
    const [results] = await pool.query(query);
    res.status(200).json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API to update home screen data
app.put('/api/homescreen/:id', async (req, res) => {
  const { id } = req.params;
  const { activitydescription } = req.body;
  try {
    const query = 'UPDATE homeScreen SET activitydescription = ? WHERE idhomescreen = ?';
    const [results] = await pool.query(query, [activitydescription, id]);
    if (results.affectedRows === 0) {
      return res.status(404).json({ message: 'Home screen not found' });
    }
    res.status(200).json({ message: 'Home screen updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/activity', async (req, res) => {
  try {
    const query = 'SELECT * FROM Activities';
    const [activities] = await pool.query(query);
    return res.json(activities);
  } catch (err) {
    console.error("Database query error:", err);
    return res.status(500).json({ message: 'Database error' });
  }
});

app.put('/api/activity', async (req, res) => {
  const { title, description } = req.body; // Get the new title and description from the request body

  try {
      // Update the activity in the database (assuming your activity table is called 'activities')
      const query = 'UPDATE Activities SET title = ?, description = ? WHERE id = 1'; // Use 1 since you only have one activity
      const [result] = await pool.query(query, [title, description]);

      // Check if any row was affected
      if (result.affectedRows === 0) {
          return res.status(404).json({ message: 'Activity not found' });
      }

      return res.status(200).json({ message: 'Activity updated successfully' });
  } catch (err) {
      console.error("Database query error:", err);
      return res.status(500).json({ message: 'Database error' });
  }
});

// Endpoint to get user account details using a token
app.get('/api/user/account', (req, res) => {
  const token = req.headers['authorization'];

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) {
      console.error("Token verification error:", err); // Log token verification errors
      return res.status(401).json({ message: 'Invalid token' });
    }

    console.log("Decoded token:", decoded); // Log the decoded token

    const query = 'SELECT id, username FROM users WHERE id = ?';
    pool.query(query, [decoded.id], (err, result) => {
      if (err) {
        console.error('Database query error:', err);
        return res.status(500).json({ message: 'Database error' });
      }

      console.log("Query result:", result); // Log the query result

      if (result.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json(result[0]);
    });
  });
});



// Basic API endpoint to check server status
app.get("/api", (req, res) => {
  return res.status(200).json({
    message: "Server working",
  });
});

app.post('/api/register', async (req, res) => {
  const { username, firstName, lastName, email, password, phoneNumber, dateOfBirth, role } = req.body;

  if (!username || !firstName || !lastName || !email || !password || !phoneNumber || !dateOfBirth || !role) {
    return res.status(400).json({ message: "Please fill in all fields." });
  }

  const createdAt = new Date();

  const query = `
    INSERT INTO users (username, password, email, created_at, first_name, last_name, phone_number, date_of_birth, role)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const values = [username, password, email, createdAt, firstName, lastName, phoneNumber, dateOfBirth, role];

  try {
    const [result] = await pool.query(query, values);

    return res.status(201).json({ message: "User registered successfully!" });
  } catch (err) {
    console.error("Error inserting user:", err);
    return res.status(500).json({ message: "Database error. Please try again." });
  }
});


// Start the server
app.listen(8080, () => console.log("Server is running on 8080"));
