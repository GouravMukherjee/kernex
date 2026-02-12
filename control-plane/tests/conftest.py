import inspect
import sys
from pathlib import Path

import httpx

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))


def _patch_httpx_client_for_starlette_testclient() -> None:
    """
    Compatibility shim:
    Starlette TestClient in this repo passes `app=` to httpx.Client.
    httpx>=0.28 removed that kwarg. Patch it for test runtime only.
    """
    signature = inspect.signature(httpx.Client.__init__)
    if "app" in signature.parameters:
        return

    original_init = httpx.Client.__init__

    def patched_init(self, *args, app=None, **kwargs):
        return original_init(self, *args, **kwargs)

    httpx.Client.__init__ = patched_init


_patch_httpx_client_for_starlette_testclient()
