import os
import sys
from pathlib import Path

from dotenv import load_dotenv


BASE_DIR = Path(__file__).resolve().parent
ENV_PATH = BASE_DIR / ".env"


def mask_env_line(line):
    clean_line = line.strip()
    if "=" not in clean_line:
        return clean_line
    key, value = clean_line.split("=", 1)
    return f"{key}=<set:{bool(value.strip())}>"


def manually_load_mongodb_uri():
    if not ENV_PATH.exists():
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


load_dotenv(ENV_PATH, override=True)

print(f"Loading .env from: {ENV_PATH}")
print(f".env exists: {ENV_PATH.exists()}")
if ENV_PATH.exists():
    raw_lines = ENV_PATH.read_text(encoding="utf-8-sig").splitlines()
    print("First .env lines:")
    for line in raw_lines[:5]:
        print(f"  {mask_env_line(line)}")
    print(
        "Line starts with MONGODB_URI: "
        f"{any(line.strip().startswith('MONGODB_URI') for line in raw_lines)}"
    )
print(f"MONGODB_URI configured: {bool(os.getenv('MONGODB_URI'))}")
if not os.getenv("MONGODB_URI"):
    manually_load_mongodb_uri()
    print(f"MONGODB_URI configured after manual parse: {bool(os.getenv('MONGODB_URI'))}")
if not os.getenv("MONGODB_URI"):
    raise RuntimeError(
        "MONGODB_URI not found. Check backend\\.env contains a line like "
        "MONGODB_URI=mongodb+srv://..."
    )

sys.path.insert(0, str(BASE_DIR))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

import django


django.setup()

from config.mongodb import get_contacts_collection
from contacts.models import Contact


def normalize_datetime(value):
    if not value:
        return None
    return value.isoformat()


def normalize_date(value):
    if not value:
        return ""
    return value.isoformat()


def migrate_contacts():
    collection = get_contacts_collection()
    mysql_contacts = Contact.objects.select_related("user").all()

    total_count = mysql_contacts.count()
    inserted_count = 0
    skipped_duplicates = 0
    error_count = 0

    print(f"Total MySQL contacts found: {total_count}")

    for contact in mysql_contacts:
        try:
            phone_number = contact.phone_number or ""
            duplicate = collection.find_one(
                {
                    "user_id": contact.user_id,
                    "phone_number": phone_number,
                }
            )

            if duplicate:
                skipped_duplicates += 1
                continue

            document = {
                "user_id": contact.user_id,
                "name": contact.name or "",
                "country_code": contact.country_code or "",
                "phone_number": phone_number,
                "email": contact.email or "",
                "company": contact.company or "",
                "address": contact.address or "",
                "tags": contact.tags or "",
                "favorite": bool(contact.favorite),
                "notes": contact.notes or "",
                "profile_image": contact.profile_image.url if contact.profile_image else None,
                "birthday": normalize_date(contact.birthday),
                "created_at": normalize_datetime(contact.created_at),
                "updated_at": normalize_datetime(contact.updated_at),
            }

            collection.insert_one(document)
            inserted_count += 1
        except Exception as exc:
            error_count += 1
            print(f"Error migrating contact id={contact.id}: {exc}")

    print("Migration complete.")
    print(f"Total MySQL contacts found: {total_count}")
    print(f"Inserted count: {inserted_count}")
    print(f"Skipped duplicate count: {skipped_duplicates}")
    print(f"Error count: {error_count}")


if __name__ == "__main__":
    migrate_contacts()
