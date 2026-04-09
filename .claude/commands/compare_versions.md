## /compare-versions

Write comprehensive tests for: $ARGUMENTS

Use Playwright to:

1. Navigate to localhost:8000 (monolith version) and take a full-page screenshot
2. Navigate to localhost:8100 (refactored) and take a full-page screenshot
3. Compare them visually — note any layout, color, or spacing differences
4. Run the following user flows on BOTH and confirm identical behavior:
   - click on Arcade link at the middle left position
   - user should be taken to the Arcade landing screen
5. Report: PASS if identical, DIFF with details if not
