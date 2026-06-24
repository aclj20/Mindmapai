import { createBrowserRouter } from "react-router";
import LandingPage from "./components/LandingPage";
import LoginPage from "./components/LoginPage";
import Dashboard from "./components/Dashboard";
import GroupDetailPage from "./components/GroupDetailPage";
import ConceptMapView from "./components/ConceptMapView";
import Leaderboard from "./components/Leaderboard";
import ProfilePage from "./components/ProfilePage";
import GroupsPage from "./components/GroupsPage";
import AchievementsPage from "./components/AchievementsPage";
import SettingsPage from "./components/SettingsPage";
import CreateMapPage from "./components/CreateMapPage";
import CommunityPage from "./components/CommunityPage";
import AdminPanel from "./components/AdminPanel";
import AdminLogin from "./components/AdminLogin";
import AdminRoute from "./components/AdminRoute";
import PublicProfilePage from "./components/PublicProfilePage";
import CommunitiesPage from "./components/CommunitiesPage";
import CommunityDetailPage from "./components/CommunityDetailPage";
import PostDetailPage from "./components/PostDetailPage";
import PrivateRoute from "./components/PrivateRoute";
import GuestRoute from "./components/GuestRoute";
import NotFoundPage from "./components/NotFoundPage";
import ProtectedLayout from "./components/ProtectedLayout";

export const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <GuestRoute>
        <LandingPage />
      </GuestRoute>
    ),
  },
  {
    path: "/login",
    element: (
      <GuestRoute>
        <LoginPage />
      </GuestRoute>
    ),
  },
  {
    path: "/community",
    element: (
      <PrivateRoute>
        <ProtectedLayout>
          <CommunityPage />
        </ProtectedLayout>
      </PrivateRoute>
    ),
  },
  {
    element: (
      <PrivateRoute>
        <ProtectedLayout />
      </PrivateRoute>
    ),
    children: [
      {
        path: "/dashboard",
        element: <Dashboard />,
      },
      {
        path: "/dashboard/student",
        element: <Dashboard />,
      },
      {
        path: "/map/create",
        element: <CreateMapPage />,
      },
      {
        path: "/map/:id",
        element: <ConceptMapView />,
      },
      {
        path: "/leaderboard",
        element: <Leaderboard />,
      },
      {
        path: "/profile",
        element: <ProfilePage />,
      },
      {
        path: "/profile/:id",
        element: <PublicProfilePage />,
      },
      {
        path: "/groups",
        element: <GroupsPage />,
      },
      {
        path: "/groups/:id",
        element: <GroupDetailPage />,
      },
      {
        path: "/achievements",
        element: <AchievementsPage />,
      },
      {
        path: "/settings",
        element: <SettingsPage />,
      },
      {
        path: "/communities",
        element: <CommunitiesPage />,
      },
      {
        path: "/c/:slug",
        element: <CommunityDetailPage />,
      },
      {
        path: "/c/:slug/post/:postId",
        element: <PostDetailPage />,
      },
    ],
  },
  {
    path: "/admin/login",
    element: <AdminLogin />,
  },
  {
    path: "/admin",
    element: (
      <AdminRoute>
        <AdminPanel />
      </AdminRoute>
    ),
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);
