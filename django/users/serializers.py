from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = [
            "email",
            "password",
            "first_name",
            "middle_name",
            "last_name",
            "phone_number",
        ]

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(read_only=True)
    document_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "first_name",
            "middle_name",
            "last_name",
            "phone_number",
            "full_name",
            "is_staff",
            "is_active",
            "date_joined",
            "last_login",
            "document_count",
        ]


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        email = attrs.get("email", "")
        password = attrs.get("password", "")

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError(
                "Invalid email or password. Please try again."
            )

        if not user.check_password(password):
            raise serializers.ValidationError(
                "Invalid email or password. Please try again."
            )

        if not user.is_active:
            raise serializers.ValidationError("This account has been deactivated.")

        user.last_login = timezone.now()
        user.save(update_fields=["last_login"])
        refresh = RefreshToken.for_user(user)

        return {
            "refresh": str(refresh),
            "access": str(refresh.access_token),
        }
