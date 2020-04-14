include('GLOBALS');

/**
 * @auteur : Caneton
 *
 * castel : ID Leek 					| Le poireau qui fait l'action
 * Tool : ID of chip / weapon				| l'arme utilisé
 * cellVise : ID cell 					| la cell sur laquelle on va tirer
 * ignoreCasterOnNonePointArea : Boolean 	| permet de ne pas prendre en compte le caster dans les dégats d'AOE (généralement on se déplace on ne fera donc pas parti des cibles)
 * multiTarget Boolean					| permet de prendre en compte plusieurs cible grâce à l'AOE
 *									|
 * @return : array						| [LEEK : [EFFECT : [TURN : VALUE]]]
 */
function getTargetEffect(caster, tool, cellVise, ignoreCasterOnNonePointArea, multiTarget) {
	var cibles = multiTarget ? getTarget(tool, cellVise) : [getLeekOnCell(cellVise)];
	var nbCible = count(cibles);
	var infoTool = ALL_INGAME_TOOLS[tool];
	var effects = infoTool[TOOL_ATTACK_EFFECTS];
	var area = infoTool[TOOL_AOE_TYPE];
	
	var returnTab = [];
	
	for(var effect in effects) {
		for(var leek in cibles) {
			if(leek != caster || !ignoreCasterOnNonePointArea || effect[TOOL_MODIFIER_ON_CASTER] || area == AREA_POINT ) { 
			// si leek == caster : On fait parti des cibles mais on suppose que l'on va se déplacer et donc que l'on ne fera pas parti des cibles (cas limite pour certains tools comme pour le gazor => pour éviter d'être dans les cibles on a changé la MIN_RANGE de ces tools)
				if (	(
						(
							effect[TOOL_TARGET_SUMMONS] && isSummon(leek)
						) || (
							effect[TOOL_TARGET_NON_SUMMONS] && !isSummon(leek)
						)
					) && (
						(
							effect[TOOL_TARGET_ENEMIES] && isEnemy(leek)
						) || (
							effect[TOOL_TARGET_ALLIES] && isAlly(leek)
						)
					) && (
						(
							effect[TOOL_TARGET_CASTER]
						) || (
							leek != caster
						)
					)
				){ 
					if (!effect[IS_SPECIAL]) {
						var cible = leek;
						if(effect[TOOL_MODIFIER_ON_CASTER]) {
							cible = caster;
						}
					
						var coeffAOE;
						if (area == AREA_POINT || area == AREA_LASER_LINE || cellVise === null) {
							coeffAOE = 1;
						} else {
							var distance = getDistance(cellVise, getCell(cible));
							if(inArray([AREA_X_1, AREA_X_2, AREA_X_3], area)) {
								distance /= sqrt(2);
							}
							coeffAOE = 1 - (ceil(distance) * 0.2);
						}
						
						var coeffNbCible = 1;
						if(effect(TOOL_MODIFIER_MULTIPLIED_BY_TARGETS)) {
							coeffNbCible = nbCible;
						}
						
						var coeffMoyen = effect[TOOL_AVERAGE_POWER];
						
						var coeffCharacteristic = 1;
						var characteristic = ALL_EFFECTS[effect[TOOL_EFFECT_TYPE]][BOOSTED_BY];
						if(characteristic !== null) {
							if(ALL_EFFECTS[effect[TOOL_EFFECT_TYPE]][IS_RELATIF]) {
								coeffCharacteristic = 1 + (getCharacteristiqueFunction(characteristic))(caster);
							} else {
								coeffCharacteristic = 1 + (getCharacteristiqueFunction(characteristic))(caster) / 100;
							}
						}
						
						var value = round(coeffMoyen * coeffCharacteristic * coeffAOE * coeffNbCible);
						
						if(ALL_EFFECTS[effect[TOOL_EFFECT_TYPE]][INTERACT_WITH][INTERACT_SHIELD]) {
							value = max(0, value * (1 - INFO_LEEKS[cible][RELATIVE_SHIELD] / 100) - INFO_LEEKS[cible][ABSOLUTE_SHIELD]);
						}
						// TODO: si le tool est non cumulable et que la cible le possède déjà il faut faire quelque chose...
						//		- on met la value à 0 pour éviter le précédent ?
						//		- on fait la différence entre les 2 valeurs + prendre en compte le nombre de tours restant ?
						// ou alors on le prends en compte dans getValueOfTargetEffect => je préfère garder les vrai valeurs dans cette fonction
						
						
						// Limiter la value
						value = getRealValue(effect[TOOL_EFFECT_TYPE], cible, value);
						
						var stealLife;
						if(ALL_EFFECTS[effect[TOOL_EFFECT_TYPE]][INTERACT_WITH][INTERACT_STEAL_LIFE]) {
							stealLife = getWisdom(caster) * value / 1000;
						}
						
						var damageReturn;
						if(ALL_EFFECTS[effect[TOOL_EFFECT_TYPE]][INTERACT_WITH][INTERACT_RETURN_DAMAGE]) {
							damageReturn = INFO_LEEKS[cible][DAMAGE_RETURN] * value / 1000;
						}
						
						var degatNova;
						var interactWithNova = ALL_EFFECTS[effect[TOOL_EFFECT_TYPE]][INTERACT_WITH][INTERACT_NOVA_DAMAGE];
						if(interactWithNova) {
							degatNova = interactWithNova * value / 100;
						}
						
						// on sauvegarde les valeurs
						var turnNumber = effect[TOOL_NUMBER_TURN_EFFECT_LAST];
						
						if(returnTab[cible] === null) returnTab[cible] = [];
						if(returnTab[cible][effect[TOOL_EFFECT_TYPE]] === null) returnTab[cible][effect[TOOL_EFFECT_TYPE]] = [];
						var oldValue = (returnTab[cible][effect[TOOL_EFFECT_TYPE]][turnNumber] === null) ? 0 : returnTab[cible][effect[TOOL_EFFECT_TYPE]][turnNumber];
						returnTab[cible][effect[TOOL_EFFECT_TYPE]][turnNumber] = oldValue + value;
						
						if(stealLife) {
							if(returnTab[caster] === null) returnTab[caster] = [];
							if(returnTab[caster][EFFECT_HEAL] === null) returnTab[caster][EFFECT_HEAL] = [];
							oldValue = (returnTab[caster][EFFECT_HEAL][1] === null) ? 0 : returnTab[caster][EFFECT_HEAL][1];
							returnTab[caster][EFFECT_HEAL][1] = oldValue + stealLife;
						}
						
						if(damageReturn) {
							if(returnTab[caster] === null) returnTab[caster] = [];
							if(returnTab[caster][EFFECT_LIFE_DAMAGE] === null) returnTab[caster][EFFECT_LIFE_DAMAGE] = [];
							oldValue = (returnTab[caster][EFFECT_LIFE_DAMAGE][1] === null) ? 0 : returnTab[caster][EFFECT_LIFE_DAMAGE][1];
							returnTab[caster][EFFECT_LIFE_DAMAGE][1] = oldValue + damageReturn;
						}
						
						if(degatNova) {
							if(returnTab[caster] === null) returnTab[caster] = [];
							if(returnTab[caster][EFFECT_NOVA_DAMAGE] === null) returnTab[caster][EFFECT_NOVA_DAMAGE] = [];
							oldValue = (returnTab[caster][EFFECT_NOVA_DAMAGE][1] === null) ? 0 : returnTab[caster][EFFECT_NOVA_DAMAGE][1];
							returnTab[caster][EFFECT_NOVA_DAMAGE][1] = oldValue + degatNova;
						}
					} else {
						// TODO : antidote & summon & libé...
					}
				}
			}
		}
	}
	
	return returnTab;
}

/**
 * Retourne la fonction a appeler
 */
function getCharacteristiqueFunction(characteristic) {
	return [
		CHARACTERISTIC_LIFE : getLife,
		CHARACTERISTIC_STRENGTH : getStrength,
		CHARACTERISTIC_WISDOM : getWisdom,
		CHARACTERISTIC_AGILITY : getAgility,
		CHARACTERISTIC_RESISTANCE : getResistance,
		CHARACTERISTIC_SCIENCE : getScience,
		CHARACTERISTIC_MAGIC : getMagic,
		CHARACTERISTIC_FREQUENCY : getFrequency,
		CHARACTERISTIC_MOVEMENT : getMP,
		CHARACTERISTIC_TURN_POINT : getTP
	][characteristic];
}

function getRealValue(effect, leek, value) {
  if(inArray([EFFECT_HEAL, EFFECT_NOVA_DAMAGE], effect)) {
    value = min(value, INFO_LEEKS[leek][MAX_LIFE] - INFO_LEEKS[leek][LIFE]);
  }
  // TODO : Rajouter d'autre effets si besoin;
  // Dans l'absolu faudrait rajouter EFFECT_DAMAGE mais IA ne met de 'bonus' si on tue un leek => on risquerait de ne pas tirer sur les ennemis si il leur reste 10pv
  
  return value;
}

/**
 * @autor : Caneton
 * 
 * aTargetEffect : array		| [LEEK : [EFFECT : [TURN : VALUE]]]
 */
function getValueOfTargetEffect(aTargetEffect) {
	// on parcours les cibles & effect retourné par getTargetEffect
	// et on attribut un score en fonction de COEFF_EFFECT dans ALL_EFFECT, du score de chaque Leek, de la team du leek
	
	var coeffReturned = 0;
	for (var leek : var effectLeek in aTargetEffect) {
		for (var effect : var turn_values in effectLeek) {
			for (var turn : var value in turn_values) {
				var infoEffect = ALL_EFFECTS[effect];
				if (!infoEffect[IS_SPECIAL]) {
					if (inArray([EFFECT_ABSOLUTE_SHIELD, EFFECT_RELATIVE_SHIELD], effect)) {
						// on calcule la protection que ça apporte
						initDangerousEnnemis();
						var damageOnLeekBeforeShield = getTargetEffect(dangerousEnnemis, bestWeapon, getCell(leek), true, false)[leek][EFFECT_DAMAGE];
						var shield = (effect == EFFECT_ABSOLUTE_SHIELD) ? ABSOLUTE_SHIELD : RELATIVE_SHIELD;
						// /!\ on suppose que la cible n'a pas déjà la puce !!! => rajouter un controle avant dans getTargetEffect ou bien ici
						INFO_LEEKS[leek][shield] += value;
						var damageOnLeekAfterShield = getTargetEffect(dangerousEnnemis, bestWeapon, getCell(leek), true, false)[leek][EFFECT_DAMAGE];
						INFO_LEEKS[leek][shield] -= value;
						var bonus = damageOnLeekBeforeShield - damageOnLeekAfterShield;
						coeffReturned += infoEffect[COEFF_EFFECT] * COEFF_LEEK_EFFECT[leek][effect] * bonus; // normalement c'est toujours sur des alliés donc je mets pas de controle sur la team
					} else {
						// Par defaut
						value = (isAlreadyShackle(leek, effect)) ? 0 : value;
						var coeffNbTurn = sqrt(turn); //TODO: vérifier que turn != 0 sinon erreur de math
						var coeffTeam = isAlly(leek) ? 1 : -1;
						var coeffHealthy = infoEffect[IS_HEALTHY] ? 1 : -1;
						coeffReturned += coeffTeam * coeffHealthy * infoEffect[COEFF_EFFECT] * COEFF_LEEK_EFFECT[leek][effect] * value; // TODO : Creer une nouvelle variable dans les globals et inclure ce qui a ete fait dedans.
					}
				} else { // IS_SPECIAL
					//TODO : faire une fonction spéciale pour l'inversion, ...
				}
			}
		}
	}
	return coeffReturned;
}


// ------------------- Leek ennemis et arme de référence pour caluler les gains des puces de shield -----------------

global dangerousEnnemis;
global bestWeapon;
dangerousEnnemis = null;


function findDangerousEnnemis() {//TODO: améliorer => avec la tourelle ça fausse un peu  
	var maxStrengh = 0;
	var ennemis = getAliveEnemies();
	for (var j = 0; j< count(ennemis); j++) {
		var saForce = getStrength(ennemis[j]);
		if (saForce > maxStrengh || saForce == maxStrengh && getLevel(ennemis[j] > getLevel(dangerousEnnemis))) {
			dangerousEnnemis = ennemis[j];
			maxStrengh = saForce;
		}
	}
}

function getBestWeapon(leek) {
	var weapons = getWeapons(leek);
	var chips = getChips(leek);
	var best;
	var degat = 0;
	for (var i in weapons+chips) {
		var effet = ALL_INGAME_TOOLS[i][TOOL_ATTACK_EFFECTS] ;
		if (effet[0][TOOL_EFFECT_TYPE] == EFFECT_DAMAGE && i != CHIP_BURNING) {
			var tmp = effet[0][TOOL_AVERAGE_POWER];
			if (tmp > degat) {
				degat = tmp;
				best = i;
			}
		}
	}
	return best;
}


function initDangerousEnnemis() {
	if(dangerousEnnemis===null) {
		findDangerousEnnemis();
		bestWeapon = getBestWeapon(dangerousEnnemis);
	}
}


// ---------------- Fonction pour stopper la répétition d'une action sur un Leek --------------------------- 


function isAlreadyShackle(leek, effect) {
	// TODO: améliorer la fonction : en prenant en compte les effets qui vont se finir avant le tour de la cible
	if(effect == EFFECT_SHACKLE_MAGIC) {
		return INFO_LEEKS[leek][MAGIC] <= 0;
	}
	if (effect == EFFECT_SHACKLE_STRENGTH) {
		return INFO_LEEKS[leek][STRENGTH] <= 0;
	}
	if (effect == EFFECT_SHACKLE_MP) {
		return INFO_LEEKS[leek][MP] <= 0;
	}
	if (effect == EFFECT_SHACKLE_TP) {
		return INFO_LEEKS[leek][PT] <= 0;
	}
	return false ;
}


// ---------------------------------------------------------------------

function getTarget(tool, cell) {
	return (!ALL_INGAME_TOOLS[tool][TOOL_IS_WEAPON]) ? getChipTargets(tool, cell) : getWeaponTargets(tool, cell);
}
