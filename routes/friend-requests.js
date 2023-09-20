const express = require('express');
const router = express.Router();

router.get('/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        const db = req.app.get('db');
        
        if (!userId) {
            return res.status(400).json({ message: "User ID is required." });
        }

        // Get friend requests where the user is the receiver
        const [requests] = await db.query(`
            SELECT fr.id, 
                   fr.sender_id, 
                   fr.receiver_id, 
                   fr.status,
                   u1.username as sender_username, 
                   u2.username as receiver_username
            FROM friend_requests fr
            JOIN users u1 ON fr.sender_id = u1.id
            JOIN users u2 ON fr.receiver_id = u2.id
            WHERE fr.receiver_id = ? OR fr.sender_id = ?
        `, [userId, userId]);
        res.status(200).json(requests);
    } catch (error) {
        console.error("Error getting friend requests:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});


router.post('/', async (req, res) => {
    try {
        const { userId, contactId } = req.body;
        const db = req.app.get('db');

        if (userId === contactId) {
            return res.status(400).json({ message: "You cannot add yourself." });
        }

        // Check if the contact already exists in their contacts list
        const [existingContacts] = await db.query('SELECT * FROM contacts WHERE user_id = ? AND contact_id = ?', [userId, contactId]);
        
        if (existingContacts.length > 0) {
            return res.status(400).json({ message: "This user is already in your contacts." });
        }

        // Check for an existing friend request between these users
        const [existingRequest] = await db.query(`SELECT * FROM friend_requests WHERE ((sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)) AND status = 'pending'`, [userId, contactId, contactId, userId]);

        if (existingRequest.length > 0) {
            return res.status(400).json({ message: "There's already a pending friend request between you." });
        }

        // Send friend request
        await db.query('INSERT INTO friend_requests (sender_id, receiver_id) VALUES (?, ?)', [userId, contactId]);
        res.status(200).json({ message: "Friend request sent successfully." });
    } catch (error) {
        console.error("Error sending friend request:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

router.put('/:id', async (req, res) => {
    const requestId = req.params.id;
    const { status } = req.body;
    const db = req.app.get('db');

    // Check if the provided status is valid
    if (!['accepted', 'declined'].includes(status)) {
        return res.status(400).json({ message: "Invalid status. Status should be 'accepted' or 'declined'." });
    }

    try {
        // Update the friend request status
        const [results] = await db.query('UPDATE friend_requests SET status = ? WHERE id = ?', [status, requestId]);

        // Check if any row was affected (i.e., if the request ID was valid)
        if (results.affectedRows === 0) {
            return res.status(404).json({ message: "Friend request not found." });
        }
        res.status(200).json({ message: `Friend request ${status} successfully.` });
    } catch (error) {
        console.error("Error updating friend request status:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const requestId = req.params.id;
        const db = req.app.get('db');

        // Delete friend request
        const [existingRequest] = await db.query('DELETE FROM friend_requests WHERE id = ?', [requestId]);

        res.status(200).json({ message: "Friend request reject successfully." });
    } catch (error) {
        console.error("Error rejecting friend request:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

module.exports = router;