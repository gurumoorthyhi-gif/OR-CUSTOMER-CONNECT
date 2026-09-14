ERROR_MESSAGES = {
    "NETWORK_ACCESS_DENIED": "Pixelcut connection is blocked by network permissions. Image processing is unavailable until access is allowed.",
    "PROVIDER_UNREACHABLE": "Pixelcut could not be reached. Check the internet connection; the service will reconnect automatically.",
    "ACCESS_RESTRICTED": "Pixelcut requires staff verification. Image processing is paused.",
    "CAPTCHA_DETECTED": "Pixelcut requires staff verification. Image processing is paused.",
    "PIXELCUT_DISABLED": "Image processing is disabled on the backend.",
    "NOTIMPLEMENTEDERROR": "The image worker could not start its browser. Restart the local app without API reload mode.",
    "PLAYWRIGHT_NOT_INSTALLED": "The image worker browser software is not installed.",
    "PIXELCUT_SELECTOR_NOT_FOUND": "Pixelcut's processing controls could not be found. Staff must check the integration.",
    "PIXELCUT_UPLOAD_FAILED": "Pixelcut did not accept the image. Staff must check the processing service.",
    "TIMEOUTERROR": "Pixelcut did not respond in time. Please try again later.",
}


def error_code(exc: Exception) -> str:
    message = str(exc)
    if "ERR_NETWORK_ACCESS_DENIED" in message:
        return "NETWORK_ACCESS_DENIED"
    if any(marker in message for marker in ("ERR_NAME_NOT_RESOLVED", "ERR_INTERNET_DISCONNECTED", "ERR_CONNECTION", "ERR_TIMED_OUT")):
        return "PROVIDER_UNREACHABLE"
    return message if message in ERROR_MESSAGES else type(exc).__name__.upper()


def error_message(code: str | None) -> str:
    return ERROR_MESSAGES.get(code or "", "The image worker failed to complete this request. Staff must check the processing service.")


def service_readiness(registry: dict, worker_type: str, enabled: bool) -> dict:
    workers = [worker for worker in registry.values() if worker["type"] == worker_type]
    ready = enabled and any(worker["state"] in {"AVAILABLE", "BUSY"} for worker in workers)
    code = next((worker.get("lastError") for worker in workers if worker.get("lastError")), None)
    if not enabled:
        code = "PIXELCUT_DISABLED"
    return {
        "ready": ready,
        "state": "ready" if ready else "unavailable" if code else "connecting",
        "message": "Connected" if ready else error_message(code) if code else "Connecting image workers...",
    }
