import config from '../config/config.js'
import { ReasonPhrases, StatusCodes } from 'http-status-codes';
import _ from 'lodash';
import { Router } from 'express';
import eventService from '../services/event.js'
import { requireAuth } from '../middleware/auth.js';
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

router.put('/:id', requireAuth, validateEvent, async (req, res) => {
    const { id } = req.user;
    const id_event = req.params.id;
    const { name, description, id_event_categoria, id_event_location, start_date, duration_in_minutes, price, enabled_for_enrollment, max_assistance } = req.body;

    const event = await eventService.getOnlyEventParameters(id_event);

    if (!id_event || event === undefined || event.length === 0) {
        return res.status(StatusCodes.NOT_FOUND).json({ message: 'Event ID is required' });
    }

    if (id != event.id_creator_user) {
        return res.status(StatusCodes.FORBIDDEN).json({ message: 'User isn\'t the owner of this event' });
    }

    // Normalize the event from database for comparison
    const normalizedEvent = {
        id: Number(event.id),
        name: String(event.name),
        description: String(event.description),
        id_event_category: Number(event.id_event_category),
        id_event_location: Number(event.id_event_location),
        start_date: new Date(event.start_date),
        duration_in_minutes: Number(event.duration_in_minutes),
        price: Number(event.price),
        enabled_for_enrollment: Number(event.enabled_for_enrollment),
        max_assistance: Number(event.max_assistance),
        id_creator_user: Number(event.id_creator_user)
    };

    const eventToChange = {
        id: Number(id_event),
        name: String(name),
        description: String(description),
        id_event_category: Number(id_event_categoria),
        id_event_location: Number(id_event_location),
        start_date: new Date(start_date),
        duration_in_minutes: Number(duration_in_minutes),
        price: Number(price),
        enabled_for_enrollment: Number(enabled_for_enrollment ? 1 : 0),
        max_assistance: Number(max_assistance),
        id_creator_user: Number(id)
    };

    console.log('Database event:', normalizedEvent);
    console.log('Event to change:', eventToChange);
    
    console.log('Database start_date:', normalizedEvent.start_date);
    console.log('New start_date:', eventToChange.start_date);
    console.log('Are dates equal?', normalizedEvent.start_date.getTime() === eventToChange.start_date.getTime());

    const isSame = _.isEqual(normalizedEvent, eventToChange);

    console.log(isSame)

    if (isSame) {
        return res.status(StatusCodes.BAD_REQUEST).json({ message: 'No changes detected' });
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

    try {
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

export default router;