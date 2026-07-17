from django.db.models import Count
from documents.models import Document
from rest_framework import status
from rest_framework.exceptions import NotFound, PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Project
from .serializers import ProjectSerializer, ProjectWriteSerializer


def _get_project_or_404(pk, user) -> Project:
    try:
        project = Project.objects.annotate(doc_count=Count("documents")).get(pk=pk)
    except (Project.DoesNotExist, ValueError):
        raise NotFound("Project not found.")
    if project.owner != user:
        raise PermissionDenied("You do not have permission to access this project.")
    return project


class ProjectListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        projects = (
            Project.objects.filter(owner=request.user)
            .annotate(doc_count=Count("documents"))
        )
        return Response(ProjectSerializer(projects, many=True).data)

    def post(self, request):
        serializer = ProjectWriteSerializer(data=request.data)
        if serializer.is_valid():
            project = serializer.save(owner=request.user)
            # annotate for the response
            project.doc_count = 0
            return Response(ProjectSerializer(project).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ProjectDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        project = _get_project_or_404(pk, request.user)
        serializer = ProjectWriteSerializer(project, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            project.refresh_from_db()
            project.doc_count = project.documents.count()
            return Response(ProjectSerializer(project).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        project = _get_project_or_404(pk, request.user)
        project.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ProjectMoveDocumentView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        project = _get_project_or_404(pk, request.user)
        doc_id = request.data.get("document_id")

        try:
            document = Document.objects.get(pk=doc_id, owner=request.user)
        except (Document.DoesNotExist, ValueError):
            raise NotFound("Document not found.")

        document.project = project
        document.save(update_fields=["project"])
        return Response({"status": "ok"})


class ProjectRemoveDocumentView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, doc_id):
        try:
            document = Document.objects.get(pk=doc_id, owner=request.user)
        except (Document.DoesNotExist, ValueError):
            raise NotFound("Document not found.")

        document.project = None
        document.save(update_fields=["project"])
        return Response({"status": "ok"})
