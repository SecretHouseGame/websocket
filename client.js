// Connexion à socket.io
const socket = io.connect('http://localhost:3000');
let currentUser = '';
let party = '';
let userId = '';
let arrayDiscussion = [];
localStorage.setItem('type', 'general')

// On demande le pseudo, on l'envoie au serveur et on l'affiche dans le titre
if (localStorage.getItem('username')) {
    currentUser = localStorage.getItem('username');
} else {
    currentUser = prompt('Quel est votre pseudo ?');
    localStorage.setItem('username', currentUser);
}
if (localStorage.getItem('userId')) {
    userId = localStorage.getItem('userId');
} else {
    userId = prompt('Quel est votre id ?');
    localStorage.setItem('userId', userId);
}

roomId = prompt('Dans quel piece voulez-vous aller ?');
localStorage.setItem('room', roomId);
document.querySelector(`div.fade.card-body[data-room='tab-general']`).id = 'zone-chat-' + roomId;

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
    //NEW PARAMS DONE
    sendMessage(
        'event',
        localStorage.getItem('party'),
        localStorage.getItem('room'),
        currentUser,
        'avatar',
        currentUser + ' vient de rejoindre la pièce ' + userId,
        userId,
        userId
    )

    socket.on(userId, function (data) {
        if (!arrayDiscussion.includes(data.fromUserId)) {
            arrayDiscussion.push(data.fromUserId)

            insertTab(data.username, data.fromUserId);
            insertChat(data.fromUserId);
        }

        if (localStorage.getItem('channel') !== data.fromUserId) {
            addNotification(data.fromUserId)
        }

        // NEW PARAMS DONE
        insertMessage(
            localStorage.getItem('channel'),
            data.partyId,
            data.roomId,
            data.username,
            data.avatar,
            data.message,
            data.fromUserId,
            data.toUserId ?? data.fromUserId,
            data.type
        )
    })

    socket.on("message_" + party + '_' + roomId, function (data) {
        if (localStorage.getItem('channel') !== 'tab-general') {
            addNotification('tab-general')
        }

        // NEW PARAMS DONE
        insertMessage(
            localStorage.getItem('channel'),
            data.partyId,
            data.roomId,
            data.username,
            data.avatar,
            data.message,
            data.fromUserId,
            data.toUserId ?? data.fromUserId,
            data.type
        )
    })
});

// NEW PARAMS DONE
function sendMessage(channel, partyId, roomId, username, avatar, message, fromUserId, toUserId) {
    socket.emit(channel, localStorage.getItem('party'), roomId, username, avatar, message, fromUserId, toUserId); // Transmet le message aux autres
}

function addNotification(tab) {
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
// NEW PARAMS DONE
function insertMessage(channel, partyId, roomId, username, avatar, message, fromUserId, toUserId, type) {
    let chat = '';

    if (channel === 'tab-general') {
        chat = document.querySelector('#zone-chat-' + roomId);
    } else {
        chat = document.querySelector('#zone-chat-' + channel);
    }

    if (type === "event") {
        chat.insertAdjacentHTML(
            'beforeend',
            '<div class="justify-center text-xs p-3">' + message + '</div>');
    } else {
        chat.insertAdjacentHTML(
            'beforeend',
            '<div><a href="" onclick="getUserInfo(this, `' + username + '`, `' + fromUserId + '`)" data-action="infos-user" data-id=' + fromUserId +
            '   data-type="private_message" data-channel_id="' + fromUserId + '" data-bs-toggle="pill" data-bs-target="#zone-chat-' + fromUserId + '" role="tab" aria-controls="pills-profile" aria-selected="false"  ' +
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
    } else if (localStorage.getItem('channel') === 'pm') {
        localStorage.setItem('type', 'pm');
    } else {
        localStorage.setItem('type', 'room');
        let partyId = localStorage.getItem('party');
        let roomId = localStorage.getItem('room');
        insertChat("message_" + partyId + '_' + roomId);
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
    let avatar = localStorage.getItem('avatar') ?? 'https://pkimgcdn.peekyou.com/dfd8bab38ab56d2b89dac1dad40b9e1e.jpeg';

    if (localStorage.getItem('type') === 'general') {
        // NEW PARAMS DONE
        sendMessage('tab-general', localStorage.getItem('party'), localStorage.getItem('room'), currentUser, avatar, message, userId, userId, 'tab-general');
    } else {
        // NEW PARAMS DONE
        sendMessage('private message', localStorage.getItem('party'), localStorage.getItem('room'), currentUser, avatar, message, userId, userId, 'pm');
    }

    // NEW PARAMS DONE
    insertMessage(localStorage.getItem('channel'), localStorage.getItem('partyId'), localStorage.getItem('room'), currentUser, avatar, message, userId, userId, 'message'); // Affiche le message aussi sur notre page
    document.querySelector('#message').value = ''; // Vide la zone de Chat et remet le focus dessus

    return false; // Permet de bloquer l'envoi "classique" du formulaire
});
