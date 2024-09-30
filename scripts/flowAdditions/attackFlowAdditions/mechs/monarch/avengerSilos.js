import { moduleID, LIDs, Flags, Settings } from "../../../../global.js";
import { addItemOnceToActorByLID, getItemFromActorByLID, removeItemFromActorByLID } from "../../../../automationHelpers/tokenOrActorHelpers.js";
import { addActionResolver, beginAutoHitAllWeaponAttackFlow, hasCritHit, isSpecialWeaponAttackFlow } from "../../attackFlowAdditionHelpers.js";
import { isActiveCombat, isAutomationActive, isRangedAttack, simpleYesNoQuestion } from "../../../../automationHelpers/automationHelpers.js";

/**
 * ====================================
 * Additional attack flow steps
 * ====================================
 */
export async function setAvengerSilosUsedFlags(state, options) {
    if (!state.data) throw new TypeError("Attack flow state missing!");
    if (!state.item) return true;

    if(state.item?.system?.lid === LIDs.monarchAvengerSilos && isActiveCombat(state.actor)) {
        await state.actor.setFlag(moduleID, Flags.monarchAvengerSilosUsed, true);
        await state.actor.setFlag(moduleID, Flags.monarchAvengerSilosRound, game.combat.current.round);
    }
    
    return true;
}

export async function handlePostFlowAvengerSilos(state, options, isContinue) {
    if (!state.data) throw new TypeError("Attack flow state missing!");
    if (!state.item) return;
    
    //Is automation active?
    if(isAutomationActive(Settings.monarchAvengerSilosAutomation, Settings.monarchAvengerSilosOnlyCombat, state.actor)) {
        if(isContinue && !isSpecialWeaponAttackFlow(state) && isRangedAttack(state.item) && hasCritHit(state) && await canUseAvengerSilos(state)) {
            //To give the user the opportunity to later select the order in which to use certain actions!
            addActionResolver(state, "Avenger Silos", useAvengerSilos, canUseAvengerSilos);
        }
    }
}


/**
 * ====================================
 * Helper functions
 * ====================================
 */

/**
 * Starts the avenger silos attack.
 * For internal use only.
 * @param actor The actor for which the attack shall be started!
 */
async function startAvengerSilosIntern(actor) {
    //Check if actor already has item, otherwise add it quickly for this usage and remove later again!
    const item = await addItemOnceToActorByLID(actor, LIDs.monarchAvengerSilos);
    if(item) {
        await beginAutoHitAllWeaponAttackFlow(item, true);
        removeItemFromActorByLID(actor, LIDs.monarchAvengerSilos);
    } else {
        ui.notifications.error("Internal issue, couldn't add item '" + LIDs.monarchAvengerSilos + "' from compendium to actor '" + actor.name + "'");
    }
}

/**
 * Checks if avenger silos can be used!
 * @param state: The current flow state.
 * @returns True if avenger silos can be used, false if not.
 */
async function canUseAvengerSilos(state) {
    const monarchItem = getItemFromActorByLID(state.actor, LIDs.monarchFrame);
    return monarchItem && !state.actor.getFlag(moduleID, Flags.monarchAvengerSilosUsed);
}

/**
 * Asks the user if he wants to use avenger silos and starts them if yes!
 * @param state: The current flow state.
 */
async function useAvengerSilos(state) {
    if(await simpleYesNoQuestion("Avenger Silos", "You have a crit hit!", "Do you want to use Avenger Silos?")) {
        await startAvengerSilosIntern(state.actor);
    }
}

/**
 * Starts the avenger silos attack.
 * For macro usage!
 * @param actor The actor for which the attack shall be started!
 */
export async function startAvengerSilos(actor) {
    //Check if silos can be used!
    const monarchItem = getItemFromActorByLID(actor, LIDs.monarchFrame);
    if(!monarchItem) {
        ui.notifications.warn("Cannot use avenger silos, this mech is not a monarch!");
        return;
    }
    if(actor.getFlag(moduleID, Flags.monarchAvengerSilosUsed) && game.settings.get(moduleID, Settings.monarchAvengerSilosAutomation)) {
        ui.notifications.warn("Cannot use avenger silos, they were already used this round!");
        return;
    }
    startAvengerSilosIntern(actor);
}

/**
 * Cleans up the avenger silo flags.
 * Use in case of issues!
 * @param actor: The actor to clean the flags for.
 */
export async function cleanupAvengerSiloFlags(actor) {
    await actor.unsetFlag(moduleID, Flags.monarchAvengerSilosUsed);
    await actor.unsetFlag(moduleID, Flags.monarchAvengerSilosRound);
}


/**
 * ====================================
 * On combat change (Hook Events)
 * ====================================
 */

/**
 * Cleans up the avenger silos flags on combat changes.
 * Should be called within the updateCombat hook for the gm.
 * @param actor: The actor for which the flags shall be cleaned up.
 * @param currentCombatant: The current turns combatant.
 * @param currentRound: The current round after the change.
 */
export async function onCombatUpdateGM(actor, currentCombatant, currentRound) {
    if(actor?.getFlag(moduleID, Flags.monarchAvengerSilosUsed)) {
        if(actor.getFlag(moduleID, Flags.monarchAvengerSilosRound) < currentRound && actor.uuid === currentCombatant?.actor.uuid) {
            await cleanupAvengerSiloFlags(actor);
        }
    }
}

/**
 * Cleans up the avenger silos flags on combat delete.
 * Should be called within the deleteCombat hook for the gm.
 * @param actor: The actor for which the flags shall be cleaned up.
 */
export async function onCombatDeleteGM(actor) {
    if(actor?.getFlag(moduleID, Flags.monarchAvengerSilosUsed)) {
        await cleanupAvengerSiloFlags(actor);
    }
}