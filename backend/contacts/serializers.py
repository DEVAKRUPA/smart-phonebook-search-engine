from rest_framework import serializers

from .models import Contact


class ContactSerializer(serializers.ModelSerializer):
    class Meta:
        model = Contact
        fields = "__all__"
        read_only_fields = ("user", "created_at", "updated_at")
        validators = []

    def validate_phone_number(self, value):
        if not value:
            raise serializers.ValidationError("Phone number is required.")

        if not value.isdigit():
            raise serializers.ValidationError("Phone number must contain only digits.")

        if len(value) != 10:
            raise serializers.ValidationError("Phone number must be exactly 10 digits.")

        return value

    def validate_country_code(self, value):
        if not value:
            return value

        if not value.isdigit():
            raise serializers.ValidationError("Country code must contain only digits.")

        return value

    def validate(self, attrs):
        request = self.context.get("request")
        user = getattr(request, "user", None)
        phone_number = attrs.get(
            "phone_number",
            getattr(self.instance, "phone_number", None),
        )

        if user and user.is_authenticated and phone_number:
            duplicate_contacts = Contact.objects.filter(
                user=user,
                phone_number=phone_number,
            )

            if self.instance:
                duplicate_contacts = duplicate_contacts.exclude(pk=self.instance.pk)

            if duplicate_contacts.exists():
                raise serializers.ValidationError(
                    {
                        "phone_number": [
                            "A contact with this phone number already exists."
                        ]
                    }
                )

        return attrs
