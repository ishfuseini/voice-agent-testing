# update_readiness_item

Records evidence for a readiness criterion. Updates the assessment state with the provided evidence, recommendation, and status.

**Handler:** `lib/tools.ts` → `update_readiness_item(params)`
**Tool ID:** `tool_3201m0nfe1amen4rx8n3xth4p61g`

## Full tool config

```json
{
  "type": "client",
  "name": "update_readiness_item",
  "description": "Record evidence for a readiness criterion. Updates the assessment state with the provided evidence, recommendation, and status.",
  "response_timeout_secs": 20,
  "disable_interruptions": false,
  "interruption_mode": "allow",
  "force_pre_tool_speech": false,
  "pre_tool_speech": "auto",
  "assignments": [],
  "tool_call_sound": null,
  "tool_call_sound_behavior": "auto",
  "tool_error_handling_mode": "auto",
  "parameters": {
    "description": "",
    "dynamic_variable": "",
    "is_omitted": false,
    "type": "object",
    "required": ["pillar", "criterion", "status", "evidence", "recommendation"],
    "properties": {
      "pillar": {
        "type": "string",
        "description": "The pillar key: latency, tool_calling, or observability",
        "enum": ["latency", "tool_calling", "observability"],
        "is_system_provided": false,
        "dynamic_variable": "",
        "allowed_values_dynamic_variable": "",
        "constant_value": "",
        "is_omitted": false
      },
      "criterion": {
        "type": "string",
        "description": "The criterion key (e.g., end_of_speech_to_first_audio, interruption_handling, failure_handling)",
        "enum": null,
        "is_system_provided": false,
        "dynamic_variable": "",
        "allowed_values_dynamic_variable": "",
        "constant_value": "",
        "is_omitted": false
      },
      "status": {
        "type": "string",
        "description": "The assessment state for this criterion",
        "enum": ["ready", "needs_validation", "needs_attention"],
        "is_system_provided": false,
        "dynamic_variable": "",
        "allowed_values_dynamic_variable": "",
        "constant_value": "",
        "is_omitted": false
      },
      "evidence": {
        "type": "string",
        "description": "The evidence gathered during conversation — what the user actually said. Do not fabricate.",
        "enum": null,
        "is_system_provided": false,
        "dynamic_variable": "",
        "allowed_values_dynamic_variable": "",
        "constant_value": "",
        "is_omitted": false
      },
      "recommendation": {
        "type": "string",
        "description": "A concrete, actionable next step for addressing this criterion",
        "enum": null,
        "is_system_provided": false,
        "dynamic_variable": "",
        "allowed_values_dynamic_variable": "",
        "constant_value": "",
        "is_omitted": false
      }
    }
  },
  "expects_response": false,
  "dynamic_variables": {
    "dynamic_variable_placeholders": {}
  },
  "execution_mode": "immediate"
}
```

## Behavior

- Maps the `status` string to the internal `CriterionState` enum (`ready` → `Ready`, `needs_validation` → `NeedsValidation`, `needs_attention` → `NeedsAttention`).
- Calls `useAssessmentStore.updateReadinessItem()` with `pillarKey`, `criterionKey`, `status`, `evidence`, `recommendation`.
- Rejects unknown criteria (pillar/criterion mismatch) without mutating state — returns an error string.
- Emits an `assessment_change` trace event with the pillar, criterion, status, and evidence.
- Returns a confirmation string: `Updated: <pillar>/<criterion> → <status>`.

## Config notes

- `expects_response: false` — fire-and-forget. The agent doesn't wait for the result. If the update fails (unknown criterion), the agent won't see the error. Acceptable for this use case since the agent shouldn't need to handle recording failures conversationally.
- `execution_mode: "immediate"` — fires as soon as the agent calls it. Correct for a synchronous state mutation.

## Example agent call

```json
{
  "pillar": "latency",
  "criterion": "end_of_speech_to_first_audio",
  "status": "needs_validation",
  "evidence": "The user said they haven't measured end-of-speech to first-audio latency.",
  "recommendation": "Add client-side instrumentation to capture and log first-audio timestamps."
}
```
