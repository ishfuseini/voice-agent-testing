# complete_assessment

Mark the review as complete and trigger report generation. Call this only when all criteria have been evaluated.

**Handler:** `lib/tools.ts` → `complete_assessment()`
**Tool ID:** `tool_1301m0nepheeehybca32pxr39akj`

## Full tool config

```json
{
  "type": "client",
  "name": "complete_assessment",
  "description": "Mark the review as complete and trigger report generation. Call this only when all criteria have been evaluated.",
  "response_timeout_secs": 20,
  "disable_interruptions": false,
  "interruption_mode": "allow",
  "force_pre_tool_speech": false,
  "pre_tool_speech": "auto",
  "assignments": [],
  "tool_call_sound": null,
  "tool_call_sound_behavior": "auto",
  "tool_error_handling_mode": "auto",
  "parameters": null,
  "expects_response": false,
  "dynamic_variables": {
    "dynamic_variable_placeholders": {}
  },
  "execution_mode": "post_tool_speech"
}
```

## Behavior

- Calls `useAssessmentStore.completeAssessment()` which sets the `completed` flag to `true`.
- Emits an `assessment_change` trace event with `{ completed: true }`.
- The UI watches the `completed` flag to render the readiness report panel.
- Returns a confirmation string: `Assessment complete. Generating report…`

## Config notes

- `expects_response: false` — fire-and-forget. The agent doesn't need the return value; it just needs the tool to fire.
- `execution_mode: "post_tool_speech"` — the agent speaks its closing summary first, then fires the tool. Correct ordering: the agent gives its closing remarks, then the report generates.

## When to call

The agent should call this only after `get_assessment_state` reports 0 remaining criteria. Per the system prompt, the agent should then give a brief closing summary (under 20 seconds) referencing the generated report.
