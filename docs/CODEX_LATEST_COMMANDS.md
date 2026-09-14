# Latest Codex Commands

Session date: 2026-09-14  
Repository: `OR-CUSTOMER-CONNECT-main`  
Branch: `main`

These are the latest user-requested startup and Git operations. Secrets, tokens, and ignored runtime commands are not recorded.

## Start and verify app

```powershell
npm.cmd run web:dev
Invoke-WebRequest -UseBasicParsing http://127.0.0.1:3011/erp | Select-Object StatusCode,StatusDescription
Invoke-WebRequest -UseBasicParsing http://127.0.0.1:3011/admin/messages | Select-Object StatusCode,StatusDescription
Invoke-WebRequest -UseBasicParsing http://127.0.0.1:3011/messages | Select-Object StatusCode,StatusDescription
Invoke-RestMethod http://127.0.0.1:8000/health
Invoke-RestMethod http://127.0.0.1:8002/api/v1/health
```

Result: the unified frontend runs on `http://127.0.0.1:3011`, ODD RAVEN API runs on `http://127.0.0.1:8000`, and the ERP backend runs internally on `http://127.0.0.1:8002`. Open ERP at `http://127.0.0.1:3011/erp`.

Customer account workflow: staff opens `/admin/customers/new`, creates a username and password (password minimum six characters), then the customer logs in at `/login`. The staff message composer has a fixed `+` button in the bottom-right of the message panel.

## Commit and push

```powershell
git status --short --branch
git remote -v
git diff --stat
git ls-files --others --exclude-standard
git add -A
git commit -m "Update local app startup and image processing readiness"
git push origin main
git status --short --branch
git log --oneline --decorate -3
```

The startup changes were committed as `cb4357a` and pushed to `origin/main`.

## Archive this session

```powershell
node scripts/export-project-chat.mjs <session.jsonl> docs/chat/2026-09-10.md
```
