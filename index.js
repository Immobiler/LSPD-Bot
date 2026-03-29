require("dotenv").config();
const {
    Client,
    GatewayIntentBits,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    Events,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    UserSelectMenuBuilder,
    EmbedBuilder,
    ButtonBuilder,
    ButtonStyle,
} = require("discord.js");

const config = require("./config");

const rankRoles = [
    { id: "1376207536579022959", label: "Praktikant/in │01│" },
    { id: "1376207535408681033", label: "Azubi │02│" },
    { id: "1376207535022800926", label: "Tuner/in │03│" },
    { id: "1376211037346594866", label: "Geselle │04│" },
    { id: "1376207534075150427", label: "Meister/in │05│" },
    { id: "1376207533630423169", label: "Ausbilder/in │06│" },
    { id: "1376217874565431530", label: "Stv. Werkstattleiter/in │07│" },
    { id: "1376217871792734340", label: "Werkstattleiter/in │08│" },
    { id: "1376217876838481961", label: "Personalverwaltung │09│" },
    { id: "1376207530308403340", label: "Manager/in │10│" },
    { id: "1376207529650159687", label: "Stv. Inhaber/in │11│" },
    { id: "1376207522347614320", label: "Inhaber/in │12│" },
];

const keepRoles = [...config.keepRolesAlways, ...config.keepRolesIfPresent];

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

// 🔥 Embed Template
function createEmbed({ title, member, executor, reason, extraFields, fromText, zeitraum }) {
    const embed = new EmbedBuilder()
        .setColor("#660909")
        .setTitle(title || "Aktion")
        .setThumbnail(
            "https://cdn.discordapp.com/attachments/1486411922084724889/1486418576805072916/BLP_Flagge.png"
        );

    const fields = [];
    if(member) fields.push({ name: "Wer:", value: `<@${member.id}>`, inline: true });
    if(fromText) fields.push({ name: "Von:", value: fromText, inline: true });
    if(zeitraum) fields.push({ name: "Zeitraum:", value: zeitraum, inline: true });
    if(reason) fields.push({ name: "Grund:", value: reason });
    if(extraFields) fields.push(...extraFields);
    fields.push({ name: "📅 Datum:", value: `<t:${Math.floor(Date.now() / 1000)}:f>` });

    embed.addFields(fields);

    embed.setFooter({
        text: `Blackline Bot • ausgeführt von ${executor.username}`,
        iconURL:
            "https://cdn.discordapp.com/attachments/1486411922084724889/1486418577463705831/BLP_Logo_2.png",
    });

    return embed;
}

// ✅ READY
client.once("ready", () => console.log("✅ Blackline Bot online!"));

// 🔹 Neue Mitglieder Join-Rollen
client.on("guildMemberAdd", async (member) => {
    try {
        for (const roleId of config.joinRoles) {
            await member.roles.add(roleId).catch(console.error);
        }
    } catch (err) {
        console.error("Fehler beim Zuweisen der Join-Rollen:", err);
    }
});

client.on(Events.InteractionCreate, async (interaction) => {
    try {
        // =====================
        // SLASH COMMANDS
        // =====================
        if (interaction.isChatInputCommand()) {
            // 🔹 PANEL
            if (interaction.commandName === "panel") {
                const hasPermission = config.panelRoles.some((roleId) =>
                    interaction.member.roles.cache.has(roleId)
                );
                if (!hasPermission) return interaction.reply({ content: "❌ Keine Berechtigung!", flags: 64 });

                const menu = new StringSelectMenuBuilder()
                    .setCustomId("aktion_auswahl")
                    .setPlaceholder("Wähle eine Aktion")
                    .addOptions([
                        { label: "Einstellung", value: "einstellung" },
                        { label: "Kündigung", value: "kuendigung" },
                        { label: "Up/Down Rank", value: "updownrank" },
                        { label: "Sanktion", value: "sanktion" },
                    ]);

                return interaction.reply({
                    content: "📋 **Blackline Verwaltung**",
                    components: [new ActionRowBuilder().addComponents(menu)],
                    flags: 64,
                });
            }

            // 🔹 ABMELDEN
            if (interaction.commandName === "abmelden") {
                const hasPermission = config.abmeldenRoles.some((roleId) =>
                    interaction.member.roles.cache.has(roleId)
                );
                if (!hasPermission) return interaction.reply({ content: "❌ Keine Berechtigung!", flags: 64 });

                const zeitraum = interaction.options.getString("zeitraum");
                const grund = interaction.options.getString("grund");

                const embed = createEmbed({
                    title: "Neue Abmeldung",
                    member: interaction.user,
                    executor: interaction.user,
                    reason: grund,
                    zeitraum,
                });

                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId(`abmelden_accept_${interaction.user.id}_${zeitraum}`)
                        .setLabel("✅ Akzeptieren")
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId(`abmelden_reject_${interaction.user.id}_${zeitraum}`)
                        .setLabel("❌ Ablehnen")
                        .setStyle(ButtonStyle.Danger)
                );

                const channel = interaction.guild.channels.cache.get(config.abmeldungModerationChannelId);
                await channel.send({ content: `<@${interaction.user.id}>`, embeds: [embed], components: [row] });

                return interaction.reply({ content: "✅ Abmeldung eingereicht!", flags: 64 });
            }

            // 🔹 CLEAR
            if (interaction.commandName === "clear") {
                const hasPermission = config.clearRoles.some((roleId) =>
                    interaction.member.roles.cache.has(roleId)
                );
                if (!hasPermission) return interaction.reply({ content: "❌ Keine Berechtigung!", flags: 64 });

                const amount = interaction.options.getInteger("anzahl");
                const messages = await interaction.channel.messages.fetch({ limit: amount + 1 });
                await interaction.channel.bulkDelete(messages, true);
                return interaction.reply({ content: `✅ ${amount} Nachrichten gelöscht!`, flags: 64 });
            }

            // 🔹 KAMMER
            if (interaction.commandName === "kammer") {
                const hasPermission = config.abmeldenRoles.some((roleId) =>
                    interaction.member.roles.cache.has(roleId)
                );
                if (!hasPermission) return interaction.reply({ content: "❌ Keine Berechtigung!", flags: 64 });

                const von = interaction.options.getString("von");
                const item = interaction.options.getString("item");

                const embed = new EmbedBuilder()
                    .setColor("#660909")
                    .setTitle("Kammer-Eintrag")
                    .setThumbnail("https://cdn.discordapp.com/attachments/1486411922084724889/1486418576805072916/BLP_Flagge.png")
                    .addFields(
                        { name: "Item:", value: item },
                        { name: "Von:", value: von },
                        { name: "📅 Datum:", value: `<t:${Math.floor(Date.now() / 1000)}:f>` }
                    )
                    .setFooter({
                        text: `Blackline Bot • ausgeführt von ${interaction.user.username}`,
                        iconURL: "https://cdn.discordapp.com/attachments/1486411922084724889/1486418577463705831/BLP_Logo_2.png",
                    });

                const channel = interaction.guild.channels.cache.get(config.abmeldungPublicChannelId);
                if(channel) await channel.send({ embeds: [embed] });

                return interaction.reply({ content: "✅ Kammer-Eintrag erstellt!", flags: 64 });
            }
        }

        // =====================
        // Buttons & Modals für Abmeldung
        // =====================
        if (interaction.isButton()) {
            const [action, , userId, zeitraum] = interaction.customId.split("_");
            const member = await interaction.guild.members.fetch(userId);

            if (action === "abmelden") {
                if (interaction.customId.startsWith("abmelden_accept_")) {
                    const embed = createEmbed({
                        title: "Abmeldung akzeptiert",
                        member,
                        executor: interaction.user,
                        zeitraum,
                    });

                    await member.send({ content: `<@${member.id}>`, embeds: [embed] }).catch(console.error);

                    const publicChannel = interaction.guild.channels.cache.get(config.abmeldungPublicChannelId);
                    if (publicChannel) await publicChannel.send({ content: `<@${member.id}>`, embeds: [embed] });

                    return interaction.update({ content: "✅ Abmeldung akzeptiert!", components: [], embeds: [] });
                }

                if (interaction.customId.startsWith("abmelden_reject_")) {
                    const modal = new ModalBuilder()
                        .setCustomId(`abmelden_reject_modal_${userId}_${zeitraum}`)
                        .setTitle("Abmeldung ablehnen");

                    modal.addComponents(
                        new ActionRowBuilder().addComponents(
                            new TextInputBuilder()
                                .setCustomId("reason")
                                .setLabel("Grund der Ablehnung")
                                .setStyle(TextInputStyle.Paragraph)
                                .setRequired(true)
                        )
                    );

                    return interaction.showModal(modal);
                }
            }
        }

        if (interaction.isModalSubmit()) {
            if (interaction.customId.startsWith("abmelden_reject_modal_")) {
                const [, , userId, zeitraum] = interaction.customId.split("_");
                const member = await interaction.guild.members.fetch(userId);
                const reason = interaction.fields.getTextInputValue("reason");

                const embed = createEmbed({
                    title: "Abmeldung abgelehnt",
                    member,
                    executor: interaction.user,
                    reason,
                    zeitraum,
                });

                await member.send({ content: `<@${member.id}>`, embeds: [embed] }).catch(console.error);

                return interaction.reply({ content: "✅ Abmeldung abgelehnt!", flags: 64 });
            }
        }
    } catch (err) {
        console.error(err);
    }
});

client.login(process.env.TOKEN);
