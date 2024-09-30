import { moduleID, Settings } from "../../global.js";
import { subMenuWidth, licenseMenuIcon } from "../settings.js";

//Register settings
export function registerSettings() {
    //Menu
    game.settings.registerMenu(moduleID, Settings.gmsMenu, {
        name: "GMS License",
        hint: "Change automation settings for gms license.",
        scope: "client",
        label: "GMS Automation settings",
        icon: licenseMenuIcon,
        type: GmsSubMenu,
    });    
    //Custom Paint Job
    game.settings.register(moduleID, Settings.gmsCustomPaintJobAutomation, {
        name: "Automate Custom Paint Job",
        hint: "Automates rolling, setting HP, and destroying the Custom Paint Job item when triggered.",
        scope: "client",
        config: false,
        type: Boolean,
        default: true,
    });
    game.settings.register(moduleID, Settings.gmsCustomPaintJobStructureAutomation, {
        name: "Automate Custom Paint Job during structure",
        hint: "Prompts to automatically use the Custom Paint Job item when a structure check occurs.",
        scope: "client",
        config: false,
        type: Boolean,
        default: true,
    });    
}

class GmsSubMenu extends FormApplication {
    constructor() {
        super();
    }

    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            template: `modules/${moduleID}/templates/settings/mechs/GmsSubMenu.hbs`,
            title: game.settings.menus.get(moduleID + "." + Settings.gmsMenu).name,
            width: subMenuWidth,
        });
    }

    getData() {
        return {
            gmsSettingsTitle: game.settings.menus.get(moduleID + "." + Settings.gmsMenu).label,

            //Custom Paint Job
            gmsCustomPaintJobAutomationName: game.settings.settings.get(moduleID + "." + Settings.gmsCustomPaintJobAutomation).name,
            gmsCustomPaintJobAutomationHint: game.settings.settings.get(moduleID + "." + Settings.gmsCustomPaintJobAutomation).hint,
            gmsCustomPaintJobAutomation: game.settings.get(moduleID, Settings.gmsCustomPaintJobAutomation),

            gmsCustomPaintJobStructureAutomationName: game.settings.settings.get(moduleID + "." + Settings.gmsCustomPaintJobStructureAutomation).name,
            gmsCustomPaintJobStructureAutomationHint: game.settings.settings.get(moduleID + "." + Settings.gmsCustomPaintJobStructureAutomation).hint,
            gmsCustomPaintJobStructureAutomation: game.settings.get(moduleID, Settings.gmsCustomPaintJobStructureAutomation),            
        }
    }

    async _updateObject(event, formData) {
        //Custom Paint Job
        game.settings.set(moduleID, Settings.gmsCustomPaintJobAutomation, formData.gmsCustomPaintJobAutomation);
        game.settings.set(moduleID, Settings.gmsCustomPaintJobStructureAutomation, formData.gmsCustomPaintJobStructureAutomation);
    }
}