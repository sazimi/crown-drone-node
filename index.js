const WebSocket = require('ws');
const { Notion } = require('@neurosity/notion')

require('dotenv').config();

const wss = new WebSocket(process.env.SERVER);
const notion = new Notion({
    deviceId: process.env.CROWN_ID
});

wss.on('open', function open() {
    console.log('connection open');
    wss.send('command');
});

var isFlying = false;
var isLeft = false;
var isRight = false;
const main = async () => {
    await notion
        .login({
            email: process.env.CROWN_EMAIL,
            password: process.env.CROWN_PASS
        }).then(() => {
            notion.selectDevice((devices) => {
                return devices.find((device) => device.deviceNickname === "Crown-440");
            });
            notion.accelerometer().subscribe(accelerometer => {

                if (accelerometer.acceleration > 1 && !isLeft) {
                    if (accelerometer.pitch > 30) {
                        isLeft = true;
                        wss.send('left 50');
                    }

                    if (accelerometer.pitch < -30 && !isRight) {
                        isRight = true;
                        wss.send('right 50');
                    }
                }

            });

        })
        .catch((error) => {
            console.log(error);
            throw new Error(error);
        });
    console.log("Logged in");

    notion.focus().subscribe((focus) => {
        if (focus.probability > 0.1) {
            if (!isFlying) {
                isFlying = true;
                wss.send('takeoff');
            }
        }

    });

};

main();