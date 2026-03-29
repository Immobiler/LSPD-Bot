module.exports = {
    // Rollen, die Zugriff auf bestimmte Commands haben
    panelRoles: ["1376953825088376843", "1485722228929728694"], // /panel
    abmeldenRoles: ["1376207536579022959"], // /abmelden
    clearRoles: ["1376207535408681033"], // /clear

    // Mod-Rolle für allgemeine Rechte
    modRoleId: "1376953825088376843",

    // Log Channels
    einstellungLogChannelId: "1486406107277819955",
    kuendigungLogChannelId: "1486406237670080674",
    rankLogChannelId: "1486406107277819955",
    sanktionLogChannelId: "1486405963551608904",
    defaultLogChannelId: "1487155479175106661",

    // Abmeldung Channels
    abmeldungModerationChannelId: "1487269383238713487",
    abmeldungPublicChannelId: "1486405878029750446",

    // Rollen für Einstellung
    einstellungRoles: [
        "1485722228929728694",
        "1376953825088376843",
        "1485721831330549760",
        "1376207536579022959"
    ],

    // Rollen, die immer behalten werden sollen
    keepRolesAlways: [
        "1485722559034032168",
        "1376207540064489644"
    ],

    // Rollen, die behalten werden sollen, wenn man sie schon hat
    keepRolesIfPresent: [
        "1376953555164074104",
        "1376207537849766009",
        "1376207540479725619",
        "1376953107606405190",
        "1376953244097577081",
        "1376953292688588870"
    ],

    // Rollen, die einem neuen Mitglied automatisch gegeben werden
    joinRoles: [
        "1485722559034032168", // Rolle 1
        "1376207540064489644"  // Rolle 2
    ]
};
