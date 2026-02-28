-- ============================================================
-- Authorization helpers
-- ============================================================

CREATE OR REPLACE FUNCTION is_team_member(p_team_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM team_memberships
    WHERE team_id = p_team_id AND user_id = p_user_id
  );
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION is_team_coach(p_team_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM team_memberships
    WHERE team_id = p_team_id AND user_id = p_user_id
      AND role IN ('head_coach', 'assistant_coach')
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================
-- User
-- ============================================================

CREATE OR REPLACE FUNCTION get_or_create_user(
  p_stytch_user_id TEXT,
  p_email TEXT,
  p_name TEXT DEFAULT NULL
) RETURNS TABLE(out_id UUID, out_stytch_user_id TEXT, out_email TEXT, out_name TEXT) AS $$
BEGIN
  RETURN QUERY
  INSERT INTO users (stytch_user_id, email, name)
  VALUES (p_stytch_user_id, p_email, p_name)
  ON CONFLICT (stytch_user_id)
  DO UPDATE SET email = EXCLUDED.email,
               name = COALESCE(EXCLUDED.name, users.name),
               updated_at = NOW()
  RETURNING users.id, users.stytch_user_id, users.email, users.name;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- League (secondary)
-- ============================================================

CREATE OR REPLACE FUNCTION create_league(
  p_name TEXT,
  p_user_id UUID
) RETURNS leagues AS $$
DECLARE
  result leagues;
BEGIN
  INSERT INTO leagues (name, created_by)
  VALUES (p_name, p_user_id)
  RETURNING * INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- Season (secondary)
-- ============================================================

CREATE OR REPLACE FUNCTION create_season(
  p_league_id UUID,
  p_name TEXT,
  p_start_date DATE,
  p_end_date DATE,
  p_user_id UUID
) RETURNS seasons AS $$
DECLARE
  result seasons;
BEGIN
  INSERT INTO seasons (league_id, name, start_date, end_date, created_by)
  VALUES (p_league_id, p_name, p_start_date, p_end_date, p_user_id)
  RETURNING * INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_league_seasons(p_league_id UUID)
RETURNS SETOF seasons AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM seasons WHERE league_id = p_league_id ORDER BY created_at DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================
-- Team
-- ============================================================

CREATE OR REPLACE FUNCTION create_team(
  p_name TEXT,
  p_season_id UUID,
  p_league_id UUID,
  p_user_id UUID
) RETURNS teams AS $$
DECLARE
  result teams;
BEGIN
  INSERT INTO teams (name, season_id, league_id, created_by)
  VALUES (p_name, p_season_id, p_league_id, p_user_id)
  RETURNING * INTO result;

  INSERT INTO team_memberships (team_id, user_id, role, created_by)
  VALUES (result.id, p_user_id, 'head_coach', p_user_id);

  RETURN result;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_user_teams(p_user_id UUID)
RETURNS SETOF teams AS $$
BEGIN
  RETURN QUERY
  SELECT t.* FROM teams t
  JOIN team_memberships tm ON t.id = tm.team_id
  WHERE tm.user_id = p_user_id
  ORDER BY t.created_at DESC;
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION get_team(p_team_id UUID, p_user_id UUID)
RETURNS teams AS $$
DECLARE
  result teams;
BEGIN
  IF NOT is_team_member(p_team_id, p_user_id) THEN
    RAISE EXCEPTION 'Unauthorized: not a team member';
  END IF;

  SELECT * INTO result FROM teams WHERE id = p_team_id;
  RETURN result;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================
-- Team Membership
-- ============================================================

CREATE OR REPLACE FUNCTION add_team_member(
  p_team_id UUID,
  p_user_id UUID,
  p_role TEXT,
  p_created_by UUID
) RETURNS team_memberships AS $$
DECLARE
  result team_memberships;
BEGIN
  IF NOT is_team_coach(p_team_id, p_created_by) THEN
    RAISE EXCEPTION 'Unauthorized: must be a coach to add members';
  END IF;

  INSERT INTO team_memberships (team_id, user_id, role, created_by)
  VALUES (p_team_id, p_user_id, p_role, p_created_by)
  RETURNING * INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION remove_team_member(
  p_team_id UUID,
  p_user_id UUID,
  p_requesting_user_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_role TEXT;
  v_head_coach_count INTEGER;
BEGIN
  IF NOT is_team_coach(p_team_id, p_requesting_user_id) THEN
    RAISE EXCEPTION 'Unauthorized: must be a coach to remove members';
  END IF;

  SELECT role INTO v_role FROM team_memberships
  WHERE team_id = p_team_id AND user_id = p_user_id;

  IF v_role IS NULL THEN
    RAISE EXCEPTION 'Member not found';
  END IF;

  IF v_role = 'head_coach' THEN
    SELECT COUNT(*) INTO v_head_coach_count FROM team_memberships
    WHERE team_id = p_team_id AND role = 'head_coach';
    IF v_head_coach_count <= 1 THEN
      RAISE EXCEPTION 'Cannot remove the last head coach';
    END IF;
  END IF;

  DELETE FROM team_memberships
  WHERE team_id = p_team_id AND user_id = p_user_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_team_members(p_team_id UUID, p_user_id UUID)
RETURNS TABLE(
  out_id UUID,
  out_team_id UUID,
  out_user_id UUID,
  out_role TEXT,
  out_user_email TEXT,
  out_user_name TEXT,
  out_created_by UUID,
  out_created_at TIMESTAMPTZ,
  out_updated_at TIMESTAMPTZ
) AS $$
BEGIN
  IF NOT is_team_member(p_team_id, p_user_id) THEN
    RAISE EXCEPTION 'Unauthorized: not a team member';
  END IF;

  RETURN QUERY
  SELECT tm.id, tm.team_id, tm.user_id, tm.role,
         u.email, u.name,
         tm.created_by, tm.created_at, tm.updated_at
  FROM team_memberships tm
  JOIN users u ON tm.user_id = u.id
  WHERE tm.team_id = p_team_id
  ORDER BY tm.created_at;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================
-- Player and Roster
-- ============================================================

CREATE OR REPLACE FUNCTION create_player_on_team(
  p_team_id UUID,
  p_name TEXT,
  p_number INTEGER,
  p_user_id UUID
) RETURNS TABLE(
  out_player_id UUID,
  out_name TEXT,
  out_number INTEGER,
  out_roster_entry_id UUID,
  out_created_by UUID,
  out_created_at TIMESTAMPTZ,
  out_updated_at TIMESTAMPTZ
) AS $$
DECLARE
  v_player_id UUID;
  v_roster_entry_id UUID;
  v_now TIMESTAMPTZ := NOW();
BEGIN
  IF NOT is_team_coach(p_team_id, p_user_id) THEN
    RAISE EXCEPTION 'Unauthorized: must be a coach to add players';
  END IF;

  INSERT INTO players (name, created_by, created_at, updated_at)
  VALUES (p_name, p_user_id, v_now, v_now)
  RETURNING id INTO v_player_id;

  INSERT INTO roster_entries (player_id, team_id, number, created_by, created_at, updated_at)
  VALUES (v_player_id, p_team_id, p_number, p_user_id, v_now, v_now)
  RETURNING id INTO v_roster_entry_id;

  RETURN QUERY
  SELECT v_player_id, p_name, p_number, v_roster_entry_id, p_user_id, v_now, v_now;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION add_player_to_team(
  p_player_id UUID,
  p_team_id UUID,
  p_number INTEGER,
  p_user_id UUID
) RETURNS roster_entries AS $$
DECLARE
  result roster_entries;
BEGIN
  IF NOT is_team_coach(p_team_id, p_user_id) THEN
    RAISE EXCEPTION 'Unauthorized: must be a coach to add players';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM players WHERE id = p_player_id) THEN
    RAISE EXCEPTION 'Player not found';
  END IF;

  INSERT INTO roster_entries (player_id, team_id, number, created_by)
  VALUES (p_player_id, p_team_id, p_number, p_user_id)
  RETURNING * INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_player(
  p_player_id UUID,
  p_name TEXT,
  p_user_id UUID
) RETURNS players AS $$
DECLARE
  result players;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM roster_entries re
    WHERE re.player_id = p_player_id
      AND is_team_coach(re.team_id, p_user_id)
  ) THEN
    RAISE EXCEPTION 'Unauthorized: must be a coach on a team the player belongs to';
  END IF;

  UPDATE players SET name = p_name, updated_at = NOW()
  WHERE id = p_player_id
  RETURNING * INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_roster_entry(
  p_roster_entry_id UUID,
  p_number INTEGER,
  p_user_id UUID
) RETURNS roster_entries AS $$
DECLARE
  result roster_entries;
  v_team_id UUID;
BEGIN
  SELECT team_id INTO v_team_id FROM roster_entries WHERE id = p_roster_entry_id;
  IF v_team_id IS NULL THEN
    RAISE EXCEPTION 'Roster entry not found';
  END IF;

  IF NOT is_team_coach(v_team_id, p_user_id) THEN
    RAISE EXCEPTION 'Unauthorized: must be a coach to update roster entries';
  END IF;

  UPDATE roster_entries SET number = p_number, updated_at = NOW()
  WHERE id = p_roster_entry_id
  RETURNING * INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION remove_player_from_team(
  p_player_id UUID,
  p_team_id UUID,
  p_user_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
  IF NOT is_team_coach(p_team_id, p_user_id) THEN
    RAISE EXCEPTION 'Unauthorized: must be a coach to remove players';
  END IF;

  DELETE FROM roster_entries
  WHERE player_id = p_player_id AND team_id = p_team_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Roster entry not found';
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_team_players(p_team_id UUID, p_user_id UUID)
RETURNS TABLE(
  out_player_id UUID,
  out_name TEXT,
  out_number INTEGER,
  out_roster_entry_id UUID,
  out_created_by UUID,
  out_created_at TIMESTAMPTZ,
  out_updated_at TIMESTAMPTZ
) AS $$
BEGIN
  IF NOT is_team_member(p_team_id, p_user_id) THEN
    RAISE EXCEPTION 'Unauthorized: not a team member';
  END IF;

  RETURN QUERY
  SELECT p.id, p.name, re.number, re.id,
         re.created_by, re.created_at, re.updated_at
  FROM players p
  JOIN roster_entries re ON p.id = re.player_id
  WHERE re.team_id = p_team_id
  ORDER BY re.number NULLS LAST, p.name;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================
-- Lineup
-- ============================================================

CREATE OR REPLACE FUNCTION save_lineup(
  p_id UUID,
  p_team_id UUID,
  p_user_id UUID,
  p_game_context JSONB,
  p_available_player_ids JSONB,
  p_batting_order JSONB,
  p_innings JSONB,
  p_status TEXT DEFAULT 'draft'
) RETURNS lineups AS $$
DECLARE
  result lineups;
BEGIN
  IF NOT is_team_coach(p_team_id, p_user_id) THEN
    RAISE EXCEPTION 'Unauthorized: must be a coach to save lineups';
  END IF;

  INSERT INTO lineups (id, team_id, game_context, available_player_ids, batting_order, innings, status, created_by)
  VALUES (COALESCE(p_id, uuid_generate_v4()), p_team_id, p_game_context, p_available_player_ids, p_batting_order, p_innings, p_status, p_user_id)
  ON CONFLICT (id) DO UPDATE SET
    game_context = EXCLUDED.game_context,
    available_player_ids = EXCLUDED.available_player_ids,
    batting_order = EXCLUDED.batting_order,
    innings = EXCLUDED.innings,
    status = EXCLUDED.status,
    updated_at = NOW()
  RETURNING * INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_team_lineups(p_team_id UUID, p_user_id UUID)
RETURNS SETOF lineups AS $$
BEGIN
  IF NOT is_team_member(p_team_id, p_user_id) THEN
    RAISE EXCEPTION 'Unauthorized: not a team member';
  END IF;

  RETURN QUERY
  SELECT * FROM lineups
  WHERE team_id = p_team_id
  ORDER BY game_context->>'dateTime' NULLS LAST, created_at;
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION get_lineup(p_lineup_id UUID, p_user_id UUID)
RETURNS lineups AS $$
DECLARE
  result lineups;
  v_team_id UUID;
BEGIN
  SELECT team_id INTO v_team_id FROM lineups WHERE id = p_lineup_id;
  IF v_team_id IS NULL THEN
    RAISE EXCEPTION 'Lineup not found';
  END IF;

  IF NOT is_team_member(v_team_id, p_user_id) THEN
    RAISE EXCEPTION 'Unauthorized: not a team member';
  END IF;

  SELECT * INTO result FROM lineups WHERE id = p_lineup_id;
  RETURN result;
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION delete_lineup(p_lineup_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_team_id UUID;
BEGIN
  SELECT team_id INTO v_team_id FROM lineups WHERE id = p_lineup_id;
  IF v_team_id IS NULL THEN
    RAISE EXCEPTION 'Lineup not found';
  END IF;

  IF NOT is_team_coach(v_team_id, p_user_id) THEN
    RAISE EXCEPTION 'Unauthorized: must be a coach to delete lineups';
  END IF;

  DELETE FROM lineups WHERE id = p_lineup_id;
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- Player Relationship (secondary)
-- ============================================================

CREATE OR REPLACE FUNCTION add_player_relationship(
  p_player_id UUID,
  p_user_id UUID,
  p_relationship TEXT,
  p_created_by UUID
) RETURNS player_relationships AS $$
DECLARE
  result player_relationships;
BEGIN
  INSERT INTO player_relationships (player_id, user_id, relationship, created_by)
  VALUES (p_player_id, p_user_id, p_relationship, p_created_by)
  RETURNING * INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_player_relationships(
  p_player_id UUID,
  p_requesting_user_id UUID
) RETURNS SETOF player_relationships AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM roster_entries re
    WHERE re.player_id = p_player_id
      AND is_team_member(re.team_id, p_requesting_user_id)
  ) THEN
    RAISE EXCEPTION 'Unauthorized: not a member of any team this player belongs to';
  END IF;

  RETURN QUERY
  SELECT * FROM player_relationships
  WHERE player_id = p_player_id
  ORDER BY created_at;
END;
$$ LANGUAGE plpgsql STABLE;
