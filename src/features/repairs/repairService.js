// src/features/repairs/repairService.js
import API from '../../api/axios';

const repairService = {
  getAll:          (params)              => API.get('/repairs',                    { params }),
  getByAsset:      (assetId)             => API.get(`/repairs/asset/${assetId}`),
  getById:         (repairId)            => API.get(`/repairs/${repairId}`),
  checkWarranty:   (assetId)             => API.get(`/repairs/check-warranty/${assetId}`),
  create:          (assetId, data)       => API.post(`/repairs/${assetId}`,        data),
  update:          (repairId, data)      => API.patch(`/repairs/${repairId}`,      data),
  remove:          (repairId)            => API.delete(`/repairs/${repairId}`),
};

export default repairService;
