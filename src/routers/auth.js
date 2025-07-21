import express from 'express';
import jwt from 'jsonwebtoken';
import userService from '../services/user.js'

const router = express.Router();

router.post('/login', async (req, res) => {
    const { username, password } = req.body;
  
    if (!username || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
  
    try {  
      const user = await userService.getUserParameters(null, username);

      console.log('User:', user);

      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
  
      const isPasswordValid = (password === user.password) ? false : true;

      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const payload = { id: user[0].id, email: user[0].username };
      const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
  
      return res.json({ token, message: 'Logged in successfully!' });
  
    } catch (err) {
      console.error('Error:', err);
      return res.status(500).json({ error: 'Login failed' });
    }
  });

router.post('/register', async (req, res) => {
    const { username, password, firstName, lastName } = req.body;

    if (!username || !password || !firstName || !lastName) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    const existingUser = await userService.getUserParameters(null, username);

    if (existingUser.length > 0) {
        return res.status(400).json({ error: 'Email already registered'});
    }

    try {
        const newUser = await userService.createUser({ username, password, firstName, lastName });

        return res.status(201).json({ message: 'User registered successfully', user: newUser });
    } catch (err) {
        console.error('Error:', err);
        return res.status(500).json({ error: 'Registration failed' });
    }
});

router.get('/logout', (req, res) => {
  res.status(200).json({ message: 'Logged out successfully' });
});

export default router;