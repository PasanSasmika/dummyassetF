// src/features/audit/auditSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export const fetchAuditLogs = createAsyncThunk(
  'audit/fetchAuditLogs',
  async (params = {}, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      // Build query string
      const query = new URLSearchParams();
      if (params.search) query.append('search', params.search);
      if (params.action_type) query.append('action_type', params.action_type);
      if (params.page) query.append('page', params.page);
      if (params.limit) query.append('limit', params.limit);

      // Updated to use the environment variable
      const response = await fetch(`${import.meta.env.VITE_API_URL}/audit?${query.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to fetch audit logs');
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const auditSlice = createSlice({
  name: 'audit',
  initialState: {
    list: [],
    total: 0,
    currentPage: 1,
    totalPages: 1,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAuditLogs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAuditLogs.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.data || [];
        state.total = action.payload.total || 0;
        state.currentPage = action.payload.page || 1;
        state.totalPages = action.payload.totalPages || 1;
      })
      .addCase(fetchAuditLogs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export default auditSlice.reducer;