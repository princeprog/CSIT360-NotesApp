import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './Pages/Home';
import NotesList from './Pages/NotesList.jsx';
import NoteView from './Pages/NoteView.jsx';
import CreateNote from './Pages/CreateNote.jsx';
import EditNote from './Pages/EditNote.jsx';
import { NotesProvider } from './context/NotesContext.jsx';

function App() {
  return (
    <NotesProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/notes" replace />} />
          <Route path="/notes" element={<NotesList />} />
          <Route path="/notes/:id" element={<NoteView />} />
          <Route path="/create" element={<CreateNote />} />
          <Route path="/edit/:id" element={<EditNote />} />
          <Route path="*" element={<Navigate to="/notes" replace />} />
        </Routes>
      </Router>
    </NotesProvider>
  );
}

export default App;