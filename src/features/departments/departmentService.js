import API from '../../api/axios';

const getAll    = async () => { const { data } = await API.get('/departments'); return data; };
const create    = async (body) => { const { data } = await API.post('/departments', body); return data; };
const update    = async (id, body) => { const { data } = await API.patch(`/departments/${id}`, body); return data; };
const remove    = async (id) => { const { data } = await API.delete(`/departments/${id}`); return data; };

const departmentService = { getAll, create, update, remove };
export default departmentService;
