import {
  getPublicOrigin,
  metadataCorsOptionsRequestHandler,
  protectedResourceHandler,
} from 'mcp-handler';
import { AUTH_ISSUER } from '@/lib/mcp/auth';

// RFC 9728 protected resource metadata for the MCP server (/api/mcp): tells
// Claude / ChatGPT / Cursor that sign-in goes through BrandOS's Supabase Auth
// (OAuth 2.1). Also served at the path-suffixed form
// (/.well-known/oauth-protected-resource/api/mcp) some clients probe.

const handler = (req: Request) =>
  protectedResourceHandler({
    authServerUrls: [AUTH_ISSUER],
    resourceUrl: `${getPublicOrigin(req)}/api/mcp`,
  })(req);

export { handler as GET };
export const OPTIONS = metadataCorsOptionsRequestHandler();
