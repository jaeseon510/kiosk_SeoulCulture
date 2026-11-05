from typing import Literal, Optional

from pydantic import BaseModel


class CartItemIn(BaseModel):
    itemId: str
    quantity: int
    selectedOptions: dict[str, str] = {}


class OrderCreateIn(BaseModel):
    items: list[CartItemIn]
    orderType: Literal["dine_in", "takeout"]


class OrderCreateOut(BaseModel):
    orderId: str
    orderNumber: int
    total: int
    status: Literal["pending", "paid"]


class PayIn(BaseModel):
    paymentMethod: Literal["card", "simple_pay"]


class PayOut(BaseModel):
    orderId: str
    orderNumber: int
    status: Literal["pending", "paid"]
    paymentMethod: Optional[str] = None


class OrderOut(BaseModel):
    orderId: str
    orderNumber: int
    total: int
    status: Literal["pending", "paid"]
    orderType: Literal["dine_in", "takeout"]
