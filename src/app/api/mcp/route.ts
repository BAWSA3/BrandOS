import { createMcpHandler, withMcpAuth } from 'mcp-handler';
import { registerBrandTools } from '@/lib/mcp/tools';
import { verifyMcpToken } from '@/lib/mcp/auth';

// BrandOS MCP server: "your brand, inside every AI you use".
// Connect: { "brandos": { "url": "https://mybrandos.app/api/mcp",
//            "headers": { "Authorization": "Bearer bos_..." } } }  (key optional for scan_brand)

export const maxDuration = 60;

function buildHandler(origin: string) {
  return createMcpHandler(
    (server) => {
      registerBrandTools(server, origin);
    },
    { serverInfo: { name: 'brandos', version: '1.0.0' } }
  );
}

async function handle(req: Request): Promise<Response> {
  const origin = new URL(req.url).origin;
  const authed = withMcpAuth(buildHandler(origin), verifyMcpToken, { required: false });
  return authed(req);
}

export { handle as GET, handle as POST, handle as DELETE };
