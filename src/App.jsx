import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import MyGarden from './pages/MyGarden'
import Calendars from './pages/Calendars'
import ToDo from './pages/ToDo'
import PlantProfile from './pages/PlantProfile'
import AddPlant from './pages/AddPlant'
import EditPlant from './pages/EditPlant'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<MyGarden />} />
        <Route path="calendars" element={<Calendars />} />
        <Route path="todo" element={<ToDo />} />
        <Route path="plant/:id" element={<PlantProfile />} />
        <Route path="plant/new" element={<AddPlant />} />
        <Route path="plant/:id/edit" element={<EditPlant />} />
      </Route>
    </Routes>
  )
}

export default App
