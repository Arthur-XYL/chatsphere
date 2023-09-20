const express = require('express');
const router = express.Router();

router.get('/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        const db = req.app.get('db');

        if (!userId) {
            return res.status(400).json({ message: "User ID is required." });
        }

        const [contacts] = await db.query('SELECT * FROM contacts WHERE user_id = ?', [userId]);
        res.status(200).json(contacts);
    } catch {
        console.error("Error getting contact:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}) 

router.post('/', async (req, res) => {
    try {
        const { userId, contactId } = req.body;
        const db = req.app.get('db');

        // Add contact
        await db.query('INSERT INTO contacts (user_id, contact_id) VALUES (?, ?)', [userId, contactId]);
        await db.query('INSERT INTO contacts (user_id, contact_id) VALUES (?, ?)', [contactId, userId]);

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