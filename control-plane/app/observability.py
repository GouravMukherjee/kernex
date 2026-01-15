"""Observability utilities: metrics, logging, tracing"""
import logging
import json
from datetime import datetime
from typing import Any, Dict

from pythonjsonlogger import jsonlogger
from prometheus_client import Counter, Histogram, Gauge


# Configure JSON logging
def setup_json_logging():
    """Setup structured JSON logging"""
    logger = logging.getLogger()
    logHandler = logging.StreamHandler()
    formatter = jsonlogger.JsonFormatter(
        '%(timestamp)s %(level)s %(name)s %(message)s'
    )
    logHandler.setFormatter(formatter)
    logger.addHandler(logHandler)
    logger.setLevel(logging.INFO)
    return logger


# Prometheus metrics
http_requests_total = Counter(
    'http_requests_total',
    'Total HTTP requests',
    ['method', 'endpoint', 'status_code']
)

http_request_duration_seconds = Histogram(
    'http_request_duration_seconds',
    'HTTP request duration in seconds',
    ['method', 'endpoint']
)

http_requests_in_progress = Gauge(
    'http_requests_in_progress',
    'HTTP requests currently in progress',
    ['method', 'endpoint']
)

errors_total = Counter(
    'errors_total',
    'Total errors',
    ['error_type', 'endpoint']
)

database_operations_total = Counter(
    'database_operations_total',
    'Total database operations',
    ['operation', 'table']
)

database_operation_duration_seconds = Histogram(
    'database_operation_duration_seconds',
    'Database operation duration in seconds',
    ['operation', 'table']
)


class StructuredLogger:
    """Structured logging with context"""

    def __init__(self, name: str):
        self.logger = logging.getLogger(name)
        self.context: Dict[str, Any] = {}

    def set_context(self, **kwargs):
        """Set logging context"""
        self.context.update(kwargs)

    def clear_context(self):
        """Clear logging context"""
        self.context.clear()

    def _log(self, level: str, message: str, **kwargs):
        """Log with context"""
        data = {
            'timestamp': datetime.utcnow().isoformat(),
            'level': level,
            'message': message,
            **self.context,
            **kwargs
        }
        log_func = getattr(self.logger, level.lower())
        log_func(json.dumps(data))

    def debug(self, message: str, **kwargs):
        """Debug log"""
        self._log('DEBUG', message, **kwargs)

    def info(self, message: str, **kwargs):
        """Info log"""
        self._log('INFO', message, **kwargs)

    def warning(self, message: str, **kwargs):
        """Warning log"""
        self._log('WARNING', message, **kwargs)

    def error(self, message: str, **kwargs):
        """Error log"""
        self._log('ERROR', message, **kwargs)

    def critical(self, message: str, **kwargs):
        """Critical log"""
        self._log('CRITICAL', message, **kwargs)


class ErrorTracker:
    """Track errors for observability"""

    def __init__(self):
        self.errors = []

    def record_error(
        self,
        error_type: str,
        endpoint: str,
        message: str,
        details: Dict[str, Any] = None,
    ):
        """Record an error"""
        errors_total.labels(error_type=error_type, endpoint=endpoint).inc()
        
        error_entry = {
            'timestamp': datetime.utcnow().isoformat(),
            'error_type': error_type,
            'endpoint': endpoint,
            'message': message,
            'details': details or {},
        }
        self.errors.append(error_entry)
        
        # Keep only recent errors (last 1000)
        if len(self.errors) > 1000:
            self.errors = self.errors[-1000:]

    def get_recent_errors(self, limit: int = 100) -> list:
        """Get recent errors"""
        return self.errors[-limit:]


# Global instances
structured_logger = StructuredLogger(__name__)
error_tracker = ErrorTracker()
