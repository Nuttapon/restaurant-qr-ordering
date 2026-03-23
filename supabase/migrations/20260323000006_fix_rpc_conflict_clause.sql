-- Fix get_or_create_session: use partial index ON CONFLICT syntax
-- instead of ON CONFLICT ON CONSTRAINT (which requires a named constraint,
-- not a partial unique index)
CREATE OR REPLACE FUNCTION get_or_create_session(p_qr_token TEXT)
RETURNS json AS $$
DECLARE
  v_table   tables%ROWTYPE;
  v_session sessions%ROWTYPE;
BEGIN
  SELECT * INTO v_table FROM tables WHERE qr_token = p_qr_token FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'invalid_token' USING HINT = 'QR token not found';
  END IF;

  INSERT INTO sessions (table_id, status)
  VALUES (v_table.id, 'active')
  ON CONFLICT (table_id) WHERE status = 'active' DO NOTHING;

  SELECT * INTO v_session FROM sessions
  WHERE table_id = v_table.id AND status = 'active';

  UPDATE tables
  SET status = 'occupied'
  WHERE id = v_table.id
    AND status = 'available';

  SELECT * INTO v_table FROM tables WHERE id = v_table.id;

  RETURN json_build_object(
    'session', row_to_json(v_session),
    'table', row_to_json(v_table)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_or_create_session(TEXT) TO anon;
