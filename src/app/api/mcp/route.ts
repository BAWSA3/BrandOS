import { createMcpHandler, withMcpAuth } from 'mcp-handler';
import { registerBrandTools } from '@/lib/mcp/tools';
import { verifyMcpToken } from '@/lib/mcp/auth';

// BrandOS MCP server: paste an X post, get a taste + brand breakdown.
// Add it in Claude / ChatGPT / Cursor as a remote connector:
//   https://mybrandos.app/api/mcp
// Needs a BrandOS account: an unauthenticated call gets a 401 pointing at
// /.well-known/oauth-protected-resource, and the client runs "Sign in with
// BrandOS" (Supabase OAuth 2.1, consent at /oauth/consent). Usage limits live
// in src/lib/mcp/usage.ts.

export const maxDuration = 60;

async function handle(req: Request): Promise<Response> {
  const origin = new URL(req.url).origin;
  const handler = createMcpHandler(
    (server) => {
      registerBrandTools(server, origin);
    },
    {
      serverInfo: { name: 'brandos', version: '1.1.0' },
      instructions:
        'BrandOS reads taste and brand focus on X. Use analyze_post when the user shares an X post link, ' +
        'analyze_profile for a handle. Present the breakdown as given, including its links and the final ' +
        'BrandOS usage line; suggest, never rewrite their posts.',
    }
  );
  return handler(req);
}

const authed = withMcpAuth(handle, verifyMcpToken, { required: true });

export { authed as GET, authed as POST, authed as DELETE };
