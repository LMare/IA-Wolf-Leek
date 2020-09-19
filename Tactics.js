include("getCellToUse");
include("getArea");
include("Debug");
include("Utils");


function getTacticAction(@actions, @cellsAccessible, Allies, Ennemies, @tactics_tools) {
	var nb_action = count(actions);
	for(var tool in tactics_tools) {
		if(ERROR_TOOLS[tool]) continue;
		if(can_use_tool(tool, getTP())) {
			var effect = ALL_INGAME_TOOLS[tool][TOOL_ATTACK_EFFECTS] ;
			var tir;
			if(inArray([CHIP_LIBERATION, CHIP_ANTIDOTE, CHIP_INVERSION], tool)) {
				tir = tactic(tool, Allies, Ennemies, cellsAccessible);
			} else if(CHIP_TELEPORTATION == tool) {
				tir = teleportation(cellsAccessible);
			}

			if((tir != [] || tir != null) && tir[VALEUR] > 15) {
				tir[CHIP_WEAPON] = tool;
				var coutPT;
				var valeur = tir[VALEUR];
				coutPT = tir[PT_USE] ? tir[PT_USE] : ALL_INGAME_TOOLS[tool][TOOL_PT_COST];
				var callBack = updateInfoLeeks;
				var effects = tir[EFFECT] ? tir[EFFECT] : ALL_INGAME_TOOLS[tool][TOOL_ATTACK_EFFECTS][0][TOOL_EFFECT_TYPE];

				tir[NB_TIR] = 1;
				tir[PT_USE] = coutPT;
				tir[VALEUR] = valeur;
				tir[EFFECT] = effects;
				if(tir[CALLBACK] == null) tir[CALLBACK] = callBack;

				actions[nb_action] = tir;
				nb_action++;

			}
			debugP(ALL_INGAME_TOOLS[tool][TOOL_NAME] + " => " + tir);
		}
	}
}

function teleportation(@cellsAccessible) {


	// faire d'autre type de teleportation
	// TP - Kill
	var entities = getEntitiesToCheckFromTPKill();
	var tpDispoToKill = getTP() - getChipCost(CHIP_TELEPORTATION);

	for(var entity in getEntitiesToCheckFromTPKill()) {
		debug("VIE_previsionnel : " + INFO_LEEKS[entity][VIE_PREVISIONNEL]);
		var tir = null;
		tir = getComboTpKill([WEAPON_FLAME_THROWER, CHIP_TOXIN], entity, tpDispoToKill, cellsAccessible);
		if(tir == null)
			tir = getComboTpKill([WEAPON_REVOKED_M_LASER], entity, tpDispoToKill, cellsAccessible);
		if(tir == null)
			tir = getComboTpKill([WEAPON_REVOKED_M_LASER, WEAPON_REVOKED_M_LASER], entity, tpDispoToKill, cellsAccessible);
		if(tir == null)
			tir = getComboTpKill([WEAPON_REVOKED_M_LASER, CHIP_TOXIN], entity, tpDispoToKill, cellsAccessible);
		if(tir == null)
			tir = getComboTpKill([WEAPON_GAZOR, CHIP_PLAGUE], entity, tpDispoToKill, cellsAccessible);
		if(tir == null)
			tir = getComboTpKill([WEAPON_M_LASER], entity, tpDispoToKill, cellsAccessible);




		if(tir != null) return tir;
	}


	var ope = getOperations();
	// pour le TP - Libération => en SOLO
	if(inArray(getChips(), CHIP_LIBERATION) && !getCooldown(CHIP_LIBERATION) && getTP() >= getChipCost(CHIP_LIBERATION) + getChipCost(CHIP_TELEPORTATION) && getFightType() == FIGHT_TYPE_SOLO) {

		var enemy = getNearestEnemy();
		enemy = isSummon(enemy) ? getSummoner(enemy) : enemy;

		var effets = getEffects(enemy);
		var buff_strength = 0;
		for(var effet in effets) {
			if(effet[TYPE] == EFFECT_BUFF_STRENGTH) {
				buff_strength += effet[VALUE];
			}
		}

		if (buff_strength >= 400) {
			var cell_liberation = getCellToUseToolsOnCell(CHIP_LIBERATION, getCell(enemy), cellsAccessible);
			if(cell_liberation == NO_CELL) { // la liberation n'est pas possible, on garde la solution de faire une téléportation
				var cells = [];
				CellsToUseTool (CHIP_LIBERATION, getCell(enemy), cells);
				for(var cell_libe in cells) {
					var cell_teleportation = getCellToUseToolsOnCell(CHIP_TELEPORTATION, cell_libe, cellsAccessible);
					if(cell_teleportation != NO_CELL) {
						// on peut faire la téléportation
						var libere, antidote, invert, teleport;
						tacticVal(CHIP_LIBERATION, enemy, null, libere, antidote, invert, teleport);

						var tir = [];
						tir[CELL_DEPLACE] = cell_teleportation;
						tir[CELL_VISE] = cell_libe;
						tir[CHIP_WEAPON] = CHIP_TELEPORTATION;
						tir[NB_TIR] = 1;
						tir[PT_USE] = getChipCost(CHIP_LIBERATION) + getChipCost(CHIP_TELEPORTATION);
						tir[VALEUR] = libere;
						tir[EFFECT] = [EFFECT_TELEPORT, EFFECT_DEBUFF];
						tir[CALLBACK] = (function () {
							// on a fait la téléportation; maintenant on fait la libération
							useChip(CHIP_LIBERATION, enemy);
							updateInfoLeeks();
						});
						debugP(ALL_INGAME_TOOLS[CHIP_TELEPORTATION][TOOL_NAME] + " : " + tir + " => " + ((getOperations() - ope) / OPERATIONS_LIMIT * 100) + "%");
						pause();
						return tir;
					}
				}
			}
		}
	}
	ope = getOperations();
}

/**
 * Vérifie que l'entité courante possède toutes les armes/chips qui sont en paramètre
 */
function haveAllTools(tools) {
	var haveAll = true;
	var allTools = getWeapons() + getChips();
	var i = 0;
	while (i < count(tools)) {
		if(!inArray(allTools, tools[i])) return false;
		i++;
	} ;
	return true;
}



/**
 * Retourne une action téléportation + attaque pour tuer une entité si celà est possible
 * @tools : les armes pour le combo (Note : toutes les armes devront être utilisable pour faire le combo)
 * @entity : l'entité à tuer
 * @tpDispoToKill : TP diponible pour l'attaque (il faut retirer les tp pour le TP)
 * @cellsAccessible : les cases accessibles
 */
function getComboTpKill(tools, entity, tpDispoToKill, @cellsAccessible) {
	if(haveAllTools(tools)) {
		var cost = 0, costChangeWeapon = 0, cooldownOk = true, weaponEquipe= getWeapon();
		for(var tool in tools) {
			cost += getToolCost(tool, costChangeWeapon, cooldownOk, weaponEquipe);
		}

		if((tpDispoToKill >= cost + costChangeWeapon) && cooldownOk) {
			// check kill
			var aTargetEffect = [];
			for (var tool in tools) {
				aTargetEffect = getTargetEffect(ME, tool, getCell(entity), false, aTargetEffect);
			}
			debug(aTargetEffect);
			checkKill(aTargetEffect);
			if(aTargetEffect[entity][EFFECT_KILL]) {
				// la cible peut mourir, maintenant il faut vérifier que puisse trouver une bonne cell
				var valeur = getValueOfTargetEffect(aTargetEffect);
				var cells = [];
				CellsToUseTool (tools[0], getCell(entity), cells);
				for(var cell_tool_0 in cells) {
					var cell_teleportation = getCellToUseToolsOnCell(CHIP_TELEPORTATION, cell_tool_0, cellsAccessible);
					// /!\ On suppose que l'on pourra utiliser la deuxième arme sur la case de la première
					// Si ce n'est pas le cas et que ça n'est pas suffisant pour la tuer, il y a de forte chance qu'on ira la tuer dans l'action suivante
					if(cell_teleportation != NO_CELL) {
						// on peut faire la téléportation
						var tir = [];
						tir[CELL_DEPLACE] = cell_teleportation;
						tir[CELL_VISE] = cell_tool_0;
						tir[VALEUR] = valeur * 10; // pour les tests
						tir[CHIP_WEAPON] = CHIP_TELEPORTATION;
						tir[NB_TIR] = 1;
						tir[PT_USE] = getChipCost(CHIP_TELEPORTATION) + cost + costChangeWeapon;
						tir[EFFECT] = EFFECT_KILL;
						tir[CALLBACK] = (function () {
							// on a fait la téléportation; maintenant on fait la libération
							debugC("TP KILLLL !!!!! ", COLOR_BLUE);
							var succes = USE_SUCCESS;
							for(var tool in tools) {
								if(isWeapon(tool) && getWeapon() != tool) setWeapon(tool);
								succes &= 0 < (isWeapon(tool) ? useWeapon(entity) : useChip(tool, entity));
							}
							return succes;
						});

						return tir;
					}
				}
				debug("TP_KILL - Pas de cell trouvé pour la téléportation : " + tools);
			} else {
				debug("TP_KILL - La cible ne peux pas être tuée : " + tools);
			}
		} else {
			debug("TP_KILL - TP ou CD inssufisant : " + tools);
		}
	} else {
		debug("TP_KILL - Armes non équipés") + tools;
	}

	return null;
}

/**
 * Calcul le cout d'un tool + fait les vérifications CD & changement d'arme
 * @tool : l'arme à évaluer
 * @costChangeWeapon : in out - cout du changement d'arme
 * @cooldownOk : in out - la chip peut être utilisé
 */
function getToolCost(tool, @costChangeWeapon, @cooldownOk, @weaponEquipe) {
	if(isWeapon(tool)) {
		if(weaponEquipe != tool){
			costChangeWeapon++;
			weaponEquipe = tool;
		}
		return getWeaponCost(tool);
	} else {
		cooldownOk = cooldownOk && !getCooldown(tool);
		return getChipCost(tool);
	}
}


/**
 * filtre les entitées pour le TP kill
 * //TODO: faire les autres type que pour le solo
 */
function getEntitiesToCheckFromTPKill() {
	var entities = [];
	if (getFightType() == FIGHT_TYPE_SOLO) {
		var entity = getNearestEnemy();
		entities[0] = isSummon(entity) ? getSummoner(entity) : entity;
	}

	if(getFightType() == FIGHT_TYPE_BATTLE_ROYALE) {

	}

	if(inArray([FIGHT_TYPE_FARMER, FIGHT_TYPE_TEAM], getFightType())) {

	}
	return entities;
}


/**
 * Pour l'antidote et la libération
 * TODO: mutualiser avec le fichier Utils
 */
function tactic(tool, allies, ennemies, @cellsAccessible) {
	var ope = getOperations();
	var leeks = allies + ennemies;
	var cell_deplace;
	var cellAllie;
	var bestAction = [];
	var action;
	var valeur;
	var bestValeur = 0;
	var distanceBestAction = 0;
	for(var leek in leeks) {
		if((ALL_INGAME_TOOLS[tool][TOOL_ATTACK_EFFECTS][0][TOOL_TARGET_SUMMONS] && isSummon(leek)) || (ALL_INGAME_TOOLS[tool][TOOL_ATTACK_EFFECTS][0][TOOL_TARGET_NON_SUMMONS] && !isSummon(leek))) {
			if(!(MIN_RANGE[tool] != 0 && leek == ME)) {
				if(!NOT_USE_ON[tool][leek]) {
					cellAllie = getCell(leek);
					cell_deplace = getCellToUseToolsOnCell(tool, cellAllie, cellsAccessible);
					if(cell_deplace != NO_CELL) {
						var libere, antidote, invert, teleport;
						tacticVal(tool, leek, null, libere, antidote, invert, teleport);
						if(MINIMUM_TO_USE[tool] === null || MINIMUM_TO_USE[tool] <= (antidote + libere + invert + teleport)) {
							valeur = SCORE_TACTIC[leek] * (antidote + libere + invert + teleport);
							if(valeur > bestValeur || valeur == bestValeur && cellsAccessible[cell_deplace] < distanceBestAction) {
								if(getLeekOnCell(cellAllie) == ME) {
									bestAction[CELL_DEPLACE] = -1;
									bestAction[CELL_VISE] = -1;
								} else {
									bestAction[CELL_DEPLACE] = cell_deplace;
									bestAction[CELL_VISE] = cellAllie;
								}
								bestAction[VALEUR] = valeur;
								distanceBestAction = cellsAccessible[cell_deplace];
								bestValeur = valeur;
							}
						}
					}
				}
			}
		}
	}
	debugP(ALL_INGAME_TOOLS[tool][TOOL_NAME] + " : " + bestAction + " => " + ((getOperations() - ope) / OPERATIONS_LIMIT * 100) + "%");
	return @bestAction;
}

function tacticVal(tool, leek, coeffReduction, @libere, @antidote, @invert, @teleport) {
	libere = 0; antidote = 0; invert = 0;
	var effects = ALL_INGAME_TOOLS[tool][TOOL_ATTACK_EFFECTS];
	//if(coeffReduction === null || coeffReduction < 1 || coeffRedcution < 0) coeffReduction = 1;
	if(tool == CHIP_ANTIDOTE && isAlly(leek)) {
		var effectPoison = getEffects(leek);
		for(var unEffet in effectPoison) {
			var eff = unEffet[TYPE];
			if (eff == EFFECT_POISON) {
				antidote += unEffet[VALUE];
			}
		}
		return antidote;
	} else if(tool == CHIP_LIBERATION) {
		if(isAlly(leek)) {
			var effectMalus = getEffects(leek);
			for(var unEffet in effectMalus) {
				var eff = unEffet[TYPE];
				if (eff == EFFECT_POISON){
					libere += unEffet[VALUE];
				}
				if(eff == EFFECT_SHACKLE_MAGIC) {
					//libere += unEffet[VALUE];
				}
				if(eff == EFFECT_SHACKLE_MP) {
					libere += unEffet[VALUE] * 60;
				}
				if(eff == EFFECT_SHACKLE_STRENGTH) {
					libere += unEffet[VALUE];
				}
				/*if(eff == EFFECT_SHACKLE_TP)
				{
					libere += unEffet[VALUE] * 80;
				}*/
				if(eff == EFFECT_BUFF_TP) {
					libere -= unEffet[VALUE] * 80;
				}
				if(eff == EFFECT_BUFF_MP) {
					libere -= unEffet[VALUE] * 60;
				}
				if(eff == EFFECT_BUFF_STRENGTH) {
					libere -= unEffet[VALUE] * 1;
				}
				if(eff == EFFECT_BUFF_AGILITY) {
					libere -= unEffet[VALUE] * 0.7;
				}
				if(eff == EFFECT_BUFF_RESISTANCE) {
					libere -= unEffet[VALUE] * 0.7;
				}
				if(eff == EFFECT_BUFF_WISDOM) {
					libere -= unEffet[VALUE] * 0.7;
				}
				if(eff == EFFECT_ABSOLUTE_SHIELD) {
					libere -= unEffet[VALUE];
				}
				if(eff == EFFECT_RELATIVE_SHIELD) {
					libere -= unEffet[VALUE];
				}
			}
			return libere;
		} else {
			var effect = getEffects(leek);
			for(var unEffet in effect) {
				var eff = unEffet[TYPE];
				if (eff == EFFECT_POISON){
					libere -= unEffet[VALUE];
				}
				if(eff == EFFECT_BUFF_TP) {
					libere += unEffet[VALUE] * 80;
				}
				if(eff == EFFECT_BUFF_MP) {
					libere += unEffet[VALUE] * 60;
				}
				if(eff == EFFECT_BUFF_STRENGTH) {
					libere += unEffet[VALUE] * 1;
				}
				if(eff == EFFECT_BUFF_AGILITY) {
					libere += unEffet[VALUE] * 0.7;
				}
				if(eff == EFFECT_BUFF_RESISTANCE) {
					libere += unEffet[VALUE] * 0.7;
				}
				if(eff == EFFECT_BUFF_WISDOM) {
					libere += unEffet[VALUE] * 0.7;
				}
				if(eff == EFFECT_ABSOLUTE_SHIELD) {
					libere += unEffet[VALUE];
				}
				if(eff == EFFECT_RELATIVE_SHIELD) {
					libere += 3 * unEffet[VALUE];
				}
				if(eff == EFFECT_RAW_ABSOLUTE_SHIELD) {
					libere += 4 * unEffet[VALUE];
				}
			}
			return libere;
		}
	}

	if(tool == CHIP_INVERSION) {
		if(isAlly(leek)) {
			invert += ALL_INGAME_TOOLS[tool][TOOL_ATTACK_EFFECTS][1][TOOL_MIN_POWER] ;
			return invert;
		} else {
			invert += ALL_INGAME_TOOLS[tool][TOOL_ATTACK_EFFECTS][2][TOOL_MIN_POWER] ;
			return invert;
		}
	}

	if(tool == CHIP_TELEPORTATION)
	{

	}
}
