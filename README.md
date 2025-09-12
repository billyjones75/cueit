# Cueit - A lightweight Kanban board for LLMs

Cueit is a Kanban board tool that lets LLMs manage, update, and organize tasks via an MCP server.

![Demo](https://i.imgur.com/6Z4GSu6.gif)

## Prerequisites

- node 20.19+
- npm 10.8+

## Quick Start

![Demo](https://i.imgur.com/eARNps9.gif)

You can run Cueit directly without cloning the repository:

```bash
npx cueit
```

This will download and run the latest version of Cueit.
You can access the UI at http://localhost:3000 and the MCP server at http://localhost:3000/mcp.
See [MCP Configuration](#mcp-configuration) to set up the LLM integration.

## Installation & Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/billyjones75/cueit.git
   cd cueit
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables (optional)**
   ```bash
   cp server/env.example server/.env
   ```

   Edit `server/.env` and set your desired port:
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

Cueit runs an MCP server that allows LLMs to interact with your local Kanban board. Here's an example configuration for the Cursor IDE:

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
3. Make sure to enable it using the toggle switch
4. It should show the list of tools available

## MCP Capabilities

The MCP server provides the following tools:

- **Project Management**: List, create, and manage projects
- **Task/Subtask Operations**: Create, read, update, and delete tasks and subtasks
- **Bulk Operations**: Create multiple tasks or subtasks at once

## Storage

The application uses SQLite to store data locally. The database file is automatically created as `~/.cueit/cueit.db` when you first run the application. No data is ever sent to the cloud.

## Version History & Backup

Cueit automatically creates backups of your board state whenever you make significant changes (you can also do it manually). Access the version history through the menu to restore any previous state of your board.

![verison](https://i.imgur.com/JSgNUs5.png)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the GPL-3.0 License.

## Support

For issues and questions, please open an issue on the GitHub repository.
