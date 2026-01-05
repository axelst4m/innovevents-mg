import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppLayout from "./layouts/AppLayout.jsx";

import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import Events from "./pages/Events.jsx";
import Reviews from "./pages/Reviews.jsx";
import Contact from "./pages/Contact.jsx";
import QuoteRequest from "./pages/QuoteRequest.jsx";
import Legal from "./pages/Legal.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/connexion" element={<Login />} />
          <Route path="/evenements" element={<Events />} />
          <Route path="/avis" element={<Reviews />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/demande-devis" element={<QuoteRequest />} />
          <Route path="/mentions-legales" element={<Legal />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}