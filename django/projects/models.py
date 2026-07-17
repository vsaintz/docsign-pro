import uuid

from django.conf import settings
from django.db import models


class Project(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="projects",
    )
    name = models.CharField(max_length=255)
    color = models.CharField(max_length=100, default="bg-[oklch(0.91_0.05_240)]")
    pinned = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]

    def __str__(self):
        return self.name
