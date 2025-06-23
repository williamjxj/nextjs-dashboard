# VSCode MCP Configuration

This directory contains configuration for Model Context Protocol (MCP) servers.

## Setup Instructions

1. **Copy the template file:**
   ```bash
   cp mcp.json.template mcp.json
   ```

2. **Replace the placeholder values in `mcp.json`:**
   - `YOUR_DEEPSEER_API_KEY_HERE` - Your DeepSeer API key
   - `YOUR_EXA_API_KEY_HERE` - Your Exa API key  
   - `YOUR_STRIPE_TEST_API_KEY_HERE` - Your Stripe test API key
   - Database connection string with your actual credentials

3. **The `mcp.json` file is gitignored** to prevent accidentally committing secrets.

## Available MCP Servers

- **context7**: Upstash Context7 for code context
- **taskmaster-ai**: Task management AI
- **exa**: Exa search API
- **postgres**: PostgreSQL database connection
- **stripe**: Stripe payment processing
- **magic**: 21st.dev Magic tools
- **memory**: Claude memory server

## Security Note

⚠️ **Never commit `mcp.json` with real API keys to version control!**

The actual `mcp.json` file is excluded from git to prevent accidental exposure of API keys and secrets.
