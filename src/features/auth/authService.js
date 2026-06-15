import API from '../../api/axios';

const login = async (email, password) => {
  const { data } = await API.post('/auth/login', { email, password });
  localStorage.setItem('token', data.token);
  localStorage.setItem('user', JSON.stringify(data.data));
  return data;
};

const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

const getMyProfile = async () => {
  const { data } = await API.get('/users/me');
  return data.data;
};

const authService = { login, logout, getMyProfile };
export default authService;
