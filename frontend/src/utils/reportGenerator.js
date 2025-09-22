import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const generateChartImage = (chartRef) => {
  if (!chartRef || !chartRef.current) return null;
  
  try {
    const canvas = chartRef.current.querySelector('canvas');
    if (canvas) {
      return canvas.toDataURL('image/png');
    }
  } catch (error) {
    console.error('Error generating chart image:', error);
  }
  return null;
};

export const downloadChartAsImage = (chartType, data, filename) => {
  try {
    // Create a simple HTML table representation for download
    const table = document.createElement('table');
    table.style.border = '1px solid #ccc';
    table.style.borderCollapse = 'collapse';
    table.style.width = '100%';
    
    // Add header
    const headerRow = document.createElement('tr');
    const headers = Object.keys(data[0] || {});
    headers.forEach(header => {
      const th = document.createElement('th');
      th.textContent = header;
      th.style.border = '1px solid #ccc';
      th.style.padding = '8px';
      th.style.backgroundColor = '#f5f5f5';
      headerRow.appendChild(th);
    });
    table.appendChild(headerRow);
    
    // Add data rows
    data.forEach(row => {
      const tr = document.createElement('tr');
      headers.forEach(header => {
        const td = document.createElement('td');
        td.textContent = row[header] || '';
        td.style.border = '1px solid #ccc';
        td.style.padding = '8px';
        tr.appendChild(td);
      });
      table.appendChild(tr);
    });
    
    // Create a new window with the table
    const newWindow = window.open('', '_blank');
    newWindow.document.write(`
      <html>
        <head>
          <title>${chartType} Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #333; }
            table { margin-top: 20px; }
          </style>
        </head>
        <body>
          <h1>${chartType} Report</h1>
          <p>Generated on: ${new Date().toLocaleString()}</p>
          ${table.outerHTML}
        </body>
      </html>
    `);
    newWindow.document.close();
    newWindow.print();
  } catch (error) {
    console.error('Error downloading chart:', error);
    alert('Error generating report. Please try again.');
  }
};

export const downloadCompleteReport = (allData) => {
  try {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(20);
    doc.text('Admin Analytics Report', 20, 20);
    
    // Add generation date
    doc.setFontSize(12);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, 30);
    
    let yPosition = 50;
    
    // Add each chart data as a table
    Object.entries(allData).forEach(([chartType, data]) => {
      if (data && data.length > 0) {
        // Add chart title
        doc.setFontSize(14);
        doc.text(chartType.replace(/([A-Z])/g, ' $1').trim(), 20, yPosition);
        yPosition += 10;
        
        // Prepare table data
        const headers = Object.keys(data[0] || {});
        const tableData = data.map(row => 
          headers.map(header => row[header] || '')
        );
        
        // Add table
        doc.autoTable({
          head: [headers],
          body: tableData,
          startY: yPosition,
          styles: { fontSize: 10 },
          headStyles: { fillColor: [59, 130, 246] }
        });
        
        yPosition = doc.lastAutoTable.finalY + 20;
        
        // Add new page if needed
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }
      }
    });
    
    // Save the PDF
    doc.save('admin-analytics-report.pdf');
  } catch (error) {
    console.error('Error generating complete report:', error);
    alert('Error generating complete report. Please try again.');
  }
};

export const downloadChartDataAsCSV = (chartType, data) => {
  try {
    if (!data || data.length === 0) {
      alert('No data available for download');
      return;
    }
    
    const headers = Object.keys(data[0] || {});
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => `"${row[header] || ''}"`).join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${chartType.toLowerCase().replace(/\s+/g, '-')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Error downloading CSV:', error);
    alert('Error downloading data. Please try again.');
  }
};
