# Backend/attendance/views.py
# Attendance marking and dashboard views

from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Q, Avg
from django.utils import timezone
from datetime import datetime, timedelta, date
from collections import defaultdict

from .models import (
    AttendanceRecord,
    AttendanceSubmission,
    AttendanceSummary,
    SystemStatus,
    FlaggedAbsence
)
from .serializers import (
    AttendanceRecordSerializer,
    BulkAttendanceSerializer,
    AttendanceSubmissionSerializer,
    SystemStatusSerializer,
    FlaggedAbsenceSerializer
)
from students.models import Student, Class, Teacher
from students.serializers import StudentListSerializer, ClassSerializer

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Count, Q, Avg
from django.utils import timezone
from datetime import datetime, timedelta
from students.models import Student, Class
from .models import AttendanceRecord
import csv
from django.http import HttpResponse

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def attendance_report(request):
    """
    GET /api/reports/attendance/
    
    Query params:
    - start_date: YYYY-MM-DD
    - end_date: YYYY-MM-DD
    - class_id: integer
    - student_id: integer
    - status: present/absent/late/excused
    """
    # Get filters from query params
    start_date = request.query_params.get('start_date')
    end_date = request.query_params.get('end_date')
    class_id = request.query_params.get('class_id')
    student_id = request.query_params.get('student_id')
    status_filter = request.query_params.get('status')
    
    # Base queryset
    records = AttendanceRecord.objects.select_related('student', 'class_name', 'marked_by').all()
    
    # Apply filters
    if start_date:
        records = records.filter(date__gte=start_date)
    if end_date:
        records = records.filter(date__lte=end_date)
    if class_id:
        records = records.filter(class_name_id=class_id)
    if student_id:
        records = records.filter(student_id=student_id)
    if status_filter:
        records = records.filter(status=status_filter)
    
    # Get summary statistics
    total_records = records.count()
    
    status_breakdown = records.values('status').annotate(count=Count('id'))
    
    present_count = records.filter(status='present').count()
    absent_count = records.filter(status='absent').count()
    late_count = records.filter(status='late').count()
    excused_count = records.filter(status='excused').count()
    
    attendance_rate = (present_count / total_records * 100) if total_records > 0 else 0
    
    # Serialize records
    records_data = []
    for record in records[:100]:  # Limit to 100 for performance
        records_data.append({
            'id': record.id,
            'student': {
                'id': record.student.id,
                'name': record.student.full_name,
                'admission_number': record.student.admission_number,
            },
            'class': {
                'id': record.class_name.id if record.class_name else None,
                'name': record.class_name.display_name if record.class_name else None,
            },
            'date': record.date,
            'status': record.status,
            'marked_by': record.marked_by.get_full_name() if record.marked_by else None,
            'marked_at': record.marked_at,
            'notes': record.notes,
        })
    
    return Response({
        'success': True,
        'data': {
            'summary': {
                'total_records': total_records,
                'present': present_count,
                'absent': absent_count,
                'late': late_count,
                'excused': excused_count,
                'attendance_rate': round(attendance_rate, 2),
            },
            'records': records_data,
            'has_more': total_records > 100,
        }
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def class_attendance_summary(request):
    """
    GET /api/reports/class-summary/
    
    Query params:
    - start_date: YYYY-MM-DD
    - end_date: YYYY-MM-DD
    """
    start_date = request.query_params.get('start_date')
    end_date = request.query_params.get('end_date')
    
    # Get all classes
    classes = Class.objects.all()
    
    summary_data = []
    
    for cls in classes:
        # Get attendance records for this class
        records = AttendanceRecord.objects.filter(class_name=cls)
        
        if start_date:
            records = records.filter(date__gte=start_date)
        if end_date:
            records = records.filter(date__lte=end_date)
        
        total = records.count()
        present = records.filter(status='present').count()
        absent = records.filter(status='absent').count()
        late = records.filter(status='late').count()
        
        attendance_rate = (present / total * 100) if total > 0 else 0
        
        summary_data.append({
            'class_id': cls.id,
            'class_name': cls.display_name,
            'grade_level': cls.grade_level,
            'total_students': cls.student_count,
            'total_records': total,
            'present': present,
            'absent': absent,
            'late': late,
            'attendance_rate': round(attendance_rate, 2),
        })
    
    return Response({
        'success': True,
        'data': summary_data
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def student_attendance_summary(request):
    """
    GET /api/reports/student-summary/
    
    Query params:
    - start_date: YYYY-MM-DD
    - end_date: YYYY-MM-DD
    - class_id: integer
    """
    start_date = request.query_params.get('start_date')
    end_date = request.query_params.get('end_date')
    class_id = request.query_params.get('class_id')
    
    # Get students
    students = Student.objects.filter(is_active=True)
    
    if class_id:
        students = students.filter(current_class_id=class_id)
    
    summary_data = []
    
    for student in students:
        # Get attendance records
        records = AttendanceRecord.objects.filter(student=student)
        
        if start_date:
            records = records.filter(date__gte=start_date)
        if end_date:
            records = records.filter(date__lte=end_date)
        
        total = records.count()
        present = records.filter(status='present').count()
        absent = records.filter(status='absent').count()
        late = records.filter(status='late').count()
        excused = records.filter(status='excused').count()
        
        attendance_rate = (present / total * 100) if total > 0 else 0
        
        summary_data.append({
            'student_id': student.id,
            'student_name': student.full_name,
            'admission_number': student.admission_number,
            'class': student.current_class.display_name if student.current_class else None,
            'total_days': total,
            'present': present,
            'absent': absent,
            'late': late,
            'excused': excused,
            'attendance_rate': round(attendance_rate, 2),
        })
    
    # Sort by attendance rate (lowest first)
    summary_data.sort(key=lambda x: x['attendance_rate'])
    
    return Response({
        'success': True,
        'data': summary_data
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_attendance_csv(request):
    """
    GET /api/reports/export-csv/
    
    Export attendance report as CSV
    """
    start_date = request.query_params.get('start_date')
    end_date = request.query_params.get('end_date')
    class_id = request.query_params.get('class_id')
    
    # Get records
    records = AttendanceRecord.objects.select_related('student', 'class_name', 'marked_by').all()
    
    if start_date:
        records = records.filter(date__gte=start_date)
    if end_date:
        records = records.filter(date__lte=end_date)
    if class_id:
        records = records.filter(class_name_id=class_id)
    
    # Create CSV
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = 'attachment; filename="attendance_report.csv"'
    
    writer = csv.writer(response)
    writer.writerow([
        'Date', 
        'Admission Number', 
        'Student Name', 
        'Class', 
        'Status', 
        'Marked By', 
        'Time', 
        'Notes'
    ])
    
    for record in records:
        writer.writerow([
            record.date,
            record.student.admission_number,
            record.student.full_name,
            record.class_name.display_name if record.class_name else '',
            record.status.upper(),
            record.marked_by.get_full_name() if record.marked_by else '',
            record.marked_at.strftime('%I:%M %p'),
            record.notes or '',
        ])
    
    return response


# ==================== ATTENDANCE MARKING ====================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_attendance_form(request):
    """
    GET /api/attendance/take/
    
    Get form data for taking attendance
    Query params: ?class_id=1&date=2023-10-24
    """
    class_id = request.query_params.get('class_id')
    attendance_date = request.query_params.get('date', str(date.today()))
    
    if not class_id:
        return Response(
            {
                'success': False,
                'error': 'class_id is required'
            },
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        class_obj = Class.objects.get(pk=class_id)
    except Class.DoesNotExist:
        return Response(
            {
                'success': False,
                'error': 'Class not found'
            },
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Get all students in the class
    students = Student.objects.filter(
        current_class=class_obj,
        is_active=True
    ).order_by('first_name', 'last_name')
    
    # Get existing attendance records for this date
    existing_records = AttendanceRecord.objects.filter(
        class_session=class_obj,
        date=attendance_date
    ).select_related('student')
    
    # Create a dict of student_id -> attendance_status
    attendance_dict = {
        record.student.id: record.status 
        for record in existing_records
    }
    
    # Build student list with attendance status
    students_data = []
    present_count = 0
    absent_count = 0
    
    for student in students:
        attendance_status = attendance_dict.get(student.id, None)
        
        students_data.append({
            'id': student.id,
            'admission_number': student.admission_number,
            'full_name': student.full_name,
            'photo_url': student.photo.url if student.photo else None,
            'attendance_status': attendance_status
        })
        
        if attendance_status == 'P':
            present_count += 1
        elif attendance_status == 'A':
            absent_count += 1
    
    total_students = students.count()
    
    return Response(
        {
            'success': True,
            'data': {
                'class': {
                    'id': class_obj.id,
                    'name': class_obj.get_display_name(),
                    'total_students': total_students
                },
                'date': attendance_date,
                'students': students_data,
                'summary': {
                    'total': total_students,
                    'present': present_count,
                    'absent': absent_count
                }
            }
        },
        status=status.HTTP_200_OK
    )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_attendance(request):
    """
    POST /api/attendance/mark/
    
    Mark attendance for multiple students
    Body: {
        "class_id": 1,
        "date": "2023-10-24",
        "attendance": [
            {"student_id": 1, "status": "P"},
            {"student_id": 2, "status": "A"},
            ...
        ]
    }
    """
    serializer = BulkAttendanceSerializer(data=request.data)
    
    if not serializer.is_valid():
        return Response(
            {
                'success': False,
                'error': 'Validation failed',
                'details': serializer.errors
            },
            status=status.HTTP_400_BAD_REQUEST
        )
    
    class_id = serializer.validated_data['class_id']
    attendance_date = serializer.validated_data['date']
    attendance_list = serializer.validated_data['attendance']
    marked_by_id = serializer.validated_data.get('marked_by')
    
    try:
        class_obj = Class.objects.get(pk=class_id)
        marked_by = Teacher.objects.get(pk=marked_by_id) if marked_by_id else None
    except (Class.DoesNotExist, Teacher.DoesNotExist) as e:
        return Response(
            {
                'success': False,
                'error': str(e)
            },
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Create or update attendance records
    created_count = 0
    updated_count = 0
    present_count = 0
    absent_count = 0
    late_count = 0
    excused_count = 0
    
    for item in attendance_list:
        student_id = item['student_id']
        attendance_status = item['status']
        
        try:
            student = Student.objects.get(pk=student_id)
        except Student.DoesNotExist:
            continue
        
        # Create or update record
        record, created = AttendanceRecord.objects.update_or_create(
            student=student,
            date=attendance_date,
            defaults={
                'class_session': class_obj,
                'status': attendance_status,
                'marked_by': marked_by
            }
        )
        
        if created:
            created_count += 1
        else:
            updated_count += 1
        
        # Count statuses
        if attendance_status == 'P':
            present_count += 1
        elif attendance_status == 'A':
            absent_count += 1
        elif attendance_status == 'L':
            late_count += 1
        elif attendance_status == 'E':
            excused_count += 1
    
    total_students = len(attendance_list)
    
    # Create or update submission record
    if marked_by:
        submission, _ = AttendanceSubmission.objects.update_or_create(
            teacher=marked_by,
            class_session=class_obj,
            date=attendance_date,
            defaults={
                'total_students': total_students,
                'present_count': present_count,
                'absent_count': absent_count,
                'late_count': late_count,
                'excused_count': excused_count,
                'status': 'completed'
            }
        )
    
    return Response(
        {
            'success': True,
            'message': f'Attendance saved successfully. Created: {created_count}, Updated: {updated_count}',
            'summary': {
                'total': total_students,
                'present': present_count,
                'absent': absent_count,
                'late': late_count,
                'excused': excused_count
            }
        },
        status=status.HTTP_200_OK
    )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def previous_attendance(request):
    """
    GET /api/attendance/previous/
    
    Get previous attendance records for a class
    Query params: ?class_id=1&limit=10
    """
    class_id = request.query_params.get('class_id')
    limit = int(request.query_params.get('limit', 10))
    
    if not class_id:
        return Response(
            {
                'success': False,
                'error': 'class_id is required'
            },
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        class_obj = Class.objects.get(pk=class_id)
    except Class.DoesNotExist:
        return Response(
            {
                'success': False,
                'error': 'Class not found'
            },
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Get unique dates when attendance was taken
    submissions = AttendanceSubmission.objects.filter(
        class_session=class_obj
    ).order_by('-date')[:limit]
    
    previous_records = []
    for submission in submissions:
        previous_records.append({
            'date': submission.date,
            'present': submission.present_count,
            'absent': submission.absent_count,
            'total': submission.total_students,
            'percentage': submission.attendance_percentage
        })
    
    return Response(
        {
            'success': True,
            'data': previous_records
        },
        status=status.HTTP_200_OK
    )


# ==================== DASHBOARD APIS ====================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_dashboard(request):
    """
    GET /api/dashboard/admin/
    
    Get admin dashboard statistics and data
    """
    today = date.today()
    
    # Total students
    total_students = Student.objects.filter(is_active=True).count()
    
    # Today's attendance
    todays_records = AttendanceRecord.objects.filter(date=today)
    total_marked = todays_records.count()
    present_today = todays_records.filter(status='P').count()
    absent_today = todays_records.filter(status='A').count()
    
    if total_marked > 0:
        todays_attendance_percentage = round((present_today / total_marked) * 100, 1)
    else:
        todays_attendance_percentage = 0
    
    # Active classes
    active_classes = Class.objects.filter(
        academic_year='2025-2026'  # TODO: Make this dynamic
    ).count()
    
    # Weekly attendance trend (last 7 days)
    weekly_trend = []
    for i in range(6, -1, -1):
        day = today - timedelta(days=i)
        records = AttendanceRecord.objects.filter(date=day)
        total = records.count()
        present = records.filter(status='P').count()
        
        percentage = round((present / total) * 100, 1) if total > 0 else 0
        
        weekly_trend.append({
            'day': day.strftime('%a').upper(),
            'date': day,
            'percentage': percentage
        })
    
    # Staff performance (recent submissions)
    recent_submissions = AttendanceSubmission.objects.filter(
        date__gte=today - timedelta(days=7)
    ).select_related('teacher', 'class_session').order_by('-submitted_at')[:10]
    
    submissions_data = []
    for sub in recent_submissions:
        submissions_data.append({
            'teacher': sub.teacher.full_name,
            'class_name': sub.class_session.name,
            'submission_time': sub.submission_time,
            'present': sub.present_count,
            'total': sub.total_students,
            'status': sub.status
        })
    
    # Staff performance summary
    staff_performance = []
    teachers = Teacher.objects.filter(is_active=True)[:5]
    for teacher in teachers:
        submissions_count = AttendanceSubmission.objects.filter(
            teacher=teacher,
            date__gte=today - timedelta(days=30)
        ).count()
        
        main_class = teacher.get_main_class()
        
        staff_performance.append({
            'teacher': teacher.full_name,
            'grade': main_class.name if main_class else 'N/A',
            'submission_status': f'{submissions_count} submissions',
            'status': 'completed' if submissions_count > 20 else 'pending'
        })
    
    return Response(
        {
            'success': True,
            'data': {
                'school_name': 'Maplewood Primary School',  # TODO: Get from settings
                'statistics': {
                    'total_students': total_students,
                    'students_change_percentage': 2,  # TODO: Calculate actual change
                    'todays_attendance': {
                        'percentage': todays_attendance_percentage,
                        'status': 'active' if todays_attendance_percentage >= 90 else 'warning'
                    },
                    'active_classes': active_classes,
                    'total_absentees_today': absent_today,
                    'alert': absent_today > 20
                },
                'weekly_attendance_trend': weekly_trend,
                'staff_performance': staff_performance,
                'recent_submissions': submissions_data
            }
        },
        status=status.HTTP_200_OK
    )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def teacher_dashboard(request):
    """
    GET /api/dashboard/teacher/
    
    Get teacher dashboard data
    """
    # TODO: Get teacher from authenticated user
    teacher_id = request.query_params.get('teacher_id')
    
    if not teacher_id:
        return Response(
            {
                'success': False,
                'error': 'teacher_id is required'
            },
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        teacher = Teacher.objects.get(pk=teacher_id)
    except Teacher.DoesNotExist:
        return Response(
            {
                'success': False,
                'error': 'Teacher not found'
            },
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Get assigned classes
    assigned_classes = teacher.classes.all()
    classes_data = ClassSerializer(assigned_classes, many=True).data
    
    # Get today's tasks (classes that need attendance)
    today = date.today()
    todays_tasks = []
    
    for class_obj in assigned_classes:
        submission = AttendanceSubmission.objects.filter(
            teacher=teacher,
            class_session=class_obj,
            date=today
        ).first()
        
        todays_tasks.append({
            'class': ClassSerializer(class_obj).data,
            'status': 'completed' if submission else 'pending'
        })
    
    return Response(
        {
            'success': True,
            'data': {
                'assigned_classes': classes_data,
                'todays_tasks': todays_tasks
            }
        },
        status=status.HTTP_200_OK
    )


# ==================== REPORTS ====================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def attendance_report(request):
    """
    GET /api/reports/attendance-summary/
    
    Get attendance report with statistics
    Query params: ?start_date=2023-10-01&end_date=2023-10-31&grade_level=all
    """
    start_date = request.query_params.get('start_date')
    end_date = request.query_params.get('end_date')
    grade_level = request.query_params.get('grade_level', 'all')
    
    if not start_date or not end_date:
        # Default to last 30 days
        end_date = date.today()
        start_date = end_date - timedelta(days=30)
    else:
        start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
        end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
    
    # Get all attendance records in date range
    records_query = AttendanceRecord.objects.filter(
        date__range=[start_date, end_date]
    )
    
    if grade_level != 'all':
        records_query = records_query.filter(
            class_session__grade_level=grade_level
        )
    
    total_records = records_query.count()
    present_records = records_query.filter(status='P').count()
    
    avg_attendance = round((present_records / total_records) * 100, 2) if total_records > 0 else 0
    
    # Flagged absences
    flagged_count = FlaggedAbsence.objects.filter(is_resolved=False).count()
    
    # Attendance trends (daily average)
    trends = []
    current_date = start_date
    while current_date <= end_date:
        day_records = records_query.filter(date=current_date)
        day_total = day_records.count()
        day_present = day_records.filter(status='P').count()
        
        percentage = round((day_present / day_total) * 100, 1) if day_total > 0 else 0
        
        trends.append({
            'date': current_date,
            'percentage': percentage
        })
        
        current_date += timedelta(days=1)
    
    # Attendance by grade
    attendance_by_grade = []
    grades = Class.objects.values_list('grade_level', flat=True).distinct()
    
    for grade in grades:
        grade_records = records_query.filter(class_session__grade_level=grade)
        grade_absent = grade_records.filter(status='A').count()
        
        attendance_by_grade.append({
            'grade': f'Grade {grade}',
            'absences': grade_absent,
            'percentage': 25  # Mock percentage
        })
    
    # Classroom performance
    classroom_performance = []
    classes = Class.objects.all()[:10]
    
    for class_obj in classes:
        class_records = records_query.filter(class_session=class_obj)
        class_total = class_records.count()
        class_present = class_records.filter(status='P').count()
        
        percentage = round((class_present / class_total) * 100, 1) if class_total > 0 else 0
        
        # Determine status
        if percentage >= 95:
            status_label = 'exemplary'
        elif percentage >= 85:
            status_label = 'on_track'
        else:
            status_label = 'review_needed'
        
        classroom_performance.append({
            'classroom': class_obj.name,
            'teacher': class_obj.class_teacher.full_name if class_obj.class_teacher else 'N/A',
            'students': class_obj.student_count,
            'attendance_percentage': percentage,
            'status': status_label
        })
    
    return Response(
        {
            'success': True,
            'data': {
                'total_students': Student.objects.filter(is_active=True).count(),
                'avg_attendance': avg_attendance,
                'flagged_absences': flagged_count,
                'attendance_trends': trends,
                'attendance_by_grade': attendance_by_grade,
                'classroom_performance': classroom_performance
            }
        },
        status=status.HTTP_200_OK
    )


# ==================== SYSTEM STATUS ====================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def system_status(request):
    """
    GET /api/system/status/
    
    Get current system status
    """
    status_obj = SystemStatus.get_current_status()
    
    if status_obj:
        serializer = SystemStatusSerializer(status_obj)
        return Response(
            {
                'success': True,
                'data': serializer.data
            },
            status=status.HTTP_200_OK
        )
    else:
        # Default status
        return Response(
            {
                'success': True,
                'data': {
                    'status': 'operational',
                    'message': 'All systems operational'
                }
            },
            status=status.HTTP_200_OK
        )