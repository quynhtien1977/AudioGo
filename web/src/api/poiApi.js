import axios from "axios"

const API_URL = "http://localhost:5086/api"

const getToken = () =>
  localStorage.getItem("token") || sessionStorage.getItem("token")

// GET ALL
export const getAllPOIs = async () => {
  const res = await axios.get(`${API_URL}/cms/pois`, {
    headers: {
      Authorization: `Bearer ${getToken()}`
    }
  })
  return res.data
}

// UPDATE POI
export const updatePOI = async (id, data) => {
  const res = await axios.put(`${API_URL}/cms/pois/${id}`, data, {
    headers: {
      Authorization: `Bearer ${getToken()}`
    }
  })
  return res.data
}

// DELETE 
export const deletePOI = async (id) => {
  await axios.delete(`${API_URL}/cms/pois/${id}`, {
    headers: {
      Authorization: `Bearer ${getToken()}`
    }
  })
}