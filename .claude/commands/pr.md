Push the current branch and create a GitHub PR with an auto-generated title and body.

1. Get the current branch name: `git branch --show-current`
2. Collect commits since master: `git log master...HEAD --oneline`
3. Collect the full diff summary: `git diff master...HEAD --stat`
4. Push the branch: `git push -u origin <branch>`
5. Generate a concise PR title (under 70 chars) and body from the commits:
   - Title: summarize the change in imperative mood
   - Body: include a ## Summary section (bullet points of what changed and why) and a ## Test plan section
6. Create the PR:
   ```
   gh pr create --title "<title>" --body "<body>"
   ```
7. Return the PR URL.
