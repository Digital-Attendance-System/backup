'use client';
import link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { classesAPI } from '@/lib/api';
import { Card } from '@/components/UI/Card';
import { Button } from '@/components/UI/Button';
import { Modal } from '@/components/UI/Modal';
import { Input } from '@/components/UI/Input';
import { Select } from '@/components/UI/Select';
// import { Badge } from '@/components/UI/Badge';
import { Spinner } from '@/components/UI/Spinner';
import toast from 'react-hot-toast';
import Link from 'next/link';
interface Class {
  id: number;
  name: string;
  grade_level: number;
  section: string;
  nickname?: string;
  display_name: string;
  academic_year: string;
  class_teacher?: {
    id: number;
    user: {
      first_name: string;
      last_name: string;
    };
  };
  student_count: number;
  room_number?: string;
  capacity?: number;
  school?: number;
  created_at: string;
}

export default function ClassesPage() {
  const router = useRouter();
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    grade_level: '',
    section: '',
    nickname: '',
    academic_year: '2025-2026',
    room_number: '',
    capacity: '',
  });

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const response = await classesAPI.getAll();
      console.log('Classes response:', response.data);
      
      // Handle different response structures
      const classList = response.data.results || response.data.data?.results || response.data || [];
      setClasses(classList);
    } catch (error: any) {
      console.error('Failed to fetch classes:', error);
      toast.error('Failed to load classes');
    } finally {
      setLoading(false);
    }
  };

 const handleAddClass = async () => {
  try {
    // Validate required fields
    if (!formData.name || !formData.grade_level || !formData.section) {
      toast.error('Please fill in all required fields');
      return;
    }

    const payload = {
      name: formData.name,
      grade_level: parseInt(formData.grade_level),
      section: formData.section,
      nickname: formData.nickname || '',
      academic_year: formData.academic_year,
      room_number: formData.room_number || '',
      capacity: formData.capacity ? parseInt(formData.capacity) : null,
      school: 1, // ADD THIS - use the first school (or get from user context)
    };

    console.log('Sending payload:', payload); // Debug log

    const response = await classesAPI.create(payload);
    console.log('Response:', response); // Debug log

    toast.success('Class added successfully!');
    setIsAddModalOpen(false);
    resetForm();
    fetchClasses();
  } catch (error: any) {
    console.error('Full error:', error.response?.data); // Better error logging
    const errorMsg = error.response?.data?.error 
      || error.response?.data?.message
      || JSON.stringify(error.response?.data)
      || 'Failed to add class';
    toast.error(errorMsg);
  }
};

const handleEditClass = async () => {
  if (!selectedClass) return;

  try {
    // Validate required fields
    if (!formData.name || !formData.grade_level || !formData.section) {
      toast.error('Please fill in all required fields');
      return;
    }

    const payload = {
      name: formData.name,
      grade_level: parseInt(formData.grade_level),
      section: formData.section,
      nickname: formData.nickname || '',
      academic_year: formData.academic_year,
      room_number: formData.room_number || '',
      capacity: formData.capacity ? parseInt(formData.capacity) : null,
      school: selectedClass.school || 1, // Preserve existing school or use default
    };

    console.log('Updating with payload:', payload); // Debug log

    await classesAPI.update(selectedClass.id, payload);
    toast.success('Class updated successfully!');
    setIsEditModalOpen(false);
    setSelectedClass(null);
    resetForm();
    fetchClasses();
  } catch (error: any) {
    console.error('Full error:', error.response?.data);
    const errorMsg = error.response?.data?.error 
      || error.response?.data?.message
      || JSON.stringify(error.response?.data)
      || 'Failed to update class';
    toast.error(errorMsg);
  }
};

  const handleDeleteClass = async () => {
    if (!selectedClass) return;

    try {
      await classesAPI.delete(selectedClass.id);
      toast.success('Class deleted successfully!');
      setIsDeleteModalOpen(false);
      setSelectedClass(null);
      fetchClasses();
    } catch (error: any) {
      console.error('Failed to delete class:', error);
      toast.error(error.response?.data?.error || 'Failed to delete class');
    }
  };

  const openEditModal = (classItem: Class) => {
    setSelectedClass(classItem);
    setFormData({
      name: classItem.name,
      grade_level: classItem.grade_level.toString(),
      section: classItem.section,
      nickname: classItem.nickname || '',
      academic_year: classItem.academic_year,
      room_number: classItem.room_number || '',
      capacity: classItem.capacity?.toString() || '',
    });
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (classItem: Class) => {
    setSelectedClass(classItem);
    setIsDeleteModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      grade_level: '',
      section: '',
      nickname: '',
      academic_year: '2025-2026',
      room_number: '',
      capacity: '',
    });
  };

  const getGradeColor = (level: number) => {
    if (level <= 2) return 'bg-purple-100 text-purple-700';
    if (level <= 4) return 'bg-blue-100 text-blue-700';
    return 'bg-green-100 text-green-700';
  };

  const handleViewStudents = (classItem: Class) => {
    router.push(`/dashboard/admin/students?classId=${classItem.id}`);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Classes</h1>
          <p className="text-sm text-gray-500 mt-1">Manage school classes and sections</p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)}>
          + Add Class
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="text-sm text-gray-600 mb-2">Total Classes</div>
          <div className="text-3xl font-bold text-gray-900">{classes.length}</div>
        </Card>
        <Card className="p-6">
          <div className="text-sm text-gray-600 mb-2">Total Students</div>
          <div className="text-3xl font-bold text-blue-600">
            {classes.reduce((sum, cls) => sum + (cls.student_count || 0), 0)}
          </div>
        </Card>
        <Card className="p-6">
          <div className="text-sm text-gray-600 mb-2">Average Class Size</div>
          <div className="text-3xl font-bold text-green-600">
            {classes.length > 0 
              ? Math.round(classes.reduce((sum, cls) => sum + (cls.student_count || 0), 0) / classes.length)
              : 0}
          </div>
        </Card>
        <Card className="p-6">
          <div className="text-sm text-gray-600 mb-2">Academic Year</div>
          <div className="text-xl font-bold text-purple-600">2025-2026</div>
        </Card>
      </div>

      {/* Classes Grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : classes.length === 0 ? (
        <Card className="p-12 text-center">
          <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <p className="text-gray-500 mb-4">No classes found</p>
          <Button onClick={() => setIsAddModalOpen(true)}>
            Add Your First Class
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.map((classItem) => (
            <Card key={classItem.id} className="p-6 hover:shadow-lg transition-shadow">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getGradeColor(classItem.grade_level)}`}>
                  <span className="text-xl font-bold">{classItem.grade_level}</span>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => openEditModal(classItem)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => openDeleteModal(classItem)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Class Info */}
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {classItem.display_name || classItem.name}
              </h3>
              {classItem.nickname && (
                <p className="text-sm text-gray-500 mb-3">"{classItem.nickname}"</p>
              )}

              {/* Stats */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Students:</span>
                  <span className="font-semibold text-gray-900">{classItem.student_count || 0}</span>
                </div>
                {classItem.room_number && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Room:</span>
                    <span className="font-semibold text-gray-900">{classItem.room_number}</span>
                  </div>
                )}
                {classItem.capacity && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Capacity:</span>
                    <span className="font-semibold text-gray-900">{classItem.capacity}</span>
                  </div>
                )}
              </div>

              {/* Teacher */}
              {classItem.class_teacher && (
                <div className="pt-3 border-t border-gray-200">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Class Teacher</p>
                      <p className="text-sm font-medium text-gray-900">
                      {classItem.class_teacher?.user?.first_name ?? 'Unknown'} {classItem.class_teacher?.user?.last_name ?? ''}
</p>
                    </div>
                  </div>
                </div>
              )}

              {/* View Students Button */}
             <div className="mt-4">
        <Link href={`/admin/students?class=${classItem.id}`}>
          <button className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
           View Students ({classItem.student_count}) →
        </button>
        </Link>
        </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add Class Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          resetForm();
        }}
        title="Add New Class"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Class Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Grade 5-A"
              required
            />

            <Select
              label="Grade Level"
              value={formData.grade_level}
              onChange={(e) => setFormData({ ...formData, grade_level: e.target.value })}
              options={[
                { value: '', label: 'Select Grade' },
                { value: '1', label: 'Grade 1' },
                { value: '2', label: 'Grade 2' },
                { value: '3', label: 'Grade 3' },
                { value: '4', label: 'Grade 4' },
                { value: '5', label: 'Grade 5' },
                { value: '6', label: 'Grade 6' },
              ]}
              required
            />

            <Input
              label="Section"
              value={formData.section}
              onChange={(e) => setFormData({ ...formData, section: e.target.value })}
              placeholder="e.g., A"
              required
            />

            <Input
              label="Nickname (Optional)"
              value={formData.nickname}
              onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
              placeholder="e.g., Eagles"
            />

            <Input
              label="Room Number"
              value={formData.room_number}
              onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
              placeholder="e.g., 201"
            />

            <Input
              label="Capacity"
              type="number"
              value={formData.capacity}
              onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
              placeholder="e.g., 30"
            />

            <Input
              label="Academic Year"
              value={formData.academic_year}
              onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })}
              placeholder="e.g., 2025-2026"
              required
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              variant="ghost"
              onClick={() => {
                setIsAddModalOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleAddClass}>
              Add Class
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Class Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedClass(null);
          resetForm();
        }}
        title="Edit Class"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Class Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Grade 5-A"
              required
            />

            <Select
              label="Grade Level"
              value={formData.grade_level}
              onChange={(e) => setFormData({ ...formData, grade_level: e.target.value })}
              options={[
                { value: '', label: 'Select Grade' },
                { value: '1', label: 'Grade 1' },
                { value: '2', label: 'Grade 2' },
                { value: '3', label: 'Grade 3' },
                { value: '4', label: 'Grade 4' },
                { value: '5', label: 'Grade 5' },
                { value: '6', label: 'Grade 6' },
              ]}
              required
            />

            <Input
              label="Section"
              value={formData.section}
              onChange={(e) => setFormData({ ...formData, section: e.target.value })}
              placeholder="e.g., A"
              required
            />

            <Input
              label="Nickname (Optional)"
              value={formData.nickname}
              onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
              placeholder="e.g., Eagles"
            />

            <Input
              label="Room Number"
              value={formData.room_number}
              onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
              placeholder="e.g., 201"
            />

            <Input
              label="Capacity"
              type="number"
              value={formData.capacity}
              onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
              placeholder="e.g., 30"
            />

            <Input
              label="Academic Year"
              value={formData.academic_year}
              onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })}
              placeholder="e.g., 2025-2026"
              required
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              variant="ghost"
              onClick={() => {
                setIsEditModalOpen(false);
                setSelectedClass(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleEditClass}>
              Update Class
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedClass(null);
        }}
        title="Delete Class"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to delete <strong>{selectedClass?.display_name || selectedClass?.name}</strong>? 
            This action cannot be undone and will affect {selectedClass?.student_count || 0} student(s).
          </p>
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              variant="ghost"
              onClick={() => {
                setIsDeleteModalOpen(false);
                setSelectedClass(null);
              }}
            >
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteClass}>
              Delete Class
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}