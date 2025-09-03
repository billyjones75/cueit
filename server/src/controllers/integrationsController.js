import { getDatabase } from '../utils/database.js';
import { SQL_QUERIES } from '../utils/sqlQueries.js';

// GET /integrations - Get MCP integrations
export const getIntegrations = async (req, res) => {
  try {
    const db = getDatabase();
    
    const integrations = db.prepare(SQL_QUERIES.GET_ALL_MCP_INTEGRATIONS).all();
    
    res.json({ integrations });
  } catch (error) {
    console.error('Integrations error:', error);
    res.status(500).json({ error: 'Failed to fetch integrations' });
  }
};
