// src/features/repairs/repairSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import repairService from './repairService';

// ── Thunks ───────────────────────────────────────────────
export const fetchAllRepairs = createAsyncThunk(
  'repairs/fetchAll',
  async (params, { rejectWithValue }) => {
    try {
      const { data } = await repairService.getAll(params);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch repairs');
    }
  }
);

export const fetchRepairsByAsset = createAsyncThunk(
  'repairs/fetchByAsset',
  async (assetId, { rejectWithValue }) => {
    try {
      const { data } = await repairService.getByAsset(assetId);
      return data.repairs;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch repairs');
    }
  }
);

export const checkAssetWarranty = createAsyncThunk(
  'repairs/checkWarranty',
  async ({ assetId, date }, { rejectWithValue }) => {
    try {
      // Pass ?date= so backend checks warranty against that specific date
      const params = date ? `?date=${date}` : '';
      const { data } = await API.get(`/repairs/check-warranty/${assetId}${params}`);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to check warranty');
    }
  }
);

export const createRepair = createAsyncThunk(
  'repairs/create',
  async ({ assetId, data }, { rejectWithValue }) => {
    try {
      const res = await repairService.create(assetId, data);
      return res.data.message;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to create repair');
    }
  }
);

export const updateRepair = createAsyncThunk(
  'repairs/update',
  async ({ repairId, data }, { rejectWithValue }) => {
    try {
      const res = await repairService.update(repairId, data);
      return { repairId, message: res.data.message };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update repair');
    }
  }
);

export const deleteRepair = createAsyncThunk(
  'repairs/delete',
  async (repairId, { rejectWithValue }) => {
    try {
      await repairService.remove(repairId);
      return repairId;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to delete repair');
    }
  }
);

// ── Slice ─────────────────────────────────────────────────
const repairSlice = createSlice({
  name: 'repairs',
  initialState: {
    list:        [],
    assetRepairs:[],    // repairs for current asset detail view
    total:       0,
    page:        1,
    totalPages:  1,
    warranty:    null,  // result of checkWarranty
    loading:     false,
    saving:      false,
    error:       null,
    success:     null,
  },

  reducers: {
    clearRepairMessages(state) {
      state.error   = null;
      state.success = null;
    },
    clearAssetRepairs(state) {
      state.assetRepairs = [];
      state.warranty     = null;
    },
  },

  extraReducers: (builder) => {
    // ── fetchAllRepairs ──
    builder
      .addCase(fetchAllRepairs.pending,   s => { s.loading = true; s.error = null; })
      .addCase(fetchAllRepairs.fulfilled, (s, a) => {
        s.loading    = false;
        s.list       = a.payload.repairs   || [];
        s.total      = a.payload.total     || 0;
        s.page       = a.payload.page      || 1;
        s.totalPages = a.payload.totalPages|| 1;
      })
      .addCase(fetchAllRepairs.rejected, (s, a) => {
        s.loading = false; s.error = a.payload;
      });

    // ── fetchRepairsByAsset ──
    builder
      .addCase(fetchRepairsByAsset.pending,   s => { s.loading = true; })
      .addCase(fetchRepairsByAsset.fulfilled, (s, a) => {
        s.loading      = false;
        s.assetRepairs = a.payload;
      })
      .addCase(fetchRepairsByAsset.rejected, (s, a) => {
        s.loading = false; s.error = a.payload;
      });

    // ── checkAssetWarranty ──
    builder
      .addCase(checkAssetWarranty.fulfilled, (s, a) => {
        s.warranty = a.payload;
      });

    // ── createRepair ──
    builder
      .addCase(createRepair.pending,   s => { s.saving = true; s.error = null; })
      .addCase(createRepair.fulfilled, (s, a) => {
        s.saving  = false;
        s.success = a.payload;
      })
      .addCase(createRepair.rejected, (s, a) => {
        s.saving = false; s.error = a.payload;
      });

    // ── updateRepair ──
    builder
      .addCase(updateRepair.pending,   s => { s.saving = true; s.error = null; })
      .addCase(updateRepair.fulfilled, (s, a) => {
        s.saving  = false;
        s.success = a.payload.message;
        // update in assetRepairs list
        const idx = s.assetRepairs.findIndex(r => r.id === a.payload.repairId);
        // will refresh via fetchRepairsByAsset after success
      })
      .addCase(updateRepair.rejected, (s, a) => {
        s.saving = false; s.error = a.payload;
      });

    // ── deleteRepair ──
    builder
      .addCase(deleteRepair.fulfilled, (s, a) => {
        s.success      = 'Repair deleted';
        s.assetRepairs = s.assetRepairs.filter(r => r.id !== a.payload);
        s.list         = s.list.filter(r => r.id !== a.payload);
      })
      .addCase(deleteRepair.rejected, (s, a) => { s.error = a.payload; });
  },
});

export const { clearRepairMessages, clearAssetRepairs } = repairSlice.actions;
export default repairSlice.reducer;
