export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  role: 'admin' | 'teacher' | 'student' | 'class_rep';
  phone?: string;
  photo?: string;
  student_id?: number; // For students, link to their student profile
  is_active: boolean;
}
export interface Student {
  id: number;
  admission_number: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email?: string;
  photo?: string;
  date_of_birth: string;
  gender: 'M' | 'F' | 'O';
  status: 'active' | 'on_leave' | 'inactive';
  current_class?: number;
  class_name?: string;
  parent_name: string;
  parent_phone: string;
  parent_email?: string;
  address: string;
  enrollment_date: string;
  age: number;
  is_birthday_today: boolean;
  qr_code?: string | null;  
  qr_code_image?: string | null;  
}
interface Class {
  id: number;
  name: string;
  grade_level: number;
  section: string;
  nickname?: string;
  display_name: string;
  academic_year: string;
  school?: number; 
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
  created_at: string;
}

export interface Grade {
  id: number;
  name: string;
  level: number;
  school_year: string;
  is_active: boolean;
}

export interface Term {
  id: number;
  name: string;
  term_number: number;
  start_date: string;
  end_date: string;
  is_current: boolean;
  is_active: boolean;
}

export interface Subject {
  id: number;
  name: string;
  code: string;
  teacher?: number;
  teacher_name?: string;
  is_active: boolean;
}

export interface AttendanceRecord {
  student_id: number;
  status: 'P' | 'A' | 'L' | 'E';
}

export interface DashboardStats {
  total_students: number;
  students_change_percentage: number;
  todays_attendance: {
    percentage: number;
    status: string;
  };
  active_classes: number;
  total_absentees_today: number;
  alert: boolean;
}