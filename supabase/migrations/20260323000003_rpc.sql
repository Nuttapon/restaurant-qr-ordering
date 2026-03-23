-- get_or_create_session: atomically creates or retrieves an active session for a QR token
-- Uses FOR UPDATE lock to prevent race conditions under concurrent scans
CREATE OR REPLACE FUNCTION get_or_create_session(p_qr_token TEXT)
RETURNS json AS $$
DECLARE
  v_table   tables%ROWTYPE;
  v_session sessions%ROWTYPE;
BEGIN
  -- Lock the table row to serialize concurrent scans of the same QR code
  SELECT * INTO v_table FROM tables WHERE qr_token = p_qr_token FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'invalid_token' USING HINT = 'QR token not found';
  END IF;

  -- Insert new active session only if none exists (safe after FOR UPDATE lock)
  -- Use column + WHERE form (partial unique index, not a named constraint)
  INSERT INTO sessions (table_id, status)
  VALUES (v_table.id, 'active')
  ON CONFLICT (table_id) WHERE status = 'active' DO NOTHING;

  -- Fetch the active session (new or pre-existing)
  SELECT * INTO v_session FROM sessions
  WHERE table_id = v_table.id AND status = 'active';

  -- Update table status to occupied only if not already in a more advanced state
  -- (don't overwrite 'bill_requested' with 'occupied')
  UPDATE tables
  SET status = 'occupied'
  WHERE id = v_table.id
    AND status = 'available';

  -- Re-fetch table with fresh status for accurate response
  SELECT * INTO v_table FROM tables WHERE id = v_table.id;

  RETURN json_build_object(
    'session', row_to_json(v_session),
    'table', row_to_json(v_table)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execution to anon role
GRANT EXECUTE ON FUNCTION get_or_create_session(TEXT) TO anon;

-- get_session_summary: returns all orders + items for a session
-- Used by customer OrderSummary to avoid needing anon SELECT on orders table
-- Validates that the session belongs to the table identified by qr_token
CREATE OR REPLACE FUNCTION get_session_summary(p_session_id uuid, p_qr_token TEXT)
RETURNS json AS $$
DECLARE
  v_table   tables%ROWTYPE;
  v_session sessions%ROWTYPE;
  v_result  json;
BEGIN
  -- Verify QR token
  SELECT * INTO v_table FROM tables WHERE qr_token = p_qr_token;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'invalid_token';
  END IF;

  -- Verify session belongs to this table
  SELECT * INTO v_session FROM sessions
  WHERE id = p_session_id AND table_id = v_table.id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'session_not_found';
  END IF;

  -- Return orders with items and menu item details
  SELECT json_agg(
    json_build_object(
      'id', o.id,
      'round', o.round,
      'status', o.status,
      'created_at', o.created_at,
      'order_items', (
        SELECT json_agg(
          json_build_object(
            'id', oi.id,
            'quantity', oi.quantity,
            'unit_price', oi.unit_price,
            'note', oi.note,
            'status', oi.status,
            'menu_item', json_build_object(
              'id', mi.id,
              'name_th', mi.name_th,
              'name_en', mi.name_en
            )
          )
        )
        FROM order_items oi
        JOIN menu_items mi ON mi.id = oi.menu_item_id
        WHERE oi.order_id = o.id
      )
    )
    ORDER BY o.round
  )
  INTO v_result
  FROM orders o
  WHERE o.session_id = p_session_id;

  RETURN COALESCE(v_result, '[]'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_session_summary(uuid, TEXT) TO anon;
