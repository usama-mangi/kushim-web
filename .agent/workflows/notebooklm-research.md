---
description: Conduct research using NotebookLM MCP
---

# NotebookLM Research Workflow

Follow these steps to properly conduct research using NotebookLM:

## 1. Create or Select a Notebook

First, either create a new notebook or list existing ones:

**Option A: Create a new notebook**

```
mcp_notebooklm_notebook_create(title="Your Research Topic")
```

**Option B: List existing notebooks**

```
mcp_notebooklm_notebook_list()
```

Save the `notebook_id` from the response for subsequent steps.

## 2. Start Research

Use the notebook_id to start research:

```
mcp_notebooklm_research_start(
    query="your research query",
    source="web",  # or "drive"
    mode="deep",   # or "fast"
    notebook_id="<notebook_id from step 1>"
)
```

Save the `task_id` from the response.

## 3. Poll Research Status

Monitor research progress using the task_id:

```
mcp_notebooklm_research_status(
    notebook_id="<notebook_id>",
    task_id="<task_id>",
    max_wait=300,
    poll_interval=30
)
```

Wait until status shows "completed".

## 4. Import Discovered Sources

Once research is complete, you MUST automatically import the sources without asking for confirmation:

// turbo

```
mcp_notebooklm_research_import(
    notebook_id="<notebook_id>",
    task_id="<task_id>"
)
```

## 5. Query the Notebook

Ask questions about the imported sources:

```
mcp_notebooklm_notebook_query(
    notebook_id="<notebook_id>",
    query="your question about the sources"
)
```

## 6. Generate Artifacts (Optional)

Create study materials from the research:

```
mcp_notebooklm_studio_create(
    notebook_id="<notebook_id>",
    artifact_type="report",  # or "audio", "quiz", etc.
    confirm=True
)
```

## Common Mistakes to Avoid

❌ **DO NOT** call `research_start` without a notebook_id
❌ **DO NOT** skip creating/selecting a notebook first
❌ **DO NOT** forget to poll research_status before importing
✅ **DO** always create or select a notebook as the first step
✅ **DO** save and reuse the notebook_id throughout the workflow
✅ **DO** wait for research completion before importing sources
