-- Upsert user on login via Stytch
CREATE OR REPLACE FUNCTION get_or_create_user(
  p_stytch_user_id TEXT,
  p_email TEXT
) RETURNS TABLE(out_id UUID, out_stytch_user_id TEXT, out_email TEXT) AS $$
BEGIN
  RETURN QUERY
  INSERT INTO users (stytch_user_id, email)
  VALUES (p_stytch_user_id, p_email)
  ON CONFLICT (stytch_user_id)
  DO UPDATE SET email = EXCLUDED.email, updated_at = NOW()
  RETURNING users.id, users.stytch_user_id, users.email;
END;
$$ LANGUAGE plpgsql;

-- List all seasons for a user, newest first
CREATE OR REPLACE FUNCTION get_user_seasons(p_user_id UUID)
RETURNS SETOF seasons AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM seasons WHERE user_id = p_user_id ORDER BY created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Create a new season owned by a user
CREATE OR REPLACE FUNCTION create_season(
  p_user_id UUID,
  p_name TEXT
) RETURNS seasons AS $$
DECLARE
  result seasons;
BEGIN
  INSERT INTO seasons (user_id, name)
  VALUES (p_user_id, p_name)
  RETURNING * INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Get lineups for a season, with ownership check
CREATE OR REPLACE FUNCTION get_season_lineups(
  p_season_id UUID,
  p_user_id UUID
) RETURNS SETOF lineups AS $$
BEGIN
  RETURN QUERY
  SELECT l.* FROM lineups l
  JOIN seasons s ON l.season_id = s.id
  WHERE l.season_id = p_season_id AND s.user_id = p_user_id
  ORDER BY l.created_at;
END;
$$ LANGUAGE plpgsql;

-- Upsert a lineup with ownership check
CREATE OR REPLACE FUNCTION save_lineup(
  p_id UUID,
  p_season_id UUID,
  p_user_id UUID,
  p_game_context JSONB,
  p_players JSONB,
  p_batting_order JSONB,
  p_innings JSONB
) RETURNS lineups AS $$
DECLARE
  result lineups;
  v_season_owner UUID;
BEGIN
  SELECT user_id INTO v_season_owner FROM seasons WHERE id = p_season_id;
  IF v_season_owner IS NULL OR v_season_owner != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized: season not owned by user';
  END IF;

  INSERT INTO lineups (id, season_id, game_context, players, batting_order, innings)
  VALUES (COALESCE(p_id, uuid_generate_v4()), p_season_id, p_game_context, p_players, p_batting_order, p_innings)
  ON CONFLICT (id) DO UPDATE SET
    game_context = EXCLUDED.game_context,
    players = EXCLUDED.players,
    batting_order = EXCLUDED.batting_order,
    innings = EXCLUDED.innings,
    updated_at = NOW()
  RETURNING * INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql;
