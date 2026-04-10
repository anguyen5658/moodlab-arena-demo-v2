## /compare-versions

Use Playwright MCP and headless Chrome to:

1. Navigate to localhost:8000 (monolith version) and take a full-page screenshot
2. Navigate to localhost:8100 (refactored) and take a full-page screenshot
3. Compare them visually — note any layout, color, or spacing differences
4. Run the following user flows on BOTH and confirm identical behavior:
   - From home screen, click on Arcade link at the middle left position. User should be taken to the Arcade zone landing screen
   - From home screen, click on Wall link next to Arcard. User should be taken to the Wall zone landing screen
   - From home screen, click on Stage link at the middle right position. User should be taken to the Stage zone landing screen
   - From home screen, click on Fortune lon the left of Stage. User should be taken to the Fortune zone landing screen
   - From home screen, click on World Cup link at center. User should be taken to the World Cup zone landing screen
5. Report: PASS if identical, DIFF with details in the report if not.

## Rules:

- Save the screenshots in .playwright-mcp/screenshots. Put them in the folder named $ARGUMENTS (usually the Phase number).
- Put the report of the comparison in the same folder along with the screenshots.
