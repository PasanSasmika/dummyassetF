import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import salvageService from './salvageService';

// ── Thunks ────────────────────────────────────────────────

export const fetchAllSalvaged = createAsyncThunk('salvage/fetchAll',
  async (params, { rejectWithValue }) => {
    try { return await salvageService.getAll(params); }
    catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed to fetch salvaged assets.'); }
  }
);

export const fetchSalvagedById = createAsyncThunk('salvage/fetchById',
  async (assetId, { rejectWithValue }) => {
    try { return await salvageService.getById(assetId); }
    catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed to fetch salvage record.'); }
  }
);

export const salvageAsset = createAsyncThunk('salvage/salvage',
  async ({ assetId, data }, { rejectWithValue }) => {
    try { return await salvageService.salvage(assetId, data); }
    catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed to salvage asset.'); }
  }
);

export const updateSalvageRecord = createAsyncThunk('salvage/update',
  async ({ assetId, data }, { rejectWithValue }) => {
    try { return await salvageService.update(assetId, data); }
    catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed to update salvage record.'); }
  }
);

export const unsalvageAsset = createAsyncThunk('salvage/unsalvage',
  async (assetId, { rejectWithValue }) => {
    try { return await salvageService.unsalvage(assetId); }
    catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed to restore asset.'); }
  }
);

// ── Slice ─────────────────────────────────────────────────

const salvageSlice = createSlice({
  name: 'salvage',
  initialState: {
    list:       [],       // all salvaged assets
    current:    null,     // single salvage record
    total:      0,
    page:       1,
    totalPages: 1,
    loading:    false,
    saving:     false,
    error:      null,
    success:    null,
  },
  reducers: {
    clearSalvageMessages: (state) => {
      state.error   = null;
      state.success = null;
    },
    clearCurrentSalvage: (state) => {
      state.current = null;
    },
  },
  extraReducers: (builder) => {
    builder

      // ── fetchAllSalvaged ──
      .addCase(fetchAllSalvaged.pending,   (state) => { state.loading = true;  state.error = null; })
      .addCase(fetchAllSalvaged.fulfilled, (state, action) => {
        state.loading    = false;
        state.list       = action.payload.data       || [];
        state.total      = action.payload.total      || 0;
        state.page       = action.payload.page       || 1;
        state.totalPages = action.payload.totalPages || 1;
      })
      .addCase(fetchAllSalvaged.rejected,  (state, action) => { state.loading = false; state.error = action.payload; })

      // ── fetchSalvagedById ──
      .addCase(fetchSalvagedById.pending,   (state) => { state.loading = true;  state.error = null; })
      .addCase(fetchSalvagedById.fulfilled, (state, action) => {
        state.loading = false;
        state.current = action.payload.data || null;
      })
      .addCase(fetchSalvagedById.rejected,  (state, action) => { state.loading = false; state.error = action.payload; })

      // ── salvageAsset ──
      .addCase(salvageAsset.pending,   (state) => { state.saving = true;  state.error = null; state.success = null; })
      .addCase(salvageAsset.fulfilled, (state, action) => {
        state.saving  = false;
        state.success = action.payload.message || 'Asset salvaged successfully.';
      })
      .addCase(salvageAsset.rejected,  (state, action) => { state.saving = false; state.error = action.payload; })

      // ── updateSalvageRecord ──
      .addCase(updateSalvageRecord.pending,   (state) => { state.saving = true;  state.error = null; state.success = null; })
      .addCase(updateSalvageRecord.fulfilled, (state, action) => {
        state.saving  = false;
        state.success = action.payload.message || 'Salvage record updated.';
      })
      .addCase(updateSalvageRecord.rejected,  (state, action) => { state.saving = false; state.error = action.payload; })

      // ── unsalvageAsset ──
      .addCase(unsalvageAsset.pending,   (state) => { state.saving = true;  state.error = null; state.success = null; })
      .addCase(unsalvageAsset.fulfilled, (state, action) => {
        state.saving  = false;
        state.success = action.payload.message || 'Asset restored to Available.';
        // Remove from list if present
        state.list    = state.list.filter(r => r.asset_id !== action.meta.arg);
      })
      .addCase(unsalvageAsset.rejected,  (state, action) => { state.saving = false; state.error = action.payload; });
  },
});

export const { clearSalvageMessages, clearCurrentSalvage } = salvageSlice.actions;
export default salvageSlice.reducer;
