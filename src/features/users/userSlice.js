import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import userService from './userService';

export const fetchUsers = createAsyncThunk('users/fetchAll',
  async (_, { rejectWithValue }) => {
    try { return await userService.getAll(); }
    catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed'); }
  }
);

export const registerUser = createAsyncThunk('users/register',
  async (body, { rejectWithValue }) => {
    try { return await userService.register(body); }
    catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed'); }
  }
);

export const updateUser = createAsyncThunk('users/update',
  async ({ id, data }, { rejectWithValue }) => {
    try { return await userService.update(id, data); }
    catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed'); }
  }
);

export const updateUserStatus = createAsyncThunk('users/updateStatus',
  async ({ id, status }, { rejectWithValue }) => {
    try { return await userService.updateStatus(id, status); }
    catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed'); }
  }
);

export const assignUserRole = createAsyncThunk('users/assignRole',
  async ({ id, role }, { rejectWithValue }) => {
    try { return await userService.assignRole(id, { role_name: role }); }
    catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed'); }
  }
);

const userSlice = createSlice({
  name: 'users',
  initialState: {
    list:         [],
    selectedUser: null,
    loading:      false,
    saving:       false,
    error:        null,
    success:      null,
  },
  reducers: {
    clearUserMessages: (state) => { state.error = null; state.success = null; },
    clearSelectedUser: (state) => { state.selectedUser = null; },
  },
  extraReducers: (builder) => {
    builder
      // fetchUsers
      .addCase(fetchUsers.pending,   (state) => { state.loading = true;  state.error = null; })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.list    = action.payload.data || [];
      })
      .addCase(fetchUsers.rejected,  (state, action) => { state.loading = false; state.error = action.payload; })

      // registerUser
      .addCase(registerUser.pending,   (state) => { state.loading = true;  state.error = null; })
      .addCase(registerUser.fulfilled, (state) => { state.loading = false; state.success = 'User created successfully!'; })
      .addCase(registerUser.rejected,  (state, action) => { state.loading = false; state.error = action.payload; })

      // updateUser
      .addCase(updateUser.pending,   (state) => { state.saving = true;  state.error = null; })
      .addCase(updateUser.fulfilled, (state) => { state.saving = false; state.success = 'User updated successfully!'; })
      .addCase(updateUser.rejected,  (state, action) => { state.saving = false; state.error = action.payload; })

      // updateUserStatus
      .addCase(updateUserStatus.pending,   (state) => { state.saving = true;  state.error = null; })
      .addCase(updateUserStatus.fulfilled, (state) => { state.saving = false; state.success = 'User status updated!'; })
      .addCase(updateUserStatus.rejected,  (state, action) => { state.saving = false; state.error = action.payload; })

      // assignUserRole
      .addCase(assignUserRole.pending,   (state) => { state.saving = true;  state.error = null; })
      .addCase(assignUserRole.fulfilled, (state) => { state.saving = false; state.success = 'Role assigned successfully!'; })
      .addCase(assignUserRole.rejected,  (state, action) => { state.saving = false; state.error = action.payload; });
  },
});

export const { clearUserMessages, clearSelectedUser } = userSlice.actions;
export default userSlice.reducer;
