import config from '../config/config.js'
import { ReasonPhrases, StatusCodes} from 'http-status-codes';
import { Router } from 'express';
import eventService from '../services/event.js'
import { requireAuth } from '../middleware/auth.js';
import pkg from 'pg'
import { validateEvent } from '../middleware/regex.js';

const router = Router()

const { Pool }  = pkg;
const pool = new Pool(config)

router.get('/', async (req, res) => {
    const {nombre, fecha_inicio, tag} = req.query

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

    if(!name || !description){
        return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Name and description are required' });
    }

    const eventLocation = await eventService.getEventLocationsParameters(id_event_location);

    if(max_assistance < eventLocation[0].max_assistance){
        return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Max assistance must be lower than the location limit' });
    }

    if(price < 0 || isNaN(price) || duration_in_minutes < 0 || isNaN(duration_in_minutes)){
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



router.get('/:id', async(req, res) => {
    const id = req.params.id

    try{
        const returnArray = await eventService.getEventsParameters(id)

        return res.status(StatusCodes.OK).json(returnArray)
    }catch(err){
        console.error(error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
    }
})

export default router;