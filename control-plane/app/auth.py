"""Authentication and authorization utilities"""
from datetime import datetime, timedelta
from typing import Optional

from passlib.context import CryptContext
from pydantic import BaseModel, ConfigDict
from app.config import get_settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
settings = get_settings()

# JWT configuration
SECRET_KEY = settings.jwt_secret_key
ALGORITHM = settings.jwt_algorithm
ACCESS_TOKEN_EXPIRE_MINUTES = settings.access_token_expire_minutes


class User(BaseModel):
    """User authentication model"""
    model_config = ConfigDict(from_attributes=True)
    id: int
    username: str
    email: str
    is_active: bool


class UserCreate(BaseModel):
    """User creation request"""
    username: str
    email: str
    password: str


class UserResponse(BaseModel):
    """User response model"""
    model_config = ConfigDict(from_attributes=True)
    id: int
    username: str
    email: str
    is_active: bool
    created_at: datetime


class TokenResponse(BaseModel):
    """Token response model"""
    access_token: str
    token_type: str = "bearer"
    expires_in: int


class LoginRequest(BaseModel):
    """Login request model"""
    username: str
    password: str


def hash_password(password: str) -> str:
    """Hash password using bcrypt"""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against hash"""
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create JWT access token"""
    from jose import jwt
    
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def decode_token(token: str) -> Optional[dict]:
    """Decode JWT token"""
    from jose import jwt, JWTError
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            return None
        return {"username": username, "sub": username}
    except JWTError:
        return None
