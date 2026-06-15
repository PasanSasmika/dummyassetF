// warrantyService.js — FIXED endpoint
import API from '../../api/axios';

const getAll  = async (assetId)            => { const { data } = await API.get(`/assets/${assetId}/warranties`);                  return data; };
const create  = async (assetId, body)      => { const { data } = await API.post(`/assets/${assetId}/warranties`, body);            return data; };
const update  = async (assetId, wId, body) => { const { data } = await API.patch(`/assets/${assetId}/warranties/${wId}`, body);   return data; };
const remove  = async (assetId, wId)       => { const { data } = await API.delete(`/assets/${assetId}/warranties/${wId}`);        return data; };

const warrantyService = { getAll, create, update, remove };
export default warrantyService;
