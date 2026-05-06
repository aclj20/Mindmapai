import { createBrowserRouter } from "react-router";
import LandingPage from "./components/LandingPage";
import LoginPage from "./components/LoginPage";
import StudentDashboard from "./components/StudentDashboard";
import TeacherDashboard from "./components/TeacherDashboard";
import ConceptMapView from "./components/ConceptMapView";
import Leaderboard from "./components/Leaderboard";
import ProfilePage from "./components/ProfilePage";
import GroupsPage from "./components/GroupsPage";
import AchievementsPage from "./components/AchievementsPage";
import SettingsPage from "./components/SettingsPage";
import CreateMapPage from "./components/CreateMapPage";
import CommunityPage from "./components/CommunityPage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: LandingPage,
  },
  {
    path: "/login",
    Component: LoginPage,
  },
  {
    path: "/community",
    Component: CommunityPage,
  },
  {
    path: "/dashboard/student",
    Component: StudentDashboard,
  },
  {
    path: "/dashboard/teacher",
    Component: TeacherDashboard,
  },
  {
    path: "/map/create",
    Component: CreateMapPage,
  },
  {
    path: "/map/:id",
    Component: ConceptMapView,
  },
  {
    path: "/leaderboard",
    Component: Leaderboard,
  },
  {
    path: "/profile",
    Component: ProfilePage,
  },
  {
    path: "/groups",
    Component: GroupsPage,
  },
  {
    path: "/achievements",
    Component: AchievementsPage,
  },
  {
    path: "/settings",
    Component: SettingsPage,
  },
]);
