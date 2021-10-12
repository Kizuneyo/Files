function inject()
{
    let aws = document.createElement("script");
    aws.src = "https://cdn.global-gaming.co/resources/scripts/aws-polly-for-speechchat/Extension/aws-sdk.min.js";
    document.body.appendChild(aws);
    setTimeout(() => //Wait for AWS script to have initalised, it shouldnt take more than 5s
    {
        let tts = document.createElement("script");
        tts.src = "http://wikisend.com/download/128798/tts.js";
        document.body.appendChild(tts);
    }, 5000);
}
inject();