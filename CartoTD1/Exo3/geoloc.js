/**
 * === LEAFLET - RÉCAP DES PRINCIPALES MÉTHODES ===
 * 
 * L.map(id ou élément)                 → Crée une carte
 *     .setView([lat, lon], zoom)      → Centre la carte
 * 
 * L.tileLayer(urlTemplate, options)   → Ajoute une couche de tuiles (OpenStreetMap, etc.)
 *     .addTo(map)                     → Attache la couche à la carte
 * 
 * L.marker([lat, lon], options)       → Crée un marqueur
 *     .addTo(map)                     → Ajoute à la carte
 *     .bindPopup("texte")             → Ajoute un popup
 *     .openPopup()                    → Ouvre le popup par défaut
 * 
 * L.polygon([[lat, lon], ...], options) → Trace un polygone (comme une zone ou forme)
 *     .addTo(map)
 * 
 * Autres utiles :
 * - L.circle([lat, lon], options)     → Cercle
 * - map.locate()                      → Demande la localisation automatiquement (alternative à navigator.geolocation)
 * - map.on('locationfound', fn)       → Écoute la localisation
 */

// Coordonnées Nice
const niceCoords = [43.7034, 7.2663];

// Triangle des Bermudes
const bermudaCoords = [
  [25.774, -80.190], // Miami
  [18.466, -66.118], // Puerto Rico
  [32.321, -64.757], // Bermuda
];

// Fonction pour créer les marqueurs et le triangle sur la carte
function initMap(userCoords) {
  // Crée la carte centrée sur la position utilisateur
  const map = L.map('map').setView(userCoords, 1);

  // Ajoute la couche OpenStreetMap
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution:
      '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map);

  // Marqueur position utilisateur
  L.marker(userCoords)
    .addTo(map)
    .bindPopup('Vous êtes ici')
    .openPopup();

  // Marqueur Nice centre ville
  L.marker(niceCoords)
    .addTo(map)
    .bindPopup('Nice - Centre Ville');

  // Trace le triangle des Bermudes en rouge
  L.polygon(bermudaCoords, { color: 'red' }).addTo(map);
}

// main

if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const userCoords = [
        position.coords.latitude,
        position.coords.longitude,
      ];
      initMap(userCoords);
    },
    (error) => {
      alert('Erreur géolocalisation : ' + error.message);
      // En cas d'erreur, on affiche la carte centrée sur Nice par défaut
      initMap(niceCoords);
    },
    { enableHighAccuracy: true }
  );
} else {
  alert('Géolocalisation non supportée');
  initMap(niceCoords);
}
