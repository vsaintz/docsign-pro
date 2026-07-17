from django.contrib import admin

from .models import Document, DocumentData


@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = [
        "name",
        "owner",
        "file_type",
        "file_size_display",
        "processing_status",
        "signing_status",
        "created_at",
    ]
    list_filter = ["file_type", "processing_status", "signing_status"]
    search_fields = ["name", "original_filename", "owner__email"]
    ordering = ["-created_at"]
    readonly_fields = [
        "id",
        "file_hash",
        "file_size",
        "file_type",
        "processing_status",
        "processing_error",
        "row_count",
        "column_count",
        "column_names",
        "created_at",
        "updated_at",
    ]

    @admin.display(description="Size")
    def file_size_display(self, obj):
        return obj.file_size_display


@admin.register(DocumentData)
class DocumentDataAdmin(admin.ModelAdmin):
    list_display = ["document", "content_hash", "updated_at"]
    search_fields = ["document__name", "content_hash"]
    readonly_fields = [
        "document",
        "content_hash",
        "normalized_data",
        "created_at",
        "updated_at",
    ]
