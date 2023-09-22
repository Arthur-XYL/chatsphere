const express = require('express');
const router = express.Router();

router.post('/', async (req, res) => {
    try {
        const { chat_id, sender_id, content } = req.body;
        const db = req.app.get('db');
        await db.query('INSERT INTO messages (chat_id, sender_id, content) VALUES (?, ?, ?)', [chat_id, sender_id, content]);
        res.status(200).send({ success: true });
    } catch (error) {
        return res.status(500).send(error);
    }
});


module.exports = router;