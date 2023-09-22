const express = require('express');
const router = express.Router();

router.get('/history', async (req, res) => {
    try {
        const { userId, contactId } = req.query;
        const db = req.app.get('db');

        if (!userId || !contactId) {
            return res.status(400).json({ error: 'Missing user IDs in the request' });
        }

        // Step 1: Find the chat_id where both userId and contactId are members
        const chatQuery = `
            SELECT c1.chat_id
            FROM chat_members c1
            JOIN chat_members c2 ON c1.chat_id = c2.chat_id
            WHERE c1.user_id = ? AND c2.user_id = ?
        `;
        const [chatResult] = await db.query(chatQuery, [userId, contactId]);
        if (!chatResult.length) {
            return res.status(404).json({ error: 'Chat session not found' });
        }
        const chatId = chatResult[0].chat_id;

        // Step 2: Use the chat_id to retrieve messages
        const messagesQuery = `
            SELECT *
            FROM messages
            WHERE chat_id = ?
            ORDER BY timestamp ASC;
        `;
        const [data] = await db.query(messagesQuery, [chatId]);
        return res.status(200).send({
            chatId: chatId,
            messages: data
        });

    } catch (error) {
        console.error("Error fetching chat history:", error);
        return res.status(500).send({ error: 'Failed to fetch chat history' });
    }
});


router.post('/', async (req, res) => {
    try {
        const { userId, contactId } = req.body;
        const db = req.app.get('db');

        if (!userId || !contactId) {
            return res.status(400).json({ error: 'Missing user IDs in the request' });
        }

        // Step 1: Check if there's already a chat between these two users
        const chatQuery = `
            SELECT chat_id
            FROM chat_members
            WHERE chat_id IN (
                SELECT chat_id 
                FROM chat_members 
                WHERE user_id = ?
            ) AND user_id = ?
            GROUP BY chat_id
            HAVING COUNT(chat_id) = 2;
        `;

        const [chatResult] = await db.query(chatQuery, [userId, contactId]);

        if (chatResult.length) {
            return res.status(200).json({ message: 'Chat session already exists', chat_id: chatResult[0].chat_id });
        }

        // Step 2: Create a new entry in the `chats` table
        const createChatQuery = `
            INSERT INTO chats (chat_name) VALUES (?);
        `;

        const [insertResult] = await db.query(createChatQuery, [`${userId}-${contactId}`]);
        const newChatId = insertResult.insertId;

        // Step 3: Add both users to the `chat_members` table
        const addMembersQuery = `
            INSERT INTO chat_members (chat_id, user_id) VALUES (?, ?), (?, ?);
        `;

        await db.query(addMembersQuery, [newChatId, userId, newChatId, contactId]);

        return res.status(201).json({ message: 'New chat session created', chat_id: newChatId });

    } catch (error) {
        console.error("Error creating chat session:", error);
        return res.status(500).send({ error: 'Failed to create chat session' });
    }
});

module.exports = router;
