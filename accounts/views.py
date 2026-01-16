from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import login, authenticate, logout
from django.contrib.auth.models import User
from django.contrib import messages
from agendas.models import Collaborator

def signup_view(request):
    """Handle user signup via phone number."""
    if request.method == 'POST':
        name = request.POST.get('name')
        phone = request.POST.get('phone')
        password = request.POST.get('password')
        
        # Check if user already exists
        if User.objects.filter(username=phone).exists():
            messages.error(request, 'Account with this phone number already exists.')
            return redirect('signup')
            
        # Create User - INACTIVE by default
        user = User.objects.create_user(username=phone, password=password)
        user.first_name = name
        user.is_active = False # Require approval
        user.save()
        
        # Link or Create Collaborator Profile
        try:
            collaborator = Collaborator.objects.get(whatsapp_number=phone)
            collaborator.user = user
            collaborator.name = name 
            collaborator.save()
        except Collaborator.DoesNotExist:
            Collaborator.objects.create(
                user=user,
                name=name,
                whatsapp_number=phone
            )
            
        messages.success(request, 'Account created! Please wait for Dr. Niaz to approve your account.')
        return redirect('login')
        
    return render(request, 'accounts/signup.html')

def login_view(request):
    """Handle login via phone number."""
    if request.method == 'POST':
        phone = request.POST.get('phone')
        password = request.POST.get('password')
        
        # Check if user exists but is inactive
        try:
            user_check = User.objects.get(username=phone)
            if not user_check.is_active and user_check.check_password(password):
                messages.warning(request, 'Your account is pending approval by Dr. Niaz.')
                return render(request, 'accounts/login.html')
        except User.DoesNotExist:
            pass

        user = authenticate(request, username=phone, password=password)
        
        if user is not None:
            login(request, user)
            
            # Redirect based on role
            if user.is_superuser:
                return redirect('dashboard')
            else:
                return redirect('undone_tasks')
        else:
            messages.error(request, 'Invalid phone number or password.')
            
    return render(request, 'accounts/login.html')

def logout_view(request):
    logout(request)
    return redirect('login')
