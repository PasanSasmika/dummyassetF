import API from '../../api/axios';

const getAll   = async (params = {}) => {
  const { data } = await API.get('/salvage', { params });
  return data;
};

const getById  = async (assetId) => {
  const { data } = await API.get(`/salvage/${assetId}`);
  return data;
};

const salvage  = async (assetId, body) => {
  const { data } = await API.post(`/salvage/${assetId}`, body);
  return data;
};

const update   = async (assetId, body) => {
  const { data } = await API.patch(`/salvage/${assetId}`, body);
  return data;
};

const unsalvage = async (assetId) => {
  const { data } = await API.delete(`/salvage/${assetId}`);
  return data;
};

const salvageService = { getAll, getById, salvage, update, unsalvage };
export default salvageService;
