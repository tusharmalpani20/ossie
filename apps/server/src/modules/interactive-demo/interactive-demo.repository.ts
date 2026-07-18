import { ulid } from "ulid";
import {
  type DemoHotspot,
  type DemoHotspotType,
  type DemoScene,
  type InteractiveDemo,
  type InteractiveDemoRepository,
  type InteractiveDemoSourceCaptureSession,
  type InteractiveDemoSourceEvent,
  type InteractiveDemoSourceEventType,
  type InteractiveDemoStatus,
  type NormalizedUpdateDemoSceneInput,
  type NormalizedUpdateDemoHotspotInput,
  type NormalizedUpdateInteractiveDemoInput,
} from "./interactive-demo.service";

type QueryResult<Row> = {
  rows: Row[];
};

type Queryable = {
  query: <Row = Record<string, unknown>>(sql: string, values?: unknown[]) => Promise<QueryResult<Row>>;
};

type TransactionClient = Queryable & {
  release: () => void;
};

type TransactionCapable = Queryable & {
  connect?: () => Promise<TransactionClient>;
};

type InteractiveDemoRow = {
  id: string;
  organization_id: string;
  project_id: string;
  source_capture_session_id: string | null;
  title: string;
  description: string | null;
  status: InteractiveDemoStatus;
  created_by_id: string;
  updated_by_id: string;
  version: number;
  created_at: Date;
  updated_at: Date;
};

type DemoSceneRow = {
  id: string;
  organization_id: string;
  project_id: string;
  interactive_demo_id: string;
  source_capture_session_id: string | null;
  source_capture_event_id: string | null;
  source_capture_asset_id: string | null;
  scene_index: number;
  title: string | null;
  description: string | null;
  background_capture_asset_id: string | null;
  created_by_id: string;
  updated_by_id: string;
  version: number;
  created_at: Date;
  updated_at: Date;
};

type DemoHotspotRow = {
  id: string;
  organization_id: string;
  project_id: string;
  interactive_demo_id: string;
  demo_scene_id: string;
  hotspot_type: DemoHotspotType;
  label: string | null;
  content: string | null;
  x: string;
  y: string;
  width: string;
  height: string;
  target_scene_id: string | null;
  hotspot_index: number;
  created_by_id: string;
  updated_by_id: string;
  version: number;
  created_at: Date;
  updated_at: Date;
};

type InteractiveDemoSourceEventRow = {
  id: string;
  event_type: InteractiveDemoSourceEventType;
  event_index: number;
  capture_asset_id: string | null;
  page_title: string | null;
  target_label: string | null;
  target_text: string | null;
  note: string | null;
};

type InteractiveDemoSourceCaptureSessionRow = {
  id: string;
  name: string;
  description: string | null;
};

const first_row = <Row>(result: QueryResult<Row>) => result.rows[0] ?? null;

const map_interactive_demo = (row: InteractiveDemoRow): InteractiveDemo => ({
  id: row.id,
  organization_id: row.organization_id,
  project_id: row.project_id,
  source_capture_session_id: row.source_capture_session_id,
  title: row.title,
  description: row.description,
  status: row.status,
  created_by_id: row.created_by_id,
  updated_by_id: row.updated_by_id,
  version: row.version,
  created_at: row.created_at.toISOString(),
  updated_at: row.updated_at.toISOString(),
});

const map_demo_scene = (row: DemoSceneRow): DemoScene => ({
  id: row.id,
  organization_id: row.organization_id,
  project_id: row.project_id,
  interactive_demo_id: row.interactive_demo_id,
  source_capture_session_id: row.source_capture_session_id,
  source_capture_event_id: row.source_capture_event_id,
  source_capture_asset_id: row.source_capture_asset_id,
  scene_index: row.scene_index,
  title: row.title,
  description: row.description,
  background_capture_asset_id: row.background_capture_asset_id,
  created_by_id: row.created_by_id,
  updated_by_id: row.updated_by_id,
  version: row.version,
  created_at: row.created_at.toISOString(),
  updated_at: row.updated_at.toISOString(),
});

const map_demo_hotspot = (row: DemoHotspotRow): DemoHotspot => ({
  id: row.id,
  organization_id: row.organization_id,
  project_id: row.project_id,
  interactive_demo_id: row.interactive_demo_id,
  demo_scene_id: row.demo_scene_id,
  hotspot_type: row.hotspot_type,
  label: row.label,
  content: row.content,
  x: Number(row.x),
  y: Number(row.y),
  width: Number(row.width),
  height: Number(row.height),
  target_scene_id: row.target_scene_id,
  hotspot_index: row.hotspot_index,
  created_by_id: row.created_by_id,
  updated_by_id: row.updated_by_id,
  version: row.version,
  created_at: row.created_at.toISOString(),
  updated_at: row.updated_at.toISOString(),
});

const map_source_event = (row: InteractiveDemoSourceEventRow): InteractiveDemoSourceEvent => ({
  id: row.id,
  event_type: row.event_type,
  event_index: row.event_index,
  capture_asset_id: row.capture_asset_id,
  page_title: row.page_title,
  target_label: row.target_label,
  target_text: row.target_text,
  note: row.note,
});

const map_source_capture_session = (
  row: InteractiveDemoSourceCaptureSessionRow
): InteractiveDemoSourceCaptureSession => ({
  id: row.id,
  name: row.name,
  description: row.description,
});

const interactive_demo_select = `
  id,
  organization_id,
  project_id,
  source_capture_session_id,
  title,
  description,
  status,
  created_by_id,
  updated_by_id,
  version,
  created_at,
  updated_at
`;

const demo_scene_select = `
  id,
  organization_id,
  project_id,
  interactive_demo_id,
  source_capture_session_id,
  source_capture_event_id,
  source_capture_asset_id,
  scene_index,
  title,
  description,
  background_capture_asset_id,
  created_by_id,
  updated_by_id,
  version,
  created_at,
  updated_at
`;

const demo_hotspot_select = `
  id,
  organization_id,
  project_id,
  interactive_demo_id,
  demo_scene_id,
  hotspot_type,
  label,
  content,
  x::text AS x,
  y::text AS y,
  width::text AS width,
  height::text AS height,
  target_scene_id,
  hotspot_index,
  created_by_id,
  updated_by_id,
  version,
  created_at,
  updated_at
`;

const update_demo_assignments = (data: NormalizedUpdateInteractiveDemoInput) => {
  const assignments: string[] = [];
  const values: unknown[] = [];

  const add_assignment = (column: string, value: unknown) => {
    values.push(value);
    assignments.push(`${column} = $${values.length}`);
  };

  if (data.title !== undefined) {
    add_assignment("title", data.title);
  }
  if (data.description !== undefined) {
    add_assignment("description", data.description);
  }
  if (data.status !== undefined) {
    add_assignment("status", data.status);
  }

  return { assignments, values };
};

const update_scene_assignments = (data: NormalizedUpdateDemoSceneInput) => {
  const assignments: string[] = [];
  const values: unknown[] = [];

  const add_assignment = (column: string, value: unknown) => {
    values.push(value);
    assignments.push(`${column} = $${values.length}`);
  };

  if (data.title !== undefined) {
    add_assignment("title", data.title);
  }
  if (data.description !== undefined) {
    add_assignment("description", data.description);
  }
  if (data.background_capture_asset_id !== undefined) {
    add_assignment("background_capture_asset_id", data.background_capture_asset_id);
  }

  return { assignments, values };
};

const update_hotspot_assignments = (data: NormalizedUpdateDemoHotspotInput) => {
  const assignments: string[] = [];
  const values: unknown[] = [];

  const add_assignment = (column: string, value: unknown) => {
    values.push(value);
    assignments.push(`${column} = $${values.length}`);
  };

  if (data.hotspot_type !== undefined) add_assignment("hotspot_type", data.hotspot_type);
  if (data.label !== undefined) add_assignment("label", data.label);
  if (data.content !== undefined) add_assignment("content", data.content);
  if (data.x !== undefined) add_assignment("x", data.x);
  if (data.y !== undefined) add_assignment("y", data.y);
  if (data.width !== undefined) add_assignment("width", data.width);
  if (data.height !== undefined) add_assignment("height", data.height);
  if (data.target_scene_id !== undefined) add_assignment("target_scene_id", data.target_scene_id);

  return { assignments, values };
};

const with_transaction = async <Result>(
  db: TransactionCapable,
  operation: (client: Queryable) => Promise<Result>
) => {
  if (!db.connect) {
    return operation(db);
  }

  const client = await db.connect();
  try {
    await client.query("BEGIN");
    const result = await operation(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const build_interactive_demo_repository = (db: TransactionCapable): InteractiveDemoRepository => ({
  async project_exists(input) {
    const result = await db.query<{ exists: boolean }>(`
      SELECT EXISTS (
        SELECT 1
        FROM project_schema.project
        WHERE id = $1
        AND organization_id = $2
        AND is_deleted = FALSE
      ) AS exists
    `, [input.project_id, input.organization_id]);

    return Boolean(result.rows[0]?.exists);
  },

  async create_demo(input) {
    const result = await db.query<InteractiveDemoRow>(`
      INSERT INTO interactive_demo_schema.interactive_demo (
        id,
        organization_id,
        project_id,
        source_capture_session_id,
        title,
        description,
        created_by_id,
        updated_by_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $7)
      RETURNING ${interactive_demo_select}
    `, [
      ulid(),
      input.organization_id,
      input.project_id,
      input.data.source_capture_session_id,
      input.data.title,
      input.data.description,
      input.actor_org_user_id,
    ]);
    const row = first_row(result);

    if (!row) {
      throw new Error("Failed to create interactive demo");
    }

    return map_interactive_demo(row);
  },

  async list_demos(input) {
    const result = await db.query<InteractiveDemoRow>(`
      SELECT ${interactive_demo_select}
      FROM interactive_demo_schema.interactive_demo
      WHERE organization_id = $1
      AND project_id = $2
      AND is_deleted = FALSE
      ORDER BY created_at DESC, id DESC
    `, [input.organization_id, input.project_id]);

    return result.rows.map(map_interactive_demo);
  },

  async find_demo(input) {
    const result = await db.query<InteractiveDemoRow>(`
      SELECT ${interactive_demo_select}
      FROM interactive_demo_schema.interactive_demo
      WHERE id = $1
      AND organization_id = $2
      AND project_id = $3
      AND is_deleted = FALSE
      LIMIT 1
    `, [input.interactive_demo_id, input.organization_id, input.project_id]);
    const row = first_row(result);

    return row ? map_interactive_demo(row) : null;
  },

  async update_demo(input) {
    const update = update_demo_assignments(input.data);
    const values = [
      ...update.values,
      input.actor_org_user_id,
      input.interactive_demo_id,
      input.organization_id,
      input.project_id,
    ];
    const actor_index = update.values.length + 1;
    const demo_index = update.values.length + 2;
    const organization_index = update.values.length + 3;
    const project_index = update.values.length + 4;
    const result = await db.query<InteractiveDemoRow>(`
      UPDATE interactive_demo_schema.interactive_demo
      SET ${[
        ...update.assignments,
        `updated_by_id = $${actor_index}`,
        "updated_at = CURRENT_TIMESTAMP",
        "version = version + 1",
      ].join(", ")}
      WHERE id = $${demo_index}
      AND organization_id = $${organization_index}
      AND project_id = $${project_index}
      AND is_deleted = FALSE
      RETURNING ${interactive_demo_select}
    `, values);
    const row = first_row(result);

    return row ? map_interactive_demo(row) : null;
  },

  async delete_demo(input) {
    const result = await db.query<InteractiveDemoRow>(`
      UPDATE interactive_demo_schema.interactive_demo
      SET
        is_deleted = TRUE,
        deleted_at = CURRENT_TIMESTAMP,
        deleted_by_id = $1,
        updated_by_id = $1,
        updated_at = CURRENT_TIMESTAMP,
        version = version + 1
      WHERE id = $2
      AND organization_id = $3
      AND project_id = $4
      AND is_deleted = FALSE
      RETURNING ${interactive_demo_select}
    `, [
      input.actor_org_user_id,
      input.interactive_demo_id,
      input.organization_id,
      input.project_id,
    ]);

    return result.rows.length > 0;
  },

  async background_asset_exists(input) {
    const result = await db.query<{ exists: boolean }>(`
      SELECT EXISTS (
        SELECT 1
        FROM capture_schema.capture_asset
        WHERE id = $1
        AND organization_id = $2
        AND project_id = $3
        AND asset_type = 'screenshot'
        AND is_deleted = FALSE
      ) AS exists
    `, [input.capture_asset_id, input.organization_id, input.project_id]);

    return Boolean(result.rows[0]?.exists);
  },

  async find_capture_session_for_demo(input) {
    const result = await db.query<InteractiveDemoSourceCaptureSessionRow>(`
      SELECT id, name, description
      FROM capture_schema.capture_session
      WHERE id = $1
      AND organization_id = $2
      AND project_id = $3
      AND is_deleted = FALSE
      LIMIT 1
    `, [input.capture_session_id, input.organization_id, input.project_id]);
    const row = first_row(result);

    return row ? map_source_capture_session(row) : null;
  },

  async list_capture_events_for_demo(input) {
    const result = await db.query<InteractiveDemoSourceEventRow>(`
      SELECT
        id,
        event_type,
        event_index,
        capture_asset_id,
        page_title,
        target_label,
        target_text,
        note
      FROM capture_schema.capture_event
      WHERE organization_id = $1
      AND project_id = $2
      AND capture_session_id = $3
      AND is_deleted = FALSE
      ORDER BY event_index ASC, created_at ASC, id ASC
    `, [input.organization_id, input.project_id, input.capture_session_id]);

    return result.rows.map(map_source_event);
  },

  async list_screenshot_capture_asset_ids(input) {
    if (input.capture_asset_ids.length === 0) {
      return [];
    }

    const result = await db.query<{ id: string }>(`
      SELECT id
      FROM capture_schema.capture_asset
      WHERE id = ANY($1::varchar[])
      AND organization_id = $2
      AND project_id = $3
      AND capture_session_id = $4
      AND asset_type = 'screenshot'
      AND is_deleted = FALSE
    `, [
      input.capture_asset_ids,
      input.organization_id,
      input.project_id,
      input.capture_session_id,
    ]);

    return result.rows.map((row) => row.id);
  },

  async create_demo_from_capture(input) {
    return with_transaction(db, async (client) => {
      const demo_result = await client.query<InteractiveDemoRow>(`
        INSERT INTO interactive_demo_schema.interactive_demo (
          id,
          organization_id,
          project_id,
          source_capture_session_id,
          title,
          description,
          created_by_id,
          updated_by_id
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $7)
        RETURNING ${interactive_demo_select}
      `, [
        ulid(),
        input.organization_id,
        input.project_id,
        input.capture_session_id,
        input.data.title,
        input.data.description,
        input.actor_org_user_id,
      ]);
      const demo_row = first_row(demo_result);

      if (!demo_row) {
        throw new Error("Failed to create interactive demo");
      }

      const scene_rows: DemoSceneRow[] = [];
      for (const scene of input.data.scenes) {
        const scene_result = await client.query<DemoSceneRow>(`
          INSERT INTO interactive_demo_schema.demo_scene (
            id,
            organization_id,
            project_id,
            interactive_demo_id,
            source_capture_session_id,
            source_capture_event_id,
            source_capture_asset_id,
            scene_index,
            title,
            description,
            background_capture_asset_id,
            created_by_id,
            updated_by_id
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $12)
          RETURNING ${demo_scene_select}
        `, [
          ulid(),
          input.organization_id,
          input.project_id,
          demo_row.id,
          input.capture_session_id,
          scene.source_capture_event_id,
          scene.source_capture_asset_id,
          scene.scene_index,
          scene.title,
          scene.description,
          scene.background_capture_asset_id,
          input.actor_org_user_id,
        ]);
        const scene_row = first_row(scene_result);

        if (!scene_row) {
          throw new Error("Failed to create demo scene");
        }

        scene_rows.push(scene_row);
      }

      return {
        interactive_demo: map_interactive_demo(demo_row),
        demo_scenes: scene_rows.map(map_demo_scene),
      };
    });
  },

  async create_scene(input) {
    const index_result = await db.query<{ next_index: number }>(`
      SELECT COALESCE(MAX(scene_index), 0) + 1 AS next_index
      FROM interactive_demo_schema.demo_scene
      WHERE organization_id = $1
      AND project_id = $2
      AND interactive_demo_id = $3
      AND is_deleted = FALSE
    `, [input.organization_id, input.project_id, input.interactive_demo_id]);
    const next_index = Number(index_result.rows[0]?.next_index ?? 1);
    const result = await db.query<DemoSceneRow>(`
      INSERT INTO interactive_demo_schema.demo_scene (
        id,
        organization_id,
        project_id,
        interactive_demo_id,
        source_capture_session_id,
        source_capture_event_id,
        source_capture_asset_id,
        scene_index,
        title,
        description,
        background_capture_asset_id,
        created_by_id,
        updated_by_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $12)
      RETURNING ${demo_scene_select}
    `, [
      ulid(),
      input.organization_id,
      input.project_id,
      input.interactive_demo_id,
      input.data.source_capture_session_id,
      input.data.source_capture_event_id,
      input.data.source_capture_asset_id,
      next_index,
      input.data.title,
      input.data.description,
      input.data.background_capture_asset_id,
      input.actor_org_user_id,
    ]);
    const row = first_row(result);

    if (!row) {
      throw new Error("Failed to create demo scene");
    }

    return map_demo_scene(row);
  },

  async list_scenes(input) {
    const result = await db.query<DemoSceneRow>(`
      SELECT ${demo_scene_select}
      FROM interactive_demo_schema.demo_scene
      WHERE organization_id = $1
      AND project_id = $2
      AND interactive_demo_id = $3
      AND is_deleted = FALSE
      ORDER BY scene_index ASC, id ASC
    `, [input.organization_id, input.project_id, input.interactive_demo_id]);

    return result.rows.map(map_demo_scene);
  },

  async update_scene(input) {
    const update = update_scene_assignments(input.data);
    const values = [
      ...update.values,
      input.actor_org_user_id,
      input.demo_scene_id,
      input.organization_id,
      input.project_id,
      input.interactive_demo_id,
    ];
    const actor_index = update.values.length + 1;
    const scene_index = update.values.length + 2;
    const organization_index = update.values.length + 3;
    const project_index = update.values.length + 4;
    const demo_index = update.values.length + 5;
    const result = await db.query<DemoSceneRow>(`
      UPDATE interactive_demo_schema.demo_scene
      SET ${[
        ...update.assignments,
        `updated_by_id = $${actor_index}`,
        "updated_at = CURRENT_TIMESTAMP",
        "version = version + 1",
      ].join(", ")}
      WHERE id = $${scene_index}
      AND organization_id = $${organization_index}
      AND project_id = $${project_index}
      AND interactive_demo_id = $${demo_index}
      AND is_deleted = FALSE
      RETURNING ${demo_scene_select}
    `, values);
    const row = first_row(result);

    return row ? map_demo_scene(row) : null;
  },

  async reorder_scenes(input) {
    return with_transaction(db, async (client) => {
      const rows: DemoScene[] = [];
      const scene_count = await client.query<{
        active_scene_count: string;
        matching_scene_count: string;
      }>(`
        SELECT
          COUNT(*)::text AS active_scene_count,
          COUNT(*) FILTER (WHERE id = ANY($4::varchar[]))::text AS matching_scene_count
        FROM interactive_demo_schema.demo_scene
        WHERE organization_id = $1
        AND project_id = $2
        AND interactive_demo_id = $3
        AND is_deleted = FALSE
      `, [
        input.organization_id,
        input.project_id,
        input.interactive_demo_id,
        input.scene_ids,
      ]);
      const active_scene_count = Number(scene_count.rows[0]?.active_scene_count ?? 0);
      const matching_scene_count = Number(scene_count.rows[0]?.matching_scene_count ?? 0);

      if (
        active_scene_count !== input.scene_ids.length ||
        matching_scene_count !== input.scene_ids.length
      ) {
        return [];
      }

      await client.query(`
        UPDATE interactive_demo_schema.demo_scene
        SET scene_index = scene_index + 1000000
        WHERE organization_id = $1
        AND project_id = $2
        AND interactive_demo_id = $3
        AND is_deleted = FALSE
      `, [
        input.organization_id,
        input.project_id,
        input.interactive_demo_id,
      ]);

      for (const [index, scene_id] of input.scene_ids.entries()) {
        const result = await client.query<DemoSceneRow>(`
          UPDATE interactive_demo_schema.demo_scene
          SET
            scene_index = $1,
            updated_by_id = $2,
            updated_at = CURRENT_TIMESTAMP,
            version = version + 1
          WHERE id = $3
          AND organization_id = $4
          AND project_id = $5
          AND interactive_demo_id = $6
          AND is_deleted = FALSE
          RETURNING ${demo_scene_select}
        `, [
          index + 1,
          input.actor_org_user_id,
          scene_id,
          input.organization_id,
          input.project_id,
          input.interactive_demo_id,
        ]);
        const row = first_row(result);

        if (!row) {
          return [];
        }

        rows.push(map_demo_scene(row));
      }

      return rows;
    });
  },

  async delete_scene(input) {
    const result = await db.query<DemoSceneRow>(`
      UPDATE interactive_demo_schema.demo_scene
      SET
        is_deleted = TRUE,
        deleted_at = CURRENT_TIMESTAMP,
        deleted_by_id = $1,
        updated_by_id = $1,
        updated_at = CURRENT_TIMESTAMP,
        version = version + 1
      WHERE id = $2
      AND organization_id = $3
      AND project_id = $4
      AND interactive_demo_id = $5
      AND is_deleted = FALSE
      RETURNING ${demo_scene_select}
    `, [
      input.actor_org_user_id,
      input.demo_scene_id,
      input.organization_id,
      input.project_id,
      input.interactive_demo_id,
    ]);

    return result.rows.length > 0;
  },

  async find_scene(input) {
    const result = await db.query<DemoSceneRow>(`
      SELECT ${demo_scene_select}
      FROM interactive_demo_schema.demo_scene
      WHERE id = $1
      AND organization_id = $2
      AND project_id = $3
      AND interactive_demo_id = $4
      AND is_deleted = FALSE
      LIMIT 1
    `, [
      input.demo_scene_id,
      input.organization_id,
      input.project_id,
      input.interactive_demo_id,
    ]);
    const row = first_row(result);

    return row ? map_demo_scene(row) : null;
  },

  async create_hotspot(input) {
    const index_result = await db.query<{ next_index: number }>(`
      SELECT COALESCE(MAX(hotspot_index), 0) + 1 AS next_index
      FROM interactive_demo_schema.demo_hotspot
      WHERE organization_id = $1
      AND project_id = $2
      AND interactive_demo_id = $3
      AND demo_scene_id = $4
      AND is_deleted = FALSE
    `, [
      input.organization_id,
      input.project_id,
      input.interactive_demo_id,
      input.demo_scene_id,
    ]);
    const next_index = Number(index_result.rows[0]?.next_index ?? 1);
    const result = await db.query<DemoHotspotRow>(`
      INSERT INTO interactive_demo_schema.demo_hotspot (
        id,
        organization_id,
        project_id,
        interactive_demo_id,
        demo_scene_id,
        hotspot_type,
        label,
        content,
        x,
        y,
        width,
        height,
        target_scene_id,
        hotspot_index,
        created_by_id,
        updated_by_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $15)
      RETURNING ${demo_hotspot_select}
    `, [
      ulid(),
      input.organization_id,
      input.project_id,
      input.interactive_demo_id,
      input.demo_scene_id,
      input.data.hotspot_type,
      input.data.label,
      input.data.content,
      input.data.x,
      input.data.y,
      input.data.width,
      input.data.height,
      input.data.target_scene_id,
      next_index,
      input.actor_org_user_id,
    ]);
    const row = first_row(result);

    if (!row) {
      throw new Error("Failed to create demo hotspot");
    }

    return map_demo_hotspot(row);
  },

  async list_hotspots(input) {
    const result = await db.query<DemoHotspotRow>(`
      SELECT ${demo_hotspot_select}
      FROM interactive_demo_schema.demo_hotspot
      WHERE organization_id = $1
      AND project_id = $2
      AND interactive_demo_id = $3
      AND demo_scene_id = $4
      AND is_deleted = FALSE
      ORDER BY hotspot_index ASC, id ASC
    `, [
      input.organization_id,
      input.project_id,
      input.interactive_demo_id,
      input.demo_scene_id,
    ]);

    return result.rows.map(map_demo_hotspot);
  },

  async update_hotspot(input) {
    const update = update_hotspot_assignments(input.data);
    const values = [
      ...update.values,
      input.actor_org_user_id,
      input.demo_hotspot_id,
      input.organization_id,
      input.project_id,
      input.interactive_demo_id,
      input.demo_scene_id,
    ];
    const actor_index = update.values.length + 1;
    const hotspot_index = update.values.length + 2;
    const organization_index = update.values.length + 3;
    const project_index = update.values.length + 4;
    const demo_index = update.values.length + 5;
    const scene_index = update.values.length + 6;
    const result = await db.query<DemoHotspotRow>(`
      UPDATE interactive_demo_schema.demo_hotspot
      SET ${[
        ...update.assignments,
        `updated_by_id = $${actor_index}`,
        "updated_at = CURRENT_TIMESTAMP",
        "version = version + 1",
      ].join(", ")}
      WHERE id = $${hotspot_index}
      AND organization_id = $${organization_index}
      AND project_id = $${project_index}
      AND interactive_demo_id = $${demo_index}
      AND demo_scene_id = $${scene_index}
      AND is_deleted = FALSE
      RETURNING ${demo_hotspot_select}
    `, values);
    const row = first_row(result);

    return row ? map_demo_hotspot(row) : null;
  },

  async reorder_hotspots(input) {
    return with_transaction(db, async (client) => {
      const rows: DemoHotspot[] = [];
      const hotspot_count = await client.query<{
        active_hotspot_count: string;
        matching_hotspot_count: string;
      }>(`
        SELECT
          COUNT(*)::text AS active_hotspot_count,
          COUNT(*) FILTER (WHERE id = ANY($5::varchar[]))::text AS matching_hotspot_count
        FROM interactive_demo_schema.demo_hotspot
        WHERE organization_id = $1
        AND project_id = $2
        AND interactive_demo_id = $3
        AND demo_scene_id = $4
        AND is_deleted = FALSE
      `, [
        input.organization_id,
        input.project_id,
        input.interactive_demo_id,
        input.demo_scene_id,
        input.hotspot_ids,
      ]);
      const active_hotspot_count = Number(hotspot_count.rows[0]?.active_hotspot_count ?? 0);
      const matching_hotspot_count = Number(hotspot_count.rows[0]?.matching_hotspot_count ?? 0);

      if (
        active_hotspot_count !== input.hotspot_ids.length ||
        matching_hotspot_count !== input.hotspot_ids.length
      ) {
        return [];
      }

      await client.query(`
        UPDATE interactive_demo_schema.demo_hotspot
        SET hotspot_index = hotspot_index + 1000000
        WHERE organization_id = $1
        AND project_id = $2
        AND interactive_demo_id = $3
        AND demo_scene_id = $4
        AND is_deleted = FALSE
      `, [
        input.organization_id,
        input.project_id,
        input.interactive_demo_id,
        input.demo_scene_id,
      ]);

      for (const [index, hotspot_id] of input.hotspot_ids.entries()) {
        const result = await client.query<DemoHotspotRow>(`
          UPDATE interactive_demo_schema.demo_hotspot
          SET
            hotspot_index = $1,
            updated_by_id = $2,
            updated_at = CURRENT_TIMESTAMP,
            version = version + 1
          WHERE id = $3
          AND organization_id = $4
          AND project_id = $5
          AND interactive_demo_id = $6
          AND demo_scene_id = $7
          AND is_deleted = FALSE
          RETURNING ${demo_hotspot_select}
        `, [
          index + 1,
          input.actor_org_user_id,
          hotspot_id,
          input.organization_id,
          input.project_id,
          input.interactive_demo_id,
          input.demo_scene_id,
        ]);
        const row = first_row(result);

        if (!row) {
          return [];
        }

        rows.push(map_demo_hotspot(row));
      }

      return rows;
    });
  },

  async delete_hotspot(input) {
    const result = await db.query<DemoHotspotRow>(`
      UPDATE interactive_demo_schema.demo_hotspot
      SET
        is_deleted = TRUE,
        deleted_at = CURRENT_TIMESTAMP,
        deleted_by_id = $1,
        updated_by_id = $1,
        updated_at = CURRENT_TIMESTAMP,
        version = version + 1
      WHERE id = $2
      AND organization_id = $3
      AND project_id = $4
      AND interactive_demo_id = $5
      AND demo_scene_id = $6
      AND is_deleted = FALSE
      RETURNING ${demo_hotspot_select}
    `, [
      input.actor_org_user_id,
      input.demo_hotspot_id,
      input.organization_id,
      input.project_id,
      input.interactive_demo_id,
      input.demo_scene_id,
    ]);

    return result.rows.length > 0;
  },
});
