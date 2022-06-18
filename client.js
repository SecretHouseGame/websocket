// Connexion à socket.io
const socket = io.connect('http://localhost:3000');
let socketId;
let currentUser = '';
let party = '';
let arrayDiscussion = [];
localStorage.setItem('type', 'general')

// TODO Party is id to regroup users, messages and private messages.
// FIXME: Lorsqu'on envoie un message privee, ils sont encore deétecté comme message normaux et non message privee donc
//  ne passe plus par le private message. -> Change le state du chat privee pour envoyer directement en message privée.

// On demande le pseudo, on l'envoie au serveur et on l'affiche dans le titre
if (localStorage.getItem('username')) {
    currentUser = localStorage.getItem('username');
} else {
    currentUser = prompt('Quel est votre pseudo ?');
    localStorage.setItem('username', currentUser);
}

// Fake party ID
if (localStorage.getItem('party')) {
    party = localStorage.getItem('party');
} else {
    party = prompt('Veuillez saisir l\'id de votre party');
    localStorage.setItem('party', party);
}

localStorage.setItem('channel', 'tab-general');

// When logged on websocket, send user info and get Lobby room Id
document.title = currentUser + ' - ' + document.title;
socket.on('connect', () => {
    socketId = socket.id
    sendMessage(
        'event',
        currentUser,
        socketId,
        socketId,
        currentUser + ' vient de rejoindre le chat avec le socket : ' + socketId,
        party
    )

    socket.on(socketId, function (data) {
        if (!arrayDiscussion.includes(data.fromUserId)) {
            arrayDiscussion.push(data.fromUserId)

            insertTab(data.username, data.fromUserId);
            insertChat(data.fromUserId);
        }

        if (localStorage.getItem('channel') !== data.fromUserId) {
            addNotification (data.fromUserId)
        }

        insertMessage(
            data.fromUserId,
            data.message,
            data.fromUserId,
            data.username
        )
    })

    socket.on("message_" + party, function (data) {
        if (localStorage.getItem('channel') !== 'tab-general') {
            addNotification ('tab-general')
        }

        insertMessage(
          'tab-general',
          data.message,
          data.toUserId,
          data.username,
          data.type
        )
    })
});

function sendMessage(channel, username, toUserId, fromUserId, message) {
    socket.emit(channel, username, toUserId, fromUserId, message, localStorage.getItem('party')); // Transmet le message aux autres
}

function addNotification (tab) {
    const el = document.querySelector(`button.nav-link#` + tab);
    const notification = document.querySelector(`div#notification-` + tab);

    if (notification) {
        let value = notification.textContent;
        value++;
        notification.innerHTML = value;
    } else {
        el.insertAdjacentHTML('beforeend', `
        <div id="notification-${tab}" class="notifications bg-red-500 rounded-lg px-3 object-fill ml-1">1</div>
    `)
    }
}

// Add message in chat page
function insertMessage(channel, message, userId, username, type) {
    const chat = document.querySelector('#zone-chat-' + channel);

    if (type === "event") {
        chat.insertAdjacentHTML(
          'beforeend',
          '<div class="justify-center text-xs p-3">' + message + '</div>');
    } else {
        chat.insertAdjacentHTML(
          'beforeend',
          '<div><a href="" onclick="getUserInfo(this, `' + username + '`, `' + userId + '`)" data-action="infos-user" data-id=' + userId +
          '   data-type="private_message" data-channel_id="' + userId + '" data-bs-toggle="pill" data-bs-target="#zone-chat-' + userId + '" role="tab" aria-controls="pills-profile" aria-selected="false"  ' +
          '>' + username + '</a> ' + message + '</div>');
    }

    chat.scroll({
        top: chat.scrollHeight, behavior: "smooth"
    })
}

function getUserInfo(e, username) {
    // Avoid send primate message to current user
    if ((currentUser !== username) && (!arrayDiscussion.includes(e.dataset.channel_id))) {
        pm(username, e.dataset.channel_id)
        arrayDiscussion.push(e.dataset.channel_id)
        insertChat(e.dataset.channel_id);
    }
}

function insertChat(channel_id) {
    document.querySelector('#pills-tabContent').insertAdjacentHTML('beforeend', `<div class="tab-pane fade card-body" data-type="private_message" id="zone-chat-${channel_id}"></div>`)
}

function setChannel(e) {
    const notification = document.querySelector(`div#notification-` + e.dataset.channel_id);

    if (notification) {
        notification.remove()
    }

    localStorage.setItem('channel', e.dataset.channel_id);

    if (localStorage.getItem('channel') === 'tab-general') {
        localStorage.setItem('type', 'general');
    } else {
        localStorage.setItem('type', 'pm');
    }
}

function insertTab(username, userId) {
    document.querySelector('#pills-tab').insertAdjacentHTML('beforeend', `<li class="nav-item" role="presentation">
            <button class="nav-link flex justify-center items-center px-1" id="${userId}" data-type="private_message" data-channel_id="${userId}" data-bs-toggle="pill" data-bs-target="#zone-chat-${userId}"
                    type="button" role="tab" aria-controls="pills-profile" aria-selected="false" onclick="setChannel(this)">` + username +
        '            </button>\n' +
        '        </li>')
}

function pm(username, userId) {
    localStorage.setItem('type', 'pm');
    insertTab(username, userId);
}

// Lorsqu'on envoie le formulaire, on transmet le message et on l'affiche sur la page
document.querySelector('#formulaire_chat').addEventListener('submit', function (e) {
    e.preventDefault();
    const message = document.querySelector('#message').value;

    if (localStorage.getItem('type') === 'general') {
        sendMessage(localStorage.getItem('channel'), currentUser, socketId, socketId, message, localStorage.getItem('party'));
    } else {
        sendMessage('private message', currentUser, localStorage.getItem('channel'), socketId, message, localStorage.getItem('party'));
    }

    insertMessage(localStorage.getItem('channel'), message, socketId, currentUser); // Affiche le message aussi sur notre page
    document.querySelector('#message').value = ''; // Vide la zone de Chat et remet le focus dessus

    return false; // Permet de bloquer l'envoi "classique" du formulaire
});
