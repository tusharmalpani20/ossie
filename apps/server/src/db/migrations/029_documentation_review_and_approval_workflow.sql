-- 029_documentation_review_and_approval_workflow.sql
-- Created On: 2026-07-30

-- UP:

CREATE TABLE documentation_schema.documentation_review_policy (
  id VARCHAR(26) PRIMARY KEY,
  organization_id VARCHAR(26) NOT NULL,
  project_id VARCHAR(26) NOT NULL,
  documentation_site_id VARCHAR(26) NOT NULL,
  site_edition_id VARCHAR(26) NOT NULL,
  project_version_id VARCHAR(26) NOT NULL,
  mode VARCHAR(30) NOT NULL DEFAULT 'optional'
    CHECK (mode IN ('optional','approval_required')),
  required_approvals INTEGER NOT NULL DEFAULT 1
    CHECK (required_approvals BETWEEN 1 AND 10),
  require_maintainer_approval BOOLEAN NOT NULL DEFAULT FALSE,
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  created_by_id VARCHAR(26) NOT NULL,
  updated_by_id VARCHAR(26) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_documentation_review_policy_edition UNIQUE (site_edition_id),
  CONSTRAINT uq_documentation_review_policy_scope UNIQUE
    (id,site_edition_id,documentation_site_id,project_version_id,project_id,organization_id),
  CONSTRAINT fk_documentation_review_policy_edition FOREIGN KEY
    (site_edition_id,documentation_site_id,project_version_id,project_id,organization_id)
    REFERENCES documentation_schema.site_edition
    (id,documentation_site_id,project_version_id,project_id,organization_id)
    ON DELETE RESTRICT,
  CONSTRAINT fk_documentation_review_policy_creator FOREIGN KEY
    (created_by_id,organization_id)
    REFERENCES organization_schema.org_user(id,organization_id) ON DELETE RESTRICT,
  CONSTRAINT fk_documentation_review_policy_updater FOREIGN KEY
    (updated_by_id,organization_id)
    REFERENCES organization_schema.org_user(id,organization_id) ON DELETE RESTRICT
);

INSERT INTO documentation_schema.documentation_review_policy
  (id,organization_id,project_id,documentation_site_id,site_edition_id,
   project_version_id,created_by_id,updated_by_id,created_at,updated_at)
SELECT substr(md5('documentation-review-policy:' || edition.id),1,26),
       edition.organization_id,edition.project_id,edition.documentation_site_id,
       edition.id,edition.project_version_id,edition.created_by_id,
       edition.updated_by_id,edition.created_at,edition.updated_at
FROM documentation_schema.site_edition edition;

CREATE TABLE documentation_schema.documentation_review_maintainer (
  id VARCHAR(26) PRIMARY KEY,
  organization_id VARCHAR(26) NOT NULL,
  project_id VARCHAR(26) NOT NULL,
  review_policy_id VARCHAR(26) NOT NULL,
  maintainer_org_user_id VARCHAR(26) NOT NULL,
  created_by_id VARCHAR(26) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_documentation_review_maintainer UNIQUE
    (review_policy_id,maintainer_org_user_id),
  CONSTRAINT fk_documentation_review_maintainer_policy FOREIGN KEY
    (review_policy_id)
    REFERENCES documentation_schema.documentation_review_policy(id)
    ON DELETE RESTRICT,
  CONSTRAINT fk_documentation_review_maintainer_user FOREIGN KEY
    (maintainer_org_user_id,organization_id)
    REFERENCES organization_schema.org_user(id,organization_id) ON DELETE RESTRICT
);

CREATE TABLE documentation_schema.documentation_review_request (
  id VARCHAR(26) PRIMARY KEY,
  organization_id VARCHAR(26) NOT NULL,
  project_id VARCHAR(26) NOT NULL,
  documentation_site_id VARCHAR(26) NOT NULL,
  site_edition_id VARCHAR(26) NOT NULL,
  project_version_id VARCHAR(26) NOT NULL,
  site_revision_id VARCHAR(26) NOT NULL,
  request_number INTEGER NOT NULL CHECK (request_number > 0),
  status VARCHAR(20) NOT NULL CHECK
    (status IN ('open','approved','rejected','canceled','superseded')),
  required_approvals INTEGER NOT NULL CHECK (required_approvals BETWEEN 1 AND 10),
  require_maintainer_approval BOOLEAN NOT NULL,
  created_by_id VARCHAR(26) NOT NULL,
  canceled_by_org_user_id VARCHAR(26),
  canceled_at TIMESTAMPTZ,
  cancel_reason TEXT CHECK
    (cancel_reason IS NULL OR char_length(cancel_reason) BETWEEN 1 AND 1000),
  superseded_by_revision_id VARCHAR(26),
  superseded_by_org_user_id VARCHAR(26),
  superseded_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_documentation_review_request_scope UNIQUE
    (id,site_revision_id,site_edition_id,project_version_id,project_id,organization_id),
  CONSTRAINT uq_documentation_review_request_number UNIQUE
    (site_edition_id,request_number),
  CONSTRAINT fk_documentation_review_request_revision FOREIGN KEY
    (site_revision_id,site_edition_id,project_version_id,project_id,organization_id)
    REFERENCES documentation_schema.site_revision
    (id,site_edition_id,project_version_id,project_id,organization_id)
    ON DELETE RESTRICT,
  CONSTRAINT chk_documentation_review_request_terminal CHECK (
    (status='open' AND closed_at IS NULL) OR
    (status<>'open' AND closed_at IS NOT NULL)
  ),
  CONSTRAINT chk_documentation_review_request_cancel CHECK (
    (status='canceled' AND canceled_by_org_user_id IS NOT NULL
      AND canceled_at IS NOT NULL AND cancel_reason IS NOT NULL)
    OR
    (status<>'canceled' AND canceled_by_org_user_id IS NULL
      AND canceled_at IS NULL AND cancel_reason IS NULL)
  ),
  CONSTRAINT chk_documentation_review_request_superseded CHECK (
    (status='superseded' AND superseded_by_revision_id IS NOT NULL
      AND superseded_by_org_user_id IS NOT NULL AND superseded_at IS NOT NULL)
    OR
    (status<>'superseded' AND superseded_by_revision_id IS NULL
      AND superseded_by_org_user_id IS NULL AND superseded_at IS NULL)
  )
);
CREATE UNIQUE INDEX uq_documentation_review_request_open
  ON documentation_schema.documentation_review_request(site_edition_id)
  WHERE status='open';
CREATE INDEX idx_documentation_review_request_list
  ON documentation_schema.documentation_review_request
  (site_edition_id,status,created_at DESC,id DESC);

CREATE TABLE documentation_schema.documentation_review_assignment (
  id VARCHAR(26) PRIMARY KEY,
  organization_id VARCHAR(26) NOT NULL,
  project_id VARCHAR(26) NOT NULL,
  review_request_id VARCHAR(26) NOT NULL,
  reviewer_org_user_id VARCHAR(26) NOT NULL,
  is_maintainer_at_assignment BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_documentation_review_assignment UNIQUE
    (review_request_id,reviewer_org_user_id),
  CONSTRAINT uq_documentation_review_assignment_scope UNIQUE
    (id,review_request_id,organization_id),
  CONSTRAINT fk_documentation_review_assignment_request FOREIGN KEY
    (review_request_id) REFERENCES
    documentation_schema.documentation_review_request(id) ON DELETE RESTRICT,
  CONSTRAINT fk_documentation_review_assignment_reviewer FOREIGN KEY
    (reviewer_org_user_id,organization_id)
    REFERENCES organization_schema.org_user(id,organization_id) ON DELETE RESTRICT
);

CREATE TABLE documentation_schema.documentation_review_decision (
  id VARCHAR(26) PRIMARY KEY,
  organization_id VARCHAR(26) NOT NULL,
  project_id VARCHAR(26) NOT NULL,
  review_request_id VARCHAR(26) NOT NULL,
  review_assignment_id VARCHAR(26) NOT NULL,
  decision VARCHAR(20) NOT NULL CHECK (decision IN ('approve','reject')),
  reason TEXT CHECK (reason IS NULL OR char_length(reason) BETWEEN 1 AND 1000),
  decided_by_id VARCHAR(26) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_documentation_review_decision_assignment UNIQUE
    (review_assignment_id),
  CONSTRAINT fk_documentation_review_decision_assignment FOREIGN KEY
    (review_assignment_id,review_request_id,organization_id)
    REFERENCES documentation_schema.documentation_review_assignment
    (id,review_request_id,organization_id) ON DELETE RESTRICT,
  CONSTRAINT chk_documentation_review_rejection_reason CHECK
    (decision<>'reject' OR reason IS NOT NULL)
);

CREATE TABLE documentation_schema.documentation_review_notification (
  id VARCHAR(26) PRIMARY KEY,
  organization_id VARCHAR(26) NOT NULL,
  project_id VARCHAR(26) NOT NULL,
  project_version_id VARCHAR(26) NOT NULL,
  documentation_site_id VARCHAR(26) NOT NULL,
  recipient_org_user_id VARCHAR(26) NOT NULL,
  review_request_id VARCHAR(26) NOT NULL,
  site_revision_id VARCHAR(26) NOT NULL,
  source_audit_event_id VARCHAR(26) NOT NULL,
  type VARCHAR(40) NOT NULL CHECK (type IN
    ('review_assigned','review_approved','review_rejected','review_canceled',
     'review_superseded','publication_overridden')),
  status VARCHAR(10) NOT NULL DEFAULT 'unread' CHECK (status IN ('unread','read')),
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_documentation_review_notification_delivery UNIQUE
    (source_audit_event_id,recipient_org_user_id,type),
  CONSTRAINT chk_documentation_review_notification_read CHECK
    ((status='unread' AND read_at IS NULL) OR (status='read' AND read_at IS NOT NULL))
);
CREATE INDEX idx_documentation_review_notification_inbox
  ON documentation_schema.documentation_review_notification
  (recipient_org_user_id,project_version_id,status,created_at DESC,id DESC);

CREATE TABLE publish_schema.documentation_publication_review_evidence (
  id VARCHAR(26) PRIMARY KEY,
  organization_id VARCHAR(26) NOT NULL,
  project_id VARCHAR(26) NOT NULL,
  documentation_site_id VARCHAR(26) NOT NULL,
  site_edition_id VARCHAR(26) NOT NULL,
  project_version_id VARCHAR(26) NOT NULL,
  site_revision_id VARCHAR(26) NOT NULL,
  source_audit_event_id VARCHAR(26) NOT NULL UNIQUE,
  operation VARCHAR(20) NOT NULL CHECK (operation IN ('publication','rollback')),
  policy_mode VARCHAR(30) NOT NULL CHECK (policy_mode IN ('optional','approval_required')),
  policy_version INTEGER NOT NULL CHECK (policy_version > 0),
  required_approvals INTEGER NOT NULL CHECK (required_approvals BETWEEN 1 AND 10),
  require_maintainer_approval BOOLEAN NOT NULL,
  valid_approval_count INTEGER NOT NULL CHECK (valid_approval_count BETWEEN 0 AND 10),
  valid_maintainer_approval_count INTEGER NOT NULL CHECK
    (valid_maintainer_approval_count BETWEEN 0 AND 10),
  outcome VARCHAR(20) NOT NULL CHECK (outcome IN ('not_required','approved','overridden')),
  review_request_id VARCHAR(26),
  site_publication_id VARCHAR(26) NOT NULL,
  publish_link_id VARCHAR(26) NOT NULL,
  publish_link_entry_id VARCHAR(26) NOT NULL,
  override_reason TEXT CHECK
    (override_reason IS NULL OR char_length(override_reason) BETWEEN 20 AND 1000),
  created_by_id VARCHAR(26) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_documentation_publication_review_evidence_shape CHECK (
    (outcome='not_required' AND policy_mode='optional' AND review_request_id IS NULL
      AND valid_approval_count=0 AND valid_maintainer_approval_count=0
      AND override_reason IS NULL)
    OR (outcome='approved' AND review_request_id IS NOT NULL
      AND override_reason IS NULL)
    OR (outcome='overridden' AND override_reason IS NOT NULL)
  )
);

CREATE FUNCTION documentation_schema.validate_documentation_review_assignment()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  selected documentation_schema.documentation_review_request%ROWTYPE;
  reviewer_count INTEGER;
  maintainer_count INTEGER;
BEGIN
  SELECT * INTO selected
    FROM documentation_schema.documentation_review_request
   WHERE id=NEW.review_request_id;
  IF selected.created_by_id=NEW.reviewer_org_user_id THEN
    RAISE EXCEPTION 'A requester cannot review their own request'
      USING ERRCODE='23514',
        CONSTRAINT='chk_documentation_review_no_self_assignment';
  END IF;
  SELECT count(*)::int,
         count(*) FILTER (WHERE is_maintainer_at_assignment)::int
    INTO reviewer_count,maintainer_count
    FROM documentation_schema.documentation_review_assignment
   WHERE review_request_id=NEW.review_request_id;
  IF reviewer_count<selected.required_approvals
    OR (selected.require_maintainer_approval AND maintainer_count=0) THEN
    RAISE EXCEPTION 'Review assignments cannot satisfy frozen threshold'
      USING ERRCODE='23514',
        CONSTRAINT='chk_documentation_review_assignment_threshold';
  END IF;
  RETURN NEW;
END;
$$;
CREATE CONSTRAINT TRIGGER documentation_review_assignment_threshold
AFTER INSERT ON documentation_schema.documentation_review_assignment
DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION
documentation_schema.validate_documentation_review_assignment();

CREATE FUNCTION documentation_schema.validate_documentation_review_decision()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
      FROM documentation_schema.documentation_review_assignment assignment
     WHERE assignment.id=NEW.review_assignment_id
       AND assignment.review_request_id=NEW.review_request_id
       AND assignment.organization_id=NEW.organization_id
       AND assignment.reviewer_org_user_id=NEW.decided_by_id
  ) THEN
    RAISE EXCEPTION 'Decision actor must be the assigned reviewer'
      USING ERRCODE='23514',
        CONSTRAINT='chk_documentation_review_decision_actor';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER documentation_review_decision_actor
BEFORE INSERT ON documentation_schema.documentation_review_decision
FOR EACH ROW EXECUTE FUNCTION
documentation_schema.validate_documentation_review_decision();

CREATE FUNCTION documentation_schema.prevent_documentation_review_history_mutation()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'Documentation review history is immutable'
    USING ERRCODE='55000';
END;
$$;

CREATE TRIGGER documentation_review_assignment_immutable
BEFORE UPDATE OR DELETE ON documentation_schema.documentation_review_assignment
FOR EACH ROW EXECUTE FUNCTION
documentation_schema.prevent_documentation_review_history_mutation();
CREATE TRIGGER documentation_review_decision_immutable
BEFORE UPDATE OR DELETE ON documentation_schema.documentation_review_decision
FOR EACH ROW EXECUTE FUNCTION
documentation_schema.prevent_documentation_review_history_mutation();
CREATE TRIGGER documentation_publication_review_evidence_immutable
BEFORE UPDATE OR DELETE ON publish_schema.documentation_publication_review_evidence
FOR EACH ROW EXECUTE FUNCTION
documentation_schema.prevent_documentation_review_history_mutation();

ALTER FUNCTION audit_schema.mutation_command_policy_is_valid(
  TEXT,TEXT,TEXT,TEXT
) RENAME TO mutation_command_policy_is_valid_v028;
CREATE FUNCTION audit_schema.mutation_command_policy_is_valid(
  selected_command TEXT,
  selected_action TEXT,
  selected_actor_type TEXT,
  selected_source_type TEXT
)
RETURNS BOOLEAN AS $$
  SELECT audit_schema.mutation_command_policy_is_valid_v028(
    selected_command,selected_action,selected_actor_type,selected_source_type
  ) OR (
    (selected_command,selected_action) IN (
      ('documentation.review_policy.update','documentation.review_policy_updated'),
      ('documentation.review_request.create','documentation.review_requested'),
      ('documentation.review_request.cancel','documentation.review_canceled'),
      ('documentation.review_decision.approve','documentation.review_approved'),
      ('documentation.review_decision.reject','documentation.review_rejected'),
      ('documentation.review_notification.read','documentation.review_notification_read')
    )
    AND selected_actor_type='org_user'
    AND selected_source_type IN ('web','api','extension')
  );
$$ LANGUAGE SQL IMMUTABLE;
REVOKE ALL ON FUNCTION audit_schema.mutation_command_policy_is_valid(
  TEXT,TEXT,TEXT,TEXT
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION audit_schema.mutation_command_policy_is_valid(
  TEXT,TEXT,TEXT,TEXT
) TO __OSSIE_RUNTIME_DB_ROLE__;

CREATE TRIGGER documentation_review_policy_i_audit_ctx
BEFORE INSERT ON documentation_schema.documentation_review_policy
FOR EACH ROW EXECUTE FUNCTION audit_schema.require_mutation_context(
  'documentation_review_policy','direct',
  'documentation.site_package_import.apply,documentation.site.create,documentation.carry_forward'
);
CREATE CONSTRAINT TRIGGER documentation_review_policy_i_audit_evd
AFTER INSERT ON documentation_schema.documentation_review_policy
DEFERRABLE INITIALLY DEFERRED FOR EACH ROW
EXECUTE FUNCTION audit_schema.verify_mutation_evidence(
  'documentation_review_policy','direct',
  'documentation.site_package_import.apply,documentation.site.create,documentation.carry_forward'
);
CREATE TRIGGER documentation_review_policy_u_audit_ctx
BEFORE UPDATE ON documentation_schema.documentation_review_policy
FOR EACH ROW EXECUTE FUNCTION audit_schema.require_mutation_context(
  'documentation_review_policy','direct','documentation.review_policy.update'
);
CREATE CONSTRAINT TRIGGER documentation_review_policy_u_audit_evd
AFTER UPDATE ON documentation_schema.documentation_review_policy
DEFERRABLE INITIALLY DEFERRED FOR EACH ROW
EXECUTE FUNCTION audit_schema.verify_mutation_evidence(
  'documentation_review_policy','direct','documentation.review_policy.update'
);

CREATE TRIGGER documentation_review_maintainer_i_audit_ctx
BEFORE INSERT ON documentation_schema.documentation_review_maintainer
FOR EACH ROW EXECUTE FUNCTION audit_schema.require_mutation_context(
  'documentation_review_maintainer','direct','documentation.review_policy.update'
);
CREATE CONSTRAINT TRIGGER documentation_review_maintainer_i_audit_evd
AFTER INSERT ON documentation_schema.documentation_review_maintainer
DEFERRABLE INITIALLY DEFERRED FOR EACH ROW
EXECUTE FUNCTION audit_schema.verify_mutation_evidence(
  'documentation_review_maintainer','direct','documentation.review_policy.update'
);
CREATE TRIGGER documentation_review_maintainer_d_audit_ctx
BEFORE DELETE ON documentation_schema.documentation_review_maintainer
FOR EACH ROW EXECUTE FUNCTION audit_schema.require_delete_mutation_context(
  'documentation_review_maintainer','documentation.review_policy.update'
);
CREATE CONSTRAINT TRIGGER documentation_review_maintainer_d_audit_evd
AFTER DELETE ON documentation_schema.documentation_review_maintainer
DEFERRABLE INITIALLY DEFERRED FOR EACH ROW
EXECUTE FUNCTION audit_schema.verify_delete_mutation_evidence(
  'documentation_review_maintainer'
);

CREATE TRIGGER documentation_review_request_i_audit_ctx
BEFORE INSERT ON documentation_schema.documentation_review_request
FOR EACH ROW EXECUTE FUNCTION audit_schema.require_mutation_context(
  'documentation_review_request','direct','documentation.review_request.create'
);
CREATE CONSTRAINT TRIGGER documentation_review_request_i_audit_evd
AFTER INSERT ON documentation_schema.documentation_review_request
DEFERRABLE INITIALLY DEFERRED FOR EACH ROW
EXECUTE FUNCTION audit_schema.verify_mutation_evidence(
  'documentation_review_request','direct','documentation.review_request.create'
);
CREATE TRIGGER documentation_review_request_u_audit_ctx
BEFORE UPDATE ON documentation_schema.documentation_review_request
FOR EACH ROW EXECUTE FUNCTION audit_schema.require_mutation_context(
  'documentation_review_request','direct',
  'documentation.revision.create,documentation.review_request.cancel,documentation.review_decision.approve,documentation.review_decision.reject'
);
CREATE CONSTRAINT TRIGGER documentation_review_request_u_audit_evd
AFTER UPDATE ON documentation_schema.documentation_review_request
DEFERRABLE INITIALLY DEFERRED FOR EACH ROW
EXECUTE FUNCTION audit_schema.verify_mutation_evidence(
  'documentation_review_request','direct',
  'documentation.revision.create,documentation.review_request.cancel,documentation.review_decision.approve,documentation.review_decision.reject'
);

CREATE TRIGGER documentation_review_assignment_i_audit_ctx
BEFORE INSERT ON documentation_schema.documentation_review_assignment
FOR EACH ROW EXECUTE FUNCTION audit_schema.require_mutation_context(
  'documentation_review_assignment','direct','documentation.review_request.create'
);
CREATE CONSTRAINT TRIGGER documentation_review_assignment_i_audit_evd
AFTER INSERT ON documentation_schema.documentation_review_assignment
DEFERRABLE INITIALLY DEFERRED FOR EACH ROW
EXECUTE FUNCTION audit_schema.verify_mutation_evidence(
  'documentation_review_assignment','direct','documentation.review_request.create'
);
CREATE TRIGGER documentation_review_decision_i_audit_ctx
BEFORE INSERT ON documentation_schema.documentation_review_decision
FOR EACH ROW EXECUTE FUNCTION audit_schema.require_mutation_context(
  'documentation_review_decision','direct',
  'documentation.review_decision.approve,documentation.review_decision.reject'
);
CREATE CONSTRAINT TRIGGER documentation_review_decision_i_audit_evd
AFTER INSERT ON documentation_schema.documentation_review_decision
DEFERRABLE INITIALLY DEFERRED FOR EACH ROW
EXECUTE FUNCTION audit_schema.verify_mutation_evidence(
  'documentation_review_decision','direct',
  'documentation.review_decision.approve,documentation.review_decision.reject'
);

CREATE TRIGGER documentation_review_notification_i_audit_ctx
BEFORE INSERT ON documentation_schema.documentation_review_notification
FOR EACH ROW EXECUTE FUNCTION audit_schema.require_mutation_context(
  'documentation_review_notification','direct',
  'documentation.revision.create,documentation.review_request.create,documentation.review_request.cancel,documentation.review_decision.approve,documentation.review_decision.reject,publish.documentation_link.create,publish.documentation_link.manifest_update,publish.documentation_link.entry_rollback'
);
CREATE CONSTRAINT TRIGGER documentation_review_notification_i_audit_evd
AFTER INSERT ON documentation_schema.documentation_review_notification
DEFERRABLE INITIALLY DEFERRED FOR EACH ROW
EXECUTE FUNCTION audit_schema.verify_mutation_evidence(
  'documentation_review_notification','direct',
  'documentation.revision.create,documentation.review_request.create,documentation.review_request.cancel,documentation.review_decision.approve,documentation.review_decision.reject,publish.documentation_link.create,publish.documentation_link.manifest_update,publish.documentation_link.entry_rollback'
);
CREATE TRIGGER documentation_review_notification_u_audit_ctx
BEFORE UPDATE ON documentation_schema.documentation_review_notification
FOR EACH ROW EXECUTE FUNCTION audit_schema.require_mutation_context(
  'documentation_review_notification','direct','documentation.review_notification.read'
);
CREATE CONSTRAINT TRIGGER documentation_review_notification_u_audit_evd
AFTER UPDATE ON documentation_schema.documentation_review_notification
DEFERRABLE INITIALLY DEFERRED FOR EACH ROW
EXECUTE FUNCTION audit_schema.verify_mutation_evidence(
  'documentation_review_notification','direct','documentation.review_notification.read'
);

CREATE TRIGGER documentation_publication_review_evidence_i_audit_ctx
BEFORE INSERT ON publish_schema.documentation_publication_review_evidence
FOR EACH ROW EXECUTE FUNCTION audit_schema.require_mutation_context(
  'documentation_publication_review_evidence','direct',
  'publish.documentation_link.create,publish.documentation_link.manifest_update,publish.documentation_link.entry_rollback'
);
CREATE CONSTRAINT TRIGGER documentation_publication_review_evidence_i_audit_evd
AFTER INSERT ON publish_schema.documentation_publication_review_evidence
DEFERRABLE INITIALLY DEFERRED FOR EACH ROW
EXECUTE FUNCTION audit_schema.verify_mutation_evidence(
  'documentation_publication_review_evidence','direct',
  'publish.documentation_link.create,publish.documentation_link.manifest_update,publish.documentation_link.entry_rollback'
);

GRANT SELECT,INSERT,UPDATE ON
  documentation_schema.documentation_review_policy,
  documentation_schema.documentation_review_request,
  documentation_schema.documentation_review_notification
TO __OSSIE_RUNTIME_DB_ROLE__;
GRANT SELECT,INSERT,DELETE ON
  documentation_schema.documentation_review_maintainer
TO __OSSIE_RUNTIME_DB_ROLE__;
GRANT SELECT,INSERT ON
  documentation_schema.documentation_review_assignment,
  documentation_schema.documentation_review_decision,
  publish_schema.documentation_publication_review_evidence
TO __OSSIE_RUNTIME_DB_ROLE__;

-- DOWN:

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM documentation_schema.documentation_review_request)
    OR EXISTS (SELECT 1 FROM documentation_schema.documentation_review_maintainer)
    OR EXISTS (SELECT 1 FROM publish_schema.documentation_publication_review_evidence)
    OR EXISTS (
      SELECT 1 FROM documentation_schema.documentation_review_policy
      WHERE mode<>'optional' OR required_approvals<>1
        OR require_maintainer_approval OR version<>1
    )
  THEN
    RAISE EXCEPTION 'Refusing to roll back Documentation review workflow'
      USING ERRCODE='55000';
  END IF;
END;
$$;

DROP TRIGGER documentation_publication_review_evidence_immutable
  ON publish_schema.documentation_publication_review_evidence;
DROP TRIGGER documentation_publication_review_evidence_i_audit_evd
  ON publish_schema.documentation_publication_review_evidence;
DROP TRIGGER documentation_publication_review_evidence_i_audit_ctx
  ON publish_schema.documentation_publication_review_evidence;
DROP TRIGGER documentation_review_notification_u_audit_evd
  ON documentation_schema.documentation_review_notification;
DROP TRIGGER documentation_review_notification_u_audit_ctx
  ON documentation_schema.documentation_review_notification;
DROP TRIGGER documentation_review_notification_i_audit_evd
  ON documentation_schema.documentation_review_notification;
DROP TRIGGER documentation_review_notification_i_audit_ctx
  ON documentation_schema.documentation_review_notification;
DROP TRIGGER documentation_review_decision_i_audit_evd
  ON documentation_schema.documentation_review_decision;
DROP TRIGGER documentation_review_decision_i_audit_ctx
  ON documentation_schema.documentation_review_decision;
DROP TRIGGER documentation_review_assignment_i_audit_evd
  ON documentation_schema.documentation_review_assignment;
DROP TRIGGER documentation_review_assignment_i_audit_ctx
  ON documentation_schema.documentation_review_assignment;
DROP TRIGGER documentation_review_request_u_audit_evd
  ON documentation_schema.documentation_review_request;
DROP TRIGGER documentation_review_request_u_audit_ctx
  ON documentation_schema.documentation_review_request;
DROP TRIGGER documentation_review_request_i_audit_evd
  ON documentation_schema.documentation_review_request;
DROP TRIGGER documentation_review_request_i_audit_ctx
  ON documentation_schema.documentation_review_request;
DROP TRIGGER documentation_review_maintainer_d_audit_evd
  ON documentation_schema.documentation_review_maintainer;
DROP TRIGGER documentation_review_maintainer_d_audit_ctx
  ON documentation_schema.documentation_review_maintainer;
DROP TRIGGER documentation_review_maintainer_i_audit_evd
  ON documentation_schema.documentation_review_maintainer;
DROP TRIGGER documentation_review_maintainer_i_audit_ctx
  ON documentation_schema.documentation_review_maintainer;
DROP TRIGGER documentation_review_policy_u_audit_evd
  ON documentation_schema.documentation_review_policy;
DROP TRIGGER documentation_review_policy_u_audit_ctx
  ON documentation_schema.documentation_review_policy;
DROP TRIGGER documentation_review_policy_i_audit_evd
  ON documentation_schema.documentation_review_policy;
DROP TRIGGER documentation_review_policy_i_audit_ctx
  ON documentation_schema.documentation_review_policy;
DROP FUNCTION audit_schema.mutation_command_policy_is_valid(
  TEXT,TEXT,TEXT,TEXT
);
ALTER FUNCTION audit_schema.mutation_command_policy_is_valid_v028(
  TEXT,TEXT,TEXT,TEXT
) RENAME TO mutation_command_policy_is_valid;
DROP TRIGGER documentation_review_decision_immutable
  ON documentation_schema.documentation_review_decision;
DROP TRIGGER documentation_review_decision_actor
  ON documentation_schema.documentation_review_decision;
DROP FUNCTION documentation_schema.validate_documentation_review_decision();
DROP TRIGGER documentation_review_assignment_threshold
  ON documentation_schema.documentation_review_assignment;
DROP FUNCTION documentation_schema.validate_documentation_review_assignment();
DROP TRIGGER documentation_review_assignment_immutable
  ON documentation_schema.documentation_review_assignment;
DROP FUNCTION documentation_schema.prevent_documentation_review_history_mutation();
DROP TABLE publish_schema.documentation_publication_review_evidence;
DROP TABLE documentation_schema.documentation_review_notification;
DROP TABLE documentation_schema.documentation_review_decision;
DROP TABLE documentation_schema.documentation_review_assignment;
DROP INDEX documentation_schema.uq_documentation_review_request_open;
DROP INDEX documentation_schema.idx_documentation_review_request_list;
DROP TABLE documentation_schema.documentation_review_request;
DROP TABLE documentation_schema.documentation_review_maintainer;
DROP TABLE documentation_schema.documentation_review_policy;
