from rest_framework import serializers

from .models import Project


class ProjectSerializer(serializers.ModelSerializer):
    doc_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Project
        fields = ["id", "name", "color", "pinned", "doc_count", "created_at", "updated_at"]
        read_only_fields = ["id", "doc_count", "created_at", "updated_at"]


class ProjectWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = ["name", "color", "pinned"]
