import EventsManager from '../repos/event.js';

const repo = new EventsManager();

const getEvents = async () => {
    const allEvents = await repo.getEvents();

    return allEvents;
};

const getEventsParameters = async(id, nombre, fecha_inicio, tag) => {
    console.log(id)

    const events = (id) 
    ? await repo.getEventParameters(parseInt(id, 10))
    : await repo.getEventParameters(null, nombre, fecha_inicio, tag)

    return events
}

export default { getEvents, getEventsParameters };