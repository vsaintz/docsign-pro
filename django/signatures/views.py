from django.shortcuts import get_object_or_404
from documents.models import Document
from documents.normalizer import normalize
from rest_framework import status
from rest_framework.decorators import api_view, parser_classes, permission_classes
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .models import DocumentSignature, PublicVerificationLog
from .services import SignatureService


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def sign_document_view(request, document_id):
    document = get_object_or_404(Document, id=document_id)
    if document.owner != request.user:
        return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)
    try:
        signature = SignatureService.sign_document(document, request.user)
        return Response(
            {
                "message": "Document successfully signed and sealed.",
                "signature_id": signature.id,
                "status": document.signing_status,
            },
            status=status.HTTP_201_CREATED,
        )
    except ValueError as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET"])
def verify_document_view(request, document_id):
    document = get_object_or_404(Document, id=document_id)
    signature = DocumentSignature.objects.filter(document=document).first()
    if not signature:
        return Response({"status": "unsigned"})
    is_valid = SignatureService.verify_signature(signature)
    return Response(
        {
            "status": "verified" if is_valid else "tampered",
            "signed_by": signature.signer.email if signature.signer else "Unknown",
            "signed_at": signature.signed_at,
        }
    )


def get_client_ip(request):
    x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
    return (
        x_forwarded_for.split(",")[0]
        if x_forwarded_for
        else request.META.get("REMOTE_ADDR")
    )


@api_view(["POST"])
@permission_classes([AllowAny])
@parser_classes([MultiPartParser, FormParser])
def public_verify_document_view(request):
    short_id = request.data.get("short_id")
    file = request.FILES.get("file")
    ip = get_client_ip(request)
    ua = request.META.get("HTTP_USER_AGENT", "")[:250]

    if not short_id or not file:
        return Response(
            {"error": "Both 'short_id' and 'file' are required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    signature = DocumentSignature.objects.filter(short_id=short_id).first()
    if not signature:
        PublicVerificationLog.objects.create(
            short_id_used=short_id, status="not_found", ip_address=ip, user_agent=ua
        )
        return Response(
            {"status": "not_found", "error": "Invalid signature ID."},
            status=status.HTTP_404_NOT_FOUND,
        )

    try:
        normalized_doc = normalize(file, signature.document.file_type)
        computed_hash = normalized_doc.get_canonical_hash()

        if computed_hash == signature.document_hash:
            PublicVerificationLog.objects.create(
                short_id_used=short_id,
                status="verified",
                signature=signature,
                ip_address=ip,
                user_agent=ua,
            )
            return Response(
                {
                    "status": "verified",
                    "signed_by": signature.signer.email if signature.signer else "Unknown",
                    "signed_at": signature.signed_at,
                },
                status=status.HTTP_200_OK,
            )
        else:
            PublicVerificationLog.objects.create(
                short_id_used=short_id,
                status="tampered",
                signature=signature,
                ip_address=ip,
                user_agent=ua,
            )
            return Response({"status": "tampered"}, status=status.HTTP_200_OK)

    except Exception as e:
        PublicVerificationLog.objects.create(
            short_id_used=short_id,
            status="error",
            signature=signature,
            ip_address=ip,
            user_agent=ua,
        )
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
