import React from 'react';
import { useParams } from 'react-router-dom';

function SchemaPage() {
  const { connectionId } = useParams();

  return (
    <div className="schema-page">
      <h2>Schema Explorer</h2>
      <p>Connection ID: {connectionId}</p>
    </div>
  );
}

export default SchemaPage;
