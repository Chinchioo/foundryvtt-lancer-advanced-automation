import { moduleID, LIDs, Flags, Settings } from "../../../global.js";
import { getItemFromActorByLID } from "../../../automationHelpers/tokenOrActorHelpers.js";
import { beginRerollAttackFlow, beginRerollWeaponAttackFlow, isRerollAttack } from "../../../automationHelpers/rerollAttackHelpers.js";
import { isActiveCombat, simpleChatMessage, simpleYesNoQuestion } from "../../../automationHelpers/automationHelpers.js";
import { addActionResolver, isSpecialWeaponAttackFlow } from "../../../flowAdditions/attackFlowAdditions/attackFlowAdditionHelpers.js";

/**
 * ====================================
 * Additional activation flow steps
 * ====================================
 */

/**
 * Activation flow step to handle tlaloc system activation. Sets flag to later use during attack flow for automated reroll.
 * @param state Flow state from the current flow.
 * @param options Flow options from the current flow.
 * @returns True if the flow shall go on, false if the flow has been canceled. 
 */
export async function handleTlalocActivation(state, options) {
    if (!state.data) throw new TypeError("Activation flow state missing!");
    if (!state.item) return true;

    if(game.settings.get(moduleID, Settings.monarchTlalocAutomation) && (state.item.system.lid === LIDs.tlalocClassNhp || state.item.system.lid === LIDs.tlalocClassNhpMkii)) {
        if(state.actor.getFlag(moduleID, Flags.tlalocClassNhpActive)) {
            ui.notifications.warn("Tlaloc already active on this actor! Multiple activations aren't possible!");
            //Set flag to skip reseting tlaloc flags!!
            state.data.laa.tlalocAlreadyActive = true;
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
 * Additional post activation flow steps
 * ====================================
 */ 

/**
 * Post activation flow step to cleanup tlaloc activation data.
 * @param state Flow state from the current flow.
 * @param options Flow options from the current flow. 
 * @param isContinue Used to determine if the current flow has been canceled or not.
 */
export async function cleanupTlalocActivation(state, options, isContinue) {
    if (!state.data) throw new TypeError("Activation flow state missing!");
    if (!state.item) return true;

    if(state.item.system.lid === LIDs.tlalocClassNhp || state.item.system.lid === LIDs.tlalocClassNhpMkii) {
        if(!isContinue && !state.data.laa.tlalocAlreadyActive) {
            await resetTlalocFlags(state.actor);
        }
    }
    
    return true;
}


/**
 * ====================================
 * Additional attack flow steps
 * ====================================
 */

/**
 * Post attack flow step to handle tlaloc rerolls if it has been active for this attack flow and meets tlaloc conditions.
 * @param state Flow state from the current flow.
 * @param options Flow options from the current flow. 
 * @param isContinue Used to determine if the current flow has been canceled or not.
 */
export async function handlePostFlowTlaloc(state, options, isContinue) {
    if (!state.data) throw new TypeError("Attack flow state missing!");

    if(isContinue && !isRerollAttack(state) && !isSpecialWeaponAttackFlow(state)) {
        let tlalocItem;
        //Setup function to check tlaloc item and also fill the item for later usage.
        const canUseTlaloc = async (state) => {
            if(state.actor.getFlag(moduleID, Flags.tlalocClassNhpActive)) {
                let didMiss = false;
                for(const hit_result of state.data.hit_results) {
                    if(!hit_result.hit)
                        didMiss = true;
                }
                if(didMiss) {
                    tlalocItem = getItemFromActorByLID(state.actor, LIDs.tlalocClassNhp);
                    if(!tlalocItem) //Maybe Mkii?
                        tlalocItem = getItemFromActorByLID(state.actor, LIDs.tlalocClassNhpMkii);
                    return tlalocItem ? true : false;
                }
            }            
        };
        if(await canUseTlaloc(state)) {
            //To give the user the opportunity to later select the order in which to use certain actions!
            addActionResolver(state, tlalocItem.name, 
                async (state) => {
                    //Ask user if tlaloc shall be used.  
                    if(await simpleYesNoQuestion(tlalocItem.name, "Found some missed attacks!", "Do you want to use " + tlalocItem.name + " to reroll some missed attacks?")) {
                        //Seems to be annoying to post the card!!
                        //game.lancer.beginItemChatFlow(tlalocItem, {"itemId": tlalocItem.id,"uuid": tlalocItem.uuid});
                        await simpleChatMessage(state.actor, "Rerolls last attack with " + tlalocItem.name);

                        //Check if basic or weapon attack flow
                        if(state.data.type === "attack")
                            await beginRerollAttackFlow(state.actor, state.data.laa.temp.attack_results, state.data.laa.temp.hit_results, state.data.laa.temp.targets);
                        else if(state.data.type === "weapon")
                            await beginRerollWeaponAttackFlow(state.item, state.data.laa.temp.attack_results, state.data.laa.temp.hit_results, state.data.laa.temp.targets);
                    } 
                }, canUseTlaloc);            
        }
    }
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