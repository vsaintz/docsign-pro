import hashlib

from django.conf import settings
from django.core.exceptions import SuspiciousOperation
from django.db import transaction
from rest_framework import serializers

from .models import Document
from .processing import ALLOWED_MIME_TYPES, MAX_UPLOAD_BYTES_DEFAULT, run_pipeline

MAX_UPLOAD_BYTES = getattr(
    settings, "DOCUMENT_MAX_UPLOAD_BYTES", MAX_UPLOAD_BYTES_DEFAULT
)


def _compute_raw_hash(file) -> str:
    hasher = hashlib.sha256()
    file.seek(0)
    for chunk in iter(lambda: file.read(8192), b""):
        hasher.update(chunk)
    file.seek(0)
    return hasher.hexdigest()


class DocumentUploadSerializer(serializers.ModelSerializer):
    file = serializers.FileField(write_only=True)

    class Meta:
        model = Document
        fields = ["id", "file"]
        read_only_fields = ["id"]

    def validate_file(self, file):
        if file.size > MAX_UPLOAD_BYTES:
            raise serializers.ValidationError(
                f"File too large. Maximum size is {MAX_UPLOAD_BYTES // (1024 * 1024)} MB."
            )
        mime = getattr(file, "content_type", "") or ""
        if mime and mime not in ALLOWED_MIME_TYPES:
            raise serializers.ValidationError(
                "Unsupported file type. Accepted formats: CSV, XLSX, XLS."
            )
        return file

    def create(self, validated_data):
        file = validated_data.pop("file")
        request = self.context["request"]

        raw_hash = _compute_raw_hash(file)
        if Document.objects.filter(owner=request.user, file_hash=raw_hash).exists():
            raise serializers.ValidationError(
                "You have already uploaded this file. Duplicate uploads are not allowed."
            )

        raw_name = file.name or "document"
        derived_name = raw_name.rsplit(".", 1)[0].replace("_", " ").strip()

        try:
            with transaction.atomic():
                document = Document(
                    **validated_data,
                    name=derived_name,
                    owner=request.user,
                    original_filename=raw_name,
                    file_size=file.size,
                )
                document.file = file
                document.save()

                run_pipeline(document, file)

                if document.processing_status == Document.ProcessingStatus.FAILED:
                    raise serializers.ValidationError(document.processing_error)

                document.save()
        except SuspiciousOperation as exc:
            raise serializers.ValidationError(f"Could not store file: {exc}")

        return document


class DocumentListSerializer(serializers.ModelSerializer):
    file_size_display = serializers.CharField(read_only=True)
    owner_email = serializers.EmailField(source="owner.email", read_only=True)
    verification_id = serializers.SerializerMethodField()

    class Meta:
        model = Document
        fields = [
            "id",
            "name",
            "owner_email",
            "file_size",
            "file_size_display",
            "file_type",
            "processing_status",
            "signing_status",
            "created_at",
            "project",
            "verification_id",
        ]
        read_only_fields = fields

    def get_verification_id(self, obj):
        signature = obj.signatures.first()
        return signature.short_id if signature else None


class DocumentSerializer(serializers.ModelSerializer):
    file_size_display = serializers.CharField(read_only=True)
    owner_email = serializers.EmailField(source="owner.email", read_only=True)
    owner_name = serializers.CharField(source="owner.full_name", read_only=True)
    processing_error = serializers.SerializerMethodField()

    def get_processing_error(self, obj):
        return obj.processing_error or None

    class Meta:
        model = Document
        fields = [
            "id",
            "name",
            "owner_email",
            "owner_name",
            "original_filename",
            "file_size",
            "file_size_display",
            "file_type",
            "file_hash",
            "processing_status",
            "processing_error",
            "signing_status",
            "row_count",
            "column_count",
            "column_names",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields


class DocumentUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        fields = ["name"]

    def validate_name(self, value: str) -> str:
        return value.strip()


class DocumentDataSerializer(serializers.Serializer):
    content_hash = serializers.CharField()
    normalized_data = serializers.JSONField()
    updated_at = serializers.DateTimeField()
