'use client';

import { useEffect, useState } from 'react';
import { studentsAPI } from '@/lib/api';
import { Card } from '@/components/UI/Card';
import { Button } from '@/components/UI/Button';
import { Input } from '@/components/UI/Input';
import { Select } from '@/components/UI/Select';
import { Badge } from '@/components/UI/Badge';
import { Spinner } from '@/components/UI/Spinner';
import toast from 'react-hot-toast';

interface Student {
  id: number;
  admission_number: string;
  first_name: string;
  last_name: string;
  full_name: string;
  photo?: string;
  current_class?: number;
  class_name?: string;
  qr_code?: string;
  qr_code_image?: string;
  status: string;
}

export default function QRCodesPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [qrFilter, setQrFilter] = useState('with_qr'); // 'all', 'with_qr', 'without_qr'
  const [selectedQR, setSelectedQR] = useState<Student | null>(null);
  const [generating, setGenerating] = useState<number | null>(null);

  useEffect(() => {
    fetchStudents();
  }, [searchTerm, statusFilter, qrFilter]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const params: any = {};

      if (searchTerm) params.search = searchTerm;
      if (statusFilter !== 'all') params.status = statusFilter;

      const response = await studentsAPI.getAll(params);
      let studentsList = response.data.results || [];

      // Filter by QR status
      if (qrFilter === 'with_qr') {
        studentsList = studentsList.filter((s: Student) => s.qr_code || s.qr_code_image);
      } else if (qrFilter === 'without_qr') {
        studentsList = studentsList.filter((s: Student) => !s.qr_code && !s.qr_code_image);
      }

      setStudents(studentsList);
    } catch (error) {
      console.error('Failed to fetch students:', error);
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateQR = async (studentId: number) => {
  try {
    setGenerating(studentId);
    const response = await studentsAPI.generateQR(studentId);
    
    // Update the student in the local state immediately
    setStudents(prevStudents => 
      prevStudents.map(student => 
        student.id === studentId 
          ? {
              ...student,
              qr_code: response.data.data?.qr_code_data || response.data.qr_code_data,
              qr_code_image: response.data.data?.qr_code_image_url || response.data.qr_code_image_url,
            }
          : student
      )
    );
    
    toast.success('QR code generated successfully!');
  } catch (error: any) {
    console.error('Failed to generate QR:', error);
    toast.error(error.response?.data?.error || 'Failed to generate QR code');
  } finally {
    setGenerating(null);
  }
};
  const handleDownloadQR = (student: Student) => {
    if (!student.qr_code_image) {
      toast.error('No QR code image available');
      return;
    }

    const link = document.createElement('a');
    link.href = `http://127.0.0.1:8000${student.qr_code_image}`;
    link.download = `${student.admission_number}_QR.png`;
    link.click();
    toast.success('QR code downloaded!');
  };

  const handlePrintQR = (student: Student) => {
    if (!student.qr_code_image) {
      toast.error('No QR code image available');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Print QR Code - ${student.full_name}</title>
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
                max-width: 300px;
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
              <img src="http://127.0.0.1:8000${student.qr_code_image}" alt="QR Code" />
              <h2>${student.full_name}</h2>
              <p>${student.admission_number}</p>
              <p>${student.class_name || 'No Class'}</p>
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

  const handleBulkDownload = () => {
    const studentsWithQR = students.filter(s => s.qr_code_image);
    
    if (studentsWithQR.length === 0) {
      toast.error('No QR codes to download');
      return;
    }

    studentsWithQR.forEach((student, index) => {
      setTimeout(() => {
        handleDownloadQR(student);
      }, index * 500); // Stagger downloads
    });

    toast.success(`Downloading ${studentsWithQR.length} QR codes...`);
  };

  const handleGenerateAll = async () => {
    const studentsWithoutQR = students.filter(s => !s.qr_code && !s.qr_code_image);
    
    if (studentsWithoutQR.length === 0) {
      toast.error('All students already have QR codes');
      return;
    }

    const confirmed = window.confirm(`Generate QR codes for ${studentsWithoutQR.length} students?`);
    if (!confirmed) return;

    toast.loading(`Generating ${studentsWithoutQR.length} QR codes...`);

    for (const student of studentsWithoutQR) {
      try {
        await studentsAPI.generateQR(student.id);
      } catch (error) {
        console.error(`Failed for ${student.full_name}:`, error);
      }
    }

    toast.success('Bulk generation complete!');
    fetchStudents();
  };

  const stats = {
    total: students.length,
    withQR: students.filter(s => s.qr_code || s.qr_code_image).length,
    withoutQR: students.filter(s => !s.qr_code && !s.qr_code_image).length,
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">QR Codes Gallery</h1>
          <p className="text-sm text-gray-500 mt-1">View, download, and manage student QR codes</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="secondary" onClick={handleBulkDownload}>
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download All
          </Button>
          <Button onClick={handleGenerateAll}>
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
            Generate Missing
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="text-sm text-gray-600 mb-2">Total Students</div>
          <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
        </Card>
        <Card className="p-6">
          <div className="text-sm text-gray-600 mb-2">With QR Codes</div>
          <div className="text-3xl font-bold text-green-600">{stats.withQR}</div>
          <div className="text-sm text-gray-500 mt-1">
            {stats.total > 0 ? Math.round((stats.withQR / stats.total) * 100) : 0}% coverage
          </div>
        </Card>
        <Card className="p-6">
          <div className="text-sm text-gray-600 mb-2">Without QR Codes</div>
          <div className="text-3xl font-bold text-red-600">{stats.withoutQR}</div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <Input
              label="Search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or admission number..."
            />
          </div>

          <Select
            label="Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'active', label: 'Active' },
              { value: 'on_leave', label: 'On Leave' },
              { value: 'inactive', label: 'Inactive' },
            ]}
          />

          <Select
            label="QR Status"
            value={qrFilter}
            onChange={(e) => setQrFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All Students' },
              { value: 'with_qr', label: 'With QR Code' },
              { value: 'without_qr', label: 'Without QR Code' },
            ]}
          />
        </div>
      </Card>

      {/* QR Codes Grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : students.length === 0 ? (
        <Card className="p-12 text-center">
          <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
          </svg>
          <p className="text-gray-500 mb-4">No students found</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {students.map((student) => (
            <Card key={student.id} className="p-6 hover:shadow-lg transition-shadow">
              {/* Student Info */}
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 flex-shrink-0">
                  {student.photo ? (
                    <img
                      className="w-12 h-12 rounded-full object-cover"
                      src={student.photo}
                      alt={student.full_name}
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-600">
                        {student.first_name[0]}{student.last_name[0]}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{student.full_name}</h3>
                  <p className="text-sm text-gray-500">{student.admission_number}</p>
                  <p className="text-xs text-gray-400">{student.class_name || 'No Class'}</p>
                </div>
              </div>

              {/* QR Code Display */}
              {student.qr_code_image ? (
                <div className="mb-4">
                  <div className="bg-white border-4 border-blue-500 rounded-lg p-4 flex items-center justify-center">
                    <img
                      src={`http://127.0.0.1:8000${student.qr_code_image}`}
                      alt={`QR Code - ${student.full_name}`}
                      className="w-full h-auto max-w-[200px]"
                      onClick={() => setSelectedQR(student)}
                      style={{ cursor: 'pointer' }}
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-center space-x-1">
                    <Badge variant="success">QR Generated</Badge>
                  </div>
                </div>
              ) : (
                <div className="mb-4">
                  <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-8 flex items-center justify-center">
                    <div className="text-center">
                      <svg className="w-12 h-12 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                      </svg>
                      <p className="text-sm text-gray-500">No QR Code</p>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-center">
                    <Badge variant="warning">Not Generated</Badge>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="space-y-2">
                {student.qr_code_image ? (
                  <>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleDownloadQR(student)}
                        className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                      >
                        Download
                      </button>
                      <button
                        onClick={() => handlePrintQR(student)}
                        className="flex-1 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded-lg transition-colors"
                      >
                        Print
                      </button>
                    </div>
                    <button
                      onClick={() => handleGenerateQR(student.id)}
                      disabled={generating === student.id}
                      className="w-full px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-lg transition-colors disabled:opacity-50"
                    >
                      {generating === student.id ? 'Regenerating...' : 'Regenerate'}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleGenerateQR(student.id)}
                    disabled={generating === student.id}
                    className="w-full px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors disabled:opacity-50"
                  >
                    {generating === student.id ? (
                      <span className="flex items-center justify-center">
                        <Spinner size="sm" />
                        <span className="ml-2">Generating...</span>
                      </span>
                    ) : (
                      'Generate QR Code'
                    )}
                  </button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* QR Code Preview Modal */}
      {selectedQR && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedQR(null)}
        >
          <div 
            className="bg-white rounded-lg p-8 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">{selectedQR.full_name}</h2>
              <p className="text-gray-500">{selectedQR.admission_number}</p>
              <p className="text-sm text-gray-400">{selectedQR.class_name || 'No Class'}</p>
            </div>

            <div className="border-4 border-blue-500 rounded-lg p-4 mb-6">
              <img
                src={`http://127.0.0.1:8000${selectedQR.qr_code_image}`}
                alt="QR Code"
                className="w-full h-auto"
              />
            </div>

            <div className="flex space-x-3">
              <Button variant="ghost" onClick={() => setSelectedQR(null)} className="flex-1">
                Close
              </Button>
              <Button onClick={() => handleDownloadQR(selectedQR)} className="flex-1">
                Download
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}