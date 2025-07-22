import config from './../config/config.js';
import pkg from "pg";

const { Pool } = pkg;
const pool = new Pool(config);

export default class EventLocationManager {
    getEventLocations = async () => {
        try {
            const query = `
                SELECT *
                FROM event_locations
                ORDER BY id
            `;
            
            const result = await pool.query(query);
            return result.rows;
        } catch (error) {
            console.error('Error fetching event locations:', error);
            throw error;
        }
    }

    getEventLocationParameters = async (id) => {
        try {
            const query = `
                SELECT *
                FROM event_locations
                WHERE id = $1
                ORDER BY id
            `;
            
            const result = await pool.query(query, [id]);
            return result.rows[0];
        } catch (error) {
            console.error('Error fetching event location parameters:', error);
            throw error;
        }
    }

    createEventLocation = async (locationData) => {
        try {
            const query = `
                INSERT INTO event_locations (id_location, name, full_address, max_capacity, latitude, longitude, id_creator_user)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING id
            `;
            
            const result = await pool.query(query, locationData);
            return result.rows[0].id;
        } catch (error) {
            console.error('Error creating event location:', error);
            throw error;
        }
    }
}