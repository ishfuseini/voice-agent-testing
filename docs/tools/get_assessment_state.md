# get_assessment_state

Returns the current assessment state so the agent knows what has been covered.

**Handler:** `lib/tools.ts` → `get_assessment_state()`
**Tool ID:** `tool_2401m0nfg1mee5596bwze1hp1vyd`

## Full tool config

```json
{
  "type": "client",
  "name": "get_assessment_state",
  "description": "Returns the current assessment state — counts of evaluated, remaining, ready, needs_validation, and needs_attention criteria.",
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
  "expects_response": true,
  "dynamic_variables": {
    "dynamic_variable_placeholders": {}
  },
  "execution_mode": "immediate"
}
```

## Behavior

- Calls `useAssessmentStore.getAssessmentState()` which computes counts from the `criteria` record.
- Returns a single-line summary string:

  ```
  <ready> Ready · <needsValidation> Needs Validation · <needsAttention> Needs Attention · <remaining> Pending
  ```

- The agent uses this to decide whether to continue asking questions, give a periodic summary, or call `complete_assessment`.

## Example return value

```
3 Ready · 2 Needs Validation · 1 Needs Attention · 3 Pending
```

## ⚠️ Config issue: `expects_response` should be `true`

The agent calls this tool specifically to get the state counts and use them in its next response. With `expects_response: false`, the agent fires the tool and continues speaking without waiting for the result — it will never see the counts.

**Fix:** Change `expects_response` to `true` on the agent dashboard. This makes the agent wait for the return value before generating its next response.
