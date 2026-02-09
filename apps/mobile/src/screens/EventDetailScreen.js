import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
  Modal,
  ActivityIndicator,
  Linking,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { API_URL } from "../config";

export default function EventDetailScreen({ route, navigation }) {
  const { event } = route.params;
  const { token } = useAuth();

  const [notes, setNotes] = useState([]);
  const [client, setClient] = useState(null);
  const [loadingNotes, setLoadingNotes] = useState(true);
  const [loadingClient, setLoadingClient] = useState(true);

  // Modal pour ajouter une note
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  useEffect(() => {
    fetchNotes();
    if (event.client_id) {
      fetchClient();
    } else {
      setLoadingClient(false);
    }
  }, []);

  async function fetchNotes() {
    try {
      const res = await fetch(`${API_URL}/api/events/${event.id}/notes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setNotes(data.notes || data);
      }
    } catch (err) {
      console.error("Erreur chargement notes:", err);
    } finally {
      setLoadingNotes(false);
    }
  }

  async function fetchClient() {
    try {
      const res = await fetch(`${API_URL}/api/clients/${event.client_id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setClient(data.client || data);
      }
    } catch (err) {
      console.error("Erreur chargement client:", err);
    } finally {
      setLoadingClient(false);
    }
  }

  async function saveNote() {
    if (!newNote.trim()) {
      Alert.alert("Erreur", "La note ne peut pas etre vide");
      return;
    }

    setSavingNote(true);
    try {
      const res = await fetch(`${API_URL}/api/events/${event.id}/notes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: newNote }),
      });

      if (res.ok) {
        setNewNote("");
        setShowNoteModal(false);
        fetchNotes();
        Alert.alert("Succes", "Note ajoutee");
      } else {
        const data = await res.json();
        throw new Error(data.error || "Erreur");
      }
    } catch (err) {
      Alert.alert("Erreur", err.message);
    } finally {
      setSavingNote(false);
    }
  }

  function formatDate(dateStr) {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  function formatTime(dateStr) {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function getStatusColor(status) {
    const colors = {
      brouillon: "#94a3b8",
      accepte: "#22c55e",
      en_cours: "#3b82f6",
      termine: "#10b981",
      annule: "#ef4444",
    };
    return colors[status] || "#94a3b8";
  }

  return (
    <ScrollView style={styles.container}>
      {/* En-tete evenement */}
      <View style={styles.header}>
        <Text style={styles.eventName}>{event.name}</Text>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(event.status) },
          ]}
        >
          <Text style={styles.statusText}>{event.status}</Text>
        </View>
      </View>

      {/* Infos evenement */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Details de l'evenement</Text>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>📅 Date debut</Text>
          <Text style={styles.infoValue}>
            {formatDate(event.start_date)}
            {event.start_date && ` a ${formatTime(event.start_date)}`}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>📅 Date fin</Text>
          <Text style={styles.infoValue}>
            {formatDate(event.end_date)}
            {event.end_date && ` a ${formatTime(event.end_date)}`}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>📍 Lieu</Text>
          <Text style={styles.infoValue}>{event.location || "Non defini"}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>🏷️ Type</Text>
          <Text style={styles.infoValue}>{event.event_type || "Non defini"}</Text>
        </View>

        {event.description && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>📝 Description</Text>
            <Text style={styles.infoValue}>{event.description}</Text>
          </View>
        )}
      </View>

      {/* Fiche client */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Client</Text>

        {loadingClient ? (
          <ActivityIndicator color="#2563eb" />
        ) : client ? (
          <TouchableOpacity
            style={styles.clientCard}
            onPress={() => navigation.navigate("ClientDetail", { client })}
          >
            <View style={styles.clientInfo}>
              <Text style={styles.clientName}>{client.company_name}</Text>
              <Text style={styles.clientContact}>
                {client.firstname} {client.lastname}
              </Text>
            </View>
            <Text style={styles.chevron}>→</Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.noData}>Aucun client associe</Text>
        )}
      </View>

      {/* Notes */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowNoteModal(true)}
          >
            <Text style={styles.addButtonText}>+ Ajouter</Text>
          </TouchableOpacity>
        </View>

        {loadingNotes ? (
          <ActivityIndicator color="#2563eb" />
        ) : notes.length === 0 ? (
          <Text style={styles.noData}>Aucune note pour cet evenement</Text>
        ) : (
          notes.map((note, index) => (
            <View key={note.id || index} style={styles.noteCard}>
              <Text style={styles.noteContent}>{note.content}</Text>
              <Text style={styles.noteDate}>
                {note.author_name || "Anonyme"} -{" "}
                {new Date(note.created_at).toLocaleDateString("fr-FR")}
              </Text>
            </View>
          ))
        )}
      </View>

      {/* Modal ajout note */}
      <Modal
        visible={showNoteModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowNoteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Ajouter une note</Text>

            <TextInput
              style={styles.noteInput}
              value={newNote}
              onChangeText={setNewNote}
              placeholder="Saisissez votre note..."
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setNewNote("");
                  setShowNoteModal(false);
                }}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.saveButton, savingNote && styles.saveButtonDisabled]}
                onPress={saveNote}
                disabled={savingNote}
              >
                {savingNote ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.saveButtonText}>Enregistrer</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    backgroundColor: "#2563eb",
    padding: 20,
    paddingTop: 60,
  },
  eventName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
  },
  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    color: "#fff",
    fontWeight: "600",
  },
  section: {
    backgroundColor: "#fff",
    margin: 16,
    marginBottom: 0,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 12,
  },
  infoRow: {
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 12,
    color: "#64748b",
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: "#1e293b",
  },
  clientCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    padding: 16,
    borderRadius: 8,
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
  },
  clientContact: {
    fontSize: 14,
    color: "#64748b",
    marginTop: 2,
  },
  chevron: {
    fontSize: 20,
    color: "#2563eb",
  },
  addButton: {
    backgroundColor: "#2563eb",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  noteCard: {
    backgroundColor: "#fefce8",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#eab308",
  },
  noteContent: {
    fontSize: 14,
    color: "#1e293b",
    marginBottom: 8,
  },
  noteDate: {
    fontSize: 12,
    color: "#64748b",
  },
  noData: {
    color: "#94a3b8",
    fontStyle: "italic",
    textAlign: "center",
    paddingVertical: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 16,
  },
  noteInput: {
    backgroundColor: "#f1f5f9",
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    minHeight: 120,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginRight: 8,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#64748b",
    fontWeight: "600",
  },
  saveButton: {
    flex: 1,
    backgroundColor: "#2563eb",
    padding: 16,
    borderRadius: 8,
    marginLeft: 8,
    alignItems: "center",
  },
  saveButtonDisabled: {
    backgroundColor: "#93c5fd",
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
});
