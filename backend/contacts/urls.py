from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .auth_views import CurrentUserView, LoginView, LogoutView, RegisterView
from .views import ContactCsvExportView, ContactCsvImportView, ContactViewSet

router = DefaultRouter()
router.register("contacts", ContactViewSet, basename="contact")

urlpatterns = [
    path("auth/register/", RegisterView.as_view(), name="auth-register"),
    path("auth/login/", LoginView.as_view(), name="auth-login"),
    path("auth/logout/", LogoutView.as_view(), name="auth-logout"),
    path("auth/user/", CurrentUserView.as_view(), name="auth-user"),
    path("contacts/export/", ContactCsvExportView.as_view(), name="contacts-export"),
    path("contacts/import/", ContactCsvImportView.as_view(), name="contacts-import"),
    path("", include(router.urls)),
]
