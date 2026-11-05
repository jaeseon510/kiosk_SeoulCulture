import os

from dotenv import load_dotenv
from pymongo import MongoClient, ReturnDocument

load_dotenv()

MONGODB_URI = os.environ["MONGODB_URI"]
MONGODB_DB_NAME = os.environ.get("MONGODB_DB", "kiosk")

client = MongoClient(MONGODB_URI)
db = client[MONGODB_DB_NAME]
orders = db["orders"]
counters = db["counters"]


def next_order_number() -> int:
    doc = counters.find_one_and_update(
        {"_id": "order_number"},
        {"$inc": {"seq": 1}},
        upsert=True,
        return_document=ReturnDocument.AFTER,
    )
    return 100 + doc["seq"]
