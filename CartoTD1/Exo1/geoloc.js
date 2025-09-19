function afficherDonnees(prefix, position) {
  const c = position.coords;

  document.getElementById(`${prefix}-lat`).textContent = c.latitude.toFixed(6);
  document.getElementById(`${prefix}-lon`).textContent = c.longitude.toFixed(6);
  document.getElementById(`${prefix}-alt`).textContent = c.altitude !== null ? c.altitude.toFixed(2) + ' m' : 'Non disponible';
  document.getElementById(`${prefix}-accuracy`).textContent = c.accuracy + ' m';
  document.getElementById(`${prefix}-speed`).textContent = c.speed !== null ? c.speed.toFixed(2) + ' m/s' : 'Non disponible';
  document.getElementById(`${prefix}-date`).textContent = new Date(position.timestamp).toLocaleString();
}

if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(
    (pos) => afficherDonnees('current', pos),
    (err) => alert('Erreur getCurrentPosition : ' + err.message),
    { enableHighAccuracy: true }
  );

  navigator.geolocation.watchPosition(
    (pos) => afficherDonnees('watch', pos),
    (err) => alert('Erreur watchPosition : ' + err.message),
    { enableHighAccuracy: true }
  );
} else {
  alert("Géolocalisation non supportée par ce navigateur.");
}
