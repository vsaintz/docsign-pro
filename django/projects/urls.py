from django.urls import path

from .views import (
    ProjectDetailView,
    ProjectListCreateView,
    ProjectMoveDocumentView,
    ProjectRemoveDocumentView,
)

urlpatterns = [
    path("", ProjectListCreateView.as_view(), name="project-list-create"),
    path("<uuid:pk>/", ProjectDetailView.as_view(), name="project-detail"),
    path("<uuid:pk>/add-document/", ProjectMoveDocumentView.as_view(), name="project-add-document"),
    path("remove-document/<uuid:doc_id>/", ProjectRemoveDocumentView.as_view(), name="project-remove-document"),
]
