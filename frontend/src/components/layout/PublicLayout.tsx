import { Outlet } from "react-router-dom";
import Header from "./Header";

export default function PublicLayout() {
  return (
    <div className="public-theme-pink min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
