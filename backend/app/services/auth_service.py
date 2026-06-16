from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.user import User
from app.schemas.s_user import UserCreate, Token
from app.core.security import hash_password, verify_password, create_access_token
from app.utils.roles import ROLE_USER

INACTIVE_ACCOUNT_MESSAGE = "Account is deactivated. Please contact the administrator."


def register_user(db: Session, user_data: UserCreate) -> User:
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    
    if existing_user:
        return None   

    hashed_password = hash_password(user_data.password)

    new_user = User(
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        email=user_data.email,
        hashed_password=hashed_password,
        role=ROLE_USER,
        phone_number=user_data.phone_number,
        occupation_type=user_data.occupation_type,
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user

# User credential authentication and returning user object if valid, otherwise None
def authenticate_user(db: Session, email: str, password: str):
    user = db.query(User).filter(User.email == email).first()
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user

# Generate JWT token for authenticated user used for login
def login_user(db: Session, email: str, password: str):
    user = authenticate_user(db, email, password)
    if not user:
        return None
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=INACTIVE_ACCOUNT_MESSAGE,
        )
    access_token = create_access_token(data={"sub": str(user.user_id)})
    
    return Token(access_token=access_token, token_type="bearer")
