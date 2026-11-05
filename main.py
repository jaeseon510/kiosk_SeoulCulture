import asyncio
import uuid

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

import data
import database
from models import OrderCreateIn, OrderCreateOut, OrderOut, PayIn, PayOut

app = FastAPI(title="카페 키오스크 (가상 결제 데모)")

app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")


def calculate_item_total(item_id: str, quantity: int, selected_options: dict[str, str]) -> int:
    menu_item = data.get_menu_item(item_id)
    if menu_item is None:
        raise HTTPException(status_code=400, detail=f"알 수 없는 메뉴입니다: {item_id}")

    unit_price = menu_item["price"]
    for group_id in menu_item["options"]:
        group = data.get_option_group(group_id)
        choice_id = selected_options.get(group_id)
        if group["required"] and choice_id is None:
            raise HTTPException(
                status_code=400,
                detail=f"'{menu_item['name']}' 메뉴에 필수 옵션 '{group['name']}'이 누락되었습니다.",
            )
        if choice_id is not None:
            unit_price += data.get_choice_delta(group_id, choice_id)

    return unit_price * quantity


@app.get("/", response_class=HTMLResponse)
def index(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})


@app.get("/api/menu")
def get_menu():
    return data.build_menu_payload()


@app.post("/api/orders", response_model=OrderCreateOut)
def create_order(payload: OrderCreateIn):
    if not payload.items:
        raise HTTPException(status_code=400, detail="장바구니가 비어 있습니다.")

    total = 0
    for cart_item in payload.items:
        if cart_item.quantity <= 0:
            raise HTTPException(status_code=400, detail="수량은 1개 이상이어야 합니다.")
        total += calculate_item_total(cart_item.itemId, cart_item.quantity, cart_item.selectedOptions)

    order_id = uuid.uuid4().hex[:12]
    order_number = database.next_order_number()
    database.orders.insert_one({
        "_id": order_id,
        "orderId": order_id,
        "orderNumber": order_number,
        "total": total,
        "status": "pending",
        "orderType": payload.orderType,
        "paymentMethod": None,
    })

    return OrderCreateOut(orderId=order_id, orderNumber=order_number, total=total, status="pending")


@app.post("/api/orders/{order_id}/pay", response_model=PayOut)
async def pay_order(order_id: str, payload: PayIn):
    order = database.orders.find_one({"_id": order_id})
    if order is None:
        raise HTTPException(status_code=404, detail="주문을 찾을 수 없습니다.")
    if order["status"] == "paid":
        raise HTTPException(status_code=400, detail="이미 결제가 완료된 주문입니다.")

    # 실제 PG사 연동 없이 처리 시간을 흉내만 내는 가상 결제
    await asyncio.sleep(1.5)

    database.orders.update_one(
        {"_id": order_id},
        {"$set": {"status": "paid", "paymentMethod": payload.paymentMethod}},
    )

    return PayOut(
        orderId=order["orderId"],
        orderNumber=order["orderNumber"],
        status="paid",
        paymentMethod=payload.paymentMethod,
    )


@app.get("/api/orders/{order_id}", response_model=OrderOut)
def get_order(order_id: str):
    order = database.orders.find_one({"_id": order_id})
    if order is None:
        raise HTTPException(status_code=404, detail="주문을 찾을 수 없습니다.")
    return OrderOut(**{k: v for k, v in order.items() if k not in ("_id", "paymentMethod")})
