import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppLayout from "./layouts/AppLayout.jsx";

// Pages publiques
import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Events from "./pages/Events.jsx";
import Reviews from "./pages/Reviews.jsx";
import Contact from "./pages/Contact.jsx";
import QuoteRequest from "./pages/QuoteRequest.jsx";
import Legal from "./pages/Legal.jsx";

// Pages admin (a proteger plus tard)
import AdminDashboard from "./pages/AdminDashboard.jsx";
import AdminProspects from "./pages/AdminProspects.jsx";
import AdminEvents from "./pages/AdminEvents.jsx";
import AdminDevis from "./pages/AdminDevis.jsx";
import AdminMessages from "./pages/AdminMessages.jsx";
import AdminReviews from "./pages/AdminReviews.jsx";
import EmployeDashboard from "./pages/EmployeDashboard.jsx";
import EventDetail from "./pages/EventDetail.jsx";

// Pages espace client
import ClientDevis from "./pages/ClientDevis.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          {/* Routes publiques */}
          <Route path="/" element={<Home />} />
          <Route path="/connexion" element={<Login />} />
          <Route path="/inscription" element={<Register />} />
          <Route path="/evenements" element={<Events />} />
          <Route path="/avis" element={<Reviews />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/demande-devis" element={<QuoteRequest />} />
          <Route path="/mentions-legales" element={<Legal />} />

          {/* Routes admin */}
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/prospects" element={<AdminProspects />} />
          <Route path="/admin/evenements" element={<AdminEvents />} />
          <Route path="/admin/devis" element={<AdminDevis />} />
          <Route path="/admin/messages" element={<AdminMessages />} />
          <Route path="/admin/avis" element={<AdminReviews />} />

          {/* Routes employe */}
          <Route path="/employe/dashboard" element={<EmployeDashboard />} />
          <Route path="/evenement/:id" element={<EventDetail />} />

          {/* Routes espace client */}
          <Route path="/espace-client/devis" element={<ClientDevis />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
