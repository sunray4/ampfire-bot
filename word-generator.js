export function paGenerator () {
    var pas = ["Rajan", "Patricia", "Beck", "Abbie", "Ally", "Priyanka", "Sal", "Kie", "Erin", "Josh", "Kyle"];

    var pa = pas[Math.floor(Math.random() * pas.length)];
    return pa;
}

export function fiducialPhraseGenerator() {
    var phrases = ["you're up in fiducial!!" , "it's your turn in fiducial!!", "you're next in fiducial!!", "get ready, it's your fiducial time!!", "it's your moment in fiducial!!", "you're the next in line for fiducial!!", "prepare yourself, it's your turn in fiducial!!", "your turn in fiducial has arrived!!", "ready yourself, it's your turn in fiducial!!", "it's time to say your fiducial number!!"];
    return phrases[Math.floor(Math.random() * phrases.length)];
}