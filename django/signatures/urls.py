from django.urls import path

from . import views

app_name = "signatures"

urlpatterns = [
    path("<uuid:document_id>/sign/", views.sign_document_view, name="sign-document"),
    path("<uuid:document_id>/verify/", views.verify_document_view, name="verify-document"),
    path("public-verify/", views.public_verify_document_view, name="public-verify"),
]
