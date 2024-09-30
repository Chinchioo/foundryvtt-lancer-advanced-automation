import { moduleID, LIDs, Flags, Settings } from "../../../../global.js";
import { isActiveCombat } from "../../../../automationHelpers/automationHelpers.js";

/**
 * ====================================
 * Stop tlaloc
 * ====================================
 */

/**
 * Cleans up the tlaloc flags.
 * @param actor: The actor for which the flags shall be cleaned up.
 */
async function resetTlalocFlags(actor) {
    await actor?.unsetFlag(moduleID, Flags.tlalocClassNhpActive);
    await actor?.unsetFlag(moduleID, Flags.tlalocClassNhpRound);
}

/**
 * Stops an active tlaloc protocol on the actor. (If automation is deactivated...)
 * @param actor: The actor for which the protocol shall be stopped.
 */
export async function stopTlalocProtocol(actor) {
    if(actor?.getFlag(moduleID, Flags.tlalocClassNhpActive)) {
        await resetTlalocFlags(actor);

        //Chat Data
        const chatData = {
            type: CONST.CHAT_MESSAGE_TYPES.EMOTE,
            speaker: ChatMessage.getSpeaker({token: actor, alias: actor?.token?.name}),
            content: "Stopped tlaloc protocol!",
            emote: true,
        }
        ChatMessage.create(chatData);
    } else {
        ui.notifications.warn("Tlaloc is not active and can therefore not be stopped!");
    }
}


/**
 * ====================================
 * Additional activation flow steps
 * ====================================
 */
export async function handleTlalocActivation(state, options) {
    if (!state.data) throw new TypeError("Activation flow state missing!");
    if (!state.item) return true;

    if(game.settings.get(moduleID, Settings.monarchTlalocAutomation) && (state.item.system.lid === LIDs.tlalocClassNhp || state.item.system.lid === LIDs.tlalocClassNhpMkii)) {
        if(state.actor.getFlag(moduleID, Flags.tlalocClassNhpActive)) {
            ui.notifications.warn("Tlaloc already active on this actor! Multiple activations aren't possible!");
            //Set flag to skip reseting tlaloc flags!!
            state.data.tlalocAlreadyActive = true;
            return false;
        }
        if(!isActiveCombat(state.actor)) {
            if(game.settings.get(moduleID, Settings.monarchTlalocOnlyCombat)) {
                ui.notifications.warn("Tlaloc automation deactivated outside of combat!");
                return false;
            }
            ui.notifications.warn("Actor is not in active combat, please remember to stop tlaloc yourself with the macro!");
        }

        await state.actor.setFlag(moduleID, Flags.tlalocClassNhpActive, true);
        await state.actor.setFlag(moduleID, Flags.tlalocClassNhpRound, isActiveCombat(state.actor) ? game.combat.current.round : -1);
    }
    
    return true;
}

/**
 * ====================================
 * Additional post attack flow steps
 * ====================================
 */ 
export async function cleanupTlalocActivation(state, options, isContinue) {
    if (!state.data) throw new TypeError("Activation flow state missing!");
    if (!state.item) return true;

    if(state.item.system.lid === LIDs.tlalocClassNhp || state.item.system.lid === LIDs.tlalocClassNhpMkii) {
        if(!isContinue && !state.data.tlalocAlreadyActive) {
            await resetTlalocFlags(state.actor);
        }
    }
    
    return true;
}


/**
 * ====================================
 * On combat change (Hook Events)
 * ====================================
 */

/**
 * Cleans up the tlaloc flags on combat changes.
 * Should be called within the updateCombat hook for the gm.
 * @param actor: The actor for which the flags shall be cleaned up.
 * @param currentCombatant: The current turns combatant.
 * @param currentRound: The current round after the change.
 */
export async function onCombatUpdateGM(actor, currentCombatant, currentRound) {
    if(actor?.getFlag(moduleID, Flags.tlalocClassNhpActive)) {
        if(actor.getFlag(moduleID, Flags.tlalocClassNhpRound) < currentRound && actor.uuid === currentCombatant?.actor.uuid)
            await stopTlalocProtocol(actor);
    }
}

/**
 * Cleans up the tlaloc flags on combat delete.
 * Should be called within the deleteCombat hook for the gm.
 * @param actor: The actor for which the flags shall be cleaned up.
 */
export async function onCombatDeleteGM(actor) {
    if(actor?.getFlag(moduleID, Flags.tlalocClassNhpActive)) {
        await stopTlalocProtocol(actor);
    }
}