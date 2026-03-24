import { useState, useEffect } from 'react';
import { api } from '../lib/api';

export function useAttendance() {
  const [records, setRecords] = useState<any[]>([]);
  useEffect(() => {
    api.get('/attendance').then(res => setRecords(res.data));
  }, []);
  return { records };
}
