from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, field_validator

# Frontend dropdowns should submit these lowercase values; display labels belong in React.
OccupationType = Literal[
    "student",
    "graduate",
    "employed_adult",
    "senior_citizen",
    "other",
]

class UserBase(BaseModel):
    email: EmailStr
    first_name: str
    last_name: str
    phone_number: str | None = None
    occupation_type: OccupationType = "other"

    @field_validator("first_name", "last_name")
    @classmethod
    def normalize_name(cls, value: str) -> str:
        stripped_value = value.strip()
        if not stripped_value:
            raise ValueError("Name fields cannot be empty.")
        return stripped_value.lower().capitalize()

    @field_validator("phone_number")
    @classmethod
    def validate_phone_number(cls, value: str | None) -> str | None:
        if value is None:
            return None

        normalized_value = value.replace(" ", "")
        if not normalized_value.startswith("+968"):
            raise ValueError("Phone number must start with +968.")

        local_number = normalized_value[4:]
        if len(local_number) != 8 or not local_number.isdigit():
            raise ValueError("Phone number must be in the format +968XXXXXXXX.")

        return normalized_value


class UserCreate(UserBase):
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(UserBase):
    user_id: int
    role: str

    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    access_token: str
    token_type: str
