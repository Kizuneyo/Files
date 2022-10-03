function inject()
{
    let aws = document.createElement("script");
    aws.src = "https://cdn.jsdelivr.net/gh/Kizuneyo/Files@main/aws-sdk.min.js";
    document.body.appendChild(aws);
    setTimeout(() => //Wait for AWS script to have initalised
    {
        let tts = document.createElement("script");
        tts.src = "https://cdn.jsdelivr.net/gh/Kizuneyo/Files@main/inject.js";
        document.body.appendChild(tts);
    }, 5000);
}
inject();
