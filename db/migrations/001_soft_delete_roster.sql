-- Migration: 001_soft_delete_roster
-- Date: 2026-04-26
-- Description: Add soft-delete to roster_entries so removing a player
--   from a team preserves historical lineup data.

-- 1. Add removed_at column for soft-delete
ALTER TABLE roster_entries ADD COLUMN IF NOT EXISTS removed_at TIMESTAMPTZ DEFAULT NULL;

-- 2. Replace hard UNIQUE constraint with partial unique index
--    (only enforce uniqueness among active roster entries)
ALTER TABLE roster_entries DROP CONSTRAINT IF EXISTS roster_entries_player_id_team_id_key;

CREATE UNIQUE INDEX IF NOT EXISTS idx_roster_entries_active
  ON roster_entries(player_id, team_id)
  WHERE removed_at IS NULL;

-- 3. Update stored procedures (all use CREATE OR REPLACE, safe to re-run)

-- remove_player_from_team: soft-delete instead of hard-delete
CREATE OR REPLACE FUNCTION remove_player_from_team(
  p_player_id UUID,
  p_team_id UUID,
  p_user_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
  IF NOT is_team_coach(p_team_id, p_user_id) THEN
    RAISE EXCEPTION 'Unauthorized: must be a coach to remove players';
  END IF;

  UPDATE roster_entries
  SET removed_at = NOW(), updated_at = NOW()
  WHERE player_id = p_player_id AND team_id = p_team_id AND removed_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Roster entry not found';
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- get_team_players: filter to active roster only
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
  WHERE re.team_id = p_team_id AND re.removed_at IS NULL
  ORDER BY re.number NULLS LAST, p.name;
END;
$$ LANGUAGE plpgsql STABLE;

-- get_team_players_full: returns all players including removed (for lineup rendering)
CREATE OR REPLACE FUNCTION get_team_players_full(p_team_id UUID, p_user_id UUID)
RETURNS TABLE(
  out_player_id UUID,
  out_name TEXT,
  out_number INTEGER,
  out_roster_entry_id UUID,
  out_removed_at TIMESTAMPTZ,
  out_created_by UUID,
  out_created_at TIMESTAMPTZ,
  out_updated_at TIMESTAMPTZ
) AS $$
BEGIN
  IF NOT is_team_member(p_team_id, p_user_id) THEN
    RAISE EXCEPTION 'Unauthorized: not a team member';
  END IF;

  RETURN QUERY
  SELECT p.id, p.name, re.number, re.id, re.removed_at,
         re.created_by, re.created_at, re.updated_at
  FROM players p
  JOIN roster_entries re ON p.id = re.player_id
  WHERE re.team_id = p_team_id
  ORDER BY re.removed_at NULLS FIRST, re.number NULLS LAST, p.name;
END;
$$ LANGUAGE plpgsql STABLE;

-- add_player_to_team: restore soft-deleted entry instead of failing on duplicate
CREATE OR REPLACE FUNCTION add_player_to_team(
  p_player_id UUID,
  p_team_id UUID,
  p_number INTEGER,
  p_user_id UUID
) RETURNS roster_entries AS $$
DECLARE
  result roster_entries;
  v_existing_id UUID;
BEGIN
  IF NOT is_team_coach(p_team_id, p_user_id) THEN
    RAISE EXCEPTION 'Unauthorized: must be a coach to add players';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM players WHERE id = p_player_id) THEN
    RAISE EXCEPTION 'Player not found';
  END IF;

  SELECT id INTO v_existing_id FROM roster_entries
  WHERE player_id = p_player_id AND team_id = p_team_id AND removed_at IS NOT NULL;

  IF v_existing_id IS NOT NULL THEN
    UPDATE roster_entries
    SET number = p_number, removed_at = NULL, updated_at = NOW()
    WHERE id = v_existing_id
    RETURNING * INTO result;
  ELSE
    INSERT INTO roster_entries (player_id, team_id, number, created_by)
    VALUES (p_player_id, p_team_id, p_number, p_user_id)
    RETURNING * INTO result;
  END IF;

  RETURN result;
END;
$$ LANGUAGE plpgsql;
