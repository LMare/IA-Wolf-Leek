include("Utils");
include("Attaque");
include("Debug");


function getResistanceAction(@actions, @cellsAccessible, Allies, TPmax, @shield_tools) {
	var nb_action = count(actions);
	for(var tool in shield_tools) {
		if(ERROR_TOOLS[tool]) continue;
		if(can_use_tool(tool, TPmax)) {
			var area = ALL_INGAME_TOOLS[tool][TOOL_AOE_TYPE];
			var tir;
			if(area == AREA_POINT) {
				tir = proteger(tool, Allies, cellsAccessible);
			} else if(area == AREA_LASER_LINE) {
				var cellToCheck = getCellsToCheckForLaser(cellsAccessible, Allies + getAliveEnemies());
				tir = shieldTypeLigne(tool, cellToCheck, cellsAccessible);
			} else {
				tir = shieldTypeAOE(Allies, tool, cellsAccessible);
			}
			

			if ((tir != [] || tir != null) && tir[VALEUR] > 1) {
				tir[CHIP_WEAPON] = tool;
				var valeur = tir[VALEUR];
				var change_weapon =  ( ALL_INGAME_TOOLS[tool][TOOL_IS_WEAPON] && tool != getWeapon()) ? 1 : 0;
				var coutPT = ALL_INGAME_TOOLS[tool][TOOL_PT_COST] ;
				var n = (ALL_INGAME_TOOLS[tool][TOOL_COOLDOWN_TIME]) ? 1 : floor(TPmax / coutPT);

				//ajouter le bon nombre de fois dans les actions
				for (var o = 1; o <= n; o++) {
					tir[NB_TIR] = o;
					tir[PT_USE] = o * coutPT + change_weapon;
					tir[PM_USE] = tir[CELL_DEPLACE] >= 0 ? cellsAccessible[tir[CELL_DEPLACE]] : 0;
					tir[VALEUR] = o * valeur;
					tir[EFFECT] = ALL_INGAME_TOOLS[tool][TOOL_ATTACK_EFFECTS][0][TOOL_EFFECT_TYPE] ;
					tir[CALLBACK] = updateInfoLeeks;/*(function (leek) {
						INFO_LEEKS[leek][ABSOLUTE_SHIELD] = getAbsoluteShield(leek);
						INFO_LEEKS[leek][RELATIVE_SHIELD] = getRelativeShield(leek);
					});
					tir[PARAM] = tir[CELL_VISE] == -1 ? getLeek() : getLeekOnCell(tir[CELL_VISE]);*/
					actions[nb_action] = tir;
					nb_action++;
				}
			}
		}
	}
}

function shieldTypeLigne(tool, @cellToCheck, @cellsAccessible) {
	var ope = getOperations();
	var from = 0;
	var withOrientation = 1;
	var orientation = [-17, 17, -18, 18]; // note : l'ordre des valeurs est important

	var valeurMax = 0;
	var distanceBestAction = 100;
	var bestAction = [];

	for (var cell in cellToCheck) {
		if (lineOfSight(cell[from], cell[from] + MIN_RANGE[tool] * orientation[cell[withOrientation]], ME)) {
			var cellVise = [
				'cell' : cell[from] + MIN_RANGE[tool] * orientation[cell[withOrientation]],
				'from' : cell[from],
				'orientation' : cell[withOrientation]
			];
			var oldPosition = INFO_LEEKS[ME][CELL];
			INFO_LEEKS[ME][CELL] = cell[from]; // on simule le déplacement
			var aTargetEffect = getTargetEffect(ME, tool, cellVise, true, null);
			var valeur = getValueOfTargetEffect(aTargetEffect);
			INFO_LEEKS[ME][CELL] = oldPosition;
			
			if(MINIMUM_TO_USE[tool]===null || MINIMUM_TO_USE[tool]<= valeur) {
				if ((valeur > valeurMax || valeur == valeurMax && cellsAccessible[cell[from]] < distanceBestAction)) {
					bestAction[CELL_DEPLACE] = cell[from];
					bestAction[CELL_VISE] = cell[from] + MIN_RANGE[tool]* orientation[cell[withOrientation]];
					bestAction[VALEUR] = valeur;
					valeurMax = valeur;
					distanceBestAction = cellsAccessible[cell[from]];
				}
			}
		}
	}
	debugP(ALL_INGAME_TOOLS[tool][TOOL_NAME] + " : " + bestAction + " => " + ((getOperations() - ope) / OPERATIONS_LIMIT * 100) + "%");
	return @bestAction;
}



function proteger(tool, allies, @cellsAccessible) {// pour les puces de shield sans AOE
	var ope = getOperations();
	var cell_deplace;
	var cellAllie;
	var bestAction = [];
	var action;
	var valeur;
	var bestValeur = 0;
	var distanceBestAction = 0;
	if(tool == CHIP_INVERSION) allies = getAliveEnemies(); // c'est pas très beau, je verrais plus tard pour généraliser toutes les actions
	for (var allie in allies) {
		//if ((ALL_INGAME_TOOLS[tool][TOOL_ATTACK_EFFECTS][0][TOOL_TARGET_SUMMONS] && isSummon(allie)) || (ALL_INGAME_TOOLS[tool][TOOL_ATTACK_EFFECTS][0][TOOL_TARGET_NON_SUMMONS] && !isSummon(allie))) {
			if (!(MIN_RANGE[tool] != 0 && allie == ME)) {
				if(!NOT_USE_ON[tool][allie]) {
					if(!haveEffect(allie,tool)) {
						cellAllie = getCell(allie);
						cell_deplace = getCellToUseToolsOnCell(tool, cellAllie, cellsAccessible);
						if (cell_deplace != NO_CELL) { //la cellule doit être atteignable
							var oldPosition = INFO_LEEKS[ME][CELL];
							INFO_LEEKS[ME][CELL] = cell_deplace; // on simule le déplacement
							var aTargetEffect = getTargetEffect(ME, tool, cellAllie, true, null);
							valeur = getValueOfTargetEffect(aTargetEffect);
							INFO_LEEKS[ME][CELL] = oldPosition;
							if (valeur > bestValeur || valeur == bestValeur && cellsAccessible[cell_deplace] < distanceBestAction) {
								if(getLeekOnCell(cellAllie)==ME) {
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
			//}
		}
	}
	debugP(ALL_INGAME_TOOLS[tool][TOOL_NAME] + " : " + bestAction + " => " + ((getOperations() - ope) / OPERATIONS_LIMIT * 100) + "%");
	return @bestAction;
}


function shieldTypeAOE(toutPoireau, tool, @cellsAccessible) {
	var oper = getOperations();
	var bestAction = [];
	var distanceBestAction = 0;

	var cell_deplace;
	var valeurMax = 0;
	var maxRange = ALL_INGAME_TOOLS[tool][TOOL_MAX_RANGE];
	var deja_fait = [];
	for (var poireau in toutPoireau) {
		var distance = getCellDistance(getCell(), getCell(poireau));
		if (distance <= maxRange + getMP() + getAreaDistance(tool)) {
			var zone = getEffectiveArea(tool, getCell(poireau));
			if (zone != null) {
				for (var cell in zone) {
					if (!deja_fait[cell]) {
						deja_fait[cell] = true;
						cell_deplace = getCellToUseToolsOnCell(tool, cell, cellsAccessible);
						if (cell_deplace != NO_CELL) {
							var oldPosition = INFO_LEEKS[ME][CELL];
							INFO_LEEKS[ME][CELL] = cell_deplace;
							var aTargetEffect = getTargetEffect(ME, tool, cell, true, null);
							var valeur = getValueOfTargetEffect(aTargetEffect);
							INFO_LEEKS[ME][CELL] = cell_deplace;
							if (valeur > valeurMax || valeur == valeurMax && cellsAccessible[cell_deplace] < distanceBestAction) {
								bestAction[CELL_DEPLACE] = cell_deplace;
								bestAction[CELL_VISE] = cell;
								bestAction[VALEUR] = valeur;
								valeurMax = valeur;
								distanceBestAction = cellsAccessible[cell_deplace];
							}
						}
					}
				}
			}
		}
	}
	debugP(ALL_INGAME_TOOLS[tool][TOOL_NAME] + " : " + bestAction + " => " + ((getOperations() - oper) / OPERATIONS_LIMIT * 100) + "%");
	return @bestAction;
}



function getAreaDistance(tool) {
	var area = ALL_INGAME_TOOLS[tool][TOOL_AOE_TYPE];
	if(inArray([AREA_POINT, AREA_LASER_LINE], area)) return 0;
	if(inArray([AREA_CIRCLE_1, AREA_PLUS_1], area)) return 1;
	if(inArray([AREA_CIRCLE_2, AREA_PLUS_2, AREA_X_1], area)) return 2;
	if(inArray([AREA_CIRCLE_3, AREA_PLUS_3], area)) return 3;
	if(area == AREA_X_2) return 4;
	if(area == AREA_X_3) return 6;
}
