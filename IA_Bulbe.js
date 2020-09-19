include("Ordonnanceur");
include("Attaque");
include("Heal");
include("MapDangerV1");  // map de danger v1
include("MapDangerV2");
include("Ciblage");
include("Resistance");
//include("Communication");
//include("Deplacements");
include("Boost");
include("Debug");



function IA_Collective() {
	ME = getLeek();


	var bulb_attack_tools = [] ;
	var bulb_shield_tools = [] ;
	var bulb_heal_tools = [] ;
	var bulb_boost_tools = [] ;
	var bulb_tactics_tools = [] ;
	var bulb_summon_tools = [] ; // cette variable sert juste pour faire marcher la fonction setuptools, un bulbe ne pourra jamais invoquer un autre bulbe... sauf si pilow devient fou x)
	SetupTools( bulb_attack_tools , bulb_shield_tools , bulb_heal_tools , bulb_boost_tools , bulb_tactics_tools , bulb_summon_tools ) ;

	if (getScience() > 0) {
		setBoostCoeff();
	}
	COEFF_LEEK_EFFECT[ME][EFFECT_BUFF_STRENGTH] = 0; // sinon avec after_effect c'est trop juste
	var continu = true;
	while (continu) {

		if(USE_VIE_PREVISIONNEL) {
			setViePrevisionel();
		}

		var actions = [null];
		var cellsAccessible = accessible(getCell(), getMP());
		var toutEnnemis = getAliveEnemies();
		var toutAllies = getAliveAllies();
		if (getStrength() > 0 || getMagic() > 0) {
			getAttackAction(actions, cellsAccessible, toutEnnemis, getTP(), bulb_attack_tools);
		}
		if (getScience() > 0) {
			getBoostAction(actions, cellsAccessible, toutAllies, toutEnnemis, getTP(), bulb_boost_tools);
		}
		if (getResistance() > 0) {
			getResistanceAction(actions, cellsAccessible, toutAllies, getTP(), bulb_shield_tools);
		}
		if(getWisdom() > 0) {
			getHealAction(actions, cellsAccessible, toutAllies, toutEnnemis, getTP(), bulb_heal_tools);
		}
		var combo = getBestCombo(actions, getTP());
		if (combo != []) {
			debugP(combo);
			var action = getActionFromCombo[ORDONNANCEMENT_PERSONNALISE[ORDONANCEMENT_START]](combo);
			var isUseSucess = doAction(action);
			if(!isUseSucess) {
				debugEP('Action non effectué : ' + action );
				ERROR_TOOLS[action[CHIP_WEAPON]] = true;
			}
		} else {
			continu = false;
		}
	}

	if(getCellDistance(getCell(), getCell(getSummoner())) >= 7 && (getCellDistance(getCell(), getCell(getSummoner())) < getCellDistance(getCell(), getCell(getNearestEnemy())) || getCellDistance(getCell(), getCell(getNearestEnemy())) < 12)){
		moveToward(getSummoner());
	} else {
		var accessibles_cells = getReachableCells(getCell(), getMP());		// Cellules accessibles, array non associatif.
		var cellule = getCell(getSummoner());		// La cell don on doit étre le plus proche
		var map_danger = getDangerMap(accessibles_cells);		// Map de danger v1 ( la v2 consomme trop d'op, pour juste un bulbe )
		moveTowardCell(getNearestCellToGoFromCell(cellule, map_danger));	// Fonction dans l'ia "Deplacements"
	}

	parler();
}
