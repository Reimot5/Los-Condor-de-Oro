import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import Home from './pages/Home'
import ValidateCode from './pages/ValidateCode'
import Nominate from './pages/Nominate'
import Vote from './pages/Vote'
import Winners from './pages/Winners'
import AdminLogin from './pages/admin/Login'
import AdminLayout from './pages/admin/Layout'
import AdminDashboard from './pages/admin/Dashboard'
import AdminCategories from './pages/admin/Categories'
import AdminEventState from './pages/admin/EventState'
import AdminNominations from './pages/admin/Nominations'
import AdminCandidates from './pages/admin/Candidates'
import AdminImportCodes from './pages/admin/ImportCodes'
import AdminVotes from './pages/admin/Votes'
import AdminPresentation from './pages/admin/Presentation'

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/validate-code" element={<ValidateCode />} />
          <Route path="/nominate" element={<Nominate />} />
          <Route path="/vote" element={<Vote />} />
          <Route path="/winners" element={<Winners />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="event-state" element={<AdminEventState />} />
            <Route path="nominations" element={<AdminNominations />} />
            <Route path="votes" element={<AdminVotes />} />
            <Route path="candidates" element={<AdminCandidates />} />
            <Route path="import-codes" element={<AdminImportCodes />} />
            <Route path="presentation" element={<AdminPresentation />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster />
    </>
  )
}

export default App
