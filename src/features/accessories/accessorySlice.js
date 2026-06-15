import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import accessoryService from './accessoryService';

const safe = (v) => (Array.isArray(v) ? v : []);

// ── Thunks ────────────────────────────────────────────────
export const fetchAccessories = createAsyncThunk(
  'accessories/fetchAll',
  async (_, { rejectWithValue }) => {
    try { return await accessoryService.getAll(); }
    catch (e) { return rejectWithValue(); }
  }
);

export const fetchAccessoryById = createAsyncThunk(
  'accessories/fetchById',
  async (id, { rejectWithValue }) => {
    try { return await accessoryService.getById(id); }
    catch (e) { return rejectWithValue(); }
  }
);

export const fetchAccessoryAssignments = createAsyncThunk(
  'accessories/fetchAssignments',
  async (_, { rejectWithValue }) => {
    try { return await accessoryService.getAllAssignments(); }
    catch (e) { return rejectWithValue(); }
  }
);

export const createAccessory = createAsyncThunk(
  'accessories/create',
  async (data, { rejectWithValue }) => {
    try { return await accessoryService.create(data); }
    catch (e) { return rejectWithValue(); }
  }
);

export const updateAccessory = createAsyncThunk(
  'accessories/update',
  async ({ id, data }, { rejectWithValue }) => {
    try { return await accessoryService.update(id, data); }
    catch (e) { return rejectWithValue(); }
  }
);

export const deleteAccessory = createAsyncThunk(
  'accessories/delete',
  async (id, { rejectWithValue }) => {
    try { return await accessoryService.remove(id); }
    catch (e) { return rejectWithValue(); }
  }
);

export const toggleAccessoryStatus = createAsyncThunk(
  'accessories/toggle',
  async (id, { rejectWithValue }) => {
    try { return await accessoryService.toggle(id); }
    catch (e) { return rejectWithValue(); }
  }
);

export const assignAccessory = createAsyncThunk(
  'accessories/assign',
  async (data, { rejectWithValue }) => {
    try { return await accessoryService.assign(data); }
    catch (e) { return rejectWithValue(); }
  }
);

export const returnAccessory = createAsyncThunk(
  'accessories/return',
  async ({ assignmentId, data }, { rejectWithValue }) => {
    try { return await accessoryService.returnAcc(assignmentId, data); }
    catch (e) { return rejectWithValue(); }
  }
);

// ── Slice ─────────────────────────────────────────────────
const accessorySlice = createSlice({
  name: 'accessories',
  initialState: {
    list:        [],
    assignments: [],
    current:     null,
    loading:     false,
    saving:      false,
    error:       null,
    success:     null,
  },
  reducers: {
    clearAccessoryMessages: (s) => { s.error = null; s.success = null; },
    clearCurrentAccessory:  (s) => { s.current = null; },
  },
  extraReducers: (builder) => {
    const onPending  = (s)    => { s.loading = true;  s.error = null; };
    const onReject   = (s, a) => { s.loading = false; s.error = a.payload; };
    const onSavePend = (s)    => { s.saving  = true;  s.error = null; };
    const onSaveRej  = (s, a) => { s.saving  = false; s.error = a.payload; };

    builder
      // fetch all
      .addCase(fetchAccessories.pending,   onPending)
      .addCase(fetchAccessories.fulfilled, (s, a) => {
        s.loading = false;
        s.list    = safe(a.payload?.data);
      })
      .addCase(fetchAccessories.rejected,  onReject)

      // fetch by id
      .addCase(fetchAccessoryById.pending,   onPending)
      .addCase(fetchAccessoryById.fulfilled, (s, a) => {
        s.loading = false;
        s.current = a.payload?.data || null;
      })
      .addCase(fetchAccessoryById.rejected,  onReject)

      // fetch assignments
      .addCase(fetchAccessoryAssignments.pending,   onPending)
      .addCase(fetchAccessoryAssignments.fulfilled, (s, a) => {
        s.loading     = false;
        s.assignments = safe(a.payload?.data);
      })
      .addCase(fetchAccessoryAssignments.rejected,  onReject)

      // create
      .addCase(createAccessory.pending,   onSavePend)
      .addCase(createAccessory.fulfilled, (s, a) => {
        s.saving  = false;
        s.success = 'Accessory created successfully!';
        s.list    = [a.payload.data, ...s.list];
      })
      .addCase(createAccessory.rejected,  onSaveRej)

      // update
      .addCase(updateAccessory.pending,   onSavePend)
      .addCase(updateAccessory.fulfilled, (s, a) => {
        s.saving  = false;
        s.success = 'Accessory updated successfully!';
        s.list    = s.list.map(x =>
          x.id === a.payload.data.id ? a.payload.data : x
        );
      })
      .addCase(updateAccessory.rejected,  onSaveRej)

      // delete
      .addCase(deleteAccessory.pending,   onSavePend)
      .addCase(deleteAccessory.fulfilled, (s, a) => {
        s.saving  = false;
        s.success = 'Accessory deleted!';
        s.list    = s.list.filter(x => x.id !== a.meta.arg);
      })
      .addCase(deleteAccessory.rejected,  onSaveRej)

      // toggle
      .addCase(toggleAccessoryStatus.fulfilled, (s, a) => {
        s.list = s.list.map(x =>
          x.id === Number(a.meta.arg)
            ? { ...x, is_active: a.payload.is_active }
            : x
        );
      })

      // assign
      .addCase(assignAccessory.pending,   onSavePend)
      .addCase(assignAccessory.fulfilled, (s) => {
        s.saving  = false;
        s.success = 'Accessory assigned to asset successfully!';
      })
      .addCase(assignAccessory.rejected,  onSaveRej)

      // return
      .addCase(returnAccessory.pending,   onSavePend)
      .addCase(returnAccessory.fulfilled, (s) => {
        s.saving  = false;
        s.success = 'Accessory returned successfully!';
      })
      .addCase(returnAccessory.rejected,  onSaveRej);
  },
});

export const {
  clearAccessoryMessages,
  clearCurrentAccessory,
} = accessorySlice.actions;

export default accessorySlice.reducer;
