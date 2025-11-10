import { Route, Routes } from 'react-router-dom'
import AppLayout from './layout/AppLayout'
import DebateRoomPage from './pages/DebateRoomPage'
import LandingPage from './pages/LandingPage'
import TopicSelectionPage from './pages/TopicSelectionPage'

const App = () => {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<LandingPage />} />
        <Route path="topics" element={<TopicSelectionPage />} />
        <Route path="debate" element={<DebateRoomPage />} />
        <Route path="*" element={<LandingPage />} />
      </Route>
    </Routes>
  )
}

export default App
