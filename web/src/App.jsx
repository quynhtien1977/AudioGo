

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import DashboardPage from "./pages/DashboardPage"

// (sau này sẽ thêm)
// import PoisPage from "./pages/PoisPage"
// import ToursPage from "./pages/ToursPage"  

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Dashboard */}
        <Route path="/" element={<DashboardPage />} />

        {/* POIs */}
        {/* <Route path="/pois" element={<PoisPage />} /> */}

        {/* Tours */}
        {/* <Route path="/tours" element={<ToursPage />} /> */}

        {/* fallback */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  )
}