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
    PermissionsBitField
} = require("discord.js");

const config = require("./config");

// 🔥 RANK ROLLEN
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
    { id: "1376207522347614320", label: "Inhaber/in │12│" }
];

// Rollen, die immer behalten werden
const keepRoles = [...config.keepRolesAlways, ...config.keepRolesIfPresent];

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// 🔥 Embed Template
function createEmbed({ title, member, executor, reason, extraFields, fromText }) {
    const embed = new EmbedBuilder()
        .setColor("#660909")
        .setTitle(title || "Aktion")
        .setThumbnail("https://cdn.discordapp.com/attachments/1486411922084724889/1486418576805072916/BLP_Flagge.png")
        .addFields(
            { name: "Wer:", value: `<@${member.id}>`, inline: true },
            { name: "Von:", value: fromText || `<@${executor.id}>`, inline: true },
            { name: "Grund:", value: reason || "Kein Grund angegeben" }
        );

    if (extraFields) embed.addFields(extraFields);

    embed.addFields({
        name: "📅 Datum:",
        value: `<t:${Math.floor(Date.now() / 1000)}:f>`
    });

    embed.setFooter({
        text: `Blackline Bot • ausgeführt von ${executor.username}`,
        iconURL: "https://cdn.discordapp.com/attachments/1486411922084724889/1486418577463705831/BLP_Logo_2.png"
    }).setTimestamp();

    return embed;
}

// ✅ READY
client.once("ready", () => {
    console.log("✅ Blackline Bot online!");
});

// =====================
// INTERACTIONS
// =====================
client.on(Events.InteractionCreate, async interaction => {
    try {
        // -------------------
        // SLASH COMMANDS
        // -------------------
        if (interaction.isChatInputCommand()) {

            // 🔹 PANEL
            if (interaction.commandName === "panel") {
                if (!interaction.member.roles.cache.has(config.modRoleId)) {
                    return interaction.reply({ content: "❌ Keine Berechtigung!", ephemeral: true });
                }

                const menu = new StringSelectMenuBuilder()
                    .setCustomId("aktion_auswahl")
                    .setPlaceholder("Wähle eine Aktion")
                    .addOptions([
                        { label: "Einstellung", value: "einstellung" },
                        { label: "Kündigung", value: "kuendigung" },
                        { label: "Up/Down Rank", value: "updownrank" },
                        { label: "Sanktion", value: "sanktion" }
                    ]);

                return interaction.reply({
                    content: "📋 **Blackline Verwaltung**",
                    components: [new ActionRowBuilder().addComponents(menu)],
                    ephemeral: true
                });
            }

            // 🔹 ABMELDEN
            if (interaction.commandName === "abmelden") {
                const zeitraum = interaction.options.getString("zeitraum");
                const grund = interaction.options.getString("grund");

                const embed = new EmbedBuilder()
                    .setColor("#660909")
                    .setTitle("Neue Abmeldung")
                    .setThumbnail("https://cdn.discordapp.com/attachments/1486411922084724889/1486418576805072916/BLP_Flagge.png")
                    .addFields(
                        { name: "Wer:", value: `<@${interaction.user.id}>`, inline: true },
                        { name: "Zeitraum:", value: zeitraum },
                        { name: "Grund:", value: grund || "Kein Grund angegeben" },
                        { name: "📅 Datum:", value: `<t:${Math.floor(Date.now() / 1000)}:f>` }
                    )
                    .setTimestamp();

                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId(`abmelden_accept_${interaction.user.id}_${zeitraum}_${grund}`)
                        .setLabel("✅ Akzeptieren")
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId(`abmelden_reject_${interaction.user.id}_${zeitraum}_${grund}`)
                        .setLabel("❌ Ablehnen")
                        .setStyle(ButtonStyle.Danger)
                );

                const channel = interaction.guild.channels.cache.get(config.abmeldungModerationChannelId);
                await channel.send({ content: `<@${interaction.user.id}>`, embeds: [embed], components: [row] });

                return interaction.reply({ content: "✅ Abmeldung eingereicht!", ephemeral: true });
            }

            // 🔹 CLEAR
            if (interaction.commandName === "clear") {
                if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
                    return interaction.reply({ content: "❌ Du hast keine Berechtigung!", ephemeral: true });
                }

                const amount = interaction.options.getInteger("anzahl");
                const messages = await interaction.channel.messages.fetch({ limit: amount + 1 });
                await interaction.channel.bulkDelete(messages.filter(m => (Date.now() - m.createdTimestamp) < 14*24*60*60*1000), true);
                return interaction.reply({ content: `✅ ${amount} Nachrichten gelöscht!`, ephemeral: true });
            }
        }

        // -------------------
        // SELECT MENU
        // -------------------
        if (interaction.isStringSelectMenu()) {
            if (interaction.customId === "aktion_auswahl") {
                const aktion = interaction.values[0];
                const userMenu = new UserSelectMenuBuilder()
                    .setCustomId(`select_user_${aktion}`)
                    .setPlaceholder("Wähle Benutzer");

                return interaction.reply({
                    content: `Wähle Benutzer für **${aktion}**`,
                    components: [new ActionRowBuilder().addComponents(userMenu)],
                    ephemeral: true
                });
            }

            if (interaction.customId.startsWith("role_select_")) {
                const userId = interaction.customId.split("_")[2];
                const newRoleId = interaction.values[0];
                const member = await interaction.guild.members.fetch(userId);

                const oldRoles = member.roles.cache.filter(r =>
                    rankRoles.some(rr => rr.id === r.id) && !keepRoles.includes(r.id)
                );
                const oldRole = oldRoles.first();
                for (const role of oldRoles.values()) {
                    await member.roles.remove(role.id).catch(console.error);
                }

                await member.roles.add(newRoleId);

                const modal = new ModalBuilder()
                    .setCustomId(`modal_rank_${userId}_${newRoleId}_${oldRole ? oldRole.id : "none"}`)
                    .setTitle("Rank Änderung");

                modal.addComponents(
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId("reason")
                            .setLabel("Grund")
                            .setStyle(TextInputStyle.Paragraph)
                            .setRequired(true)
                    ),
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId("fromText")
                            .setLabel("Von (optional)")
                            .setStyle(TextInputStyle.Short)
                            .setRequired(false)
                    )
                );

                return interaction.showModal(modal);
            }
        }

        // -------------------
        // USER SELECT
        // -------------------
        if (interaction.isUserSelectMenu()) {
            const aktion = interaction.customId.split("_")[2];
            const user = interaction.users.first();

            if (aktion === "updownrank") {
                const roleMenu = new StringSelectMenuBuilder()
                    .setCustomId(`role_select_${user.id}`)
                    .setPlaceholder("Wähle neuen Rank")
                    .addOptions(rankRoles.map(r => ({ label: r.label, value: r.id })));

                return interaction.reply({
                    content: `Wähle neuen Rank für <@${user.id}>`,
                    components: [new ActionRowBuilder().addComponents(roleMenu)],
                    ephemeral: true
                });
            }

            const modal = new ModalBuilder()
                .setCustomId(`modal_${aktion}_${user.id}`)
                .setTitle(`Aktion: ${aktion}`);

            modal.addComponents(
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId("reason")
                        .setLabel("Grund")
                        .setStyle(TextInputStyle.Paragraph)
                        .setRequired(true)
                ),
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId("fromText")
                        .setLabel("Von (optional)")
                        .setStyle(TextInputStyle.Short)
                        .setRequired(false)
                )
            );

            return interaction.showModal(modal);
        }

        // -------------------
        // MODALS
        // -------------------
        if (interaction.isModalSubmit()) {
            const split = interaction.customId.split("_");
            const type = split[1];
            const userId = split[2];
            const member = await interaction.guild.members.fetch(userId);

            const reason = interaction.fields.getTextInputValue("reason");
            const fromText = interaction.fields.getTextInputValue("fromText");

            let title = "";
            let channelId = config.defaultLogChannelId;
            let extraFields = [];

            if (type === "rank") {
                const newRoleId = split[3];
                const oldRoleId = split[4] === "none" ? null : split[4];
                title = "Rank Änderung";
                channelId = config.rankLogChannelId;

                extraFields.push(
                    { name: "Alter Rang:", value: oldRoleId ? `<@&${oldRoleId}>` : "Kein Rang", inline: true },
                    { name: "Neuer Rang:", value: `<@&${newRoleId}>`, inline: true }
                );
            }

            if (type === "einstellung") {
                title = "Einstellung";
                channelId = config.einstellungLogChannelId;
                for (const roleId of config.einstellungRoles) await member.roles.add(roleId).catch(console.error);
            }

            if (type === "kuendigung") {
                title = "Kündigung";
                channelId = config.kuendigungLogChannelId;

                const rolesToRemove = member.roles.cache.filter(r => r.id !== interaction.guild.id && !keepRoles.includes(r.id));
                for (const role of rolesToRemove.values()) {
                    await member.roles.remove(role.id).catch(console.error);
                }

                await member.roles.add("1487266947178696774"); // Kündigungsrolle
            }

            if (type === "sanktion") {
                title = "Sanktion";
                channelId = config.sanktionLogChannelId;
            }

            const embed = createEmbed({
                title,
                member,
                executor: interaction.user,
                reason,
                extraFields,
                fromText
            });

            const channel = interaction.guild.channels.cache.get(channelId);
            await channel.send({ content: `<@${member.id}>`, embeds: [embed] });
            return interaction.reply({ content: "✅ Aktion ausgeführt!", ephemeral: true });
        }

        // -------------------
        // BUTTONS (ABMELDUNG)
        // -------------------
        if (interaction.isButton()) {
            const [_, action, userId, zeitraum, ...grundParts] = interaction.customId.split("_");
            const grund = grundParts.join("_");
            const member = await interaction.guild.members.fetch(userId);

            if (!interaction.member.roles.cache.has(config.modRoleId)) {
                return interaction.reply({ content: "❌ Keine Berechtigung!", ephemeral: true });
            }

            const abmeldungEmbed = new EmbedBuilder()
                .setColor(action === "accept" ? "#660909" : "#660909")
                .setTitle(action === "accept" ? "Abmeldung akzeptiert" : "Abmeldung abgelehnt")
                .setThumbnail("https://cdn.discordapp.com/attachments/1486411922084724889/1486418576805072916/BLP_Flagge.png")
                .addFields(
                    { name: "Wer:", value: `<@${member.id}>`, inline: true },
                    { name: "Von:", value: `<@${interaction.user.id}>`, inline: true },
                    { name: "Zeitraum:", value: zeitraum },
                    { name: "Grund:", value: grund || "Kein Grund angegeben" },
                    { name: "📅 Datum:", value: `<t:${Math.floor(Date.now() / 1000)}:f>` }
                )
                .setFooter({
                    text: `Blackline Bot • ausgeführt von ${interaction.user.username}`,
                    iconURL: "https://cdn.discordapp.com/attachments/1486411922084724889/1486418577463705831/BLP_Logo_2.png"
                })
                .setTimestamp();

            // DM an Nutzer
            await member.send({ embeds: [abmeldungEmbed] }).catch(() => {});

            if (action === "accept") {
                const publicChannel = interaction.guild.channels.cache.get(config.abmeldungPublicChannelId);
                await publicChannel.send({ content: `<@${member.id}>`, embeds: [abmeldungEmbed] });
                await interaction.update({ content: "✅ Abmeldung akzeptiert und gepostet!", components: [] });
            } else if (action === "reject") {
                await interaction.update({ content: "❌ Abmeldung abgelehnt!", components: [] });
            }
        }

    } catch (err) {
        console.error("Fehler bei Interaction:", err);
    }
});

client.login(process.env.TOKEN);
