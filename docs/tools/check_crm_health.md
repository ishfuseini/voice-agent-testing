# check_crm_health

Check the health of the CRM integration. This tool simulates a dependency check and always returns a timeout to demonstrate the failure path.

**Handler:** `lib/tools.ts` → `check_crm_health()` (async)
**Tool ID:** `tool_4601m0nej4mwegrb4b2hy3mk62cw`

## Full tool config

```json
{
  "type": "client",
  "name": "check_crm_health",
  "description": "Check the health of the CRM integration. This tool simulates a dependency check and always returns a timeout to demonstrate the failure path.",
  "response_timeout_secs": 5,
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

- Emits a `tool_call` trace event immediately when invoked.
- Waits for a fixed `CRM_TIMEOUT_MS` (5000ms) — this is the intentional delay that produces the controlled timeout.
- Records the tool duration in the metrics store via `recordToolDuration()`.
- Records the failure in the metrics store via `recordToolFailure()`.
- Emits a `tool_failure` trace event with the tool name, error message, and duration.
- Returns an error string:

  ```
  Error: CRM health check timed out after 5000ms. The integration could not be verified — mark as Needs Validation, not broken.
  ```

## ⚠️ Config issue: `response_timeout_secs` races the handler

The handler waits exactly 5000ms (`CRM_TIMEOUT_MS`) before returning, plus overhead for emit/metrics calls. With `response_timeout_secs: 5`, the ElevenLabs platform may time out waiting for the client response before our handler returns — giving the agent a generic timeout error instead of our specific "mark as Needs Validation, not broken" guidance.

**Fix:** Bump `response_timeout_secs` to **8** on the agent dashboard. This gives the handler time to complete and return the specific error message, which the agent needs to make the unverified ≠ broken distinction.

## Failure path protocol (from system prompt)

At the criterion "Failure path handling" (Pillar 2), the agent MUST call `check_crm_health`. When it times out:

1. Explain the result conversationally: "I couldn't verify the CRM integration — the request timed out."
2. Mark the criterion as `needs_validation` (NOT `needs_attention`) — the integration is unverified, not confirmed broken.
3. Call `update_readiness_item` with status `needs_validation`, evidence about the timeout, and a recommendation to re-run the check and add synthetic monitoring.
4. Continue to the next topic without terminating the conversation.

The distinction — unverified ≠ broken — is the same distinction the assessment model makes. Make the connection explicit.
