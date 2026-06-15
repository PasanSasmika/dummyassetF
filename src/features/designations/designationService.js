import API from '../../api/axios';

const getAll    = async () => { const { data } = await API.get('/designations'); return data; };
const create    = async (body) => { const { data } = await API.post('/designations', body); return data; };
const update    = async (id, body) => { const { data } = await API.patch(`/designations/${id}`, body); return data; };
const remove    = async (id) => { const { data } = await API.delete(`/designations/${id}`); return data; };

const designationService = { getAll, create, update, remove };
export default designationService;
