import { LIDs, moduleID, Settings } from "../../../global.js";
import { addItemOnceToActorByLID, getItemFromActorByLID, removeItemFromActorByLID } from "../../../automationHelpers/tokenOrActorHelpers.js";
import { beginAutoHitAllWeaponAttackFlow } from "../../attackFlowAdditions/attackFlowAdditionHelpers.js";
import { isAutomationActive } from "../../../automationHelpers/automationHelpers.js";

/**
 * ====================================
 * Additional activation flow steps
 * ====================================
 */
export async function handleStormbringerActivation(state, options) {
    if (!state.data) throw new TypeError("Activation flow state missing!");
    if (!state.item) return true;

    if(isAutomationActive(Settings.stormbringerTorrentMassiveAttackAutomation, Settings.stormbringerTorrentMassiveAttackOnlyCombat, state.actor)) {
        if(state.item.system.lid === LIDs.stormbringer && state.item.system.curr_rank === 3 && state.item.system.ranks[2]) {
            const mechActor = state.actor.system.active_mech.value;
            if(mechActor) {
                if(checkTorrentDie(state.item))
                    //Do not await, to not block this flow and start attack simultaneously!
                    startTorrentMassiveAttackIntern(mechActor);
                else
                    return false;
            } else {
                ui.notifications.warn("Cannot automate stormbringer torrent attack, pilot has no active mech!");
            }
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
 * Starts the torrent massive attack feature.
 * For internal use only.
 * @param mechActor: Actor of type mech for which the attack shall be started!
 */
async function startTorrentMassiveAttackIntern(mechActor) {
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

/**
 * Checks if torrent die is valid to use massive attack.
 * @param stormbringerItem: The stormbringer talent item to check torrent die for.
 * @returns true if the torrent die is valdi to use massive attack, false if not valid to use.
 */
function checkTorrentDie(stormbringerItem) {
    //Check torrent die before attack?
    if(game.settings.get(moduleID, Settings.stormbringerTorrentCheckTorrentDie)) {
        const counter = stormbringerItem.system.ranks[2].counters.find((c) => c.lid === LIDs.stormbringerCounter);
        if(counter) {
            if(counter.value === counter.min) {
                return true;
            } else {
                ui.notifications.warn("Stormbringer torrent attack cannot be done! Counter value is at " + counter.value + "! Needs to be " + counter.min + "!");
                return false;
            }
        } else {
            ui.notifications.warn("Cannot automate stormbringer torrent attack, couldn't find counter with LID:'" + LIDs.stormbringerCounter + "' on the stormbringer item!");
            return false;
        }
    } else {
        return true;              
    }
}

/**
 * Starts the divine punishment attack.
 * For macro usage!
 * @param actor The actor for which the attack shall be started!
 */
export async function startTorrentMassiveAttack(actor) {
    //Check if pilot exists!
    if(!actor.system.pilot) {
        ui.notifications.warn("Cannot use torrent massive attack, this mech has no pilot");
        return;
    }
    //Check if stormbringer talent!
    const stormbringerItem = getItemFromActorByLID(actor.system.pilot.value, LIDs.stormbringer);
    if(!stormbringerItem || stormbringerItem.system.curr_rank !== 3 || !stormbringerItem.system.ranks[2]) {
        ui.notifications.warn("Cannot use torrent massive attack, this pilot has no stormbringer talent at level 3!");
        return;
    }
    if(checkTorrentDie(stormbringerItem)) {
        await startTorrentMassiveAttackIntern(actor);
    }
}