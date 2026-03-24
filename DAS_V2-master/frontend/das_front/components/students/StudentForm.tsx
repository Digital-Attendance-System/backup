'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/UI/Input';
import { Select } from '@/components/UI/Select';
import { Button } from '@/components/UI/Button';
import { Student } from '@/types';
import { classesAPI } from '@/lib/api';

interface StudentFormProps {
  student?: Student | null;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
}

export function StudentForm({ student, onSubmit, onCancel }: StudentFormProps) {
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    admission_number: student?.admission_number || '',
    first_name: student?.first_name || '',
    last_name: student?.last_name || '',
    email: student?.email || '',
    date_of_birth: student?.date_of_birth || '',
    gender: student?.gender || 'M',
    status: student?.status || 'active',
    current_class: student?.current_class || '',
    parent_name: student?.parent_name || '',
    parent_phone: student?.parent_phone || '',
    parent_email: student?.parent_email || '',
    address: student?.address || '',
    enrollment_date: student?.enrollment_date || new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const response = await classesAPI.getAll();
      setClasses(response.data.data?.results || []);
    } catch (error) {
      console.error('Failed to fetch classes:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(formData);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div>
        <h4 className="text-sm font-semibold text-gray-900 mb-4">Basic Information</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Admission Number"
            name="admission_number"
            value={formData.admission_number}
            onChange={handleChange}
            required
            placeholder="e.g., STU-2024-001"
          />
          <Input
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="student@school.com"
          />
          <Input
            label="First Name"
            name="first_name"
            value={formData.first_name}
            onChange={handleChange}
            required
          />
          <Input
            label="Last Name"
            name="last_name"
            value={formData.last_name}
            onChange={handleChange}
            required
          />
          <Input
            label="Date of Birth"
            name="date_of_birth"
            type="date"
            value={formData.date_of_birth}
            onChange={handleChange}
            required
          />
          <Select
            label="Gender"
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            required
            options={[
              { value: 'M', label: 'Male' },
              { value: 'F', label: 'Female' },
              { value: 'O', label: 'Other' },
            ]}
          />
        </div>
      </div>

      {/* School Information */}
      <div>
        <h4 className="text-sm font-semibold text-gray-900 mb-4">School Information</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Class"
            name="current_class"
            value={formData.current_class}
            onChange={handleChange}
            options={[
              { value: '', label: 'Select Class' },
              ...classes.map((cls) => ({
                value: cls.id.toString(),
                label: cls.display_name || cls.name,
              })),
            ]}
          />
          <Select
            label="Status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            required
            options={[
              { value: 'active', label: 'Active' },
              { value: 'on_leave', label: 'On Leave' },
              { value: 'inactive', label: 'Inactive' },
            ]}
          />
          <Input
            label="Enrollment Date"
            name="enrollment_date"
            type="date"
            value={formData.enrollment_date}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      {/* Parent Information */}
      <div>
        <h4 className="text-sm font-semibold text-gray-900 mb-4">Parent/Guardian Information</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Parent Name"
            name="parent_name"
            value={formData.parent_name}
            onChange={handleChange}
            required
          />
          <Input
            label="Parent Phone"
            name="parent_phone"
            type="tel"
            value={formData.parent_phone}
            onChange={handleChange}
            required
            placeholder="+1234567890"
          />
          <Input
            label="Parent Email"
            name="parent_email"
            type="email"
            value={formData.parent_email}
            onChange={handleChange}
            placeholder="parent@example.com"
          />
          <div className="md:col-span-2">
            <Input
              label="Address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              required
              placeholder="123 Main Street, City"
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end space-x-3 pt-4 border-t">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={loading}>
          {student ? 'Update Student' : 'Add Student'}
        </Button>
      </div>
    </form>
  );
}