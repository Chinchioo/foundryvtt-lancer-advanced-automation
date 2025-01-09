import { moduleID, Settings } from "../../global.js";
import { subMenuWidth, licenseMenuIcon } from "../settings.js";

/**
 * Registers setting entries.
 */
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
}

/**
 * Form application for gms sub menu within settings.
 */
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
        }
    }

    async _updateObject(event, formData) {
    }
}