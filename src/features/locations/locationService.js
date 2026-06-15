import API from '../../api/axios';

const locationService = {
  getAll:    async ()        => (await API.get('/locations')).data,
  create:    async (body)    => (await API.post('/locations', body)).data,
  update:    async (id, b)   => (await API.put(`/locations/${id}`, b)).data,
  remove:    async (id)      => (await API.delete(`/locations/${id}`)).data,
  getAllSubs: async ()        => (await API.get('/locations/suball')).data,
  createSub: async (body)    => (await API.post('/locations/sub', body)).data,
  updateSub: async (id, b)   => (await API.put(`/locations/sub/${id}`, b)).data,
  removeSub: async (id)      => (await API.delete(`/locations/sub/${id}`)).data,
};
export default locationService;
