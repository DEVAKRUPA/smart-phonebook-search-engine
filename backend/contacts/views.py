import csv
import io

from bson import ObjectId
from django.core.files.storage import default_storage
from django.core.validators import validate_email
from django.http import Http404, HttpResponse
from django.utils import timezone
from django.utils.dateparse import parse_date
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import status, viewsets
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from config.mongodb import get_contacts_collection


CONTACT_FIELDS = [
    "name",
    "country_code",
    "phone_number",
    "email",
    "company",
    "address",
    "tags",
    "favorite",
    "notes",
    "profile_image",
    "birthday",
]

CSV_FIELDS = [
    "name",
    "country_code",
    "phone_number",
    "email",
    "company",
    "address",
    "tags",
    "favorite",
    "notes",
    "birthday",
]

SEARCH_FIELDS = ["name", "phone_number", "email", "company", "address", "tags"]
ORDERING_FIELDS = {"name", "phone_number", "created_at", "updated_at", "birthday"}


def contacts_collection():
    # MongoDB replaces MySQL only for contact storage.
    return get_contacts_collection()


def now_iso():
    return timezone.now().isoformat()


def serialize_contact(contact):
    return {
        "id": str(contact["_id"]),
        "user": contact.get("user_id"),
        "name": contact.get("name") or "",
        "country_code": contact.get("country_code") or "",
        "phone_number": contact.get("phone_number") or "",
        "email": contact.get("email") or "",
        "company": contact.get("company") or "",
        "address": contact.get("address") or "",
        "tags": contact.get("tags") or "",
        "favorite": bool(contact.get("favorite", False)),
        "notes": contact.get("notes") or "",
        "profile_image": contact.get("profile_image") or None,
        "birthday": contact.get("birthday") or "",
        "created_at": contact.get("created_at"),
        "updated_at": contact.get("updated_at"),
    }


def parse_bool(value):
    if isinstance(value, bool):
        return value
    return str(value or "").strip().lower() in ["true", "1", "yes", "y", "on"]


def normalize_text(value):
    return str(value or "").strip()


def get_request_data(request):
    data = {}
    for field in CONTACT_FIELDS:
        if field in request.data and field != "profile_image":
            data[field] = request.data.get(field)

    upload = request.FILES.get("profile_image")
    if upload:
        image_path = default_storage.save(f"contact_images/{upload.name}", upload)
        data["profile_image"] = f"/media/{image_path}"

    return data


def validate_contact_data(data, partial=False):
    errors = {}

    phone_number = normalize_text(data.get("phone_number"))
    if not partial or "phone_number" in data:
        if not phone_number:
            errors["phone_number"] = ["Phone number is required."]
        elif not phone_number.isdigit():
            errors["phone_number"] = ["Phone number must contain only digits."]
        elif len(phone_number) != 10:
            errors["phone_number"] = ["Phone number must be exactly 10 digits."]
        else:
            data["phone_number"] = phone_number

    country_code = normalize_text(data.get("country_code"))
    if "country_code" in data:
        if country_code and not country_code.isdigit():
            errors["country_code"] = ["Country code must contain only digits."]
        else:
            data["country_code"] = country_code

    email = normalize_text(data.get("email"))
    if email:
        try:
            validate_email(email)
            data["email"] = email
        except DjangoValidationError:
            errors["email"] = ["Enter a valid email address."]

    if "favorite" in data:
        data["favorite"] = parse_bool(data.get("favorite"))

    if "birthday" in data:
        birthday = normalize_text(data.get("birthday"))
        if birthday and not parse_date(birthday):
            errors["birthday"] = ["Date has wrong format. Use YYYY-MM-DD."]
        else:
            data["birthday"] = birthday

    for field in ["name", "company", "address", "tags", "notes"]:
        if field in data:
            data[field] = normalize_text(data.get(field))

    return errors


def get_contact_or_404(request, pk):
    try:
        object_id = ObjectId(pk)
    except Exception:
        raise Http404

    contact = contacts_collection().find_one(
        {"_id": object_id, "user_id": request.user.id}
    )
    if not contact:
        raise Http404
    return contact


def duplicate_phone_exists(user_id, phone_number, exclude_id=None):
    query = {"user_id": user_id, "phone_number": phone_number}
    if exclude_id:
        query["_id"] = {"$ne": exclude_id}
    return contacts_collection().find_one(query) is not None


class ContactViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def list(self, request):
        query = {"user_id": request.user.id}
        search_text = normalize_text(request.query_params.get("search"))

        try:
            contacts = list(contacts_collection().find(query))
        except Exception as exc:
            print(f"Unable to fetch contacts: {exc}")
            return Response(
                {"error": "Unable to fetch contacts"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
        if search_text:
            search_lower = search_text.lower()
            contacts = [
                contact
                for contact in contacts
                if any(
                    search_lower in str(contact.get(field, "")).lower()
                    for field in SEARCH_FIELDS
                )
            ]

        ordering = request.query_params.get("ordering") or "-updated_at"
        reverse = ordering.startswith("-")
        ordering_field = ordering[1:] if reverse else ordering
        if ordering_field not in ORDERING_FIELDS:
            ordering_field = "updated_at"
            reverse = True

        contacts.sort(
            key=lambda contact: str(contact.get(ordering_field) or "").lower(),
            reverse=reverse,
        )
        return Response([serialize_contact(contact) for contact in contacts])

    def retrieve(self, request, pk=None):
        return Response(serialize_contact(get_contact_or_404(request, pk)))

    def create(self, request):
        data = get_request_data(request)
        errors = validate_contact_data(data)
        if errors:
            return Response(errors, status=status.HTTP_400_BAD_REQUEST)

        if duplicate_phone_exists(request.user.id, data["phone_number"]):
            return Response(
                {"phone_number": ["A contact with this phone number already exists."]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        timestamp = now_iso()
        document = {
            "user_id": request.user.id,
            "created_at": timestamp,
            "updated_at": timestamp,
            "favorite": False,
        }
        for field in CONTACT_FIELDS:
            if field in data:
                document[field] = data[field]

        result = contacts_collection().insert_one(document)
        document["_id"] = result.inserted_id
        return Response(serialize_contact(document), status=status.HTTP_201_CREATED)

    def update(self, request, pk=None):
        return self.partial_update(request, pk)

    def partial_update(self, request, pk=None):
        contact = get_contact_or_404(request, pk)
        data = get_request_data(request)
        errors = validate_contact_data(data, partial=True)
        if errors:
            return Response(errors, status=status.HTTP_400_BAD_REQUEST)

        next_phone_number = data.get("phone_number", contact.get("phone_number"))
        if duplicate_phone_exists(request.user.id, next_phone_number, contact["_id"]):
            return Response(
                {"phone_number": ["A contact with this phone number already exists."]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        data["updated_at"] = now_iso()
        contacts_collection().update_one({"_id": contact["_id"]}, {"$set": data})
        contact.update(data)
        return Response(serialize_contact(contact))

    def destroy(self, request, pk=None):
        contact = get_contact_or_404(request, pk)
        contacts_collection().delete_one({"_id": contact["_id"]})
        return Response(status=status.HTTP_204_NO_CONTENT)


class ContactCsvExportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        response = HttpResponse(content_type="text/csv")
        response["Content-Disposition"] = 'attachment; filename="contacts.csv"'

        writer = csv.writer(response)
        writer.writerow(CSV_FIELDS)

        contacts = list(contacts_collection().find({"user_id": request.user.id}))
        contacts.sort(key=lambda contact: (contact.get("name") or "", contact.get("phone_number") or ""))

        for contact in contacts:
            writer.writerow([contact.get(field) or "" for field in CSV_FIELDS])

        return response


class ContactCsvImportView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        upload = request.FILES.get("file")
        if not upload:
            return Response({"detail": "CSV file is required."}, status=400)

        decoded_file = io.StringIO(upload.read().decode("utf-8-sig"))
        reader = csv.DictReader(decoded_file)
        imported_count = 0
        skipped_duplicates = 0
        invalid_rows = 0

        for row in reader:
            data = {
                "name": (row.get("name") or "").strip(),
                "country_code": (row.get("country_code") or "").strip(),
                "phone_number": (row.get("phone_number") or "").strip(),
                "email": (row.get("email") or "").strip(),
                "company": (row.get("company") or "").strip(),
                "address": (row.get("address") or "").strip(),
                "tags": (row.get("tags") or "").strip(),
                "favorite": str(row.get("favorite") or "").strip().lower()
                in ["true", "1", "yes", "y"],
                "notes": (row.get("notes") or "").strip(),
                "birthday": (row.get("birthday") or "").strip(),
            }

            errors = validate_contact_data(data)
            if errors:
                invalid_rows += 1
                continue

            if duplicate_phone_exists(request.user.id, data["phone_number"]):
                skipped_duplicates += 1
                continue

            timestamp = now_iso()
            data.update(
                {
                    "user_id": request.user.id,
                    "created_at": timestamp,
                    "updated_at": timestamp,
                }
            )
            contacts_collection().insert_one(data)
            imported_count += 1

        return Response(
            {
                "imported_count": imported_count,
                "skipped_duplicates": skipped_duplicates,
                "invalid_rows": invalid_rows,
            }
        )
