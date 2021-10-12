//DOM requires user to interact with the document first befor allowing .play() to be automatically triggered, auto unmute disabled.
const urlParams = new URLSearchParams(location.search);
var messagesToRead = [];
let ttsEngine = "standard";
let ttsVoice = "Justin";
let allowScript = false;

window.addEventListener("load", () => { _init(false); });

function _init(manualFire)
{
    let timeout = manualFire ? 5000 : 500;
    setTimeout(() =>
    {
        if (urlParams.has("region") && urlParams.has("IdentityPoolId"))
        {
            allowScript = true;

            AWS.config.region = urlParams.get("region");
            AWS.config.credentials = new AWS.CognitoIdentityCredentials({IdentityPoolId: urlParams.get("IdentityPoolId")});

            let initTTS = setInterval(() =>
            {
                try
                {
                    document.body.click();
                    initialiseScript();
                    clearInterval(initTTS);
                }
                catch (error) { console.error(error); }
            }, 1000);
        }
        else { console.log("%cregion or IdentityPoolId paramaters are missing, please provide these paramaters in order to use AWS Polly. If you do not know how to get these details check the documentation here: https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/getting-started-browser.html", "color: red"); }
    }, timeout);
}
_init(true);

let userInteracted = false;
window.addEventListener("mousedown", () =>
{
    if (!userInteracted && allowScript)
    {
        userInteracted = true; window.removeEventListener("mousedown", this);

        let muteAttempts = 0;
        let mute = setInterval(() =>
        {
            let muteCheck = document.querySelector("#speech-checkbox");
            if (muteCheck != null)
            {
                let voiceTab = muteCheck.parentElement.parentElement;
                /*if (!muteCheck.checked) { muteCheck.click(); }
                muteCheck.parentElement.parentElement.removeChild(muteCheck.parentElement);*/ //Fix auto disable
                let pauseShortcutInput = document.querySelector("#pause_speech-hotkey-input");
                for (let i = voiceTab.childElementCount; i > 1; i--) //Set to 0 when audio disable is fixed
                { voiceTab.removeChild(voiceTab.childNodes[i]); }
                voiceTab.removeChild(voiceTab.querySelector("#username-voice-select-div"));
                pauseShortcutInput.parentElement.removeChild(pauseShortcutInput);
                let appMenuControlPanel = document.querySelector("#app-menu-controlpanel-div").firstChild;
                appMenuControlPanel.removeChild(appMenuControlPanel.childNodes[4]);
                appMenuControlPanel.removeChild(appMenuControlPanel.childNodes[3]);
                appMenuControlPanel.removeChild(appMenuControlPanel.childNodes[2]);
                clearInterval(mute);
            }
            else if (muteAttempts >= 10) { clearInterval(muteAttempts); }
            muteAttempts++;
        }, 1000);
    }
});

let initalised = false;
function initialiseScript()
{
    if (!initalised)
    {
        createTTSPlayer();
        handleRequests();
        ttsEngine = urlParams.has("Engine") ? urlParams.get("Engine") : "standard";
        ttsVoice =  urlParams.has("Voice") ? urlParams.get("Voice") : "Justin";
        initalised = true;
    }
}

function handleRequests()
{
    //Watch for added messages
    let observer = new MutationObserver((mutations) =>
    {
        mutations.forEach(mutation =>
        {
            mutation.addedNodes.forEach(node =>
            {
                let messageValid = false;
                let validClasses = ["twitch-chat-li", "youtube-chat-li", "mixer-chat-li"];
                let invalidClasses = ["chat-line-system-msg", "chat-line-event-msg", "youtube-sending-message"];
                for (let i = 0; i < validClasses.length; i++) { if (node.classList.contains(validClasses[i])) { messageValid = true; }}
                if (messageValid) { for (let i = 0; i < invalidClasses.length; i++) { if (node.classList.contains(invalidClasses[i])) { messageValid = false; break; }}}

                if (messageValid)
                {
                    let message = { msg: node.querySelector(".chat-line-message"), image: 0 };
                    message.text = message.msg.innerText.split(" ");
                    message.images = message.msg.querySelectorAll("img");
                    for (let i = 0; i < message.text.length; i++) { if (message.text[i] == "") { message.text[i] = message.images[message.image++].alt; }}
                    message = message.text.join(" ");
                    let blacklistedStarts = ["!", "whisper"];
                    for (let i = 0; i < blacklistedStarts.length; i++) { if (message.startsWith(blacklistedStarts[i])) { messageValid = true; }}
                    if (messageValid)
                    {
                        messagesToRead.push(message);
                        if (messagesToRead.length <= 1) { synthesizeSpeech(); }
                    }
                }
            });
        });
    });
    observer.observe(document.querySelector("#messages-ul"), {childList: true}); //Watch for message updates
}

//TTS
let ttsMuted = false;
async function synthesizeSpeech()
{
    var speechParams =
    {
        Engine: ttsEngine,
        OutputFormat: "mp3",
        SampleRate: "22050",
        Text: messagesToRead[0],
        TextType: "text",
        VoiceId: ttsVoice
    }

    if (!ttsMuted && userInteracted)
    {
        var polly = new AWS.Polly({apiVersion: '2016-06-10'});
        var signer = new AWS.Polly.Presigner(speechParams, polly);
    
        signer.getSynthesizeSpeechUrl(speechParams, function(error, url)
        {
            if (error) { console.log(`%c${error}`, "color: red"); }
            else
            {
                document.querySelector("#source").src = url;
                let player = document.querySelector("#audio");
                player.load();
                player.play();
            }
        });
    }
    else { messagesToRead.shift(); }
}

let firstPlayer = true;
function createTTSPlayer()
{
    if (firstPlayer)
    {
        let pauseButton = document.querySelector("#pause-speech-button");
        pauseButton.addEventListener("click", () =>
        {
            let buttonText = window.getComputedStyle(pauseButton, ":after").getPropertyValue("content");
            if (buttonText == `" Pause speech"`) { ttsMuted = true; }
            else { ttsMuted = false; }
        });

        let mp3Player = document.createElement("audio");
        let mp3Config = document.createElement("source");
        mp3Player.style.display = "none";
        mp3Player.id = "audio";
        mp3Player.volume = 1;
        mp3Config.id = "source";
        mp3Player.appendChild(mp3Config);
        document.body.appendChild(mp3Player);
    
        //Remove previous TTS request and start next if list is not empty
        mp3Player.addEventListener("ended", () => { continueTTS() });

        mp3Player.addEventListener("error", (err) => { console.error(err); continueTTS(); })

        function continueTTS()
        {
            messagesToRead.shift();
            if (messagesToRead.length >= 1) { synthesizeSpeech(); }
        }

        firstPlayer = false;
    }
}