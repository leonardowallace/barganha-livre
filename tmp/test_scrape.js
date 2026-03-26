async function testScrape() {
    const url = 'https://mercadolivre.com/sec/1Nsn5dh';
    try {
        const response = await fetch(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36' },
            redirect: 'follow'
        });
        const html = await response.text();
        const marker = '"polycards":';
        const markerIdx = html.indexOf(marker);
        const startBracketIdx = html.indexOf('[', markerIdx);
        let depth = 0;
        let endBracketIdx = -1;
        for (let i = startBracketIdx; i < html.length; i++) {
            if (html[i] === '[') depth++;
            else if (html[i] === ']') {
                depth--;
                if (depth === 0) {
                    endBracketIdx = i;
                    break;
                }
            }
        }
        if (endBracketIdx !== -1) {
            const rawArray = html.substring(startBracketIdx, endBracketIdx + 1);
            const polycards = JSON.parse(rawArray);
            if (polycards.length > 0) {
                console.log('Sample Polycard Keys:', Object.keys(polycards[0]));
                console.log('Sample Polycard Data:', JSON.stringify(polycards[0], null, 2));
            }
        }
    } catch (err) {
        console.error('Error:', err.message);
    }
}
testScrape();
