-- Created On: 2026-07-19

-- UP:

ALTER TABLE audit_schema.access_event
  ADD CONSTRAINT chk_access_event_scoped_success CHECK (
    outcome <> 'succeeded' OR root_resource_id IS NOT NULL
  );

-- DOWN:

ALTER TABLE audit_schema.access_event
  DROP CONSTRAINT chk_access_event_scoped_success;
