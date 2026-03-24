'use client';

import { useEffect, useState } from 'react';
import { reportsAPI, classesAPI } from '@/lib/api';
import { Card } from '@/components/UI/Card';
import { Button } from '@/components/UI/Button';
import { Input } from '@/components/UI/Input';
import { Select } from '@/components/UI/Select';
import { Badge } from '@/components/UI/Badge';
import { Spinner } from '@/components/UI/Spinner';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import toast from 'react-hot-toast';

interface AttendanceSummary {
  total_records: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  attendance_rate: number;
}

interface AttendanceRecord {
  id: number;
  student: {
    id: number;
    name: string;
    admission_number: string;
  };
  class: {
    id: number;
    name: string;
  };
  date: string;
  status: string;
  marked_by: string;
  marked_at: string;
  notes: string;
}

interface ClassSummary {
  class_id: number;
  class_name: string;
  grade_level: number;
  total_students: number;
  total_records: number;
  present: number;
  absent: number;
  late: number;
  attendance_rate: number;
}

interface StudentSummary {
  student_id: number;
  student_name: string;
  admission_number: string;
  class: string;
  total_days: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  attendance_rate: number;
}

const COLORS = {
  present: '#10b981',
  absent: '#ef4444',
  late: '#f59e0b',
  excused: '#3b82f6',
};

export default function ReportsPage() {
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState<'attendance' | 'class' | 'student'>('attendance');
  
  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  
  // Data
  const [summary, setSummary] = useState<AttendanceSummary | null>(null);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [classSummary, setClassSummary] = useState<ClassSummary[]>([]);
  const [studentSummary, setStudentSummary] = useState<StudentSummary[]>([]);
  const [classes, setClasses] = useState<any[]>([]);

  useEffect(() => {
    fetchClasses();
    setDefaultDates();
  }, []);

  const setDefaultDates = () => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    setStartDate(thirtyDaysAgo.toISOString().split('T')[0]);
    setEndDate(today.toISOString().split('T')[0]);
  };

  const fetchClasses = async () => {
    try {
      const response = await classesAPI.getAll();
      setClasses(response.data.data?.results || response.data.results || []);
    } catch (error) {
      console.error('Failed to fetch classes:', error);
    }
  };

const fetchReport = async () => {
  try {
    setLoading(true);
    
    const params: any = {};
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    if (selectedClass) params.class_id = selectedClass;
    if (selectedStatus) params.status = selectedStatus;

    console.log('🔍 Fetching report with params:', params);
    console.log('📊 Report type:', reportType);

    if (reportType === 'attendance') {
      const response = await reportsAPI.getAttendanceReport(params);
      console.log('✅ Full response:', response);
      console.log('📦 Response data:', response.data);
      console.log('📊 Summary:', response.data.data?.summary);
      console.log('📋 Records:', response.data.data?.records);
      
      setSummary(response.data.data.summary);
      setRecords(response.data.data.records);
      
      console.log('✅ State updated - Summary:', response.data.data.summary);
      console.log('✅ State updated - Records count:', response.data.data.records?.length);
    } else if (reportType === 'class') {
      const response = await reportsAPI.getClassSummary(params);
      console.log('✅ Class summary response:', response.data);
      setClassSummary(response.data.data);
    } else if (reportType === 'student') {
      const response = await reportsAPI.getStudentSummary(params);
      console.log('✅ Student summary response:', response.data);
      setStudentSummary(response.data.data);
    }
    
    toast.success('Report generated successfully!');
  } catch (error: any) {
    console.error('❌ Failed to fetch report:', error);
    console.error('❌ Error response:', error.response);
    console.error('❌ Error data:', error.response?.data);
    toast.error('Failed to generate report');
  } finally {
    setLoading(false);
  }
};
  const handleExportCSV = async () => {
    try {
      const params: any = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      if (selectedClass) params.class_id = selectedClass;

      const response = await reportsAPI.exportCSV(params);
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `attendance_report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('Report exported successfully!');
    } catch (error) {
      console.error('Failed to export:', error);
      toast.error('Failed to export report');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getStatusBadge = (status: string) => {
    const variants: any = {
      present: 'success',
      absent: 'error',
      late: 'warning',
      excused: 'info',
    };
    return <Badge variant={variants[status] || 'default'}>{status.toUpperCase()}</Badge>;
  };

  const getAttendanceColor = (rate: number) => {
    if (rate >= 90) return 'text-green-600';
    if (rate >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Prepare chart data
  const pieChartData = summary ? [
    { name: 'Present', value: summary.present, color: COLORS.present },
    { name: 'Absent', value: summary.absent, color: COLORS.absent },
    { name: 'Late', value: summary.late, color: COLORS.late },
    { name: 'Excused', value: summary.excused, color: COLORS.excused },
  ] : [];

  const classChartData = classSummary.map(cls => ({
    name: cls.class_name,
    'Attendance Rate': cls.attendance_rate,
    Present: cls.present,
    Absent: cls.absent,
    Late: cls.late,
  }));

  const studentChartData = studentSummary.slice(0, 10).map(student => ({
    name: student.student_name.split(' ')[0], // First name only
    'Attendance %': student.attendance_rate,
    Present: student.present,
    Absent: student.absent,
  }));

  return (
    <div className="p-6 space-y-6 print:p-0">
      {/* Header */}
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">Visualize and export attendance data</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="secondary" onClick={handlePrint}>
            🖨️ Print
          </Button>
          <Button onClick={handleExportCSV}>
            📥 Export CSV
          </Button>
        </div>
      </div>

      {/* Report Type Selector */}
      <Card className="p-6 print:hidden">
        <div className="flex items-center space-x-4 mb-4">
          <button
            onClick={() => setReportType('attendance')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              reportType === 'attendance'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            📊 Attendance Overview
          </button>
          <button
            onClick={() => setReportType('class')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              reportType === 'class'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            🏫 Class Analytics
          </button>
          <button
            onClick={() => setReportType('student')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              reportType === 'student'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            👨‍🎓 Student Analytics
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input
            label="Start Date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          
          <Input
            label="End Date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
          
          <Select
            label="Class"
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            options={[
              { value: '', label: 'All Classes' },
              ...classes.map(cls => ({
                value: cls.id.toString(),
                label: cls.display_name || cls.name
              }))
            ]}
          />
          
          {reportType === 'attendance' && (
            <Select
              label="Status"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              options={[
                { value: '', label: 'All Status' },
                { value: 'present', label: 'Present' },
                { value: 'absent', label: 'Absent' },
                { value: 'late', label: 'Late' },
                { value: 'excused', label: 'Excused' },
              ]}
            />
          )}
        </div>

        <div className="mt-4">
          <Button onClick={fetchReport} disabled={loading}>
            {loading ? 'Generating...' : '🔍 Generate Report'}
          </Button>
        </div>
      </Card>
      <Card className="p-4 bg-blue-50 text-color-blue-600">
  <h3 className="font-bold mb-2 ">Debug Info:</h3>
  <div className="text-sm space-y-1">
    <p>Report Type: <strong>{reportType}</strong></p>
    <p>Loading: <strong>{loading ? 'Yes' : 'No'}</strong></p>
    <p>Summary: <strong>{summary ? 'Exists' : 'NULL'}</strong></p>
    <p>Records Count: <strong>{records?.length || 0}</strong></p>
    <p>Class Summary Count: <strong>{classSummary?.length || 0}</strong></p>
    <p>Student Summary Count: <strong>{studentSummary?.length || 0}</strong></p>
  </div>
</Card>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      )}

      {/* ========== ATTENDANCE OVERVIEW ANALYTICS ========== */}
      {!loading && reportType === 'attendance' && summary && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card className="p-6">
              <div className="text-sm text-gray-600 mb-2">Total Records</div>
              <div className="text-3xl font-bold text-gray-900">{summary.total_records}</div>
            </Card>
            <Card className="p-6">
              <div className="text-sm text-gray-600 mb-2">Present</div>
              <div className="text-3xl font-bold text-green-600">{summary.present}</div>
            </Card>
            <Card className="p-6">
              <div className="text-sm text-gray-600 mb-2">Absent</div>
              <div className="text-3xl font-bold text-red-600">{summary.absent}</div>
            </Card>
            <Card className="p-6">
              <div className="text-sm text-gray-600 mb-2">Late</div>
              <div className="text-3xl font-bold text-yellow-600">{summary.late}</div>
            </Card>
            <Card className="p-6">
              <div className="text-sm text-gray-600 mb-2">Attendance Rate</div>
              <div className={`text-3xl font-bold ${getAttendanceColor(summary.attendance_rate)}`}>
                {summary.attendance_rate}%
              </div>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pie Chart */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Status Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => {
                            const percentage = entry.percent || ((entry.value / summary.total_records) * 100).toFixed(1);
                            return `${entry.name}: ${percentage}%`;
                          }}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card>

            {/* Bar Chart */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Status Breakdown</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={pieChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3b82f6">
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>

          {/* Records Table */}
          {records.length > 0 && (
            <Card>
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Detailed Records</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Showing {records.length} recent record(s)
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Marked By</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {records.map((record) => (
                      <tr key={record.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(record.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{record.student.name}</div>
                          <div className="text-sm text-gray-500">{record.student.admission_number}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {record.class.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(record.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {record.marked_by}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}

      {/* ========== CLASS ANALYTICS ========== */}
      {!loading && reportType === 'class' && classSummary.length > 0 && (
        <>
          {/* Class Performance Chart */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Class Attendance Rates</h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={classChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="Attendance Rate" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Class Comparison Chart */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Status Comparison by Class</h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={classChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="Present" fill={COLORS.present} />
                <Bar dataKey="Absent" fill={COLORS.absent} />
                <Bar dataKey="Late" fill={COLORS.late} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Class Summary Table */}
          <Card>
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Class-wise Summary</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Students</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Present</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Absent</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Late</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Attendance Rate</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {classSummary.map((cls) => (
                    <tr key={cls.class_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{cls.class_name}</div>
                        <div className="text-sm text-gray-500">Grade {cls.grade_level}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {cls.total_students}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-semibold">
                        {cls.present}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-semibold">
                        {cls.absent}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-600 font-semibold">
                        {cls.late}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-bold ${getAttendanceColor(cls.attendance_rate)}`}>
                          {cls.attendance_rate}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {/* ========== STUDENT ANALYTICS ========== */}
      {!loading && reportType === 'student' && studentSummary.length > 0 && (
        <>
          {/* Student Performance Chart - Top 10 Lowest */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Students with Lowest Attendance (Top 10)
            </h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={studentChartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Attendance %" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Student Status Chart */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Attendance Status - Students Needing Attention
            </h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={studentChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="Present" fill={COLORS.present} />
                <Bar dataKey="Absent" fill={COLORS.absent} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Student Summary Table */}
          <Card>
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Student-wise Summary</h2>
              <p className="text-sm text-gray-500 mt-1">
                Sorted by lowest attendance rate - students needing attention
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Days</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Present</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Absent</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Late</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Attendance Rate</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {studentSummary.slice(0, 50).map((student) => (
                    <tr 
                      key={student.student_id} 
                      className={`hover:bg-gray-50 ${student.attendance_rate < 75 ? 'bg-red-50' : ''}`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{student.student_name}</div>
                        <div className="text-sm text-gray-500">{student.admission_number}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {student.class}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {student.total_days}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-semibold">
                        {student.present}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-semibold">
                        {student.absent}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-600 font-semibold">
                        {student.late}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-bold ${getAttendanceColor(student.attendance_rate)}`}>
                          {student.attendance_rate}%
                        </span>
                        {student.attendance_rate < 75 && (
                          <span className="ml-2 text-xs text-red-600">⚠️ Low</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {/* Empty State */}
      {!loading && !summary && !classSummary.length && !studentSummary.length && (
        <Card className="p-12 text-center">
          <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-gray-500 mb-4">Click "Generate Report" to view analytics</p>
          <p className="text-sm text-gray-400">Select your filters and generate a report to see charts and data</p>
        </Card>
      )}
    </div>
  );
}