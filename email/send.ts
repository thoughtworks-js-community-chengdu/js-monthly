import path from "path";
import fs from "fs";
import readline from "readline";
import {google} from "googleapis";
import base64url from "base64url";

const scopes = [
    'https://mail.google.com/',
    'https://www.googleapis.com/auth/gmail.modify',
    'https://www.googleapis.com/auth/gmail.compose'
];

/**
 * 此处的.credential文件请在
 * Google Developer Console: https://console.developer.google.com/
 * 中创建Oauth Client ID凭据，并下载，放置在项目的`email`目录下，并改名为.credential
 */
const CREDENTIAL_PATH = path.join(__dirname, './.credential');
const TOKEN_PATH = path.join(__dirname, './.token');

const credentials = JSON.parse(fs.readFileSync(CREDENTIAL_PATH, 'utf-8'));

const oauth2Client = new google.auth.OAuth2(
    credentials.web.client_id,
    credentials.web.client_secret,
    credentials.web.redirect_uris[0],
);


function storeToken(token: any) {
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(token));
    console.log('Token stored to ' + TOKEN_PATH);
    console.log('Please rerun command');
}

function send(rawBody: string) {
    fs.readFile(TOKEN_PATH, 'utf-8', (err, token) => {
        if (err) {
            const authUrl = oauth2Client.generateAuthUrl({
                access_type: 'offline',
                scope: scopes,
            });

            console.log(`\n please visit auth url: ${authUrl}\n`)

            let rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });
            rl.question('Enter the code from that page here: ', function (code) {
                rl.close();
                oauth2Client.getToken(code, function (err, token) {
                    if (err || !token) {
                        console.log('Error while trying to retrieve access token', err);
                        return;
                    }
                    oauth2Client.credentials = token;
                    storeToken(token);
                    process.exit(0);
                });
            });
            return;
        }

        oauth2Client.credentials = JSON.parse(token);
        const gmail = google.gmail({version: 'v1'});

        gmail.users.messages.send({
            auth: oauth2Client,
            userId: 'me',
            requestBody: {
                raw: rawBody,
            }
        }, (err, res) => {
            if (err) {
                console.error(err);
            }

            console.log(res);
            console.log("Success!")
        });
    })
}

function sendMail(to, bcc, subject, html) {

    const body: string[] = [];
    body.push(`MIME-Version: 1.0\r\n`);
    body.push(`Content-type:text/html;\r\n`);
    body.push(`TO: <${to || 'js-china@thoughtworks.com'}>\r\n`);
    if (bcc) body.push(`BCC: <${bcc}>\r\n`);
    body.push(`Subject: =?utf-8?B?${Buffer.from(subject).toString('base64')}?=\r\n`);
    body.push(`\r\n`);
    body.push(html)

    const rawBody = base64url(body.join(''))

    send(rawBody);
}

module.exports = sendMail;
