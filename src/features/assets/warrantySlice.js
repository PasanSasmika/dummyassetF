import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import warrantyService from './warrantyService';

export const fetchWarranties = createAsyncThunk('warranties/fetchAll',
  async (assetId, { rejectWithValue }) => {
    try { return await warrantyService.getAll(assetId); }
    catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed to fetch warranties'); }
  }
);

export const createWarranty = createAsyncThunk('warranties/create',
  async ({ assetId, data }, { rejectWithValue }) => {
    try { return await warrantyService.create(assetId, data); }
    catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed to create warranty'); }
  }
);

export const updateWarranty = createAsyncThunk('warranties/update',
  async ({ assetId, warrantyId, data }, { rejectWithValue }) => {
    try { return await warrantyService.update(assetId, warrantyId, data); }
    catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed to update warranty'); }
  }
);

export const deleteWarranty = createAsyncThunk('warranties/delete',
  async ({ assetId, warrantyId }, { rejectWithValue }) => {
    try { await warrantyService.remove(assetId, warrantyId); return warrantyId; }
    catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed to delete warranty'); }
  }
);

// ✅ safe helper
const safeList = (val) => (Array.isArray(val) ? val : []);

const warrantySlice = createSlice({
  name: 'warranties',
  initialState: {
    list:    [],   // ✅ always starts as array
    loading: false,
    saving:  false,
    error:   null,
    success: null,
  },
  reducers: {
    clearWarrantyMessages: (state) => {
      state.error   = null;
      state.success = null;
    },
    clearWarranties: (state) => {
      state.list    = [];
      state.error   = null;
      state.success = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // ── fetchWarranties ──────────────────────────────
      .addCase(fetchWarranties.pending, (s) => {
        s.loading = true;
        s.error   = null;
      })
      .addCase(fetchWarranties.fulfilled, (s, a) => {
        s.loading = false;
        // ✅ handles { success, count, data: [...] }
        const payload = a.payload;
        s.list = Array.isArray(payload)
          ? payload
          : safeList(payload?.data);
      })
      .addCase(fetchWarranties.rejected, (s, a) => {
        s.loading = false;
        s.error   = a.payload;
        s.list    = []; // ✅ reset to empty array on error
      })

      // ── createWarranty ───────────────────────────────
      .addCase(createWarranty.pending, (s) => {
        s.saving = true;
        s.error  = null;
      })
      .addCase(createWarranty.fulfilled, (s, a) => {
        s.saving  = false;
        s.success = 'Warranty added successfully!';
        // ✅ safely spread — s.list guaranteed array now
        const newWarranty = a.payload?.data ?? a.payload;
        s.list = newWarranty
          ? [newWarranty, ...safeList(s.list)]
          : safeList(s.list);
      })
      .addCase(createWarranty.rejected, (s, a) => {
        s.saving = false;
        s.error  = a.payload;
      })

      // ── updateWarranty ───────────────────────────────
      .addCase(updateWarranty.pending, (s) => {
        s.saving = true;
        s.error  = null;
      })
      .addCase(updateWarranty.fulfilled, (s, a) => {
        s.saving  = false;
        s.success = 'Warranty updated successfully!';
        const updated = a.payload?.data ?? a.payload;
        if (updated?.id) {
          // ✅ replace in list safely
          s.list = safeList(s.list).map(w =>
            w.id === updated.id ? updated : w
          );
        }
      })
      .addCase(updateWarranty.rejected, (s, a) => {
        s.saving = false;
        s.error  = a.payload;
      })

      // ── deleteWarranty ───────────────────────────────
      .addCase(deleteWarranty.pending, (s) => {
        s.saving = true;
        s.error  = null;
      })
      .addCase(deleteWarranty.fulfilled, (s, a) => {
        s.saving  = false;
        s.success = 'Warranty deleted!';
        // ✅ filter safely
        s.list = safeList(s.list).filter(w => w.id !== a.payload);
      })
      .addCase(deleteWarranty.rejected, (s, a) => {
        s.saving = false;
        s.error  = a.payload;
      });
  },
});

export const { clearWarrantyMessages, clearWarranties } = warrantySlice.actions;
export default warrantySlice.reducer;
