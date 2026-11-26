from django.urls import path
from . import views

app_name = 'resume'

urlpatterns = [
    path('dashboard/', views.dashboard, name='dashboard'),
    path('builder/', views.builder, name='builder_new'),
    path('builder/<uuid:resume_id>/', views.builder, name='builder'),

    # API
    path('api/create/', views.create_resume, name='create'),
    path('api/save/<uuid:resume_id>/', views.save_resume, name='save'),
    path('api/delete/<uuid:resume_id>/', views.delete_resume, name='delete'),
    path('api/generate/', views.generate_resume_view, name='generate'),
    path('api/enhance-bullet/', views.enhance_bullet_view, name='enhance_bullet'),
    path('api/export/<uuid:resume_id>/', views.export_pdf, name='export_pdf'),
    path('api/versions/<uuid:resume_id>/', views.version_history, name='versions'),
    path('api/restore/<uuid:resume_id>/<int:version_id>/', views.restore_version, name='restore'),
]
