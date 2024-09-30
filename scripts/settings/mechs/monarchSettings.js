import { moduleID, Settings } from "../../global.js";
import { subMenuWidth, licenseMenuIcon } from "../settings.js";

//Register settings
export function registerSettings() {
    //Menu
    game.settings.registerMenu(moduleID, Settings.monarchMenu, {
        name: "Monarch License",
        hint: "Change automation settings for monarch license.",
        scope: "client",
        label: "Monarch Automation settings",
        icon: licenseMenuIcon,
        type: MonarchSubMenu,
    });
    
    //Avenger silos
    game.settings.register(moduleID, Settings.monarchAvengerSilosAutomation, {
        name: "Automate Avenger Silos",
        hint: "Prompts to use Avenger Silos after an attack if conditions are met, managing the 1/round limit. If disabled, use the provided macro to fire anytime.",
        scope: "client",
        config: false,
        type: Boolean,
        default: true,
    });
    game.settings.register(moduleID, Settings.monarchAvengerSilosOnlyCombat, {
        name: "Automate Avenger Silos only during combat",
        hint: "If Avenger Silos automation is active, it will only function during active combat.",
        scope: "client",
        config: false,
        type: Boolean,
        default: true,
    });
    //Tlaloc
    game.settings.register(moduleID, Settings.monarchTlalocAutomation, {
        name: "Automate Tlaloc",
        hint: "Automatically prompts for rerolls after missed attacks and deactivates at the start of the next turn.",
        scope: "client",
        config: false,
        type: Boolean,
        default: true,
    });
    game.settings.register(moduleID, Settings.monarchTlalocOnlyCombat, {
        name: "Automate Tlaloc only during combat",
        hint: "If Tlaloc automation is active, it will only function during active combat.",
        scope: "client",
        config: false,
        type: Boolean,
        default: true,
    });
    //Pinaka Missile
    game.settings.register(moduleID, Settings.monarchPinakaMissileDelayedAutomation, {
        name: "Automate Pinaka Missile delayed attacks",
        hint: "Automates the delayed attack feature. If disabled, you can manually place templates and trigger attacks by using the weapon as normal.",
        scope: "client",
        config: false,
        type: Boolean,
        default: true,
    });
    game.settings.register(moduleID, Settings.monarchPinakaMissileDelayedTemplateImage, {
        name: "Pinaka Missile template image",
        hint: "Select an image/gif/video to show on the delayed pinaka attack templates.",
        scope: "client",
        config: false,
        type: String,
        filePicker: "imagevideo",
        default: "",
    });    
}

class MonarchSubMenu extends FormApplication {
    constructor() {
        super();
    }

    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            template: `modules/${moduleID}/templates/settings/mechs/MonarchSubMenu.hbs`,
            title: game.settings.menus.get(moduleID + "." + Settings.monarchMenu).name,
            width: subMenuWidth,
        });
    }
    
    getData() {
        return {
            monarchSettingsTitle: game.settings.menus.get(moduleID + "." + Settings.monarchMenu).label,

            //Avenger Silos
            monarchAvengerSilosAutomationName: game.settings.settings.get(moduleID + "." + Settings.monarchAvengerSilosAutomation).name,
            monarchAvengerSilosAutomationHint: game.settings.settings.get(moduleID + "." + Settings.monarchAvengerSilosAutomation).hint,
            monarchAvengerSilosAutomation: game.settings.get(moduleID, Settings.monarchAvengerSilosAutomation),

            monarchAvengerSilosOnlyCombatName: game.settings.settings.get(moduleID + "." + Settings.monarchAvengerSilosOnlyCombat).name,
            monarchAvengerSilosOnlyCombatHint: game.settings.settings.get(moduleID + "." + Settings.monarchAvengerSilosOnlyCombat).hint,
            monarchAvengerSilosOnlyCombat: game.settings.get(moduleID, Settings.monarchAvengerSilosOnlyCombat),


            //Tlaloc
            monarchTlalocAutomationName: game.settings.settings.get(moduleID + "." + Settings.monarchTlalocAutomation).name,
            monarchTlalocAutomationHint: game.settings.settings.get(moduleID + "." + Settings.monarchTlalocAutomation).hint,
            monarchTlalocAutomation: game.settings.get(moduleID, Settings.monarchTlalocAutomation),

            monarchTlalocOnlyCombatName: game.settings.settings.get(moduleID + "." + Settings.monarchTlalocOnlyCombat).name,
            monarchTlalocOnlyCombatHint: game.settings.settings.get(moduleID + "." + Settings.monarchTlalocOnlyCombat).hint,
            monarchTlalocOnlyCombat: game.settings.get(moduleID, Settings.monarchTlalocOnlyCombat),


            //Pinaka Missiles
            monarchPinakaMissileDelayedAutomationName: game.settings.settings.get(moduleID + "." + Settings.monarchPinakaMissileDelayedAutomation).name,
            monarchPinakaMissileDelayedAutomationHint: game.settings.settings.get(moduleID + "." + Settings.monarchPinakaMissileDelayedAutomation).hint,
            monarchPinakaMissileDelayedAutomation: game.settings.get(moduleID, Settings.monarchPinakaMissileDelayedAutomation),

            monarchPinakaMissileDelayedTemplateImageName: game.settings.settings.get(moduleID + "." + Settings.monarchPinakaMissileDelayedTemplateImage).name,
            monarchPinakaMissileDelayedTemplateImageHint: game.settings.settings.get(moduleID + "." + Settings.monarchPinakaMissileDelayedTemplateImage).hint,
            monarchPinakaMissileDelayedTemplateImageFilePickerType: game.settings.settings.get(moduleID + "." + Settings.monarchPinakaMissileDelayedTemplateImage).filePicker,
            monarchPinakaMissileDelayedTemplateImage: game.settings.get(moduleID, Settings.monarchPinakaMissileDelayedTemplateImage),
        }
    }

    activateListeners(html) {
        super.activateListeners(html);

        const buttonElement = html.find('[name="monarchPinakaMissileDelayedTemplateImageFilePicker"]')[0];
        FilePicker.fromButton(buttonElement);
    }

    async _updateObject(event, formData) {
        //Avenger Silos
        game.settings.set(moduleID, Settings.monarchAvengerSilosAutomation, formData.monarchAvengerSilosAutomation);
        game.settings.set(moduleID, Settings.monarchAvengerSilosOnlyCombat, formData.monarchAvengerSilosDuringCombat);

        //Tlaloc
        game.settings.set(moduleID, Settings.monarchTlalocAutomation, formData.monarchTlalocAutomation);
        game.settings.set(moduleID, Settings.monarchTlalocOnlyCombat, formData.monarchTlalocOnlyCombat);

        //Pinaka Missiles
        game.settings.set(moduleID, Settings.monarchPinakaMissileDelayedAutomation, formData.monarchPinakaMissileDelayedAutomation);
        game.settings.set(moduleID, Settings.monarchPinakaMissileDelayedTemplateImage, formData.monarchPinakaMissileDelayedTemplateImage);
    }
}