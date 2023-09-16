require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");
const cookieParser = require("cookie-parser");

const auth = require("./routes/auth");

const app = express();

// Middleware
app.use(cors({
    origin: 'https://chatsphere.arthurxyl.com',
    credentials: true
  }));
  
app.use(express.json()); // Parse JSON request payloads
app.use(cookieParser());

// Database connection
const db = mysql.createPool({
  host: "127.0.0.1",
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: "chatsphere",
});

// To make db accessible to routes
app.set("db", db); // you can then access db in your routes using req.app.get('db')

// Routers
app.use("/auth", auth);

const PORT = process.env.PORT || 3003;
app
  .listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
