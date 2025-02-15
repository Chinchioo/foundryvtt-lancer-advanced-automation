import { setActivationFlowClass, setBasicAttackFlowClass, setWeaponAttackFlowClass, getHookEventDataArray, cleanupHookEventData, Flags, setSystemFlowClass} from "./global.js";
import { registerSettings } from "./settings/settings.js";
//Import Helpers
import { wait } from "./automationHelpers/automationHelpers.js";
import { hasControlledToken, getItemFromActorByLID, getItemsFromActorByLID, hasActorItemByLID, getItemFromActorByID, getItemsFromActorByID, hasActorItemByID } from "./automationHelpers/tokenOrActorHelpers.js";
import { createTargetAreas } from "./automationHelpers/templateAndTargetingHelpers.js";
import { clearDelayedAttacks, onCombatUpdateEventData as onDelayedAttackCombatUpdateEventData, 
         onPreUpdateCombatGM as onDelayedAttackPreUpdateCombatGM, onCombatDeleteGM as onDelayedAttackCombatDeleteGM } from "./automationHelpers/delayedAttackHelpers.js";
import { beginRerollAttackFlow, beginRerollWeaponAttackFlow } from "./automationHelpers/rerollAttackHelpers.js";
//Import Attack flow
import { init as initAttackFlowAdditions, registerFlowSteps as registerAttackFlowSteps,
         onCombatUpdateGM as onAttackFlowCombatUpdateGM, onCombatDeleteGM as onAttackFlowCombatDeleteGM } from "./flowAdditions/attackFlowAdditions/attackFlowAdditions.js";
import { getAttackTemplates, getDamages, getDamageTypes } from "./flowAdditions/attackFlowAdditions/attackFlowAdditionHelpers.js";
//Import Activation flow
import { init as initActivationFlowAdditions, registerFlowSteps as registerActionvationFlowSteps, 
         onCombatUpdateGM as onActivationFlowCombatUpdateGM, onCombatDeleteGM as onActivationFlowCombatDeleteGM } from "./flowAdditions/activationFlowAdditions/activationFlowAdditions.js";
//Import CoreActive flow
import { init as initCoreActiveFlowAdditions, registerFlowSteps as registerCoreActiveFlowSteps } from "./flowAdditions/coreActivationFlowAdditions/coreActivationFlowAdditions.js";
//Import Damage flow
import { init as initDamageFlowAdditions, registerFlowSteps as registerDamageFlowSteps,
         onCombatUpdateGM as onDamageFlowCombatUpdateGM, onCombatDeleteGM as onDamageFlowCombatDeleteGM } from "./flowAdditions/damageFlowAdditions/damageFlowAdditions.js";
//Import Structure flow
import { init as initStructureFlowAdditions, registerFlowSteps as registerStructureFlowSteps } from "./flowAdditions/structureFlowAdditions/structureFlowAdditions.js";
//Import Licenses
//Monrach
import { cleanupJavelinRocketsFlags, placeJavelinRocketsTemplates, } from "./lancer_rulings/licenses/monarch/javelinRockets.js";
import { cleanupAvengerSiloFlags, startAvengerSilos } from "./lancer_rulings/licenses/monarch/avengerSilos.js";
import { stopTlalocProtocol } from "./lancer_rulings/licenses/monarch/tlaloc.js";
import { startDivinePunishmentAttack } from "./lancer_rulings/licenses/monarch/divinePunishment.js";
//Import Talents
import { cleanupStormbringerFlags, startTorrentMissile, startTorrentMassiveAttack } from "./lancer_rulings/pilot_talents/stormbringer.js";
//Import Core Boni
import { cleanupOverpowerCaliberFlags } from "./lancer_rulings/core_boni/overpowerCaliber.js";


/**
 * ====================================
 * Hooks
 * ====================================
 */
Hooks.once("lancer.registerFlows", (flowSteps, flows) => {
    setActivationFlowClass(flows.get("ActivationFlow"));
    setBasicAttackFlowClass(flows.get("BasicAttackFlow"));
    setWeaponAttackFlowClass(flows.get("WeaponAttackFlow"));
    setSystemFlowClass(flows.get("SystemFlow"));

    registerAttackFlowSteps(flowSteps, flows);
    registerActionvationFlowSteps(flowSteps, flows);
    registerCoreActiveFlowSteps(flowSteps, flows);
    registerDamageFlowSteps(flowSteps, flows);
    registerStructureFlowSteps(flowSteps, flows);
});

Hooks.once("init", async function () {
    console.log("Initializing lancer advanced automation module!");
    game.advancedAutomation = {
        helpers: {
            wait,
            hasControlledToken,
            getItemFromActorByLID,
            getItemsFromActorByLID,
            hasActorItemByLID,
            getItemFromActorByID,
            getItemsFromActorByID,
            hasActorItemByID,
            createTargetAreas,
        },
        cleanup: {
            cleanupHookEventData,
            clearDelayedAttacks,
            cleanupOverpowerCaliberFlags,
            cleanupJavelinRocketsFlags,
            cleanupAvengerSiloFlags,
            cleanupStormbringerFlags,
        },
        attackFlow: {
            getAttackTemplates,
            getDamages,
            getDamageTypes,
        },
        rerollAttack: {
            beginRerollAttackFlow,
            beginRerollWeaponAttackFlow,
        },
        monarch: {
            stopTlalocProtocol,
            placeJavelinRocketsTemplates,
            startAvengerSilos,
            startDivinePunishmentAttack,
        },
        stormbringer: {
            startTorrentMassiveAttack,
            startTorrentMissile,
        },
    };

    registerSettings();
});

Hooks.once("ready", async function () {
    await initAttackFlowAdditions();
    initActivationFlowAdditions();
    initCoreActiveFlowAdditions();
    initDamageFlowAdditions();
    initStructureFlowAdditions();

    Hooks.on("preUpdateCombat", async (combat, combatChanges, options, userId) => {
        if(game.user.isGM) {
            const currentRound = combatChanges.round ?? combat.current.round;
            const currentTurn = combatChanges.turn;
            for(const combatant of combat.turns) {
                await onDelayedAttackPreUpdateCombatGM(combatant.actor, currentRound, currentTurn, combat.turns);
            }
        }
    });
    Hooks.on("updateCombat", async (combat, combatChanges, options, userId) => {
        if(game.user.isGM) {
            for(const combatant of combat.turns) {
                await onActivationFlowCombatUpdateGM(combatant.actor, combat.combatant, combat.current.round);
                await onAttackFlowCombatUpdateGM(combatant.actor, combat.combatant, combat.current.round);
                await onDamageFlowCombatUpdateGM(combatant.actor, combat.combatant, combat.current.round);
            }
        }
        const hookEventDataArr = getHookEventDataArray(Flags.hookEventCombatUpdate);        
        for(const hookEventData of hookEventDataArr) {
            for(const combatant of combat.turns.filter((c) => c.actor.uuid === hookEventData.actorUuid)) {
                await onDelayedAttackCombatUpdateEventData(hookEventData, combatant.actor, combat.current.round, combat.current.turn, combat.turns);
            }
        }
    });
    Hooks.on("deleteCombat", async (combat, options, userId) => {
        if(game.user.isGM) {
            for(const combatant of combat.turns) {
                await onActivationFlowCombatDeleteGM(combatant.actor);
                await onAttackFlowCombatDeleteGM(combatant.actor);
                await onDamageFlowCombatDeleteGM(combatant.actor);
                await onDelayedAttackCombatDeleteGM(combatant.actor);
            }
        }
    });
    //Refresh settings during combat creation!
    Hooks.on("createCombatant", async (combatant, options, userId) => {
        if(game.user.isGM) {
            await onActivationFlowCombatDeleteGM(combatant.actor);
            await onAttackFlowCombatDeleteGM(combatant.actor);
            await onDamageFlowCombatDeleteGM(combatant.actor);
            await onDelayedAttackCombatDeleteGM(combatant.actor);
        }
    });
    //Handle like the combat got deleted! (Otherwise it might not register the deletion, as it would already have left the combat early!)
    Hooks.on("deleteCombatant", async (combatant, options, userId) => {
        if(game.user.isGM) {
            await onActivationFlowCombatDeleteGM(combatant.actor);
            await onAttackFlowCombatDeleteGM(combatant.actor);
            await onDamageFlowCombatDeleteGM(combatant.actor);
            await onDelayedAttackCombatDeleteGM(combatant.actor);
        }
    });
});