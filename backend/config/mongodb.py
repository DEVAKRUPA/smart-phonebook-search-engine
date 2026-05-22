import os
from pathlib import Path

from dotenv import load_dotenv
from pymongo import MongoClient


BASE_DIR = Path(__file__).resolve().parent.parent
ENV_PATH = BASE_DIR / ".env"
load_dotenv(ENV_PATH, override=True)

_client = None


def manually_load_mongodb_uri():
    if os.getenv("MONGODB_URI") or not ENV_PATH.exists():
        return

    for line in ENV_PATH.read_text(encoding="utf-8-sig").splitlines():
        clean_line = line.strip()
        if not clean_line or clean_line.startswith("#"):
            continue

        if clean_line.startswith("MONGODB_URI") and "=" in clean_line:
            key, value = clean_line.split("=", 1)
            if key.strip() == "MONGODB_URI":
                value = value.strip().strip('"').strip("'")
                if value:
                    os.environ["MONGODB_URI"] = value
            return


def get_mongodb():
    """
    MongoDB Atlas connection used by the contacts API.
    Django auth/admin models still use the configured Django database.
    """
    global _client

    manually_load_mongodb_uri()
    mongo_uri = os.getenv("MONGODB_URI")
    if not mongo_uri:
        raise RuntimeError("MONGODB_URI is not configured in the environment.")

    if _client is None:
        _client = MongoClient(mongo_uri)

    return _client["smart_phonebook_db"]


def get_contacts_collection():
    return get_mongodb()["contacts"]
