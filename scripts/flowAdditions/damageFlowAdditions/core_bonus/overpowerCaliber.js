import { DamageTypes, Flags, LIDs, moduleID, Settings } from "../../../global.js";
import { isActiveCombat, isAutomationActive, simpleChatMessage, simpleYesNoQuestion } from "../../../automationHelpers/automationHelpers.js";
import { getItemFromActorByLID } from "../../../automationHelpers/tokenOrActorHelpers.js";
import { addBonusDamageToDamageRoll } from "../../../automationHelpers/bonusDamageHelpers.js";

/**
 * ====================================
 * Additional attack flow steps
 * ====================================
 */
export async function handleOverpowerCaliber(state, options) {
    if (!state.data) throw new TypeError("Attack flow state missing!");
    if (!state.item) return true;
    
    //Is automation active?
    if(isAutomationActive(Settings.coreBonusOverPowerCaliberAutomation, Settings.coreBonusOverPowerCaliberOnlyCombat, state.actor)) {
        //Is valid attack and hasn't been used this round?
        if(!state.actor.getFlag(moduleID, Flags.coreBonusOverpowerCaliberUsed) && state.actor.system.pilot) {
            //Check for overpower caliber item.
            const overpowerCaliberItem = getItemFromActorByLID(state.actor.system.pilot.value, LIDs.overpowerCaliber);
            if(overpowerCaliberItem) {
                if(await simpleYesNoQuestion("Overpower Caliber", overpowerCaliberItem.name, "Do you want to use overpower caliber?")) {
                    let damageType = DamageTypes.variable;
                    if(state.item.system.active_profile.damage.length > 0) {
                        damageType = state.item.system.active_profile.damage[0].type;
                    }
                    
                    await simpleChatMessage(state.actor, "Uses overpower caliber on " + state.item.name);
                    addBonusDamageToDamageRoll(state, damageType, "1d6");
                    state.data.is_overpower_caliber_active = true;
                }
            }
        }
    }

    return true;
}

export async function setOverpowerCaliberUsedFlags(state, options) {
    if (!state.data) throw new TypeError("Attack flow state missing!");

    if(state.data.is_overpower_caliber_active && isActiveCombat(state.actor)) {
        await state.actor.setFlag(moduleID, Flags.coreBonusOverpowerCaliberUsed, true);
        await state.actor.setFlag(moduleID, Flags.coreBonusOverpowerCaliberRound, game.combat.current.round);
    }

    return true;
}


/**
 * ====================================
 * Helper functions
 * ====================================
 */

/**
 * Cleans up the overpower caliber flags.
 * Use in case of issues!
 * @param actor: The actor to clean the flags for.
 */
export async function cleanupOverpowerCaliberFlags(actor) {
    await actor.unsetFlag(moduleID, Flags.coreBonusOverpowerCaliberUsed);
    await actor.unsetFlag(moduleID, Flags.coreBonusOverpowerCaliberRound);
}


/**
 * ====================================
 * On combat change (Hook Events)
 * ====================================
 */

/**
 * Cleans up the overpower caliber flags on combat changes.
 * Should be called within the updateCombat hook for the gm.
 * @param actor: The actor for which the flags shall be cleaned up.
 * @param currentCombatant: The current turns combatant.
 * @param currentRound: The current round after the change.
 */
export async function onCombatUpdateGM(actor, currentCombatant, currentRound) {
    if(actor?.getFlag(moduleID, Flags.coreBonusOverpowerCaliberUsed)) {
        if(actor.getFlag(moduleID, Flags.coreBonusOverpowerCaliberRound) < currentRound && actor.uuid === currentCombatant?.actor.uuid) {
            await cleanupOverpowerCaliberFlags(actor);
        }
    }
}

/**
 * Cleans up the avenger silos flags on combat delete.
 * Should be called within the deleteCombat hook for the gm.
 * @param actor: The actor for which the flags shall be cleaned up.
 */
export async function onCombatDeleteGM(actor) {
    if(actor?.getFlag(moduleID, Flags.coreBonusOverpowerCaliberUsed)) {
        await cleanupOverpowerCaliberFlags(actor);
    }
}