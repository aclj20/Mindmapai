import { Outlet } from "react-router";
import TutorialOverlay from "./TutorialOverlay";

export default function ProtectedLayout() {
  return (
    <>
      <Outlet />
      <TutorialOverlay />
    </>
  );
}
