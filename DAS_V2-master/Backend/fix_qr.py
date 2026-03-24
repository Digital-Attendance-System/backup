import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

print("🔍 Diagnosing QR Code Generation Issue...\n")

# 1. Check if qrcode is installed
print("1️⃣ Checking qrcode library...")
try:
    import qrcode
    print("   ✅ qrcode library installed")
except ImportError:
    print("   ❌ qrcode NOT installed!")
    print("   Run: pip install qrcode[pil] --break-system-packages")
    exit()

# 2. Check PIL/Pillow
print("\n2️⃣ Checking PIL/Pillow...")
try:
    from PIL import Image
    print("   ✅ PIL/Pillow installed")
except ImportError:
    print("   ❌ Pillow NOT installed!")
    print("   Run: pip install Pillow --break-system-packages")
    exit()

# 3. Check media directories
print("\n3️⃣ Checking media directories...")
from django.conf import settings

media_root = settings.MEDIA_ROOT
qr_dir = os.path.join(media_root, 'qr_codes')

if not os.path.exists(media_root):
    os.makedirs(media_root)
    print(f"   ✅ Created: {media_root}")
else:
    print(f"   ✅ Exists: {media_root}")

if not os.path.exists(qr_dir):
    os.makedirs(qr_dir)
    print(f"   ✅ Created: {qr_dir}")
else:
    print(f"   ✅ Exists: {qr_dir}")

# 4. Check Student model has QR fields
print("\n4️⃣ Checking Student model...")
from students.models import Student

student = Student.objects.first()
if student:
    print(f"   ✅ Found student: {student.full_name}")
    
    # Check if fields exist
    if hasattr(student, 'qr_code'):
        print("   ✅ qr_code field exists")
    else:
        print("   ❌ qr_code field MISSING!")
        print("   Need to run migrations!")
    
    if hasattr(student, 'qr_code_image'):
        print("   ✅ qr_code_image field exists")
    else:
        print("   ❌ qr_code_image field MISSING!")
        print("   Need to run migrations!")
else:
    print("   ⚠️  No students in database")

# 5. Test QR generation
print("\n5️⃣ Testing QR code generation...")
if student:
    try:
        import json
        import base64
        from io import BytesIO
        
        qr_data = {
            'student_id': student.id,
            'admission_number': student.admission_number,
        }
        qr_string = json.dumps(qr_data)
        encrypted = base64.b64encode(qr_string.encode()).decode()
        
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(encrypted)
        qr.make(fit=True)
        img = qr.make_image(fill_color="black", back_color="white")
        
        # Try to save
        buffer = BytesIO()
        img.save(buffer, format='PNG')
        buffer.seek(0)
        
        # Save to file
        test_file = os.path.join(qr_dir, 'test_qr.png')
        with open(test_file, 'wb') as f:
            f.write(buffer.read())
        
        print(f"   ✅ QR code generated successfully!")
        print(f"   ✅ Saved to: {test_file}")
        
    except Exception as e:
        print(f"   ❌ Error generating QR: {e}")
        import traceback
        traceback.print_exc()

# 6. Check views.py has the function
print("\n6️⃣ Checking views.py...")
try:
    from students import views
    if hasattr(views, 'generate_qr_code'):
        print("   ✅ generate_qr_code function exists")
    else:
        print("   ❌ generate_qr_code function MISSING!")
except Exception as e:
    print(f"   ❌ Error: {e}")

print("\n✅ Diagnosis complete!")