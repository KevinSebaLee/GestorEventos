import express from 'express';
import jwt from 'jsonwebtoken';
import eventLocation from '../services/event-location.js'
import { requireAuth, checkOwnership } from '../middleware/auth.js';

const router = express.Router();

router.get('/', requireAuth, async (req, res) => {
    try {
        const locations = await eventLocation.getEventLocations();
        return res.status(200).json(locations);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});

router.get('/:id', requireAuth, async (req, res) => {
    const { id } = req.params;

    try {
        const location = await eventLocation.getEventLocationParameters(id);
        return res.status(200).json(location);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});

router.post('/', requireAuth, async (req, res) => {
    const { name, full_address, max_capacity, latitude, longitude, id_location } = req.body;
    const { id } = req.user;
    
    const id_creator_user = id;

    if (!name || !full_address || !max_capacity || !latitude || !longitude) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    const locationData = [
        id_location,
        name,
        full_address,
        max_capacity,
        latitude,
        longitude,
        id_creator_user
    ];

    try {
        const newLocationId = await eventLocation.createEventLocation(locationData);
        return res.status(201).json({ id: newLocationId });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});

export default router;