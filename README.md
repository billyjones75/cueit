# Cueit - A lightweight Kanban board for LLMs

Cueit is a Kanban board tool that lets LLMs manage, update, and organize tasks via an MCP server.

## Prerequisites

- node 20.19+
- npm 10.8+

## Installation & Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd cueit
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables (optional)**
   ```bash
   cd server
   cp env.example .env
   ```

   Edit `.env` and set your desired port:
   ```
   SERVER_PORT=3000
   ```

4. **Run the app**
   ```bash
   npm run start
   ```

   This will start both the app and MCP server:
   - Access the UI at http://localhost:3000
   - MCP Endpoint: http://localhost:3000/mcp

## MCP Configuration

Cueit includes an MCP server that allows LLMs to interact with your local Kanban board. Here's an example configuration for the Cursor IDE:

### 1. Create MCP Configuration File

Create a file at (or modify it) `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "cueit": {
      "url": "http://localhost:3000/mcp",
      "headers": {
        "MCP-Client": "Cursor"
      }
    }
  }
}
```

### 2. Alternative Configuration (HTTP Transport)

If you prefer using the HTTP transport directly:

```json
{
  "mcpServers": {
    "cueit": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "http://localhost:3000/mcp", "--header", "MCP-Client:Cursor"]
    }
  }
}
```

### 3. Verify Integration

1. Go to **Cursor Settings** > **Tools & Integrations**
2. You should see the Cueit tool under the MCP Tools
3. Make sure to enable it using the toggle swith
4. It should show the list of tools available

## MCP Capabilities

The MCP server provides the following tools:

- **Project Management**: List, create, and manage projects
- **Task Operations**: Create, read, update, and delete tasks
- **Column Management**: View and manage board columns
- **Bulk Operations**: Create multiple tasks at once
- **Status Tracking**: Monitor task progress across columns

## Storage

The application uses SQLite to store data locally. The database file is automatically created in the `server/data/` directory when you first run the application. No data is ever sent to the cloud.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the GPL-3.0 License.

## Support

For issues and questions, please open an issue on the GitHub repository.
