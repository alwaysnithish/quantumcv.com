from django.urls import path
from . import views

app_name = 'accounts'

urlpatterns = [
    path('', views.login_view, name='login'),
    path('verify/', views.verify_view, name='verify'),
    path('api/send-otp/', views.send_otp_view, name='send_otp'),
    path('api/verify-otp/', views.verify_otp_view, name='verify_otp'),
    path('api/resend-otp/', views.resend_otp_view, name='resend_otp'),
    path('logout/', views.logout_view, name='logout'),
]
