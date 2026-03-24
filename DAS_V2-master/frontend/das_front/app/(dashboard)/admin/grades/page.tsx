'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/UI/Card';
import { Button } from '@/components/UI/Button';
import { Modal } from '@/components/UI/Modal';
import { Input } from '@/components/UI/Input';
import { Spinner } from '@/components/UI/Spinner';
import toast from 'react-hot-toast';

// We'll need to add these API functions
const gradesAPI = {
  getAll: () => fetch('/api/grades').then(r => r.json()),
  create: (data: any) => fetch('/api/grades', { method: 'POST', body: JSON.stringify(data) }),
  delete: (id: number) => fetch(`/api/grades/${id}`, { method: 'DELETE' }),
};

export default function GradesPage() {
  const [grades, setGrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    level: '',
    description: '',
  });

  useEffect(() => {
    fetchGrades();
  }, []);

  const fetchGrades = async () => {
    try {
      setLoading(true);
      // Mock data for now - replace with actual API call
      setGrades([
        { id: 1, name: 'Grade 1', level: 1, description: 'First grade' },
        { id: 2, name: 'Grade 2', level: 2, description: 'Second grade' },
        { id: 3, name: 'Grade 3', level: 3, description: 'Third grade' },
        { id: 4, name: 'Grade 4', level: 4, description: 'Fourth grade' },
        { id: 5, name: 'Grade 5', level: 5, description: 'Fifth grade' },
        { id: 6, name: 'Grade 6', level: 6, description: 'Sixth grade' },
      ]);
    } catch (error) {
      console.error('Failed to fetch grades:', error);
      toast.error('Failed to load grades');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      // Mock - replace with actual API call
      toast.success('Grade added successfully!');
      setIsAddModalOpen(false);
      fetchGrades();
    } catch (error) {
      toast.error('Failed to add grade');
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Academic Grades</h1>
          <p className="text-sm text-gray-500 mt-1">Manage grade levels</p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)}>
          + Add Grade
        </Button>
      </div>

      {/* Grades Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-3 flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : (
          grades.map((grade) => (
            <Card key={grade.id} className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-xl font-bold text-blue-600">{grade.level}</span>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">{grade.name}</h3>
              <p className="text-sm text-gray-500 mt-1">{grade.description}</p>
            </Card>
          ))
        )}
      </div>

      {/* Add Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Grade"
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Grade Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Grade 1"
          />
          <Input
            label="Level"
            type="number"
            value={formData.level}
            onChange={(e) => setFormData({ ...formData, level: e.target.value })}
            placeholder="e.g., 1"
          />
          <Input
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="e.g., First grade"
          />
          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="ghost" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              Add Grade
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}