import axios from "axios"

const API_URL = "http://localhost:5086/api"

const getToken = () =>
  localStorage.getItem("token") || sessionStorage.getItem("token")

// GET POI REQUESTS FOR CURRENT OWNER
export const getMyPoiRequests = async (status = null) => {
  const params = new URLSearchParams()
  if (status) {
    params.append("status", status)
  }

  const res = await axios.get(
    `${API_URL}/cms/pois/requests/my-requests${params.toString() ? "?" + params.toString() : ""}`,
    {
      headers: {
        Authorization: `Bearer ${getToken()}`
      }
    }
  )
  return res.data
}
