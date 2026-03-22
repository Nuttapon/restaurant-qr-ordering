CREATE OR REPLACE FUNCTION get_or_create_session(p_qr_token TEXT)
RETURNS json AS $$
DECLARE
  v_table  tables%ROWTYPE;
  v_session sessions%ROWTYPE;
BEGIN
  -- Verify token exists
  SELECT * INTO v_table FROM tables WHERE qr_token = p_qr_token;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'invalid_token' USING HINT = 'QR token not found';
  END IF;

  -- Atomic: insert new active session only if none exists
  INSERT INTO sessions (table_id, status)
  VALUES (v_table.id, 'active')
  ON CONFLICT ON CONSTRAINT sessions_one_active_per_table DO NOTHING;

  -- Fetch the active session (created above or existing)
  SELECT * INTO v_session FROM sessions
  WHERE table_id = v_table.id AND status = 'active';

  -- Update table status to occupied
  UPDATE tables SET status = 'occupied' WHERE id = v_table.id;

  RETURN json_build_object(
    'session', row_to_json(v_session),
    'table', row_to_json(v_table)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execution to anon role
GRANT EXECUTE ON FUNCTION get_or_create_session(TEXT) TO anon;
