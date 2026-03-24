# Backend/students/admin.py
# Updated admin configuration with QR Code features

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.utils.html import format_html, mark_safe
from django.urls import path, reverse
from django.shortcuts import redirect
from django.contrib import messages
from django.http import HttpResponse
from django.utils import timezone
from io import BytesIO
from django.core.files.base import ContentFile
import qrcode
import json
import base64
import zipfile

from .models import User, School, Class, Student, Teacher, Grade, Term, Subject, PerformanceRecord


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ['username', 'email', 'role', 'full_name', 'photo_thumbnail', 'is_staff', 'is_active']
    list_filter = ['role', 'is_staff', 'is_active']
    search_fields = ['username', 'email', 'first_name', 'last_name']
    
    fieldsets = UserAdmin.fieldsets + (
        ('Additional Info', {
            'fields': ('role', 'phone', 'photo')
        }),
    )
    
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Additional Info', {
            'fields': ('role', 'phone', 'photo')
        }),
    )
    
    def photo_thumbnail(self, obj):
        if obj.photo:
            return format_html('<img src="{}" width="50" height="50" style="border-radius: 50%;" />', obj.photo.url)
        return "No photo"
    photo_thumbnail.short_description = 'Photo'


@admin.register(School)
class SchoolAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'phone', 'email', 'created_at']
    search_fields = ['name', 'code', 'email']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Class)
class ClassAdmin(admin.ModelAdmin):
    list_display = ['name', 'nickname', 'grade_level', 'section', 'academic_year', 'class_teacher', 'student_count', 'school']
    list_filter = ['grade_level', 'academic_year', 'school']
    search_fields = ['name', 'nickname']
    readonly_fields = ['created_at', 'updated_at', 'student_count']
    
    def student_count(self, obj):
        return obj.student_count
    student_count.short_description = 'Students'


@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    """Enhanced Student Admin with QR Code Generation"""
    
    list_display = [
        'admission_number', 
        'full_name', 
        'photo_thumbnail',
        'email',
        'current_class', 
        'status',
        'qr_code_status',
        'qr_code_actions',
        'is_birthday_today_display',
    ]
    
    list_filter = ['current_class', 'status', 'gender', 'enrollment_date']
    
    search_fields = ['admission_number', 'first_name', 'last_name', 'email', 'parent_name', 'parent_phone']
    
    readonly_fields = [
        'created_at', 
        'updated_at', 
        'age', 
        'is_birthday_today',
        'qr_code_preview',
        'qr_code'
    ]
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('admission_number', 'first_name', 'last_name', 'email', 'photo', 'date_of_birth', 'gender')
        }),
        ('Status', {
            'fields': ('status', 'is_active', 'current_class')
        }),
        ('Parent/Guardian Information', {
            'fields': ('parent_name', 'parent_phone', 'parent_email', 'address')
        }),
        ('QR Code', {
            'fields': ('qr_code_preview', 'qr_code', 'qr_code_image'),
            'classes': ('collapse',)
        }),
        ('Dates', {
            'fields': ('enrollment_date', 'age', 'is_birthday_today')
        }),
        ('System', {
            'fields': ('user', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['generate_qr_codes_bulk', 'download_qr_codes_zip']
    
    def get_fieldsets(self, request, obj=None):
        """Exclude QR Code fieldset when adding new student"""
        fieldsets = super().get_fieldsets(request, obj)
        if obj is None:  # Adding new student
            # Remove QR Code fieldset
            fieldsets = tuple(fs for fs in fieldsets if fs[0] != 'QR Code')
        return fieldsets
    
    def photo_thumbnail(self, obj):
        if obj.photo:
            return format_html('<img src="{}" width="50" height="50" style="border-radius: 50%;" />', obj.photo.url)
        return "No photo"
    photo_thumbnail.short_description = 'Photo'
    
    def is_birthday_today_display(self, obj):
        if obj.is_birthday_today:
            return format_html('<span style="color: green;">🎂 Yes</span>')
        return "No"
    is_birthday_today_display.short_description = 'Birthday Today'
    
    def qr_code_status(self, obj):
        """Display QR code status with color badge"""
        if obj.qr_code and obj.qr_code_image:
            return mark_safe(
                '<span style="background-color: #10b981; color: white; padding: 3px 10px; border-radius: 4px; font-size: 11px; font-weight: bold;">✓ Generated</span>'
            )
        return mark_safe(
            '<span style="background-color: #ef4444; color: white; padding: 3px 10px; border-radius: 4px; font-size: 11px; font-weight: bold;">✗ Not Generated</span>'
        )
    qr_code_status.short_description = 'QR Status'
    
    def qr_code_actions(self, obj):
        """Action buttons for QR code"""
        # Don't show actions if object hasn't been saved yet
        if not obj.pk:
            return mark_safe('<span style="color: #999; font-size: 11px;">Save student first</span>')
        
        if obj.qr_code and obj.qr_code_image:
            return format_html(
                '<a class="button" href="{}" target="_blank" style="background-color: #3b82f6; color: white; padding: 5px 10px; text-decoration: none; border-radius: 4px; margin-right: 5px; font-size: 11px;">👁 View</a>'
                '<a class="button" href="{}" style="background-color: #10b981; color: white; padding: 5px 10px; text-decoration: none; border-radius: 4px; margin-right: 5px; font-size: 11px;">🔄 Regen</a>'
                '<a class="button" href="{}" style="background-color: #8b5cf6; color: white; padding: 5px 10px; text-decoration: none; border-radius: 4px; font-size: 11px;">⬇ Download</a>',
                obj.qr_code_image.url if obj.qr_code_image else '#',
                reverse('admin:generate_student_qr', args=[obj.pk]),
                reverse('admin:download_student_qr', args=[obj.pk])
            )
        else:
            return format_html(
                '<a class="button" href="{}" style="background-color: #10b981; color: white; padding: 5px 10px; text-decoration: none; border-radius: 4px; font-size: 11px;">⚡ Generate QR</a>',
                reverse('admin:generate_student_qr', args=[obj.pk])
            )
         
    qr_code_actions.short_description = 'QR Actions'
    
    def qr_code_preview(self, obj):
        """Display QR code image in admin detail page"""
        # Don't show preview if object hasn't been saved yet
        if not obj.pk:
            return mark_safe(
                '<div style="text-align: center; padding: 30px; background: #f0fdf4; border-radius: 8px; border: 2px dashed #86efac;">'
                '<p style="color: #166534; font-size: 14px;">💾 Save the student first to generate QR codes</p>'
                '</div>'
            )
        if obj.qr_code_image:
            return format_html(
                '<div style="text-align: center; padding: 20px; background: #f9fafb; border-radius: 8px;">'
                '<img src="{}" style="max-width: 250px; border: 4px solid #3b82f6; padding: 15px; border-radius: 12px; background: white;"/>'
                '<p style="margin-top: 15px; font-weight: bold; font-size: 16px; color: #111;">{}</p>'
                '<p style="color: #666; font-size: 14px; margin: 5px 0;">{}</p>'
                '<p style="color: #999; font-size: 12px;">{}</p>'
                '<div style="margin-top: 15px;">'
                '<a href="{}" class="button" style="background-color: #8b5cf6; color: white; padding: 8px 16px; text-decoration: none; border-radius: 6px; margin-right: 10px;">⬇ Download QR</a>'
                '<a href="{}" class="button" style="background-color: #10b981; color: white; padding: 8px 16px; text-decoration: none; border-radius: 6px;">🔄 Regenerate</a>'
                '</div>'
                '</div>',
                obj.qr_code_image.url,
                obj.full_name,
                obj.admission_number,
                obj.current_class.display_name if obj.current_class else 'No Class',
                reverse('admin:download_student_qr', args=[obj.pk]),
                reverse('admin:generate_student_qr', args=[obj.pk])
            )
        return format_html(
            '<div style="text-align: center; padding: 30px; background: #fef3c7; border-radius: 8px; border: 2px dashed #f59e0b;">'
            '<p style="color: #92400e; font-size: 14px; margin-bottom: 15px;">⚠️ QR code not generated yet</p>'
            '<a href="{}" class="button" style="background-color: #10b981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold;">⚡ Generate QR Code Now</a>'
            '</div>',
            reverse('admin:generate_student_qr', args=[obj.pk])
        )
    qr_code_preview.short_description = 'QR Code Preview'
    
    def generate_qr_codes_bulk(self, request, queryset):
        """Bulk action to generate QR codes for selected students"""
        count = 0
        errors = 0
        
        for student in queryset:
            if self._generate_qr_for_student(student):
                count += 1
            else:
                errors += 1
        
        if count > 0:
            self.message_user(
                request,
                f'✅ Successfully generated QR codes for {count} student(s).',
                messages.SUCCESS
            )
        
        if errors > 0:
            self.message_user(
                request,
                f'⚠️ Failed to generate QR codes for {errors} student(s).',
                messages.WARNING
            )
    generate_qr_codes_bulk.short_description = "⚡ Generate QR Codes for selected students"
    
    def download_qr_codes_zip(self, request, queryset):
        """Bulk download QR codes as ZIP file"""
        # Filter students that have QR codes
        students_with_qr = queryset.filter(qr_code_image__isnull=False).exclude(qr_code_image='')
        
        if not students_with_qr.exists():
            self.message_user(
                request,
                '⚠️ No students with QR codes found in selection.',
                messages.WARNING
            )
            return
        
        # Create ZIP file in memory
        zip_buffer = BytesIO()
        
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            for student in students_with_qr:
                try:
                    # Read QR image
                    qr_image = student.qr_code_image.read()
                    
                    # Add to ZIP with proper filename
                    filename = f'{student.admission_number}_{student.full_name.replace(" ", "_")}.png'
                    zip_file.writestr(filename, qr_image)
                except Exception as e:
                    print(f"Error adding {student.full_name} to ZIP: {e}")
        
        # Prepare HTTP response
        zip_buffer.seek(0)
        response = HttpResponse(zip_buffer.read(), content_type='application/zip')
        response['Content-Disposition'] = 'attachment; filename="student_qr_codes.zip"'
        
        self.message_user(
            request,
            f'✅ Downloaded {students_with_qr.count()} QR code(s) as ZIP file.',
            messages.SUCCESS
        )
        
        return response
    download_qr_codes_zip.short_description = "📦 Download QR Codes as ZIP"
    
    def get_urls(self):
        """Add custom URLs for QR code generation and download"""
        urls = super().get_urls()
        custom_urls = [
            path(
                '<int:student_id>/generate-qr/',
                self.admin_site.admin_view(self.generate_qr_view),
                name='generate_student_qr',
            ),
            path(
                '<int:student_id>/download-qr/',
                self.admin_site.admin_view(self.download_qr_view),
                name='download_student_qr',
            ),
        ]
        return custom_urls + urls
    
    def generate_qr_view(self, request, student_id):
        """View to generate/regenerate QR code for a student"""
        try:
            student = Student.objects.get(pk=student_id)
            
            if self._generate_qr_for_student(student):
                messages.success(
                    request, 
                    f'✅ QR code generated successfully for {student.full_name}!'
                )
            else:
                messages.error(
                    request, 
                    f'❌ Failed to generate QR code for {student.full_name}.'
                )
        except Student.DoesNotExist:
            messages.error(request, '❌ Student not found.')
        
        return redirect('admin:students_student_change', student_id)
    
    def download_qr_view(self, request, student_id):
        """View to download QR code as PNG file"""
        try:
            student = Student.objects.get(pk=student_id)
            
            if not student.qr_code_image:
                messages.error(request, '⚠️ QR code not generated yet. Please generate it first.')
                return redirect('admin:students_student_change', student_id)
            
            # Prepare download response
            response = HttpResponse(student.qr_code_image.read(), content_type='image/png')
            response['Content-Disposition'] = f'attachment; filename="{student.admission_number}_QR.png"'
            
            return response
            
        except Student.DoesNotExist:
            messages.error(request, '❌ Student not found.')
            return redirect('admin:students_student_changelist')
    
    def _generate_qr_for_student(self, student):
        """Helper method to generate QR code for a student"""
        try:
            # Create QR data payload
            qr_data = {
                'student_id': student.id,
                'admission_number': student.admission_number,
                'timestamp': str(timezone.now())
            }
            
            # Convert to JSON and encode to base64
            qr_string = json.dumps(qr_data)
            encrypted_data = base64.b64encode(qr_string.encode()).decode()
            
            # Generate QR code image
            qr = qrcode.QRCode(
                version=1,
                error_correction=qrcode.constants.ERROR_CORRECT_L,
                box_size=10,
                border=4,
            )
            qr.add_data(encrypted_data)
            qr.make(fit=True)
            
            # Create image
            img = qr.make_image(fill_color="black", back_color="white")
            
            # Save to BytesIO buffer
            buffer = BytesIO()
            img.save(buffer, format='PNG')
            buffer.seek(0)
            
            # Save to student model
            file_name = f'qr_{student.admission_number}.png'
            student.qr_code = encrypted_data
            student.qr_code_image.save(file_name, ContentFile(buffer.read()), save=False)
            student.save()
            
            # Verify it saved
            student.refresh_from_db()
            print(f"✅ QR Generated: {student.full_name} - {student.qr_code_image.name}")
            
            return True
            
        except Exception as e:
            print(f"❌ Error generating QR for {student.full_name}: {e}")
            import traceback
            traceback.print_exc()
            return False


@admin.register(Teacher)
class TeacherAdmin(admin.ModelAdmin):
    list_display = [
        'employee_id', 
        'full_name',
        'photo_thumbnail',
        'email', 
        'phone',
        'assigned_classes_count',
        'is_active'
    ]
    list_filter = ['is_active', 'subject_specialization']
    search_fields = ['employee_id', 'first_name', 'last_name', 'email']
    filter_horizontal = ['classes']
    readonly_fields = ['created_at', 'updated_at', 'assigned_classes_count']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('employee_id', 'first_name', 'last_name', 'email', 'phone', 'photo')
        }),
        ('Professional Information', {
            'fields': ('subject_specialization', 'classes', 'assigned_classes_count')
        }),
        ('Account', {
            'fields': ('user', 'is_active')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def photo_thumbnail(self, obj):
        if obj.photo:
            return format_html('<img src="{}" width="50" height="50" style="border-radius: 50%;" />', obj.photo.url)
        return "No photo"
    photo_thumbnail.short_description = 'Photo'


# Register other models if they exist
try:
    @admin.register(Grade)
    class GradeAdmin(admin.ModelAdmin):
        list_display = ['name', 'level', 'school_year', 'school', 'is_active']
        list_filter = ['school_year', 'is_active']
        search_fields = ['name']
except:
    pass

try:
    @admin.register(Term)
    class TermAdmin(admin.ModelAdmin):
        list_display = ['name', 'term_number', 'grade', 'start_date', 'end_date', 'is_current', 'is_active']
        list_filter = ['grade', 'is_active']
        search_fields = ['name']
except:
    pass

try:
    @admin.register(Subject)
    class SubjectAdmin(admin.ModelAdmin):
        list_display = ['name', 'code', 'grade', 'term', 'teacher', 'is_active']
        list_filter = ['grade', 'term', 'is_active']
        search_fields = ['name', 'code']
except:
    pass

try:
    @admin.register(PerformanceRecord)
    class PerformanceRecordAdmin(admin.ModelAdmin):
        list_display = ['student', 'subject', 'term', 'score', 'grade', 'low_attendance_flag', 'created_at']
        list_filter = ['term', 'subject', 'grade', 'low_attendance_flag']
        search_fields = ['student__first_name', 'student__last_name', 'student__admission_number']
        readonly_fields = ['grade', 'low_attendance_flag', 'created_at', 'updated_at']
except:
    pass