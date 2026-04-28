import { DataSource } from 'typeorm';
import * as path from 'path';
import * as dotenv from 'dotenv';

const env = process.env.NODE_ENV;
const envFile =
  env === 'production'
    ? '.env.production'
    : env === 'development'
      ? '.env.development'
      : '.env.local';

dotenv.config({ path: path.resolve(process.cwd(), envFile) });

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  entities: [path.join(__dirname, '../**/*.entity.{ts,js}')],
  migrations: [path.join(__dirname, './migrations/*.{ts,js}')],
  synchronize: false,
});
