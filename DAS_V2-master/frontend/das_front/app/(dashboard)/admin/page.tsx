'use client';

import { useEffect, useState } from 'react';
import { dashboardAPI } from '@/lib/api';
import { StatCard } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/UI/Table';
import { AttendanceTrendChart } from '@/components/charts/AttendanceTrend';
import { Spinner } from '@/components/UI/Spinner';
import toast from 'react-hot-toast';

interface DashboardData {
  school_name: string;
  statistics: {
    total_students: number;
    students_change_percentage: number;
    todays_attendance: {
      percentage: number;
      status: string;
    };
    active_classes: number;
    total_absentees_today: number;
    alert: boolean;
  };
  weekly_attendance_trend: Array<{
    day: string;
    date: string;
    percentage: number;
  }>;
  staff_performance: Array<{
    teacher: string;
    grade: string;
    submission_status: string;
    status: string;
  }>;
  recent_submissions: Array<{
    teacher: string;
    class_name: string;
    submission_time: string;
    present: number;
    total: number;
    status: string;
  }>;
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await dashboardAPI.getAdminDashboard();
      setData(response.data.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Failed to load dashboard data</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* School Name */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900">{data.school_name}</h2>
        <p className="text-sm text-gray-500">Overview of today's attendance and activity</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Students"
          value={data.statistics.total_students.toLocaleString()}
          change={`+${data.statistics.students_change_percentage}%`}
          changeType="positive"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          }
        />

        <StatCard
          title="Today's Attendance"
          value={`${data.statistics.todays_attendance.percentage}%`}
          change={data.statistics.todays_attendance.status}
          changeType={data.statistics.todays_attendance.percentage >= 90 ? 'positive' : 'negative'}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />

        <StatCard
          title="Active Classes"
          value={data.statistics.active_classes}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          }
        />

        <StatCard
          title="Total Absentees Today"
          value={data.statistics.total_absentees_today}
          alert={data.statistics.alert}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>

      {/* Weekly Attendance Trend */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Attendance Trend</h3>
        <AttendanceTrendChart data={data.weekly_attendance_trend} />
      </div>

      {/* Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Staff Performance */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Staff Performance</h3>
          </div>
          <div className="p-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Teacher</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.staff_performance.map((staff, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{staff.teacher}</TableCell>
                    <TableCell>{staff.grade}</TableCell>
                    <TableCell>
                      <Badge variant={staff.status === 'completed' ? 'success' : 'warning'}>
                        {staff.submission_status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Recent Attendance Submissions */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent Attendance Submissions</h3>
          </div>
          <div className="p-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Teacher</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Present/Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.recent_submissions.map((submission, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{submission.teacher}</TableCell>
                    <TableCell>{submission.class_name}</TableCell>
                    <TableCell className="text-gray-500">{submission.submission_time}</TableCell>
                    <TableCell>
                      <span className="font-medium">{submission.present}/{submission.total}</span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}