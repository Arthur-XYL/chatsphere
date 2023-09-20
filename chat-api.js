require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");
const cookieParser = require("cookie-parser");

const search = require('./routes/search')
const auth = require('./routes/auth');
const contacts = require('./routes/contacts');
const friendRequests = require('./routes/friend-requests');

const app = express();
app.use(express.json()); 
app.use(cookieParser());
app.use(cors({
    origin: 'https://chatsphere.arthurxyl.com',
    credentials: true
  }));

app.use('/search', search);
app.use('/auth', auth);
app.use('/contacts', contacts);
app.use('/friend-requests', friendRequests);

const db = mysql.createPool({
  host: "127.0.0.1",
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: "chatsphere",
});

app.set("db", db); 

const PORT = process.env.PORT || 3002;
app
  .listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
