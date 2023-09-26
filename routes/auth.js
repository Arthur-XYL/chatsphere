require('dotenv').config();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const express = require('express');

const router = express.Router();

router.get('/status', (req, res) => {
    const token = req.cookies.jwt;
    if (token) {
        jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if (err) {
                return res.json({ isAuthenticated: false });
            } else {
                return res.json({
                    isAuthenticated: true,
                    user: decoded.user
                });
            }
        });
    } else {
        return res.json({ isAuthenticated: false });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const db = req.app.get('db');

        // Check if user exists based on the username
        const [rows] = await db.query(
            'SELECT id, password FROM users WHERE username = ?', 
            [username]
        );
        const existingData = rows[0];

        if (existingData) {
            const isMatch = await bcrypt.compare(password, existingData.password);
            if (isMatch) {
                const payload = {
                    user: {
                        id: existingData.id
                    }
                };
        
                jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: 86400 }, (err, token) => {
                    if (err) throw err;
        
                    // Setting JWT in HTTP-only cookie
                    res.cookie('jwt', token, {
                        httpOnly: true,
                        secure: process.env.NODE_ENV === 'production',
                        maxAge: 86400 * 1000
                    });
        
                    res.status(200).json({ message: "User logged in successfully." });
                });
            } else {
                return res.status(401).json({ message: "Invalid credentials. Please check your username and password." });
            }
        } else {
            return res.status(400).json({ message: "User doesn't exist" });
        }
    } catch (error) {
        return res.status(400).send(error);
    }
});

router.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        const db = req.app.get('db');
        // Check for existing username
        const [rows] = await db.query(
            'SELECT id FROM users WHERE username = ?', 
            [username]
        );
        const existingData = rows[0];

        if (existingData) {
            return res.status(400).send({ message: "Username already exists." });
        } else {
            const saltRounds = Number(process.env.SALT_ROUNDS);
            const salt = await bcrypt.genSalt(saltRounds);
            const hashedPassword = await bcrypt.hash(password, salt);

            await db.query(
                'INSERT INTO users (username, password) VALUES (?, ?)', 
                [username, hashedPassword]
            );

            return res.status(201).send({ message: "User registered successfully." });
        }

    } catch (error) {
        return res.status(400).send({ message: "User registered failed." });
    }
});

router.post('/logout', (req, res) => {
    res.cookie('jwt', '', {
        httpOnly: true,
        expires: new Date(0),
        secure: process.env.NODE_ENV === 'production'
    });
    res.status(200).json({ message: "User logged out successfully." });
});

module.exports = router;
