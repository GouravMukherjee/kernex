from kernex.polling.heartbeat import build_heartbeat_payload


def test_build_heartbeat_payload_shape():
    payload = build_heartbeat_payload("0.1.0")
    assert payload["agent_version"] == "0.1.0"
    assert isinstance(payload["memory_mb"], float)
    assert isinstance(payload["cpu_pct"], float)
    assert payload["status"] in {"healthy", "degraded", "error"}
