export const getToken = () => sessionStorage.getItem('token');

export const getUser = () => {
  const user = sessionStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

export const logout = () => {
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('user');
  window.location.href = '/login';
};

export const isAdmin = () => {
  const user = getUser();
  return user?.role === 'admin';
};
