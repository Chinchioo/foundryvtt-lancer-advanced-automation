/**
 * ====================================
 * Template area and targeting helpers
 * ====================================
 */

/**
 * Creates template areas.
 * @param areaSizes: The size of the template area.
 * @param areaType: Type of area. E.g. "Blast", "Cone", "Line".
 * @param areaAmount: How many areas shall be created?
 * @returns An array of template ids.
 */
export async function createTargetAreas(areaSize, areaType, areaAmount, templateTexture) { 
    //Create template areas
    let areaTemplates = [];
    for(let i = 0; i < areaAmount; i++) {
        let canceled = false;
        await game.lancer.canvas.WeaponRangeTemplate.fromRange({
            type: areaType,
            val: areaSize,
        }).placeTemplate()
            .catch(() => { canceled = true; }) // Handle canceled
            .then(async t => {
                if(t) {
                    areaTemplates.push(t.id);
                    if(templateTexture) {
                        await t.update({
                            texture: templateTexture,
                        });
                    }
                }
            });     
        if(canceled) {
            //Remove templates from view
            for(const templateID of areaTemplates) {
                canvas.scene.deleteEmbeddedDocuments('MeasuredTemplate', [templateID]); 
            }
            return null;
        }
    }
    
    return areaTemplates;
}

/**
 * Searches which tokens are targeted by the given template.
 * !!!This function took inspiration from https://github.com/Eranziel/foundryvtt-lancer!!!!
 * @param templateID: The template id for which the targets shall be searched.
 * @param doTarget: If the function shall directly target the found targets for current user.
 * @returns An array of ids for the found target tokens.
 */
export function targetsFromTemplate(templateID, doTarget) {
    // Get template higlighted areas
    // Get list of tokens and dispositions to ignore.
    let highlight = canvas?.grid?.getHighlightLayer(`MeasuredTemplate.${templateID}`);
    let ignore = canvas.templates?.get(templateID)?.document.getFlag(game.system.id, "ignore");
    
    // Test if each token occupies a targeted space and target it if true
    const targets = canvas.tokens?.placeables.filter(token => {
        let skip = ignore?.tokens.includes(token.id) || ignore?.dispositions.includes(token.document.disposition);
    
        return !skip && Array.from(token.getOccupiedSpaces()).reduce(
            (a, p) => {
                return a || highlight?.geometry?.containsPoint(p);
            }, false);
    });
    
    // Target tokens
    let targetIDs = [];
    for(const target of targets) {
        targetIDs.push(target.id);
        if(doTarget)
            target.setTarget(true, { releaseOthers: false });
    }
    
    return targetIDs;
}

/**
 * Searches which tokens are targeted by the given template id list. * 
 * @param templateIDs: A list of template ids for which the targets shall be searched.
 * @param doTarget: If the function shall directly target the found targets for current user.
 * @returns An array of ids for the found target tokens.
 */
export function targetsFromTemplates(templateIDs, doTarget) {
    let targetIDs = [];
    for(let templateID of templateIDs) {
        targetIDs.concat(targetsFromTemplate(templateID, doTarget));
    }
    return targetIDs;
}

/**
 * Removes given template Ids from current scene.
 * @param templateIds: The template ids to remove from current scene.
 */
export function removeTemplatesFromScene(templateIds) {
    if(templateIds) {
        for(const templateId of templateIds) {
            let test = canvas.scene.getEmbeddedDocument('MeasuredTemplate', templateId);
            if(test)
                canvas.scene.deleteEmbeddedDocuments('MeasuredTemplate', [templateId]);
        }
    }
}