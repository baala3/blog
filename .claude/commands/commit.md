Stage and commit local changes with a meaningful, concise commit message.

1. Check what's changed: `git status` and `git diff --stat`
2. Review the actual diff: `git diff` (and `git diff --cached` for already-staged files)
3. Generate a commit message:
   - Use imperative mood, and understand the motivation behind the changes.
   - write commit message like you are 10yrs+ experienced SDE.
   - Be specific, mention the content or feature, consice.
   - max 200 chars and no period at the end and track untracked file too if any.
   - Don't add any "Co-Authored-By:" or anything that is unneccesary.
4. Stage all relevant changes: `git add <files>` (prefer specific files over `git add -A`)
5. Commit: `git commit -m "<message>"`
6. Confirm success by showing the commit: `git log -1 --oneline`
