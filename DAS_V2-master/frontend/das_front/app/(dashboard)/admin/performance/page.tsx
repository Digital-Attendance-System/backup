'use client';

import { useEffect, useState } from 'react';
import { studentsAPI, classesAPI } from '@/lib/api';
import { Card } from '@/components/UI/Card';
import { Button } from '@/components/UI/Button';
import { Select } from '@/components/UI/Select';
import { Input } from '@/components/UI/Input';
import { Modal } from '@/components/UI/Modal';
import { Spinner } from '@/components/UI/Spinner';
import { Badge } from '@/components/UI/Badge';
import toast from 'react-hot-toast';

interface PerformanceEntry {
  student_id: number;
  subject: string;
  term: string;
  test_score: number;
  exam_score: number;
  final_grade: string;
  attendance_rate: number;
}

export default function PerformancePage() {
  const [classes, setClasses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [loading, setLoading] = useState(false);
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    subject: '',
    term: '',
    test_score: '',
    exam_score: '',
  });

  const subjects = ['Mathematics', 'English', 'Science', 'Social Studies', 'Kiswahili', 'CRE/IRE'];
  const terms = ['Term 1', 'Term 2', 'Term 3'];

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchStudents();
    }
  }, [selectedClass]);

  const fetchClasses = async () => {
    try {
      const response = await classesAPI.getAll();
      setClasses(response.data.data?.results || []);
    } catch (error) {
      console.error('Failed to fetch classes:', error);
    }
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await studentsAPI.getAll({ class: selectedClass });
      setStudents(response.data.results || []);
    } catch (error) {
      console.error('Failed to fetch students:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateGrade = (testScore: number, examScore: number) => {
    const total = (testScore * 0.3) + (examScore * 0.7); // 30% test, 70% exam
    
    if (total >= 90) return 'A';
    if (total >= 80) return 'A-';
    if (total >= 75) return 'B+';
    if (total >= 70) return 'B';
    if (total >= 65) return 'B-';
    if (total >= 60) return 'C+';
    if (total >= 55) return 'C';
    if (total >= 50) return 'C-';
    if (total >= 45) return 'D+';
    if (total >= 40) return 'D';
    if (total >= 35) return 'D-';
    return 'E';
  };

  const handleSubmit = async () => {
    try {
      const testScore = parseFloat(formData.test_score);
      const examScore = parseFloat(formData.exam_score);
      
      if (testScore < 0 || testScore > 100 || examScore < 0 || examScore > 100) {
        toast.error('Scores must be between 0 and 100');
        return;
      }

      const grade = calculateGrade(testScore, examScore);
      
      // Mock API call - replace with actual
      console.log('Submitting performance:', {
        student_id: selectedStudent,
        ...formData,
        final_grade: grade,
      });

      toast.success('Performance record saved!');
      setIsEntryModalOpen(false);
      setFormData({ subject: '', term: '', test_score: '', exam_score: '' });
    } catch (error) {
      toast.error('Failed to save performance');
    }
  };

  const openEntryModal = (studentId: number) => {
    setSelectedStudent(studentId.toString());
    setIsEntryModalOpen(true);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Performance Entry</h1>
        <p className="text-sm text-gray-500 mt-1">Enter student test and exam scores</p>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Select Class"
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            options={[
              { value: '', label: 'Select Class' },
              ...classes.map((cls) => ({
                value: cls.id.toString(),
                label: cls.display_name || cls.name,
              })),
            ]}
          />
        </div>
      </Card>

      {/* Students List */}
      {selectedClass && (
        <Card>
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Students</h2>
            <p className="text-sm text-gray-500 mt-1">Click "Enter Scores" to add performance data</p>
          </div>

          {loading ? (
            <div className="p-12 flex justify-center">
              <Spinner size="lg" />
            </div>
          ) : students.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-500">No students in this class</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {students.map((student) => (
                <div key={student.id} className="p-4 hover:bg-gray-50 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600">
                        {student.first_name[0]}{student.last_name[0]}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{student.full_name}</div>
                      <div className="text-sm text-gray-500">{student.admission_number}</div>
                    </div>
                  </div>
                  <Button size="sm" onClick={() => openEntryModal(student.id)}>
                    Enter Scores
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Entry Modal */}
      <Modal
        isOpen={isEntryModalOpen}
        onClose={() => setIsEntryModalOpen(false)}
        title="Enter Performance Scores"
        size="md"
      >
        <div className="space-y-4">
          <Select
            label="Subject"
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            options={[
              { value: '', label: 'Select Subject' },
              ...subjects.map(s => ({ value: s, label: s })),
            ]}
            required
          />

          <Select
            label="Term"
            value={formData.term}
            onChange={(e) => setFormData({ ...formData, term: e.target.value })}
            options={[
              { value: '', label: 'Select Term' },
              ...terms.map(t => ({ value: t, label: t })),
            ]}
            required
          />

          <Input
            label="Test Score (30%)"
            type="number"
            min="0"
            max="100"
            value={formData.test_score}
            onChange={(e) => setFormData({ ...formData, test_score: e.target.value })}
            placeholder="e.g., 85"
            required
          />

          <Input
            label="Exam Score (70%)"
            type="number"
            min="0"
            max="100"
            value={formData.exam_score}
            onChange={(e) => setFormData({ ...formData, exam_score: e.target.value })}
            placeholder="e.g., 92"
            required
          />

          {/* Grade Preview */}
          {formData.test_score && formData.exam_score && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-blue-900">Calculated Grade:</span>
                <Badge variant="info" className="text-lg">
                  {calculateGrade(parseFloat(formData.test_score), parseFloat(formData.exam_score))}
                </Badge>
              </div>
              <p className="text-xs text-blue-700 mt-2">
                Total: {((parseFloat(formData.test_score) * 0.3) + (parseFloat(formData.exam_score) * 0.7)).toFixed(1)}%
              </p>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button variant="ghost" onClick={() => setIsEntryModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              Save Performance
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}