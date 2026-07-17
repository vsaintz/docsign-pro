from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import CustomUser


@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    list_display = [
        "email",
        "first_name",
        "middle_name",
        "last_name",
        "phone_number",
        "is_staff",
        "is_active",
        "date_joined",
    ]
    list_filter = ["is_staff", "is_active"]
    search_fields = ["email", "first_name", "middle_name", "last_name"]
    ordering = ["email"]
    readonly_fields = ["date_joined"]

    fieldsets = (
        (None, {"fields": ("email", "password")}),
        (
            "Personal Info",
            {"fields": ("first_name", "middle_name", "last_name", "phone_number")},
        ),
        (
            "Permissions",
            {
                "fields": (
                    "is_staff",
                    "is_active",
                    "is_superuser",
                    "groups",
                    "user_permissions",
                )
            },
        ),
        ("Important dates", {"fields": ("date_joined",)}),
    )

    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": (
                    "email",
                    "password1",
                    "password2",
                    "first_name",
                    "middle_name",
                    "last_name",
                    "is_staff",
                    "is_active",
                ),
            },
        ),
    )
