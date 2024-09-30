import { moduleID, Settings } from "../../global.js";
import { subMenuWidth, talentMenuIcon } from "../settings.js";

//Register settings
export function registerSettings() {
    //Menu
    game.settings.registerMenu(moduleID, Settings.stormbringerMenu, {
        name: "Stormbringer Talent",
        hint: "Change automation settings for stormbringer talent (Works for normal and MKII version!).",
        scope: "client",
        label: "Stormbringer Automation settings",
        icon: talentMenuIcon,
        type: StormbringerSubMenu,
    });

    //Seismic Deluge
    game.settings.register(moduleID, Settings.stormbringerSeismicDelugeAutomation, {
        name: "Automate Seismic Deluge",
        hint: "Prompts to use Seismic Deluge after an attack if conditions are met, managing the 1/round limit. Only posts the Seismic Deluge chat message!",
        scope: "client",
        config: false,
        type: Boolean,
        default: true,
    });
    game.settings.register(moduleID, Settings.stormbringerSeismicDelugeOnlyCombat, {
        name: "Automate Seismic Deluge only during combat",
        hint: "If Seismic Deluge automation is active, it will only function during active combat.",
        scope: "client",
        config: false,
        type: Boolean,
        default: true,
    });
    //Seismic Deluge
    game.settings.register(moduleID, Settings.stormbringerStormbendingAutomation, {
        name: "Automate Stormbending",
        hint: "Prompts to use Stormbending after an attack if conditions are met, managing the 1/round limit and torrent die counter reducing. Only posts the Stormbending chat message!",
        scope: "client",
        config: false,
        type: Boolean,
        default: true,
    });
    game.settings.register(moduleID, Settings.stormbringerStormbendingOnlyCombat, {
        name: "Automate Stormbending only during combat",
        hint: "If Stormbending automation is active, it will only function during active combat.",
        scope: "client",
        config: false,
        type: Boolean,
        default: true,
    });
    //Torrent
    game.settings.register(moduleID, Settings.stormbringerTorrentAutomateTorrentDie, {
        name: "Automate Torrent Die",
        hint: "Automatically reduces the die with Stormbending usage (if Stormbending automation is active) and resets the die after a massive attack.",
        scope: "client",
        config: false,
        type: Boolean,
        default: true,
    });
    game.settings.register(moduleID, Settings.stormbringerTorrentCheckTorrentDie, {
        name: "Check Torrent Die",
        hint: "Checks if the Torrent Die is at 1 before allowing a massive attack.",
        scope: "client",
        config: false,
        type: Boolean,
        default: true,
    });
    //Torrent MKII
    game.settings.register(moduleID, Settings.stormbringerTorrentMkiiAutomation, {
        name: "Automate Torrent MKII",
        hint: "Prompts to use Torrent after an attack if conditions are met. If disabled, use the provided macro to fire anytime.",
        scope: "client",
        config: false,
        type: Boolean,
        default: true,
    });
    game.settings.register(moduleID, Settings.stormbringerTorrentMkiiOnlyCombat, {
        name: "Automate Torrent MKII only during combat",
        hint: "If Torrent MKII automation is active, it will only function during active combat.",
        scope: "client",
        config: false,
        type: Boolean,
        default: true,
    });    
}

class StormbringerSubMenu extends FormApplication {
    constructor() {
        super();
    }

    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            template: `modules/${moduleID}/templates/settings/pilot_talents/StormbringerSubMenu.hbs`,
            title: game.settings.menus.get(moduleID + "." + Settings.stormbringerMenu).name,
            width: subMenuWidth,
        });
    }

    getData() {
        return {
            stormbringerSettingsTitle: game.settings.menus.get(moduleID + "." + Settings.stormbringerMenu).label,

            //Seismic Deluge
            stormbringerSeismicDelugeAutomationName: game.settings.settings.get(moduleID + "." + Settings.stormbringerSeismicDelugeAutomation).name,
            stormbringerSeismicDelugeAutomationHint: game.settings.settings.get(moduleID + "." + Settings.stormbringerSeismicDelugeAutomation).hint,
            stormbringerSeismicDelugeAutomation: game.settings.get(moduleID, Settings.stormbringerSeismicDelugeAutomation),

            stormbringerSeismicDelugeOnlyCombatName: game.settings.settings.get(moduleID + "." + Settings.stormbringerSeismicDelugeOnlyCombat).name,
            stormbringerSeismicDelugeOnlyCombatHint: game.settings.settings.get(moduleID + "." + Settings.stormbringerSeismicDelugeOnlyCombat).hint,
            stormbringerSeismicDelugeOnlyCombat: game.settings.get(moduleID, Settings.stormbringerSeismicDelugeOnlyCombat),

            //Stormbending
            stormbringerStormbendingAutomationName: game.settings.settings.get(moduleID + "." + Settings.stormbringerStormbendingAutomation).name,
            stormbringerStormbendingAutomationHint: game.settings.settings.get(moduleID + "." + Settings.stormbringerStormbendingAutomation).hint,
            stormbringerStormbendingAutomation: game.settings.get(moduleID, Settings.stormbringerStormbendingAutomation),

            stormbringerStormbendingOnlyCombatName: game.settings.settings.get(moduleID + "." + Settings.stormbringerStormbendingOnlyCombat).name,
            stormbringerStormbendingOnlyCombatHint: game.settings.settings.get(moduleID + "." + Settings.stormbringerStormbendingOnlyCombat).hint,
            stormbringerStormbendingOnlyCombat: game.settings.get(moduleID, Settings.stormbringerStormbendingOnlyCombat),

            //Torrent
            stormbringerTorrentAutomateTorrentDieName: game.settings.settings.get(moduleID + "." + Settings.stormbringerTorrentAutomateTorrentDie).name,
            stormbringerTorrentAutomateTorrentDieHint: game.settings.settings.get(moduleID + "." + Settings.stormbringerTorrentAutomateTorrentDie).hint,
            stormbringerTorrentAutomateTorrentDie: game.settings.get(moduleID, Settings.stormbringerTorrentAutomateTorrentDie),

            stormbringerTorrentCheckTorrentDieName: game.settings.settings.get(moduleID + "." + Settings.stormbringerTorrentCheckTorrentDie).name,
            stormbringerTorrentCheckTorrentDieHint: game.settings.settings.get(moduleID + "." + Settings.stormbringerTorrentCheckTorrentDie).hint,
            stormbringerTorrentCheckTorrentDie: game.settings.get(moduleID, Settings.stormbringerTorrentCheckTorrentDie),

            //Torrent MKII
            stormbringerTorrentMkiiAutomationName: game.settings.settings.get(moduleID + "." + Settings.stormbringerTorrentMkiiAutomation).name,
            stormbringerTorrentMkiiAutomationHint: game.settings.settings.get(moduleID + "." + Settings.stormbringerTorrentMkiiAutomation).hint,
            stormbringerTorrentMkiiAutomation: game.settings.get(moduleID, Settings.stormbringerTorrentMkiiAutomation),

            stormbringerTorrentMkiiOnlyCombatName: game.settings.settings.get(moduleID + "." + Settings.stormbringerTorrentMkiiOnlyCombat).name,
            stormbringerTorrentMkiiOnlyCombatHint: game.settings.settings.get(moduleID + "." + Settings.stormbringerTorrentMkiiOnlyCombat).hint,
            stormbringerTorrentMkiiOnlyCombat: game.settings.get(moduleID, Settings.stormbringerTorrentMkiiOnlyCombat),
        }
    }

    async _updateObject(event, formData) {
        //Seismic Deluge
        game.settings.set(moduleID, Settings.stormbringerSeismicDelugeAutomation, formData.stormbringerSeismicDelugeAutomation);
        game.settings.set(moduleID, Settings.stormbringerSeismicDelugeOnlyCombat, formData.stormbringerSeismicDelugeOnlyCombat);

        //Stormbending
        game.settings.set(moduleID, Settings.stormbringerStormbendingAutomation, formData.stormbringerStormbendingAutomation);
        game.settings.set(moduleID, Settings.stormbringerStormbendingOnlyCombat, formData.stormbringerStormbendingOnlyCombat);

        //Torrent
        game.settings.set(moduleID, Settings.stormbringerTorrentAutomateTorrentDie, formData.stormbringerTorrentAutomateTorrentDie);
        game.settings.set(moduleID, Settings.stormbringerTorrentCheckTorrentDie, formData.stormbringerTorrentCheckTorrentDie);

        //Torrent MKII
        game.settings.set(moduleID, Settings.stormbringerTorrentMkiiAutomation, formData.stormbringerTorrentMkiiAutomation);
        game.settings.set(moduleID, Settings.stormbringerTorrentMkiiOnlyCombat, formData.stormbringerTorrentMkiiOnlyCombat);
    }
}