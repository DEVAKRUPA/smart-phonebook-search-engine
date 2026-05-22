from django.contrib.auth.models import User
from django.core.validators import RegexValidator
from django.db import models


phone_number_validator = RegexValidator(
    regex=r"^\d{10}$",
    message="Phone number must be exactly 10 digits.",
)

country_code_validator = RegexValidator(
    regex=r"^\d{1,5}$",
    message="Country code must contain only digits.",
)


class Contact(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="contacts")
    name = models.CharField(max_length=150, blank=True, null=True)
    country_code = models.CharField(
        max_length=5,
        blank=True,
        null=True,
        validators=[country_code_validator],
    )
    phone_number = models.CharField(max_length=10, validators=[phone_number_validator])
    email = models.EmailField(blank=True, null=True)
    company = models.CharField(max_length=150, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    tags = models.CharField(max_length=255, blank=True, null=True)
    favorite = models.BooleanField(default=False)
    notes = models.TextField(blank=True, null=True)
    profile_image = models.ImageField(upload_to="contact_images/", blank=True, null=True)
    birthday = models.DateField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["user", "phone_number"],
                name="unique_contact_phone_number_per_user",
            )
        ]

    def __str__(self):
        if self.name:
            return f"{self.name} ({self.phone_number})"
        return self.phone_number
