import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { SQL_QUERIES } from './sqlQueries.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '../../data/plann3r.db');

let db;

export const initDatabase = () => {
  try {
    db = new Database(dbPath);
    
    // Create tables using SQL queries from separate file
    db.exec(SQL_QUERIES.CREATE_PROJECTS_TABLE);
    db.exec(SQL_QUERIES.CREATE_COLUMNS_TABLE);
    db.exec(SQL_QUERIES.CREATE_TASKS_TABLE);
    db.exec(SQL_QUERIES.CREATE_SUBTASKS_TABLE);
    db.exec(SQL_QUERIES.CREATE_MCP_INTEGRATIONS_TABLE);
    db.exec(SQL_QUERIES.CREATE_PROJECT_HISTORY_TABLE);
    
    // Create indexes
    SQL_QUERIES.CREATE_INDEXES.forEach(indexQuery => {
      db.exec(indexQuery);
    });

    console.log('Database initialized successfully');
    return db;
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
};

export const getDatabase = () => {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
};

export const closeDatabase = () => {
  if (db) {
    db.close();
    db = null;
  }
}; 