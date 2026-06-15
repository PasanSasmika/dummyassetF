import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export const fetchGlobalHistory = createAsyncThunk(
  'history/fetchGlobalHistory',
  async (params = {}, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const query = new URLSearchParams();
      if (params.search) query.append('search', params.search);
      if (params.page) query.append('page', params.page);

      // Removed '/api' from the start since VITE_API_URL already contains it
      const endpoint = params.type === 'assignments' ? '/assets/global/assignments' : '/assets/global/history';
      
      // Updated to use the environment variable
      const response = await fetch(`${import.meta.env.VITE_API_URL}${endpoint}?${query.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      return { type: params.type, data };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const historySlice = createSlice({
  name: 'history',
  initialState: {
    assets: { list: [], total: 0, currentPage: 1, totalPages: 1 },
    assignments: { list: [], total: 0, currentPage: 1, totalPages: 1 },
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchGlobalHistory.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchGlobalHistory.fulfilled, (state, action) => {
        state.loading = false;
        const { type, data } = action.payload;
        if (type === 'assignments') {
          state.assignments = { list: data.data || [], total: data.total, currentPage: data.page, totalPages: data.totalPages };
        } else {
          state.assets = { list: data.data || [], total: data.total, currentPage: data.page, totalPages: data.totalPages };
        }
      })
      .addCase(fetchGlobalHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export default historySlice.reducer;