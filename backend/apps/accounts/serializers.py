from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework.validators import UniqueValidator
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from apps.notifications.models import Notification


User = get_user_model()


class EmailOrUsernameTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Authentifie un utilisateur avec son email ou son username.

    Le nouveau frontend transmet naturellement l'adresse email dans le champ de
    connexion. SimpleJWT attend normalement `username`; ce serializer fait donc
    la traduction cote backend afin que tous les clients gardent le meme flux.
    """

    def validate(self, attrs):
        login_value = str(attrs.get(self.username_field, "")).strip()
        if login_value:
            user = (
                User.objects.filter(email__iexact=login_value).first()
                or User.objects.filter(username__iexact=login_value).first()
                or User.objects.filter(phone=login_value).first()
            )
            if user:
                attrs[self.username_field] = user.get_username()
        data = super().validate(attrs)
        data["user"] = UserSerializer(self.user, context=self.context).data
        return data


class UserSerializer(serializers.ModelSerializer):
    province_name = serializers.CharField(source="province.name", read_only=True)
    commune_name = serializers.CharField(source="commune.name", read_only=True)

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "role",
            "phone",
            "avatar",
            "organization",
            "address_line",
            "province",
            "province_name",
            "commune",
            "commune_name",
            "is_verified",
            "created_at",
        ]
        read_only_fields = ["id", "role", "is_verified", "created_at", "province_name", "commune_name"]


class RegisterSerializer(serializers.ModelSerializer):
    username = serializers.CharField(
        max_length=150,
        validators=[
            UniqueValidator(
                queryset=User.objects.all(),
                message="Ce nom d'utilisateur est deja utilise.",
            )
        ],
    )
    email = serializers.EmailField(
        validators=[
            UniqueValidator(
                queryset=User.objects.all(),
                message="Un compte existe deja avec cet email.",
            )
        ],
    )
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "phone",
            "address_line",
            "province",
            "commune",
            "password",
            "password_confirm",
        ]
        read_only_fields = ["id"]

    def validate(self, attrs):
        if attrs["password"] != attrs.pop("password_confirm"):
            raise serializers.ValidationError({"password_confirm": "Les mots de passe ne correspondent pas."})
        commune = attrs.get("commune")
        if commune and not attrs.get("province"):
            attrs["province"] = commune.province
        return attrs

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.role = User.Role.CITOYEN
        user.set_password(password)
        user.save()
        Notification.objects.create(
            user=user,
            notification_type=Notification.Type.ACCOUNT_CREATED,
            title="Compte cree",
            message="Votre compte ECO RDC Intelligence est pret.",
        )
        return user


class UserAdminSerializer(UserSerializer):
    """Admin serializer that can create official users with hashed passwords."""
    password = serializers.CharField(write_only=True, required=False, validators=[validate_password])

    class Meta(UserSerializer.Meta):
        fields = UserSerializer.Meta.fields + ["password"]
        read_only_fields = ["id", "created_at", "province_name", "commune_name"]

    def create(self, validated_data):
        password = validated_data.pop("password", None)
        user = User(**validated_data)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)
        for field, value in validated_data.items():
            setattr(instance, field, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance
