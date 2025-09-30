// Report generation utilities for the online exam system

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
export const downloadCompleteReport = (data) => {
  if (!data || Object.keys(data).length === 0) {
    console.warn('No data available for complete report');
    return;
  }

  // Create a comprehensive report object
  const report = {
    generatedAt: new Date().toISOString(),
    data: data
  };

  // Convert to PDF using browser print functionality
  const reportContent = `
    <html>
      <head>
        <title>Complete Report - ${new Date().toLocaleDateString()}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: #333; border-bottom: 2px solid #3B82F6; padding-bottom: 10px; }
          h2 { color: #666; margin-top: 30px; }
          .report-section { margin: 20px 0; }
          .data-table { width: 100%; border-collapse: collapse; margin: 10px 0; }
          .data-table th, .data-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          .data-table th { background-color: #f2f2f2; }
          .generated-at { color: #888; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <h1>Complete Report</h1>
        <div class="generated-at">Generated: ${new Date().toLocaleString()}</div>
        
        <div class="report-section">
          <h2>Report Data</h2>
          <pre>${JSON.stringify(report, null, 2)}</pre>
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