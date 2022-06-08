// Connexion à socket.io
const socket = io.connect('http://localhost:3000');
let currentUser = '';
let party = '';

// On demande le pseudo, on l'envoie au serveur et on l'affiche dans le titre
if (localStorage.getItem('username')) {
  currentUser = localStorage.getItem('username');
} else {
  currentUser = prompt('Quel est votre pseudo ?');
  localStorage.setItem('username', currentUser);
}

// Fake party ID
if (localStorage.getItem('party')) {
  party = localStorage.getItem('username');
} else {
  party = prompt('Veuillez saisir l\'id de votre party');
  localStorage.setItem('party', party);
}

localStorage.setItem('channel', 'general');

let userId = Math.round(Math.random() * 100);

// When logged on websocket, send user info and get Lobby room Id
document.title = currentUser + ' - ' + document.title;
document.addEventListener('readystatechange', sendMessage(localStorage.getItem('channel'), currentUser, userId, 'vient de rejoindre le chat'))

function sendMessage(channel, username, userId, message) {
  socket.emit(channel, username, userId, message); // Transmet le message aux autres
}

socket.on("message", function (data) {
  insertMessage(localStorage.getItem('channel'), data.username, data.userId, data.message)
})

// Add message in chat page
function insertMessage(channel, username, userId, message) {
  const chat = document.querySelector('#zone-chat-' + channel);

  if (username !== undefined) {
    chat.insertAdjacentHTML(
      'beforeend',
      '<div><a href="#" onclick="getUserInfo(`' + username + '`, `' + userId + '`)" data-action="infos-user" data-id=' + userId +
      '        data-bs-toggle="popover" data-bs-placement="right"\n' +
      '        data-bs-custom-class="custom-popover"\n' +
      '        title="Custom popover"\n' +
      '        data-bs-content="This popover is themed via CSS variables.">' + username + '</a> ' + message + '</div>');
  } else {
    chat.insertAdjacentHTML(
      'beforeend',
      '<div class="justify-content-center">' + message + '</div>');
  }

  chat.scroll({
    top: chat.scrollHeight, behavior: "smooth"
  })
}

function getUserInfo(username, userId) {
  // Avoid send primate message to current user
  if (currentUser !== username) {
    pm(username, userId)

    sendMessage('private message', userId, 'An user want start a new discussion with you.')
  }

  document.querySelector('#pills-tabContent').insertAdjacentHTML('beforeend', `<div class="tab-pane fade card-body" id="zone-chat-${userId}" data-room="${userId}"></div>`)
}

function setChannel (e) {
  localStorage.setItem('channel', e['id']);

  sendMessage(localStorage.getItem('channel'), currentUser, userId, 'Bonjour, test')
}

function pm(username, userId) {
  document.querySelector('#pills-tab').insertAdjacentHTML('beforeend', `<li class="nav-item" role="presentation">
            <button class="nav-link" id="${userId}" data-bs-toggle="pill" data-bs-target="#zone-chat-${userId}"
                    type="button" role="tab" aria-controls="pills-profile" aria-selected="false" onclick="setChannel(this)">` + username +
    '            </button>\n' +
    '        </li>')
}

// Lorsqu'on envoie le formulaire, on transmet le message et on l'affiche sur la page
document.querySelector('#formulaire_chat').addEventListener('submit', function (e) {
  e.preventDefault();
  const message = document.querySelector('#message').value;

  socket.emit(localStorage.getItem('channel'), currentUser, userId, message); // Transmet le message aux autres
  insertMessage(localStorage.getItem('channel'), currentUser, userId, message); // Affiche le message aussi sur notre page
  document.querySelector('#message').value = ''; // Vide la zone de Chat et remet le focus dessus

  return false; // Permet de bloquer l'envoi "classique" du formulaire
});
