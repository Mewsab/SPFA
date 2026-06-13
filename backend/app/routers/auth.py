from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.services.auth_service import register_user, login_user
from app.schemas.s_user import UserCreate, UserLogin, UserResponse, Token

router = APIRouter(prefix="/auth", tags=["Authentication"])

# For user registration
@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)

def register(user_data: UserCreate, db: Session = Depends(get_db)):

    user = register_user(db, user_data)
    if not user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email has been registered already")
    
    return user

# For user login 
@router.post("/login", response_model=Token)

def login(user_data: UserLogin, db: Session = Depends(get_db)):
   
    token = login_user(db, user_data.email, user_data.password)

    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password entered")
    return token


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user
