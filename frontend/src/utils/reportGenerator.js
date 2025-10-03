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
  try {
    const node = document.querySelector(selector) || document.body;
    const { landscape = false, includeCharts = true } = options || {};

    // Capture exact screenshot/photograph of the analytics dashboard
    try {
      // Store original styles to restore later
      const originalNodeStyle = {
        width: node.style.width,
        height: node.style.height,
        overflow: node.style.overflow,
        position: node.style.position,
        zIndex: node.style.zIndex,
        backgroundColor: node.style.backgroundColor,
        transform: node.style.transform,
        boxShadow: node.style.boxShadow
      };
      
      const originalBodyStyle = {
        overflow: document.body.style.overflow,
        backgroundColor: document.body.style.backgroundColor,
        margin: document.body.style.margin,
        padding: document.body.style.padding
      };
      
      const originalHtmlStyle = {
        overflow: document.documentElement.style.overflow,
        backgroundColor: document.documentElement.style.backgroundColor,
        margin: document.documentElement.style.margin,
        padding: document.documentElement.style.padding
      };

      // Apply temporary styles for optimal capture
      node.style.width = 'auto';
      node.style.height = 'auto';
      node.style.overflow = 'visible';
      node.style.position = 'relative';
      node.style.zIndex = '9999';
      node.style.backgroundColor = 'transparent';
      node.style.transform = 'none';
      node.style.boxShadow = 'none';

      document.body.style.overflow = 'hidden';
      document.body.style.backgroundColor = '#f8fafc';
      document.body.style.margin = '0';
      document.body.style.padding = '0';
      
      document.documentElement.style.overflow = 'hidden';
      document.documentElement.style.backgroundColor = '#f8fafc';
      document.documentElement.style.margin = '0';
      document.documentElement.style.padding = '0';

      // Wait for all content to fully load and render
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Force all charts to re-render at optimal size
      const chartContainers = node.querySelectorAll('.recharts-responsive-container');
      chartContainers.forEach(container => {
        // Trigger resize events for charts
        const event = new Event('resize');
        window.dispatchEvent(event);
        
        // Force chart dimensions
        const svg = container.querySelector('svg');
        if (svg) {
          svg.style.width = '100%';
          svg.style.height = '100%';
          svg.style.display = 'block';
        }
      });
      
      // Wait for charts to stabilize after resize
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Get the actual dimensions after styling
      const captureWidth = node.scrollWidth;
      const captureHeight = node.scrollHeight;
      
      // Hide download buttons before capture
      const downloadButtons = node.querySelectorAll('button');
      const downloadButtonsToHide = Array.from(downloadButtons).filter(btn => 
        btn.textContent?.includes('Download') || 
        btn.classList.toString().includes('download') ||
        btn.textContent?.includes('Generating PDF')
      );
      downloadButtonsToHide.forEach(btn => {
        btn.style.display = 'none';
      });

      // Convert oklch colors to RGB/hex to fix html2canvas compatibility
      const convertOklchToRgb = (element) => {
        const computedStyle = window.getComputedStyle(element);
        const properties = [
          'color', 'backgroundColor', 'borderColor', 'borderTopColor', 
          'borderRightColor', 'borderBottomColor', 'borderLeftColor',
          'outlineColor', 'textDecorationColor', 'textShadow', 'boxShadow'
        ];
        
        properties.forEach(prop => {
          const value = computedStyle[prop];
          if (value && value.includes('oklch')) {
            // Convert oklch to appropriate fallback colors
            switch (prop) {
              case 'color':
                element.style.color = '#000000';
                break;
              case 'backgroundColor':
                element.style.backgroundColor = '#ffffff';
                break;
              case 'borderColor':
              case 'borderTopColor':
              case 'borderRightColor':
              case 'borderBottomColor':
              case 'borderLeftColor':
                element.style[prop] = '#e5e7eb';
                break;
              case 'outlineColor':
                element.style.outlineColor = '#3b82f6';
                break;
              case 'textDecorationColor':
                element.style.textDecorationColor = '#000000';
                break;
              case 'textShadow':
                element.style.textShadow = 'none';
                break;
              case 'boxShadow':
                element.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)';
                break;
            }
          }
        });
      };

      // Apply color conversion to all elements
      const allElements = node.querySelectorAll('*');
      allElements.forEach(convertOklchToRgb);
      convertOklchToRgb(node);

      // Capture screenshot with simplified settings for better reliability
      const canvas = await html2canvas(node, {
        scale: 3, // High quality but more reliable
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#f8fafc', // Set background explicitly
        width: captureWidth,
        height: captureHeight,
        scrollX: 0,
        scrollY: 0,
        logging: true, // Enable logging to debug issues
        imageTimeout: 15000,
        removeContainer: true,
        foreignObjectRendering: false, // Disable for better compatibility
        onclone: (clonedDoc) => {
          try {
            // Ensure cloned body and html have proper styling
            if (clonedDoc.body) {
              clonedDoc.body.style.overflow = 'hidden';
              clonedDoc.body.style.backgroundColor = '#f8fafc';
              clonedDoc.body.style.margin = '0';
              clonedDoc.body.style.padding = '0';
            }
            
            if (clonedDoc.documentElement) {
              clonedDoc.documentElement.style.overflow = 'hidden';
              clonedDoc.documentElement.style.backgroundColor = '#f8fafc';
              clonedDoc.documentElement.style.margin = '0';
              clonedDoc.documentElement.style.padding = '0';
            }

            // Convert any remaining oklch colors in cloned document
            const clonedElements = clonedDoc.querySelectorAll('*');
            clonedElements.forEach(element => {
              const computedStyle = window.getComputedStyle(element);
              const color = computedStyle.color;
              const backgroundColor = computedStyle.backgroundColor;
              const borderColor = computedStyle.borderColor;
              
              if (color && color.includes('oklch')) {
                element.style.color = '#000000';
              }
              if (backgroundColor && backgroundColor.includes('oklch')) {
                element.style.backgroundColor = '#ffffff';
              }
              if (borderColor && borderColor.includes('oklch')) {
                element.style.borderColor = '#e5e7eb';
              }
            });

            // Ensure charts are visible
            const clonedCharts = clonedDoc.querySelectorAll('.recharts-responsive-container');
            clonedCharts.forEach(chart => {
              chart.style.visibility = 'visible';
              chart.style.opacity = '1';
              chart.style.display = 'block';
              
              const svg = chart.querySelector('svg');
              if (svg) {
                svg.style.visibility = 'visible';
                svg.style.opacity = '1';
                svg.style.display = 'block';
              }
            });
          } catch (cloneError) {
            console.warn('Error in onclone:', cloneError);
          }
        }
      });

      // Show download buttons again
      downloadButtonsToHide.forEach(btn => {
        btn.style.display = '';
      });

      // Restore original styles
      Object.assign(node.style, originalNodeStyle);
      Object.assign(document.body.style, originalBodyStyle);
      Object.assign(document.documentElement.style, originalHtmlStyle);
      
      const imgData = canvas.toDataURL('image/png', 1.0);
      
      // Create PDF with exact visual reproduction - like a photograph
      const doc = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>${filename}</title>
            <meta charset="utf-8" />
            <style>
              @page { 
                size: A4 landscape; 
                margin: 0; 
              }
              * {
                box-sizing: border-box;
                margin: 0;
                padding: 0;
              }
              body { 
                margin: 0; 
                padding: 0; 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: #f8fafc;
                overflow: hidden;
                width: 100vw;
                height: 100vh;
              }
              .screenshot-container {
                width: 100%;
                height: 100%;
                display: flex;
                align-items: flex-start;
                justify-content: center;
                background: #f8fafc;
                padding: 20px;
              }
              .screenshot {
                max-width: 100%;
                max-height: 100%;
                object-fit: contain;
                object-position: top center;
                border: none;
                display: block;
                box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
                border-radius: 12px;
                background: white;
              }
              .header {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                z-index: 10;
                text-align: center;
                padding: 8px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                font-size: 11px;
                opacity: 0.95;
                border-radius: 0 0 8px 8px;
              }
              .header h1 {
                margin: 0 0 2px 0;
                font-size: 14px;
                font-weight: 600;
              }
              .header .subtitle {
                margin: 0;
                opacity: 0.8;
                font-size: 9px;
              }
              /* Print-specific styles */
              @media print {
                body {
                  -webkit-print-color-adjust: exact;
                  print-color-adjust: exact;
                }
                .screenshot {
                  width: auto;
                  height: auto;
                  max-width: 100%;
                  max-height: 100%;
                  object-fit: contain;
                }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Analytics Dashboard Report</h1>
              <div class="subtitle">Generated: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</div>
            </div>
            <div class="screenshot-container">
              <img src="${imgData}" alt="Analytics Dashboard - Exact Visual Copy" class="screenshot" />
            </div>
          </body>
        </html>
      `;

      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        alert('Please allow pop-ups for PDF download.');
        return;
      }

      printWindow.document.open();
      printWindow.document.write(doc);
      printWindow.document.close();
      
      // Wait for image to load then print
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.focus();
          printWindow.print();
          printWindow.close();
        }, 1000);
      };
    } catch (error) {
      console.error('Error capturing screenshot:', error);
      
      // Try a simpler approach as fallback
      try {
        console.log('Trying simplified screenshot capture...');
        const simpleCanvas = await html2canvas(node, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#f8fafc',
          logging: false,
          imageTimeout: 10000
        });
        
        const imgData = simpleCanvas.toDataURL('image/png', 1.0);
        
        // Create simple PDF
        const simpleDoc = `
          <!DOCTYPE html>
          <html>
            <head>
              <title>${filename}</title>
              <meta charset="utf-8" />
              <style>
                @page { size: A4 landscape; margin: 0; }
                body { margin: 0; padding: 20px; background: #f8fafc; }
                .screenshot { max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
              </style>
            </head>
            <body>
              <img src="${imgData}" alt="Analytics Dashboard" class="screenshot" />
            </body>
          </html>
        `;

        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.open();
          printWindow.document.write(simpleDoc);
          printWindow.document.close();
          printWindow.onload = () => {
            setTimeout(() => {
              printWindow.focus();
              printWindow.print();
              printWindow.close();
            }, 500);
          };
        }
        return;
      } catch (fallbackError) {
        console.error('Fallback screenshot also failed:', fallbackError);
        // Final fallback to HTML method
        fallbackToHtmlMethod(node, filename, options);
      }
    }
  } catch (error) {
    console.error('Error exporting selection to PDF:', error);
    alert('Failed to generate PDF. Please try again.');
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
      }, 150);
    };
  } catch (err) {
    console.error('Error exporting selection to PDF:', err);
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