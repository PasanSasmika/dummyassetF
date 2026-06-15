import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import assetReducer from '../features/assets/assetSlice';
import departmentReducer  from '../features/departments/departmentSlice';
import designationReducer from '../features/designations/designationSlice';
import userReducer        from '../features/users/userSlice';
import warrantyReducer from '../features/assets/warrantySlice';
import assignmentReducer from '../features/assignments/assignmentSlice';
import accessoryReducer from '../features/accessories/accessorySlice';
import locationReducer  from '../features/locations/locationSlice';
import salvageReducer from '../features/salvage/salvageSlice';
import repairReducer from '../features/repairs/repairSlice';
import assetTypeSlice from '../features/assetTypes/assetTypeSlice';
import auditReducer from '../features/audit/auditSlice'; // <-- Imported audit slice
import historyReducer from '../features/history/historySlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    assets: assetReducer,
    departments:  departmentReducer,
    designations: designationReducer,
    users:        userReducer,
    warranties: warrantyReducer,
    assignments: assignmentReducer,
    accessories: accessoryReducer,
    locations:  locationReducer,
    salvage: salvageReducer,
    repairs: repairReducer,
    assetTypes: assetTypeSlice,
    audit: auditReducer,
    history: historyReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export default store;
