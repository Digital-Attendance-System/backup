import { useState, useEffect } from 'react';
import { api } from '../lib/api';

export function useStudents() {
  const [students, setStudents] = useState<any[]>([]);
  useEffect(() => {
    api.get('/students').then(res => setStudents(res.data));
  }, []);
  return { students };
}
