# Gemini Added Memories

- When using shell commands, I must use Windows CMD-appropriate commands instead of Linux commands.

- When the user says "commit now", I need to:
  1. **Review staged changes:** Use `git diff --staged` to review the staged file changes and formulate a commit message based on this review. (Do not `add` unstaged files; assume the user has already staged the files to be committed.)
  2. **Create commit message:** Write an appropriate commit message summarizing and explaining the reviewed changes to a file named `commit_message.txt`.
  3. **Execute commit:** Run the command `git commit -F commit_message.txt` to commit the staged changes.
  4. **Delete commit message file:** After the commit is complete, delete the `commit_message.txt` file.
