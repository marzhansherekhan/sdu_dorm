/**
 * Real Django Backend API Client
 * Base URL://sdu-dorm.onrender.com/api/
 */

import { storage } from '../utils/storage';

const API_BASE_URL = 'https://sdu-dorm.onrender.com/api';

// Helper function to get auth token from storage
const getAuthToken = (): string | null => {
  return storage.getItem('access_token');
};

// Helper function to make authenticated requests
const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  const token = getAuthToken();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers,
  });
  
  // Handle token expiration
  if (response.status === 401) {
    storage.removeItem('access_token');
    storage.removeItem('refresh_token');
    storage.removeItem('user');
    window.location.href = '/login';
    throw new Error('Authentication required');
  }
  
  return response;
};

// ========== Authentication API ==========

export const authAPI = {
  async login(email: string, password: string, rememberMe: boolean = false) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Set remember me preference
        storage.setRememberMe(rememberMe);
        
        // Save tokens to storage (localStorage or sessionStorage based on rememberMe)
        storage.setItem('access_token', data.access_token);
        storage.setItem('refresh_token', data.refresh_token);
        storage.setItem('user', JSON.stringify(data.user));
      }
      
      return data;
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: 'Network error. Please check if backend is running.',
      };
    }
  },
  
  logout() {
    storage.removeItem('access_token');
    storage.removeItem('refresh_token');
    storage.removeItem('user');
  },
};

// ========== Profile API ==========

export const profileAPI = {
  async getProfile() {
    try {
      const response = await fetchWithAuth('/profile/');
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Get profile error:', error);
      return { success: false, error: 'Failed to fetch profile' };
    }
  },
  
  async updateProfile(profileData: {
    iin?: string;
    iban?: string;
    doc_type?: string;
    doc_number?: string;
    doc_issue_date?: string;
    local_address?: string;
  }) {
    try {
      const response = await fetchWithAuth('/profile/', {
        method: 'PUT',
        body: JSON.stringify(profileData),
      });
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Update profile error:', error);
      return { success: false, error: 'Failed to update profile' };
    }
  },
  
  async changePassword(oldPassword: string, newPassword: string) {
    try {
      const response = await fetchWithAuth('/profile/change-password/', {
        method: 'POST',
        body: JSON.stringify({
          old_password: oldPassword,
          new_password: newPassword,
        }),
      });
      
      return await response.json();
    } catch (error) {
      console.error('Change password error:', error);
      return { success: false, error: 'Failed to change password' };
    }
  },
};

// ========== Explanations API ==========

export const explanationsAPI = {
  async getMyExplanations() {
    try {
      const response = await fetchWithAuth('/explanations/my/');
      return await response.json();
    } catch (error) {
      console.error('Get explanations error:', error);
      return { success: false, error: 'Failed to fetch explanations' };
    }
  },
  
  async submitExplanation(explanationText: string) {
    try {
      const response = await fetchWithAuth('/explanations/', {
        method: 'POST',
        body: JSON.stringify({ explanation_text: explanationText }),
      });
      
      return await response.json();
    } catch (error) {
      console.error('Submit explanation error:', error);
      return { success: false, error: 'Failed to submit explanation' };
    }
  },
  
  async getPendingExplanations() {
    try {
      const response = await fetchWithAuth('/explanations/pending/');
      return await response.json();
    } catch (error) {
      console.error('Get pending explanations error:', error);
      return { success: false, error: 'Failed to fetch pending explanations' };
    }
  },
  
  async getReviewedExplanations() {
    try {
      const response = await fetchWithAuth('/explanations/reviewed/');
      return await response.json();
    } catch (error) {
      console.error('Get reviewed explanations error:', error);
      return { success: false, error: 'Failed to fetch reviewed explanations' };
    }
  },
  
  async approveExplanation(explanationId: number) {
    try {
      const response = await fetchWithAuth(`/explanations/${explanationId}/approve/`, {
        method: 'PATCH',
      });
      
      return await response.json();
    } catch (error) {
      console.error('Approve explanation error:', error);
      return { success: false, error: 'Failed to approve explanation' };
    }
  },
  
  async rejectExplanation(explanationId: number) {
    try {
      const response = await fetchWithAuth(`/explanations/${explanationId}/reject/`, {
        method: 'PATCH',
      });
      
      return await response.json();
    } catch (error) {
      console.error('Reject explanation error:', error);
      return { success: false, error: 'Failed to reject explanation' };
    }
  },
};

// ========== Rooms API ==========

export const roomsAPI = {
  async getRooms(block?: 'A' | 'B') {
    try {
      const url = block ? `/rooms/?block=${block}` : '/rooms/';
      const response = await fetchWithAuth(url);
      return await response.json();
    } catch (error) {
      console.error('Get rooms error:', error);
      return { success: false, error: 'Failed to fetch rooms' };
    }
  },
  
  async getRoomResidents(roomNumber: string) {
    try {
      const response = await fetchWithAuth(`/rooms/${roomNumber}/residents/`);
      return await response.json();
    } catch (error) {
      console.error('Get room residents error:', error);
      return { success: false, error: 'Failed to fetch room residents' };
    }
  },
};

// ========== Room Assignments API ==========

export const roomAssignmentsAPI = {
  async assignRoom(studentId: string, roomNumber: string) {
    try {
      const response = await fetchWithAuth('/room-assignments/', {
        method: 'POST',
        body: JSON.stringify({
          student_id: studentId,
          room_number: roomNumber,
        }),
      });
      
      return await response.json();
    } catch (error) {
      console.error('Assign room error:', error);
      return { success: false, error: 'Failed to assign room' };
    }
  },
  
  async removeFromRoom(studentId: string, roomNumber: string) {
    try {
      const response = await fetchWithAuth('/room-assignments/remove/', {
        method: 'DELETE',
        body: JSON.stringify({
          student_id: studentId,
          room_number: roomNumber,
        }),
      });
      
      return await response.json();
    } catch (error) {
      console.error('Remove from room error:', error);
      return { success: false, error: 'Failed to remove from room' };
    }
  },
};

// ========== Students API ==========

export const studentsAPI = {
  async getUnassignedStudents(gender?: 'male' | 'female') {
    try {
      const url = gender ? `/students/unassigned/?gender=${gender}` : '/students/unassigned/';
      const response = await fetchWithAuth(url);
      return await response.json();
    } catch (error) {
      console.error('Get unassigned students error:', error);
      return { success: false, error: 'Failed to fetch unassigned students' };
    }
  },
};

// ========== Reports API ==========

export const reportsAPI = {
  async exportViolations(block: string, dateFrom: string, dateTo: string) {
    try {
      const response = await fetchWithAuth('/reports/violations/export/', {
        method: 'POST',
        body: JSON.stringify({
          block: block,
          date_from: dateFrom,
          date_to: dateTo,
        }),
      });
      
      // Handle CSV file download
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${block}_block_violations_${dateFrom}_to_${dateTo}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        return { success: true, message: 'CSV downloaded successfully' };
      } else {
        const data = await response.json();
        return { success: false, error: data.error || 'Failed to export' };
      }
    } catch (error) {
      console.error('Export violations error:', error);
      return { success: false, error: 'Failed to export violations' };
    }
  },
};

// ========== Export All APIs ==========

export default {
  auth: authAPI,
  profile: profileAPI,
  explanations: explanationsAPI,
  rooms: roomsAPI,
  roomAssignments: roomAssignmentsAPI,
  students: studentsAPI,
  reports: reportsAPI,
};
