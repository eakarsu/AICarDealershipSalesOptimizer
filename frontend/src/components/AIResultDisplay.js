import React from 'react';
import AIReport from './AIReport';
export default function AIResultDisplay({ result, loading, error, type }) {
  return <AIReport response={result} loading={loading} error={error} title={type ? `${type.replace(/-/g, ' ')} analysis` : 'AI analysis'} />;
}
