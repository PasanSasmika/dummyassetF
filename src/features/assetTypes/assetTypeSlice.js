import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import assetTypeService from './assetTypeService';

const safeList = (v) => (Array.isArray(v) ? v : []);

export const fetchAllAssetTypes = createAsyncThunk('assetTypes/fetchAll',
  async (category, { rejectWithValue }) => {
    try { return await assetTypeService.getAll(category); }
    catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed to fetch'); }
  }
);

export const fetchAssetTypeById = createAsyncThunk('assetTypes/fetchById',
  async (id, { rejectWithValue }) => {
    try { return await assetTypeService.getById(id); }
    catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed to fetch'); }
  }
);

export const createAssetType = createAsyncThunk('assetTypes/create',
  async (body, { rejectWithValue }) => {
    try { return await assetTypeService.create(body); }
    catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed to create'); }
  }
);

export const updateAssetType = createAsyncThunk('assetTypes/update',
  async ({ id, body }, { rejectWithValue }) => {
    try { return await assetTypeService.update(id, body); }
    catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed to update'); }
  }
);

const assetTypeSlice = createSlice({
  name: 'assetTypes',
  initialState: {
    list:    [],
    grouped: {},
    current: null,
    loading: false,
    saving:  false,
    error:   null,
    success: null,
  },
  reducers: {
    clearAssetTypeMessages: (s) => { s.error = null; s.success = null; },
    clearCurrentAssetType:  (s) => { s.current = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllAssetTypes.pending,   (s)    => { s.loading = true;  s.error = null; })
      .addCase(fetchAllAssetTypes.fulfilled, (s, a) => {
        s.loading = false;
        s.list    = safeList(a.payload?.data);
        s.grouped = a.payload?.grouped || {};
      })
      .addCase(fetchAllAssetTypes.rejected,  (s, a) => { s.loading = false; s.error = a.payload; })

      .addCase(fetchAssetTypeById.pending,   (s)    => { s.loading = true;  s.current = null; })
      .addCase(fetchAssetTypeById.fulfilled, (s, a) => { s.loading = false; s.current = a.payload?.data || null; })
      .addCase(fetchAssetTypeById.rejected,  (s, a) => { s.loading = false; s.error = a.payload; })

      .addCase(createAssetType.pending,   (s)    => { s.saving = true;  s.error = null; })
      .addCase(createAssetType.fulfilled, (s, a) => {
        s.saving  = false;
        s.success = `Asset type "${a.payload?.data?.name}" created successfully`;
      })
      .addCase(createAssetType.rejected,  (s, a) => { s.saving = false; s.error = a.payload; })

      .addCase(updateAssetType.pending,   (s)    => { s.saving = true;  s.error = null; })
      .addCase(updateAssetType.fulfilled, (s, a) => {
        s.saving  = false;
        s.success = `Asset type "${a.payload?.data?.name}" updated successfully`;
      })
      .addCase(updateAssetType.rejected,  (s, a) => { s.saving = false; s.error = a.payload; })
  },
});

export const { clearAssetTypeMessages, clearCurrentAssetType } = assetTypeSlice.actions;
export default assetTypeSlice.reducer;
