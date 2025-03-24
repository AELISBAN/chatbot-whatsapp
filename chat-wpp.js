const wppconnect = require('@wppconnect-team/wppconnect');
const firebasedb = require('./firebase.js');

var userStages = [];

wppconnect.create({
    session: 'whatsbot',
    autoClose: false,
    puppeteerOptions: { args: ['--no-sandbox'] }
})
    .then((client) =>
        client.onMessage((message) => {
            console.log('Mensaje escrito por el usuario: ' + message.body);
            queryUserByPhone(client, message);
        }))
    .catch((error) => console.log(error));

async function queryUserByPhone(client, message) {
    let phone = (message.from).replace(/[^\d]+/g, '');
    let userdata = await firebasedb.queryByPhone(phone);
    if (userdata == null) {
        userdata = await saveUser(message);
    }
    console.log('Usuario actual: ' + userdata['id']);
    stages(client, message, userdata);
}

//  Etapas = hola  >>  nombre  >>  DNI  >>  fin
async function stages(client, message, userdata) {
    if (userStages[message.from] == undefined) {
        sendWppMessage(client, message.from, '¡Bienvenido al Bot de WhatsApp de NEX!');
    }
    if (userdata['nombre'] == undefined) {
        if (userStages[message.from] == undefined) {
            sendWppMessage(client, message.from, 'Por favor, ingrese su *NOMBRE*:');
            userStages[message.from] = 'nombre';
        } else {
            userdata['nombre'] = message.body;
            firebasedb.update(userdata);
            sendWppMessage(client, message.from, 'Gracias, ' + message.body);
            sendWppMessage(client, message.from, 'Por favor, ingrese su *DNI*:');
            userStages[message.from] = 'dni';
        }

    } else if (userdata['dni'] == undefined) {
        if (userStages[message.from] == undefined) {
            sendWppMessage(client, message.from, 'Por favor, ingrese su *DNI*:');
            userStages[message.from] = 'dni';
        } else {
            userdata['dni'] = (message.body).replace(/[^\d]+/g, '');
            firebasedb.update(userdata);
            sendWppMessage(client, message.from, 'Gracias por proporcionar su DNI: ' + message.body);
            sendWppMessage(client, message.from, 'Fin');
            userStages[message.from] = 'fin';
        }

    } else {
        if (userStages[message.from] == undefined) {
            userStages[message.from] = 'fin';
        }
        sendWppMessage(client, message.from, 'Fin');
    }
}

function sendWppMessage(client, sendTo, text) {
    client.sendText(sendTo, text)
        .then((result) => {
            // console.log('ÉXITO: ', result); 
        })
        .catch((error) => {
            console.error('ERROR: ', error);
        });
}

async function saveUser(message) {
    let user = {
       // 'pushname': (message['sender']['pushname'] != undefined) ? message['sender']['pushname'] : '',
        'whatsapp': (message.from).replace(/[^\d]+/g, '')
    }
    let newUser = firebasedb.save(user);
    return newUser;
}
