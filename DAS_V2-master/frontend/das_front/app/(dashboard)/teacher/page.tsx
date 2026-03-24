'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { dashboardAPI, classesAPI } from '@/lib/api';
import { Card, StatCard } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/Button';
import { Spinner } from '@/components/UI/Spinner';
import ScannerPage from "@/components/attendance/QrCodeScannerComponent";

import Link from 'next/link';
import toast from 'react-hot-toast';

interface ClassInfo {
  id: number;
  name: string;
  display_name: string;
  student_count: number;
}

interface TodayTask {
  class: ClassInfo;
  status: 'completed' | 'pending';
}


export default function TeacherDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [assignedClasses, setAssignedClasses] = useState<ClassInfo[]>([]);
  const [todaysTasks, setTodaysTasks] = useState<TodayTask[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // For now, fetch all classes (in production, filter by teacher)
      const classesResponse = await classesAPI.getAll();
      const classes = classesResponse.data.data?.results || [];
      
      setAssignedClasses(classes);
      
      // Mock today's tasks (in production, fetch from backend)
      const tasks = classes.map((cls: ClassInfo) => ({
        class: cls,
        status: 'pending' as const,
      }));
      
      setTodaysTasks(tasks);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      toast.error('Failed to load dashboard');
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

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.first_name || user?.username}!
        </h1>
        <p className="text-gray-500 mt-1">Here's what's happening with your classes today</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Assigned Classes"
          value={assignedClasses.length}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          }
        />

        <StatCard
          title="Total Students"
          value={assignedClasses.reduce((sum, cls) => sum + cls.student_count, 0)}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          }
        />

        <StatCard
          title="Pending Today"
          value={todaysTasks.filter(t => t.status === 'pending').length}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>

      {/* Today's Tasks */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Today's Attendance Tasks</h2>
          <p className="text-sm text-gray-500 mt-1">Mark attendance for your classes</p>
        </div>

        <div className="p-6">
          {todaysTasks.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-gray-500">No classes assigned yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {todaysTasks.map((task) => (
                <div
                  key={task.class.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
                >
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{task.class.display_name}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {task.class.student_count} students
                    </p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Badge variant={task.status === 'completed' ? 'success' : 'warning'}>
                      {task.status === 'completed' ? 'Completed' : 'Pending'}
                    </Badge>
                    <Link href={`/teacher/attendance?class=${task.class.id}`}>
                      <Button size="sm">
                        {task.status === 'completed' ? 'View' : 'Mark Attendance'}
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-2">QR Code Scanner</h3>
              <p className="text-sm text-gray-600 mb-4">
                Use your device camera to quickly scan student QR codes
              </p>
              <Link href="/teacher/attendance/scan">
                <Button variant="secondary" size="sm">
                  Open Scanner
                </Button>
              </Link>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-2">Manual Entry</h3>
              <p className="text-sm text-gray-600 mb-4">
                Mark attendance manually with Present/Absent buttons
              </p>
              <Link href="/teacher/attendance">
                <Button variant="secondary" size="sm">
                  Start Manual Entry
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}