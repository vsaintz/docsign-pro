from datetime import timedelta

from django.db.models import Count, Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.generics import ListAPIView
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import CustomUser
from .serializers import UserSerializer


class UserStatsPagination(PageNumberPagination):
    page_size = 10
    def get_paginated_response(self, data):
        now = timezone.now()
        seven_days_ago = now - timedelta(days=7)
        total_active = CustomUser.objects.filter(is_active=True).count()
        total_staff = CustomUser.objects.filter(is_staff=True).count()
        active_users = CustomUser.objects.filter(last_login__gte=seven_days_ago).count()

        return Response({
            'count': self.page.paginator.count,
            'total_active': total_active,
            'total_staff': total_staff,
            "activeUsers7d": active_users,
            'next': self.get_next_link(),
            'previous': self.get_previous_link(),
            'results': data
        })

class AdminUserListView(ListAPIView):
    permission_classes = [IsAdminUser]
    serializer_class = UserSerializer
    pagination_class = UserStatsPagination

    def get_queryset(self):
        queryset = CustomUser.objects.annotate(
          document_count=Count('documents')
        ).order_by('-date_joined')
        search_query = self.request.query_params.get('search', '').strip()
        if search_query:
            parts = search_query.split()
            if len(parts) == 2:
                queryset = queryset.filter(
                    (Q(first_name__icontains=parts[0]) & Q(last_name__icontains=parts[1])) |
                    Q(email__icontains=search_query)
                )
            else:
                queryset = queryset.filter(
                    Q(email__icontains=search_query) |
                    Q(first_name__icontains=search_query) |
                    Q(last_name__icontains=search_query)
                    )

        role_filter = self.request.query_params.get('role', 'all')
        if role_filter == 'admin':
            queryset = queryset.filter(is_staff=True)
        elif role_filter == 'user':
            queryset = queryset.filter(is_staff=False)

        status_filter = self.request.query_params.get('status', 'all')
        if status_filter == 'active':
            queryset = queryset.filter(is_active=True, last_login__isnull=False)
        elif status_filter == 'inactive':
            queryset = queryset.filter(is_active=False)
        elif status_filter == 'pending':
            queryset = queryset.filter(is_active=True, last_login__isnull=True)

        return queryset

class AdminUserToggleStatusView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request, user_id):
        user = get_object_or_404(CustomUser, id=user_id)
        if user == request.user:
            return Response(
                {"error": "You cannot deactivate your own admin account."},
                status=status.HTTP_400_BAD_REQUEST
            )
        is_active = request.data.get('is_active', True)
        user.is_active = is_active
        user.save()

        action = 'reactivated' if is_active else 'deactivated'
        return Response({"message": f"User successfully {action}."})
