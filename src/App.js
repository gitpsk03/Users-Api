import {BrowserRouter as Router, Routes, Route} from 'react-router-dom'
import Home from './components/Home'
import Login from './components/Login'
import Register from './components/Register'
import PrivateRoute from './components/PrivateRoute'

import './App.css'

const App = () => (
  <Router>
    <Routes>
      <Route exact path="/register" element={<Register />} />
      <Route exact path="/login" element={<Login />} />
      <Route exact path="/login" element={<Login />} />
      <Route
        exact
        path="/"
        element={
          <PrivateRoute>
            <Home />
          </PrivateRoute>
        }
      />
    </Routes>
  </Router>
)

export default App

// <Route
//         exact
//         path="/"
//         element={
//           <PrivateRoute>
//             <Home />
//           </PrivateRoute>
//         }
//       />
