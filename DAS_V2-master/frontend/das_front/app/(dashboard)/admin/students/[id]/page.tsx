import React from 'react';

interface Props {
  params: { id: string };
}

export default function StudentDetail({ params }: Props) {
  return <div>Student Detail for {params.id}</div>;
}
