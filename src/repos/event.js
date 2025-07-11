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
            let query = `
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
                INNER JOIN event_locations el ON el.id = e.id_event_location
                INNER JOIN event_tags et ON et.id_event = e.id
                INNER JOIN tags t ON t.id = et.id_tag
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
}