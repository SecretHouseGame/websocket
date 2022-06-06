// Connexion à socket.io
const socket = io.connect('http://localhost:3000');
// On demande le pseudo, on l'envoie au serveur et on l'affiche dans le titre
const username = prompt('Quel est votre pseudo ?');
const channel = 'general';
const discussion_id = socket.id;
const userId = Math.round(Math.random() * 100);
console.log(userId);

document.title = username + ' - ' + document.title;
// Quand on reçoit un message, on l'insère dans la page
document.addEventListener('readystatechange', sendMessage(channel, username, userId, 'vient de rejoindre le chat'))

function sendMessage (channel, username, userId, message) {
  socket.emit(username, userId, message, channel); // Transmet le message aux autres
}

socket.on("message", function(data) {
  insertMessage(data.username, data.userId, data.message)
})

// Lorsqu'on envoie le formulaire, on transmet le message et on l'affiche sur la page
document.querySelector('#formulaire_chat').addEventListener('submit', function (e) {
  e.preventDefault();
  const message = document.querySelector('#message').value;

  socket.emit(channel, username, userId, message); // Transmet le message aux autres

  insertMessage(username, userId, message); // Affiche le message aussi sur notre page

  document.querySelector('#message').value = ''; // Vide la zone de Chat et remet le focus dessus

  return false; // Permet de bloquer l'envoi "classique" du formulaire
});

// Ajoute un message dans la page
function insertMessage(username, userId, message) {
  if (username !== undefined) {
    document.querySelector('#zone_chat').insertAdjacentHTML(
      'afterbegin',
      '<div><a href="#" onclick="getUserInfo(`' + username + '`, `${userId}`)" data-action="infos-user" data-id='+ userId +
      '        data-bs-toggle="popover" data-bs-placement="right"\n' +
      '        data-bs-custom-class="custom-popover"\n' +
      '        title="Custom popover"\n' +
      '        data-bs-content="This popover is themed via CSS variables.">' + username + '</a> ' + message + '</div>');
  } else {
    document.querySelector('#zone_chat').insertAdjacentHTML(
      'afterbegin',
      '<div class="justify-content-center">' + message + '</div>');
  }
}

function getUserInfo (username, userId) {
  sendMessage('pm', username, userId)
  pm(username, userId)
}

function pm(username, userId) {
  document.querySelector('#pills-tab').insertAdjacentHTML('beforeend', `<li class="nav-item" role="presentation">
            <button class="nav-link" id="${userId}" data-bs-toggle="pill" data-bs-target="#pills-profile"
                    type="button" role="tab" aria-controls="pills-profile" aria-selected="false">` + username +
    '            </button>\n' +
    '        </li>')
}
