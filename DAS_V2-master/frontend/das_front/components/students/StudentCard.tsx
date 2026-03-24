import React from 'react';

export const StudentCard: React.FC<{ name: string }> = ({ name }) => (
  <div className="student-card">{name}</div>
);
