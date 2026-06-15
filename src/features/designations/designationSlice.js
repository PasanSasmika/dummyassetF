import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import designationService from './designationService';

export const fetchDesignations = createAsyncThunk('designations/fetchAll',
  async (_, { rejectWithValue }) => {
    try { return await designationService.getAll(); }
    catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed'); }
  }
);

export const createDesignation = createAsyncThunk('designations/create',
  async (body, { rejectWithValue }) => {
    try { return await designationService.create(body); }
    catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed'); }
  }
);

export const deleteDesignation = createAsyncThunk('designations/delete',
  async (id, { rejectWithValue }) => {
    try { await designationService.remove(id); return id; }
    catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed'); }
  }
);

const designationSlice = createSlice({
  name: 'designations',
  initialState: { list: [], loading: false, error: null, success: null },
  reducers: {
    clearDesigMessages: (state) => { state.error = null; state.success = null; }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDesignations.pending,   (state) => { state.loading = true; state.error = null; })
      .addCase(fetchDesignations.fulfilled, (state, action) => {
        state.loading = false;
        state.list    = action.payload.data || [];
      })
      .addCase(fetchDesignations.rejected,  (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(createDesignation.fulfilled, (state) => { state.success = 'Designation created!'; })
      .addCase(createDesignation.rejected,  (state, action) => { state.error = action.payload; })
      .addCase(deleteDesignation.fulfilled, (state, action) => {
        state.list    = state.list.filter(d => d.id !== action.payload);
        state.success = 'Designation deleted!';
      });
  }
});

export const { clearDesigMessages } = designationSlice.actions;
export default designationSlice.reducer;
