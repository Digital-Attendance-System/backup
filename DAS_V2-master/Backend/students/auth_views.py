from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from .models import User
from .serializers import UserSerializer


@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def register(request):
    """
    Register a new user
    POST /api/auth/register/
    Body: {
        "username": "teacher1",
        "email": "teacher1@school.com",
        "password": "password123",
        "first_name": "John",
        "last_name": "Doe",
        "role": "teacher"
    }
    """
    username = request.data.get('username')
    email = request.data.get('email')
    password = request.data.get('password')
    first_name = request.data.get('first_name', '')
    last_name = request.data.get('last_name', '')
    role = request.data.get('role', 'student')
    
    # Validation
    if not username or not email or not password:
        return Response(
            {'error': 'Username, email, and password are required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Check if user exists
    if User.objects.filter(username=username).exists():
        return Response(
            {'error': 'Username already exists'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if User.objects.filter(email=email).exists():
        return Response(
            {'error': 'Email already exists'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Create user
    user = User.objects.create_user(
        username=username,
        email=email,
        password=password,
        first_name=first_name,
        last_name=last_name,
        role=role
    )
    
    # Generate tokens
    refresh = RefreshToken.for_user(user)
    
    return Response(
        {
            'message': 'User registered successfully',
            'user': UserSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        },
        status=status.HTTP_201_CREATED
    )


@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def login(request):
    """
    Login user
    POST /api/auth/login/
    """
    email = request.data.get('email')
    password = request.data.get('password')
    
    if not email or not password:
        return Response(
            {'error': 'Email and password are required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Find user by email
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response(
            {'error': 'Invalid credentials'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    except User.MultipleObjectsReturned:
        # This should not happen with unique email constraint, but handle it
        return Response(
            {'error': 'Database error - please contact support'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
    # Authenticate
    user = authenticate(username=user.username, password=password)
    
    if user is None:
        return Response(
            {'error': 'Invalid credentials'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    if not user.is_active:
        return Response(
            {'error': 'Account is disabled'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Generate tokens
    refresh = RefreshToken.for_user(user)
    
    return Response(
        {
            'message': 'Login successful',
            'user': UserSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        },
        status=status.HTTP_200_OK
    )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout(request):
    """
    Logout user (blacklist token if needed)
    POST /api/auth/logout/
    """
    return Response(
        {'message': 'Logout successful'},
        status=status.HTTP_200_OK
    )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_current_user(request):
    """
    Get current authenticated user
    GET /api/auth/me/
    """
    serializer = UserSerializer(request.user)
    return Response(
        {
            'user': serializer.data
        },
        status=status.HTTP_200_OK
    )