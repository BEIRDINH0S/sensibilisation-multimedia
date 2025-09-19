// Coordonnées Nice centre-ville
const niceCoords = [43.7034, 7.2663];

// Triangle des Bermudes (exemple approximatif)
const bermudaCoords = [
  [25.774, -80.190], // Miami
  [18.466, -66.118], // Puerto Rico
  [32.321, -64.757], // Bermuda
];

// Fonction d'initialisation
function initMap(userCoords) {
  // Crée la carte centrée sur la position utilisateur
  const map = L.map('map').setView(userCoords, 10);

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

// Récupère la position de l'utilisateur et initialise la carte
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
