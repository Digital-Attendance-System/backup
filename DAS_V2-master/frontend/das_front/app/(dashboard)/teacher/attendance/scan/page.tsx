'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { attendanceAPI, classesAPI } from '@/lib/api';
import { QRScanner } from '@/components/attendance/QRScanner';
import { Select } from '@/components/UI/Select';
import { Button } from '@/components/UI/Button';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { Spinner } from '@/components/UI/Spinner';
import toast from 'react-hot-toast';

interface ScannedStudent {
  student_id: number;
  admission_number: string;
  full_name: string;
  photo_url: string | null;
  scanned_at: string;
}

export default function QRScanPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const classIdFromUrl = searchParams.get('class');

  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState(classIdFromUrl || '');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [scannedStudents, setScannedStudents] = useState<ScannedStudent[]>([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const response = await classesAPI.getAll();
      const classList = response.data.data?.results || [];
      setClasses(classList);
      
      if (!classIdFromUrl && classList.length > 0) {
        setSelectedClassId(classList[0].id.toString());
      }
    } catch (error) {
      console.error('Failed to fetch classes:', error);
      toast.error('Failed to load classes');
    }
  };

  const handleQRScan = async (qrData: string) => {
    try {
      // Validate QR code with backend
      const response = await attendanceAPI.validateQR(qrData);
      
      if (response.data.success) {
        const studentData = response.data.data;
        
        // Check if already scanned
        const alreadyScanned = scannedStudents.find(s => s.student_id === studentData.student_id);
        
        if (alreadyScanned) {
          toast.error(`${studentData.full_name} already scanned!`, {
            icon: '⚠️',
          });
          return;
        }

        // Add to scanned list
        const newStudent: ScannedStudent = {
          student_id: studentData.student_id,
          admission_number: studentData.admission_number,
          full_name: studentData.full_name,
          photo_url: studentData.photo_url,
          scanned_at: new Date().toISOString(),
        };

        setScannedStudents(prev => [newStudent, ...prev]);
        
        toast.success(`✅ ${studentData.full_name} marked present!`, {
          duration: 2000,
        });
      }
    } catch (error: any) {
      console.error('QR validation failed:', error);
      toast.error(error.response?.data?.error || 'Invalid QR code');
    }
  };

  const handleSaveAttendance = async () => {
    if (!selectedClassId) {
      toast.error('Please select a class');
      return;
    }

    if (scannedStudents.length === 0) {
      toast.error('No students scanned yet');
      return;
    }

    try {
      setSaving(true);

      const attendanceRecords = scannedStudents.map(student => ({
        student_id: student.student_id,
        status: 'P', // Present
      }));

      await attendanceAPI.mark({
        class_id: parseInt(selectedClassId),
        date: selectedDate,
        marked_by: 1, // TODO: Get from auth
        attendance: attendanceRecords,
      });

      toast.success('Attendance saved successfully!');
      
      // Redirect to attendance page
      router.push(`/teacher/attendance?class=${selectedClassId}`);
    } catch (error: any) {
      console.error('Failed to save:', error);
      toast.error(error.response?.data?.error || 'Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  const removeStudent = (studentId: number) => {
    setScannedStudents(prev => prev.filter(s => s.student_id !== studentId));
    toast('Student removed from list');
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">QR Code Scanner</h1>
          <p className="text-sm text-gray-500 mt-1">Scan student QR codes to mark attendance</p>
        </div>
        <Button
          variant="ghost"
          onClick={() => router.push('/teacher/attendance')}
        >
          ← Back to Manual Entry
        </Button>
      </div>

      {/* Class and Date Selection */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Class"
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            options={[
              { value: '', label: 'Select Class' },
              ...classes.map((cls) => ({
                value: cls.id.toString(),
                label: cls.display_name || cls.name,
              })),
            ]}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
            />
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scanner */}
        <div>
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Camera Scanner</h2>
            <QRScanner
              onScanSuccess={handleQRScan}
              onScanError={(error) => toast.error(error)}
            />
          </Card>
        </div>

        {/* Scanned Students List */}
        <div>
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Scanned Students
              </h2>
              <Badge variant="info">
                {scannedStudents.length} scanned
              </Badge>
            </div>

            {scannedStudents.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
                <p className="text-gray-500">No students scanned yet</p>
                <p className="text-sm text-gray-400 mt-1">Start scanning QR codes to mark attendance</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {scannedStudents.map((student) => (
                  <div
                    key={student.student_id}
                    className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 flex-shrink-0">
                        {student.photo_url ? (
                          <img
                            src={student.photo_url}
                            alt={student.full_name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-green-200 flex items-center justify-center">
                            <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{student.full_name}</div>
                        <div className="text-sm text-gray-500">{student.admission_number}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => removeStudent(student.student_id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Save Button */}
            {scannedStudents.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <Button
                  onClick={handleSaveAttendance}
                  loading={saving}
                  className="w-full"
                >
                  Save Attendance ({scannedStudents.length} students)
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}