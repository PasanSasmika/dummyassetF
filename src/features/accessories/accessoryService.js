import API from '../../api/axios';

const getAll = async () => {
  const { data } = await API.get('/accessories');
  return data;
};

const getById = async (id) => {
  const { data } = await API.get(`/accessories/${id}`);
  return data;
};

const create = async (body) => {
  const { data } = await API.post('/accessories', body);
  return data;
};

const update = async (id, body) => {
  const { data } = await API.put(`/accessories/${id}`, body);
  return data;
};

const remove = async (id) => {
  const { data } = await API.delete(`/accessories/${id}`);
  return data;
};

const toggle = async (id) => {
  const { data } = await API.patch(`/accessories/${id}/toggle`);
  return data;
};

const getAllAssignments = async () => {
  const { data } = await API.get('/accessories/assignmentsall');
  return data;
};

const getByAsset = async (assetId) => {
  const { data } = await API.get(`/accessories/assignments/asset/${assetId}`);
  return data;
};

const assign = async (body) => {
  const { data } = await API.post('/accessories/assignments/assign', body);
  return data;
};

const returnAcc = async (assignmentId, body) => {
  const { data } = await API.post(
    `/accessories/assignments/${assignmentId}/return`,
    body
  );
  return data;
};

const accessoryService = {
  getAll, getById, create, update, remove, toggle,
  getAllAssignments, getByAsset, assign, returnAcc,
};

export default accessoryService;
