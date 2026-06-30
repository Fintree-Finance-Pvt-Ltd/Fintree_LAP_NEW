let accessToken = null;

export const tokenManager = {
  getAccessToken: () => accessToken,
  setAccessToken: (token) => {
    accessToken = token;
  },
  clear: () => {
    accessToken = null;
  }
};
