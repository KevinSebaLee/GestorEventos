import EventsManager from '../repos/event.js';

const repo = new EventsManager();

const getEvents = async () => {
    const allEvents = await repo.getEvents();

    return allEvents;
};

const getEventsParameters = async(id, nombre, fecha_inicio, tag) => {
    const events = (id) 
    ? await repo.getEventParameters(parseInt(id, 10))
    : await repo.getEventParameters(null, nombre, fecha_inicio, tag)

    return events
}

const getOnlyEventParameters = async(id) => {
    const event = await repo.getOnlyEventParameters(id);
    return event;
}

const getEventLocationsParameters = async(id) => {
    const locations = await repo.getEventLocationsParameters(id);
    return locations;
}

const createEvent = async(eventData) => {
    const newEvent = await repo.createEvent(eventData);

    return newEvent;
}

const updateEvent = async(eventData) => {
    const updatedEvent = await repo.updateEvent(eventData);

    return updatedEvent;
}

const deleteEvent = async(id) => {
    const deletedEvent = await repo.deleteEvent(id);
    
    return deletedEvent;
}

const enrollmentEvent = async(eventData) => {
    const updatedEvent = await repo.enrollmentEvent(eventData);

    return updatedEvent;
}

const checkEventEnrollment = async(id_event) => {
    const isEnrolled = await repo.checkEnrollmentEvent(id_event);

    return isEnrolled;
}

const getEnrollment = async(id_user) => {
    const enrollment = await repo.getEnrollment(id_user);
    
    return enrollment;
}

export default { getEvents, getEventsParameters, getOnlyEventParameters, createEvent, getEventLocationsParameters, updateEvent, deleteEvent, enrollmentEvent, checkEventEnrollment, getEnrollment };