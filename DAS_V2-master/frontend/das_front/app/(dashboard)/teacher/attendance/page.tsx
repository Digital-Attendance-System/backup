'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { attendanceAPI, classesAPI } from '@/lib/api';
import { Button } from '@/components/UI/Button';
import { Select } from '@/components/UI/Select';
import { Badge } from '@/components/UI/Badge';
import { Spinner } from '@/components/UI/Spinner';
import { Card } from '@/components/UI/Card';
import toast from 'react-hot-toast';

interface Student {
  id: number;
  admission_number: string;
  full_name: string;
  photo_url: string | null;
  attendance_status: 'P' | 'A' | 'L' | 'E' | null;
}

interface AttendanceData {
  class: {
    id: number;
    name: string;
    total_students: number;
  };
  date: string;
  students: Student[];
  summary: {
    total: number;
    present: number;
    absent: number;
  };
}

export default function AttendancePage() {
  const searchParams = useSearchParams();
  const classIdFromUrl = searchParams.get('class');

  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState(classIdFromUrl || '');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceData, setAttendanceData] = useState<AttendanceData | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClassId && selectedDate) {
      fetchAttendance();
    }
  }, [selectedClassId, selectedDate]);

  const fetchClasses = async () => {
    try {
      const response = await classesAPI.getAll();
      const classList = response.data.data?.results || [];
      setClasses(classList);
      
      // Auto-select first class if no class in URL
      if (!classIdFromUrl && classList.length > 0) {
        setSelectedClassId(classList[0].id.toString());
      }
    } catch (error) {
      console.error('Failed to fetch classes:', error);
      toast.error('Failed to load classes');
    }
  };

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const response = await attendanceAPI.getForm(parseInt(selectedClassId), selectedDate);
      
      setAttendanceData(response.data.data);
      setStudents(response.data.data.students);
    } catch (error) {
      console.error('Failed to fetch attendance:', error);
      toast.error('Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  };

  const markAttendance = (studentId: number, status: 'P' | 'A' | 'L' | 'E') => {
    setStudents(prev =>
      prev.map(student =>
        student.id === studentId
          ? { ...student, attendance_status: status }
          : student
      )
    );
  };

  const handleSaveAttendance = async () => {
    try {
      setSaving(true);

      const attendanceRecords = students.map(student => ({
        student_id: student.id,
        status: student.attendance_status || 'A', // Default to Absent if not marked
      }));

      await attendanceAPI.mark({
        class_id: parseInt(selectedClassId),
        date: selectedDate,
        marked_by: 1, // TODO: Get from auth context
        attendance: attendanceRecords,
      });

      toast.success('Attendance saved successfully!');
      fetchAttendance(); // Refresh data
    } catch (error: any) {
      console.error('Failed to save attendance:', error);
      toast.error(error.response?.data?.error || 'Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  const getStatusCounts = () => {
    const present = students.filter(s => s.attendance_status === 'P').length;
    const absent = students.filter(s => s.attendance_status === 'A').length;
    const late = students.filter(s => s.attendance_status === 'L').length;
    const excused = students.filter(s => s.attendance_status === 'E').length;
    const unmarked = students.filter(s => !s.attendance_status).length;

    return { present, absent, late, excused, unmarked, total: students.length };
  };

  const counts = getStatusCounts();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mark Attendance</h1>
        <p className="text-sm text-gray-500 mt-1">Select class and date, then mark student attendance</p>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

          <div className="flex items-end">
            <Button
              onClick={fetchAttendance}
              disabled={!selectedClassId || loading}
              className="w-full"
            >
              Load Attendance
            </Button>
          </div>
        </div>
      </Card>

      {/* Summary Cards */}
      {attendanceData && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="p-4">
            <div className="text-sm text-gray-600">Total Students</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">{counts.total}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-gray-600">Present</div>
            <div className="text-2xl font-bold text-green-600 mt-1">{counts.present}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-gray-600">Absent</div>
            <div className="text-2xl font-bold text-red-600 mt-1">{counts.absent}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-gray-600">Late</div>
            <div className="text-2xl font-bold text-orange-600 mt-1">{counts.late}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-gray-600">Unmarked</div>
            <div className="text-2xl font-bold text-gray-600 mt-1">{counts.unmarked}</div>
          </Card>
        </div>
      )}

      {/* Students List */}
      <Card>
        {loading ? (
          <div className="p-12 flex justify-center">
            <Spinner size="lg" />
          </div>
        ) : !attendanceData ? (
          <div className="p-12 text-center">
            <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-gray-500">Select a class and date to load students</p>
          </div>
        ) : (
          <>
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                {attendanceData.class.name}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {selectedDate} • {attendanceData.class.total_students} students
              </p>
            </div>

            <div className="divide-y divide-gray-200">
              {students.map((student, index) => (
                <div key={student.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    {/* Student Info */}
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="w-10 h-10 flex-shrink-0">
                        {student.photo_url ? (
                          <img
                            src={student.photo_url}
                            alt={student.full_name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-600">
                              {student.full_name.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{student.full_name}</div>
                        <div className="text-sm text-gray-500">{student.admission_number}</div>
                      </div>
                    </div>

                    {/* Attendance Buttons */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => markAttendance(student.id, 'P')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          student.attendance_status === 'P'
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-green-100'
                        }`}
                      >
                        Present
                      </button>
                      <button
                        onClick={() => markAttendance(student.id, 'A')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          student.attendance_status === 'A'
                            ? 'bg-red-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-red-100'
                        }`}
                      >
                        Absent
                      </button>
                      <button
                        onClick={() => markAttendance(student.id, 'L')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          student.attendance_status === 'L'
                            ? 'bg-orange-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-orange-100'
                        }`}
                      >
                        Late
                      </button>
                      <button
                        onClick={() => markAttendance(student.id, 'E')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          student.attendance_status === 'E'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-blue-100'
                        }`}
                      >
                        Excused
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Save Button */}
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  {counts.unmarked > 0 && (
                    <span className="text-orange-600 font-medium">
                      {counts.unmarked} student{counts.unmarked !== 1 ? 's' : ''} unmarked
                    </span>
                  )}
                </div>
                <Button
                  onClick={handleSaveAttendance}
                  loading={saving}
                  disabled={students.length === 0}
                >
                  Save Attendance
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}