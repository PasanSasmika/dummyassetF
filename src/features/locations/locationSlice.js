import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import locationService from './locationService';

const safe = v => Array.isArray(v) ? v : [];

export const fetchLocations    = createAsyncThunk('locations/fetchAll',    async (_, { rejectWithValue }) => { try { return await locationService.getAll();       } catch(e) { return rejectWithValue(e.response?.data?.message || 'Failed'); } });
export const createLocation    = createAsyncThunk('locations/create',      async (data, { rejectWithValue }) => { try { return await locationService.create(data);     } catch(e) { return rejectWithValue(e.response?.data?.message || 'Failed'); } });
export const updateLocation    = createAsyncThunk('locations/update',      async ({ id, data }, { rejectWithValue }) => { try { return await locationService.update(id, data); } catch(e) { return rejectWithValue(e.response?.data?.message || 'Failed'); } });
export const deleteLocation    = createAsyncThunk('locations/delete',      async (id, { rejectWithValue }) => { try { return await locationService.remove(id);     } catch(e) { return rejectWithValue(e.response?.data?.message || 'Failed'); } });
export const fetchSubLocations = createAsyncThunk('locations/fetchAllSubs',async (_, { rejectWithValue }) => { try { return await locationService.getAllSubs();    } catch(e) { return rejectWithValue(e.response?.data?.message || 'Failed'); } });
export const createSubLocation = createAsyncThunk('locations/createSub',   async (data, { rejectWithValue }) => { try { return await locationService.createSub(data);  } catch(e) { return rejectWithValue(e.response?.data?.message || 'Failed'); } });
export const updateSubLocation = createAsyncThunk('locations/updateSub',   async ({ id, data }, { rejectWithValue }) => { try { return await locationService.updateSub(id, data); } catch(e) { return rejectWithValue(e.response?.data?.message || 'Failed'); } });
export const deleteSubLocation = createAsyncThunk('locations/deleteSub',   async (id, { rejectWithValue }) => { try { return await locationService.removeSub(id);  } catch(e) { return rejectWithValue(e.response?.data?.message || 'Failed'); } });

const locationSlice = createSlice({
  name: 'locations',
  initialState: { list: [], subList: [], loading: false, saving: false, error: null, success: null },
  reducers: {
    clearLocationMessages: s => { s.error = null; s.success = null; },
  },
  extraReducers: builder => {
    const pend  = s    => { s.loading = true;  s.error = null; };
    const rej   = (s,a)=> { s.loading = false; s.error = a.payload; };
    const sp    = s    => { s.saving  = true;  s.error = null; };
    const sr    = (s,a)=> { s.saving  = false; s.error = a.payload; };

    builder
      .addCase(fetchLocations.pending,    pend)
      .addCase(fetchLocations.fulfilled,  (s,a) => { s.loading=false; s.list    = safe(a.payload?.data); })
      .addCase(fetchLocations.rejected,   rej)
      .addCase(fetchSubLocations.pending,   pend)
      .addCase(fetchSubLocations.fulfilled, (s,a) => { s.loading=false; s.subList = safe(a.payload?.data); })
      .addCase(fetchSubLocations.rejected,  rej)
      .addCase(createLocation.pending,    sp)
      .addCase(createLocation.fulfilled,  (s,a) => { s.saving=false; s.success='Location created!';     s.list    = [a.payload.data, ...s.list]; })
      .addCase(createLocation.rejected,   sr)
      .addCase(updateLocation.pending,    sp)
      .addCase(updateLocation.fulfilled,  (s,a) => { s.saving=false; s.success='Location updated!';     s.list    = s.list.map(x => x.id===a.payload.data.id ? a.payload.data : x); })
      .addCase(updateLocation.rejected,   sr)
      .addCase(deleteLocation.pending,    sp)
      .addCase(deleteLocation.fulfilled,  (s,a) => { s.saving=false; s.success='Location deleted!';     s.list    = s.list.filter(x => x.id !== a.meta.arg); })
      .addCase(deleteLocation.rejected,   sr)
      .addCase(createSubLocation.pending,   sp)
      .addCase(createSubLocation.fulfilled, (s,a) => { s.saving=false; s.success='Sub-location created!'; s.subList = [a.payload.data, ...s.subList]; })
      .addCase(createSubLocation.rejected,  sr)
      .addCase(updateSubLocation.pending,   sp)
      .addCase(updateSubLocation.fulfilled, (s,a) => { s.saving=false; s.success='Sub-location updated!'; s.subList = s.subList.map(x => x.id===a.payload.data.id ? a.payload.data : x); })
      .addCase(updateSubLocation.rejected,  sr)
      .addCase(deleteSubLocation.pending,   sp)
      .addCase(deleteSubLocation.fulfilled, (s,a) => { s.saving=false; s.success='Sub-location deleted!'; s.subList = s.subList.filter(x => x.id !== a.meta.arg); })
      .addCase(deleteSubLocation.rejected,  sr);
  },
});
export const { clearLocationMessages } = locationSlice.actions;
export default locationSlice.reducer;
