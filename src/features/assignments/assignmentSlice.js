import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import assignmentService from './assignmentService';

const safeList = (v) => (Array.isArray(v) ? v : []);

export const fetchAllAssignments = createAsyncThunk('assignments/fetchAll',
  async (_, { rejectWithValue }) => {
    try { return await assignmentService.getAllAssignments(); }
    catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed'); }
  }
);
export const fetchAssignmentHistory = createAsyncThunk('assignments/fetchHistory',
  async (assetId, { rejectWithValue }) => {
    try { return await assignmentService.getHistory(assetId); }
    catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed'); }
  }
);
export const fetchMyAssignments = createAsyncThunk('assignments/fetchMine',
  async (_, { rejectWithValue }) => {
    try { return await assignmentService.getMyAssignments(); }
    catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed'); }
  }
);
export const fetchAssignmentById = createAsyncThunk('assignments/fetchById',
  async (id, { rejectWithValue }) => {
    try { return await assignmentService.getById(id); }
    catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed'); }
  }
);
export const assignAsset = createAsyncThunk('assignments/assign',
  async ({ assetId, data }, { rejectWithValue }) => {
    try { return await assignmentService.assign(assetId, data); }
    catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed'); }
  }
);
export const bulkAssignAssets = createAsyncThunk('assignments/bulkAssign',
  async (data, { rejectWithValue }) => {
    try { return await assignmentService.bulkAssign(data); }
    catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed to assign'); }
  }
);
export const returnAsset = createAsyncThunk('assignments/return',
  async ({ assignmentId, data }, { rejectWithValue }) => {
    try { return await assignmentService.returnAsset(assignmentId, data); }
    catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed'); }
  }
);
export const bulkReturnAssets = createAsyncThunk('assignments/bulkReturn',
  async (data, { rejectWithValue }) => {
    try { return await assignmentService.bulkReturn(data); }
    catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed to return'); }
  }
);
export const uploadReturnDoc = createAsyncThunk('assignments/uploadReturnDoc',
  async ({ assignmentId, file, meta }, { rejectWithValue }) => {
    try { return await assignmentService.uploadReturnDoc(assignmentId, file, meta); }
    catch (e) { return rejectWithValue(e.response?.data?.message || 'Upload failed'); }
  }
);

export const uploadAssignDoc = createAsyncThunk('assignments/uploadAssignDoc',
  async ({ assignmentId, file }, { rejectWithValue }) => {
    try { return await assignmentService.uploadAssignDoc(assignmentId, file); }
    catch (e) { return rejectWithValue(e.response?.data?.message || 'Upload failed'); }
  }
);

export const uploadGatePassDoc = createAsyncThunk('assignments/uploadGatePassDoc',
  async ({ assignmentId, file }, { rejectWithValue }) => {
    try { return await assignmentService.uploadGatePassDoc(assignmentId, file); }
    catch (e) { return rejectWithValue(e.response?.data?.message || 'Upload failed'); }
  }
);

const assignmentSlice = createSlice({
  name: 'assignments',
  initialState: {
    list:              [],
    history:           [],
    mine:              [],
    current:           null,
    loading:           false,
    saving:            false,
    uploading:         false,
    uploadingAssign:      false,
    uploadingGatePass:    false,
    error:                null,
    success:              null,
    uploadSuccess:        null,
    uploadError:          null,
    assignDocSuccess:     null,
    assignDocError:       null,
    gatePassDocSuccess:   null,
    gatePassDocError:     null,
    lastCIA:              null,
    lastAssignments:      [],
    lastReturned:         [],
    returnDocs:           {},
    assignDocs:           {},
    gatePassDocs:         {},
  },
  reducers: {
    clearAssignmentMessages: (s) => {
      s.error = null; s.success = null; s.lastCIA = null;
      s.lastAssignments = []; s.lastReturned = [];
    },
    clearUploadMessages: (s) => {
      s.uploadSuccess = null; s.uploadError = null;
    },
    clearAssignDocMessages: (s) => {
      s.assignDocSuccess = null; s.assignDocError = null;
    },
    clearGatePassDocMessages: (s) => {
      s.gatePassDocSuccess = null; s.gatePassDocError = null;
    },
    clearCurrentAssignment: (s) => { s.current = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllAssignments.pending,   (s)    => { s.loading = true;  s.error = null; })
      .addCase(fetchAllAssignments.fulfilled, (s, a) => { s.loading = false; s.list = safeList(a.payload?.data); })
      .addCase(fetchAllAssignments.rejected,  (s, a) => { s.loading = false; s.error = a.payload; })

      .addCase(fetchAssignmentHistory.pending,   (s)    => { s.loading = true; })
      .addCase(fetchAssignmentHistory.fulfilled, (s, a) => { s.loading = false; s.history = safeList(a.payload?.data); })
      .addCase(fetchAssignmentHistory.rejected,  (s, a) => { s.loading = false; s.error = a.payload; })

      .addCase(fetchMyAssignments.pending,   (s)    => { s.loading = true; })
      .addCase(fetchMyAssignments.fulfilled, (s, a) => { s.loading = false; s.mine = safeList(a.payload?.data); })
      .addCase(fetchMyAssignments.rejected,  (s, a) => { s.loading = false; s.error = a.payload; })

      .addCase(fetchAssignmentById.pending,   (s)    => { s.loading = true;  s.current = null; })
      .addCase(fetchAssignmentById.fulfilled, (s, a) => { s.loading = false; s.current = a.payload?.data || null; })
      .addCase(fetchAssignmentById.rejected,  (s, a) => { s.loading = false; s.error = a.payload; })

      .addCase(assignAsset.pending,   (s)    => { s.saving = true;  s.error = null; })
      .addCase(assignAsset.fulfilled, (s, a) => {
        s.saving = false;
        s.success = `Asset assigned!${a.payload?.ciaUpdated ? ` CIA → ${a.payload.newCIA?.classification}` : ''}`;
        s.lastCIA = a.payload?.newCIA || null;
      })
      .addCase(assignAsset.rejected,  (s, a) => { s.saving = false; s.error = a.payload; })

      .addCase(bulkAssignAssets.pending,   (s)    => { s.saving = true;  s.error = null; })
      .addCase(bulkAssignAssets.fulfilled, (s, a) => {
        s.saving = false;
        s.success = `${a.payload?.assignments?.length || 0} asset(s) assigned!${a.payload?.ciaUpdated ? ` CIA → ${a.payload.newCIA?.classification}` : ''}`;
        s.lastCIA         = a.payload?.newCIA         || null;
        s.lastAssignments = a.payload?.assignments     || [];
      })
      .addCase(bulkAssignAssets.rejected,  (s, a) => { s.saving = false; s.error = a.payload; })

      .addCase(returnAsset.pending,   (s)    => { s.saving = true;  s.error = null; })
      .addCase(returnAsset.fulfilled, (s, a) => {
        s.saving = false;
        s.success = 'Asset returned successfully. Please upload the signed return document.';
      })
      .addCase(returnAsset.rejected,  (s, a) => { s.saving = false; s.error = a.payload; })

      .addCase(bulkReturnAssets.pending,   (s)    => { s.saving = true;  s.error = null; })
      .addCase(bulkReturnAssets.fulfilled, (s, a) => {
        s.saving       = false;
        s.success      = `${a.payload?.returned?.length || 0} asset(s) returned.`;
        s.lastReturned = a.payload?.returned || [];
      })
      .addCase(bulkReturnAssets.rejected,  (s, a) => { s.saving = false; s.error = a.payload; })

      // ── Upload return doc ──────────────────────────────
      .addCase(uploadReturnDoc.pending,   (s)    => { s.uploading = true; s.uploadError = null; s.uploadSuccess = null; })
      .addCase(uploadReturnDoc.fulfilled, (s, a) => {
        s.uploading     = false;
        s.uploadSuccess = 'Signed return document uploaded successfully.';
        const id = a.payload?.assignmentId;
        if (id) s.returnDocs[id] = a.payload?.document || null;
        const idx = s.list.findIndex(item => item.id === id);
        if (idx !== -1 && a.payload?.document) {
          s.list[idx] = { ...s.list[idx], return_doc_id: a.payload.document.id, return_document_id: a.payload.document.id };
        }
        // Also patch current if open
        if (s.current && String(s.current.id) === String(id)) {
          s.current.return_document = a.payload?.document || null;
        }
      })
      .addCase(uploadReturnDoc.rejected,  (s, a) => { s.uploading = false; s.uploadError = a.payload; })

      // ── Upload assign doc ──────────────────────────────
      .addCase(uploadAssignDoc.pending,   (s)    => { s.uploadingAssign = true; s.assignDocError = null; s.assignDocSuccess = null; })
      .addCase(uploadAssignDoc.fulfilled, (s, a) => {
        s.uploadingAssign = false;
        s.assignDocSuccess = 'Assignment document uploaded successfully.';
        const id = a.payload?.assignmentId;
        if (id) s.assignDocs[id] = a.payload?.document || null;
        // Patch current detail view immediately — no refetch needed
        if (s.current && String(s.current.id) === String(id)) {
          s.current.assign_document = a.payload?.document || null;
          s.current.assign_document_id = a.payload?.documentId || null;
        }
      })
      .addCase(uploadAssignDoc.rejected,  (s, a) => { s.uploadingAssign = false; s.assignDocError = a.payload; })

      // ── Upload gate pass doc ───────────────────────────
      .addCase(uploadGatePassDoc.pending,   (s)    => { s.uploadingGatePass = true; s.gatePassDocError = null; s.gatePassDocSuccess = null; })
      .addCase(uploadGatePassDoc.fulfilled, (s, a) => {
        s.uploadingGatePass = false;
        s.gatePassDocSuccess = 'Gate pass document uploaded successfully.';
        const id = a.payload?.assignmentId;
        if (id) s.gatePassDocs[id] = a.payload?.document || null;
        if (s.current && String(s.current.id) === String(id)) {
          s.current.gate_pass_document = a.payload?.document || null;
          s.current.gate_pass_document_id = a.payload?.documentId || null;
        }
      })
      .addCase(uploadGatePassDoc.rejected,  (s, a) => { s.uploadingGatePass = false; s.gatePassDocError = a.payload; });
  },
});

export const {
  clearAssignmentMessages,
  clearUploadMessages,
  clearAssignDocMessages,
  clearGatePassDocMessages,
  clearCurrentAssignment,
} = assignmentSlice.actions;

export default assignmentSlice.reducer;
