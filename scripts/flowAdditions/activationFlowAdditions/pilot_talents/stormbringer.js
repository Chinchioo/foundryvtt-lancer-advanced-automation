import { LIDs, moduleID, Settings } from "../../../global.js";
import { addItemOnceToActorByLID, removeItemFromActorByLID } from "../../../automationHelpers/tokenOrActorHelpers.js";
import { beginAutoHitAllWeaponAttackFlow } from "../../attackFlowAdditions/attackFlowAdditionHelpers.js";

/**
 * ====================================
 * Additional activation flow steps
 * ====================================
 */
export async function handleStormbringerActivation(state, options) {
    if (!state.data) throw new TypeError("Activation flow state missing!");
    if (!state.item) return true;

    if(state.item.system.lid === LIDs.stormbringer && state.item.system.curr_rank === 3 && state.item.system.ranks[2]) {
        const mechActor = state.actor.system.active_mech.value;
        if(mechActor) {
            //Check torrent die before attack?
            if(game.settings.get(moduleID, Settings.stormbringerTorrentCheckTorrentDie)) {
                const counter = state.item.system.ranks[2].counters.find((c) => c.lid === LIDs.stormbringerCounter);
                if(counter) {
                    if(counter.value === counter.min) {
                        //Do not await, to not block this flow and start attack simultaneously!
                        doTorrentMassiveAttack(mechActor);
                    } else {
                        ui.notifications.warn("Stormbringer torrent attack cannot be done! Counter value is at " + counter.value + "! Needs to be " + counter.min + "!");
                        return false;
                    }
                } else {
                    ui.notifications.warn("Cannot automate stormbringer torrent attack, couldn't find counter with LID:'" + LIDs.stormbringerCounter + "' on the stormbringer item!");
                }
            } else {
                //Do not await, to not block this flow and start attack simultaneously!
                doTorrentMassiveAttack(mechActor);                
            }
        } else {
            ui.notifications.warn("Cannot automate stormbringer torrent attack, pilot has no active mech!");
        }
    }

    return true;
}


/**
 * ====================================
 * Helper functions
 * ====================================
 */

/**
 * Starts the torrent massive attack!
 * @param mechActor: Actor of type mech for which the attack shall be started!
 */
async function doTorrentMassiveAttack(mechActor) {
    //Check if actor already has item, otherwise add it quickly for this usage and remove later again!
    const item = await addItemOnceToActorByLID(mechActor, LIDs.stormbringerTorrent);
    if(item) {
        await beginAutoHitAllWeaponAttackFlow(item, true);
        removeItemFromActorByLID(mechActor, LIDs.stormbringerTorrent);
        //Resetting counter is done after attack flow!
    } else {
        ui.notifications.error("Internal issue, couldn't add item '" + LIDs.stormbringerTorrent + "' from compendium to actor '" + mechActor.name + "'");
    }
}