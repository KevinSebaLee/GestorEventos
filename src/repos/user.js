import config from './../config/config.js';
import pkg from "pg";

const { Pool } = pkg;
const pool = new Pool(config);

export default class UsersManager {
    getUserParameters = async (id, username) => {
        try {
            let query = `
                SELECT 
                    u.id, 
                    u.username, 
                    u.first_name, 
                    u.last_name
                FROM users u
                WHERE
                    ($1::integer IS NOT NULL AND u.id = $1)
                    OR
                    ($1::integer IS NULL AND ($2::varchar IS NULL OR u.username = $2))
            `;
            const result = await pool.query(query, [id, username]);
            return result.rows;
        } catch (err) {
            console.error(err);
            return [];
        }
    }

    createUser = async ({ username, password, firstName, lastName }) => {
        try {
            const query = `
                INSERT INTO users (username, password, first_name, last_name)
                VALUES ($1, $2, $3, $4)
                RETURNING id
            `;
            
            const result = await pool.query(query, [username, password, firstName, lastName]);
            return result.rows[0].id;
        } catch (err) {
            console.error(err);
            throw new Error('Error creating user');
        }
    }   
}