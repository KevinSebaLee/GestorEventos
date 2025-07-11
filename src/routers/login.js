import express from 'express';
import jwt from 'jsonwebtoken';
import eventService from '../services/event.js'

const router = express.Router();

router.post('/login', async (req, res) => {
    const { username, password } = req.body;
  
    if (!username || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
  
    try {  
      const user = eventService.getUserParameters(null, username);

      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
  
      const isPasswordValid = (password === user.password) ? false : true;

      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
  
      const payload = { id: user.id, email: user.username };
      const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });
  
      return res.json({ token, message: 'Logged in successfully!' });
  
    } catch (err) {
      console.error('Error:', err);
      return res.status(500).json({ error: 'Login failed' });
    }
  });

export default router;