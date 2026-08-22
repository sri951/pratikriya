<!-- LOVABLE:BEGIN -->

> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

<!-- LOVABLE:END -->

## n8n & n8n-MCP Workflow Guidelines

When designing, building, validating, and managing n8n workflows with `n8n-mcp`:

### 1. Core Principles

- **Silent & Parallel Execution**: Call discovery tools (`search_nodes`, `get_node`, `search_templates`) simultaneously without narrative filler.
- **Templates First**: Search 2,700+ proven n8n workflow templates before building from scratch. Always provide mandatory author attribution when adapting a template.
- **Multi-Level Validation**: Always execute `validate_node(mode='minimal')` → `validate_node(mode='full', profile='runtime')` → `validate_workflow` before activating or deploying.
- **Never Trust Defaults**: Explicitly configure all parameters controlling node behavior. Do not rely on default parameter values.
- **Progressive Skill Activation**: Utilize installed specialist skills (`.agents/skills/`):
  - `n8n-expression-syntax`: Double curly braces `{{}}`, `$json.body` for webhooks, `$node["Node Name"].json`.
  - `n8n-mcp-tools-expert`: Correct tool usage patterns, batch updates with `n8n_update_partial_workflow`.
  - `n8n-workflow-patterns`: Webhook processing, HTTP API integration, database operations, scheduled tasks, AI agents.
  - `n8n-validation-expert`: Interpreting validation diagnostics and autofixing.
  - `n8n-node-configuration`: Explicit required field configurations, operation-specific parameters.
  - `n8n-code-javascript` & `n8n-code-python`: Data access patterns (`$input.all()`, return shape `[{json: {...}}]`).
  - `n8n-code-tool`: AI-agent-callable tool contract (returns a string, `$fromAI` not supported inside Code Tool).
  - `n8n-error-handling`: `onError: continueErrorOutput`, wire `main[1]`, `retryOnFail`.
  - `n8n-binary-and-data`: Handling files and binary buffers with `$binary` and Merge nodes.
  - `n8n-subworkflows`: Typed triggers, sub-workflow execution, `mode: all`/`each`.
  - `n8n-agents`: LangChain nodes (`@n8n/n8n-nodes-langchain.*`), tools, memory, structured parsers.
  - `n8n-multi-instance`: Multiple n8n instance management via `n8n_instances`.
  - `n8n-self-hosting`: Linux VM / Docker Compose / Caddy deployment.

### 2. Critical Connection Syntax

- **`addConnection` Parameter Format**: Use 4 distinct string parameters (`source`, `target`, `sourcePort`, `targetPort`), plus `branch: "true" | "false"` for IF node multi-output routing.
