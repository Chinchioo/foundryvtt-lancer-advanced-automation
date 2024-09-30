import { moduleID, LIDs, Flags } from "../../../../global.js";
import { getItemFromActorByLID } from "../../../../automationHelpers/tokenOrActorHelpers.js";
import { beginRerollAttackFlow, beginRerollWeaponAttackFlow, isRerollAttack } from "../../../../automationHelpers/rerollAttackHelpers.js";
import { simpleYesNoQuestion } from "../../../../automationHelpers/automationHelpers.js";
import { addActionResolver, isSpecialWeaponAttackFlow } from "../../attackFlowAdditionHelpers.js";

/**
 * ====================================
 * Additional attack flow steps
 * ====================================
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

                        //Set flag to keep templates, for easier retargeting...
                        state.data.keepTemplates = true;

                        //Check if basic or weapon attack flow
                        if(state.data.type === "attack")
                            await beginRerollAttackFlow(state.actor, state.data.temp?.damage_results, state.data.temp?.crit_damage_results, state.data.overkill_heat);
                        else if(state.data.type === "weapon")
                            await beginRerollWeaponAttackFlow(state.item, state.data.temp?.damage_results, state.data.temp?.crit_damage_results, state.data.overkill_heat);
                    } 
                }, canUseTlaloc);
            
        }
    }
}