$ErrorActionPreference = "Stop"

python -m venv .venv
.\.venv\Scripts\python.exe -m pip install --upgrade pip
.\.venv\Scripts\python.exe -m pip install -r services\api\requirements.txt

$env:Path = "C:\Program Files\nodejs;" + $env:Path
npm --prefix apps/web install

.\.venv\Scripts\python.exe -m services.api.app.db.init_db
npm run check

