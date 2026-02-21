# Gemini Added Memories

- When using shell commands, I must use Windows CMD-appropriate commands instead of Linux commands.
- When the user says "commit now", I need to:
  1. Check staged changes (`git status`).
  2. Draft a sufficiently descriptive commit message to a file (e.g., `commit_message.txt`) based on the file changes.
  3. Write the commit message to the message file.
  4. Perform the commit using `git commit -F commit_message.txt`.
