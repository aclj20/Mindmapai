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
import PrivateRoute from "./components/PrivateRoute";
import GuestRoute from "./components/GuestRoute";

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
        <CommunityPage />
      </PrivateRoute>
    ),
  },
  {
    path: "/dashboard",
    element: (
      <PrivateRoute>
        <Dashboard />
      </PrivateRoute>
    ),
  },
  {
    path: "/map/create",
    element: (
      <PrivateRoute>
        <CreateMapPage />
      </PrivateRoute>
    ),
  },
  {
    path: "/map/:id",
    element: (
      <PrivateRoute>
        <ConceptMapView />
      </PrivateRoute>
    ),
  },
  {
    path: "/leaderboard",
    element: (
      <PrivateRoute>
        <Leaderboard />
      </PrivateRoute>
    ),
  },
  {
    path: "/profile",
    element: (
      <PrivateRoute>
        <ProfilePage />
      </PrivateRoute>
    ),
  },
  {
    path: "/groups",
    element: (
      <PrivateRoute>
        <GroupsPage />
      </PrivateRoute>
    ),
  },
  {
    path: "/groups/:id",
    element: (
      <PrivateRoute>
        <GroupDetailPage />
      </PrivateRoute>
    ),
  },
  {
    path: "/achievements",
    element: (
      <PrivateRoute>
        <AchievementsPage />
      </PrivateRoute>
    ),
  },
  {
    path: "/settings",
    element: (
      <PrivateRoute>
        <SettingsPage />
      </PrivateRoute>
    ),
  },
]);
