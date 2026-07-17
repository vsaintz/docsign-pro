import io
import zipfile

from django.db.models import Count, Q, Sum
from django.http import FileResponse, HttpResponse
from rest_framework import status
from rest_framework.exceptions import NotFound, PermissionDenied
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Document
from .serializers import (
    DocumentDataSerializer,
    DocumentListSerializer,
    DocumentSerializer,
    DocumentUpdateSerializer,
    DocumentUploadSerializer,
)


def _get_visible_queryset(user):
    return Document.objects.filter(owner=user)

def _assert_can_edit(user, document: Document) -> None:
    if document.owner != user:
        raise PermissionDenied("You do not have permission to edit this document.")
    if document.signing_status == document.SigningStatus.SIGNED:
        raise PermissionDenied("Cannot edit a cryptographically sealed document.")

def _assert_can_delete(user, document: Document) -> None:
    if document.owner != user:
        raise PermissionDenied("You do not have permission to delete this document.")
    if document.signing_status == document.SigningStatus.SIGNED:
        raise PermissionDenied("Cannot delete a cryptographically sealed document.")

def _assert_can_download(user, document: Document) -> None:
    if document.owner != user:
        raise PermissionDenied("You do not have permission to download this document.")

def _get_document_or_404(pk) -> Document:
    try:
        return Document.objects.get(pk=pk)
    except (Document.DoesNotExist, ValueError):
        raise NotFound("Document not found.")


class DocumentListCreateView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get(self, request):
        qs = _get_visible_queryset(request.user)
        if ft := request.query_params.get("file_type"):
            qs = qs.filter(file_type=ft)
        if ss := request.query_params.get("signing_status"):
            qs = qs.filter(signing_status=ss)
        return Response(DocumentListSerializer(qs, many=True).data)

    def post(self, request):
        serializer = DocumentUploadSerializer(
            data=request.data, context={"request": request}
        )
        if serializer.is_valid():
            document = serializer.save()
            return Response(
                DocumentSerializer(document).data,
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class DocumentDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        document = _get_document_or_404(pk)

        if document.owner != request.user:
            raise NotFound("Document not found.")

        return Response(DocumentSerializer(document).data)

    def patch(self, request, pk):
        document = _get_document_or_404(pk)
        _assert_can_edit(request.user, document)
        serializer = DocumentUpdateSerializer(document, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(DocumentSerializer(document).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        document = _get_document_or_404(pk)
        _assert_can_delete(request.user, document)
        document.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class DocumentDataView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        document = _get_document_or_404(pk)
        _assert_can_download(request.user, document)

        doc_data = document.get_normalized_data()
        if doc_data is None:
            raise NotFound("Document data is not available yet.")

        return Response(DocumentDataSerializer(doc_data).data)


class DocumentDownloadView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        document = _get_document_or_404(pk)
        _assert_can_download(request.user, document)

        if not document.file:
            raise NotFound("File not found.")

        response = FileResponse(
            document.file.open("rb"),
            content_type="application/octet-stream",
        )
        response["Content-Disposition"] = (
            f'attachment; filename="{document.original_filename}"'
        )
        response["Content-Length"] = document.file_size
        return response


class DocumentStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = _get_visible_queryset(request.user)
        stats = qs.aggregate(
            total_documents=Count("id"),
            signed_documents=Count("id", filter=Q(signing_status=Document.SigningStatus.SIGNED)),
            unsigned_documents=Count("id", filter=Q(signing_status=Document.SigningStatus.UNSIGNED)),
            total_storage_bytes=Sum("file_size"),
        )
        stats["total_storage_bytes"] = stats["total_storage_bytes"] or 0
        return Response(stats)

class DocumentExportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        documents = _get_visible_queryset(request.user)

        if not documents.exists():
            return Response({"detail": "No documents to export."}, status=status.HTTP_400_BAD_REQUEST)

        buffer = io.BytesIO()
        with zipfile.ZipFile(buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            for doc in documents:
                if doc.file:
                    zip_file.writestr(doc.original_filename, doc.file.read())

        buffer.seek(0)
        response = HttpResponse(buffer.getvalue(), content_type='application/zip')
        response['Content-Disposition'] = 'attachment; filename="my_documents.zip"'
        return response
