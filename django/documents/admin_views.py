import os
from datetime import timedelta

from django.db.models import Q, Sum
from django.http import FileResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.utils.timezone import localtime
from rest_framework import status
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView
from signatures.models import DocumentSignature, PublicVerificationLog
from users.models import CustomUser

from documents.models import Document


class AdminDashboardView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        current_time = timezone.now()
        seven_days_ago = current_time - timedelta(days=7)

        total_docs = Document.objects.count()
        total_users = CustomUser.objects.count()
        active_users = CustomUser.objects.filter(last_login__gte=seven_days_ago).count()
        storage_bytes = Document.objects.aggregate(Sum('file_size'))['file_size__sum'] or 0
        pending_docs = Document.objects.filter(signing_status=Document.SigningStatus.UNSIGNED).count()
        signed_count = Document.objects.filter(signing_status=Document.SigningStatus.SIGNED).count()

        status_segments = [
            {"label": "Signed", "value": signed_count},
            {"label": "Pending", "value": pending_docs},
        ]

        recent_docs = Document.objects.select_related('owner').order_by('-created_at')[:5]
        org_docs = [{
            "name": doc.name,
            "file_type": doc.file_type,
            "owner": doc.owner.full_name if doc.owner else "Unknown",
            "date": localtime(doc.created_at).strftime("%b %d"),
            "status": "Signed" if doc.signing_status == Document.SigningStatus.SIGNED else "Pending"
        } for doc in recent_docs]

        recent_sigs = list(DocumentSignature.objects.select_related('signer', 'document').order_by('-signed_at')[:5])
        recent_verifications = list(PublicVerificationLog.objects.select_related('signature__document').order_by('-timestamp')[:5])

        combined_events = []
        for sig in recent_sigs:
            combined_events.append({"time_obj": sig.signed_at, "type": "signature", "data": sig})
        for ver in recent_verifications:
            combined_events.append({"time_obj": ver.timestamp, "type": "verification", "data": ver})

        combined_events.sort(key=lambda x: x["time_obj"], reverse=True)
        top_events = combined_events[:5]

        audit_events = []
        for event in top_events:
            time_str = localtime(event["time_obj"]).strftime("%b %d, %I:%M %p")

            if event["type"] == "signature":
                sig = event["data"]
                audit_events.append({
                    "type": "signature",
                    "title": "Document Signed",
                    "meta": f"{sig.signer.email if sig.signer else 'Unknown'} signed {sig.document.name}",
                    "time": time_str
                })
            else:
                ver = event["data"]
                ip_display = ver.ip_address if ver.ip_address else "Unknown IP"
                doc_name = ver.signature.document.name if ver.signature else f"ID: {ver.short_id_used}"

                if ver.status == "verified":
                    audit_events.append({
                        "type": "verification_success",
                        "title": "Public Verification Success",
                        "meta": f"{doc_name} was verified from {ip_display}",
                        "time": time_str
                    })
                elif ver.status == "tampered":
                    audit_events.append({
                        "type": "verification_tampered",
                        "title": "Tampered Document Detected!",
                        "meta": f"Failed verification for {doc_name} from {ip_display}",
                        "time": time_str
                    })
                elif ver.status == "error":
                    audit_events.append({
                        "type": "verification_error",
                        "title": "Verification Error",
                        "meta": f"File processing failed for {doc_name} from {ip_display}",
                        "time": time_str
                    })
                else:
                    audit_events.append({
                        "type": "verification_invalid",
                        "title": "Invalid ID Lookup",
                        "meta": f"Attempted to look up unknown ID: {ver.short_id_used}",
                        "time": time_str
                    })

        activity_data = []
        for i in range(7):
            day = (current_time - timedelta(days=6-i)).date()
            day_uploads = Document.objects.filter(created_at__date=day).count()
            day_verified = DocumentSignature.objects.filter(signed_at__date=day).count()
            activity_data.append({
                "label": day.strftime("%a"),
                "uploaded": day_uploads,
                "verified": day_verified
            })

        return Response({
            "totalDocuments": total_docs,
            "totalUsers": total_users,
            "activeUsers7d": active_users,
            "storageUsedBytes": storage_bytes,
            "pendingOrgWide": pending_docs,
            "statusSegments": status_segments,
            "orgDocs": org_docs,
            "auditEvents": audit_events,
            "activityData": activity_data
        })


class StandardResultsSetPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = "page_size"
    max_page_size = 100

class AdminDocumentListView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        queryset = (
            Document.objects.select_related("owner")
            .prefetch_related("signatures__signer")
            .order_by("-created_at")
        )

        search_query = request.query_params.get("search", None)
        if search_query:
            queryset = queryset.filter(
                Q(name__icontains=search_query)
                | Q(owner__email__icontains=search_query)
            )

        status_filter = request.query_params.get("status", "all")
        if status_filter == "signed":
            queryset = queryset.filter(signing_status=Document.SigningStatus.SIGNED)
        elif status_filter == "unsigned":
            queryset = queryset.filter(signing_status=Document.SigningStatus.UNSIGNED)

        paginator = StandardResultsSetPagination()
        paginated_queryset = paginator.paginate_queryset(queryset, request)

        data = []

        for doc in paginated_queryset:
            signature = doc.signatures.first()

            total_ver = 0
            success_ver = 0
            failed_ver = 0
            verification_id = None

            if signature:
                verification_id = signature.short_id
                logs = PublicVerificationLog.objects.filter(short_id_used=verification_id)
                total_ver = logs.count()
                success_ver = logs.filter(status="verified").count()
                failed_ver = total_ver - success_ver

            data.append(
                {
                    "id": str(doc.id),
                    "name": doc.name,
                    "file_type": doc.file_type,
                    "file_size": doc.file_size_display,
                    "status": doc.signing_status,
                    "owner_email": doc.owner.email if doc.owner else "Unknown",
                    "created_at": localtime(doc.created_at).strftime("%b %d, %Y"),
                    "signed_by": signature.signer.email if signature and signature.signer else None,
                    "signed_at": localtime(signature.signed_at).strftime("%b %d, %Y %I:%M %p") if signature else None,
                    "verification_id": verification_id,
                    "total_verifications": total_ver,
                    "successful_verifications": success_ver,
                    "failed_verifications": failed_ver,
                }
            )

        response = paginator.get_paginated_response(data)
        response.data["total_signed"] = Document.objects.filter(signing_status=Document.SigningStatus.SIGNED).count()
        response.data["total_pending"] = Document.objects.filter(signing_status=Document.SigningStatus.UNSIGNED).count()
        response.data["total_system_verifications"] = PublicVerificationLog.objects.count()

        return response


class AdminAuditLogListView(APIView):
    permission_classes = [IsAdminUser]
    def get(self, request):
        sigs = list(
            DocumentSignature.objects.select_related("signer", "document").order_by(
                "-signed_at"
            )[:1000]
        )
        vers = list(
            PublicVerificationLog.objects.select_related(
                "signature__document"
            ).order_by("-timestamp")[:1000]
        )
        combined_events = []

        for sig in sigs:
            combined_events.append(
                {"time_obj": sig.signed_at, "type": "signature", "data": sig}
            )
        for ver in vers:
            combined_events.append(
                {"time_obj": ver.timestamp, "type": "verification", "data": ver}
            )

        combined_events.sort(key=lambda x: x["time_obj"], reverse=True)
        paginator = StandardResultsSetPagination()
        paginated_events = paginator.paginate_queryset(combined_events, request)
        audit_events = []

        for event in paginated_events:
            time_str = localtime(event["time_obj"]).strftime("%b %d, %Y • %I:%M:%S %p")

            if event["type"] == "signature":
                sig = event["data"]
                audit_events.append(
                    {
                        "id": f"sig_{sig.id}",
                        "event_type": "Document Signed",
                        "document_name": sig.document.name,
                        "actor": sig.signer.email if sig.signer else "Unknown User",
                        "ip_address": " ",
                        "user_agent": "Internal Dashboard",
                        "timestamp": time_str,
                        "status": "Signed",
                    }
                )
            else:
                ver = event["data"]
                doc_name = (
                    ver.signature.document.name
                    if ver.signature
                    else f"ID: {ver.short_id_used}"
                )
                if ver.status == "verified":
                    status_label = "Verified"
                elif ver.status == "tampered":
                    status_label = "Tampered"
                elif ver.status == "error":
                    status_label = "Format Error"
                else:
                    status_label = "Invalid ID"
                audit_events.append(
                    {
                        "id": f"ver_{ver.id}",
                        "event_type": "Public Verification",
                        "document_name": doc_name,
                        "actor": "Public User",
                        "ip_address": ver.ip_address or "Unknown IP",
                        "user_agent": ver.user_agent or "Unknown Browser",
                        "timestamp": time_str,
                        "status": status_label,
                    }
                )
        return paginator.get_paginated_response(audit_events)


class AdminDocumentDetailView(APIView):
    permission_classes = [IsAdminUser]

    def delete(self, request, pk):
        document = get_object_or_404(Document, pk=pk)
        document.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

class AdminDocumentDownloadView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request, pk):
        document = get_object_or_404(Document, pk=pk)

        file_path_str = str(document.file.name)
        _, ext = os.path.splitext(file_path_str)

        download_name = document.name
        if ext and not download_name.lower().endswith(ext.lower()):
            download_name = f"{download_name}{ext}"

        response = FileResponse(document.file.open('rb'))
        response['Content-Disposition'] = f'attachment; filename="{download_name}"'
        return response
