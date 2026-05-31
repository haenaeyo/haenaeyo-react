---
name: haenaeyo-agents
description: Use the Haenaeyo repository agent workflow, role prompts, quality gates, and Korean handoff format when the user asks for Haenaeyo workflow, planner, architect, TDD guide, reviewer, security reviewer, E2E test, build fixer, verify agent, refactor cleaner, or doc updater help.
---

# Haenaeyo Agents

Use this skill when the user asks to run a Haenaeyo agent, follow the Haenaeyo workflow, or apply the repository agent rules.

## Source Of Truth

Read these files before acting:

- `AGENTS.md`
- `docs/agents/README.md`
- The requested role prompt in `docs/agents/roles/`
- Relevant architecture, product, ADR, and work-plan docs for the task

## Role Mapping

- `workflow`: follow `docs/agents/README.md`
- `planner`: read `docs/agents/roles/planner.md`
- `architect`: read `docs/agents/roles/architect.md`
- `tdd-guide`: read `docs/agents/roles/tdd-guide.md`
- `code-reviewer`: read `docs/agents/roles/code-reviewer.md`
- `e2e-test`: read `docs/agents/roles/e2e-test.md`
- `build-fixer`: read `docs/agents/roles/build-fixer.md`
- `security-reviewer`: read `docs/agents/roles/security-reviewer.md`
- `verify-agent`: read `docs/agents/roles/verify-agent.md`
- `refactor-cleaner`: read `docs/agents/roles/refactor-cleaner.md`
- `doc-updater`: read `docs/agents/roles/doc-updater.md`

## Rules

- Write documents and handoff packets in Korean.
- Preserve command names, code identifiers, file paths, and library names in their original form.
- Continue through the automatic agent flow unless the user explicitly limits the scope.
- Stop before destructive commands, external permission needs, or product decisions that require the user.
- End with the handoff shape defined in `AGENTS.md` or the role prompt.
