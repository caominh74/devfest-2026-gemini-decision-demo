import type { QuestionBlock, StateBlock } from "./types";

export interface PlaygroundExample {
  id: string;
  title: string;
  description: string;
  stateBlocks: StateBlock[];
  questions: QuestionBlock[];
}

export const PLAYGROUND_EXAMPLES: PlaygroundExample[] = [
  {
    id: "pr-triage",
    title: "Triage a pull request",
    description:
      "Evaluate breaking-change risk, review queue, and code clarity in one call",
    stateBlocks: [
      {
        id: "ex_pr_1",
        kind: "variable",
        key: "pr_title",
        valueType: "string",
        value: "Migrate auth middleware to async cookies() for Next.js 16",
      },
      {
        id: "ex_pr_2",
        kind: "variable",
        key: "files_changed",
        valueType: "number",
        value: "14",
      },
      {
        id: "ex_pr_3",
        kind: "variable",
        key: "summary",
        valueType: "string",
        value:
          "Updates session cookie parsing across API routes, removes legacy sync helper, and adds integration tests for token refresh.",
      },
    ],
    questions: [
      {
        id: "ex_pr_q1",
        key: "has_breaking_risk",
        type: "noul",
        instructions:
          "Does this pull request carry production breaking-change risk?",
        criteria: {
          true_description:
            "Modifies auth, middleware, or removes legacy helpers used by existing callers.",
          false_description:
            "Purely additive or internal refactor with no runtime impact.",
        },
      },
      {
        id: "ex_pr_q2",
        key: "review_team",
        type: "choice",
        instructions: "Which engineering team should own the primary review?",
        options: [
          {
            id: "ex_pr_o1",
            key: "security",
            description: "Authentication, cookies, sessions, or access control.",
          },
          {
            id: "ex_pr_o2",
            key: "frontend",
            description: "UI components, styling, or client state.",
          },
          {
            id: "ex_pr_o3",
            key: "infra",
            description: "CI/CD, deployment, or cloud infrastructure.",
          },
          {
            id: "ex_pr_o4",
            key: "other",
            description: "Does not fit any listed team.",
          },
        ],
      },
      {
        id: "ex_pr_q3",
        key: "pr_readiness",
        type: "score",
        instructions: "Rate how ready this PR description is for review.",
        levels: [
          "Missing context and testing details",
          "Describes changes but lacks migration notes",
          "Clear scope, rationale, and test coverage",
        ],
      },
    ],
  },
  {
    id: "support-routing",
    title: "Route a support ticket",
    description:
      "Classify urgency, billing vs technical intent, and customer sentiment",
    stateBlocks: [
      {
        id: "ex_sup_1",
        kind: "variable",
        key: "customer_tier",
        valueType: "string",
        value: "enterprise",
      },
      {
        id: "ex_sup_2",
        kind: "variable",
        key: "message",
        valueType: "string",
        value:
          "Our production webhooks stopped firing 20 minutes ago after we rotated our API key. Checkout orders are blocked.",
      },
    ],
    questions: [
      {
        id: "ex_sup_q1",
        key: "requires_escalation",
        type: "noul",
        instructions:
          "Should this ticket immediately page the on-call engineer?",
        criteria: {
          true_description:
            "Production outage or revenue-blocking issue for an active customer.",
          false_description:
            "General question, feature request, or non-blocking bug.",
        },
      },
      {
        id: "ex_sup_q2",
        key: "queue",
        type: "choice",
        instructions: "Select the best support queue for this ticket.",
        options: [
          {
            id: "ex_sup_o1",
            key: "incident",
            description: "Live outage, webhook failure, or checkout blocked.",
          },
          {
            id: "ex_sup_o2",
            key: "billing",
            description: "Invoices, plan upgrades, or payment methods.",
          },
          {
            id: "ex_sup_o3",
            key: "other",
            description: "General inquiries outside listed queues.",
          },
        ],
      },
      {
        id: "ex_sup_q3",
        key: "urgency_level",
        type: "score",
        instructions: "Score the operational urgency of this ticket.",
        levels: [
          "Low — informational or minor inconvenience",
          "Medium — degraded workflow with workaround",
          "High — major feature broken",
          "Critical — production revenue or checkout blocked",
        ],
      },
    ],
  },
  {
    id: "hackathon-pitch",
    title: "Grade a hackathon pitch",
    description:
      "Score technical novelty, track fit, and demo readiness with a rubric",
    stateBlocks: [
      {
        id: "ex_hack_1",
        kind: "variable",
        key: "project_name",
        valueType: "string",
        value: "PulseGuard AI",
      },
      {
        id: "ex_hack_2",
        kind: "variable",
        key: "pitch",
        valueType: "string",
        value:
          "Uses gemini-decision-1 with 0 output tokens to score 50 clinical intake checks in parallel under 500ms, running live with offline fallback.",
      },
    ],
    questions: [
      {
        id: "ex_hack_q1",
        key: "has_live_demo",
        type: "noul",
        instructions:
          "Does the pitch indicate a working live demo rather than slides only?",
        criteria: {
          true_description: "Explicitly mentions running live or working demo.",
          false_description: "Concept or slide deck only.",
        },
      },
      {
        id: "ex_hack_q2",
        key: "track",
        type: "choice",
        instructions: "Which DevFest hackathon track best fits this project?",
        options: [
          {
            id: "ex_hack_o1",
            key: "ai_ml",
            description: "Gemini models, agents, or ML pipelines.",
          },
          {
            id: "ex_hack_o2",
            key: "cloud_web",
            description: "Cloud infrastructure, web apps, or DevOps.",
          },
          {
            id: "ex_hack_o3",
            key: "other",
            description: "Fits another or cross-cutting track.",
          },
        ],
      },
      {
        id: "ex_hack_q3",
        key: "technical_depth",
        type: "score",
        instructions: "Grade the technical depth and architectural clarity.",
        levels: [
          "Vague idea with no concrete stack",
          "Solid prototype using standard APIs",
          "Well-engineered system with clear latency and resilience design",
        ],
      },
    ],
  },
];
