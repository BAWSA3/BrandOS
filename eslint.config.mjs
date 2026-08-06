import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettierConfig from "eslint-config-prettier";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  prettierConfig,
  {
    rules: {
      "react/no-unescaped-entities": "warn",
      "@typescript-eslint/no-explicit-any": "warn",
      "react/jsx-no-comment-textnodes": "warn",
      "@next/next/no-html-link-for-pages": "warn",
      "@typescript-eslint/no-non-null-asserted-optional-chain": "warn",
      "@next/next/no-img-element": "warn",
      "react-hooks/rules-of-hooks": "warn",
      "react-hooks/exhaustive-deps": "warn",
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/purity": "warn",
      "react-hooks/globals": "warn",
      "react-hooks/refs": "warn",
      "react-hooks/no-deriving-state-in-effects": "warn",
      "react-hooks/set-state-in-render": "warn",
      "react-hooks/immutability": "warn",
      "react-hooks/hooks": "warn",
      "react-hooks/preserve-manual-memoization": "warn",
      "prefer-const": "warn",
      // Restrict service-role Supabase client to trusted server contexts.
      // See src/lib/supabase-admin.ts for the policy. Allowlist is enforced
      // via a per-directory override below — this rule is the default-deny.
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@/lib/supabase-admin",
              message:
                "createAdminClient bypasses RLS. Allowed only in src/app/api/cron/**, src/app/api/stripe/webhook/**, and src/app/api/admin/**. See src/lib/supabase-admin.ts.",
            },
          ],
        },
      ],
    },
  },
  // Allowlist: paths permitted to import the service-role client.
  {
    files: [
      "src/app/api/cron/**/*.{ts,tsx}",
      "src/app/api/stripe/webhook/**/*.{ts,tsx}",
      "src/app/api/admin/**/*.{ts,tsx}",
      // account deletion: admin client used ONLY for auth.admin.deleteUser on
      // the session user's own auth record — see route header comment
      "src/app/api/account/**/*.{ts,tsx}",
    ],
    rules: {
      "no-restricted-imports": "off",
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "superpowers/**",
    "remotion-bbb/**",
    "remotion-brandos/**",
    "chrome-extension/**",
    "my-video/**",
    "scripts/**",
    "src/lib/gsap/**",
  ]),
]);

export default eslintConfig;
