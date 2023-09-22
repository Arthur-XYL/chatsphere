const express = require('express');
const router = express.Router();

router.get('/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        const db = req.app.get('db');

        if (!userId) {
            return res.status(400).json({ message: "User ID is required." });
        }

        const [contacts] = await db.query(`
            (
                SELECT c.id AS contact_relationship_id,
                    c.user2_id AS contact_user_id,
                    u2.username AS contact_username
                FROM contacts c
                JOIN users u2 ON c.user2_id = u2.id
                WHERE c.user1_id = ?
            )
            UNION
            (
                SELECT c.id AS contact_relationship_id,
                    c.user1_id AS contact_user_id,
                    u1.username AS contact_username
                FROM contacts c
                JOIN users u1 ON c.user1_id = u1.id
                WHERE c.user2_id = ? 
            )
        `, [userId, userId]);
        
        res.status(200).json(contacts);
    } catch (error) {
        console.error("Error getting contact:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}) 

router.post('/', async (req, res) => {
    try {
        const { userId, contactId } = req.body;
        const db = req.app.get('db');

        // Add contact
        await db.query('INSERT INTO contacts (user1_id, user2_id) VALUES (?, ?)', [userId, contactId]);

        res.status(200).json({ message: "Contact added successfully." });
    } catch (error) {
        console.error("Error adding contact:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const { userId, contactId } = req.body;
        const db = req.app.get('db');

        // Delete the contact
        await db.query('DELETE FROM contacts WHERE user_id = ? AND contact_id = ?', [userId, contactId]);
        
        res.status(200).json({ message: "Contact deleted successfully." });
    } catch (error) {
        console.error("Error deleting contact:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

module.exports = router;