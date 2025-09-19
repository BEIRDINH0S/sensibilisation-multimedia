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


const niceCoords = [43.7034, 7.2663];

const marseilleCoords = [43.2965, 5.3698];

const bermudaCoords = [
  [25.774, -80.190], // Miami
  [18.466, -66.118], // Puerto Rico
  [32.321, -64.757], // Bermuda
];

// Fonction pour créer les marqueurs et le triangle sur la carte
function initMap(userCoords, userAcc) {

  L.marker(userCoords)
    .addTo(map)
    .bindPopup('Vous êtes ici')
    .openPopup();

    if(userAcc != null){
        L.circle(userCoords, {radius: userAcc}).addTo(map)
    }

  L.marker(niceCoords)
    .addTo(map)
    .bindPopup('Nice - Centre Ville');

  L.polygon(bermudaCoords, { color: 'red' }).addTo(map);

  L.polyline([niceCoords, marseilleCoords], {
    color: 'blue',
    weight: 4,
    opacity: 0.7,
    smoothFactor: 1
  }).addTo(map);

  map.distance(niceCoords, marseilleCoords);

  L.marker([(niceCoords[0]+marseilleCoords[0])/2, (niceCoords[1]+marseilleCoords[1])/2]).addTo(map).bindPopup("Point entre Nice et Marseille");

  fetch('data.geojson')
  .then(response => response.json())
  .then(data => {
    L.geoJSON(data).addTo(map);
  })
  .catch(err => console.error(err));
}

// main
const map = L.map('map').setView([43.7034, 7.2663], 10);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution:
    '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a> contributors',
}).addTo(map);

map.locate();

/* avec map.locate on peut récup : 
latitude
longitude
accuracy
altitude
altitudeAccuracy
heading
speed
timestamp
bounds
target
*/

map.on('locationfound', function (e) {
  const userCoords = [e.latitude, e.longitude];
  initMap(userCoords, e.accuracy);
});

map.on('locationerror', function (e) {
  alert('Erreur géolocalisation : ' + e.message);
  initMap([43.7034, 7.2663], null);
});

