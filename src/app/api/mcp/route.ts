import { createMcpHandler } from 'mcp-handler';
import { registerBrandTools } from '@/lib/mcp/tools';

// BrandOS MCP server: paste an X post, get a taste + brand breakdown.
// Works in Claude and ChatGPT as a remote connector, no key needed:
//   https://mybrandos.app/api/mcp

export const maxDuration = 60;

async function handle(req: Request): Promise<Response> {
  const origin = new URL(req.url).origin;
  const handler = createMcpHandler(
    (server) => {
      registerBrandTools(server, origin);
    },
    {
      serverInfo: { name: 'brandos', version: '1.0.0' },
      instructions:
        'BrandOS reads taste and brand focus on X. Use analyze_post when the user shares an X post link, ' +
        'analyze_profile for a handle. Present the breakdown as given; suggest, never rewrite their posts.',
    }
  );
  return handler(req);
}

export { handle as GET, handle as POST, handle as DELETE };
