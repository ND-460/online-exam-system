// Report generation utilities for the online exam system
import html2canvas from 'html2canvas';

export const generateStudentReport = (studentData, examResults) => {
  const report = {
    student: {
      name: studentData.name,
      email: studentData.email,
      studentId: studentData.studentId,
    },
    summary: {
      totalExams: examResults.length,
      averageScore: calculateAverageScore(examResults),
      highestScore: Math.max(...examResults.map(r => r.score)),
      lowestScore: Math.min(...examResults.map(r => r.score)),
      passRate: calculatePassRate(examResults),
    },
    examDetails: examResults.map(result => ({
      examName: result.examName,
      score: result.score,
      totalQuestions: result.totalQuestions,
      correctAnswers: result.correctAnswers,
      wrongAnswers: result.wrongAnswers,
      timeSpent: result.timeSpent,
      date: result.date,
      status: result.score >= 50 ? 'Passed' : 'Failed',
    })),
    performance: {
      strongSubjects: getStrongSubjects(examResults),
      weakSubjects: getWeakSubjects(examResults),
      improvementAreas: getImprovementAreas(examResults),
    },
    generatedAt: new Date().toISOString(),
  };

  return report;
};

export const generateTeacherReport = (teacherData, examData, studentResults) => {
  const report = {
    teacher: {
      name: teacherData.name,
      email: teacherData.email,
      teacherId: teacherData.teacherId,
    },
    summary: {
      totalExams: examData.length,
      totalStudents: new Set(studentResults.map(r => r.studentId)).size,
      averageClassScore: calculateAverageScore(studentResults),
      passRate: calculatePassRate(studentResults),
    },
    examAnalysis: examData.map(exam => {
      const examResults = studentResults.filter(r => r.examId === exam._id);
      return {
        examName: exam.title,
        totalStudents: examResults.length,
        averageScore: calculateAverageScore(examResults),
        passRate: calculatePassRate(examResults),
        difficulty: analyzeExamDifficulty(examResults),
      };
    }),
    studentPerformance: {
      topPerformers: getTopPerformers(studentResults, 5),
      strugglingStudents: getStrugglingStudents(studentResults),
      classDistribution: getScoreDistribution(studentResults),
    },
    generatedAt: new Date().toISOString(),
  };

  return report;
};

export const generateAdminReport = (systemData) => {
  const report = {
    systemOverview: {
      totalUsers: systemData.totalUsers,
      totalExams: systemData.totalExams,
      totalSubmissions: systemData.totalSubmissions,
      systemUptime: systemData.systemUptime,
    },
    performance: {
      averageResponseTime: systemData.averageResponseTime,
      successRate: systemData.successRate,
      errorRate: systemData.errorRate,
    },
    usage: {
      dailyActiveUsers: systemData.dailyActiveUsers,
      monthlyActiveUsers: systemData.monthlyActiveUsers,
      peakUsageHours: systemData.peakUsageHours,
    },
    generatedAt: new Date().toISOString(),
  };

  return report;
};

// ================= Teacher & Student Analytics PDF (Demo Style) =================
// These functions generate structured PDF-friendly HTML (no canvas) for ONLY
// admin -> teacher/student analytics modals without touching other downloads.

export const exportTeacherAnalyticsPdf = (teacher, comprehensive) => {
  try {
    if (!teacher) {
      alert('Teacher data not ready yet.');
      return;
    }
    const overview = comprehensive?.overview || {};
    const testResults = comprehensive?.testResults || [];
    const tests = comprehensive?.teacherTests || [];

    const totalAvg = (() => {
      const withSubs = testResults.filter(t => (t.submissionCount||0) > 0);
      if (!withSubs.length) return 0;
      const sum = withSubs.reduce((s,t)=> s + Number(t.averagePercentage||0), 0);
      return Math.round((sum/withSubs.length)*100)/100;
    })();

    const styles = `
      <style>
        @page { size: A4 landscape; margin: 14mm; }
        body { font-family: system-ui,-apple-system,'Segoe UI',Roboto,sans-serif; margin:0; padding:0; color:#111827; }
        h1 { font-size:24px; margin:0 0 4px; }
        h2 { font-size:16px; margin:24px 0 8px; }
        .subtitle { font-size:12px; color:#6b7280; margin-bottom:20px; }
        .grid { display:grid; gap:12px; }
        .grid-4 { grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); }
        .card { background:#ffffff; border:1px solid #e5e7eb; border-radius:10px; padding:12px 14px; }
        .metric-label { font-size:11px; text-transform:uppercase; letter-spacing:.5px; color:#64748b; }
        .metric-value { font-size:22px; font-weight:600; margin-top:4px; }
        table { width:100%; border-collapse:collapse; font-size:12px; }
        th,td { padding:8px 10px; border-bottom:1px solid #e5e7eb; text-align:left; }
        th { background:#f1f5f9; font-weight:600; font-size:11px; color:#334155; }
        tr:last-child td { border-bottom:none; }
        .badge-row { display:flex; gap:8px; flex-wrap:wrap; margin-top:4px; }
        .badge { background:#f1f5f9; padding:4px 8px; font-size:10px; border-radius:9999px; border:1px solid #e2e8f0; }
        .summary { display:flex; gap:28px; margin:24px 0 4px; }
        .summary-item { text-align:center; }
        .summary-item .val { font-size:28px; font-weight:700; }
        .muted { color:#64748b; font-size:11px; }
        .section { page-break-inside:avoid; }
        .footer { margin-top:28px; font-size:10px; color:#94a3b8; text-align:center; }
      </style>`;

    const testsTableRows = testResults.map(r => `
      <tr>
        <td>${r.testName || '—'}</td>
        <td>${r.submissionCount || 0}</td>
        <td>${r.averagePercentage ? (Math.round(r.averagePercentage*100)/100)+'%' : '0%'}</td>
        <td>${r.date ? new Date(r.date).toLocaleDateString() : '—'}</td>
      </tr>`).join('') || '<tr><td colspan="4">No tests created.</td></tr>';

    const doc = `<!DOCTYPE html><html><head><meta charset='utf-8'/>${styles}</head><body>
      <h1>Teacher Analytics Report</h1>
      <div class='subtitle'>Teacher: ${teacher.name || teacher.email || 'N/A'} • Generated: ${new Date().toLocaleString()}</div>
      <div class='grid grid-4 section'>
        <div class='card'><div class='metric-label'>Total Tests</div><div class='metric-value'>${overview.totalTests||0}</div></div>
        <div class='card'><div class='metric-label'>Published</div><div class='metric-value'>${overview.publishedTests||0}</div></div>
        <div class='card'><div class='metric-label'>Completed</div><div class='metric-value'>${overview.completedTests||0}</div></div>
        <div class='card'><div class='metric-label'>Drafts</div><div class='metric-value'>${overview.draftTests||0}</div></div>
        <div class='card'><div class='metric-label'>Total Submissions</div><div class='metric-value'>${overview.totalSubmissions||0}</div></div>
        <div class='card'><div class='metric-label'>Average %</div><div class='metric-value'>${totalAvg}%</div></div>
      </div>
      <h2>Tests Overview</h2>
      <table class='section'>
        <thead><tr><th>Test</th><th>Submissions</th><th>Average %</th><th>Date</th></tr></thead>
        <tbody>${testsTableRows}</tbody>
      </table>
      <div class='footer'>Confidential • ${location.hostname}</div>
    </body></html>`;

    const w = window.open('', '_blank');
    if (!w) { alert('Allow popups to download PDF.'); return; }
    w.document.open();
    w.document.write(doc);
    w.document.close();
    w.onload = () => { w.focus(); w.print(); };
  } catch (e) {
    console.error('Teacher PDF generation failed', e);
    alert('Failed to generate teacher PDF');
  }
};

export const exportStudentAnalyticsPdf = (student, comprehensive) => {
  try {
    if (!student) { alert('Student data not ready yet.'); return; }
    const counts = comprehensive?.counts || { upcoming:0, ongoing:0, completed:0 };
    const results = comprehensive?.results || [];
    const avgScore = comprehensive?.avgScore ?? 0;
    const totalAssigned = (counts.upcoming||0)+(counts.ongoing||0)+(counts.completed||0);

    const styles = `
      <style>
        @page { size:A4 portrait; margin:15mm; }
        body { font-family: system-ui,-apple-system,'Segoe UI',Roboto,sans-serif; margin:0; padding:0; color:#111827; }
        h1 { font-size:24px; margin:0 0 6px; }
        h2 { font-size:16px; margin:22px 0 8px; }
        .subtitle { font-size:12px; color:#6b7280; margin-bottom:18px; }
        .grid { display:grid; gap:12px; grid-template-columns:repeat(auto-fit,minmax(150px,1fr)); }
        .card { background:#fff; border:1px solid #e2e8f0; border-radius:10px; padding:10px 12px; }
        .metric-label { font-size:11px; text-transform:uppercase; color:#64748b; letter-spacing:.5px; }
        .metric-value { font-size:20px; font-weight:600; margin-top:4px; }
        table { width:100%; border-collapse:collapse; font-size:12px; }
        th,td { padding:8px 9px; border-bottom:1px solid #e5e7eb; text-align:left; }
        th { background:#f8fafc; font-weight:600; font-size:11px; }
        tr:last-child td { border-bottom:none; }
        .footer { margin-top:26px; font-size:10px; text-align:center; color:#94a3b8; }
        .section { page-break-inside:avoid; }
      </style>`;

    const resultsRows = results.slice(0,25).map(r => `
      <tr>
        <td>${r.testId?.testName || r.testName || '—'}</td>
        <td>${r.score}</td>
        <td>${r.outOfMarks || r.testId?.outOfMarks || 0}</td>
      </tr>`).join('') || '<tr><td colspan="3">No test results yet.</td></tr>';

    const doc = `<!DOCTYPE html><html><head><meta charset='utf-8'/>${styles}</head><body>
      <h1>Student Analytics Report</h1>
      <div class='subtitle'>Student: ${student.name || student.email || 'N/A'} • Generated: ${new Date().toLocaleString()}</div>
      <div class='grid section'>
        <div class='card'><div class='metric-label'>Assigned</div><div class='metric-value'>${totalAssigned}</div></div>
        <div class='card'><div class='metric-label'>Completed</div><div class='metric-value'>${counts.completed||0}</div></div>
        <div class='card'><div class='metric-label'>Ongoing</div><div class='metric-value'>${counts.ongoing||0}</div></div>
        <div class='card'><div class='metric-label'>Upcoming</div><div class='metric-value'>${counts.upcoming||0}</div></div>
        <div class='card'><div class='metric-label'>Average %</div><div class='metric-value'>${avgScore}%</div></div>
      </div>
      <h2>Recent Test Results</h2>
      <table class='section'>
        <thead><tr><th>Test</th><th>Score</th><th>Out Of</th></tr></thead>
        <tbody>${resultsRows}</tbody>
      </table>
      <div class='footer'>Confidential • ${location.hostname}</div>
    </body></html>`;

    const w = window.open('', '_blank');
    if (!w) { alert('Allow popups to download PDF.'); return; }
    w.document.open(); w.document.write(doc); w.document.close();
    w.onload = () => { w.focus(); w.print(); };
  } catch (e) {
    console.error('Student PDF generation failed', e);
    alert('Failed to generate student PDF');
  }
};

// Helper functions
const calculateAverageScore = (results) => {
  if (!results || results.length === 0) return 0;
  const total = results.reduce((sum, result) => sum + result.score, 0);
  return Math.round(total / results.length);
};

const calculatePassRate = (results) => {
  if (!results || results.length === 0) return 0;
  const passed = results.filter(result => result.score >= 50).length;
  return Math.round((passed / results.length) * 100);
};

const getStrongSubjects = (results) => {
  const subjectScores = {};
  results.forEach(result => {
    if (!subjectScores[result.subject]) {
      subjectScores[result.subject] = [];
    }
    subjectScores[result.subject].push(result.score);
  });

  return Object.entries(subjectScores)
    .map(([subject, scores]) => ({
      subject,
      averageScore: calculateAverageScore(scores.map(score => ({ score }))),
    }))
    .filter(item => item.averageScore >= 80)
    .sort((a, b) => b.averageScore - a.averageScore);
};

const getWeakSubjects = (results) => {
  const subjectScores = {};
  results.forEach(result => {
    if (!subjectScores[result.subject]) {
      subjectScores[result.subject] = [];
    }
    subjectScores[result.subject].push(result.score);
  });

  return Object.entries(subjectScores)
    .map(([subject, scores]) => ({
      subject,
      averageScore: calculateAverageScore(scores.map(score => ({ score }))),
    }))
    .filter(item => item.averageScore < 60)
    .sort((a, b) => a.averageScore - b.averageScore);
};

const getImprovementAreas = (results) => {
  const weakSubjects = getWeakSubjects(results);
  return weakSubjects.map(subject => ({
    area: subject.subject,
    currentScore: subject.averageScore,
    targetScore: 70,
    improvementNeeded: 70 - subject.averageScore,
  }));
};

const getTopPerformers = (results, limit = 5) => {
  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(result => ({
      studentName: result.studentName,
      score: result.score,
      examName: result.examName,
    }));
};

const getStrugglingStudents = (results) => {
  return results
    .filter(result => result.score < 50)
    .map(result => ({
      studentName: result.studentName,
      score: result.score,
      examName: result.examName,
      needsAttention: true,
    }));
};

const getScoreDistribution = (results) => {
  const distribution = {
    '90-100': 0,
    '80-89': 0,
    '70-79': 0,
    '60-69': 0,
    '50-59': 0,
    '0-49': 0,
  };

  results.forEach(result => {
    const score = result.score;
    if (score >= 90) distribution['90-100']++;
    else if (score >= 80) distribution['80-89']++;
    else if (score >= 70) distribution['70-79']++;
    else if (score >= 60) distribution['60-69']++;
    else if (score >= 50) distribution['50-59']++;
    else distribution['0-49']++;
  });

  return distribution;
};

const analyzeExamDifficulty = (results) => {
  const averageScore = calculateAverageScore(results);
  if (averageScore >= 80) return 'Easy';
  if (averageScore >= 60) return 'Medium';
  return 'Hard';
};

// Export functions for PDF generation
export const exportToPDF = (report, filename) => {
  // This would integrate with a PDF generation library like jsPDF
  console.log('Exporting report to PDF:', filename, report);
  // Implementation would depend on the PDF library used
};

export const exportToCSV = (data, filename) => {
  // Convert data to CSV format
  const headers = Object.keys(data[0] || {});
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(header => row[header] || '').join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  window.URL.revokeObjectURL(url);
};

// Download chart data as CSV
export const downloadChartDataAsCSV = (chartType, data) => {
  if (!data || data.length === 0) {
    console.warn('No data available for download');
    return;
  }

  const filename = `${chartType}-${new Date().toISOString().split('T')[0]}.csv`;
  exportToCSV(data, filename);
};

// Download complete report as PDF
export const downloadCompleteReport = (data, filename = 'Analytics_Report') => {
  if (!data || Object.keys(data).length === 0) {
    console.warn('No data available for complete report');
    return;
  }

  // Determine report type and format accordingly
  let reportContent = '';
  
  if (data.teacherName) {
    // Teacher Analytics Report - Enhanced Professional Format
    const testResultsTable = data.testResults && data.testResults.length > 0 
      ? data.testResults.map((test, index) => `
          <tr style="background: ${index % 2 === 0 ? '#f9fafb' : 'white'};">
            <td style="font-weight: 500;">${test.testName || 'Unnamed Test'}</td>
            <td style="text-align: center; color: #059669; font-weight: bold;">${test.submissionCount || 0}</td>
            <td style="text-align: center;">
              <span style="background: ${(test.averagePercentage || 0) >= 75 ? '#10b981' : (test.averagePercentage || 0) >= 50 ? '#f59e0b' : '#ef4444'}; 
                           color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;">
                ${(test.averagePercentage || 0).toFixed(1)}%
              </span>
            </td>
            <td style="color: #6b7280;">${test.date ? new Date(test.date).toLocaleDateString() : 'N/A'}</td>
          </tr>
        `).join('')
      : '<tr><td colspan="4" style="text-align: center; color: #9ca3af; padding: 30px; font-style: italic;">No test data available</td></tr>';
    
    // Create chart visualization
    const maxSubmissions = data.testResults && data.testResults.length > 0 
      ? Math.max(...data.testResults.map(t => t.submissionCount || 0))
      : 1;
    
    const chartBars = data.testResults && data.testResults.length > 0
      ? data.testResults.slice(0, 8).map((test, index) => {
          const height = Math.max((test.submissionCount / maxSubmissions) * 180, 15);
          const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'];
          return `
            <div style="display: flex; flex-direction: column; align-items: center; margin: 0 8px;">
              <div style="
                width: 40px; 
                height: ${height}px; 
                background: linear-gradient(to top, ${colors[index % colors.length]}, ${colors[index % colors.length]}dd);
                border-radius: 4px 4px 0 0;
                display: flex;
                align-items: end;
                justify-content: center;
                color: white;
                font-size: 11px;
                font-weight: bold;
                padding-bottom: 4px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
              ">
                ${test.submissionCount || 0}
              </div>
              <div style="
                width: 50px;
                font-size: 9px;
                text-align: center;
                margin-top: 8px;
                color: #6b7280;
                word-wrap: break-word;
                line-height: 1.2;
              ">
                ${(test.testName || 'Test').length > 12 ? (test.testName || 'Test').substring(0, 12) + '...' : (test.testName || 'Test')}
              </div>
            </div>
          `;
        }).join('')
      : '<div style="text-align: center; color: #9ca3af; padding: 60px; font-style: italic;">No test data available for visualization</div>';
    
    reportContent = `
      <!DOCTYPE html>
    <html>
      <head>
          <title>${filename} - ${new Date().toLocaleDateString()}</title>
          <meta charset="utf-8">
        <style>
            * { box-sizing: border-box; }
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              margin: 0; 
              padding: 30px; 
              line-height: 1.6; 
              color: #1f2937; 
              background: #ffffff;
            }
            .report-container { max-width: 1200px; margin: 0 auto; }
            .header { 
              text-align: center; 
              margin-bottom: 40px; 
              padding: 30px;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              border-radius: 12px;
              color: white;
              box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
            }
            .header h1 { 
              font-size: 28px; 
              margin: 0 0 10px 0; 
              font-weight: 700;
              text-shadow: 0 2px 4px rgba(0,0,0,0.3);
            }
            .header .subtitle { 
              font-size: 16px; 
              opacity: 0.9; 
              margin: 5px 0;
              font-weight: 300;
            }
            .section { 
              margin: 25px 0; 
              padding: 25px; 
              background: #ffffff; 
              border-radius: 12px; 
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
              border: 1px solid #e5e7eb;
            }
            .section h2 { 
              color: #1e40af; 
              margin: 0 0 20px 0; 
              font-size: 20px; 
              font-weight: 600;
              border-bottom: 2px solid #dbeafe;
              padding-bottom: 8px;
            }
            .stats-grid { 
              display: grid; 
              grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
              gap: 20px; 
              margin: 20px 0; 
            }
            .stat-card { 
              background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
              padding: 20px; 
              border-radius: 10px; 
              border-left: 5px solid #10b981; 
              box-shadow: 0 2px 8px rgba(0,0,0,0.1);
              transition: transform 0.2s;
            }
            .stat-card:hover { transform: translateY(-2px); }
            .stat-number { 
              font-size: 32px; 
              font-weight: 700; 
              color: #10b981; 
              margin-bottom: 5px;
              text-shadow: 0 1px 2px rgba(16, 185, 129, 0.2);
            }
            .stat-label { 
              color: #6b7280; 
              font-size: 14px; 
              font-weight: 500;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .chart-container { 
              background: #ffffff; 
              padding: 25px; 
              border-radius: 12px; 
              margin: 20px 0; 
              border: 1px solid #e5e7eb;
              box-shadow: 0 2px 8px rgba(0,0,0,0.05);
            }
            .chart-title { 
              font-weight: 600; 
              margin-bottom: 20px; 
              color: #1e40af; 
              font-size: 18px;
              text-align: center;
            }
            .bar-chart { 
              display: flex; 
              align-items: end; 
              justify-content: center;
              height: 220px; 
              margin: 20px 0;
              padding: 20px;
              background: linear-gradient(to top, #f8fafc 0%, #ffffff 100%);
              border-radius: 8px;
            }
            .data-table { 
              width: 100%; 
              border-collapse: collapse; 
              margin: 20px 0;
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }
            .data-table th { 
              background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
              color: white; 
              font-weight: 600;
              padding: 15px 12px;
              text-align: left;
              font-size: 14px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .data-table td { 
              padding: 12px; 
              border-bottom: 1px solid #e5e7eb;
              font-size: 14px;
            }
            .data-table tr:last-child td { border-bottom: none; }
            .summary { 
              background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
              padding: 30px; 
              border-radius: 12px; 
              text-align: center;
              margin-top: 30px;
              box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
            }
            .summary-title { 
              font-size: 22px; 
              color: #1e40af; 
              margin-bottom: 25px; 
              font-weight: 700;
            }
            .summary-stats { 
              display: flex; 
              justify-content: space-around; 
              flex-wrap: wrap;
              gap: 20px;
            }
            .summary-stat { 
              text-align: center;
              min-width: 120px;
            }
            .summary-number { 
              font-size: 36px; 
              font-weight: 700; 
              color: #1e40af;
              text-shadow: 0 2px 4px rgba(30, 64, 175, 0.2);
            }
            .summary-label { 
              color: #374151; 
              font-size: 13px;
              font-weight: 500;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin-top: 5px;
            }
            .info-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
              gap: 15px;
              margin: 20px 0;
            }
            .info-item {
              display: flex;
              align-items: center;
              padding: 15px;
              background: #f8fafc;
              border-radius: 8px;
              border-left: 4px solid #3b82f6;
            }
            .info-label {
              font-weight: 600;
              color: #374151;
              margin-right: 10px;
            }
            .info-value {
              color: #1f2937;
              font-weight: 500;
            }
            @media print { 
              body { margin: 15px; font-size: 12px; }
              .section { break-inside: avoid; margin: 15px 0; padding: 15px; }
              .summary { break-inside: avoid; }
              .stat-number { font-size: 24px; }
              .summary-number { font-size: 28px; }
            }
        </style>
      </head>
      <body>
          <div class="report-container">
            <div class="header">
              <h1>${data.teacherName}'s Analytics</h1>
              <div class="subtitle">Comprehensive Teacher Performance Report</div>
              <div class="subtitle">Generated: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</div>
            </div>
            
            <div class="section">
              <h2>📋 Teacher Information</h2>
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">Name:</span>
                  <span class="info-value">${data.teacherName || 'Not provided'}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Email:</span>
                  <span class="info-value">${data.teacherEmail || 'Not provided'}</span>
                </div>
              </div>
            </div>
            
            <div class="section">
              <h2>📊 Test Statistics Overview</h2>
              <div class="stats-grid">
                <div class="stat-card">
                  <div class="stat-number">${data.totalTests || 0}</div>
                  <div class="stat-label">Total Tests</div>
                </div>
                <div class="stat-card">
                  <div class="stat-number">${data.publishedTests || 0}</div>
                  <div class="stat-label">Published</div>
                </div>
                <div class="stat-card">
                  <div class="stat-number">${data.completedTests || 0}</div>
                  <div class="stat-label">Completed</div>
                </div>
                <div class="stat-card">
                  <div class="stat-number">${data.draftTests || 0}</div>
                  <div class="stat-label">Drafts</div>
                </div>
                <div class="stat-card">
                  <div class="stat-number">${data.totalSubmissions || 0}</div>
                  <div class="stat-label">Total Submissions</div>
                </div>
              </div>
            </div>
            
            <div class="section">
              <h2>📈 Tests Created Over Time</h2>
              <div class="chart-container">
                <div class="chart-title">Test Submission Analysis</div>
                <div class="bar-chart">
                  ${chartBars}
                </div>
                <div style="text-align: center; color: #6b7280; font-size: 12px; margin-top: 15px; font-style: italic;">
                  📊 Showing submission counts for up to 8 most recent tests
                </div>
              </div>
            </div>
            
            <div class="section">
              <h2>📋 Detailed Test Results</h2>
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Test Name</th>
                    <th style="text-align: center;">Submissions</th>
                    <th style="text-align: center;">Average Score</th>
                    <th>Created Date</th>
                  </tr>
                </thead>
                <tbody>
                  ${testResultsTable}
                </tbody>
              </table>
            </div>
            
            <div class="summary">
              <div class="summary-title">🎯 Overall Performance Summary</div>
              <div class="summary-stats">
                <div class="summary-stat">
                  <div class="summary-number">${data.totalTests || 0}</div>
                  <div class="summary-label">Tests Created</div>
                </div>
                <div class="summary-stat">
                  <div class="summary-number">${data.totalSubmissions || 0}</div>
                  <div class="summary-label">Total Submissions</div>
                </div>
                <div class="summary-stat">
                  <div class="summary-number">${data.totalAveragePercentage ? data.totalAveragePercentage.toFixed(1) + '%' : 'N/A'}</div>
                  <div class="summary-label">Average Score</div>
                </div>
                <div class="summary-stat">
                  <div class="summary-number">${data.testResults ? data.testResults.length : 0}</div>
                  <div class="summary-label">Active Tests</div>
                </div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
  } else if (data.studentName) {
    // Student Analytics Report - Enhanced Professional Format
    const recentResultsTable = data.recentResults && data.recentResults.length > 0
      ? data.recentResults.slice(0, 10).map((result, index) => {
          const percentage = result.score && result.outOfMarks ? ((result.score / result.outOfMarks) * 100) : 0;
          return `
            <tr style="background: ${index % 2 === 0 ? '#f9fafb' : 'white'};">
              <td style="font-weight: 500;">${result.testId?.testName || result.testName || 'Test'}</td>
              <td style="text-align: center; color: #059669; font-weight: bold;">${result.score || 0}</td>
              <td style="text-align: center; color: #6b7280;">${result.outOfMarks || result.testId?.outOfMarks || 0}</td>
              <td style="text-align: center;">
                <span style="background: ${percentage >= 75 ? '#10b981' : percentage >= 50 ? '#f59e0b' : '#ef4444'}; 
                             color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;">
                  ${percentage.toFixed(1)}%
                </span>
              </td>
            </tr>
          `;
        }).join('')
      : '<tr><td colspan="4" style="text-align: center; color: #9ca3af; padding: 30px; font-style: italic;">No test results available</td></tr>';
    
    // Create chart visualization for assigned vs attempted
    const maxValue = Math.max(data.totalAssigned || 0, data.completedTests || 0, 1);
    const assignedHeight = Math.max((data.totalAssigned / maxValue) * 160, 20);
    const completedHeight = Math.max((data.completedTests / maxValue) * 160, 20);
    
    reportContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${filename} - ${new Date().toLocaleDateString()}</title>
          <meta charset="utf-8">
          <style>
            * { box-sizing: border-box; }
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              margin: 0; 
              padding: 30px; 
              line-height: 1.6; 
              color: #1f2937; 
              background: #ffffff;
            }
            .report-container { max-width: 1200px; margin: 0 auto; }
            .header { 
              text-align: center; 
              margin-bottom: 40px; 
              padding: 30px;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              border-radius: 12px;
              color: white;
              box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
            }
            .header h1 { 
              font-size: 28px; 
              margin: 0 0 10px 0; 
              font-weight: 700;
              text-shadow: 0 2px 4px rgba(0,0,0,0.3);
            }
            .header .subtitle { 
              font-size: 16px; 
              opacity: 0.9; 
              margin: 5px 0;
              font-weight: 300;
            }
            .section { 
              margin: 25px 0; 
              padding: 25px; 
              background: #ffffff; 
              border-radius: 12px; 
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
              border: 1px solid #e5e7eb;
            }
            .section h2 { 
              color: #1e40af; 
              margin: 0 0 20px 0; 
              font-size: 20px; 
              font-weight: 600;
              border-bottom: 2px solid #dbeafe;
              padding-bottom: 8px;
            }
            .stats-grid { 
              display: grid; 
              grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); 
              gap: 20px; 
              margin: 20px 0; 
            }
            .stat-card { 
              background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
              padding: 20px; 
              border-radius: 10px; 
              border-left: 5px solid #10b981; 
              box-shadow: 0 2px 8px rgba(0,0,0,0.1);
              transition: transform 0.2s;
            }
            .stat-card:hover { transform: translateY(-2px); }
            .stat-number { 
              font-size: 32px; 
              font-weight: 700; 
              color: #10b981; 
              margin-bottom: 5px;
              text-shadow: 0 1px 2px rgba(16, 185, 129, 0.2);
            }
            .stat-label { 
              color: #6b7280; 
              font-size: 14px; 
              font-weight: 500;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .chart-container { 
              background: #ffffff; 
              padding: 25px; 
              border-radius: 12px; 
              margin: 20px 0; 
              border: 1px solid #e5e7eb;
              box-shadow: 0 2px 8px rgba(0,0,0,0.05);
            }
            .chart-title { 
              font-weight: 600; 
              margin-bottom: 20px; 
              color: #1e40af; 
              font-size: 18px;
              text-align: center;
            }
            .bar-chart { 
              display: flex; 
              align-items: end; 
              justify-content: center;
              height: 200px; 
              margin: 20px 0;
              padding: 20px;
              background: linear-gradient(to top, #f8fafc 0%, #ffffff 100%);
              border-radius: 8px;
              gap: 40px;
            }
            .data-table { 
              width: 100%; 
              border-collapse: collapse; 
              margin: 20px 0;
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }
            .data-table th { 
              background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
              color: white; 
              font-weight: 600;
              padding: 15px 12px;
              text-align: left;
              font-size: 14px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .data-table td { 
              padding: 12px; 
              border-bottom: 1px solid #e5e7eb;
              font-size: 14px;
            }
            .data-table tr:last-child td { border-bottom: none; }
            .summary { 
              background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
              padding: 30px; 
              border-radius: 12px; 
              text-align: center;
              margin-top: 30px;
              box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
            }
            .summary-title { 
              font-size: 22px; 
              color: #1e40af; 
              margin-bottom: 25px; 
              font-weight: 700;
            }
            .summary-stats { 
              display: flex; 
              justify-content: space-around; 
              flex-wrap: wrap;
              gap: 20px;
            }
            .summary-stat { 
              text-align: center;
              min-width: 120px;
            }
            .summary-number { 
              font-size: 36px; 
              font-weight: 700; 
              color: #1e40af;
              text-shadow: 0 2px 4px rgba(30, 64, 175, 0.2);
            }
            .summary-label { 
              color: #374151; 
              font-size: 13px;
              font-weight: 500;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin-top: 5px;
            }
            .info-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
              gap: 15px;
              margin: 20px 0;
            }
            .info-item {
              display: flex;
              align-items: center;
              padding: 15px;
              background: #f8fafc;
              border-radius: 8px;
              border-left: 4px solid #3b82f6;
            }
            .info-label {
              font-weight: 600;
              color: #374151;
              margin-right: 10px;
            }
            .info-value {
              color: #1f2937;
              font-weight: 500;
            }
            .chart-bar {
              display: flex;
              flex-direction: column;
              align-items: center;
              margin: 0 20px;
            }
            .progress-bar {
              width: 80px;
              border-radius: 6px 6px 0 0;
              display: flex;
              align-items: end;
              justify-content: center;
              color: white;
              font-size: 16px;
              font-weight: bold;
              padding-bottom: 8px;
              box-shadow: 0 4px 8px rgba(0,0,0,0.2);
            }
            .bar-label {
              margin-top: 15px;
              font-size: 14px;
              font-weight: 600;
              color: #374151;
              text-align: center;
            }
            @media print { 
              body { margin: 15px; font-size: 12px; }
              .section { break-inside: avoid; margin: 15px 0; padding: 15px; }
              .summary { break-inside: avoid; }
              .stat-number { font-size: 24px; }
              .summary-number { font-size: 28px; }
            }
          </style>
        </head>
        <body>
          <div class="report-container">
            <div class="header">
              <h1>${data.studentName}'s Analytics</h1>
              <div class="subtitle">Comprehensive Student Performance Report</div>
              <div class="subtitle">Generated: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</div>
            </div>
            
            <div class="section">
              <h2>👤 Student Information</h2>
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">Name:</span>
                  <span class="info-value">${data.studentName || 'Not provided'}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Email:</span>
                  <span class="info-value">${data.studentEmail || 'Not provided'}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Organization:</span>
                  <span class="info-value">${data.organization || 'N/A'}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Status:</span>
                  <span class="info-value">${data.status || 'Active'}</span>
                </div>
              </div>
            </div>
            
            <div class="section">
              <h2>📊 Test Activity Overview</h2>
              <div class="stats-grid">
                <div class="stat-card">
                  <div class="stat-number">${data.totalAssigned || 0}</div>
                  <div class="stat-label">Assigned Tests</div>
                </div>
                <div class="stat-card">
                  <div class="stat-number">${data.completedTests || 0}</div>
                  <div class="stat-label">Completed</div>
                </div>
                <div class="stat-card">
                  <div class="stat-number">${data.ongoingTests || 0}</div>
                  <div class="stat-label">Ongoing</div>
                </div>
                <div class="stat-card">
                  <div class="stat-number">${data.upcomingTests || 0}</div>
                  <div class="stat-label">Upcoming</div>
                </div>
              </div>
            </div>
            
            <div class="section">
              <h2>📈 Assigned vs Attempted Analysis</h2>
              <div class="chart-container">
                <div class="chart-title">Test Progress Visualization</div>
                <div class="bar-chart">
                  <div class="chart-bar">
                    <div class="progress-bar" style="height: ${assignedHeight}px; background: linear-gradient(to top, #3b82f6, #60a5fa);">
                      ${data.totalAssigned || 0}
                    </div>
                    <div class="bar-label">📋 Assigned</div>
                  </div>
                  <div class="chart-bar">
                    <div class="progress-bar" style="height: ${completedHeight}px; background: linear-gradient(to top, #10b981, #34d399);">
                      ${data.completedTests || 0}
                    </div>
                    <div class="bar-label">✅ Completed</div>
                  </div>
                </div>
                <div style="text-align: center; color: #6b7280; font-size: 12px; margin-top: 15px; font-style: italic;">
                  📊 Visual comparison of assigned tests vs completed tests
                </div>
              </div>
            </div>
            
            <div class="section">
              <h2>📋 Recent Test Results</h2>
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Test Name</th>
                    <th style="text-align: center;">Score</th>
                    <th style="text-align: center;">Out Of</th>
                    <th style="text-align: center;">Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  ${recentResultsTable}
                </tbody>
              </table>
            </div>
            
            <div class="summary">
              <div class="summary-title">🎯 Overall Performance Summary</div>
              <div class="summary-stats">
                <div class="summary-stat">
                  <div class="summary-number">${data.totalAssigned || 0}</div>
                  <div class="summary-label">Total Assigned</div>
                </div>
                <div class="summary-stat">
                  <div class="summary-number">${data.completedTests || 0}</div>
                  <div class="summary-label">Tests Completed</div>
                </div>
                <div class="summary-stat">
                  <div class="summary-number">${typeof data.averagePercentage === 'number' ? data.averagePercentage.toFixed(1) + '%' : data.averagePercentage || 'N/A'}</div>
                  <div class="summary-label">Average Performance</div>
                </div>
                <div class="summary-stat">
                  <div class="summary-number">${data.upcomingTests || 0}</div>
                  <div class="summary-label">Upcoming Tests</div>
                </div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
  } else {
    // Generic report for other data
    reportContent = `
    <html>
      <head>
          <title>${filename} - ${new Date().toLocaleDateString()}</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; color: #333; }
            .header { text-align: center; margin-bottom: 40px; }
            h1 { color: #2563eb; border-bottom: 3px solid #2563eb; padding-bottom: 10px; margin-bottom: 10px; }
            .subtitle { color: #666; font-size: 14px; margin-bottom: 30px; }
            .section { margin: 30px 0; padding: 20px; background: #f8fafc; border-radius: 8px; }
            .section h2 { color: #1e40af; margin-bottom: 15px; font-size: 18px; }
            @media print { 
              body { margin: 20px; } 
              .section { break-inside: avoid; }
            }
        </style>
      </head>
      <body>
          <div class="header">
            <h1>Analytics Report</h1>
            <div class="subtitle">Generated: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</div>
          </div>
          
          <div class="section">
          <h2>Report Data</h2>
            <p>This report contains comprehensive analytics data for your review.</p>
        </div>
      </body>
    </html>
  `;
  }

  // Create a new window for printing
  const printWindow = window.open('', '_blank');
  printWindow.document.write(reportContent);
  printWindow.document.close();
  
  // Wait for content to load then trigger print
  printWindow.onload = function() {
    printWindow.print();
    printWindow.close();
  };
};

// Generic: print any HTML selection (by CSS selector) as PDF with current styles
export const exportSelectionToPdf = async (selector = 'body', filename = 'report.pdf', options = {}) => {
  let loadingToast = null;
  let cancelled = false;
  
  try {
    // Show loading indicator with cancel option
    loadingToast = document.createElement('div');
    loadingToast.id = 'pdf-loading-toast';
    loadingToast.innerHTML = `
      <div style="position: fixed; top: 20px; right: 20px; background: white; padding: 16px 24px; border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.3); z-index: 99999; display: flex; align-items: center; gap: 12px; font-family: system-ui, -apple-system, sans-serif; border: 1px solid #e5e7eb;">
        <div style="width: 20px; height: 20px; border: 3px solid #e5e7eb; border-top-color: #3b82f6; border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
        <span style="color: #1f2937; font-weight: 500;">Generating PDF...</span>
        <button id="cancel-pdf-btn" style="margin-left: 8px; padding: 4px 12px; background: #ef4444; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 500;">Cancel</button>
      </div>
      <style>
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        #cancel-pdf-btn:hover {
          background: #dc2626 !important;
        }
      </style>
    `;
    document.body.appendChild(loadingToast);
    
    // Add cancel handler
    const cancelBtn = document.getElementById('cancel-pdf-btn');
    if (cancelBtn) {
      cancelBtn.onclick = () => {
        cancelled = true;
        if (loadingToast && loadingToast.parentNode) {
          loadingToast.remove();
        }
      };
    }
    
    // Wait a bit to ensure the loading indicator is visible
    await new Promise(resolve => setTimeout(resolve, 300));
    
    if (cancelled) return;
    
    const node = document.querySelector(selector);
    if (!node) {
      console.error('Element not found:', selector);
      alert('Cannot find element to export. Please try again.');
      if (loadingToast && loadingToast.parentNode) {
        loadingToast.remove();
      }
      return;
    }
    
    const { landscape = false, includeCharts = true } = options || {};

    // Capture with minimal DOM manipulation to avoid glitches
    try {
      // Save scroll position to restore later
      const scrollX = window.scrollX || window.pageXOffset;
      const scrollY = window.scrollY || window.pageYOffset;
      
      // Wait a moment for any animations to complete
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Check if cancelled
      if (cancelled) {
        window.scrollTo(scrollX, scrollY);
        return;
      }
      
      // Get the actual dimensions
      const captureWidth = Math.max(node.offsetWidth, node.scrollWidth);
      const captureHeight = Math.max(node.offsetHeight, node.scrollHeight);
      
      // Hide download buttons and loading indicators before capture
      const downloadButtons = node.querySelectorAll('button');
      const downloadButtonsToHide = Array.from(downloadButtons).filter(btn => 
        btn.textContent?.includes('Download') || 
        btn.textContent?.includes('Generating') ||
        btn.textContent?.includes('Cancel') ||
        btn.classList.toString().includes('download')
      );
      const originalButtonStates = downloadButtonsToHide.map(btn => ({
        element: btn,
        display: btn.style.display,
        visibility: btn.style.visibility
      }));
      
      downloadButtonsToHide.forEach(btn => {
        btn.style.display = 'none';
        btn.style.visibility = 'hidden';
      });

      // Utility: convert problematic styles (applied ONLY to cloned content to avoid UI glitches)
      const convertOklchToRgb = (element) => {
        try {
        const computedStyle = window.getComputedStyle(element);
          const props = [
            'color','backgroundColor','backgroundImage','borderColor','borderTopColor','borderRightColor','borderBottomColor','borderLeftColor','outlineColor','textDecorationColor','textShadow','boxShadow','fill','stroke'
          ];
          props.forEach(p => {
            try {
              const v = computedStyle[p];
              if (!v) return;
              if (v.includes('oklch') || (p === 'backgroundImage' && v.includes('gradient'))) {
                switch (p) {
              case 'color':
                  case 'fill':
                  case 'stroke': element.style[p] = '#1f2937'; break;
                  case 'backgroundColor': element.style.backgroundColor = '#ffffff'; break;
                  case 'backgroundImage':
                    element.style.backgroundImage = 'none';
                    if (!element.style.backgroundColor || element.style.backgroundColor === 'transparent' || element.style.backgroundColor === 'rgba(0, 0, 0, 0)') {
                      element.style.backgroundColor = '#f9fafb';
                    }
                break;
              case 'borderColor':
              case 'borderTopColor':
              case 'borderRightColor':
              case 'borderBottomColor':
                  case 'borderLeftColor': element.style[p] = '#e5e7eb'; break;
                  case 'outlineColor': element.style.outlineColor = '#3b82f6'; break;
                  case 'textDecorationColor': element.style.textDecorationColor = '#1f2937'; break;
                  case 'textShadow': element.style.textShadow = 'none'; break;
                  case 'boxShadow': element.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08),0 1px 2px rgba(0,0,0,0.04)'; break;
                }
              }
            } catch(_) {}
          });
        } catch(_) {}
      };

      // Check if cancelled before starting capture
      if (cancelled) {
        // Restore button states
        originalButtonStates.forEach(state => {
          state.element.style.display = state.display;
          state.element.style.visibility = state.visibility;
        });
        // Restore scroll position
        window.scrollTo(scrollX, scrollY);
        return;
      }

      // NEW APPROACH: Clone the node and print directly without canvas capture
      // This avoids ALL html2canvas iframe/cloning issues
      
      // Clone the content (deep) - NO mutations to original UI
      const clonedNode = node.cloneNode(true);

      // Remove any modal backdrops / overlays accidentally captured
      clonedNode.querySelectorAll('[class*="backdrop"], .fixed, .absolute').forEach(el => {
        // Keep only elements inside the target container hierarchy
        if (!el.contains(clonedNode)) {
          // skip
        }
      });
      
      // Remove buttons and loading indicators from clone
      const clonedButtons = clonedNode.querySelectorAll('.download-btn, button');
      clonedButtons.forEach(btn => {
        if (btn.textContent.includes('Download') || 
            btn.textContent.includes('Cancel') ||
            btn.textContent.includes('PDF') ||
            btn.textContent.includes('Export')) {
          btn.remove();
        }
      });
      
      // Clean & normalize cloned content (colors, gradients, scroll areas, page breaks)
      const clonedElements = clonedNode.querySelectorAll('*');
      clonedElements.forEach(el => {
        // Color / gradient normalization
        convertOklchToRgb(el);
        try {
          const cs = window.getComputedStyle(el);
          // Remove forced scroll containers so entire content prints (prevents cropped areas & white stripes)
            if ([cs.overflow, cs.overflowY, cs.overflowX].some(v => v === 'auto' || v === 'scroll')) {
              el.style.overflow = 'visible';
              el.style.overflowY = 'visible';
              el.style.overflowX = 'visible';
              if (cs.maxHeight && cs.maxHeight !== 'none') el.style.maxHeight = 'none';
              if (cs.height && /(px|rem|vh)$/.test(cs.height)) el.style.height = 'auto';
            }
          // Avoid page breaks inside cards / charts
          const cls = (el.className || '').toString();
          if (/recharts|card|chart|metrics|grid|flex/.test(cls)) {
            el.classList.add('avoid-break');
            el.style.breakInside = 'avoid';
            el.style.pageBreakInside = 'avoid';
          }
        } catch(_) {}
      });
      // Also apply conversion to root cloned node
      convertOklchToRgb(clonedNode);
      
      // Get all stylesheets to include
      let styleContent = '';
      try {
        const sheets = Array.from(document.styleSheets);
        sheets.forEach(sheet => {
          try {
            if (sheet.cssRules) {
              const rules = Array.from(sheet.cssRules);
              rules.forEach(rule => {
                styleContent += rule.cssText + '\n';
              });
            }
          } catch (e) {
            // Skip external stylesheets that can't be accessed
          }
        });
      } catch (e) {
        console.warn('Could not extract some styles');
      }

      // Restore button states immediately to prevent glitches
      originalButtonStates.forEach(state => {
        state.element.style.display = state.display;
        state.element.style.visibility = state.visibility;
      });
      
      // Restore scroll position to prevent page jump
      window.scrollTo(scrollX, scrollY);
      
      // Check if cancelled after creating clone
      if (cancelled) {
        return;
      }
      
      // Provide selector-specific layout tuning (admin analytics positioning fixes)
      let additionalPrintStyles = '';
      if (selector === '#admin-analytics-section') {
        try {
          // Light structural tweaks on clone (do NOT touch live DOM)
          // Compress top spacing
          clonedNode.style.paddingTop = '4px';
          clonedNode.style.marginTop = '0';
          // Reduce excessive vertical gaps
          clonedNode.querySelectorAll('.mb-8, .mt-8, .my-8').forEach(el=>{ el.style.marginBottom='18px'; el.style.marginTop='18px'; });
          // Normalize card heights for analytics summary cards if any inline grid
          clonedNode.querySelectorAll('[class*="grid"] > div').forEach(el=>{
            if (el.className && /shadow|rounded/.test(el.className)) {
              el.style.minHeight = '72px';
            }
          });
        } catch(_) {}
        additionalPrintStyles = `
          /* Admin analytics specific print adjustments */
          #admin-analytics-section { background:#ffffff !important; }
          #admin-analytics-section h1, #admin-analytics-section h2, #admin-analytics-section h3 { page-break-after: avoid; }
          /* Force two-column layout for main charts row */
          #admin-analytics-section .grid.grid-cols-10 { display:flex !important; gap:20px !important; }
          #admin-analytics-section .grid.grid-cols-10 > div:first-child { flex:2 1 0; }
          #admin-analytics-section .grid.grid-cols-10 > div:last-child { flex:1 1 0; }
          /* Standardize chart heights to prevent large whitespace */
          #admin-analytics-section .h-80 { height:320px !important; }
          #admin-analytics-section .recharts-responsive-container, 
          #admin-analytics-section .recharts-wrapper { min-height:300px !important; height:300px !important; }
          /* Tighten cards spacing */
          #admin-analytics-section .space-y-8 > * { margin-top:18px !important; margin-bottom:18px !important; }
          /* Avoid page breaks inside key analytics blocks */
          #admin-analytics-section .grid, 
          #admin-analytics-section .recharts-wrapper, 
          #admin-analytics-section .recharts-responsive-container { break-inside: avoid; page-break-inside: avoid; }
          /* Shrink overall content slightly so first charts pair stays on same page */
          @media print { #admin-analytics-section { transform: scale(.96); transform-origin: top left; } }
        `;
      } else if (selector === '#organization-detail') {
        try {
          // Fix chart sizing by copying exact runtime dimensions from original
          const originalCharts = node.querySelectorAll('.recharts-wrapper');
          const clonedCharts = clonedNode.querySelectorAll('.recharts-wrapper');
          originalCharts.forEach((orig, i) => {
            if (clonedCharts[i]) {
              const rect = orig.getBoundingClientRect();
              if (rect.width > 0 && rect.height > 0) {
                clonedCharts[i].style.width = rect.width + 'px';
                clonedCharts[i].style.height = rect.height + 'px';
                // Ensure svg inside scales to explicit dimensions
                const svg = clonedCharts[i].querySelector('svg');
                if (svg) {
                  svg.setAttribute('width', rect.width);
                  svg.setAttribute('height', rect.height);
                  svg.style.width = rect.width + 'px';
                  svg.style.height = rect.height + 'px';
                }
              }
            }
          });
          // Trim vertical gaps
          clonedNode.querySelectorAll('.mb-8, .mt-8, .my-8, .space-y-8 > *').forEach(el => {
            el.style.marginTop = '16px';
            el.style.marginBottom = '16px';
          });
        } catch(_) {}
        additionalPrintStyles = `
          /* Organization detail print adjustments */
          #organization-detail { background:#ffffff !important; }
          #organization-detail .recharts-responsive-container, 
          #organization-detail .recharts-wrapper { height:340px !important; min-height:340px !important; }
          #organization-detail .recharts-wrapper svg { height:340px !important; }
          #organization-detail h1, #organization-detail h2, #organization-detail h3 { page-break-after: avoid; }
          /* Prevent charts splitting */
          #organization-detail .recharts-wrapper, 
          #organization-detail .recharts-responsive-container, 
          #organization-detail .card, 
          #organization-detail table { break-inside: avoid; page-break-inside: avoid; }
          /* Slight scale to fit more charts per page without clipping legends */
          @media print { #organization-detail { transform: scale(.97); transform-origin: top left; } }
        `;
      }

      // Create print-ready HTML document with cloned content
      const doc = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>${filename}</title>
            <meta charset="utf-8" />
            <style>
              ${styleContent}
              
              @page { 
                size: ${landscape ? 'A4 landscape' : 'A4 portrait'}; 
                margin: 15mm; 
              }
              @media print {
                body {
                margin: 0; 
                  padding: 20px;
                  background: white;
                }
                * {
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                  color-adjust: exact !important;
                }
                .no-print, button, .download-btn {
                  display: none !important;
                }
              }
              body { 
                margin: 0; 
                padding: 20px; 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: white;
                overflow: auto;
              }
              .content-wrapper {
                width: 100%;
                background: white;
                min-height: 100vh;
              }
              .header {
                text-align: center;
                padding: 20px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                margin-bottom: 20px;
                border-radius: 8px;
              }
              .header h1 { margin: 0 0 6px 0; font-size: 22px; font-weight:600; letter-spacing:.5px; }
              .header .subtitle {
                margin: 0;
                opacity: 0.9;
                font-size: 14px;
              }
              /* Prevent page breaks inside key blocks */
              .avoid-break, .recharts-wrapper, .card { page-break-inside: avoid; break-inside: avoid; }
              /* Remove unexpected internal scrollbars in print */
              @media print {
                .avoid-break { overflow: visible !important; }
              }
              ${additionalPrintStyles}
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Analytics Dashboard Report</h1>
              <div class="subtitle">Generated: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</div>
            </div>
            <div class="content-wrapper" id="print-content">
              <!-- Content will be inserted here -->
            </div>
          </body>
        </html>
      `;

      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        alert('Please allow pop-ups for PDF download.');
        if (loadingToast && loadingToast.parentNode) {
          loadingToast.remove();
        }
        return;
      }

      printWindow.document.open();
      printWindow.document.write(doc);
      printWindow.document.close();
      
      // Insert cloned content into print window
        setTimeout(() => {
        try {
          const container = printWindow.document.getElementById('print-content');
          if (container && clonedNode) {
            container.appendChild(clonedNode);
            
            // Wait a moment for rendering then print
            setTimeout(() => {
              if (!cancelled) {
              printWindow.focus();
              printWindow.print();
              }
              // Remove loading toast
              if (loadingToast && loadingToast.parentNode) {
                loadingToast.remove();
              }
              
              // Close print window after printing or on cancel
              printWindow.onafterprint = () => {
              printWindow.close();
              };
            }, 1000);
          } else {
            console.error('Could not insert content into print window');
            if (loadingToast && loadingToast.parentNode) {
              loadingToast.remove();
            }
            printWindow.close();
          }
        } catch (insertError) {
          console.error('Error inserting content:', insertError);
          if (loadingToast && loadingToast.parentNode) {
            loadingToast.remove();
          }
          if (printWindow) {
            printWindow.close();
          }
        }
      }, 500);
      
  } catch (error) {
      console.error('Error generating PDF:', error);
      
      // Restore button states on error (already restored above, but just in case)
      if (originalButtonStates && originalButtonStates.length > 0) {
        originalButtonStates.forEach(state => {
          state.element.style.display = state.display;
          state.element.style.visibility = state.visibility;
        });
      }
      
      // Restore scroll position
      if (typeof scrollX !== 'undefined' && typeof scrollY !== 'undefined') {
        window.scrollTo(scrollX, scrollY);
      }
      
      // Remove loading toast on error
      if (loadingToast && loadingToast.parentNode) {
        loadingToast.remove();
      }
      
      // Show user-friendly error message
      alert('Unable to generate PDF. Please try again or contact support if the issue persists.');
    }
  } catch (outerError) {
    console.error('Fatal error in PDF export:', outerError);
    alert('An unexpected error occurred. Please refresh the page and try again.');
  }
};

// Fallback method using HTML rendering
const fallbackToHtmlMethod = (node, filename, options) => {
  try {
    const { landscape = false, includeCharts = true } = options || {};
    
    // Clone the node to safely mutate sizes/styles for print
    const clone = node.cloneNode(true);

    // Optionally remove charts entirely (used for organization PDF when requested)
    if (!includeCharts) {
      try {
        const chartNodes = Array.from(clone.querySelectorAll('.recharts-responsive-container'));
        chartNodes.forEach((container) => {
          let toRemove = null;
          // Try to find a card-like ancestor (rounded/p-6/border classes)
          let cur = container;
          for (let i = 0; i < 6 && cur; i++) {
            const cls = (cur.getAttribute && cur.getAttribute('class')) || '';
            if (/rounded|p-6|shadow|border/.test(cls)) {
              toRemove = cur;
            }
            cur = cur.parentElement;
          }
          (toRemove || container.parentElement || container).remove();
        });
      } catch (_) {}
    }

    const html = clone.outerHTML;

    const doc = `
      <html>
        <head>
          <title>${filename}</title>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="stylesheet" href="/index.css" />
          <link rel="stylesheet" href="/src/index.css" />
          <style>
            :root { --brand:#0ea5e9; --brandDark:#0369a1; --text:#111827; --sub:#4b5563; --tableHeader:#f3f4f6; --rowAlt:#f9fafb; --card:#ffffff; --border:#e5e7eb; }
            @page { size: ${landscape ? 'A4 landscape' : 'A4'}; margin: 12mm; }
            @media print { .no-print, .no-pdf, .toolbar { display: none !important; } }
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; color: var(--text); }
            h1,h2,h3 { color: var(--text); margin: 0 0 12px 0; }
            h1 { font-size: 22px; border-bottom: 2px solid var(--brand); padding-bottom: 6px; }
            h2 { font-size: 16px; color: var(--sub); }
            .card { background: var(--card); border: 1px solid var(--border); border-radius: 12px; padding: 16px; }
            .section { margin: 14px 0; }
            .grid { display: grid; gap: 12px; }
            .grid-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
            .metric { padding: 12px 14px; border-left: 4px solid var(--brand); background: #f8fafc; border-radius: 8px; }
            .metric-label { color: var(--sub); font-size: 12px; }
            .metric-value { font-size: 22px; font-weight: 700; }
            .toolbar, input, select, button { display: none !important; }
            table { width: 100%; border-collapse: collapse; }
            thead tr { background: var(--tableHeader); }
            th { text-align: left; font-size: 11px; letter-spacing: .06em; text-transform: uppercase; color: var(--sub); padding: 10px 12px; border-bottom: 1px solid #e5e7eb; }
            td { font-size: 13px; color: var(--text); padding: 10px 12px; border-bottom: 1px solid #e5e7eb; }
            tbody tr:nth-child(even){ background: var(--rowAlt); }
            .badge { display:inline-block; padding:2px 8px; border-radius:999px; font-size:11px; }
            .brand { color: var(--brandDark); }
            /* Recharts print sizing + colors */
            .recharts-responsive-container, .recharts-wrapper { width: 100% !important; min-height: ${landscape ? '260px' : '320px'} !important; height: ${landscape ? '300px' : '380px'} !important; }
            svg.recharts-surface { width: 100% !important; height: 100% !important; background: #ffffff !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .recharts-cartesian-grid-horizontal line, .recharts-cartesian-grid-vertical line { stroke: #e5e7eb !important; }
            .recharts-xAxis .recharts-cartesian-axis-tick-value tspan,
            .recharts-yAxis .recharts-cartesian-axis-tick-value tspan,
            .recharts-legend-item-text, .recharts-tooltip-label { fill: #374151 !important; color: #374151 !important; }
            .recharts-default-legend { color: #374151 !important; }
            .recharts-text { fill: #374151 !important; }
            /* Avoid awkward page breaks */
            .avoid-break, .card, table, .recharts-responsive-container { break-inside: avoid; }
            /* Headings inside organization detail */
            #organization-detail h3 { font-size: 18px; margin: 6px 0 10px; }
          </style>
        </head>
        <body>${html}</body>
      </html>`;

    const w = window.open('', '_blank');
    if (!w) return;
    w.document.open();
    w.document.write(doc);
    w.document.close();
    w.onload = () => {
      setTimeout(() => {
        try { w.focus(); } catch (_) {}
        try { w.print(); } catch (_) {}
        try { w.close(); } catch (_) {}
        // Remove loading indicator
        const toast = document.getElementById('pdf-loading-toast');
        if (toast) toast.remove();
      }, 150);
    };
  } catch (err) {
    console.error('Error exporting selection to PDF:', err);
    // Remove loading indicator on error
    const toast = document.getElementById('pdf-loading-toast');
    if (toast) toast.remove();
  } finally {
    // Ensure loading indicator is removed
    setTimeout(() => {
      const toast = document.getElementById('pdf-loading-toast');
      if (toast) toast.remove();
    }, 3000);
  }
};

// Create dashboard PDF
export const createDashboardPdf = async (charts, options = {}) => {
  const { print = false, filename = 'dashboard.pdf' } = options;
  
  try {
    console.log('Creating dashboard PDF with charts:', charts);
    console.log('Options:', options);
    
    // Create a formatted HTML report for PDF generation
    const reportContent = `
      <html>
        <head>
          <title>Dashboard Report - ${new Date().toLocaleDateString()}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #333; border-bottom: 2px solid #3B82F6; padding-bottom: 10px; }
            h2 { color: #666; margin-top: 30px; }
            .chart-section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 8px; }
            .chart-title { font-weight: bold; margin-bottom: 10px; }
            .generated-at { color: #888; font-size: 12px; margin-top: 20px; }
            @media print {
              body { margin: 0; }
              .chart-section { break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <h1>Dashboard Report</h1>
          <div class="generated-at">Generated: ${new Date().toLocaleString()}</div>
          
          <div class="chart-section">
            <h2>Charts Included</h2>
            ${charts.map(chart => `
              <div class="chart-title">${chart.title}</div>
              <p>Chart data and visualizations would be included here.</p>
            `).join('')}
          </div>
          
          <div class="chart-section">
            <h2>Report Summary</h2>
            <p>This dashboard report contains ${charts.length} chart(s) with comprehensive data analysis.</p>
            <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}.</p>
          </div>
        </body>
      </html>
    `;

    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    printWindow.document.write(reportContent);
    printWindow.document.close();
    
    // Wait for content to load then trigger print
    printWindow.onload = function() {
      printWindow.print();
      printWindow.close();
    };
    
  } catch (error) {
    console.error('Error creating dashboard PDF:', error);
  }
};
