import VulnerabilitySettings from './models/VulnerabilitySettings';

function replaceAllChars(input: string, searchChar: string, replaceChar: string): string {
    const regex = new RegExp(searchChar, 'g');
    return input.replace(regex, replaceChar);
}

function getVulnerabilitySettings(
    userID: string,
    vulnerabilitySettings: {
        [userID: string]: VulnerabilitySettings
}): VulnerabilitySettings {
    return vulnerabilitySettings[userID] || new VulnerabilitySettings(false, false);
}

export {
    replaceAllChars,
    getVulnerabilitySettings
}