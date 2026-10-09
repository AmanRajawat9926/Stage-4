import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from './App';
import { sanitizeText } from './Components/JobCard';

describe('Job Application Tracker - Core Requirements', () => {
  it('sanitizes text safely by removing hazardous markup', () => {
    const dirtyInput = '  <script>alert("xss")</script>Frontend Developer  ';
    const cleaned = sanitizeText(dirtyInput);

    expect(cleaned).not.toContain('<script>');
    expect(cleaned).toContain('Frontend Developer');
  });

  it('switches navigation between Tracker and Job Board views', async () => {
    render(<App />);

    // Queries role="tab" and matches "External Job Board"
    const jobBoardTab = screen.getByRole('tab', { name: /External Job Board/i });
    fireEvent.click(jobBoardTab);

    expect(jobBoardTab).toHaveClass('active');

    // Wait for asynchronous state/fetch updates inside JobBoard to settle
    await waitFor(() => {
      expect(jobBoardTab).toHaveClass('active');
    });
  });

  it('tracks a job into the application list at Applied status', async () => {
    render(<App />);

    // Queries role="tab" with correct accessible names
    const jobBoardTab = screen.getByRole('tab', { name: /External Job Board/i });
    fireEvent.click(jobBoardTab);

    const trackerTab = screen.getByRole('tab', { name: /My Applications/i });
    fireEvent.click(trackerTab);

    await waitFor(() => {
      expect(screen.getByText(/CareerSuite Tracker/i)).toBeInTheDocument();
    });
  });
});