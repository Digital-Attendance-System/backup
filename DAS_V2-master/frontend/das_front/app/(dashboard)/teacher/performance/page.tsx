'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { Spinner } from '@/components/UI/Spinner';
import toast from 'react-hot-toast';
import { User } from 'lucide-react';

interface PerformanceRecord {
  id: number;
  subject: string;
  term: string;
  test_score: number;
  exam_score: number;
  final_grade: string;
  final_score: number;
  attendance_rate: number;
  remarks: string;
  created_at: string;
}



export default function StudentPerformancePage() {
  const { user } = useAuth();
  const [performance, setPerformance] = useState<PerformanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTerm, setSelectedTerm] = useState('all');

  useEffect(() => {
    if (!user) return; // guard against null
    fetchPerformance();
  }, [user]);

  const fetchPerformance = async () => {
    if (!user) return; // extra safety
    try {
      setLoading(true);

      const response = await fetch(
        `http://127.0.0.1:8000/api/performance/student/${user.student_id}/summary/`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          },
        }
      );

      const data = await response.json();
      setPerformance(data.results || []);
    } catch (error) {
      console.error('Failed to fetch performance:', error);
      toast.error('Failed to load performance data');
    } finally {
      setLoading(false);
    }
  };

  const filteredPerformance = selectedTerm === 'all' 
    ? performance 
    : performance.filter(p => p.term === selectedTerm);

  const calculateAverage = () => {
    if (filteredPerformance.length === 0) return '0.0';
    const total = filteredPerformance.reduce((sum, p) => sum + p.final_score, 0);
    return (total / filteredPerformance.length).toFixed(1);
  };

const getGradeColor = (grade: string) => {
  switch (grade) {
    case 'A':
    case 'A-':
      return 'success';
    case 'B+':
    case 'B':
      return 'info';
    case 'C':
      return 'warning';
    case 'D':
    case 'E':
      return 'error';
    default:
      return 'neutral';
  }
};

  const getOverallGrade = (average: number) => {
    if (average >= 90) return 'A';
    if (average >= 80) return 'A-';
    if (average >= 75) return 'B+';
    if (average >= 70) return 'B';
    if (average >= 65) return 'B-';
    if (average >= 60) return 'C+';
    if (average >= 55) return 'C';
    if (average >= 50) return 'C-';
    if (average >= 45) return 'D+';
    if (average >= 40) return 'D';
    return 'E';
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Performance</h1>
        <p className="text-sm text-gray-500 mt-1">View your academic grades and progress</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="text-sm text-gray-600 mb-2">Overall Average</div>
          <div className="text-3xl font-bold text-blue-600">{calculateAverage()}%</div>
          <div className="text-sm text-gray-500 mt-1">
            Grade: {getOverallGrade(parseFloat(calculateAverage()))}
          </div>
        </Card>

        <Card className="p-6">
          <div className="text-sm text-gray-600 mb-2">Total Subjects</div>
          <div className="text-3xl font-bold text-gray-900">{filteredPerformance.length}</div>
          <div className="text-sm text-gray-500 mt-1">This term</div>
        </Card>

        <Card className="p-6">
          <div className="text-sm text-gray-600 mb-2">Best Subject</div>
          <div className="text-xl font-bold text-green-600">
            {filteredPerformance.length > 0
              ? filteredPerformance.reduce((prev, current) => 
                  prev.final_score > current.final_score ? prev : current
                ).subject
              : 'N/A'}
          </div>
          <div className="text-sm text-gray-500 mt-1">
            {filteredPerformance.length > 0
              ? `${filteredPerformance.reduce((prev, current) => 
                  prev.final_score > current.final_score ? prev : current
                ).final_score}%`
              : ''}
          </div>
        </Card>

        <Card className="p-6">
          <div className="text-sm text-gray-600 mb-2">Attendance Rate</div>
          <div className="text-3xl font-bold text-purple-600">
            {filteredPerformance.length > 0 ? filteredPerformance[0].attendance_rate : 0}%
          </div>
          <div className="text-sm text-gray-500 mt-1">Overall</div>
        </Card>
      </div>

      {/* Term Filter */}
      <Card className="p-6">
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700">Filter by Term:</label>
          <div className="flex space-x-2">
            <button
              onClick={() => setSelectedTerm('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedTerm === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Terms
            </button>
            <button
              onClick={() => setSelectedTerm('Term 1')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedTerm === 'Term 1'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Term 1
            </button>
            <button
              onClick={() => setSelectedTerm('Term 2')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedTerm === 'Term 2'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Term 2
            </button>
            <button
              onClick={() => setSelectedTerm('Term 3')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedTerm === 'Term 3'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Term 3
            </button>
          </div>
        </div>
      </Card>

      {/* Performance Table */}
      <Card>
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Subject Grades</h2>
          <p className="text-sm text-gray-500 mt-1">Detailed breakdown of your performance</p>
        </div>

        {loading ? (
          <div className="p-12 flex justify-center">
            <Spinner size="lg" />
          </div>
        ) : filteredPerformance.length === 0 ? (
          <div className="p-12 text-center">
            <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-500">No performance records found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subject
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Term
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Test (30%)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Exam (70%)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Final Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Grade
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Remarks
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPerformance.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{record.subject}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {record.term}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">{record.test_score}%</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">{record.exam_score}%</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-bold text-gray-900">{record.final_score}%</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={getGradeColor(record.final_grade)}>
                        {record.final_grade}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {record.remarks}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Grade Legend */}
      <Card className="p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Grading Scale</h3>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <div className="text-center">
            <div className="text-lg font-bold text-green-600">A</div>
            <div className="text-xs text-gray-500">90-100%</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-green-500">A-</div>
            <div className="text-xs text-gray-500">80-89%</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-blue-600">B+</div>
            <div className="text-xs text-gray-500">75-79%</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-blue-500">B</div>
            <div className="text-xs text-gray-500">70-74%</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-yellow-600">C</div>
            <div className="text-xs text-gray-500">55-69%</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-red-600">D/E</div>
            <div className="text-xs text-gray-500">Below 55%</div>
          </div>
        </div>
      </Card>
    </div>
  );
}