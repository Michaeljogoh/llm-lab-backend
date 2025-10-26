


export function responseFormatter(rawText: string) {
 
    let cleanText = rawText.replace(/\*\*/g, '');


    cleanText = cleanText.replace(/\*\s+/g, '\n');


    cleanText = cleanText.replace(/\n+/g, '\n').trim();

    return cleanText;
}