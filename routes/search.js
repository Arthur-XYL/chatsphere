const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const username = req.query.username;
        const db = req.app.get('db');
        if (!username) {
            return res.status(400).send({ error: 'Username is required' });
        }   
    
        // Check if user exists based on the username
        const [rows] = await db.query(
            'SELECT * FROM users WHERE username = ?', 
            [username]
        );
        const existingData = rows[0];
        if (existingData) {
            return res.status(200).send({ 
                exists: true, 
                username: existingData.username, 
                userId: existingData.id
            });
        } else {
            return res.status(400).send({ exists: false });
        }
    } catch (error) {
        return res.status(400).send(error);
    }
});

module.exports = router;