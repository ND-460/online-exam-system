import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuthStore } from '../../store/authStore';

const TestAssignment = ({ test, onClose, onAssigned }) => {
  const [students, setStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [dueDate, setDueDate] = useState('');
  const [loading, setLoading] = useState(false);
  const { token } = useAuthStore();

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/teacher/students/${test.className}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setStudents(response.data.students);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Failed to fetch students');
    }
  };

  const handleStudentToggle = (studentId) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSelectAll = () => {
    if (selectedStudents.length === students.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(students.map(s => s._id));
    }
  };

  const handleAssign = async () => {
    if (selectedStudents.length === 0) {
      toast.error('Please select at least one student');
      return;
    }

    setLoading(true);
    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/teacher/assign-test/${test._id}`,
        {
          studentIds: selectedStudents,
          dueDate: dueDate || null
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Test assigned successfully!');
      onAssigned();
      onClose();
    } catch (error) {
      console.error('Error assigning test:', error);
      toast.error('Failed to assign test');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gradient-to-br from-[#151e2e] to-[#1a2236] rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Assign Test: {test.testName}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        <div className="mb-6">
          <label className="block text-blue-200 mb-2">Due Date (Optional)</label>
          <input
            type="datetime-local"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full bg-[#232f4b] border border-[#3a4a6b] rounded-md px-4 py-2 text-white"
          />
        </div>

        <div className="mb-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-white">
              Select Students ({selectedStudents.length}/{students.length})
            </h3>
            <button
              onClick={handleSelectAll}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm"
            >
              {selectedStudents.length === students.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>

          <div className="max-h-60 overflow-y-auto border border-[#232f4b] rounded-md">
            {students.map((student) => (
              <div
                key={student._id}
                className="flex items-center p-3 hover:bg-[#232f4b] border-b border-[#232f4b] last:border-b-0"
              >
                <input
                  type="checkbox"
                  checked={selectedStudents.includes(student._id)}
                  onChange={() => handleStudentToggle(student._id)}
                  className="mr-3 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <div className="flex-1">
                  <div className="text-white font-medium">
                    {student.firstName} {student.lastName}
                  </div>
                  <div className="text-gray-400 text-sm">{student.email}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-4">
          <button
            onClick={handleAssign}
            disabled={loading || selectedStudents.length === 0}
            className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-6 py-3 rounded-md font-semibold"
          >
            {loading ? 'Assigning...' : `Assign to ${selectedStudents.length} Students`}
          </button>
          <button
            onClick={onClose}
            className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-md font-semibold"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default TestAssignment;
