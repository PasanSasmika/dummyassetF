import API from '../../api/axios';

const getAll     = async (params = {}) => { const { data } = await API.get('/assets', { params });         return data; };
const getById    = async (id)          => { const { data } = await API.get(`/assets/${id}`);               return data; };
const create     = async (body)        => { const { data } = await API.post('/assets', body);               return data; };
const update     = async (id, body)    => { const { data } = await API.patch(`/assets/${id}`, body);       return data; };
const remove     = async (id)          => { const { data } = await API.delete(`/assets/${id}`);            return data; };
const getHistory = async (id) => {
  const { data } = await API.get(`/assets/${id}/history`);
  return data;
};
const assign     = async (id, body)    => { const { data } = await API.post(`/assets/${id}/assign`, body); return data; };
const updateCIA  = async (id, body)    => { const { data } = await API.patch(`/assets/${id}/cia-classification`, body); return data; };
const bulkCreate = async (assets)      => { const { data } = await API.post('/assets/bulk', { assets });   return data; }; // ✅

const assetService = { getAll, getById, create, update, remove, getHistory, assign, updateCIA, bulkCreate };
export default assetService;
