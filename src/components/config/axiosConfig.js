import axios from "axios";

const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  withCredentials: true,  //
});



apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.error("Errore di autenticazione, logout forzato.");
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("role");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default apiClient;
