# Backend/attendance/reports_urls.py
# URL configuration for reports endpoints

from django.urls import path
from . import views

app_name = 'reports'

urlpatterns = [
    path('attendance/', views.attendance_report, name='attendance-report'),
    path('class-summary/', views.class_attendance_summary, name='class-summary'),
    path('student-summary/', views.student_attendance_summary, name='student-summary'),
    path('export-csv/', views.export_attendance_csv, name='export-csv'),
]
