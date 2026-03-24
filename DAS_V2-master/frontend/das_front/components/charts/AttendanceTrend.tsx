'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface TrendData {
  day: string;
  percentage: number;
}

interface AttendanceTrendChartProps {
  data: TrendData[];
}

export function AttendanceTrendChart({ data }: AttendanceTrendChartProps) {
  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="day" 
            stroke="#9ca3af"
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            stroke="#9ca3af"
            style={{ fontSize: '12px' }}
            domain={[0, 100]}
          />
          <Tooltip 
  contentStyle={{
    backgroundColor: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
  }}
  formatter={(value: number | undefined) => {
    if (value === undefined) return ['N/A', 'Attendance'];
    return [`${value}%`, 'Attendance'];
  }}
/>
          <Line 
            type="monotone" 
            dataKey="percentage" 
            stroke="#2563eb" 
            strokeWidth={3}
            dot={{ fill: '#2563eb', r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}