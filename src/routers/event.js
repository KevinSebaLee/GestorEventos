import config from '../config/config.js'
import { ReasonPhrases, StatusCodes} from 'http-status-codes';
import { Router } from 'express';
import eventService from '../services/event.js'
import pkg from 'pg'

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