export const moduleID = "lancer-advanced-automation";

export const itemCompendiumID = moduleID + ".laa-items";
export const macroCompendiumID =  moduleID + ".laa-macros";

/**
 * ====================================
 * Flow classes
 * ====================================
 */
export let activationFlowClass = null;
export function setActivationFlowClass(c) {
    activationFlowClass = c;
}

export let basicAttackFlowClass = null;
export function setBasicAttackFlowClass(c) {
    basicAttackFlowClass = c;
}

export let weaponAttackFlowClass = null;
export function setWeaponAttackFlowClass(c) {
    weaponAttackFlowClass = c;
}

export let systemFlowClass = null;
export function setSystemFlowClass(c) {
    systemFlowClass = c;
}

/**
 * ====================================
 * Enums
 * ====================================
 */
export const DamageTypes = {
    explosive: "Explosive",
    kinetic: "Kinetic",
    energy: "Energy",
    heat: "Heat",
    variable: "Variable", 
}

export const WeaponTypes = {
    launcher: "Launcher",
}

export const WeaponRanges = {
    range: "Range",
    blas: "Blast",
}

export const WeaponSizes = {
    aux: "Auxiliary",
    main: "Main",
    heavy: "Heavy",
    superheavy: "Superheavy",
}

export const LIDs = {
    //GMS
    customPaintJob: "ms_custom_paint_job",
    overpowerCaliber: "cb_overpower_caliber",

    //Monarch
    monarchFrame: "mf_monarch",
    monarchDivinePunishment: "laa_monarch_divine_punishment",
    monarchAvengerSilos: "laa_monarch_avenger_silos",
    //Tlaloc
    tlalocClassNhp: "l_tlaloc_class_nhp",
    tlalocClassNhpMkii: "lmkii_tlaloc_class_nhp_mk_two",
    //Pinaka missiles
    pinakaMissile: "mw_pinaka_missiles",
    pinakaMissileMkii: "lmkii_pinaka_missiles_mk_two",
    pinakaMissileLaa: "laa_pinaka_missiles",
    pinakaMissileLaaDelayedAttack: "laa_pinaka_missiles_delayed_attack",
    pinakaMissileMkiiLaa: "laa_pinaka_missiles_mk_two",
    pinakaMissileMkiiLaaSwapHead: "laa_pinaka_missiles_mk_two_swap_modular_head",
    pinakaMissileMkiiLaaDelayedAttack: "laa_pinaka_missiles_mk_two_delayed_attack",

    //Stormbringer
    stormbringer: "t_stormbringer",
    stormbringerCounter: "ctr_stormbringer",
    stormbringerTorrent: "laa_stormbringer_torrent",
    stormbringerMkii: "lmkii_stormbringer_mk_ii",
    stormbringerMkiiTorrent: "laa_stormbringer_mk_ii_torrent",

    //Tags
    tags: {
        seeking: "tg_seeking",
    },

    //Custom shit
    tagItem: "laa_give_me_tags",
}

export const Flags = {
    //Attack flow
    attackFlow:             "attackFlow",
    attackFlowRunning:      "attackFlow.running",
    attackFlowTemplates:    "attackFlow.templates",
    attackFlowDamages:      "attackFlow.damage",
    attackFlowDamageTypes:  "attackFlow.damageTypes",

    //Delayed attacks
    delayedAttacks:         "delayedAttacks",

    //Core Bonus
    coreBonus:                      "coreBonus",
    //Overpower Caliber
    coreBonusOverpowerCaliber:      "coreBonus.overpowerCaliber",
    coreBonusOverpowerCaliberUsed:  "coreBonus.overpowerCaliber.used",
    coreBonusOverpowerCaliberRound: "coreBonus.overpowerCaliber.round",

    //Monarch
    monarch:                    "monarch",
    //AvengerSilos
    monarchAvengerSilos:        "monarch.avengerSilos",
    monarchAvengerSilosUsed:    "monarch.avengerSilos.used",
    monarchAvengerSilosRound:   "monarch.avengerSilos.round",
    //Tlaloc
    tlalocClassNhp:             "tlaloc",
    tlalocClassNhpActive:       "tlaloc.active",
    tlalocClassNhpRound:        "tlaloc.round",    

    //Stormbringer
    stormbringer:                   "stormbringer",
    stormbringerSeismicDeluge:      "stormbringer.seismicDeluge",
    stormbringerSeismicDelugeUsed:  "stormbringer.seismicDeluge.used",
    stormbringerSeismicDelugeRound: "stormbringer.seismicDeluge.round",
    stormbringerStormbending:       "stormbringer.stormbending",
    stormbringerStormbendingUsed:   "stormbringer.stormbending.used",
    stormbringerStormbendingRound:  "stormbringer.stormbending.round",

    //Hook Events
    hookEvent:              "hookEvents",
    hookEventCombatUpdate:  "hookEvents.combatUpdate",
}

export const Settings = {
    //Attack settings
    attackMenu: "attackMenu",
    untargetBeforeAttack: "untargetBeforeAttack",
    untargetAfterAttack: "untargetAfterAttack",
    removeTemplatesAfterAttack: "removeTemplatesAfterAttack",

    //Core Bonus settings
    coreBonusMenu: "coreBonusMenu",
    //Overpower Caliber
    coreBonusOverPowerCaliberAutomation: "coreBonusOverPowerCaliberAutomation",
    coreBonusOverPowerCaliberOnlyCombat: "coreBonusOverPowerCaliberOnlyCombat",

    //GMS License settings
    gmsMenu: "gmsMenu",
    //Custom Paint Job
    gmsCustomPaintJobAutomation: "gmsCustomPaintJobAutomation",
    gmsCustomPaintJobStructureAutomation: "gmsCustomPaintJobStructureAutomation",

    //Monarch License settings
    monarchMenu: "monarchMenu",
    //Avenger Silos
    monarchAvengerSilosAutomation: "monarchAvengerSilosAutomation",
    monarchAvengerSilosOnlyCombat: "monarchAvengerSilosOnlyCombat",
    //Divine Punishment
    monarchDivinePunishmentAutomation: "monarchDivinePunishmentAutomation",
    monarchDivinePunishmentOnlyCombat: "monarchDivinePunishmentOnlyCombat",
    //Tlaloc
    monarchTlalocAutomation: "monarchTlalocAutomation",
    monarchTlalocOnlyCombat: "monarchTlalocOnlyCombat",
    //Pinaka
    monarchPinakaMissileDelayedAutomation:      "monarchPinakaMissileDelayedAutomation",
    monarchPinakaMissileDelayedTemplateImage:   "monarchPinakaMissileDelayedTemplateImage",
    
    //Stormbringer Pilot Talent settings
    stormbringerMenu:                           "stormbringerMenu",
    //Seismic Deluge    
    stormbringerSeismicDelugeAutomation:        "stormbringerSeismicDelugeAutomation",
    stormbringerSeismicDelugeOnlyCombat:        "stormbringerSeismicDelugeOnlyCombat",
    //Stormbending  
    stormbringerStormbendingAutomation:         "stormbringerStormbendingAutomation",
    stormbringerStormbendingOnlyCombat:         "stormbringerStormbendingOnlyCombat",
    //Torrent
    stormbringerTorrentMassiveAttackAutomation: "stormbringerTorrentAutomation",
    stormbringerTorrentMassiveAttackOnlyCombat: "stormbringerTorrentOnlyCombat",
    stormbringerTorrentAutomateTorrentDie:      "stormbringerTorrentAutomateTorrentDie",
    stormbringerTorrentCheckTorrentDie:         "stormbringerTorrentCheckTorrentDie",
    //Torrent MKII  
    stormbringerTorrentMkiiAutomation:          "stormbringerTorrentMkiiAutomation",
    stormbringerTorrentMkiiOnlyCombat:          "stormbringerTorrentMkiiOnlyCombat",
}

export const Conditions = {
    immobilized: "immobilized",
}


/**
 * ====================================
 * Hook event flags
 * 
 * Used for certain functionality to trigger some hook events on actors.
 * Hook event data is stored as an array.
 * ====================================
 */
/**
 * Removes all hook event data, shall only be used if you encounter issues and want to reset!
 */
export async function cleanupHookEventData() {
    await game.user.unsetFlag(moduleID, hookEventCombatUpdateFlag);
}
/**
 * Stores hook event data in the given hook event flag array on the current user.
 * @param hookEventFlag: The flag on which you want to store the hook event data.
 * @param actorUuid: Uuid for the actor used in this event.
 * @param requestor: A string identifier for the system requesting this hook event (e.g. tlaloc if the tlaloc system requested this event).
 * @param customData: A custom data structure which the requestor needs for further processing.
 */
export async function addHookEventData(hookEventFlag, actorUuid, requestor, customData) {
    let hookEventData = getHookEventDataArray(hookEventFlag);
    hookEventData.push({
        actorUuid: actorUuid,
        requestor: requestor,
        customData: customData,
    });
    await updateHookEventData(hookEventFlag, hookEventData);
}
/**
 * Removes the first added hook event data for given requestor and actor.
 * @param hookEventFlag: The flag for which the hook event data shall be removed.
 * @param actorUuid: The actorUuid for which the hook event data shall be removed.
 * @param requestor: The requestor for which the hook event data shall be removed.
 * @param customDataFunction: A function to additionally use custom data for finding the hook event data to delete.
 */
export async function removeHookEventData(hookEventFlag, actorUuid, requestor, customDataFunction) {
    let hookEventData = getHookEventDataArray(hookEventFlag);
    const removeEventIndex = hookEventData.findIndex((data) => {
        return data.actorUuid === actorUuid && data.requestor === requestor && (customDataFunction ? customDataFunction(data.customData) : true);
    });
    if(removeEventIndex >= 0)
        hookEventData.splice(removeEventIndex, 1);
    await updateHookEventData(hookEventFlag, hookEventData);
}
/**
 * Removes the last added hook event data for given requestor and actor. (Mainly used for cleanup during canceled flows).
 * @param hookEventFlag: The flag for which the hook event data shall be removed.
 * @param actorUuid: The actorUuid for which the hook event data shall be removed.
 * @param requestor: The requestor for which the hook event data shall be removed.
 * @param customDataFunction: A function to additionally use custom data for finding the hook event data to delete.
 */
export async function removeLastAddedHookEventData(hookEventFlag, actorUuid, requestor, customDataFunction) {
    let hookEventData = getHookEventDataArray(hookEventFlag);
    const removeEventIndex = hookEventData.findLastIndex((data) => {
        return data.actorUuid === actorUuid && data.requestor === requestor && (customDataFunction ? customDataFunction(data.customData) : true);
    });
    if(removeEventIndex)
        hookEventData.splice(removeEventIndex, 1);
    await updateHookEventData(hookEventFlag, hookEventData);
}
export function getHookEventDataArray(hookEventFlag) {
    return game.user.getFlag(moduleID, hookEventFlag) ?? [];
}
/**
 * Updates hook event data flag with given data.
 * @param hookEventFlag: The flag for which the hook event data shall be updated.
 * @param newHookEventArray: The new array to update hook event data to.
 */
async function updateHookEventData(hookEventFlag, newHookEventArray) {
    await game.user.setFlag(moduleID, hookEventFlag, newHookEventArray);
}