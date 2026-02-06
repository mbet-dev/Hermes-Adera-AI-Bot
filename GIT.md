# Version control (Git)

This project uses Git with two branches:

- **main** – production-ready code
- **dev** – staging branch for enhancements and experiments

## Push to a remote repository

1. Create a new empty repository on GitHub/GitLab/Bitbucket (do not initialize with README).

2. Add the remote and push both branches:

   ```bash
   git remote add origin <YOUR_REPO_URL>
   git push -u origin main
   git push origin dev
   ```

3. For future work, use `dev` for new features, then merge to `main` when ready:

   ```bash
   git checkout dev
   # make changes, commit
   git checkout main
   git merge dev
   git push origin main
   ```

**This project's remote:** `https://github.com/mbet-dev/AderaAIBot-Hermes.git`

To set or update the remote:
```bash
git remote add origin https://github.com/mbet-dev/AderaAIBot-Hermes.git
# or, if origin already exists:
git remote set-url origin https://github.com/mbet-dev/AderaAIBot-Hermes.git
```

Replace with your own URL if using a different repository.
