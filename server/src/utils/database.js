import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { SQL_QUERIES } from './sqlQueries.js';

let dbPath;

if (process.env.DB_PATH) {
  dbPath = path.resolve(process.env.DB_PATH);
  
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
} else {
  // Default to .cueit directory in home directory
  const homeDir = process.env.HOME || process.env.USERPROFILE || '.';
  const cueitDir = path.join(homeDir, '.cueit');
  
  // Create .cueit directory if it doesn't exist
  if (!fs.existsSync(cueitDir)) {
    fs.mkdirSync(cueitDir, { recursive: true });
  }
  
  dbPath = path.join(cueitDir, 'cueit.db');
}

let db;

export const initDatabase = () => {
  try {
    console.log(`Initializing database at: ${dbPath}`);
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
    console.error('Database path:', dbPath);
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