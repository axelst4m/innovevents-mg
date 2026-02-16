import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppLayout from "./layouts/AppLayout.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

// Pages publiques
import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Events from "./pages/Events.jsx";
import Reviews from "./pages/Reviews.jsx";
import Contact from "./pages/Contact.jsx";
import QuoteRequest from "./pages/QuoteRequest.jsx";
import Legal from "./pages/Legal.jsx";
import CGU from "./pages/CGU.jsx";
import CGV from "./pages/CGV.jsx";

// Pages admin
import AdminDashboard from "./pages/AdminDashboard.jsx";
import AdminProspects from "./pages/AdminProspects.jsx";
import AdminEvents from "./pages/AdminEvents.jsx";
import AdminDevis from "./pages/AdminDevis.jsx";
import AdminMessages from "./pages/AdminMessages.jsx";
import AdminReviews from "./pages/AdminReviews.jsx";
import AdminUsers from "./pages/AdminUsers.jsx";
import EmployeDashboard from "./pages/EmployeDashboard.jsx";
import EventDetail from "./pages/EventDetail.jsx";

// Pages communes (authentifié)
import ChangePassword from "./pages/ChangePassword.jsx";
import DeleteAccount from "./pages/DeleteAccount.jsx";

// Pages espace client
import ClientDashboard from "./pages/ClientDashboard.jsx";
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
          <Route path="/cgu" element={<CGU />} />
          <Route path="/cgv" element={<CGV />} />

          {/* Route changement de mot de passe -tous les utilisateurs connectés */}
          <Route path="/changer-mot-de-passe" element={
            <ProtectedRoute roles={["client", "employe", "admin"]}><ChangePassword /></ProtectedRoute>
          } />

          {/* Route suppression de compte (RGPD) -tous les utilisateurs connectés */}
          <Route path="/supprimer-compte" element={
            <ProtectedRoute roles={["client", "employe", "admin"]}><DeleteAccount /></ProtectedRoute>
          } />

          {/* Routes admin -accessibles uniquement aux admins */}
          <Route path="/admin/dashboard" element={
            <ProtectedRoute roles={["admin"]}><AdminDashboard /></ProtectedRoute>
          } />
          <Route path="/admin/prospects" element={
            <ProtectedRoute roles={["admin"]}><AdminProspects /></ProtectedRoute>
          } />
          <Route path="/admin/evenements" element={
            <ProtectedRoute roles={["admin"]}><AdminEvents /></ProtectedRoute>
          } />
          <Route path="/admin/devis" element={
            <ProtectedRoute roles={["admin"]}><AdminDevis /></ProtectedRoute>
          } />
          <Route path="/admin/messages" element={
            <ProtectedRoute roles={["admin"]}><AdminMessages /></ProtectedRoute>
          } />
          <Route path="/admin/avis" element={
            <ProtectedRoute roles={["admin"]}><AdminReviews /></ProtectedRoute>
          } />
          <Route path="/admin/utilisateurs" element={
            <ProtectedRoute roles={["admin"]}><AdminUsers /></ProtectedRoute>
          } />

          {/* Routes employé -accessibles aux employés et admins */}
          <Route path="/employe/dashboard" element={
            <ProtectedRoute roles={["employe", "admin"]}><EmployeDashboard /></ProtectedRoute>
          } />
          <Route path="/evenement/:id" element={
            <ProtectedRoute roles={["employe", "admin"]}><EventDetail /></ProtectedRoute>
          } />

          {/* Routes espace client -accessibles aux clients (et admin pour debug) */}
          <Route path="/espace-client" element={
            <ProtectedRoute roles={["client", "admin"]}><ClientDashboard /></ProtectedRoute>
          } />
          <Route path="/espace-client/devis" element={
            <ProtectedRoute roles={["client", "admin"]}><ClientDevis /></ProtectedRoute>
          } />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
