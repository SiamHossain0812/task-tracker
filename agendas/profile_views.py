from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from .models import Collaborator
from .serializers import UserSerializer, CollaboratorSerializer

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_profile(request):
    """
    Get the current user's profile information, combining User and Collaborator data.
    """
    user = request.user
    try:
        collaborator = Collaborator.objects.get(user=user)
    except Collaborator.DoesNotExist:
        # Fallback if profile doesn't exist for some reason
        collaborator = Collaborator.objects.create(
            user=user,
            name=f"{user.first_name} {user.last_name}".strip() or user.username,
            email=user.email
        )
    
    return Response({
        'user': UserSerializer(user).data,
        'collaborator': CollaboratorSerializer(collaborator, context={'request': request}).data
    })

@api_view(['POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def update_profile(request):
    """
    Update user and collaborator profile information.
    """
    user = request.user
    try:
        collaborator = Collaborator.objects.get(user=user)
    except Collaborator.DoesNotExist:
        collaborator = Collaborator.objects.create(user=user)

    # Update User fields
    first_name = request.data.get('first_name')
    last_name = request.data.get('last_name')
    email = request.data.get('email')

    if first_name is not None:
        user.first_name = first_name
    if last_name is not None:
        user.last_name = last_name
    if email is not None:
        user.email = email
    user.save()

    # Update Collaborator fields
    name = request.data.get('name')
    institute = request.data.get('institute')
    address = request.data.get('address')
    whatsapp_number = request.data.get('whatsapp_number')
    image = request.FILES.get('image')

    if name:
        collaborator.name = name
    if institute is not None:
        collaborator.institute = institute
    if address is not None:
        collaborator.address = address
    if whatsapp_number is not None:
        collaborator.whatsapp_number = whatsapp_number
    if image:
        collaborator.image = image
    
    collaborator.save()

    return Response({
        'message': 'Profile updated successfully',
        'user': UserSerializer(user).data,
        'collaborator': CollaboratorSerializer(collaborator, context={'request': request}).data
    })

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
    """
    Change user password.
    """
    user = request.user
    old_password = request.data.get('old_password')
    new_password = request.data.get('new_password')
    
    if not old_password or not new_password:
         return Response({'error': 'Both old and new passwords are required.'}, status=status.HTTP_400_BAD_REQUEST)
    
    if not user.check_password(old_password):
        return Response({'error': 'Current password is incorrect.'}, status=status.HTTP_400_BAD_REQUEST)
    
    user.set_password(new_password)
    user.save()
    return Response({'message': 'Password updated successfully.'})
