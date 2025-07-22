import EventLocationManager from '../repos/event-location.js';

const repo = new EventLocationManager();

const getEventLocations = async () => {
    const allLocations = await repo.getEventLocations();

    return allLocations;
};

const getEventLocationParameters = async (id) => {
    const location = await repo.getEventLocationParameters(id);

    return location;
};

const createEventLocation = async (locationData) => {
    const newLocationId = await repo.createEventLocation(locationData);

    return newLocationId;
};

export default { getEventLocations, getEventLocationParameters, createEventLocation };