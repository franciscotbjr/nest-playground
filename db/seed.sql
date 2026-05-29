INSERT INTO users (id, name, age, email) VALUES
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Alice Johnson', 28, 'alice@example.com'),
  ('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'Bob Smith',     34, 'bob@example.com'),
  ('c3d4e5f6-a7b8-9012-cdef-123456789012', 'Carol White',   22, 'carol@example.com')
ON CONFLICT (email) DO NOTHING;

INSERT INTO post (id, "createdBy") VALUES
  ('d4e5f6a7-b8c9-0123-defa-234567890123', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
  ('e5f6a7b8-c9d0-1234-efab-345678901234', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
  ('f6a7b8c9-d0e1-2345-fabc-456789012345', 'b2c3d4e5-f6a7-8901-bcde-f12345678901')
ON CONFLICT DO NOTHING;

INSERT INTO "postRead" (id, "userId", "postId") VALUES
  ('a7b8c9d0-e1f2-3456-abcd-567890123456', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 'd4e5f6a7-b8c9-0123-defa-234567890123'),
  ('b8c9d0e1-f2a3-4567-bcde-678901234567', 'c3d4e5f6-a7b8-9012-cdef-123456789012', 'd4e5f6a7-b8c9-0123-defa-234567890123')
ON CONFLICT DO NOTHING;
