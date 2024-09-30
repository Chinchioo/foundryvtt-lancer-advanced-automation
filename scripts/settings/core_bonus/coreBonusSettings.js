import { moduleID, Settings } from "../../global.js";
import { subMenuWidth, coreBonusMenuIcon } from "../settings.js";

//Register settings
export function registerSettings() {
    //Menu
    game.settings.registerMenu(moduleID, Settings.coreBonusMenu, {
        name: "Core Boni",
        hint: "Change automation settings for core boni.",
        scope: "client",
        label: "Core Bonus Automation settings",
        icon: coreBonusMenuIcon,
        type: CoreBonusSubMenu,
    });    
    //Custom Paint Job
    game.settings.register(moduleID, Settings.coreBonusOverPowerCaliberAutomation, {
        name: "Automate Overpower Caliber",
        hint: "Prompts to use Overpower Caliber during an attack, managing the 1/round limit.",
        scope: "client",
        config: false,
        type: Boolean,
        default: true,
    });
    game.settings.register(moduleID, Settings.coreBonusOverPowerCaliberOnlyCombat, {
        name: "Automate Overpower Caliber only during combat",
        hint: "If Overpower Caliber automation is active, it will only function during active combat.",
        scope: "client",
        config: false,
        type: Boolean,
        default: true,
    });    
}

class CoreBonusSubMenu extends FormApplication {
    constructor() {
        super();
    }

    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            template: `modules/${moduleID}/templates/settings/core_bonus/CoreBonusSubMenu.hbs`,
            title: game.settings.menus.get(moduleID + "." + Settings.coreBonusMenu).name,
            width: subMenuWidth,
        });
    }

    getData() {
        return {
            coreBonusSettingsTitle: game.settings.menus.get(moduleID + "." + Settings.coreBonusMenu).label,

            //Overpower Caliber
            coreBonusOverPowerCaliberAutomationName: game.settings.settings.get(moduleID + "." + Settings.coreBonusOverPowerCaliberAutomation).name,
            coreBonusOverPowerCaliberAutomationHint: game.settings.settings.get(moduleID + "." + Settings.coreBonusOverPowerCaliberAutomation).hint,
            coreBonusOverPowerCaliberAutomation: game.settings.get(moduleID, Settings.coreBonusOverPowerCaliberAutomation),

            coreBonusOverPowerCaliberOnlyCombatName: game.settings.settings.get(moduleID + "." + Settings.coreBonusOverPowerCaliberOnlyCombat).name,
            coreBonusOverPowerCaliberOnlyCombatHint: game.settings.settings.get(moduleID + "." + Settings.coreBonusOverPowerCaliberOnlyCombat).hint,
            coreBonusOverPowerCaliberOnlyCombat: game.settings.get(moduleID, Settings.coreBonusOverPowerCaliberOnlyCombat),            
        }
    }

    async _updateObject(event, formData) {
        //Overpower Caliber
        game.settings.set(moduleID, Settings.coreBonusOverPowerCaliberAutomation, formData.coreBonusOverPowerCaliberAutomation);
        game.settings.set(moduleID, Settings.coreBonusOverPowerCaliberOnlyCombat, formData.coreBonusOverPowerCaliberOnlyCombat);
    }
}