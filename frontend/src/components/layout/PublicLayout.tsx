import { Outlet } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import LiveTicker from "./LiveTicker";

export default function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <LiveTicker />
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
