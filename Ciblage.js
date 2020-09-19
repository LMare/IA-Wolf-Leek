include("GLOBALS");
include("Debug");
include("Utils");



COEFF_LEEK_EFFECT = (function (){
		var tab = [];
		var leeks = getAliveAllies() + getAliveEnemies();
		for (var leek in leeks) {
			tab[leek] = [];
			for (var effect : var tabEffect in ALL_EFFECTS) {
				tab[leek][effect] = (isSummon(leek) || isStatic(leek)) ? 0.5 : 1;
			}
		}
		return @tab;
})();



// SCORE_RESISTANCE
(function () {
	var leeks = getAliveAllies();
	for(var leek in leeks) {
		var value;
		if(getFightType() == FIGHT_TYPE_SOLO) {
			var ennemy = getNearestEnemy();
			if(isSummon(ennemy)) ennemy = getSummoner(ennemy);
			if(getMagic(ennemy) >= 300 && getStrength(ennemy) < 100) {
				value =(isSummon(leek)) ? 0 : 0.2;
			} else {
				value =(isSummon(leek)) ? 0.4 : 1;
			}
		} else {
			 value = (isSummon(leek) || isStatic(leek)) ? 0.2 : 1;
		}
		COEFF_LEEK_EFFECT[leek][EFFECT_DAMAGE_RETURN] = value;
		COEFF_LEEK_EFFECT[leek][EFFECT_ABSOLUTE_SHIELD] = value;
		COEFF_LEEK_EFFECT[leek][EFFECT_RELATIVE_SHIELD] = value;
		COEFF_LEEK_EFFECT[leek][EFFECT_RAW_ABSOLUTE_SHIELD] = value;
	}
})();



// EFFECT_KILL
// TODO: à améliorer (notament en fonction des effets qui on été lancé)
(function () {
	var leeks = getAliveAllies() + getAliveEnemies();
	for(var leek in leeks) {
		if(getFightType() == FIGHT_TYPE_SOLO) {
			if (getType(leek) == ENTITY_LEEK) {
				COEFF_LEEK_EFFECT[leek][EFFECT_KILL] = 10000;
			} else {
				COEFF_LEEK_EFFECT[leek][EFFECT_KILL] = max(100, getLife(leek) * COEFF_LEEK_EFFECT[leek][EFFECT_DAMAGE]);
			}
		} else {
			 if (getType(leek) == ENTITY_LEEK) {
			 	COEFF_LEEK_EFFECT[leek][EFFECT_KILL] = getTotalLife(leek);
			 } else if (getType(leek) == ENTITY_TURRET) {
			 	COEFF_LEEK_EFFECT[leek][EFFECT_KILL] = 10000;
			 } else {
			 	COEFF_LEEK_EFFECT[leek][EFFECT_KILL] = max(100, getLife(leek) * COEFF_LEEK_EFFECT[leek][EFFECT_DAMAGE]);
			 }
		}
	}
})();



//SCORE POUR LES TOURELLES
(function () {
	if(TURRET_ALLY !== NULL) {
		if (TURRET_ALLY !== ME) {
			// la tourelle est suffisament autonnome
			COEFF_LEEK_EFFECT[TURRET_ALLY][EFFECT_ABSOLUTE_SHIELD] = 0;
			COEFF_LEEK_EFFECT[TURRET_ALLY][EFFECT_RELATIVE_SHIELD] = 0;
			COEFF_LEEK_EFFECT[TURRET_ALLY][EFFECT_RAW_ABSOLUTE_SHIELD] = 0;
			COEFF_LEEK_EFFECT[TURRET_ALLY][EFFECT_VULNERABILITY] = 0;
			COEFF_LEEK_EFFECT[TURRET_ALLY][EFFECT_HEAL] = 0;
			COEFF_LEEK_EFFECT[TURRET_ALLY][EFFECT_BUFF_MP] = 0;
			COEFF_LEEK_EFFECT[TURRET_ALLY][EFFECT_BUFF_TP] = 0;
			COEFF_LEEK_EFFECT[TURRET_ALLY][EFFECT_POISON] = 0.4;
			COEFF_LEEK_EFFECT[TURRET_ALLY][EFFECT_DAMAGE] = 0.4;
			COEFF_LEEK_EFFECT[TURRET_ALLY][EFFECT_DAMAGE_RETURN] = 0;
		} else {
			COEFF_LEEK_EFFECT[TURRET_ALLY][EFFECT_ABSOLUTE_SHIELD] *= 0.5;
			COEFF_LEEK_EFFECT[TURRET_ALLY][EFFECT_RELATIVE_SHIELD] *= 0.5;
			COEFF_LEEK_EFFECT[TURRET_ALLY][EFFECT_RAW_ABSOLUTE_SHIELD] *= 0.5;
			COEFF_LEEK_EFFECT[TURRET_ALLY][EFFECT_HEAL] *= 0.5;
			COEFF_LEEK_EFFECT[TURRET_ALLY][EFFECT_DAMAGE_RETURN] *= 0.7;
			if(getCellDistance(getCell(), getCell(getNearestEnemy())) < 12) {
				COEFF_LEEK_EFFECT[TURRET_ALLY][EFFECT_BUFF_TP] *= 0.7;
			}

		}
	}
	if(TURRET_ENNEMY !== NULL) {
		COEFF_LEEK_EFFECT[TURRET_ENNEMY][EFFECT_POISON] = 0;
		COEFF_LEEK_EFFECT[TURRET_ENNEMY][EFFECT_DAMAGE] = 0;
		COEFF_LEEK_EFFECT[TURRET_ENNEMY][EFFECT_DEBUFF] = 0;
		COEFF_LEEK_EFFECT[TURRET_ENNEMY][EFFECT_SHACKLE_MAGIC] = 0;
		COEFF_LEEK_EFFECT[TURRET_ENNEMY][EFFECT_SHACKLE_STRENGTH] = 0;
		COEFF_LEEK_EFFECT[TURRET_ENNEMY][EFFECT_SHACKLE_MP] = 0;
		COEFF_LEEK_EFFECT[TURRET_ENNEMY][EFFECT_SHACKLE_TP] = 0;
	}
})();




// SCORE en fonction des situations ???
(function () {
	if (getLife() / getTotalLife() <= 0.6) {
		COEFF_LEEK_EFFECT[ME][EFFECT_HEAL] = 2 - (getLife() / getTotalLife());
	}
	if(getLeekID() === 54106 && getFightType() != FIGHT_TYPE_SOLO) { //Leekidateur
		var turnOrder = getTurnOrder();
		var nbEntities = count(turnOrder);
		var myTurnOrder = getTurn();

		var leekTurn = ME;
		var turn = myTurnOrder;
		do {
			turn = (turn + 1) % (nbEntities + 1);
			leekTurn = turnOrder[turn];
		} while (leekTurn === null || !(isAlive(leekTurn) && isEnemy(leekTurn) && !isStatic(leekTurn) && !isSummon(leekTurn)));

		COEFF_LEEK_EFFECT[leekTurn][EFFECT_POISON] = 1.2;

	}

	if(getLeekID() === 54106 && getFightType() == FIGHT_TYPE_SOLO) { //Leekidateur
		var enemy = getNearestEnemy();
		enemy = isSummon(enemy) ? getSummoner(enemy) : enemy;

		if (getStrength(enemy) >= 350 ) {
			COEFF_LEEK_EFFECT[enemy][EFFECT_SHACKLE_STRENGTH] = 1.7;
		}
		if (getMagic(enemy) >= 350) {
			COEFF_LEEK_EFFECT[enemy][EFFECT_SHACKLE_MAGIC] = 1.7;
		}
	}

	// contre les fight "cancereux" => touver les bonnes conditions
	if (getFightType() == FIGHT_TYPE_FARMER && getFarmerID(getNearestEnemy()) == 39271) { // Tagadagain
		ALL_EFFECTS[EFFECT_NOVA_DAMAGE][COEFF_EFFECT] = 2;
	}


	if (getFightType() == FIGHT_TYPE_BATTLE_ROYALE) {
		COEFF_LEEK_EFFECT[ME][EFFECT_HEAL] *= 1.7;
		COEFF_LEEK_EFFECT[ME][EFFECT_RELATIVE_SHIELD] *= 1.7;
		COEFF_LEEK_EFFECT[ME][EFFECT_ABSOLUTE_SHIELD] *= 1.7;
	}

	if(getFightType() == FIGHT_TYPE_SOLO && getLeekID(getLeek()) == 54412) { //Roleekstone
		setCoeffSoloSpeResistance();
	}

})();



// TROPHE TITAN
(function() {
	if (TITAN) {
		for(var entity in getAliveAllies()+getAliveEnemies()) {
			var ally = isAlly(entity) ? 1 : -1;
			if (isSummon(entity)) {
				COEFF_LEEK_EFFECT[entity][EFFECT_KILL] = ally * getLife(entity);
			} else {
				COEFF_LEEK_EFFECT[entity][EFFECT_KILL] = ally * 20000;
			}

			COEFF_LEEK_EFFECT[entity][EFFECT_HEAL] = ally;
			if (getStrength(entity) > 400) {
				COEFF_LEEK_EFFECT[entity][EFFECT_BOOST_MAX_LIFE] = 0;
				COEFF_LEEK_EFFECT[entity][EFFECT_DAMAGE] = 0;
				COEFF_LEEK_EFFECT[entity][EFFECT_NOVA_DAMAGE] = 0;
			} else {
				COEFF_LEEK_EFFECT[entity][EFFECT_BOOST_MAX_LIFE] = ally;
				if (getStrength() > 400) {
					COEFF_LEEK_EFFECT[entity][EFFECT_DAMAGE] = -1 * ally;
					COEFF_LEEK_EFFECT[entity][EFFECT_NOVA_DAMAGE] = -1 * ally;
				} else {
					COEFF_LEEK_EFFECT[entity][EFFECT_DAMAGE] = 0;
					COEFF_LEEK_EFFECT[entity][EFFECT_NOVA_DAMAGE] = 0;
				}
			}


		}
	}
})();


MINIMUM_TO_USE = (function(){
	var tab = [];
	tab[CHIP_REGENERATION] = COEFF_LEEK_EFFECT[ME][EFFECT_HEAL] * (1 + getWisdom()/100) * getChipEffects(CHIP_REGENERATION)[0][MIN];
	tab[CHIP_ANTIDOTE] = 300;
	tab[CHIP_LIBERATION] = 200;
	tab[CHIP_COVETOUSNESS] = ALL_INGAME_TOOLS[CHIP_COVETOUSNESS][TOOL_PT_COST] * ALL_EFFECTS[EFFECT_BUFF_TP][COEFF_EFFECT];
	//TODO: rajouter

	return @tab;
})();


NOT_USE_ON = (function() {
	var tab = [];
	tab[CHIP_REGENERATION] = [];
	tab[CHIP_FORTRESS] = [];
	tab[CHIP_RAMPART] = [];
	tab[CHIP_INVERSION] = [];
	tab[CHIP_LIBERATION] = [];
	for(var leek in getAliveAllies() + getAliveEnemies()) {
		if(isSummon(leek) && isAlly(leek)) {
			tab[CHIP_REGENERATION][leek] = true;
			tab[CHIP_FORTRESS][leek] = true;
			if (getFightType() != FIGHT_TYPE_SOLO && countLeekAllie() > 1) {
				tab[CHIP_RAMPART][leek] = true;
			}
		}


		// Contrainte LW
		if (isStatic(leek)) {
			tab[CHIP_INVERSION][leek] = true;
		}

		if (TOUR == 1) { // Délai initial de 1 tour
			tab[CHIP_INVERSION][leek] = true;
			tab[CHIP_TELEPORTATION][leek] = true;
		}

	}
	if (TURRET_ENNEMY !== null) {
		tab[CHIP_LIBERATION][TURRET_ENNEMY] = true;
		tab[CHIP_LIBERATION][TURRET_ALLY] = true;
	}

	if (TURRET_ALLY !== null) {
		tab[CHIP_LIBERATION][TURRET_ENNEMY] = true;
		tab[CHIP_LIBERATION][TURRET_ALLY] = true;
	}
	return @tab;
})();




function compteurPuceEffect(tools, effect) {
	var compteur = 0;
	for(var tool in tools) {
		var eff = isChip(tool) ? getChipEffects(tool)[0][TYPE] : getWeaponEffects(tool)[0][TYPE];
		if(tool==WEAPON_B_LASER) eff=EFFECT_HEAL;
		if(eff==effect) {
			compteur++;
		}
	}
	return compteur;
}

function setBoostCoeff() { // Méthode du nombre de puce
	for (var allie in getAliveAllies()) {
		if(getType(allie) == ENTITY_TURRET) continue;
		var tools = getChips(allie)+getWeapons(allie);
		var nbDamageTool = compteurPuceEffect(tools, EFFECT_DAMAGE);
		var nbHealTool = compteurPuceEffect(tools, EFFECT_HEAL);
		var nbResiTool = compteurPuceEffect(tools, EFFECT_ABSOLUTE_SHIELD)+compteurPuceEffect(tools, EFFECT_RELATIVE_SHIELD);
		var nbReturnDamageTool = compteurPuceEffect(tools, EFFECT_DAMAGE_RETURN);
		var nbScienceTool =   compteurPuceEffect(tools, EFFECT_BUFF_STRENGTH)
						+ compteurPuceEffect(tools, EFFECT_BUFF_WISDOM)
						+ compteurPuceEffect(tools, EFFECT_BUFF_RESISTANCE)
						+ compteurPuceEffect(tools, EFFECT_BUFF_AGILITY)
						+ compteurPuceEffect(tools, EFFECT_BUFF_TP)
						+ compteurPuceEffect(tools, EFFECT_BUFF_MP);

		COEFF_LEEK_EFFECT[allie][EFFECT_BUFF_STRENGTH] = nbDamageTool == 0 ? 0 : sqrt(nbDamageTool);
		COEFF_LEEK_EFFECT[allie][EFFECT_BUFF_WISDOM] = nbHealTool == 0 ? 0 : sqrt(nbHealTool);
		COEFF_LEEK_EFFECT[allie][EFFECT_BUFF_RESISTANCE] = nbResiTool == 0 ? 0 : sqrt(nbResiTool);
		COEFF_LEEK_EFFECT[allie][EFFECT_BUFF_AGILITY] = 1 + (nbReturnDamageTool == 0 ? 0 : sqrt(nbReturnDamageTool)) + (nbScienceTool == 0 ? 0 : sqrt(nbScienceTool));
		COEFF_LEEK_EFFECT[allie][EFFECT_BUFF_TP] = 1.7;
		COEFF_LEEK_EFFECT[allie][EFFECT_BUFF_MP] = 1.7;


		if(isSummon(allie)) {
			for (var cle : var val in COEFF_LEEK_EFFECT[allie]) {
				if (inArray([EFFECT_BUFF_STRENGTH, EFFECT_BUFF_RESISTANCE, EFFECT_BUFF_WISDOM, EFFECT_BUFF_AGILITY, EFFECT_BUFF_TP, EFFECT_BUFF_MP], cle)) {
					COEFF_LEEK_EFFECT[allie][cle] *= 0.7;
				}
				if (cle == EFFECT_BUFF_STRENGTH && getFightContext() == FIGHT_CONTEXT_TEST) {
					COEFF_LEEK_EFFECT[allie][cle] = function(bulbe, valeur) {
						var bulbeId = bulbe;
						var value = valeur;
						return function() {
							debug("Closure sur l'entité : '" + getName(bulbeId) + "' val = " + value);
							return value * 0.7; // ça doit plus ou moins correspondre à la valeur actuelle
						};
					}(allie, val);


				}
			}

			if (inArray([NAME_METALLIC_BULB, NAME_HEALER_BULB, NAME_PUNY_BULB, NAME_ROCKY_BULB], getName(allie))) {
				// Avec des PT en plus ils ne vont pas faire grand chose de plus
				COEFF_LEEK_EFFECT[allie][EFFECT_BUFF_TP] = 0;
			}

		}
	}
}


function getOpponent(enemies) {
	var dangerousEnemies = [];
	var coeffAllies = [];
	var strength = -1;
	var heal = -1;
	var res = -1;
	var poison = -1;
	var science = -1;
	var agile = -1;
	var coeffDangereux = 0;
	var coeffAllie = 0;
	var degatPoisonPris = 0;
	for (var enemy in enemies)
	{
		strength = getStrength(enemy);
		heal = getWisdom(enemy);
		res = getResistance(enemy);
		poison = getMagic(enemy);
		science = getScience(enemy);
		agile = getAgility(enemy);
		coeffDangereux = // revoir le calcul, difficile de repositionner la tourelle avec un bon coeff
			  science * 5 * getLevel(enemy) / 100
			+ strength * 4 * getLevel(enemy) / 100
			+ heal * 3 * getLevel(enemy) / 100
			+ res * 2 * getLevel(enemy) / 100
			+ poison * 4 * getLevel(enemy) / 100
			+ agile * 2 * getLevel(enemy) / 100;
		for(var effect in getEffects(enemy))
		{
			if(effect[0] == EFFECT_POISON)
			{
				degatPoisonPris += effect[1];
			}
			if(effect[0] == EFFECT_HEAL)
			{
				degatPoisonPris -= effect[1];
			}
		}
		if (getCellDistance(getCell(), getCell(enemy)) < 8)
		{
			coeffDangereux += 10; //*= 3;
		}
		if(degatPoisonPris >= getLife(enemy)) {
			coeffDangereux *= 0.2; // j'évite le 0, si un poireau n'a rien a faire autant le kill avant qu'il reçoive un antidote
		}
		if (isSummon(enemy)) {
			//coeffDangereux *= 0.5;
		}
		if (isStatic(enemy)) {
		     //debugP(getLeekName(enemy) + "is static");
		     if(isStatic(ME)){
		     	coeffDangereux =1;
		     } else {
				coeffDangereux = 0.45; // avec ces stat la tourelle a un coeff bcp trop élevé
				coeffDangereux *= getTotalLife(enemy) / getLife(enemy); // si il n'y a plus beaucoup de vie, on se focus dessus
			}
		}
		dangerousEnemies[enemy] = coeffDangereux;
		coeffDangereux = 0;
	}

debug(dangerousEnemies);
	var score = [];
	getEchantillonCentre(score, dangerousEnemies);

	for (var allie in getAliveAllies())
	{/*
		strength = getStrength(allie);
		heal = getWisdom(allie);
		res = getResistance(allie);
		poison = getMagic(allie);
		science = getScience(allie);
		agile = getAgility(allie);
		coeffAllie = science * 5 * getLevel(allie) / 100 + strength * 4 * getLevel(allie) / 100 + heal * 3 * getLevel(allie) / 100 + res * 2 * getLevel(allie) / 100 + poison * 4 * getLevel(allie) / 100 + agile * 2 * getLevel(allie) / 100;
		if (isSummon(allie))
		{
			coeffAllie *= 0.5;
		}
		coeffAllies[allie] = coeffAllie;
		coeffAllie = 0;
		*/
		score[allie] = (isSummon(allie) || isStatic(allie)) ? 0.5 : 1; // je remet 1, sinon avec la tourelle on risque d'être complétement décalé par rapport aux ennemis
	}
	//TODO: center les résultats sur 1

	for (var leek : var value in score) {
		COEFF_LEEK_EFFECT[leek][EFFECT_DAMAGE] = value;
		COEFF_LEEK_EFFECT[leek][EFFECT_POISON] = value;
		COEFF_LEEK_EFFECT[leek][EFFECT_NOVA_DAMAGE] = value;
		COEFF_LEEK_EFFECT[leek][EFFECT_LIFE_DAMAGE] = value;
	}
	//getEchantillonCentre(SCORE, coeffAllies);
}



function setCoeffSoloSpeResistance() {
	var value;
	if (getFightType() == FIGHT_TYPE_SOLO) {
		var leeks = getAliveEnemies();
		var _MAGIC = false;
		var _SHIELD = false;
		var _LITTLE_SCIENCE = false;
		var _MEDIUM_SCIENCE = false;
		var _BIG_SCIENCE = false;
		var _SAGESSE = false;
		var _FORCE = false;

		for (var leek in leeks) {
			if (!isSummon(leek)) {
				value = 1;
				if (getMagic(leek) >= 300) {
					_MAGIC = true;
				}
				if (getResistance(leek) >= 200) {
					_SHIELD = true;
				}
				if (getScience(leek) >= 200 && getScience(leek) < 300) {
					_LITTLE_SCIENCE = true;
				}
				if (getScience(leek) >= 300 && getScience(leek) < 410) {
					_MEDIUM_SCIENCE = true;
				}
				if (getScience(leek) >= 410) {
					_BIG_SCIENCE = true;
				}
				if (getScience(leek) >= 200) {
					_FORCE = true;
				}

				if (!_FORCE && _MAGIC) {
					COEFF_LEEK_EFFECT[ME][EFFECT_ABSOLUTE_SHIELD] = 0;
					COEFF_LEEK_EFFECT[ME][EFFECT_RELATIVE_SHIELD] = 0;
				}
			}

			if (isSummon(leek)) {
				if (getName(leek) == NAME_METALLIC_BULB) {
					value = 0.5;
					var effects = getLaunchedEffects(leek);
					for(var effect in effects) {
						if (effect[0] == EFFECT_ABSOLUTE_SHIELD || effect[0] == EFFECT_RELATIVE_SHIELD) {
							if (effect[6] == getSummoner(leek)) {
								value += 0.2;
							}
						}
					}
				} else if (getName(leek) == NAME_HEALER_BULB) {
					value = 0.5;
				} else if (getName(leek) == NAME_LIGHTING_BULB) {
					value = 0.5;
					if (!_FORCE && _MAGIC) {
						value = 0.8;
					}
				} else if (getName(leek) == NAME_PUNY_BULB) {
					value = 0.5;
				} else if (getName(leek) == NAME_ROCKY_BULB) {
					value = 0.3;
					if (!_FORCE && _MAGIC) {
						value = 0.6;
					}
				} else if (getName(leek) == NAME_ICED_BULB) {
					value = 0.4;
					if (!_FORCE && _MAGIC) {
						value = 0.7;
					}
				} else if (getName(leek) == NAME_FIRE_BULB) {
					value = 0.4;
					if (!_FORCE && _MAGIC) {
						value = 0.7;
					}
				} else if (getName(leek) == NAME_WIZARD_BULB) {
				    value = 0.6;
				} else {
				    value = 0.2;
				    debugW("Attention Bulbe sans coeff : 0,2 par défaut");
				}
			}

			COEFF_LEEK_EFFECT[leek][EFFECT_DAMAGE] = value;
			COEFF_LEEK_EFFECT[leek][EFFECT_POISON] = value;
			COEFF_LEEK_EFFECT[leek][EFFECT_LIFE_DAMAGE] = value;

		}
	}
	if(getFightType() != FIGHT_TYPE_SOLO) {//TODO
		var leeks = getAliveEnemies();
		for (var leek in leeks) {
			if (!isSummon(leek)) {
				value = 1;
			} else {
				value = 0.3;
			}
			COEFF_LEEK_EFFECT[leek][EFFECT_DAMAGE] = value;
			COEFF_LEEK_EFFECT[leek][EFFECT_POISON] = value;
			COEFF_LEEK_EFFECT[leek][EFFECT_LIFE_DAMAGE] = value;
		}
	}
	/*			alliés   		*/
	var leeks = getAliveAllies();
	for (var leek in leeks) {
		if (!isSummon(leek)) {
			value = 1;
		} else {
			value = 0.5;//Todo
		}
		COEFF_LEEK_EFFECT[leek][EFFECT_DAMAGE] = value;
		COEFF_LEEK_EFFECT[leek][EFFECT_POISON] = value;
		COEFF_LEEK_EFFECT[leek][EFFECT_LIFE_DAMAGE] = value;
	}
}


/**
 * @auteur : Caneton
 * recentre les coefficients "sur 1" en suivant la "loi Normal"
 *
 * il faut au moins 2 elements dans le tableau
 */
function getEchantillonCentre(@resultat, tab) {
	var moy = 0;
	var nb = count(tab);
	var ecartType;

	for (var x in tab) moy += x;
	moy /= nb;

	var somme2 = 0;
	for (var x in tab) somme2 += (x - moy) ** 2;

	if(nb>1) {
		var s2prim = somme2 / (nb - 1);
		ecartType = sqrt(s2prim);
	} else {
		ecartType = 0;
	}
	debugP("ecart-type = " + ecartType);
	for(var cle : var valeur in tab) {
		resultat[cle] = (ecartType==0) ? 1 : ((valeur - moy) / ecartType) + 1;
		if (resultat[cle] <= 0) {
			// on remet le résultat en positif, sinon ça risque de fausser les résultats
			resultat[cle] = 0.1;
		}
	}
}
