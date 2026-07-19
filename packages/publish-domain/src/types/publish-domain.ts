import type { PublishArtifactType } from "@repo/constants";
import type {
  DemoHotspot,
  DemoScene,
  InteractiveDemoArtifact,
  InteractiveDemoEdition,
  InteractiveDemoWorkingDraft,
} from "@repo/types/demo";
import type {
  GuideArtifact,
  GuideBlock,
  GuideEdition,
  GuideSourceCaptureAsset,
  GuideWorkingDraft,
} from "@repo/types/guide";

export type PublishTargetType = PublishArtifactType;

export type PublishAuthScope = {
  organization_id: string;
  project_id: string;
  actor_org_user_id: string;
};

export type PublishClock = {
  now: Date;
};

export type PublishSlugCandidate = {
  existing_link: { slug: string } | null;
  generated_slug: string;
};

export type GuidePublishSourceDetail = {
  artifact: GuideArtifact;
  edition: GuideEdition;
  working_draft: GuideWorkingDraft;
  guide_blocks: GuideBlock[];
  source_capture_assets: GuideSourceCaptureAsset[];
};

export type InteractiveDemoPublishSourceDetail = {
  artifact: InteractiveDemoArtifact;
  edition: InteractiveDemoEdition;
  working_draft: InteractiveDemoWorkingDraft;
  demo_scenes: DemoScene[];
  demo_hotspots: DemoHotspot[];
  source_capture_assets: GuideSourceCaptureAsset[];
};

export type PublishViewerSessionRecord = {
  publish_link_id: string;
  expires_at: string;
  revoked_at: string | null;
};
