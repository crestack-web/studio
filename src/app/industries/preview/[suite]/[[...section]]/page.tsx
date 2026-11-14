'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { SolutionsDashboard } from '../../../_design/SolutionsDashboard';
import { isSolutionsSuiteId } from '../../../_design/suites';

export default function SolutionsPreviewPage() {
  const params = useParams<{ suite: string; section?: string[] }>();
  const rawSuite = typeof params?.suite === 'string' ? params.suite : 'hospitality';
  const suiteId = isSolutionsSuiteId(rawSuite) ? rawSuite : 'hospitality';
  const sections = Array.isArray(params?.section)
    ? params.section
    : params?.section
      ? [params.section]
      : [];
  const section = sections[0] || 'overview';

  return (
    <SolutionsDashboard
      suiteId={suiteId}
      section={section}
      basePath="/industries/preview"
    />
  );
}
