import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Alert,
  Platform,
} from "react-native";

export default function ClientDetailScreen({ route }) {
  const { client } = route.params;

  // Appeler le client
  function handleCall() {
    if (!client.phone) {
      Alert.alert("Erreur", "Aucun numero de telephone");
      return;
    }

    const phoneNumber = client.phone.replace(/\s/g, "");
    Linking.openURL(`tel:${phoneNumber}`).catch(() => {
      Alert.alert("Erreur", "Impossible d'ouvrir l'application telephone");
    });
  }

  // Envoyer un email
  function handleEmail() {
    if (!client.email) {
      Alert.alert("Erreur", "Aucune adresse email");
      return;
    }

    Linking.openURL(`mailto:${client.email}`).catch(() => {
      Alert.alert("Erreur", "Impossible d'ouvrir l'application email");
    });
  }

  // Ouvrir l'itineraire
  function handleDirections() {
    if (!client.address) {
      Alert.alert("Erreur", "Aucune adresse disponible");
      return;
    }

    const address = encodeURIComponent(client.address);

    // URL pour Google Maps (fonctionne sur iOS et Android)
    const url = Platform.select({
      ios: `maps:0,0?q=${address}`,
      android: `geo:0,0?q=${address}`,
    });

    // Fallback vers Google Maps web si l'app native echoue
    Linking.openURL(url).catch(() => {
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${address}`);
    });
  }

  return (
    <ScrollView style={styles.container}>
      {/* En-tete */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {client.company_name?.charAt(0)?.toUpperCase() || "C"}
          </Text>
        </View>
        <Text style={styles.companyName}>{client.company_name}</Text>
        <Text style={styles.contactName}>
          {client.firstname} {client.lastname}
        </Text>
      </View>

      {/* Boutons d'action rapide */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={[styles.actionButton, !client.phone && styles.actionDisabled]}
          onPress={handleCall}
          disabled={!client.phone}
        >
          <Text style={styles.actionIcon}>📞</Text>
          <Text style={styles.actionLabel}>Appeler</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, !client.email && styles.actionDisabled]}
          onPress={handleEmail}
          disabled={!client.email}
        >
          <Text style={styles.actionIcon}>✉️</Text>
          <Text style={styles.actionLabel}>Email</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, !client.address && styles.actionDisabled]}
          onPress={handleDirections}
          disabled={!client.address}
        >
          <Text style={styles.actionIcon}>🗺️</Text>
          <Text style={styles.actionLabel}>Itineraire</Text>
        </TouchableOpacity>
      </View>

      {/* Informations detaillees */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Coordonnees</Text>

        {/* Telephone */}
        <TouchableOpacity
          style={styles.infoRow}
          onPress={client.phone ? handleCall : null}
          activeOpacity={client.phone ? 0.7 : 1}
        >
          <View style={styles.infoIcon}>
            <Text>📱</Text>
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Telephone</Text>
            <Text style={[styles.infoValue, client.phone && styles.infoLink]}>
              {client.phone || "Non renseigne"}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Email */}
        <TouchableOpacity
          style={styles.infoRow}
          onPress={client.email ? handleEmail : null}
          activeOpacity={client.email ? 0.7 : 1}
        >
          <View style={styles.infoIcon}>
            <Text>✉️</Text>
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={[styles.infoValue, client.email && styles.infoLink]}>
              {client.email || "Non renseigne"}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Adresse */}
        <TouchableOpacity
          style={styles.infoRow}
          onPress={client.address ? handleDirections : null}
          activeOpacity={client.address ? 0.7 : 1}
        >
          <View style={styles.infoIcon}>
            <Text>📍</Text>
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Adresse</Text>
            <Text style={[styles.infoValue, client.address && styles.infoLink]}>
              {client.address || "Non renseigne"}
            </Text>
            {client.city && (
              <Text style={styles.infoSubValue}>
                {client.postal_code} {client.city}
              </Text>
            )}
          </View>
        </TouchableOpacity>
      </View>

      {/* Infos supplementaires */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Informations</Text>

        <View style={styles.infoRow}>
          <View style={styles.infoIcon}>
            <Text>🏢</Text>
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>SIRET</Text>
            <Text style={styles.infoValue}>
              {client.siret || "Non renseigne"}
            </Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.infoIcon}>
            <Text>📅</Text>
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Client depuis</Text>
            <Text style={styles.infoValue}>
              {client.created_at
                ? new Date(client.created_at).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })
                : "Non renseigne"}
            </Text>
          </View>
        </View>
      </View>

      {/* Notes sur le client */}
      {client.notes && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <View style={styles.notesContainer}>
            <Text style={styles.notesText}>{client.notes}</Text>
          </View>
        </View>
      )}
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
    alignItems: "center",
    paddingTop: 60,
    paddingBottom: 30,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#2563eb",
  },
  companyName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
  },
  contactName: {
    fontSize: 16,
    color: "#bfdbfe",
    marginTop: 4,
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: -20,
    borderRadius: 12,
    paddingVertical: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  actionButton: {
    alignItems: "center",
    paddingHorizontal: 20,
  },
  actionDisabled: {
    opacity: 0.4,
  },
  actionIcon: {
    fontSize: 28,
    marginBottom: 6,
  },
  actionLabel: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "500",
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: "#64748b",
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    color: "#1e293b",
  },
  infoLink: {
    color: "#2563eb",
  },
  infoSubValue: {
    fontSize: 14,
    color: "#64748b",
    marginTop: 2,
  },
  notesContainer: {
    backgroundColor: "#fefce8",
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#eab308",
  },
  notesText: {
    fontSize: 14,
    color: "#1e293b",
    lineHeight: 22,
  },
});
