from django.urls import path

from .admin_views import (
    AdminAuditLogListView,
    AdminDashboardView,
    AdminDocumentDetailView,
    AdminDocumentDownloadView,
    AdminDocumentListView,
)
from .views import (
    DocumentDataView,
    DocumentDetailView,
    DocumentDownloadView,
    DocumentExportView,
    DocumentListCreateView,
    DocumentStatsView,
)

urlpatterns = [
    path("", DocumentListCreateView.as_view(), name="document-list-create"),
    path("stats/", DocumentStatsView.as_view(), name="document-stats"),
    path("export/", DocumentExportView.as_view(), name="document-export"),
    path("<uuid:pk>/", DocumentDetailView.as_view(), name="document-detail"),
    path("<uuid:pk>/data/", DocumentDataView.as_view(), name="document-data"),
    path("<uuid:pk>/download/", DocumentDownloadView.as_view(), name="document-download"),

    path('admin-overview/', AdminDashboardView.as_view(), name="admin-overview"),
    path('admin/list/', AdminDocumentListView.as_view(), name='admin-document-list'),
    path('admin/audit/', AdminAuditLogListView.as_view(), name='admin-audit-list'),
    path('admin/<uuid:pk>/', AdminDocumentDetailView.as_view(), name='admin-document-detail'),
    path('admin/<uuid:pk>/download/', AdminDocumentDownloadView.as_view(), name='admin-document-download'),
]
