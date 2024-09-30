import { LIDs } from "../../../../global.js";
import { getTagData } from "../../../../automationHelpers/automationHelpers.js";

/**
 * ====================================
 * Additional attack flow steps
 * ====================================
 */
export async function initPinakaMissileAttackData(state, options) {
    if (!state.data) throw new TypeError("Activation flow state missing!");
    if (!state.item) return true;
    
    if(state.item.system.lid === LIDs.pinakaMissile || state.item.system.lid === LIDs.pinakaMissileMkii) {
        ui.notifications.warn("Currently cannot automate pinaka missile functionality with default pinaka missile item! Please use the one from the advanced automation compendium!");
    }
    if(state.item.system.lid === LIDs.pinakaMissileLaa) {
        if(state.data.delayed_attack) {
            state.data.pinaka_missile = { old_damage: state.item.system.active_profile.damage[0].val };
            state.item.system.active_profile.damage[0].val = "3D6";
        }
    }
    if(state.item.system.lid === LIDs.pinakaMissileMkiiLaa) {
        if(state.data.delayed_attack) {
            state.data.pinaka_missile_mkii = { old_tags: state.item.system.active_profile.all_tags };
            state.item.system.active_profile.all_tags.push(await getTagData(LIDs.tags.seeking));
        }
    }
    
    return true;
}

export async function recalculatePinakaMissileSelfHeat(state, options) {
    if (!state.data) throw new TypeError("Activation flow state missing!");
    if (!state.item) return true;
    
    if(state.item.system.lid === LIDs.pinakaMissileLaa || state.item.system.lid === LIDs.pinakaMissileMkiiLaa) {
        //Remove self heat if delayed attack, as heat is already applied during delayed preparation!
        if(state.data.delayed_attack)
            state.data.self_heat = 0;
    }
    
    return true;
}

export async function cleanupPinakaMissileData(state, options, isContinue) {
    if (!state.data) throw new TypeError("Attack flow state missing!");

    if(state.item.system.lid === LIDs.pinakaMissileLaa) {
        if(state.data.pinaka_missile)
            state.item.system.active_profile.damage[0].val = state.data.pinaka_missile.old_damage;
    }
    if(state.item.system.lid === LIDs.pinakaMissileMkiiLaa) {
        if(state.data.pinaka_missile_mkii)
            state.item.system.active_profile.all_tags = state.data.pinaka_missile_mkii.old_tags;
    }
}