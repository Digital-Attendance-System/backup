
from django.urls import path
from . import views

app_name = 'attendance'

urlpatterns = [
    # Attendance marking
    path('take/', views.get_attendance_form, name='get-attendance-form'),
    path('mark/', views.mark_attendance, name='mark-attendance'),
    path('previous/', views.previous_attendance, name='previous-attendance'),
    
    # Dashboards
    path('dashboard/admin/', views.admin_dashboard, name='admin-dashboard'),
    path('dashboard/teacher/', views.teacher_dashboard, name='teacher-dashboard'),
    
    # Reports
    path('reports/attendance/', views.attendance_report, name='attendance-report'),
    path('reports/class-summary/', views.class_attendance_summary, name='class-summary'),
    path('reports/student-summary/', views.student_attendance_summary, name='student-summary'),
    path('reports/export-csv/', views.export_attendance_csv, name='export-csv'),
    
    # System
    path('system/status/', views.system_status, name='system-status'),
]