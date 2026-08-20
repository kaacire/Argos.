import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import MapPage from './pages/MapPage'
import AlertsPage from './pages/AlertsPage'
import ReportsPage from './pages/ReportsPage'
import NewReportPage from './pages/NewReportPage'
import EmergencyPage from './pages/EmergencyPage'
import HistoryPage from './pages/HistoryPage'
import AIPage from './pages/AIPage'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/mapa" element={<MapPage />} />
        <Route path="/alertas" element={<AlertsPage />} />
        <Route path="/relatos" element={<ReportsPage />} />
        <Route path="/novo-relato" element={<NewReportPage />} />
        <Route path="/emergencia" element={<EmergencyPage />} />
        <Route path="/historico" element={<HistoryPage />} />
        <Route path="/ia" element={<AIPage />} />
      </Route>
    </Routes>
  )
}
