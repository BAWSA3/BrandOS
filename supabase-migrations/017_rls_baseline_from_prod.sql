-- ============================================================================
-- Migration: RLS baseline, captured from prod
-- Date: 2026-10-02
--
-- Prod's row-level security was largely configured outside source control:
-- 112 of its policies existed in no file in this repo. That's how the staging
-- DB ended up with RLS OFF on ~30 tables after it was rebuilt. This file is
-- prod's live state (pg_policies + RLS flags + the helper functions those
-- policies call), generated read-only from prod, so any DB can be brought to
-- the same security baseline.
--
-- Idempotent: CREATE OR REPLACE for functions, DROP POLICY IF EXISTS before
-- each CREATE POLICY. On prod it is a no-op. Run AFTER 001-016.
-- Excludes the VERITY tables that share prod's DB (signup_attempts, signup_audit_log, tier_roll_log, tier_supply, trainer_signups, user_profiles_pre016).
-- ============================================================================

-- Helper functions referenced by the policies below (6)

CREATE OR REPLACE FUNCTION public.current_app_user_id()
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT id FROM "User" WHERE "supabaseId" = auth.uid()::text
$function$;

CREATE OR REPLACE FUNCTION public.current_auth_uid()
 RETURNS uuid
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'pg_catalog'
AS $function$ select auth.uid(); $function$;

CREATE OR REPLACE FUNCTION public.current_user_admin_workspace_ids()
 RETURNS SETOF uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT workspace_id FROM "WorkspaceMember"
  WHERE user_id = (SELECT id FROM "User" WHERE "supabaseId" = auth.uid()::text)
    AND role IN ('owner', 'admin')
$function$;

CREATE OR REPLACE FUNCTION public.current_user_workspace_ids()
 RETURNS SETOF uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT workspace_id FROM "WorkspaceMember"
  WHERE user_id = (SELECT id FROM "User" WHERE "supabaseId" = auth.uid()::text)
$function$;

CREATE OR REPLACE FUNCTION public.is_team_member(p_team_id text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
  select exists (
    select 1 from public."TeamMember" tm
    where tm."teamId" = p_team_id and tm."userId" = (select public.current_auth_uid())::text
  );
$function$;

CREATE OR REPLACE FUNCTION public.user_owns_active_x_connection(p_connection_id text, p_workspace_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM "PlatformConnection"
    WHERE id = p_connection_id
      AND "userId" = (SELECT id FROM "User" WHERE "supabaseId" = auth.uid()::text)
      AND workspace_id = p_workspace_id
      AND status = 'active'
      AND platform = 'x'
  )
$function$;

-- Enable RLS (45 tables)
ALTER TABLE public."ApiKey" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ApprovalRequest" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."AuditReportShare" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."AuditReportShareView" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Brand" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."BrandContent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."BrandHealthSnapshot" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."BrandScan" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."BrandScans" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."BrandTweet" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."BrandVisualDNA" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ContentDraft" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ContentNiche" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."CustomWorld" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."DailyBrief" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."DriftAlert" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."EmailSignup" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Feedback" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."GapAnalysis" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."HistoryEntry" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."InviteCode" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."OnchainAttestation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."OppEmailCaptures" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."OppMatchups" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."OppPairings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."PerformanceSnapshot" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."PlanLimit" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."PlatformConnection" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ProcessedWebhook" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Purchase" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ResearchRun" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ResearchSourceConfig" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ResearchTopic" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."SecurityAuditLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."SharedBrand" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Team" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."TeamMember" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."TopicSelection" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."UserSession" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ViralBenchmark" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Workspace" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."WorkspaceMember" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."XProfileCache" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."user_profiles" ENABLE ROW LEVEL SECURITY;

-- Policies (134)

DROP POLICY IF EXISTS "apikey_admin_only" ON public."ApiKey";
CREATE POLICY "apikey_admin_only" ON public."ApiKey"
  AS PERMISSIVE FOR ALL TO "authenticated"
  USING (((auth.jwt() ->> 'user_role'::text) = 'admin'::text))
  WITH CHECK (((auth.jwt() ->> 'user_role'::text) = 'admin'::text));

DROP POLICY IF EXISTS "ar_delete" ON public."ApprovalRequest";
CREATE POLICY "ar_delete" ON public."ApprovalRequest"
  AS PERMISSIVE FOR DELETE TO "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM "Brand" b
  WHERE ((b.id = "ApprovalRequest"."brandId") AND ((b."userId" = (( SELECT auth.uid() AS uid))::text) OR ((b."teamId" IS NOT NULL) AND is_team_member(b."teamId")) OR (EXISTS ( SELECT 1
           FROM "SharedBrand" sb
          WHERE ((sb."brandId" = b.id) AND (sb."userId" = (( SELECT auth.uid() AS uid))::text) AND (sb.permission = 'edit'::text)))))))));

DROP POLICY IF EXISTS "ar_insert" ON public."ApprovalRequest";
CREATE POLICY "ar_insert" ON public."ApprovalRequest"
  AS PERMISSIVE FOR INSERT TO "authenticated"
  WITH CHECK ((("submittedById" = (( SELECT auth.uid() AS uid))::text) AND (EXISTS ( SELECT 1
   FROM "Brand" b
  WHERE ((b.id = "ApprovalRequest"."brandId") AND ((b."userId" = (( SELECT auth.uid() AS uid))::text) OR ((b."teamId" IS NOT NULL) AND is_team_member(b."teamId")) OR (EXISTS ( SELECT 1
           FROM "SharedBrand" sb
          WHERE ((sb."brandId" = b.id) AND (sb."userId" = (( SELECT auth.uid() AS uid))::text) AND (sb.permission = 'edit'::text))))))))));

DROP POLICY IF EXISTS "ar_select" ON public."ApprovalRequest";
CREATE POLICY "ar_select" ON public."ApprovalRequest"
  AS PERMISSIVE FOR SELECT TO "authenticated"
  USING ((("submittedById" = (( SELECT auth.uid() AS uid))::text) OR (COALESCE("reviewedById", ''::text) = (( SELECT auth.uid() AS uid))::text) OR (EXISTS ( SELECT 1
   FROM "Brand" b
  WHERE ((b.id = "ApprovalRequest"."brandId") AND ((b."isPublic" = true) OR (b."userId" = (( SELECT auth.uid() AS uid))::text) OR ((b."teamId" IS NOT NULL) AND is_team_member(b."teamId")) OR (EXISTS ( SELECT 1
           FROM "SharedBrand" sb
          WHERE ((sb."brandId" = b.id) AND (sb."userId" = (( SELECT auth.uid() AS uid))::text))))))))));

DROP POLICY IF EXISTS "ar_update" ON public."ApprovalRequest";
CREATE POLICY "ar_update" ON public."ApprovalRequest"
  AS PERMISSIVE FOR UPDATE TO "authenticated"
  USING (((("submittedById" = (( SELECT auth.uid() AS uid))::text) OR (COALESCE("reviewedById", ''::text) = (( SELECT auth.uid() AS uid))::text)) AND (EXISTS ( SELECT 1
   FROM "Brand" b
  WHERE ((b.id = "ApprovalRequest"."brandId") AND ((b."userId" = (( SELECT auth.uid() AS uid))::text) OR ((b."teamId" IS NOT NULL) AND is_team_member(b."teamId")) OR (EXISTS ( SELECT 1
           FROM "SharedBrand" sb
          WHERE ((sb."brandId" = b.id) AND (sb."userId" = (( SELECT auth.uid() AS uid))::text) AND (sb.permission = 'edit'::text))))))))))
  WITH CHECK (((("submittedById" = (( SELECT auth.uid() AS uid))::text) OR (COALESCE("reviewedById", ''::text) = (( SELECT auth.uid() AS uid))::text)) AND (EXISTS ( SELECT 1
   FROM "Brand" b
  WHERE ((b.id = "ApprovalRequest"."brandId") AND ((b."userId" = (( SELECT auth.uid() AS uid))::text) OR ((b."teamId" IS NOT NULL) AND is_team_member(b."teamId")) OR (EXISTS ( SELECT 1
           FROM "SharedBrand" sb
          WHERE ((sb."brandId" = b.id) AND (sb."userId" = (( SELECT auth.uid() AS uid))::text) AND (sb.permission = 'edit'::text))))))))));

DROP POLICY IF EXISTS "ars_insert_workspace_member" ON public."AuditReportShare";
CREATE POLICY "ars_insert_workspace_member" ON public."AuditReportShare"
  AS PERMISSIVE FOR INSERT TO "authenticated"
  WITH CHECK (((created_by_user_id = current_app_user_id()) AND (workspace_id IN ( SELECT current_user_workspace_ids() AS current_user_workspace_ids))));

DROP POLICY IF EXISTS "ars_select_workspace_member" ON public."AuditReportShare";
CREATE POLICY "ars_select_workspace_member" ON public."AuditReportShare"
  AS PERMISSIVE FOR SELECT TO "authenticated"
  USING ((workspace_id IN ( SELECT current_user_workspace_ids() AS current_user_workspace_ids)));

DROP POLICY IF EXISTS "ars_update_creator" ON public."AuditReportShare";
CREATE POLICY "ars_update_creator" ON public."AuditReportShare"
  AS PERMISSIVE FOR UPDATE TO "authenticated"
  USING ((created_by_user_id = ( SELECT "User".id
   FROM "User"
  WHERE ("User"."supabaseId" = (auth.uid())::text))));

DROP POLICY IF EXISTS "brand_owner_delete" ON public."Brand";
CREATE POLICY "brand_owner_delete" ON public."Brand"
  AS PERMISSIVE FOR DELETE TO "authenticated"
  USING ((("userId" = (( SELECT auth.uid() AS uid))::text) OR (("teamId" IS NOT NULL) AND is_team_member("teamId"))));

DROP POLICY IF EXISTS "brand_owner_insert" ON public."Brand";
CREATE POLICY "brand_owner_insert" ON public."Brand"
  AS PERMISSIVE FOR INSERT TO "authenticated"
  WITH CHECK ((("userId" = (( SELECT auth.uid() AS uid))::text) OR (("teamId" IS NOT NULL) AND is_team_member("teamId"))));

DROP POLICY IF EXISTS "brand_owner_read" ON public."Brand";
CREATE POLICY "brand_owner_read" ON public."Brand"
  AS PERMISSIVE FOR SELECT TO "authenticated"
  USING ((COALESCE(("userId" = (( SELECT auth.uid() AS uid))::text), false) OR (("teamId" IS NOT NULL) AND is_team_member("teamId")) OR (EXISTS ( SELECT 1
   FROM "SharedBrand" sb
  WHERE ((sb."brandId" = "Brand".id) AND (sb."userId" = (( SELECT auth.uid() AS uid))::text))))));

DROP POLICY IF EXISTS "brand_owner_update" ON public."Brand";
CREATE POLICY "brand_owner_update" ON public."Brand"
  AS PERMISSIVE FOR UPDATE TO "authenticated"
  USING ((("userId" = (( SELECT auth.uid() AS uid))::text) OR (("teamId" IS NOT NULL) AND is_team_member("teamId")) OR (EXISTS ( SELECT 1
   FROM "SharedBrand" sb
  WHERE ((sb."brandId" = "Brand".id) AND (sb."userId" = (( SELECT auth.uid() AS uid))::text) AND (sb.permission = 'edit'::text))))))
  WITH CHECK ((("userId" = (( SELECT auth.uid() AS uid))::text) OR (("teamId" IS NOT NULL) AND is_team_member("teamId")) OR (EXISTS ( SELECT 1
   FROM "SharedBrand" sb
  WHERE ((sb."brandId" = "Brand".id) AND (sb."userId" = (( SELECT auth.uid() AS uid))::text) AND (sb.permission = 'edit'::text))))));

DROP POLICY IF EXISTS "brand_public_read" ON public."Brand";
CREATE POLICY "brand_public_read" ON public."Brand"
  AS PERMISSIVE FOR SELECT TO "anon", "authenticated"
  USING (("isPublic" = true));

DROP POLICY IF EXISTS "bc_delete" ON public."BrandContent";
CREATE POLICY "bc_delete" ON public."BrandContent"
  AS PERMISSIVE FOR DELETE TO "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM "Brand" b
  WHERE ((b.id = "BrandContent"."brandId") AND ((b."userId" = (( SELECT auth.uid() AS uid))::text) OR ((b."teamId" IS NOT NULL) AND is_team_member(b."teamId")) OR (EXISTS ( SELECT 1
           FROM "SharedBrand" sb
          WHERE ((sb."brandId" = b.id) AND (sb."userId" = (( SELECT auth.uid() AS uid))::text) AND (sb.permission = 'edit'::text)))))))));

DROP POLICY IF EXISTS "bc_insert" ON public."BrandContent";
CREATE POLICY "bc_insert" ON public."BrandContent"
  AS PERMISSIVE FOR INSERT TO "authenticated"
  WITH CHECK ((EXISTS ( SELECT 1
   FROM "Brand" b
  WHERE ((b.id = "BrandContent"."brandId") AND ((b."userId" = (( SELECT auth.uid() AS uid))::text) OR ((b."teamId" IS NOT NULL) AND is_team_member(b."teamId")) OR (EXISTS ( SELECT 1
           FROM "SharedBrand" sb
          WHERE ((sb."brandId" = b.id) AND (sb."userId" = (( SELECT auth.uid() AS uid))::text) AND (sb.permission = 'edit'::text)))))))));

DROP POLICY IF EXISTS "bc_select" ON public."BrandContent";
CREATE POLICY "bc_select" ON public."BrandContent"
  AS PERMISSIVE FOR SELECT TO "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM "Brand" b
  WHERE ((b.id = "BrandContent"."brandId") AND ((b."isPublic" = true) OR (b."userId" = (( SELECT auth.uid() AS uid))::text) OR ((b."teamId" IS NOT NULL) AND is_team_member(b."teamId")) OR (EXISTS ( SELECT 1
           FROM "SharedBrand" sb
          WHERE ((sb."brandId" = b.id) AND (sb."userId" = (( SELECT auth.uid() AS uid))::text)))))))));

DROP POLICY IF EXISTS "bc_update" ON public."BrandContent";
CREATE POLICY "bc_update" ON public."BrandContent"
  AS PERMISSIVE FOR UPDATE TO "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM "Brand" b
  WHERE ((b.id = "BrandContent"."brandId") AND ((b."userId" = (( SELECT auth.uid() AS uid))::text) OR ((b."teamId" IS NOT NULL) AND is_team_member(b."teamId")) OR (EXISTS ( SELECT 1
           FROM "SharedBrand" sb
          WHERE ((sb."brandId" = b.id) AND (sb."userId" = (( SELECT auth.uid() AS uid))::text) AND (sb.permission = 'edit'::text)))))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM "Brand" b
  WHERE ((b.id = "BrandContent"."brandId") AND ((b."userId" = (( SELECT auth.uid() AS uid))::text) OR ((b."teamId" IS NOT NULL) AND is_team_member(b."teamId")) OR (EXISTS ( SELECT 1
           FROM "SharedBrand" sb
          WHERE ((sb."brandId" = b.id) AND (sb."userId" = (( SELECT auth.uid() AS uid))::text) AND (sb.permission = 'edit'::text)))))))));

DROP POLICY IF EXISTS "bhs_brand_delete" ON public."BrandHealthSnapshot";
CREATE POLICY "bhs_brand_delete" ON public."BrandHealthSnapshot"
  AS PERMISSIVE FOR DELETE TO "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM "Brand" b
  WHERE ((b.id = "BrandHealthSnapshot"."brandId") AND ((b."userId" = (( SELECT auth.uid() AS uid))::text) OR ((b."teamId" IS NOT NULL) AND is_team_member(b."teamId")) OR (EXISTS ( SELECT 1
           FROM "SharedBrand" sb
          WHERE ((sb."brandId" = b.id) AND (sb."userId" = (( SELECT auth.uid() AS uid))::text) AND (sb.permission = 'edit'::text)))))))));

DROP POLICY IF EXISTS "bhs_brand_insert" ON public."BrandHealthSnapshot";
CREATE POLICY "bhs_brand_insert" ON public."BrandHealthSnapshot"
  AS PERMISSIVE FOR INSERT TO "authenticated"
  WITH CHECK ((EXISTS ( SELECT 1
   FROM "Brand" b
  WHERE ((b.id = "BrandHealthSnapshot"."brandId") AND ((b."userId" = (( SELECT auth.uid() AS uid))::text) OR ((b."teamId" IS NOT NULL) AND is_team_member(b."teamId")) OR (EXISTS ( SELECT 1
           FROM "SharedBrand" sb
          WHERE ((sb."brandId" = b.id) AND (sb."userId" = (( SELECT auth.uid() AS uid))::text) AND (sb.permission = 'edit'::text)))))))));

DROP POLICY IF EXISTS "bhs_brand_select" ON public."BrandHealthSnapshot";
CREATE POLICY "bhs_brand_select" ON public."BrandHealthSnapshot"
  AS PERMISSIVE FOR SELECT TO "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM "Brand" b
  WHERE ((b.id = "BrandHealthSnapshot"."brandId") AND ((b."isPublic" = true) OR (b."userId" = (( SELECT auth.uid() AS uid))::text) OR ((b."teamId" IS NOT NULL) AND is_team_member(b."teamId")) OR (EXISTS ( SELECT 1
           FROM "SharedBrand" sb
          WHERE ((sb."brandId" = b.id) AND (sb."userId" = (( SELECT auth.uid() AS uid))::text)))))))));

DROP POLICY IF EXISTS "bhs_brand_update" ON public."BrandHealthSnapshot";
CREATE POLICY "bhs_brand_update" ON public."BrandHealthSnapshot"
  AS PERMISSIVE FOR UPDATE TO "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM "Brand" b
  WHERE ((b.id = "BrandHealthSnapshot"."brandId") AND ((b."userId" = (( SELECT auth.uid() AS uid))::text) OR ((b."teamId" IS NOT NULL) AND is_team_member(b."teamId")) OR (EXISTS ( SELECT 1
           FROM "SharedBrand" sb
          WHERE ((sb."brandId" = b.id) AND (sb."userId" = (( SELECT auth.uid() AS uid))::text) AND (sb.permission = 'edit'::text)))))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM "Brand" b
  WHERE ((b.id = "BrandHealthSnapshot"."brandId") AND ((b."userId" = (( SELECT auth.uid() AS uid))::text) OR ((b."teamId" IS NOT NULL) AND is_team_member(b."teamId")) OR (EXISTS ( SELECT 1
           FROM "SharedBrand" sb
          WHERE ((sb."brandId" = b.id) AND (sb."userId" = (( SELECT auth.uid() AS uid))::text) AND (sb.permission = 'edit'::text)))))))));

DROP POLICY IF EXISTS "bscan_delete_owner_or_admin" ON public."BrandScan";
CREATE POLICY "bscan_delete_owner_or_admin" ON public."BrandScan"
  AS PERMISSIVE FOR DELETE TO "authenticated"
  USING (((user_id = current_app_user_id()) OR (workspace_id IN ( SELECT current_user_admin_workspace_ids() AS current_user_admin_workspace_ids))));

DROP POLICY IF EXISTS "bscan_insert_via_own_xaccount" ON public."BrandScan";
CREATE POLICY "bscan_insert_via_own_xaccount" ON public."BrandScan"
  AS PERMISSIVE FOR INSERT TO "authenticated"
  WITH CHECK (((user_id = current_app_user_id()) AND user_owns_active_x_connection(platform_connection_id, workspace_id)));

DROP POLICY IF EXISTS "bscan_select_workspace_member" ON public."BrandScan";
CREATE POLICY "bscan_select_workspace_member" ON public."BrandScan"
  AS PERMISSIVE FOR SELECT TO "authenticated"
  USING ((workspace_id IN ( SELECT current_user_workspace_ids() AS current_user_workspace_ids)));

DROP POLICY IF EXISTS "bscan_update_owner_or_admin" ON public."BrandScan";
CREATE POLICY "bscan_update_owner_or_admin" ON public."BrandScan"
  AS PERMISSIVE FOR UPDATE TO "authenticated"
  USING (((user_id = current_app_user_id()) OR (workspace_id IN ( SELECT current_user_admin_workspace_ids() AS current_user_admin_workspace_ids))));

DROP POLICY IF EXISTS "Allow anonymous inserts" ON public."BrandScans";
CREATE POLICY "Allow anonymous inserts" ON public."BrandScans"
  AS PERMISSIVE FOR INSERT TO "anon"
  WITH CHECK (((score >= 0) AND (score <= 100) AND ((char_length(username) >= 1) AND (char_length(username) <= 30)) AND ((archetype IS NULL) OR (char_length(archetype) <= 60))));

DROP POLICY IF EXISTS "Allow anonymous reads" ON public."BrandScans";
CREATE POLICY "Allow anonymous reads" ON public."BrandScans"
  AS PERMISSIVE FOR SELECT TO "anon"
  USING (true);

DROP POLICY IF EXISTS "bt_delete" ON public."BrandTweet";
CREATE POLICY "bt_delete" ON public."BrandTweet"
  AS PERMISSIVE FOR DELETE TO "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM "Brand" b
  WHERE ((b.id = "BrandTweet"."brandId") AND ((b."userId" = (( SELECT auth.uid() AS uid))::text) OR ((b."teamId" IS NOT NULL) AND is_team_member(b."teamId")) OR (EXISTS ( SELECT 1
           FROM "SharedBrand" sb
          WHERE ((sb."brandId" = b.id) AND (sb."userId" = (( SELECT auth.uid() AS uid))::text) AND (sb.permission = 'edit'::text)))))))));

DROP POLICY IF EXISTS "bt_insert" ON public."BrandTweet";
CREATE POLICY "bt_insert" ON public."BrandTweet"
  AS PERMISSIVE FOR INSERT TO "authenticated"
  WITH CHECK ((EXISTS ( SELECT 1
   FROM "Brand" b
  WHERE ((b.id = "BrandTweet"."brandId") AND ((b."userId" = (( SELECT auth.uid() AS uid))::text) OR ((b."teamId" IS NOT NULL) AND is_team_member(b."teamId")) OR (EXISTS ( SELECT 1
           FROM "SharedBrand" sb
          WHERE ((sb."brandId" = b.id) AND (sb."userId" = (( SELECT auth.uid() AS uid))::text) AND (sb.permission = 'edit'::text)))))))));

DROP POLICY IF EXISTS "bt_select" ON public."BrandTweet";
CREATE POLICY "bt_select" ON public."BrandTweet"
  AS PERMISSIVE FOR SELECT TO "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM "Brand" b
  WHERE ((b.id = "BrandTweet"."brandId") AND ((b."isPublic" = true) OR (b."userId" = (( SELECT auth.uid() AS uid))::text) OR ((b."teamId" IS NOT NULL) AND is_team_member(b."teamId")) OR (EXISTS ( SELECT 1
           FROM "SharedBrand" sb
          WHERE ((sb."brandId" = b.id) AND (sb."userId" = (( SELECT auth.uid() AS uid))::text)))))))));

DROP POLICY IF EXISTS "bt_update" ON public."BrandTweet";
CREATE POLICY "bt_update" ON public."BrandTweet"
  AS PERMISSIVE FOR UPDATE TO "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM "Brand" b
  WHERE ((b.id = "BrandTweet"."brandId") AND ((b."userId" = (( SELECT auth.uid() AS uid))::text) OR ((b."teamId" IS NOT NULL) AND is_team_member(b."teamId")) OR (EXISTS ( SELECT 1
           FROM "SharedBrand" sb
          WHERE ((sb."brandId" = b.id) AND (sb."userId" = (( SELECT auth.uid() AS uid))::text) AND (sb.permission = 'edit'::text)))))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM "Brand" b
  WHERE ((b.id = "BrandTweet"."brandId") AND ((b."userId" = (( SELECT auth.uid() AS uid))::text) OR ((b."teamId" IS NOT NULL) AND is_team_member(b."teamId")) OR (EXISTS ( SELECT 1
           FROM "SharedBrand" sb
          WHERE ((sb."brandId" = b.id) AND (sb."userId" = (( SELECT auth.uid() AS uid))::text) AND (sb.permission = 'edit'::text)))))))));

DROP POLICY IF EXISTS "bvdna_delete" ON public."BrandVisualDNA";
CREATE POLICY "bvdna_delete" ON public."BrandVisualDNA"
  AS PERMISSIVE FOR DELETE TO "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM "Brand" b
  WHERE ((b.id = "BrandVisualDNA"."brandId") AND ((b."userId" = (( SELECT auth.uid() AS uid))::text) OR ((b."teamId" IS NOT NULL) AND is_team_member(b."teamId")) OR (EXISTS ( SELECT 1
           FROM "SharedBrand" sb
          WHERE ((sb."brandId" = b.id) AND (sb."userId" = (( SELECT auth.uid() AS uid))::text) AND (sb.permission = 'edit'::text)))))))));

DROP POLICY IF EXISTS "bvdna_insert" ON public."BrandVisualDNA";
CREATE POLICY "bvdna_insert" ON public."BrandVisualDNA"
  AS PERMISSIVE FOR INSERT TO "authenticated"
  WITH CHECK ((EXISTS ( SELECT 1
   FROM "Brand" b
  WHERE ((b.id = "BrandVisualDNA"."brandId") AND ((b."userId" = (( SELECT auth.uid() AS uid))::text) OR ((b."teamId" IS NOT NULL) AND is_team_member(b."teamId")) OR (EXISTS ( SELECT 1
           FROM "SharedBrand" sb
          WHERE ((sb."brandId" = b.id) AND (sb."userId" = (( SELECT auth.uid() AS uid))::text) AND (sb.permission = 'edit'::text)))))))));

DROP POLICY IF EXISTS "bvdna_select" ON public."BrandVisualDNA";
CREATE POLICY "bvdna_select" ON public."BrandVisualDNA"
  AS PERMISSIVE FOR SELECT TO "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM "Brand" b
  WHERE ((b.id = "BrandVisualDNA"."brandId") AND ((b."isPublic" = true) OR (b."userId" = (( SELECT auth.uid() AS uid))::text) OR ((b."teamId" IS NOT NULL) AND is_team_member(b."teamId")) OR (EXISTS ( SELECT 1
           FROM "SharedBrand" sb
          WHERE ((sb."brandId" = b.id) AND (sb."userId" = (( SELECT auth.uid() AS uid))::text)))))))));

DROP POLICY IF EXISTS "bvdna_update" ON public."BrandVisualDNA";
CREATE POLICY "bvdna_update" ON public."BrandVisualDNA"
  AS PERMISSIVE FOR UPDATE TO "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM "Brand" b
  WHERE ((b.id = "BrandVisualDNA"."brandId") AND ((b."userId" = (( SELECT auth.uid() AS uid))::text) OR ((b."teamId" IS NOT NULL) AND is_team_member(b."teamId")) OR (EXISTS ( SELECT 1
           FROM "SharedBrand" sb
          WHERE ((sb."brandId" = b.id) AND (sb."userId" = (( SELECT auth.uid() AS uid))::text) AND (sb.permission = 'edit'::text)))))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM "Brand" b
  WHERE ((b.id = "BrandVisualDNA"."brandId") AND ((b."userId" = (( SELECT auth.uid() AS uid))::text) OR ((b."teamId" IS NOT NULL) AND is_team_member(b."teamId")) OR (EXISTS ( SELECT 1
           FROM "SharedBrand" sb
          WHERE ((sb."brandId" = b.id) AND (sb."userId" = (( SELECT auth.uid() AS uid))::text) AND (sb.permission = 'edit'::text)))))))));

DROP POLICY IF EXISTS "cd_delete" ON public."ContentDraft";
CREATE POLICY "cd_delete" ON public."ContentDraft"
  AS PERMISSIVE FOR DELETE TO "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM "Brand" b
  WHERE ((b.id = "ContentDraft"."brandId") AND ((b."userId" = (( SELECT auth.uid() AS uid))::text) OR ((b."teamId" IS NOT NULL) AND is_team_member(b."teamId")) OR (EXISTS ( SELECT 1
           FROM "SharedBrand" sb
          WHERE ((sb."brandId" = b.id) AND (sb."userId" = (( SELECT auth.uid() AS uid))::text) AND (sb.permission = 'edit'::text)))))))));

DROP POLICY IF EXISTS "cd_insert" ON public."ContentDraft";
CREATE POLICY "cd_insert" ON public."ContentDraft"
  AS PERMISSIVE FOR INSERT TO "authenticated"
  WITH CHECK ((EXISTS ( SELECT 1
   FROM "Brand" b
  WHERE ((b.id = "ContentDraft"."brandId") AND ((b."userId" = (( SELECT auth.uid() AS uid))::text) OR ((b."teamId" IS NOT NULL) AND is_team_member(b."teamId")) OR (EXISTS ( SELECT 1
           FROM "SharedBrand" sb
          WHERE ((sb."brandId" = b.id) AND (sb."userId" = (( SELECT auth.uid() AS uid))::text) AND (sb.permission = 'edit'::text)))))))));

DROP POLICY IF EXISTS "cd_select" ON public."ContentDraft";
CREATE POLICY "cd_select" ON public."ContentDraft"
  AS PERMISSIVE FOR SELECT TO "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM "Brand" b
  WHERE ((b.id = "ContentDraft"."brandId") AND ((b."isPublic" = true) OR (b."userId" = (( SELECT auth.uid() AS uid))::text) OR ((b."teamId" IS NOT NULL) AND is_team_member(b."teamId")) OR (EXISTS ( SELECT 1
           FROM "SharedBrand" sb
          WHERE ((sb."brandId" = b.id) AND (sb."userId" = (( SELECT auth.uid() AS uid))::text)))))))));

DROP POLICY IF EXISTS "cd_update" ON public."ContentDraft";
CREATE POLICY "cd_update" ON public."ContentDraft"
  AS PERMISSIVE FOR UPDATE TO "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM "Brand" b
  WHERE ((b.id = "ContentDraft"."brandId") AND ((b."userId" = (( SELECT auth.uid() AS uid))::text) OR ((b."teamId" IS NOT NULL) AND is_team_member(b."teamId")) OR (EXISTS ( SELECT 1
           FROM "SharedBrand" sb
          WHERE ((sb."brandId" = b.id) AND (sb."userId" = (( SELECT auth.uid() AS uid))::text) AND (sb.permission = 'edit'::text)))))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM "Brand" b
  WHERE ((b.id = "ContentDraft"."brandId") AND ((b."userId" = (( SELECT auth.uid() AS uid))::text) OR ((b."teamId" IS NOT NULL) AND is_team_member(b."teamId")) OR (EXISTS ( SELECT 1
           FROM "SharedBrand" sb
          WHERE ((sb."brandId" = b.id) AND (sb."userId" = (( SELECT auth.uid() AS uid))::text) AND (sb.permission = 'edit'::text)))))))));

DROP POLICY IF EXISTS "cn_delete" ON public."ContentNiche";
CREATE POLICY "cn_delete" ON public."ContentNiche"
  AS PERMISSIVE FOR DELETE TO "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM "Brand" b
  WHERE ((b.id = "ContentNiche"."brandId") AND ((b."userId" = (( SELECT auth.uid() AS uid))::text) OR ((b."teamId" IS NOT NULL) AND is_team_member(b."teamId")) OR (EXISTS ( SELECT 1
           FROM "SharedBrand" sb
          WHERE ((sb."brandId" = b.id) AND (sb."userId" = (( SELECT auth.uid() AS uid))::text) AND (sb.permission = 'edit'::text)))))))));

DROP POLICY IF EXISTS "cn_insert" ON public."ContentNiche";
CREATE POLICY "cn_insert" ON public."ContentNiche"
  AS PERMISSIVE FOR INSERT TO "authenticated"
  WITH CHECK ((EXISTS ( SELECT 1
   FROM "Brand" b
  WHERE ((b.id = "ContentNiche"."brandId") AND ((b."userId" = (( SELECT auth.uid() AS uid))::text) OR ((b."teamId" IS NOT NULL) AND is_team_member(b."teamId")) OR (EXISTS ( SELECT 1
           FROM "SharedBrand" sb
          WHERE ((sb."brandId" = b.id) AND (sb."userId" = (( SELECT auth.uid() AS uid))::text) AND (sb.permission = 'edit'::text)))))))));

DROP POLICY IF EXISTS "cn_select" ON public."ContentNiche";
CREATE POLICY "cn_select" ON public."ContentNiche"
  AS PERMISSIVE FOR SELECT TO "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM "Brand" b
  WHERE ((b.id = "ContentNiche"."brandId") AND ((b."isPublic" = true) OR (b."userId" = (( SELECT auth.uid() AS uid))::text) OR ((b."teamId" IS NOT NULL) AND is_team_member(b."teamId")) OR (EXISTS ( SELECT 1
           FROM "SharedBrand" sb
          WHERE ((sb."brandId" = b.id) AND (sb."userId" = (( SELECT auth.uid() AS uid))::text)))))))));

DROP POLICY IF EXISTS "cn_update" ON public."ContentNiche";
CREATE POLICY "cn_update" ON public."ContentNiche"
  AS PERMISSIVE FOR UPDATE TO "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM "Brand" b
  WHERE ((b.id = "ContentNiche"."brandId") AND ((b."userId" = (( SELECT auth.uid() AS uid))::text) OR ((b."teamId" IS NOT NULL) AND is_team_member(b."teamId")) OR (EXISTS ( SELECT 1
           FROM "SharedBrand" sb
          WHERE ((sb."brandId" = b.id) AND (sb."userId" = (( SELECT auth.uid() AS uid))::text) AND (sb.permission = 'edit'::text)))))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM "Brand" b
  WHERE ((b.id = "ContentNiche"."brandId") AND ((b."userId" = (( SELECT auth.uid() AS uid))::text) OR ((b."teamId" IS NOT NULL) AND is_team_member(b."teamId")) OR (EXISTS ( SELECT 1
           FROM "SharedBrand" sb
          WHERE ((sb."brandId" = b.id) AND (sb."userId" = (( SELECT auth.uid() AS uid))::text) AND (sb.permission = 'edit'::text)))))))));

DROP POLICY IF EXISTS "customworld_delete_owner" ON public."CustomWorld";
CREATE POLICY "customworld_delete_owner" ON public."CustomWorld"
  AS PERMISSIVE FOR DELETE TO "authenticated"
  USING ((workspace_id IN ( SELECT "Workspace".id
   FROM "Workspace"
  WHERE ("Workspace".owner_user_id = ( SELECT "User".id
           FROM "User"
          WHERE ("User"."supabaseId" = (auth.uid())::text))))));

DROP POLICY IF EXISTS "customworld_insert_admin" ON public."CustomWorld";
CREATE POLICY "customworld_insert_admin" ON public."CustomWorld"
  AS PERMISSIVE FOR INSERT TO "authenticated"
  WITH CHECK ((workspace_id IN ( SELECT "WorkspaceMember".workspace_id
   FROM "WorkspaceMember"
  WHERE (("WorkspaceMember".user_id = ( SELECT "User".id
           FROM "User"
          WHERE ("User"."supabaseId" = (auth.uid())::text))) AND ("WorkspaceMember".role = ANY (ARRAY['owner'::workspace_role, 'admin'::workspace_role]))))));

DROP POLICY IF EXISTS "customworld_select_member" ON public."CustomWorld";
CREATE POLICY "customworld_select_member" ON public."CustomWorld"
  AS PERMISSIVE FOR SELECT TO "authenticated"
  USING ((workspace_id IN ( SELECT "WorkspaceMember".workspace_id
   FROM "WorkspaceMember"
  WHERE ("WorkspaceMember".user_id = ( SELECT "User".id
           FROM "User"
          WHERE ("User"."supabaseId" = (auth.uid())::text))))));

DROP POLICY IF EXISTS "customworld_update_admin" ON public."CustomWorld";
CREATE POLICY "customworld_update_admin" ON public."CustomWorld"
  AS PERMISSIVE FOR UPDATE TO "authenticated"
  USING ((workspace_id IN ( SELECT "WorkspaceMember".workspace_id
   FROM "WorkspaceMember"
  WHERE (("WorkspaceMember".user_id = ( SELECT "User".id
           FROM "User"
          WHERE ("User"."supabaseId" = (auth.uid())::text))) AND ("WorkspaceMember".role = ANY (ARRAY['owner'::workspace_role, 'admin'::workspace_role]))))));

DROP POLICY IF EXISTS "dbrief_select_workspace_member" ON public."DailyBrief";
CREATE POLICY "dbrief_select_workspace_member" ON public."DailyBrief"
  AS PERMISSIVE FOR SELECT TO "authenticated"
  USING ((workspace_id IN ( SELECT "WorkspaceMember".workspace_id
   FROM "WorkspaceMember"
  WHERE ("WorkspaceMember".user_id = ( SELECT "User".id
           FROM "User"
          WHERE ("User"."supabaseId" = (auth.uid())::text))))));

DROP POLICY IF EXISTS "dbrief_update_owner" ON public."DailyBrief";
CREATE POLICY "dbrief_update_owner" ON public."DailyBrief"
  AS PERMISSIVE FOR UPDATE TO "authenticated"
  USING ((user_id = ( SELECT "User".id
   FROM "User"
  WHERE ("User"."supabaseId" = (auth.uid())::text))))
  WITH CHECK ((user_id = ( SELECT "User".id
   FROM "User"
  WHERE ("User"."supabaseId" = (auth.uid())::text))));

DROP POLICY IF EXISTS "da_delete" ON public."DriftAlert";
CREATE POLICY "da_delete" ON public."DriftAlert"
  AS PERMISSIVE FOR DELETE TO "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM "Brand" b
  WHERE ((b.id = "DriftAlert"."brandId") AND ((b."userId" = (( SELECT auth.uid() AS uid))::text) OR ((b."teamId" IS NOT NULL) AND is_team_member(b."teamId")) OR (EXISTS ( SELECT 1
           FROM "SharedBrand" sb
          WHERE ((sb."brandId" = b.id) AND (sb."userId" = (( SELECT auth.uid() AS uid))::text) AND (sb.permission = 'edit'::text)))))))));

DROP POLICY IF EXISTS "da_insert" ON public."DriftAlert";
CREATE POLICY "da_insert" ON public."DriftAlert"
  AS PERMISSIVE FOR INSERT TO "authenticated"
  WITH CHECK ((EXISTS ( SELECT 1
   FROM "Brand" b
  WHERE ((b.id = "DriftAlert"."brandId") AND ((b."userId" = (( SELECT auth.uid() AS uid))::text) OR ((b."teamId" IS NOT NULL) AND is_team_member(b."teamId")) OR (EXISTS ( SELECT 1
           FROM "SharedBrand" sb
          WHERE ((sb."brandId" = b.id) AND (sb."userId" = (( SELECT auth.uid() AS uid))::text) AND (sb.permission = 'edit'::text)))))))));

DROP POLICY IF EXISTS "da_select" ON public."DriftAlert";
CREATE POLICY "da_select" ON public."DriftAlert"
  AS PERMISSIVE FOR SELECT TO "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM "Brand" b
  WHERE ((b.id = "DriftAlert"."brandId") AND ((b."isPublic" = true) OR (b."userId" = (( SELECT auth.uid() AS uid))::text) OR ((b."teamId" IS NOT NULL) AND is_team_member(b."teamId")) OR (EXISTS ( SELECT 1
           FROM "SharedBrand" sb
          WHERE ((sb."brandId" = b.id) AND (sb."userId" = (( SELECT auth.uid() AS uid))::text)))))))));

DROP POLICY IF EXISTS "da_update" ON public."DriftAlert";
CREATE POLICY "da_update" ON public."DriftAlert"
  AS PERMISSIVE FOR UPDATE TO "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM "Brand" b
  WHERE ((b.id = "DriftAlert"."brandId") AND ((b."userId" = (( SELECT auth.uid() AS uid))::text) OR ((b."teamId" IS NOT NULL) AND is_team_member(b."teamId")) OR (EXISTS ( SELECT 1
           FROM "SharedBrand" sb
          WHERE ((sb."brandId" = b.id) AND (sb."userId" = (( SELECT auth.uid() AS uid))::text) AND (sb.permission = 'edit'::text)))))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM "Brand" b
  WHERE ((b.id = "DriftAlert"."brandId") AND ((b."userId" = (( SELECT auth.uid() AS uid))::text) OR ((b."teamId" IS NOT NULL) AND is_team_member(b."teamId")) OR (EXISTS ( SELECT 1
           FROM "SharedBrand" sb
          WHERE ((sb."brandId" = b.id) AND (sb."userId" = (( SELECT auth.uid() AS uid))::text) AND (sb.permission = 'edit'::text)))))))));

DROP POLICY IF EXISTS "Allow service role to read" ON public."EmailSignup";
CREATE POLICY "Allow service role to read" ON public."EmailSignup"
  AS PERMISSIVE FOR SELECT TO public
  USING (true);

DROP POLICY IF EXISTS "email_signup_insert_limited" ON public."EmailSignup";
CREATE POLICY "email_signup_insert_limited" ON public."EmailSignup"
  AS PERMISSIVE FOR INSERT TO "anon", "authenticated"
  WITH CHECK (COALESCE((length(TRIM(BOTH FROM email)) > 3), false));

DROP POLICY IF EXISTS "feedback_delete" ON public."Feedback";
CREATE POLICY "feedback_delete" ON public."Feedback"
  AS PERMISSIVE FOR DELETE TO "authenticated"
  USING (("userId" = (( SELECT auth.uid() AS uid))::text));

DROP POLICY IF EXISTS "feedback_insert" ON public."Feedback";
CREATE POLICY "feedback_insert" ON public."Feedback"
  AS PERMISSIVE FOR INSERT TO "authenticated"
  WITH CHECK (("userId" = (( SELECT auth.uid() AS uid))::text));

DROP POLICY IF EXISTS "feedback_read" ON public."Feedback";
CREATE POLICY "feedback_read" ON public."Feedback"
  AS PERMISSIVE FOR SELECT TO "authenticated"
  USING (("userId" = (( SELECT auth.uid() AS uid))::text));

DROP POLICY IF EXISTS "feedback_update" ON public."Feedback";
CREATE POLICY "feedback_update" ON public."Feedback"
  AS PERMISSIVE FOR UPDATE TO "authenticated"
  USING (("userId" = (( SELECT auth.uid() AS uid))::text))
  WITH CHECK (("userId" = (( SELECT auth.uid() AS uid))::text));

DROP POLICY IF EXISTS "ga_brand_delete" ON public."GapAnalysis";
CREATE POLICY "ga_brand_delete" ON public."GapAnalysis"
  AS PERMISSIVE FOR DELETE TO "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM "Brand" b
  WHERE ((b.id = "GapAnalysis"."brandId") AND ((b."userId" = (( SELECT auth.uid() AS uid))::text) OR ((b."teamId" IS NOT NULL) AND is_team_member(b."teamId")) OR (EXISTS ( SELECT 1
           FROM "SharedBrand" sb
          WHERE ((sb."brandId" = b.id) AND (sb."userId" = (( SELECT auth.uid() AS uid))::text) AND (sb.permission = 'edit'::text)))))))));

DROP POLICY IF EXISTS "ga_brand_insert" ON public."GapAnalysis";
CREATE POLICY "ga_brand_insert" ON public."GapAnalysis"
  AS PERMISSIVE FOR INSERT TO "authenticated"
  WITH CHECK ((EXISTS ( SELECT 1
   FROM "Brand" b
  WHERE ((b.id = "GapAnalysis"."brandId") AND ((b."userId" = (( SELECT auth.uid() AS uid))::text) OR ((b."teamId" IS NOT NULL) AND is_team_member(b."teamId")) OR (EXISTS ( SELECT 1
           FROM "SharedBrand" sb
          WHERE ((sb."brandId" = b.id) AND (sb."userId" = (( SELECT auth.uid() AS uid))::text) AND (sb.permission = 'edit'::text)))))))));

DROP POLICY IF EXISTS "ga_brand_select" ON public."GapAnalysis";
CREATE POLICY "ga_brand_select" ON public."GapAnalysis"
  AS PERMISSIVE FOR SELECT TO "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM "Brand" b
  WHERE ((b.id = "GapAnalysis"."brandId") AND ((b."isPublic" = true) OR (b."userId" = (( SELECT auth.uid() AS uid))::text) OR ((b."teamId" IS NOT NULL) AND is_team_member(b."teamId")) OR (EXISTS ( SELECT 1
           FROM "SharedBrand" sb
          WHERE ((sb."brandId" = b.id) AND (sb."userId" = (( SELECT auth.uid() AS uid))::text)))))))));

DROP POLICY IF EXISTS "ga_brand_update" ON public."GapAnalysis";
CREATE POLICY "ga_brand_update" ON public."GapAnalysis"
  AS PERMISSIVE FOR UPDATE TO "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM "Brand" b
  WHERE ((b.id = "GapAnalysis"."brandId") AND ((b."userId" = (( SELECT auth.uid() AS uid))::text) OR ((b."teamId" IS NOT NULL) AND is_team_member(b."teamId")) OR (EXISTS ( SELECT 1
           FROM "SharedBrand" sb
          WHERE ((sb."brandId" = b.id) AND (sb."userId" = (( SELECT auth.uid() AS uid))::text) AND (sb.permission = 'edit'::text)))))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM "Brand" b
  WHERE ((b.id = "GapAnalysis"."brandId") AND ((b."userId" = (( SELECT auth.uid() AS uid))::text) OR ((b."teamId" IS NOT NULL) AND is_team_member(b."teamId")) OR (EXISTS ( SELECT 1
           FROM "SharedBrand" sb
          WHERE ((sb."brandId" = b.id) AND (sb."userId" = (( SELECT auth.uid() AS uid))::text) AND (sb.permission = 'edit'::text)))))))));

DROP POLICY IF EXISTS "history_delete" ON public."HistoryEntry";
CREATE POLICY "history_delete" ON public."HistoryEntry"
  AS PERMISSIVE FOR DELETE TO "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM "Brand" b
  WHERE ((b.id = "HistoryEntry"."brandId") AND ((b."userId" = (( SELECT auth.uid() AS uid))::text) OR ((b."teamId" IS NOT NULL) AND is_team_member(b."teamId")))))));

DROP POLICY IF EXISTS "history_read" ON public."HistoryEntry";
CREATE POLICY "history_read" ON public."HistoryEntry"
  AS PERMISSIVE FOR SELECT TO "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM "Brand" b
  WHERE ((b.id = "HistoryEntry"."brandId") AND ((b."isPublic" = true) OR (b."userId" = (( SELECT auth.uid() AS uid))::text) OR ((b."teamId" IS NOT NULL) AND is_team_member(b."teamId")) OR (EXISTS ( SELECT 1
           FROM "SharedBrand" sb
          WHERE ((sb."brandId" = b.id) AND (sb."userId" = (( SELECT auth.uid() AS uid))::text)))))))));

DROP POLICY IF EXISTS "history_update" ON public."HistoryEntry";
CREATE POLICY "history_update" ON public."HistoryEntry"
  AS PERMISSIVE FOR UPDATE TO "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM "Brand" b
  WHERE ((b.id = "HistoryEntry"."brandId") AND ((b."userId" = (( SELECT auth.uid() AS uid))::text) OR ((b."teamId" IS NOT NULL) AND is_team_member(b."teamId")) OR (EXISTS ( SELECT 1
           FROM "SharedBrand" sb
          WHERE ((sb."brandId" = b.id) AND (sb."userId" = (( SELECT auth.uid() AS uid))::text) AND (sb.permission = 'edit'::text)))))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM "Brand" b
  WHERE ((b.id = "HistoryEntry"."brandId") AND ((b."userId" = (( SELECT auth.uid() AS uid))::text) OR ((b."teamId" IS NOT NULL) AND is_team_member(b."teamId")) OR (EXISTS ( SELECT 1
           FROM "SharedBrand" sb
          WHERE ((sb."brandId" = b.id) AND (sb."userId" = (( SELECT auth.uid() AS uid))::text) AND (sb.permission = 'edit'::text)))))))));

DROP POLICY IF EXISTS "history_write" ON public."HistoryEntry";
CREATE POLICY "history_write" ON public."HistoryEntry"
  AS PERMISSIVE FOR INSERT TO "authenticated"
  WITH CHECK ((EXISTS ( SELECT 1
   FROM "Brand" b
  WHERE ((b.id = "HistoryEntry"."brandId") AND ((b."userId" = (( SELECT auth.uid() AS uid))::text) OR ((b."teamId" IS NOT NULL) AND is_team_member(b."teamId")) OR (EXISTS ( SELECT 1
           FROM "SharedBrand" sb
          WHERE ((sb."brandId" = b.id) AND (sb."userId" = (( SELECT auth.uid() AS uid))::text) AND (sb.permission = 'edit'::text)))))))));

DROP POLICY IF EXISTS "ic_select" ON public."InviteCode";
CREATE POLICY "ic_select" ON public."InviteCode"
  AS PERMISSIVE FOR SELECT TO "authenticated"
  USING (("createdBy" = (( SELECT auth.uid() AS uid))::text));

DROP POLICY IF EXISTS "oa_delete" ON public."OnchainAttestation";
CREATE POLICY "oa_delete" ON public."OnchainAttestation"
  AS PERMISSIVE FOR DELETE TO "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM "Brand" b
  WHERE ((b.id = "OnchainAttestation"."brandId") AND ((b."userId" = (( SELECT auth.uid() AS uid))::text) OR ((b."teamId" IS NOT NULL) AND is_team_member(b."teamId")) OR (EXISTS ( SELECT 1
           FROM "SharedBrand" sb
          WHERE ((sb."brandId" = b.id) AND (sb."userId" = (( SELECT auth.uid() AS uid))::text) AND (sb.permission = 'edit'::text)))))))));

DROP POLICY IF EXISTS "oa_insert" ON public."OnchainAttestation";
CREATE POLICY "oa_insert" ON public."OnchainAttestation"
  AS PERMISSIVE FOR INSERT TO "authenticated"
  WITH CHECK ((EXISTS ( SELECT 1
   FROM "Brand" b
  WHERE ((b.id = "OnchainAttestation"."brandId") AND ((b."userId" = (( SELECT auth.uid() AS uid))::text) OR ((b."teamId" IS NOT NULL) AND is_team_member(b."teamId")) OR (EXISTS ( SELECT 1
           FROM "SharedBrand" sb
          WHERE ((sb."brandId" = b.id) AND (sb."userId" = (( SELECT auth.uid() AS uid))::text) AND (sb.permission = 'edit'::text)))))))));

DROP POLICY IF EXISTS "oa_select" ON public."OnchainAttestation";
CREATE POLICY "oa_select" ON public."OnchainAttestation"
  AS PERMISSIVE FOR SELECT TO "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM "Brand" b
  WHERE ((b.id = "OnchainAttestation"."brandId") AND ((b."isPublic" = true) OR (b."userId" = (( SELECT auth.uid() AS uid))::text) OR ((b."teamId" IS NOT NULL) AND is_team_member(b."teamId")) OR (EXISTS ( SELECT 1
           FROM "SharedBrand" sb
          WHERE ((sb."brandId" = b.id) AND (sb."userId" = (( SELECT auth.uid() AS uid))::text)))))))));

DROP POLICY IF EXISTS "oa_update" ON public."OnchainAttestation";
CREATE POLICY "oa_update" ON public."OnchainAttestation"
  AS PERMISSIVE FOR UPDATE TO "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM "Brand" b
  WHERE ((b.id = "OnchainAttestation"."brandId") AND ((b."userId" = (( SELECT auth.uid() AS uid))::text) OR ((b."teamId" IS NOT NULL) AND is_team_member(b."teamId")) OR (EXISTS ( SELECT 1
           FROM "SharedBrand" sb
          WHERE ((sb."brandId" = b.id) AND (sb."userId" = (( SELECT auth.uid() AS uid))::text) AND (sb.permission = 'edit'::text)))))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM "Brand" b
  WHERE ((b.id = "OnchainAttestation"."brandId") AND ((b."userId" = (( SELECT auth.uid() AS uid))::text) OR ((b."teamId" IS NOT NULL) AND is_team_member(b."teamId")) OR (EXISTS ( SELECT 1
           FROM "SharedBrand" sb
          WHERE ((sb."brandId" = b.id) AND (sb."userId" = (( SELECT auth.uid() AS uid))::text) AND (sb.permission = 'edit'::text)))))))));

DROP POLICY IF EXISTS "Allow anonymous insert OppEmailCaptures" ON public."OppEmailCaptures";
CREATE POLICY "Allow anonymous insert OppEmailCaptures" ON public."OppEmailCaptures"
  AS PERMISSIVE FOR INSERT TO public
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anonymous read OppEmailCaptures" ON public."OppEmailCaptures";
CREATE POLICY "Allow anonymous read OppEmailCaptures" ON public."OppEmailCaptures"
  AS PERMISSIVE FOR SELECT TO public
  USING (true);

DROP POLICY IF EXISTS "Allow anonymous update OppEmailCaptures" ON public."OppEmailCaptures";
CREATE POLICY "Allow anonymous update OppEmailCaptures" ON public."OppEmailCaptures"
  AS PERMISSIVE FOR UPDATE TO public
  USING (true);

DROP POLICY IF EXISTS "Allow anonymous insert OppMatchups" ON public."OppMatchups";
CREATE POLICY "Allow anonymous insert OppMatchups" ON public."OppMatchups"
  AS PERMISSIVE FOR INSERT TO public
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anonymous read OppMatchups" ON public."OppMatchups";
CREATE POLICY "Allow anonymous read OppMatchups" ON public."OppMatchups"
  AS PERMISSIVE FOR SELECT TO public
  USING (true);

DROP POLICY IF EXISTS "Allow anonymous insert OppPairings" ON public."OppPairings";
CREATE POLICY "Allow anonymous insert OppPairings" ON public."OppPairings"
  AS PERMISSIVE FOR INSERT TO public
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anonymous read OppPairings" ON public."OppPairings";
CREATE POLICY "Allow anonymous read OppPairings" ON public."OppPairings"
  AS PERMISSIVE FOR SELECT TO public
  USING (true);

DROP POLICY IF EXISTS "Allow anonymous update OppPairings" ON public."OppPairings";
CREATE POLICY "Allow anonymous update OppPairings" ON public."OppPairings"
  AS PERMISSIVE FOR UPDATE TO public
  USING (true);

DROP POLICY IF EXISTS "ps_delete" ON public."PerformanceSnapshot";
CREATE POLICY "ps_delete" ON public."PerformanceSnapshot"
  AS PERMISSIVE FOR DELETE TO "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM "Brand" b
  WHERE ((b.id = "PerformanceSnapshot"."brandId") AND ((b."userId" = (( SELECT auth.uid() AS uid))::text) OR ((b."teamId" IS NOT NULL) AND is_team_member(b."teamId")) OR (EXISTS ( SELECT 1
           FROM "SharedBrand" sb
          WHERE ((sb."brandId" = b.id) AND (sb."userId" = (( SELECT auth.uid() AS uid))::text) AND (sb.permission = 'edit'::text)))))))));

DROP POLICY IF EXISTS "ps_insert" ON public."PerformanceSnapshot";
CREATE POLICY "ps_insert" ON public."PerformanceSnapshot"
  AS PERMISSIVE FOR INSERT TO "authenticated"
  WITH CHECK ((EXISTS ( SELECT 1
   FROM "Brand" b
  WHERE ((b.id = "PerformanceSnapshot"."brandId") AND ((b."userId" = (( SELECT auth.uid() AS uid))::text) OR ((b."teamId" IS NOT NULL) AND is_team_member(b."teamId")) OR (EXISTS ( SELECT 1
           FROM "SharedBrand" sb
          WHERE ((sb."brandId" = b.id) AND (sb."userId" = (( SELECT auth.uid() AS uid))::text) AND (sb.permission = 'edit'::text)))))))));

DROP POLICY IF EXISTS "ps_select" ON public."PerformanceSnapshot";
CREATE POLICY "ps_select" ON public."PerformanceSnapshot"
  AS PERMISSIVE FOR SELECT TO "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM "Brand" b
  WHERE ((b.id = "PerformanceSnapshot"."brandId") AND ((b."isPublic" = true) OR (b."userId" = (( SELECT auth.uid() AS uid))::text) OR ((b."teamId" IS NOT NULL) AND is_team_member(b."teamId")) OR (EXISTS ( SELECT 1
           FROM "SharedBrand" sb
          WHERE ((sb."brandId" = b.id) AND (sb."userId" = (( SELECT auth.uid() AS uid))::text)))))))));

DROP POLICY IF EXISTS "ps_update" ON public."PerformanceSnapshot";
CREATE POLICY "ps_update" ON public."PerformanceSnapshot"
  AS PERMISSIVE FOR UPDATE TO "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM "Brand" b
  WHERE ((b.id = "PerformanceSnapshot"."brandId") AND ((b."userId" = (( SELECT auth.uid() AS uid))::text) OR ((b."teamId" IS NOT NULL) AND is_team_member(b."teamId")) OR (EXISTS ( SELECT 1
           FROM "SharedBrand" sb
          WHERE ((sb."brandId" = b.id) AND (sb."userId" = (( SELECT auth.uid() AS uid))::text) AND (sb.permission = 'edit'::text)))))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM "Brand" b
  WHERE ((b.id = "PerformanceSnapshot"."brandId") AND ((b."userId" = (( SELECT auth.uid() AS uid))::text) OR ((b."teamId" IS NOT NULL) AND is_team_member(b."teamId")) OR (EXISTS ( SELECT 1
           FROM "SharedBrand" sb
          WHERE ((sb."brandId" = b.id) AND (sb."userId" = (( SELECT auth.uid() AS uid))::text) AND (sb.permission = 'edit'::text)))))))));

DROP POLICY IF EXISTS "plan_limit_public_read" ON public."PlanLimit";
CREATE POLICY "plan_limit_public_read" ON public."PlanLimit"
  AS PERMISSIVE FOR SELECT TO "anon", "authenticated"
  USING (true);

DROP POLICY IF EXISTS "pc_delete_own" ON public."PlatformConnection";
CREATE POLICY "pc_delete_own" ON public."PlatformConnection"
  AS PERMISSIVE FOR DELETE TO "authenticated"
  USING (("userId" = (( SELECT auth.uid() AS uid))::text));

DROP POLICY IF EXISTS "pc_insert_own" ON public."PlatformConnection";
CREATE POLICY "pc_insert_own" ON public."PlatformConnection"
  AS PERMISSIVE FOR INSERT TO "authenticated"
  WITH CHECK (("userId" = (( SELECT auth.uid() AS uid))::text));

DROP POLICY IF EXISTS "pc_read_own" ON public."PlatformConnection";
CREATE POLICY "pc_read_own" ON public."PlatformConnection"
  AS PERMISSIVE FOR SELECT TO "authenticated"
  USING (("userId" = (( SELECT auth.uid() AS uid))::text));

DROP POLICY IF EXISTS "pc_update_own" ON public."PlatformConnection";
CREATE POLICY "pc_update_own" ON public."PlatformConnection"
  AS PERMISSIVE FOR UPDATE TO "authenticated"
  USING (("userId" = (( SELECT auth.uid() AS uid))::text))
  WITH CHECK (("userId" = (( SELECT auth.uid() AS uid))::text));

DROP POLICY IF EXISTS "purchase_delete_own" ON public."Purchase";
CREATE POLICY "purchase_delete_own" ON public."Purchase"
  AS PERMISSIVE FOR DELETE TO "authenticated"
  USING (("userId" = (( SELECT auth.uid() AS uid))::text));

DROP POLICY IF EXISTS "purchase_insert_own" ON public."Purchase";
CREATE POLICY "purchase_insert_own" ON public."Purchase"
  AS PERMISSIVE FOR INSERT TO "authenticated"
  WITH CHECK (("userId" = (( SELECT auth.uid() AS uid))::text));

DROP POLICY IF EXISTS "purchase_read_own" ON public."Purchase";
CREATE POLICY "purchase_read_own" ON public."Purchase"
  AS PERMISSIVE FOR SELECT TO "authenticated"
  USING (("userId" = (( SELECT auth.uid() AS uid))::text));

DROP POLICY IF EXISTS "purchase_update_own" ON public."Purchase";
CREATE POLICY "purchase_update_own" ON public."Purchase"
  AS PERMISSIVE FOR UPDATE TO "authenticated"
  USING (("userId" = (( SELECT auth.uid() AS uid))::text))
  WITH CHECK (("userId" = (( SELECT auth.uid() AS uid))::text));

DROP POLICY IF EXISTS "researchrun_delete" ON public."ResearchRun";
CREATE POLICY "researchrun_delete" ON public."ResearchRun"
  AS PERMISSIVE FOR DELETE TO "authenticated"
  USING ((("userId" = (( SELECT auth.uid() AS uid))::text) OR (EXISTS ( SELECT 1
   FROM "Brand" b
  WHERE ((b.id = "ResearchRun"."brandId") AND ((b."userId" = (( SELECT auth.uid() AS uid))::text) OR ((b."teamId" IS NOT NULL) AND is_team_member(b."teamId"))))))));

DROP POLICY IF EXISTS "researchrun_insert" ON public."ResearchRun";
CREATE POLICY "researchrun_insert" ON public."ResearchRun"
  AS PERMISSIVE FOR INSERT TO "authenticated"
  WITH CHECK ((("userId" = (( SELECT auth.uid() AS uid))::text) OR (EXISTS ( SELECT 1
   FROM "Brand" b
  WHERE ((b.id = "ResearchRun"."brandId") AND ((b."userId" = (( SELECT auth.uid() AS uid))::text) OR ((b."teamId" IS NOT NULL) AND is_team_member(b."teamId"))))))));

DROP POLICY IF EXISTS "researchrun_read" ON public."ResearchRun";
CREATE POLICY "researchrun_read" ON public."ResearchRun"
  AS PERMISSIVE FOR SELECT TO "authenticated"
  USING ((("userId" = (( SELECT auth.uid() AS uid))::text) OR (EXISTS ( SELECT 1
   FROM "Brand" b
  WHERE ((b.id = "ResearchRun"."brandId") AND ((b."userId" = (( SELECT auth.uid() AS uid))::text) OR ((b."teamId" IS NOT NULL) AND is_team_member(b."teamId")) OR (EXISTS ( SELECT 1
           FROM "SharedBrand" sb
          WHERE ((sb."brandId" = b.id) AND (sb."userId" = (( SELECT auth.uid() AS uid))::text))))))))));

DROP POLICY IF EXISTS "researchrun_update" ON public."ResearchRun";
CREATE POLICY "researchrun_update" ON public."ResearchRun"
  AS PERMISSIVE FOR UPDATE TO "authenticated"
  USING ((("userId" = (( SELECT auth.uid() AS uid))::text) OR (EXISTS ( SELECT 1
   FROM "Brand" b
  WHERE ((b.id = "ResearchRun"."brandId") AND ((b."userId" = (( SELECT auth.uid() AS uid))::text) OR ((b."teamId" IS NOT NULL) AND is_team_member(b."teamId"))))))))
  WITH CHECK ((("userId" = (( SELECT auth.uid() AS uid))::text) OR (EXISTS ( SELECT 1
   FROM "Brand" b
  WHERE ((b.id = "ResearchRun"."brandId") AND ((b."userId" = (( SELECT auth.uid() AS uid))::text) OR ((b."teamId" IS NOT NULL) AND is_team_member(b."teamId"))))))));

DROP POLICY IF EXISTS "rsc_select" ON public."ResearchSourceConfig";
CREATE POLICY "rsc_select" ON public."ResearchSourceConfig"
  AS PERMISSIVE FOR SELECT TO "authenticated"
  USING (true);

DROP POLICY IF EXISTS "researchtopic_delete" ON public."ResearchTopic";
CREATE POLICY "researchtopic_delete" ON public."ResearchTopic"
  AS PERMISSIVE FOR DELETE TO "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM "ResearchRun" rr
  WHERE ((rr.id = "ResearchTopic"."researchRunId") AND ((rr."userId" = (( SELECT auth.uid() AS uid))::text) OR (EXISTS ( SELECT 1
           FROM "Brand" b
          WHERE ((b.id = rr."brandId") AND ((b."userId" = (( SELECT auth.uid() AS uid))::text) OR ((b."teamId" IS NOT NULL) AND is_team_member(b."teamId")))))))))));

DROP POLICY IF EXISTS "researchtopic_read" ON public."ResearchTopic";
CREATE POLICY "researchtopic_read" ON public."ResearchTopic"
  AS PERMISSIVE FOR SELECT TO "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM "ResearchRun" rr
  WHERE ((rr.id = "ResearchTopic"."researchRunId") AND ((rr."userId" = (( SELECT auth.uid() AS uid))::text) OR (EXISTS ( SELECT 1
           FROM "Brand" b
          WHERE ((b.id = rr."brandId") AND ((b."userId" = (( SELECT auth.uid() AS uid))::text) OR ((b."teamId" IS NOT NULL) AND is_team_member(b."teamId")) OR (EXISTS ( SELECT 1
                   FROM "SharedBrand" sb
                  WHERE ((sb."brandId" = b.id) AND (sb."userId" = (( SELECT auth.uid() AS uid))::text)))))))))))));

DROP POLICY IF EXISTS "researchtopic_update" ON public."ResearchTopic";
CREATE POLICY "researchtopic_update" ON public."ResearchTopic"
  AS PERMISSIVE FOR UPDATE TO "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM "ResearchRun" rr
  WHERE ((rr.id = "ResearchTopic"."researchRunId") AND ((rr."userId" = (( SELECT auth.uid() AS uid))::text) OR (EXISTS ( SELECT 1
           FROM "Brand" b
          WHERE ((b.id = rr."brandId") AND ((b."userId" = (( SELECT auth.uid() AS uid))::text) OR ((b."teamId" IS NOT NULL) AND is_team_member(b."teamId")))))))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM "ResearchRun" rr
  WHERE ((rr.id = "ResearchTopic"."researchRunId") AND ((rr."userId" = (( SELECT auth.uid() AS uid))::text) OR (EXISTS ( SELECT 1
           FROM "Brand" b
          WHERE ((b.id = rr."brandId") AND ((b."userId" = (( SELECT auth.uid() AS uid))::text) OR ((b."teamId" IS NOT NULL) AND is_team_member(b."teamId")))))))))));

DROP POLICY IF EXISTS "researchtopic_write" ON public."ResearchTopic";
CREATE POLICY "researchtopic_write" ON public."ResearchTopic"
  AS PERMISSIVE FOR INSERT TO "authenticated"
  WITH CHECK ((EXISTS ( SELECT 1
   FROM "ResearchRun" rr
  WHERE ((rr.id = "ResearchTopic"."researchRunId") AND ((rr."userId" = (( SELECT auth.uid() AS uid))::text) OR (EXISTS ( SELECT 1
           FROM "Brand" b
          WHERE ((b.id = rr."brandId") AND ((b."userId" = (( SELECT auth.uid() AS uid))::text) OR ((b."teamId" IS NOT NULL) AND is_team_member(b."teamId")))))))))));

DROP POLICY IF EXISTS "sal_admin_read" ON public."SecurityAuditLog";
CREATE POLICY "sal_admin_read" ON public."SecurityAuditLog"
  AS PERMISSIVE FOR SELECT TO "authenticated"
  USING ((( SELECT "User".role
   FROM "User"
  WHERE ("User"."supabaseId" = (auth.uid())::text)) = 'admin'::user_role));

DROP POLICY IF EXISTS "sal_self_read_30d" ON public."SecurityAuditLog";
CREATE POLICY "sal_self_read_30d" ON public."SecurityAuditLog"
  AS PERMISSIVE FOR SELECT TO "authenticated"
  USING (((user_id = ( SELECT "User".id
   FROM "User"
  WHERE ("User"."supabaseId" = (auth.uid())::text))) AND (created_at > (now() - '30 days'::interval))));

DROP POLICY IF EXISTS "sharedbrand_delete" ON public."SharedBrand";
CREATE POLICY "sharedbrand_delete" ON public."SharedBrand"
  AS PERMISSIVE FOR DELETE TO "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM "Brand" b
  WHERE ((b.id = "SharedBrand"."brandId") AND ((b."userId" = (( SELECT auth.uid() AS uid))::text) OR ((b."teamId" IS NOT NULL) AND is_team_member(b."teamId")))))));

DROP POLICY IF EXISTS "sharedbrand_insert" ON public."SharedBrand";
CREATE POLICY "sharedbrand_insert" ON public."SharedBrand"
  AS PERMISSIVE FOR INSERT TO "authenticated"
  WITH CHECK ((EXISTS ( SELECT 1
   FROM "Brand" b
  WHERE ((b.id = "SharedBrand"."brandId") AND ((b."userId" = (( SELECT auth.uid() AS uid))::text) OR ((b."teamId" IS NOT NULL) AND is_team_member(b."teamId")))))));

DROP POLICY IF EXISTS "sharedbrand_read" ON public."SharedBrand";
CREATE POLICY "sharedbrand_read" ON public."SharedBrand"
  AS PERMISSIVE FOR SELECT TO "authenticated"
  USING (((EXISTS ( SELECT 1
   FROM "Brand" b
  WHERE ((b.id = "SharedBrand"."brandId") AND ((b."userId" = (( SELECT auth.uid() AS uid))::text) OR ((b."teamId" IS NOT NULL) AND is_team_member(b."teamId")))))) OR ("userId" = (( SELECT auth.uid() AS uid))::text)));

DROP POLICY IF EXISTS "sharedbrand_update" ON public."SharedBrand";
CREATE POLICY "sharedbrand_update" ON public."SharedBrand"
  AS PERMISSIVE FOR UPDATE TO "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM "Brand" b
  WHERE ((b.id = "SharedBrand"."brandId") AND ((b."userId" = (( SELECT auth.uid() AS uid))::text) OR ((b."teamId" IS NOT NULL) AND is_team_member(b."teamId")))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM "Brand" b
  WHERE ((b.id = "SharedBrand"."brandId") AND ((b."userId" = (( SELECT auth.uid() AS uid))::text) OR ((b."teamId" IS NOT NULL) AND is_team_member(b."teamId")))))));

DROP POLICY IF EXISTS "team_member_read" ON public."Team";
CREATE POLICY "team_member_read" ON public."Team"
  AS PERMISSIVE FOR SELECT TO "authenticated"
  USING (is_team_member(id));

DROP POLICY IF EXISTS "teammember_self_read" ON public."TeamMember";
CREATE POLICY "teammember_self_read" ON public."TeamMember"
  AS PERMISSIVE FOR SELECT TO "authenticated"
  USING (("userId" = (( SELECT auth.uid() AS uid))::text));

DROP POLICY IF EXISTS "topicselection_delete" ON public."TopicSelection";
CREATE POLICY "topicselection_delete" ON public."TopicSelection"
  AS PERMISSIVE FOR DELETE TO "authenticated"
  USING ((("userId" = (( SELECT auth.uid() AS uid))::text) OR (EXISTS ( SELECT 1
   FROM "Brand" b
  WHERE ((b.id = "TopicSelection"."brandId") AND ((b."userId" = (( SELECT auth.uid() AS uid))::text) OR ((b."teamId" IS NOT NULL) AND is_team_member(b."teamId"))))))));

DROP POLICY IF EXISTS "topicselection_insert" ON public."TopicSelection";
CREATE POLICY "topicselection_insert" ON public."TopicSelection"
  AS PERMISSIVE FOR INSERT TO "authenticated"
  WITH CHECK ((("userId" = (( SELECT auth.uid() AS uid))::text) OR (EXISTS ( SELECT 1
   FROM "Brand" b
  WHERE ((b.id = "TopicSelection"."brandId") AND ((b."userId" = (( SELECT auth.uid() AS uid))::text) OR ((b."teamId" IS NOT NULL) AND is_team_member(b."teamId"))))))));

DROP POLICY IF EXISTS "topicselection_read" ON public."TopicSelection";
CREATE POLICY "topicselection_read" ON public."TopicSelection"
  AS PERMISSIVE FOR SELECT TO "authenticated"
  USING ((("userId" = (( SELECT auth.uid() AS uid))::text) OR (EXISTS ( SELECT 1
   FROM "Brand" b
  WHERE ((b.id = "TopicSelection"."brandId") AND ((b."userId" = (( SELECT auth.uid() AS uid))::text) OR ((b."teamId" IS NOT NULL) AND is_team_member(b."teamId")) OR (EXISTS ( SELECT 1
           FROM "SharedBrand" sb
          WHERE ((sb."brandId" = b.id) AND (sb."userId" = (( SELECT auth.uid() AS uid))::text))))))))));

DROP POLICY IF EXISTS "topicselection_update" ON public."TopicSelection";
CREATE POLICY "topicselection_update" ON public."TopicSelection"
  AS PERMISSIVE FOR UPDATE TO "authenticated"
  USING ((("userId" = (( SELECT auth.uid() AS uid))::text) OR (EXISTS ( SELECT 1
   FROM "Brand" b
  WHERE ((b.id = "TopicSelection"."brandId") AND ((b."userId" = (( SELECT auth.uid() AS uid))::text) OR ((b."teamId" IS NOT NULL) AND is_team_member(b."teamId"))))))))
  WITH CHECK ((("userId" = (( SELECT auth.uid() AS uid))::text) OR (EXISTS ( SELECT 1
   FROM "Brand" b
  WHERE ((b.id = "TopicSelection"."brandId") AND ((b."userId" = (( SELECT auth.uid() AS uid))::text) OR ((b."teamId" IS NOT NULL) AND is_team_member(b."teamId"))))))));

DROP POLICY IF EXISTS "user_self_read" ON public."User";
CREATE POLICY "user_self_read" ON public."User"
  AS PERMISSIVE FOR SELECT TO "authenticated"
  USING (("supabaseId" = (( SELECT auth.uid() AS uid))::text));

DROP POLICY IF EXISTS "user_self_update" ON public."User";
CREATE POLICY "user_self_update" ON public."User"
  AS PERMISSIVE FOR UPDATE TO "authenticated"
  USING (("supabaseId" = (( SELECT auth.uid() AS uid))::text))
  WITH CHECK (("supabaseId" = (( SELECT auth.uid() AS uid))::text));

DROP POLICY IF EXISTS "us_delete" ON public."UserSession";
CREATE POLICY "us_delete" ON public."UserSession"
  AS PERMISSIVE FOR DELETE TO "authenticated"
  USING (("userId" = (( SELECT auth.uid() AS uid))::text));

DROP POLICY IF EXISTS "us_insert" ON public."UserSession";
CREATE POLICY "us_insert" ON public."UserSession"
  AS PERMISSIVE FOR INSERT TO "authenticated"
  WITH CHECK (("userId" = (( SELECT auth.uid() AS uid))::text));

DROP POLICY IF EXISTS "us_select" ON public."UserSession";
CREATE POLICY "us_select" ON public."UserSession"
  AS PERMISSIVE FOR SELECT TO "authenticated"
  USING (("userId" = (( SELECT auth.uid() AS uid))::text));

DROP POLICY IF EXISTS "us_update" ON public."UserSession";
CREATE POLICY "us_update" ON public."UserSession"
  AS PERMISSIVE FOR UPDATE TO "authenticated"
  USING (("userId" = (( SELECT auth.uid() AS uid))::text))
  WITH CHECK (("userId" = (( SELECT auth.uid() AS uid))::text));

DROP POLICY IF EXISTS "vb_delete" ON public."ViralBenchmark";
CREATE POLICY "vb_delete" ON public."ViralBenchmark"
  AS PERMISSIVE FOR DELETE TO "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM "Brand" b
  WHERE ((b.id = "ViralBenchmark"."brandId") AND ((b."userId" = (( SELECT auth.uid() AS uid))::text) OR ((b."teamId" IS NOT NULL) AND is_team_member(b."teamId")) OR (EXISTS ( SELECT 1
           FROM "SharedBrand" sb
          WHERE ((sb."brandId" = b.id) AND (sb."userId" = (( SELECT auth.uid() AS uid))::text) AND (sb.permission = 'edit'::text)))))))));

DROP POLICY IF EXISTS "vb_insert" ON public."ViralBenchmark";
CREATE POLICY "vb_insert" ON public."ViralBenchmark"
  AS PERMISSIVE FOR INSERT TO "authenticated"
  WITH CHECK ((EXISTS ( SELECT 1
   FROM "Brand" b
  WHERE ((b.id = "ViralBenchmark"."brandId") AND ((b."userId" = (( SELECT auth.uid() AS uid))::text) OR ((b."teamId" IS NOT NULL) AND is_team_member(b."teamId")) OR (EXISTS ( SELECT 1
           FROM "SharedBrand" sb
          WHERE ((sb."brandId" = b.id) AND (sb."userId" = (( SELECT auth.uid() AS uid))::text) AND (sb.permission = 'edit'::text)))))))));

DROP POLICY IF EXISTS "vb_select" ON public."ViralBenchmark";
CREATE POLICY "vb_select" ON public."ViralBenchmark"
  AS PERMISSIVE FOR SELECT TO "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM "Brand" b
  WHERE ((b.id = "ViralBenchmark"."brandId") AND ((b."isPublic" = true) OR (b."userId" = (( SELECT auth.uid() AS uid))::text) OR ((b."teamId" IS NOT NULL) AND is_team_member(b."teamId")) OR (EXISTS ( SELECT 1
           FROM "SharedBrand" sb
          WHERE ((sb."brandId" = b.id) AND (sb."userId" = (( SELECT auth.uid() AS uid))::text)))))))));

DROP POLICY IF EXISTS "vb_update" ON public."ViralBenchmark";
CREATE POLICY "vb_update" ON public."ViralBenchmark"
  AS PERMISSIVE FOR UPDATE TO "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM "Brand" b
  WHERE ((b.id = "ViralBenchmark"."brandId") AND ((b."userId" = (( SELECT auth.uid() AS uid))::text) OR ((b."teamId" IS NOT NULL) AND is_team_member(b."teamId")) OR (EXISTS ( SELECT 1
           FROM "SharedBrand" sb
          WHERE ((sb."brandId" = b.id) AND (sb."userId" = (( SELECT auth.uid() AS uid))::text) AND (sb.permission = 'edit'::text)))))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM "Brand" b
  WHERE ((b.id = "ViralBenchmark"."brandId") AND ((b."userId" = (( SELECT auth.uid() AS uid))::text) OR ((b."teamId" IS NOT NULL) AND is_team_member(b."teamId")) OR (EXISTS ( SELECT 1
           FROM "SharedBrand" sb
          WHERE ((sb."brandId" = b.id) AND (sb."userId" = (( SELECT auth.uid() AS uid))::text) AND (sb.permission = 'edit'::text)))))))));

DROP POLICY IF EXISTS "workspace_delete_owner" ON public."Workspace";
CREATE POLICY "workspace_delete_owner" ON public."Workspace"
  AS PERMISSIVE FOR DELETE TO "authenticated"
  USING ((owner_user_id = ( SELECT "User".id
   FROM "User"
  WHERE ("User"."supabaseId" = (auth.uid())::text))));

DROP POLICY IF EXISTS "workspace_select_member" ON public."Workspace";
CREATE POLICY "workspace_select_member" ON public."Workspace"
  AS PERMISSIVE FOR SELECT TO "authenticated"
  USING ((id IN ( SELECT current_user_workspace_ids() AS current_user_workspace_ids)));

DROP POLICY IF EXISTS "workspace_update_admin" ON public."Workspace";
CREATE POLICY "workspace_update_admin" ON public."Workspace"
  AS PERMISSIVE FOR UPDATE TO "authenticated"
  USING ((id IN ( SELECT current_user_admin_workspace_ids() AS current_user_admin_workspace_ids)));

DROP POLICY IF EXISTS "wsmember_delete_admin_or_self" ON public."WorkspaceMember";
CREATE POLICY "wsmember_delete_admin_or_self" ON public."WorkspaceMember"
  AS PERMISSIVE FOR DELETE TO "authenticated"
  USING (((user_id = current_app_user_id()) OR (workspace_id IN ( SELECT current_user_admin_workspace_ids() AS current_user_admin_workspace_ids))));

DROP POLICY IF EXISTS "wsmember_insert_admin" ON public."WorkspaceMember";
CREATE POLICY "wsmember_insert_admin" ON public."WorkspaceMember"
  AS PERMISSIVE FOR INSERT TO "authenticated"
  WITH CHECK ((workspace_id IN ( SELECT current_user_admin_workspace_ids() AS current_user_admin_workspace_ids)));

DROP POLICY IF EXISTS "wsmember_select_self_or_workspace" ON public."WorkspaceMember";
CREATE POLICY "wsmember_select_self_or_workspace" ON public."WorkspaceMember"
  AS PERMISSIVE FOR SELECT TO "authenticated"
  USING (((user_id = current_app_user_id()) OR (workspace_id IN ( SELECT current_user_workspace_ids() AS current_user_workspace_ids))));

DROP POLICY IF EXISTS "xprofilecache_delete_auth" ON public."XProfileCache";
CREATE POLICY "xprofilecache_delete_auth" ON public."XProfileCache"
  AS PERMISSIVE FOR DELETE TO "authenticated"
  USING (((auth.jwt() ->> 'user_role'::text) = 'admin'::text));

DROP POLICY IF EXISTS "xprofilecache_insert_auth" ON public."XProfileCache";
CREATE POLICY "xprofilecache_insert_auth" ON public."XProfileCache"
  AS PERMISSIVE FOR INSERT TO "authenticated"
  WITH CHECK ((( SELECT auth.uid() AS uid) IS NOT NULL));

DROP POLICY IF EXISTS "xprofilecache_select_auth" ON public."XProfileCache";
CREATE POLICY "xprofilecache_select_auth" ON public."XProfileCache"
  AS PERMISSIVE FOR SELECT TO "authenticated"
  USING (true);

DROP POLICY IF EXISTS "xprofilecache_update_auth" ON public."XProfileCache";
CREATE POLICY "xprofilecache_update_auth" ON public."XProfileCache"
  AS PERMISSIVE FOR UPDATE TO "authenticated"
  USING (false)
  WITH CHECK (false);
