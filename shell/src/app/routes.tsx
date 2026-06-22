import { createBrowserRouter, Navigate } from 'react-router';
import { Root } from './components/Root';
import { HomePage } from './pages/HomePage';
import { EditorPage } from './pages/EditorPage';
import { ProjectPage } from './pages/ProjectPage';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Root,
    children: [
      { index: true, element: <Navigate to="/home" replace /> },
      { path: 'home', Component: HomePage },
      { path: 'editor/:docId', Component: EditorPage },
      { path: 'project/:projectId', Component: ProjectPage },
      { path: 'project/:projectId/editor/:docId', Component: EditorPage },
    ],
  },
]);
