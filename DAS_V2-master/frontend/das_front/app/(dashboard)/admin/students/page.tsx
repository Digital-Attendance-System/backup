'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { studentsAPI, classesAPI } from '@/lib/api';
import { Student } from '@/types';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/Button';
import { Modal } from '@/components/UI/Modal';
import { StudentForm } from '@/components/students/StudentForm';
import { Spinner } from '@/components/UI/Spinner';
import toast from 'react-hot-toast';

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [gradeFilter, setGradeFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const searchParams = useSearchParams();
  const classIdParam = searchParams.get('classId');
  const classId = classIdParam ? Number(classIdParam) : null;
  const [classTitle, setClassTitle] = useState<string | null>(null);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Add these new states
const [isQRModalOpen, setIsQRModalOpen] = useState(false);
const [selectedStudentQR, setSelectedStudentQR] = useState<any>(null);
const [qrLoading, setQrLoading] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, [searchTerm, statusFilter, gradeFilter, currentPage, classId]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      if (!classId) {
        setClassTitle(null);
      }

      if (classId) {
        const response = await classesAPI.getStudents(classId);
        const classData = response.data.data;
        setStudents(classData?.students || []);
        setClassTitle(classData?.class?.display_name || classData?.class?.name || `Class ${classId}`);
        setTotalPages(1);
        return;
      }

      const params: any = { page: currentPage };

      if (searchTerm) params.search = searchTerm;
      if (statusFilter !== 'all') params.status = statusFilter;
      if (gradeFilter !== 'all') params.grade = gradeFilter;

      const response = await studentsAPI.getAll(params);
      setStudents(response.data.results || []);
      
      const total = response.data.count || 0;
      setTotalPages(Math.ceil(total / 20));
    } catch (error) {
      console.error('Failed to fetch students:', error);
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const handleAddStudent = async (data: any) => {
    try {
      await studentsAPI.create(data);
      toast.success('Student added successfully!');
      setIsAddModalOpen(false);
      fetchStudents();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to add student');
      throw error;
    }
  };

  const handleEditStudent = async (data: any) => {
    if (!selectedStudent) return;
    
    try {
      await studentsAPI.update(selectedStudent.id, data);
      toast.success('Student updated successfully!');
      setIsEditModalOpen(false);
      setSelectedStudent(null);
      fetchStudents();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update student');
      throw error;
    }
  };

  const handleDeleteStudent = async () => {
    if (!selectedStudent) return;

    try {
      await studentsAPI.delete(selectedStudent.id);
      toast.success('Student deleted successfully!');
      setIsDeleteModalOpen(false);
      setSelectedStudent(null);
      fetchStudents();
    } catch (error) {
      toast.error('Failed to delete student');
    }
  };


  const handleGenerateQR = async (student: Student) => {
  try {
    setQrLoading(true);
    setSelectedStudentQR(null);
    
    // If QR already exists, just fetch it
    if (student.qr_code) {
      const response = await studentsAPI.getQRCode(student.id);
      setSelectedStudentQR(response.data.data);
    } else {
      // Generate new QR code
      const response = await studentsAPI.generateQR(student.id);
      setSelectedStudentQR(response.data.data);
      toast.success('QR code generated successfully!');
      fetchStudents(); // Refresh list
    }
    
    setIsQRModalOpen(true);
  } catch (error: any) {
    console.error('Failed to generate QR:', error);
    toast.error(error.response?.data?.error || 'Failed to generate QR code');
  } finally {
    setQrLoading(false);
  }
};

const handleDownloadQR = () => {
  if (!selectedStudentQR?.qr_code_image_url) return;
  
  const link = document.createElement('a');
  link.href = `http://127.0.0.1:8000${selectedStudentQR.qr_code_image_url}`;
  link.download = `${selectedStudentQR.admission_number}_QR.png`;
  link.click();
  toast.success('QR code downloaded!');
};

const handlePrintQR = () => {
  if (!selectedStudentQR?.qr_code_image_url) return;
  
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(`
      <html>
        <head>
          <title>Print QR Code - ${selectedStudentQR.full_name}</title>
          <style>
            body {
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              margin: 0;
              font-family: Arial, sans-serif;
            }
            .print-container {
              text-align: center;
              padding: 40px;
            }
            img {
              border: 2px solid #000;
              padding: 20px;
              background: white;
            }
            h2 {
              margin-top: 20px;
              font-size: 24px;
            }
            p {
              font-size: 18px;
              color: #666;
            }
            @media print {
              .no-print {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="print-container">
            <img src="http://127.0.0.1:8000${selectedStudentQR.qr_code_image_url}" alt="QR Code" />
            <h2>${selectedStudentQR.full_name}</h2>
            <p>${selectedStudentQR.admission_number}</p>
            <button class="no-print" onclick="window.print()" style="margin-top: 20px; padding: 10px 20px; font-size: 16px; cursor: pointer;">
              Print
            </button>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  }
};


  const openEditModal = (student: Student) => {
    setSelectedStudent(student);
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (student: Student) => {
    setSelectedStudent(student);
    setIsDeleteModalOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="success">Active</Badge>;
      case 'on_leave':
        return <Badge variant="warning">On Leave</Badge>;
      case 'inactive':
        return <Badge variant="error">Inactive</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {classTitle ? `Students — ${classTitle}` : 'Students'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage student records and information</p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)}>
          + Add Student
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <input
              type="text"
              placeholder="Search by name, admission number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent  text-gray-900 placeholder-gray-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="on_leave">On Leave</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Grade
            </label>
            <select
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
            >
              <option value="all">All Grades</option>
              <option value="1">Grade 1</option>
              <option value="2">Grade 2</option>
              <option value="3">Grade 3</option>
              <option value="4">Grade 4</option>
              <option value="5">Grade 5</option>
              <option value="6">Grade 6</option>
            </select>
          </div>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center">
            <Spinner size="lg" />
          </div>
        ) : students.length === 0 ? (
          <div className="p-12 text-center">
            <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <p className="text-gray-500 mb-4">No students found</p>
            <Button onClick={() => setIsAddModalOpen(true)}>
              Add Your First Student
            </Button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-grey-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Admission No.
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Class
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Parent Contact
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {students.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 flex-shrink-">
                            {student.photo ? (
                              <img
                                className="w-10 h-10 rounded-full object-cover"
                                src={student.photo}
                                alt={student.full_name}
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-grey-500 flex items-center justify-center">
                                <span className="text-sm font-medium text-grey-600">
                                  {student.first_name[0]}{student.last_name[0]}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {student.full_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {student.email || 'No email'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {student.admission_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {student.class_name || 'Not assigned'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(student.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{student.parent_name}</div>
                        <div className="text-sm text-gray-500">{student.parent_phone}</div>
                      </td>
                     <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
  <button
    onClick={() => openEditModal(student)}
    className="text-blue-600 hover:text-blue-900"
  >
    Edit
  </button>
  <button
    onClick={() => handleGenerateQR(student)}
    className="text-green-600 hover:text-green-900"
  >
    {student.qr_code ? 'View QR' : 'Generate QR'}
  </button>
  <button
    onClick={() => openDeleteModal(student)}
    className="text-red-600 hover:text-red-900"
  >
    Delete
  </button>
</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-white px-6 py-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>

                    {/* QR Code Modal */}
<Modal
  isOpen={isQRModalOpen}
  onClose={() => {
    setIsQRModalOpen(false);
    setSelectedStudentQR(null);
  }}
  title="Student QR Code"
  size="md"
>
  {qrLoading ? (
    <div className="flex justify-center py-12">
      <Spinner size="lg" />
    </div>
  ) : selectedStudentQR ? (
    <div className="space-y-6">
      {/* Student Info */}
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900">
          {selectedStudentQR.full_name}
        </h3>
        <p className="text-sm text-gray-500">
          {selectedStudentQR.admission_number}
        </p>
      </div>

      {/* QR Code Image */}
      <div className="flex justify-center">
        <div className="border-4 border-blue-500 rounded-lg p-4 bg-white">
          {selectedStudentQR.qr_code_image_url ? (
            <img
              src={`http://127.0.0.1:8000${selectedStudentQR.qr_code_image_url}`}
              alt="Student QR Code"
              className="w-64 h-64"
            />
          ) : (
            <div className="w-64 h-64 flex items-center justify-center bg-gray-100">
              <p className="text-gray-500">QR Code not available</p>
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2">
          📱 How to use this QR code:
        </h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Download and print this QR code</li>
          <li>• Attach to student's ID card</li>
          <li>• Scan during attendance using QR scanner</li>
          <li>• Student will be marked present automatically</li>
        </ul>
      </div>

      {/* QR Data (for debugging - optional) */}
      <div className="bg-gray-50 rounded-lg p-3">
        <p className="text-xs text-gray-500 font-mono break-all">
          {selectedStudentQR.qr_code_data}
        </p>
      </div>

      {/* Actions */}
      <div className="flex space-x-3 pt-4 border-t">
        <Button
          variant="secondary"
          onClick={handleDownloadQR}
          className="flex-1"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download
        </Button>
        <Button
          variant="secondary"
          onClick={handlePrintQR}
          className="flex-1"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Print
        </Button>
        <Button
          onClick={() => {
            setIsQRModalOpen(false);
            setSelectedStudentQR(null);
          }}
          className="flex-1"
        >
          Close
        </Button>
      </div>
    </div>
  ) : null}
</Modal>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add Student Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Student"
        size="xl"
      >
        <StudentForm
          onSubmit={handleAddStudent}
          onCancel={() => setIsAddModalOpen(false)}
        />
      </Modal>

      {/* Edit Student Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedStudent(null);
        }}
        title="Edit Student"
        size="xl"
      >
        <StudentForm
          student={selectedStudent}
          onSubmit={handleEditStudent}
          onCancel={() => {
            setIsEditModalOpen(false);
            setSelectedStudent(null);
          }}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedStudent(null);
        }}
        title="Delete Student"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to delete <strong>{selectedStudent?.full_name}</strong>? 
            This action cannot be undone.
          </p>
          <div className="flex justify-end space-x-3">
            <Button
              variant="ghost"
              onClick={() => {
                setIsDeleteModalOpen(false);
                setSelectedStudent(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteStudent}
            >
              Delete Student
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}