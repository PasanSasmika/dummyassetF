import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import authService from './authService';

// ─── Thunks — only call service, no API logic here ──────
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      return await authService.login(email, password);
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || 'Login failed'
      );
    }
  }
);

export const fetchMyProfile = createAsyncThunk(
  'auth/fetchMyProfile',
  async (_, { rejectWithValue }) => {
    try {
      return await authService.getMyProfile();
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || 'Failed to fetch profile'
      );
    }
  }
);

const getUserFromStorage = () => {
  try {
    const item = localStorage.getItem('user');
    // Only parse if it exists AND is not the literal string "undefined"
    if (item && item !== 'undefined') {
      return JSON.parse(item);
    }
    return null;
  } catch (error) {
    console.error("Error parsing user from localStorage", error);
    return null;
  }
};

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: getUserFromStorage(),
    token:   localStorage.getItem('token') || null,
    loading: false,
    error:   null,
  },
  reducers: {
    logout: (state) => {
      authService.logout(); // localStorage clear
      state.user  = null;
      state.token = null;
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error   = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user    = action.payload.data || null;
        state.token   = action.payload.token;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error   = action.payload;
      })
      .addCase(fetchMyProfile.fulfilled, (state, action) => {
        state.user = { ...state.user, ...action.payload };
        localStorage.setItem('user', JSON.stringify(state.user));
      });
  }
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;
