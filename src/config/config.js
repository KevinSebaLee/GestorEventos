import dotenv from 'dotenv';

dotenv.config();

const config = {
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: Number(process.env.DB_PORT) // Make sure it's a number
};

export default config;