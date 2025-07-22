import config from '../config/config.js'
import { ReasonPhrases, StatusCodes } from 'http-status-codes';
import _ from 'lodash';
import { Router } from 'express';
import eventService from '../services/event.js'
import { checkOwnership, requireAuth } from '../middleware/auth.js';
import pkg from 'pg'
import { validateEvent } from '../middleware/regex.js';

const router = Router()

const { Pool } = pkg;
const pool = new Pool(config)

router.get('/', async (req, res) => {
    const { nombre, fecha_inicio, tag } = req.query

    try {
        const returnArray = (nombre == null && fecha_inicio == null && tag == null)
            ? await eventService.getEvents()
            : await eventService.getEventsParameters(null, nombre, fecha_inicio, tag);

        return res.status(StatusCodes.OK).json(returnArray);
    } catch (error) {
        console.error(error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
    }
});

router.post('/', requireAuth, validateEvent, async (req, res) => {
    const { name, description, id_event_categoria, id_event_location, start_date, duration_in_minutes, price, enabled_for_enrollment, max_assistance, id_creator_user } = req.body;

    if (!name || !description) {
        return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Name and description are required' });
    }

    const eventLocation = await eventService.getEventLocationsParameters(id_event_location);

    if (max_assistance < eventLocation[0].max_assistance) {
        return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Max assistance must be lower than the location limit' });
    }

    if (price < 0 || isNaN(price) || duration_in_minutes < 0 || isNaN(duration_in_minutes)) {
        return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Price and duration must be positive numbers' });
    }

    const enrollmentPassedBinary = enabled_for_enrollment ? 1 : 0;

    const eventData = [
        name,
        description,
        id_event_categoria,
        id_event_location,
        start_date,
        duration_in_minutes,
        price,
        enrollmentPassedBinary,
        max_assistance,
        id_creator_user
    ];

    try {
        const newEvent = await eventService.createEvent(eventData);
        return res.status(StatusCodes.CREATED).json(newEvent);
    } catch (error) {
        console.error(error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
    }
});

router.put('/:id', requireAuth, validateEvent, checkOwnership, async (req, res) => {
    const id_event = req.params.id;
    const { name, description, id_event_categoria, id_event_location, start_date, duration_in_minutes, price, enabled_for_enrollment, max_assistance } = req.body;

    try {
        const event = await eventService.getOnlyEventParameters(id_event);

        if (!event) {
            return res.status(StatusCodes.NOT_FOUND).json({ message: 'Event not found' });
        }

        const normalizedEvent = {
            name: event.name,
            description: event.description,
            id_event_categoria: Number(event.id_event_categoria),
            id_event_location: Number(event.id_event_location),
            start_date: new Date(event.start_date).toISOString(),
            duration_in_minutes: Number(event.duration_in_minutes),
            price: Number(event.price),
            enabled_for_enrollment: Boolean(event.enabled_for_enrollment),
            max_assistance: Number(event.max_assistance)
        };

        const eventToChange = {
            name,
            description,
            id_event_categoria: Number(id_event_categoria),
            id_event_location: Number(id_event_location),
            start_date: new Date(start_date).toISOString(),
            duration_in_minutes: Number(duration_in_minutes),
            price: Number(price),
            enabled_for_enrollment: Boolean(enabled_for_enrollment),
            max_assistance: Number(max_assistance)
        };

        if (_.isEqual(normalizedEvent, eventToChange)) {
            return res.status(StatusCodes.BAD_REQUEST).json({ message: 'No changes detected' });
        }

        if (price < 0 || isNaN(price) || duration_in_minutes < 0 || isNaN(duration_in_minutes)) {
            return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Price and duration must be positive numbers' });
        }

        const eventLocation = await eventService.getEventLocationsParameters(id_event_location);
        if (eventLocation && max_assistance < eventLocation[0].max_assistance) {
            return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Max assistance must be lower than the location limit' });
        }

        const enrollmentPassedBinary = enabled_for_enrollment ? 1 : 0;

        const eventData = [
            name,
            description,
            id_event_categoria,
            id_event_location,
            start_date,
            duration_in_minutes,
            price,
            enrollmentPassedBinary,
            max_assistance,
            id_event
        ];

        const updatedEvent = await eventService.updateEvent(eventData);
        return res.status(StatusCodes.OK).json(updatedEvent);
    } catch (error) {
        console.error(error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
    }
});

router.get('/:id', async (req, res) => {
    const id = req.params.id

    try {
        const returnArray = await eventService.getEventsParameters(id)

        return res.status(StatusCodes.OK).json(returnArray)
    } catch (err) {
        console.error(error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
    }
})

router.delete('/:id', requireAuth, checkOwnership, async (req, res) => {
    const id_event = req.params.id;

    try {
        const deletedEvent = await eventService.deleteEvent(id_event);
        return res.status(StatusCodes.OK).json(deletedEvent);
    } catch (error) {
        console.error(error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
    }
});

router.post('/:id/enrollment', requireAuth, async (req, res) => {
    const id_user = req.user.id;
    const id_event = req.params.id;
    const { description, attended, observations, rating } = req.body;

    if (!id_user) {
        return res.status(StatusCodes.BAD_REQUEST).json({ message: 'User ID is required' });
    }
    if (!description || !attended || !observations || !rating) {
        return res.status(StatusCodes.BAD_REQUEST).json({ message: 'All fields are required' });
    }

    try {
        const event = await eventService.getOnlyEventParameters(id_event);
        
        if (!event) {
            return res.status(StatusCodes.NOT_FOUND).json({ message: 'Event not found' });
        }
        if (event.enabled_for_enrollment == 0) {
            return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Event is not enabled for enrollment' });
        }

        const date = new Date();
        if (new Date(event.start_date) < date) {
            return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Cannot enroll to an event that has already begun' });
        }

        const countEnrollment = await eventService.checkEventEnrollment(id_event);
        if (countEnrollment >= event.max_assistance) {
            return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Event is already full' });
        }
        const enrollment = await eventService.getEnrollment(id_user);
        if (enrollment.length > 0) {
            return res.status(StatusCodes.BAD_REQUEST).json({ message: 'User is already enrolled in this event' });
        }

        const eventData = [
            id_event,
            id_user,
            description,
            date.toISOString(),
            attended ? 1 : 0,
            observations,
            rating ? Number(rating) : null,
        ];

        const updatedEvent = await eventService.enrollmentEvent(eventData);
        return res.status(StatusCodes.OK).json(updatedEvent);
    } catch (error) {
        console.error(error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
    }
});

export default router;