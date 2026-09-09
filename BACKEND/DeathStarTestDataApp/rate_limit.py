from slowapi import Limiter
from slowapi.util import get_remote_address

# Defined in its own module (rather than main.py) so routers can import it
# without a circular import back to main. In-memory storage - correct for
# the single-process dev server this app runs as; a multi-process/instance
# deployment would need a shared backend (e.g. Redis) instead.
limiter = Limiter(key_func=get_remote_address)
