import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import departmentService from './departmentService';

export const fetchDepartments = createAsyncThunk('departments/fetchAll',
  async (_, { rejectWithValue }) => {
    try { return await departmentService.getAll(); }
    catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed'); }
  }
);

export const createDepartment = createAsyncThunk('departments/create',
  async (body, { rejectWithValue }) => {
    try { return await departmentService.create(body); }
    catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed'); }
  }
);

export const deleteDepartment = createAsyncThunk('departments/delete',
  async (id, { rejectWithValue }) => {
    try { await departmentService.remove(id); return id; }
    catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed'); }
  }
);

const departmentSlice = createSlice({
  name: 'departments',
  initialState: { list: [], loading: false, error: null, success: null },
  reducers: {
    clearDeptMessages: (state) => { state.error = null; state.success = null; }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDepartments.pending,   (state) => { state.loading = true; state.error = null; })
      .addCase(fetchDepartments.fulfilled, (state, action) => {
        state.loading = false;
        state.list    = action.payload.data || [];
      })
      .addCase(fetchDepartments.rejected,  (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(createDepartment.fulfilled, (state) => { state.success = 'Department created!'; })
      .addCase(createDepartment.rejected,  (state, action) => { state.error = action.payload; })
      .addCase(deleteDepartment.fulfilled, (state, action) => {
        state.list    = state.list.filter(d => d.id !== action.payload);
        state.success = 'Department deleted!';
      });
  }
});

export const { clearDeptMessages } = departmentSlice.actions;
export default departmentSlice.reducer;
