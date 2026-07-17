from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .admin_views import AdminUserListView, AdminUserToggleStatusView
from .views import CustomTokenObtainPairView, LogoutView, MeView, RegisterView

urlpatterns = [
    path("auth/register/", RegisterView.as_view(), name="register"),
    path("auth/login/", CustomTokenObtainPairView.as_view(), name="login"),
    path("auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("auth/logout/", LogoutView.as_view(), name="logout"),
    path("auth/me/", MeView.as_view(), name="me"),

    path("admin/list/", AdminUserListView.as_view(), name="admin-users-list"),
    path("admin/<uuid:user_id>/toggle-status/", AdminUserToggleStatusView.as_view(), name="admin-user-toggle-status"),
]
