import API from '../../api/axios';

const getAll       = async ()       => { const { data } = await API.get('/users');              return data; };
const getById      = async (id)     => { const { data } = await API.get(`/users/${id}`);        return data; };
const register     = async (body)   => { const { data } = await API.post('/users/register', body); return data; };
const update       = async (id, body) => { const { data } = await API.patch(`/users/${id}`, body); return data; };
const updateStatus = async (id, status) => { const { data } = await API.patch(`/users/${id}/status`, { status }); return data; };
const assignRole   = async (id, body) => { const { data } = await API.post(`/users/${id}/roles`, body); return data; };
const getMyProfile = async ()       => { const { data } = await API.get('/users/me');           return data; };

const userService = { getAll, getById, register, update, updateStatus, assignRole, getMyProfile };
export default userService;
