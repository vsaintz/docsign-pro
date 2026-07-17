import os
import uuid

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.db.models.signals import post_delete
from django.dispatch import receiver
from django.utils.translation import gettext_lazy as _


def document_upload_path(instance, filename):
    ext = os.path.splitext(filename)[1].lower()
    return f"documents/{instance.owner_id}/{instance.id}/{ext}"


class Document(models.Model):
    class FileType(models.TextChoices):
        CSV = "csv", _("CSV")
        XLSX = "xlsx", _("Excel (.xlsx)")
        XLS = "xls", _("Excel (.xls)")

    class ProcessingStatus(models.TextChoices):
        PENDING = "pending", _("Pending")
        PROCESSING = "processing", _("Processing")
        READY = "ready", _("Ready")
        FAILED = "failed", _("Failed")

    class SigningStatus(models.TextChoices):
        UNSIGNED = "unsigned", _("Unsigned")
        SIGNED = "signed", _("Signed")

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="documents",
    )

    file = models.FileField(upload_to=document_upload_path, max_length=255)
    original_filename = models.CharField(max_length=255)
    file_size = models.PositiveBigIntegerField(help_text="Size in bytes.")
    file_type = models.CharField(max_length=10, choices=FileType.choices)
    file_hash = models.CharField(max_length=64, blank=True, db_index=True)

    processing_status = models.CharField(
        max_length=12,
        choices=ProcessingStatus.choices,
        default=ProcessingStatus.PENDING,
        db_index=True,
    )
    processing_error = models.TextField(blank=True, null=True, default=None)
    signing_status = models.CharField(
        max_length=20,
        choices=SigningStatus.choices,
        default=SigningStatus.UNSIGNED,
        db_index=True,
    )

    row_count = models.PositiveIntegerField(null=True, blank=True)
    column_count = models.PositiveIntegerField(null=True, blank=True)
    column_names = models.JSONField(default=list, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    project = models.ForeignKey(
        "projects.Project",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="documents",
    )

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "document"
        verbose_name_plural = "documents"
        constraints = [
            models.UniqueConstraint(
                fields=["owner", "file_hash"],
                condition=models.Q(file_hash__gt=""),
                name="unique_file_per_owner",
            )
        ]

    def __str__(self):
        return f"{self.name} ({self.id})"

    @property
    def file_size_display(self) -> str:
        size = self.file_size
        for unit in ("Bytes", "KB", "MB", "GB"):
            if size < 1024:
                if unit == "Bytes":
                    return f"{int(size)} {unit}"
                return f"{size:.1f} {unit}"
            size /= 1024
        return f"{size:.1f} TB"

    def get_normalized_data(self) -> "DocumentData | None":
        try:
            return self.data
        except DocumentData.DoesNotExist:
            return None

    def clean(self):
        if not self._state.adding:
            original = Document.objects.get(pk=self.pk)
            if original.signing_status == self.SigningStatus.SIGNED:
                if self.name != original.name or self.file != original.file:
                    raise ValidationError(
                        "Cannot modify the contents or name of a cryptographically sealed document."
                    )
        super().clean()

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)


class DocumentData(models.Model):
    document = models.OneToOneField(
        Document,
        on_delete=models.CASCADE,
        related_name="data",
        primary_key=True,
    )
    normalized_data = models.JSONField()
    content_hash = models.CharField(max_length=64, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "document data"
        verbose_name_plural = "document data"

    def __str__(self):
        return f"Data for document {self.pk}"

    def clean(self):
        if self.pk and self.document.signing_status != Document.SigningStatus.UNSIGNED:
            raise ValidationError(
                "Cannot modify data for a document that is signed or pending signature."
            )
        super().clean()

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        if self.document.signing_status != Document.SigningStatus.UNSIGNED:
            raise ValidationError("Cannot delete data for a signed document.")
        super().delete(*args, **kwargs)


@receiver(post_delete, sender=Document)
def delete_document_file(sender, instance, **kwargs):
    if instance.file:
        instance.file.delete(save=False)
