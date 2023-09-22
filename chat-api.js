require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");
const cookieParser = require("cookie-parser");
const path = require('path');
const http = require('http');
const socketIo = require('socket.io')


const auth = require('./routes/auth');
const search = require('./routes/search')
const contacts = require('./routes/contacts');
const friendRequests = require('./routes/friend-requests');
const chats = require('./routes/chats');
const messages = require('./routes/messages');

const db = mysql.createPool({
  host: "127.0.0.1",
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: "chatsphere",
});
const app = express();
app.set("db", db); 
app.use(express.json()); 
app.use(cookieParser());
app.use(cors({
    origin: 'https://chatsphere.arthurxyl.com',
    credentials: true
  }));

app.use('/', express.static(__dirname));
app.use('/rsc', express.static(path.join(__dirname, 'rsc')));
app.use('/user-login', express.static(path.join(__dirname, 'user-login')));


app.use('/api/auth', auth);
app.use('/api/search', search);
app.use('/api/contacts', contacts);
app.use('/api/friend-requests', friendRequests);
app.use('/api/chats', chats);
app.use('/api/messages', messages);

const server = http.createServer(app);
const io = socketIo(server);
io.on('connection', (socket) => {

  socket.on('join room', (chatId) => {
    socket.join(chatId);
  });

  socket.on('leave room', (chatId) => {
    socket.leave(chatId);
});

  // Receive message from a user and save to the database and broadcast to others in the same chat room
  socket.on('send message', async (data) => {
    try {
      // Store message in the database
      const { chat_id, sender_id, content } = data;
      const connection = await db.getConnection();
      const [rows] = await connection.query('INSERT INTO messages (chat_id, content, sender_id) VALUES (?, ?, ?)', [chat_id, content, sender_id]);
      connection.release();

      // After storing in the database, broadcast the message to the specific chat room
      io.to(data.chat_id).emit('receive message', data);
    } catch (error) {
      console.error('Error saving message to database:', error);
    }
  });

  socket.on('disconnect', () => {
  });
});


const PORT = process.env.PORT || 3002;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

