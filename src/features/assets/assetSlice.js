import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import assetService from './assetService';

export const fetchAssets = createAsyncThunk('assets/fetchAll',
  async (params, { rejectWithValue }) => {
    try { return await assetService.getAll(params); }
    catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed to fetch assets'); }
  }
);

export const fetchAssetById = createAsyncThunk('assets/fetchById',
  async (id, { rejectWithValue }) => {
    try { return await assetService.getById(id); }
    catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed to fetch asset'); }
  }
);

export const createAsset = createAsyncThunk('assets/create',
  async (body, { rejectWithValue }) => {
    try { return await assetService.create(body); }
    catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed to create asset'); }
  }
);

export const updateAsset = createAsyncThunk('assets/update',
  async ({ id, data }, { rejectWithValue }) => {
    try { return await assetService.update(id, data); }
    catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed to update asset'); }
  }
);

export const deleteAsset = createAsyncThunk('assets/delete',
  async (id, { rejectWithValue }) => {
    try { await assetService.remove(id); return id; }
    catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed to delete asset'); }
  }
);

export const fetchAssetHistory = createAsyncThunk('assets/fetchHistory',
  async (id, { rejectWithValue }) => {
    try { return await assetService.getHistory(id); }
    catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed to fetch history'); }
  }
);

// ✅ Bulk import
export const bulkImportAssets = createAsyncThunk('assets/bulkImport',
  async (assets, { rejectWithValue }) => {
    try { return await assetService.bulkCreate(assets); }
    catch (err) { return rejectWithValue(err.response?.data?.message || 'Bulk import failed'); }
  }
);

const assetSlice = createSlice({
  name: 'assets',
  initialState: {
    list:    [],
    total:   0,
    current: null,
    history: [],
    loading: false,
    saving:  false,
    error:   null,
    success: null,
  },
  reducers: {
    clearAssetMessages: (state) => { state.error = null; state.success = null; },
    clearCurrentAsset:  (state) => { state.current = null; state.history = []; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAssets.pending,   (s)    => { s.loading = true;  s.error = null; })
      .addCase(fetchAssets.fulfilled, (s, a) => {
        s.loading = false;
        s.list    = a.payload?.data ?? (Array.isArray(a.payload) ? a.payload : []);
        s.total   = a.payload?.count ?? s.list.length;
      })
      .addCase(fetchAssets.rejected,  (s, a) => { s.loading = false; s.error = a.payload; })

      .addCase(fetchAssetById.pending,   (s)    => { s.loading = true;  s.error = null; })
      .addCase(fetchAssetById.fulfilled, (s, a) => { s.loading = false; s.current = a.payload?.data ?? a.payload; })
      .addCase(fetchAssetById.rejected,  (s, a) => { s.loading = false; s.error = a.payload; })

      .addCase(createAsset.pending,   (s)    => { s.saving = true;  s.error = null; })
      .addCase(createAsset.fulfilled, (s)    => { s.saving = false; s.success = 'Asset created successfully!'; })
      .addCase(createAsset.rejected,  (s, a) => { s.saving = false; s.error = a.payload; })

      .addCase(updateAsset.pending,   (s)    => { s.saving = true;  s.error = null; })
      .addCase(updateAsset.fulfilled, (s, a) => {
        s.saving  = false;
        s.success = 'Asset updated successfully!';
        s.current = a.payload?.data ?? a.payload;
      })
      .addCase(updateAsset.rejected,  (s, a) => { s.saving = false; s.error = a.payload; })

      .addCase(deleteAsset.fulfilled, (s, a) => {
        s.list    = s.list.filter(x => x.id !== a.payload);
        s.success = 'Asset deleted!';
      })

      .addCase(fetchAssetHistory.fulfilled, (s, a) => {
  s.history = a.payload?.data ?? a.payload ?? [];
})

      // ✅ Bulk import
      .addCase(bulkImportAssets.pending,   (s)    => { s.saving = true;  s.error = null; })
      .addCase(bulkImportAssets.fulfilled, (s, a) => {
        s.saving  = false;
        s.success = `${a.payload?.created || 0} assets imported successfully!`;
      })
      .addCase(bulkImportAssets.rejected,  (s, a) => { s.saving = false; s.error = a.payload; })
  },
});

export const { clearAssetMessages, clearCurrentAsset } = assetSlice.actions;
export default assetSlice.reducer;
