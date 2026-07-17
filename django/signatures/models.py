import secrets
import uuid

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.utils.translation import gettext_lazy as _
from documents.models import Document


def generate_short_id():
    return secrets.token_hex(4)


class DocumentSignature(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    short_id = models.CharField(
        max_length=8,
        default=generate_short_id,
        unique=True,
        editable=False,
        db_index=True,
        help_text=_("A unique 8-character hex ID for public verification."),
    )
    document = models.ForeignKey(
        "documents.Document", on_delete=models.CASCADE, related_name="signatures"
    )
    signer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="signatures",
    )
    document_hash = models.CharField(
        max_length=64,
        help_text=_(
            "The JCS canonical SHA-256 hash of the normalized document content "
            "at the moment of signing. Matches DocumentData.content_hash."
        ),
    )
    cryptographic_signature = models.TextField(
        help_text=_("The RSA-PSS signature over document_hash.")
    )
    public_key = models.TextField(
        blank=True,
        help_text=_("PEM public key used to verify the cryptographic signature."),
    )
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    signed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-signed_at"]
        verbose_name = "document signature"
        verbose_name_plural = "document signatures"

    def __str__(self):
        signer_name = self.signer.email if self.signer else "Unknown User"
        return f"Signature on {self.document.name} by {signer_name}"

    def clean(self):
        if self.pk is None:
            current_hash = self.document.data.content_hash
            if self.document_hash != current_hash:
                raise ValidationError(
                    _(
                        "The document hash does not match the current normalized data. "
                        "The document may have been modified."
                    )
                )

    def save(self, *args, **kwargs):
        is_new = self._state.adding
        self.clean()
        super().save(*args, **kwargs)
        if is_new and self.document.signing_status != Document.SigningStatus.SIGNED:
            self.document.signing_status = Document.SigningStatus.SIGNED
            self.document.save(update_fields=["signing_status"])

    def delete(self, *args, **kwargs):
        raise ValidationError(
            _("Signatures form a permanent audit trail and cannot be deleted.")
        )


class PublicVerificationLog(models.Model):
    STATUS_CHOICES = (
        ("verified", "Verified"),
        ("tampered", "Tampered"),
        ("not_found", "Not Found"),
        ("error", "Error"),
    )
    short_id_used = models.CharField(
        max_length=20, help_text="The ID the user attempted to look up."
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)
    signature = models.ForeignKey(
        "DocumentSignature",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="verification_logs",
    )
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-timestamp"]
        verbose_name = "public verification log"

    def __str__(self):
        return f"Verification {self.status} for ID {self.short_id_used}"
