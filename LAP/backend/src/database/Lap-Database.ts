import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { config } from 'dotenv';

config();

export default new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT ?? 3306),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  charset: 'utf8mb4',
  synchronize: false,
  logging: process.env.DB_LOGGING === 'true',
  entities: ['src/modules/**/*.entity.ts'],
  migrations: ['src/database/migrations/*.ts']
});
