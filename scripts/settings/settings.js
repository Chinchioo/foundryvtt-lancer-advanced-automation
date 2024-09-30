import { moduleID, Settings } from "../global.js";
import { registerSettings as registerCoreBonusSettings } from "./core_bonus/coreBonusSettings.js";
import { registerSettings as registerGmsSettings } from "./mechs/gmsSettings.js";
import { registerSettings as registerMonarchSettings } from "./mechs/monarchSettings.js";
import { registerSettings as registerStormbringerSettings } from "./pilot_talents/stormbringerSettings.js";

export const subMenuWidth = 600;
export const licenseMenuIcon = "fas fa-id-card";
export const talentMenuIcon = "fas fa-award";
export const coreBonusMenuIcon = "fas fa-cogs";
//Just for me!!!!
    //fas fa-user
    //fas fa-id-card
    //far fa-id-card
    //fas fa-wrench
    //fas fa-dice-d20
    //fas fa-award
    //fas fa-cogs

//Register settings
export function registerSettings() {
    //Attack Settings
    game.settings.register(moduleID, Settings.untargetBeforeAttack, {
        name: "Untarget before attacks",
        hint: "Automatically untargets selected tokens before performing attacks.",
        scope: "client",
        config: false,
        type: Boolean,
        default: false,
    });
    game.settings.register(moduleID, Settings.untargetAfterAttack, {
        name: "Untarget after attacks",
        hint: "Automatically untargets selected tokens after performing attacks.",
        scope: "client",
        config: false,
        type: Boolean,
        default: true,
    });
    game.settings.register(moduleID, Settings.removeTemplatesAfterAttack, {
        name: "Remove attack templates",
        hint: "Automatically removes attack templates from the map after performing attacks.",
        scope: "client",
        config: false,
        type: Boolean,
        default: true,
    });
    //Menu
    game.settings.registerMenu(moduleID, Settings.attackMenu, {
        name: "Attack Settings",
        hint: "Change automation settings for attacks.",
        scope: "client",
        label: "Attack Automation settings",
        icon: "fas fa-dice-d20",
        type: AttackSubMenu,
    });

    //Core Bonus Settings
    registerCoreBonusSettings();
    
    //Mech Settings
    registerGmsSettings();
    registerMonarchSettings();

    //Talent Settings
    registerStormbringerSettings();
}

class AttackSubMenu extends FormApplication {
    constructor() {
        super();
    }

    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            template: `modules/${moduleID}/templates/settings/AttackSubMenu.hbs`,
            title: game.settings.menus.get(moduleID + "." + Settings.attackMenu).name,
            width: subMenuWidth,
        });
    }

    getData() {
        return {
            untargetBeforeAttackName: game.settings.settings.get(moduleID + "." + Settings.untargetBeforeAttack).name,
            untargetBeforeAttackHint: game.settings.settings.get(moduleID + "." + Settings.untargetBeforeAttack).hint,
            untargetBeforeAttack: game.settings.get(moduleID, Settings.untargetBeforeAttack),

            untargetAfterAttackName: game.settings.settings.get(moduleID + "." + Settings.untargetAfterAttack).name,
            untargetAfterAttackHint: game.settings.settings.get(moduleID + "." + Settings.untargetAfterAttack).hint,
            untargetAfterAttack: game.settings.get(moduleID, Settings.untargetAfterAttack),

            removeTemplatesAfterAttackName: game.settings.settings.get(moduleID + "." + Settings.removeTemplatesAfterAttack).name,
            removeTemplatesAfterAttackHint: game.settings.settings.get(moduleID + "." + Settings.removeTemplatesAfterAttack).hint,
            removeTemplatesAfterAttack: game.settings.get(moduleID, Settings.removeTemplatesAfterAttack),
        }
    }

    async _updateObject(event, formData) {
        game.settings.set(moduleID, Settings.untargetBeforeAttack, formData.untargetBeforeAttack);
        game.settings.set(moduleID, Settings.untargetAfterAttack, formData.untargetAfterAttack);
        game.settings.set(moduleID, Settings.removeTemplatesAfterAttack, formData.removeTemplatesAfterAttack);
    }
}