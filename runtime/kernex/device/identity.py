from pathlib import Path
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa


def ensure_keypair(path: Path) -> tuple[str, str]:
    """Generate or load RSA keypair; returns (private_pem, public_pem)."""
    if path.exists():
        private_pem = path.read_bytes()
    else:
        key = rsa.generate_private_key(public_exponent=65537, key_size=4096)
        private_pem = key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption(),
        )
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(private_pem)
    private_key = serialization.load_pem_private_key(private_pem, password=None)
    public_pem = private_key.public_key().public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo,
    )
    return private_pem.decode(), public_pem.decode()
