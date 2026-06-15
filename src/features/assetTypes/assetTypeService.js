import API from '../../api/axios';

const getAll        = async (category)   => { const { data } = await API.get('/asset-types', { params: category ? { category } : {} }); return data; };
const getByCategory = async (category)   => { const { data } = await API.get(`/asset-types/by-category/${category}`);                   return data; };
const getById       = async (id)         => { const { data } = await API.get(`/asset-types/${id}`);                                      return data; };
const create        = async (body)       => { const { data } = await API.post('/asset-types', body);                                     return data; };
const update        = async (id, body)   => { const { data } = await API.patch(`/asset-types/${id}`, body);                              return data; };

const assetTypeService = { getAll, getByCategory, getById, create, update };
export default assetTypeService;
