# ODD RAVEN Customer Connect + KMS DTF ERP

## New-system installation, startup, connections, and feature guide

This guide is for installing and operating the application on a new Windows
computer. Run all commands from the repository root: the folder
containing `package.json`, `apps`, `services`, and `.erp-inspect`.

## 1. System architecture

The application has one user-facing browser origin and two internal backends:

| Component | Purpose | Address |
|---|---|---|
| ODD RAVEN API | Customer, staff, orders, messages, uploads, profiles, and image jobs | `http://127.0.0.1:8000` |
| KMS DTF ERP backend | ERP authentication, dashboard, commercial and production APIs | `http://127.0.0.1:8002` |
| Unified frontend | Customer, staff, and ERP browser interface | `http://127.0.0.1:3011` |

The ERP frontend is available through the unified origin at:

```text
http://127.0.0.1:3011/erp
```

Users normally open only port `3011`. Next.js proxies ERP pages, assets, brand
files, and `/api/v1` requests to the internal ERP backend on port `8002`.

## 2. Install prerequisites

Supported platform: Windows 10 or Windows 11.

Install:

- Python 3.12.x: <https://www.python.org/downloads/windows/>
- Node.js LTS: <https://nodejs.org/en/download>
- Git for Windows (recommended): <https://git-scm.com/download/win>
- Chrome, Edge, or another modern browser

When installing Python, enable **Add Python to PATH**. Verify installation:

```powershell
py --version
node --version
npm.cmd --version
git --version
```

Redis is optional for the default local browser workflow. Chromium for
Playwright is required only when Pixelcut image processing is enabled.

## 3. Obtain the project

Clone the repository:

```powershell
git clone <REPOSITORY_URL> OR-CUSTOMER-CONNECT-main
cd OR-CUSTOMER-CONNECT-main
```

Replace `<REPOSITORY_URL>` with the actual repository URL.

Alternatively, extract the supplied project ZIP into a writable folder such as
`C:\Projects\OR-CUSTOMER-CONNECT-main`, then open PowerShell in that folder.

## 4. Install Python dependencies

Create the shared virtual environment:

```powershell
py -3.12 -m venv .venv
.\.venv\Scripts\python.exe -m pip install --upgrade pip
```

Install the ODD RAVEN API dependencies:

```powershell
.\.venv\Scripts\python.exe -m pip install -r services\api\requirements.txt
```

Install the complete ERP dependencies. This supports both the ERP web API and
the broader ERP image, cloud, credential, Google, and desktop feature set:

```powershell
.\.venv\Scripts\python.exe -m pip install -r .erp-inspect\kms-dtf-erp-starter-main\requirements.txt
```

For a browser-only ERP installation, the smaller alternative is:

```powershell
.\.venv\Scripts\python.exe -m pip install -r .erp-inspect\kms-dtf-erp-starter-main\requirements-web.txt
.\.venv\Scripts\python.exe -m pip install keyring
```

## 5. Install frontend dependencies

Install the locked JavaScript dependency tree:

```powershell
npm.cmd --prefix apps\web ci
```

Use `npm.cmd` in PowerShell if execution-policy settings prevent `npm.ps1`
from running.

## 6. Configure `.env`

Create the local configuration file:

```powershell
if (!(Test-Path .env)) { Copy-Item .env.example .env }
```

At minimum, review these values:

```env
APP_NAME=ODD RAVEN
ENVIRONMENT=local
DATABASE_URL=sqlite:///./oddraven-local.db
REDIS_URL=redis://localhost:6379/0
OBJECT_STORAGE_BUCKET=oddraven-local
JWT_SECRET=change-me
CORS_ORIGINS=http://127.0.0.1:3011,http://localhost:3011
KMS_ERP_BASE_URL=http://127.0.0.1:8002/api/v1
PIXELCUT_ENABLED=false
```

Configuration rules:

- Replace `JWT_SECRET` with a long random secret before using real data.
- Keep `KMS_ERP_BASE_URL` at the port-8002 value for this unified setup.
- Keep `CORS_ORIGINS` synchronized with the frontend address.
- Keep `PIXELCUT_ENABLED=false` unless Pixelcut is authorized and reachable.
- Do not add `NEXT_PUBLIC_API_URL` to `.env`. The launcher supplies this
  frontend-only value to Next.js; the Python API rejects it as an unknown
  setting.
- Never commit `.env`, passwords, API keys, or cloud credentials.

Optional Backblaze and Google settings should be configured only when those
integrations are being used. Backblaze requires a complete endpoint, key ID,
application key, and bucket configuration.

## 7. Preserve existing data

The supplied project may contain customer records, messages, attachments,
profile media, and ERP records. Preserve these paths when copying the project:

- `oddraven-local.db`
- `local_uploads\`
- `.erp-inspect\kms-dtf-erp-starter-main\local_data\`
- `.env` and any separately stored cloud credentials

Do not replace the databases with empty databases during setup. Do not run a
database reset as a way to solve a startup problem.

## 8. Start the unified application

### Recommended: one-click startup

Double-click `Start App.cmd` in the repository root. It starts or reuses:

- ODD RAVEN API on `8000`
- ERP backend on `8002`
- Unified frontend on `3011`

It checks readiness and opens the ERP page in the browser.

### PowerShell startup

```powershell
npm.cmd run web:dev
```

Keep the terminal open while using the app. Successful startup reports API,
ERP, and frontend readiness.

### Manual startup for troubleshooting

Window 1 — ODD RAVEN API:

```powershell
.\.venv\Scripts\python.exe -m uvicorn services.api.app.main:app --host 127.0.0.1 --port 8000
```

Window 2 — ERP backend:

```powershell
cd .erp-inspect\kms-dtf-erp-starter-main
$env:DEVELOPER_MODE="true"
$env:ALLOWED_ORIGINS="http://127.0.0.1:3011,http://localhost:3011"
..\..\.venv\Scripts\python.exe -m uvicorn api.main:app --host 127.0.0.1 --port 8002
```

Window 3 — unified frontend:

```powershell
cd apps\web
npm.cmd run dev -- --hostname 127.0.0.1 --port 3011
```

## 9. URLs

### Main user-facing pages

| Page | URL |
|---|---|
| Unified ERP | `http://127.0.0.1:3011/erp` |
| Customer home | `http://127.0.0.1:3011/` |
| New order and gangsheet builder | `http://127.0.0.1:3011/new-order` |
| Customer messages | `http://127.0.0.1:3011/messages` |
| Staff messages | `http://127.0.0.1:3011/admin/messages` |
| Orders | `http://127.0.0.1:3011/orders` |
| Designs | `http://127.0.0.1:3011/designs` |
| Payments | `http://127.0.0.1:3011/payments` |
| Profile | `http://127.0.0.1:3011/profile` |
| Customer login | `http://127.0.0.1:3011/login` |
| Staff customer management | `http://127.0.0.1:3011/admin/customers` |
| Add customer and credentials | `http://127.0.0.1:3011/admin/customers/new` |

### Customer credentials and login

Staff creates the customer account from **Staff customer management → Add customer**.
The staff form requires a unique username and a password of at least six
characters. Staff can also change the username or replace the password while
editing a customer profile. The API stores only a bcrypt password hash.

The customer uses the created username and password at `/login`. Login creates
an HTTP-only customer session cookie, then the customer profile, orders, and
messages load for that authenticated customer. Use the same browser host for
login and subsequent pages: do not switch between `127.0.0.1` and `localhost`
mid-session.

The staff message page includes a fixed `+` button at the bottom-right of the
message panel for starting a new customer message. If it is not visible after
an update, stop the dev server, restart `npm.cmd run web:dev`, and hard-refresh
the page.

### Health and diagnostics

| Check | URL |
|---|---|
| ODD RAVEN API health | `http://127.0.0.1:8000/health` |
| Image-processing health | `http://127.0.0.1:8000/api/image-processing/health` |
| ERP backend health | `http://127.0.0.1:8002/api/v1/health` |
| ERP through unified origin | `http://127.0.0.1:3011/api/v1/health` |
| ERP API docs in development | `http://127.0.0.1:8002/docs` |

## 10. Verify installation

```powershell
Invoke-RestMethod http://127.0.0.1:8000/health
Invoke-RestMethod http://127.0.0.1:8000/api/image-processing/health
Invoke-RestMethod http://127.0.0.1:8002/api/v1/health
Invoke-WebRequest http://127.0.0.1:3011/erp -UseBasicParsing
Invoke-WebRequest http://127.0.0.1:3011/new-order -UseBasicParsing
```

Expected results are HTTP 200 for all checks. ODD RAVEN health reports
`status: ok`; ERP health identifies `KMS DTF ERP API`; both frontend pages
return HTML.

## 11. Detailed feature inventory

### Customer features

- Customer account and profile area.
- Name, business name, phone, email, WhatsApp, GST, and delivery details.
- Billing and shipping addresses.
- Profile photo and media support.
- Order history and order-status visibility.
- Artwork/design uploads.
- Customer-facing messaging.
- Message read state, attachments, and media.
- Support/contact area.
- Order tracking and payment views.
- Responsive browser layouts.

### Staff and operations features

- Staff dashboard and operational overview.
- Customer search and customer master list.
- Create, edit, view, activate, deactivate, and manage customers.
- Customer detail pages synchronized through the API.
- Customer folders and file workspaces.
- Design, gangsheet, invoice-copy, and payment-receipt folders.
- File upload, preview, download, copy, and delete workflows.
- Image and PDF previews.
- Staff message inbox, search, history, media, and composer.
- ERP connection/status page.

### Orders and artwork features

- New-order workflow with customer and product selection.
- Multiple design uploads per order.
- Preview tiles before saving designs.
- Artwork-to-customer and artwork-to-order assignment.
- Artwork version tracking and approval status.
- Original artwork open/download support.
- Subtotal, discount, tax, advance, total, and balance values.
- Order status timeline and production transitions.
- Gangsheet builder and preview workflow.

### ERP features

- ERP login and local developer-mode session.
- Dashboard metrics, pipeline, and recent activity.
- Customers, orders, artwork studio, and image editor entry points.
- Inventory, purchase, sales, payments, and reports.
- Product, category, commercial, and rate-related data.
- Estimates and ERP rate-calculation integration points.
- ERP/customer synchronization through the adapter.
- Embedded staff Messages page inside the ERP.
- Local-first customer and folder navigation.

### Image, storage, and integrations

- Image-processing job upload and status endpoints.
- Optional background removal and upscaling through Pixelcut.
- Worker readiness and error reporting.
- Local SQLite databases and local upload storage.
- Backblaze B2-compatible object storage support.
- Optional Google Drive and Google Sheets/customer-master integration.
- Background transfer hooks for cloud operations.

To enable Pixelcut, install Chromium and set the flag before restarting:

```powershell
.\.venv\Scripts\python.exe -m playwright install chromium
```

Then set `PIXELCUT_ENABLED=true` in `.env`. This requires authorized external
access to Pixelcut.

## 12. Troubleshooting

### Python environment missing

Run the venv creation and pip commands in section 4 from the repository root.

### PowerShell says scripts are disabled

Use `npm.cmd`, not `npm`, for example `npm.cmd run web:dev`.

### Check ports

```powershell
Get-NetTCPConnection -LocalPort 8000,8002,3011 -ErrorAction SilentlyContinue
```

Stop only the unrelated process occupying a required port. Do not delete data.

### ERP fails through port 3011

Test the internal ERP directly:

```powershell
Invoke-WebRequest http://127.0.0.1:8002/api/v1/health -UseBasicParsing
```

If it fails, reinstall the ERP requirements and start the ERP backend using
the manual command.

### Image processing is not ready

```powershell
Invoke-RestMethod http://127.0.0.1:8000/api/image-processing/health
```

When `PIXELCUT_ENABLED=false`, processing is intentionally disabled and the
main app can run. When enabled, install Chromium, check network access, and
restart the API.

### Data is empty

Confirm that `oddraven-local.db`, the ERP `local_data` directory, and
`local_uploads` were copied. Check that the current working directory is the
repository root.

## 13. Updating and backups

Before updating, back up:

- `oddraven-local.db`
- `.erp-inspect\kms-dtf-erp-starter-main\local_data\`
- `local_uploads\`
- `.env`

After an update, reinstall dependencies if lockfiles or requirements changed:

```powershell
npm.cmd --prefix apps\web ci
.\.venv\Scripts\python.exe -m pip install -r services\api\requirements.txt
.\.venv\Scripts\python.exe -m pip install -r .erp-inspect\kms-dtf-erp-starter-main\requirements.txt
```

Review migration notes before running database migrations. Keep backups until
the updated application and restored data have been verified.

## 14. Production notes

This guide describes a local application bound to `127.0.0.1`; it is not a
complete internet-facing deployment. For production use, add HTTPS, a reverse
proxy, strong secrets, restricted CORS, secure secret storage, regular backups,
dedicated service accounts, controlled uploads, and tested restore procedures.
Disable developer mode and review authentication/session settings before
exposing the application outside the local machine.

## 15. Quick start

```powershell
cd C:\Projects\OR-CUSTOMER-CONNECT-main
py -3.12 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r services\api\requirements.txt
.\.venv\Scripts\python.exe -m pip install -r .erp-inspect\kms-dtf-erp-starter-main\requirements.txt
npm.cmd --prefix apps\web ci
if (!(Test-Path .env)) { Copy-Item .env.example .env }
npm.cmd run web:dev
```

Open `http://127.0.0.1:3011/erp`.
