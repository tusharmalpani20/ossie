import { ulid } from "ulid";
import { find_audit_command } from "../audit/audit-coverage-registry";
import { build_entity_audit_event, resolve_org_user_audit_context, type EntityAuditChange } from "../audit/entity-audit";
import { write_audit_event } from "../audit/audit.repository";
import { run_audited_mutation } from "../audit/audit-transaction";
import { build_interactive_demo_repository } from "./interactive-demo.repository";
import type { InteractiveDemoRepository } from "./interactive-demo.service";

type Pool=Parameters<typeof run_audited_mutation>[0]["pool"]&{query:<T=Record<string,unknown>>(sql:string,values?:unknown[])=>Promise<{rows:T[]}>};
type Client=Parameters<Parameters<typeof run_audited_mutation>[0]["execute"]>[0];
type Actor={organization_id:string;project_id:string;actor_org_user_id:string};
type Scope=Actor&{interactive_demo_id:string;project_version_id:string};
type Row=Record<string,unknown>&{id:string;version?:number};
type Snapshot={artifact_id:string;edition_version:number;draft_version:number;rows:Map<string,Row>}|null;
const row_key=(type:string,id:string)=>`${type}:${id}`;
const snapshot=async(client:Client,input:{organization_id:string;project_id:string;interactive_demo_id:string;project_version_id:string},lock=false):Promise<Snapshot>=>{
  if(lock)await client.query("SELECT e.id FROM interactive_demo_schema.interactive_demo_edition e WHERE e.interactive_demo_id=$1 AND e.project_version_id=$2 AND e.project_id=$3 AND e.organization_id=$4 FOR UPDATE",[input.interactive_demo_id,input.project_version_id,input.project_id,input.organization_id]);
  const root=(await client.query<{artifact_id:string;edition_id:string;edition_version:number;draft_id:string;draft_version:number}>(`SELECT a.id artifact_id,e.id edition_id,e.version edition_version,d.id draft_id,d.version draft_version FROM interactive_demo_schema.interactive_demo a JOIN interactive_demo_schema.interactive_demo_edition e ON e.interactive_demo_id=a.id JOIN interactive_demo_schema.interactive_demo_working_draft d ON d.interactive_demo_edition_id=e.id WHERE a.id=$1 AND e.project_version_id=$2 AND a.project_id=$3 AND a.organization_id=$4`,[input.interactive_demo_id,input.project_version_id,input.project_id,input.organization_id])).rows[0];if(!root)return null;
  const rows=new Map<string,Row>();
  const add=(type:string,values:Row[])=>values.forEach(row=>rows.set(row_key(type,row.id),{...row,__entity_type:type}));
  const artifact=await client.query<Row>("SELECT * FROM interactive_demo_schema.interactive_demo WHERE id=$1",[root.artifact_id]);
  const edition=await client.query<Row>("SELECT * FROM interactive_demo_schema.interactive_demo_edition WHERE id=$1",[root.edition_id]);
  const draft=await client.query<Row>("SELECT * FROM interactive_demo_schema.interactive_demo_working_draft WHERE id=$1",[root.draft_id]);
  const scenes=await client.query<Row>("SELECT * FROM interactive_demo_schema.demo_scene WHERE interactive_demo_working_draft_id=$1",[root.draft_id]);
  const hotspots=await client.query<Row>("SELECT * FROM interactive_demo_schema.demo_hotspot WHERE interactive_demo_working_draft_id=$1",[root.draft_id]);
  const transitions=await client.query<Row>("SELECT * FROM interactive_demo_schema.demo_transition WHERE interactive_demo_working_draft_id=$1",[root.draft_id]);
  add("interactive_demo",artifact.rows);add("interactive_demo_edition",edition.rows);add("interactive_demo_working_draft",draft.rows);add("demo_scene",scenes.rows);add("demo_hotspot",hotspots.rows);add("demo_transition",transitions.rows);
  return{artifact_id:root.artifact_id,edition_version:root.edition_version,draft_version:root.draft_version,rows};
};
const audit_field_kind=(field:string):"boolean"|"text"|"identifier"|"integer"|"decimal"|"timestamp"|"enum"=>
 field==="id"||field.endsWith("_id")?"identifier":
 field==="version"||field.endsWith("_index")?"integer":
 ["x","y","width","height"].includes(field)?"decimal":
 field.startsWith("is_")?"boolean":
 field.endsWith("_at")?"timestamp":
 field==="status"||field==="hotspot_type"?"enum":"text";
const changes=(before:Snapshot,after:Snapshot):EntityAuditChange[]=>{const keys=new Set([...(before?.rows.keys()??[]),...(after?.rows.keys()??[])]);const out:EntityAuditChange[]=[];for(const key of keys){const prior=before?.rows.get(key)??null,next=after?.rows.get(key)??null;if(JSON.stringify(prior)===JSON.stringify(next))continue;const row=next??prior!;const type=String(row.__entity_type);const clean=(value:Row|null)=>value?Object.fromEntries(Object.entries(value).filter(([field])=>field!=="__entity_type")):null;const safe_fields=Object.fromEntries(Object.keys(clean(row)!).filter(k=>!["content","description"].includes(k)).map(k=>[k,audit_field_kind(k)])) as EntityAuditChange["safe_fields"];out.push({entity_type:type,entity_id:row.id,parent_entity_type:"interactive_demo",parent_entity_id:(after??before)!.artifact_id,before:clean(prior),after:clean(next),safe_fields,redacted_fields:["content","description"]});}return out};

export const build_audited_interactive_demo_repository=(pool:Pool):InteractiveDemoRepository=>{
 const base=build_interactive_demo_repository(pool);
 const run=async<T>(o:{command:Parameters<typeof find_audit_command>[0];action:string;actor:Actor;scope?:{interactive_demo_id:string;project_version_id:string};execute:(r:InteractiveDemoRepository)=>Promise<T>;result_scope?:(result:T)=>{interactive_demo_id:string;project_version_id:string}})=>{const event_id=ulid(),occurred_at=new Date().toISOString();let before:Snapshot=null,after:Snapshot=null,context:Awaited<ReturnType<typeof resolve_org_user_audit_context>>|null=null;return run_audited_mutation({pool,event_id,command:find_audit_command(o.command),context:async client=>{if(o.scope)before=await snapshot(client,{...o.actor,...o.scope},true);context=await resolve_org_user_audit_context(client,o.actor);return context.mutation},execute:async client=>{const result=await o.execute(build_interactive_demo_repository(client));const scope=o.scope??o.result_scope?.(result);if(scope)after=await snapshot(client,{...o.actor,...scope});return result},build_event:()=>{if(!after&&!before)return null;const diff=changes(before,after);if(!diff.length)return null;const root=(after??before)!;return build_entity_audit_event({id:event_id,organization_id:o.actor.organization_id,project_id:o.actor.project_id,root_resource_type:"interactive_demo",root_resource_id:root.artifact_id,action:o.action,actor_org_user_id:o.actor.actor_org_user_id,actor_label:context!.actor_label,source_type:context!.mutation.source_type,occurred_at,before_row_version:before?.draft_version??before?.edition_version??null,after_row_version:after?.draft_version??after?.edition_version??null,changes:diff})},write_audit_event})};
 const scoped=<T>(command:Parameters<typeof find_audit_command>[0],action:string,input:Scope,execute:(r:InteractiveDemoRepository)=>Promise<T>)=>run({command,action,actor:input,scope:input,execute});
 return{...base,
  create_demo:i=>run({command:"interactive_demo.create",action:"interactive_demo.created",actor:i,execute:r=>r.create_demo(i),result_scope:x=>({interactive_demo_id:x.artifact.id,project_version_id:x.edition.project_version_id})}),
  create_demo_from_capture:i=>run({command:"interactive_demo.create_from_capture",action:"interactive_demo.created",actor:i,execute:r=>r.create_demo_from_capture(i),result_scope:x=>({interactive_demo_id:x.artifact.id,project_version_id:x.edition.project_version_id})}),
  update_demo:i=>scoped("interactive_demo.update","interactive_demo.edition.updated",i,r=>r.update_demo(i)),
  update_demo_status:i=>scoped(i.status==="archived"?"interactive_demo.archive":"interactive_demo.restore",i.status==="archived"?"interactive_demo.edition.archived":"interactive_demo.edition.restored",i,r=>r.update_demo_status(i)),
  create_scene:i=>scoped("interactive_demo.scene.create","interactive_demo.scene.created",i,r=>r.create_scene(i)),
  update_scene:i=>scoped("interactive_demo.scene.update","interactive_demo.scene.updated",i,r=>r.update_scene(i)),
  reorder_scenes:i=>scoped("interactive_demo.scenes.reorder","interactive_demo.scenes.reordered",i,r=>r.reorder_scenes(i)),
  delete_scene:i=>scoped("interactive_demo.scene.delete","interactive_demo.scene.deleted",i,r=>r.delete_scene(i)),
  create_hotspot:i=>scoped("interactive_demo.hotspot.create","interactive_demo.hotspot.created",i,r=>r.create_hotspot(i)),
  update_hotspot:i=>scoped("interactive_demo.hotspot.update","interactive_demo.hotspot.updated",i,r=>r.update_hotspot(i)),
  reorder_hotspots:i=>scoped("interactive_demo.hotspots.reorder","interactive_demo.hotspots.reordered",i,r=>r.reorder_hotspots(i)),
  delete_hotspot:i=>scoped("interactive_demo.hotspot.delete","interactive_demo.hotspot.deleted",i,r=>r.delete_hotspot(i)),
 };
};
