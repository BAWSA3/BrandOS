-- Opp Pairings — cached opp matches with interaction data
CREATE TABLE IF NOT EXISTS "OppPairings" (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT NOT NULL,
  opp_username TEXT NOT NULL,
  score_at_match INTEGER NOT NULL,
  opp_score_at_match INTEGER NOT NULL,
  interaction_score INTEGER NOT NULL DEFAULT 0,
  interaction_data JSONB,
  matched_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_opp_pairings_username ON "OppPairings" (username);
CREATE INDEX idx_opp_pairings_expires ON "OppPairings" (expires_at);

-- Opp Matchups — every matchup ever run (for leaderboard tracking)
CREATE TABLE IF NOT EXISTS "OppMatchups" (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user1_username TEXT NOT NULL,
  user2_username TEXT NOT NULL,
  user1_score INTEGER NOT NULL,
  user2_score INTEGER NOT NULL,
  winner_username TEXT NOT NULL,
  interaction_score INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_opp_matchups_user1 ON "OppMatchups" (user1_username);
CREATE INDEX idx_opp_matchups_user2 ON "OppMatchups" (user2_username);
CREATE INDEX idx_opp_matchups_created ON "OppMatchups" (created_at DESC);

-- Opp Email Captures — email signups from "beat my opp" CTA
CREATE TABLE IF NOT EXISTS "OppEmailCaptures" (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  username TEXT NOT NULL,
  opp_username TEXT NOT NULL,
  user_score INTEGER NOT NULL,
  opp_score INTEGER NOT NULL,
  report_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_opp_emails_email ON "OppEmailCaptures" (email);

-- RLS Policies — allow anonymous inserts and reads for opp features
ALTER TABLE "OppPairings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "OppMatchups" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "OppEmailCaptures" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous read OppPairings" ON "OppPairings" FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert OppPairings" ON "OppPairings" FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update OppPairings" ON "OppPairings" FOR UPDATE USING (true);

CREATE POLICY "Allow anonymous read OppMatchups" ON "OppMatchups" FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert OppMatchups" ON "OppMatchups" FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anonymous read OppEmailCaptures" ON "OppEmailCaptures" FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert OppEmailCaptures" ON "OppEmailCaptures" FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update OppEmailCaptures" ON "OppEmailCaptures" FOR UPDATE USING (true);
