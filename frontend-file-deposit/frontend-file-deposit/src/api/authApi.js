import request from '@/utils/request';

export const register = (userData) => {
  return request({
    url: '/auth/register',
    method: 'POST',
    data: userData
  });
};

export const login = (userData) => {
  return request({
    url: '/auth/login',
    method: 'POST',
    data: userData
  });
};

export const resetPassword = (pwdData) => {
  return request({
    url: '/auth/reset-password',
    method: 'POST',
    data: pwdData
  });
};

export const updateProfile = (profileData) => {
  return request({
    url: '/auth/update-profile',
    method: 'PUT',
    data: profileData
  });
};