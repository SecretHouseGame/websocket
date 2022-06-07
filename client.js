// Connexion à socket.io
const socket = io.connect('http://localhost:3000');
// On demande le pseudo, on l'envoie au serveur et on l'affiche dans le titre
const currentUser = prompt('Quel est votre pseudo ?');
const channel = 'general';
let userId = Math.round(Math.random() * 100);

// When logged on websocket, send user info and get Lobby room Id
document.title = currentUser + ' - ' + document.title;
document.addEventListener('readystatechange', sendMessage(channel, currentUser, userId, 'vient de rejoindre le chat'))

function sendMessage(channel, username, userId, message) {
  socket.emit(channel, username, userId, message); // Transmet le message aux autres
}

socket.on("message", function (data) {
  insertMessage(channel, data.username, data.discussionId, data.message)
})

// Lorsqu'on envoie le formulaire, on transmet le message et on l'affiche sur la page
document.querySelector('#formulaire_chat').addEventListener('submit', function (e) {
  e.preventDefault();
  const message = document.querySelector('#message').value;

  socket.emit(channel, currentUser, userId, message); // Transmet le message aux autres
  insertMessage(channel, currentUser, userId, message); // Affiche le message aussi sur notre page
  document.querySelector('#message').value = ''; // Vide la zone de Chat et remet le focus dessus

  return false; // Permet de bloquer l'envoi "classique" du formulaire
});

// Add message in chat page
function insertMessage(channel, username, discussionId, message) {
  if (username !== undefined) {
    console.log('zone-chat-' + discussionId);
    document.querySelector('#zone-chat-' + channel).insertAdjacentHTML(
      'beforeend',
      '<div><a href="#" onclick="getUserInfo(`' + username + '`, `' + discussionId + '`)" data-action="infos-user" data-id=' + discussionId +
      '        data-bs-toggle="popover" data-bs-placement="right"\n' +
      '        data-bs-custom-class="custom-popover"\n' +
      '        title="Custom popover"\n' +
      '        data-bs-content="This popover is themed via CSS variables.">' + username + '</a> ' + message + '</div>');
  } else {
    document.querySelector('#zone-chat-' + channel).insertAdjacentHTML(
      'afterbegin',
      '<div class="justify-content-center">' + message + '</div>');
  }
}

function getUserInfo(username, discussionId) {
  sendMessage('private message', username, discussionId, 'An user want start a new discussion with you.')

  // Avoid send primate message to current user
  if (currentUser !== username) {
    pm(username, discussionId)
  }

  document.querySelector('#pills-tabContent').insertAdjacentHTML('beforeend', `<div class="tab-pane fade card-body" id="zone-chat-${discussionId}" data-room="${discussionId}"></div>`)
  console.log(discussionId);
}

function pm(username, discussionId) {
  document.querySelector('#pills-tab').insertAdjacentHTML('beforeend', `<li class="nav-item" role="presentation">
            <button class="nav-link" id="${discussionId}" data-bs-toggle="pill" data-bs-target="#zone-chat-${discussionId}"
                    type="button" role="tab" aria-controls="pills-profile" aria-selected="false">` + username +
    '            </button>\n' +
    '        </li>')
}
