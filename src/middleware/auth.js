import 'dotenv/config';
import jwt from 'jsonwebtoken';
import eventService from '../services/event.js'

export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: Token missing' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
  }
}

export async function checkOwnership(req, res, next) {
  const { id } = req.user;
  const eventId = req.params.id;

  if (!eventId) {
    return res.status(400).json({ error: 'Bad Request: Event ID is required' });
  }

  const event = await eventService.getOnlyEventParameters(eventId);

  if (!event) {
    return res.status(404).json({ error: 'Not Found: Event does not exist' });
  }

  if (event.id_creator_user !== id) {
    return res.status(403).json({ error: 'User isn\'t the owner of this event' });
  }

  next();
}