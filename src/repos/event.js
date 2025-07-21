import event from '../services/event.js';
import config from './../config/config.js';
import pkg from "pg";

const { Pool } = pkg;
const pool = new Pool(config);

export default class EventsManager {
    getEvents = async () => {
        try {
            const result = await pool.query(`
                SELECT 
                    e.id AS id,
                    e.name AS evento_nombre,
                    e.description,
                    e.start_date,
                    e.id_creator_user,
                    u.last_name,
                    u.first_name,
                    u.username,
                    el.id AS ubicacion_id,
                    el.name AS ubicacion_nombre,
                    el.latitude,
                    el.longitude
                FROM events e
                INNER JOIN users u ON u.id = e.id_creator_user
                INNER JOIN event_locations el ON el.id = e.id_event_location
                ORDER BY e.id
            `);

            return result.rows;
        } catch (err) {
            console.error(err);
            return [];
        }
    }

    getEventParameters = async (id, username, start_date, tag) => {        
        try {
            const query = `
                SELECT 
                    e.id AS id,
                    e.name AS evento_nombre,
                    e.description,
                    e.start_date,
                    e.id_creator_user,
                    u.last_name,
                    u.first_name,
                    u.username,
                    el.id AS ubicacion_id,
                    el.name AS ubicacion_nombre,
                    el.latitude,
                    el.longitude,
                    array_agg(t.name) AS tags
                FROM events e
                INNER JOIN users u ON u.id = e.id_creator_user
                LEFT JOIN event_locations el ON el.id = e.id_event_location
                LEFT JOIN event_tags et ON et.id_event = e.id
                LEFT JOIN tags t ON t.id = et.id_tag
                WHERE
                    (
                        $4::integer IS NOT NULL
                        AND e.id = $4
                    )
                    OR
                    (
                        $4::integer IS NULL
                        AND ($1::varchar IS NULL OR u.first_name = $1)
                        AND ($2::date IS NULL OR e.start_date = $2)
                        AND ($3::varchar IS NULL OR t.name = $3)
                    )
                GROUP BY e.id, e.name, e.description, e.start_date, e.id_creator_user, u.last_name, u.first_name, u.username, el.id, el.name, el.latitude, el.longitude
                ORDER BY e.id
            `;

            const result = await pool.query(query, [username, start_date, tag, id]);

            return result.rows;
        } catch (err) {
            console.error(err);
            return [];
        }
    }

    getOnlyEventParameters = async (id) => {
        try {
            const result = await pool.query(`
                SELECT *
                FROM events
                WHERE id = $1
            `, [id]);

            return result.rows[0];
        } catch (err) {
            console.error(err);
            return null;
        }
    }

    getEventLocationsParameters = async (id) => {
        try {
            const result = await pool.query(`
                SELECT *
                FROM event_locations
                WHERE id = $1
                ORDER BY id
            `, [id]
            );

            return result.rows;
        } catch (err) {
            console.error(err);
            return [];
        }
    }

    createEvent = async (eventData) => {
        try {
            const query = `
                INSERT INTO events (name, description, id_event_category, id_event_location, start_date, duration_in_minutes, price, enabled_for_enrollment, max_assistance, id_creator_user)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                RETURNING id
            `;

            const result = await pool.query(query, eventData);
            return result.rows[0];
        } catch (err) {
            console.error(err);
            throw new Error('Error creating event');
        }
    }

    updateEvent = async(eventData) => {
        try{
            const query = `
                UPDATE events
                SET
                    name = COALESCE($1, name),
                    description = COALESCE($2, description),
                    id_event_category = COALESCE($3, id_event_category),
                    id_event_location = COALESCE($4, id_event_location),
                    start_date = COALESCE($5::timestamp, start_date),
                    duration_in_minutes = COALESCE($6, duration_in_minutes),
                    price = COALESCE($7, price),
                    enabled_for_enrollment = COALESCE($8, enabled_for_enrollment),
                    max_assistance = COALESCE($9, max_assistance)
                WHERE id = $10
            `;

            const result = await pool.query(query, eventData);

            return { message: 'Event updated successfully' };
        }catch(err)
        {
            console.error(err)
            throw new Error('Error updating event')
        }
    }

    deleteEvent = async (id) => {
        try {
            const query = `
                DELETE FROM events
                WHERE id = $1
            `;

            await pool.query(query, [id]);
            return { message: 'Event deleted successfully' };
        } catch (err) {
            console.error(err);
            throw new Error('Error deleting event');
        }
    }
}