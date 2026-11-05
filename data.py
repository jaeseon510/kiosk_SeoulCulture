CATEGORIES = [
    {"id": "coffee", "name": "커피"},
    {"id": "beverage", "name": "음료"},
    {"id": "dessert", "name": "디저트"},
    {"id": "bakery", "name": "베이커리"},
]

# 옵션 그룹: 선택지마다 추가 금액(delta)
OPTION_GROUPS = {
    "temperature": {
        "name": "온도",
        "required": True,
        "choices": [
            {"id": "ice", "name": "ICE", "delta": 0},
            {"id": "hot", "name": "HOT", "delta": 0},
        ],
    },
    "size": {
        "name": "사이즈",
        "required": True,
        "choices": [
            {"id": "regular", "name": "Regular", "delta": 0},
            {"id": "large", "name": "Large", "delta": 500},
        ],
    },
    "shot": {
        "name": "샷 추가",
        "required": False,
        "choices": [
            {"id": "none", "name": "없음", "delta": 0},
            {"id": "extra1", "name": "샷 추가 1개", "delta": 500},
            {"id": "extra2", "name": "샷 추가 2개", "delta": 1000},
        ],
    },
}

MENU_ITEMS = [
    # 커피
    {"id": "americano", "category": "coffee", "name": "아메리카노", "price": 4500,
     "options": ["temperature", "size", "shot"]},
    {"id": "latte", "category": "coffee", "name": "카페라떼", "price": 5000,
     "options": ["temperature", "size", "shot"]},
    {"id": "vanilla_latte", "category": "coffee", "name": "바닐라라떼", "price": 5500,
     "options": ["temperature", "size", "shot"]},
    {"id": "caramel_macchiato", "category": "coffee", "name": "카라멜마끼아또", "price": 5800,
     "options": ["temperature", "size", "shot"]},
    {"id": "cappuccino", "category": "coffee", "name": "카푸치노", "price": 5000,
     "options": ["temperature", "size", "shot"]},
    {"id": "espresso", "category": "coffee", "name": "에스프레소", "price": 3500,
     "options": ["shot"]},

    # 음료
    {"id": "green_tea_latte", "category": "beverage", "name": "그린티라떼", "price": 5500,
     "options": ["temperature", "size"]},
    {"id": "choco_latte", "category": "beverage", "name": "초코라떼", "price": 5500,
     "options": ["temperature", "size"]},
    {"id": "lemon_ade", "category": "beverage", "name": "레몬에이드", "price": 5800,
     "options": ["size"]},
    {"id": "grapefruit_ade", "category": "beverage", "name": "자몽에이드", "price": 5800,
     "options": ["size"]},
    {"id": "orange_juice", "category": "beverage", "name": "오렌지주스", "price": 5500,
     "options": ["size"]},
    {"id": "milk", "category": "beverage", "name": "흑임자라떼", "price": 6000,
     "options": ["temperature", "size"]},

    # 디저트
    {"id": "cheesecake", "category": "dessert", "name": "치즈케이크", "price": 6500, "options": []},
    {"id": "tiramisu", "category": "dessert", "name": "티라미수", "price": 6800, "options": []},
    {"id": "macaron", "category": "dessert", "name": "마카롱", "price": 2800, "options": []},
    {"id": "cookie", "category": "dessert", "name": "초코칩쿠키", "price": 3200, "options": []},
    {"id": "scone", "category": "dessert", "name": "스콘", "price": 3800, "options": []},

    # 베이커리
    {"id": "croissant", "category": "bakery", "name": "크루아상", "price": 3800, "options": []},
    {"id": "bagel", "category": "bakery", "name": "베이글", "price": 4200, "options": []},
    {"id": "ciabatta", "category": "bakery", "name": "치아바타 샌드위치", "price": 6500, "options": []},
    {"id": "muffin", "category": "bakery", "name": "블루베리 머핀", "price": 4000, "options": []},
    {"id": "pretzel", "category": "bakery", "name": "프레즐", "price": 3500, "options": []},
]


def get_menu_item(item_id: str):
    for item in MENU_ITEMS:
        if item["id"] == item_id:
            return item
    return None


def get_option_group(group_id: str):
    return OPTION_GROUPS.get(group_id)


def get_choice_delta(group_id: str, choice_id: str) -> int:
    group = get_option_group(group_id)
    if not group:
        return 0
    for choice in group["choices"]:
        if choice["id"] == choice_id:
            return choice["delta"]
    return 0


def get_choice_name(group_id: str, choice_id: str) -> str:
    group = get_option_group(group_id)
    if not group:
        return choice_id
    for choice in group["choices"]:
        if choice["id"] == choice_id:
            return choice["name"]
    return choice_id


def build_menu_payload():
    """프론트에서 렌더링할 전체 메뉴/옵션 데이터를 구성."""
    return {
        "categories": CATEGORIES,
        "items": MENU_ITEMS,
        "optionGroups": OPTION_GROUPS,
    }
